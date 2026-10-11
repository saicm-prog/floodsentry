import { createServer } from 'node:http'
import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import { SimulatorError, simulateWeatherReport } from './weather-alerts.mjs'

const port = 8787
const databasePath = resolve('data/flood-sentry.sqlite')
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = process.env.RESEND_FROM_EMAIL
const scrypt = promisify(scryptCallback)
mkdirSync(dirname(databasePath), { recursive: true })
const db = new DatabaseSync(databasePath)
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    zip_code TEXT NOT NULL,
    consented_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zip_code TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    consented_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)) }
// Keep progress messages small and immediately flushable so a browser can update
// while an OpenAI request or email handoff is still in flight.
const streamEvent = (response, body) => response.write(`data: ${JSON.stringify(body)}\n\n`)
const readBody = async request => {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > 100000) throw new SimulatorError('Request is too large.', 413)
  }
  try {
    const value = JSON.parse(body || '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    return value
  } catch { throw new SimulatorError('Request body must be a JSON object.', 400) }
}
const escapeHtml = value => String(value).replace(/[&<>'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[character]))
const safeResendDetail = value => String(value || 'Resend did not provide an error message.').replace(/[\r\n]+/g, ' ').trim().slice(0, 500)
const emailParagraphs = value => escapeHtml(value).split(/\n{2,}/).filter(Boolean).map(paragraph => `<p style="margin:0 0 16px;color:#29465c;font-size:16px;line-height:1.65;">${paragraph.replace(/\n/g, '<br>')}</p>`).join('')
const emailDetail = (label, value) => `<tr><td style="padding:14px 0;border-bottom:1px solid #d7e8ef;"><span style="display:block;margin-bottom:4px;color:#5b7384;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;">${escapeHtml(label)}</span><span style="color:#102b46;font-size:15px;line-height:1.45;">${escapeHtml(value || 'Not specified')}</span></td></tr>`
const floodSentryEmail = ({ triggerType, message, analysis }) => {
  const areas = Array.isArray(analysis?.areas) && analysis.areas.length ? analysis.areas.join(' · ') : 'Affected area details are included below.'
  const summary = message.replace(/^Internal training scenario[^\n]*\n\n/, '')
  return `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#eaf5f9;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Internal training scenario: ${escapeHtml(triggerType)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eaf5f9;"><tr><td align="center" style="padding:30px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(16,43,70,.14);"><tr><td style="padding:28px 34px;background:#102b46;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="width:34px;height:34px;border-radius:50%;background:#5cc9ed;text-align:center;color:#102b46;font-size:23px;line-height:34px;">✳</td><td style="padding-left:11px;color:#ffffff;font-size:23px;font-weight:700;letter-spacing:-.5px;">Flood <span style="color:#5cc9ed;">Sentry</span></td></tr></table></td></tr><tr><td style="padding:30px 34px 12px;"><div style="margin-bottom:22px;padding:12px 14px;background:#e2f6fc;border-left:4px solid #5cc9ed;color:#18465f;font-size:13px;line-height:1.5;"><strong>Internal training scenario:</strong> This is not an official emergency alert. For live weather information, follow the National Weather Service and local officials.</div><div style="display:inline-block;margin-bottom:11px;padding:6px 9px;border-radius:999px;background:#102b46;color:#bcefff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Flood Sentry alert</div><h1 style="margin:0 0 10px;color:#102b46;font-size:32px;line-height:1.12;letter-spacing:-1px;">${escapeHtml(triggerType)}</h1><p style="margin:0 0 27px;color:#496477;font-size:17px;line-height:1.55;"><strong style="color:#102b46;">Affected areas:</strong> ${escapeHtml(areas)}</p><h2 style="margin:0 0 14px;color:#102b46;font-size:20px;line-height:1.25;">What you need to know</h2>${emailParagraphs(summary)}</td></tr><tr><td style="padding:10px 34px 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d7e8ef;">${emailDetail('Report issued', analysis?.issuedAt)}${emailDetail('Report expires', analysis?.expiresAt)}${emailDetail('ZIP-code coverage', analysis?.coverageNotes)}</table></td></tr><tr><td style="padding:21px 34px;background:#102b46;color:#c9e8f2;font-size:12px;line-height:1.55;">Flood Sentry helps make weather information easier to understand. This internal training scenario does not replace official emergency instructions.</td></tr></table></td></tr></table></body></html>`
}
const providedBulletinEmail = ({ triggerType, message, analysis }) => {
  const areas = Array.isArray(analysis?.areas) && analysis.areas.length ? analysis.areas.join(' · ') : 'Affected area details are included below.'
  return `<!doctype html>
<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#eaf5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Flood Sentry alert: ${escapeHtml(triggerType)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eaf5f9;"><tr><td align="center" style="padding:30px 14px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(16,43,70,.14);">
      <tr><td style="padding:28px 34px;background:#102b46;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="width:34px;height:34px;border-radius:50%;background:#5cc9ed;text-align:center;color:#102b46;font-size:23px;line-height:34px;">✳</td><td style="padding-left:11px;color:#ffffff;font-size:23px;font-weight:700;letter-spacing:-.5px;">Flood <span style="color:#5cc9ed;">Sentry</span></td></tr></table></td></tr>
      <tr><td style="padding:30px 34px 12px;"><div style="margin-bottom:22px;padding:12px 14px;background:#e2f6fc;border-left:4px solid #5cc9ed;color:#18465f;font-size:13px;line-height:1.5;">This summary was prepared from a weather bulletin provided to Flood Sentry. Follow local emergency managers and the National Weather Service for official updates.</div><div style="display:inline-block;margin-bottom:11px;padding:6px 9px;border-radius:999px;background:#102b46;color:#bcefff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Flood Sentry alert</div><h1 style="margin:0 0 10px;color:#102b46;font-size:32px;line-height:1.12;letter-spacing:-1px;">${escapeHtml(triggerType)}</h1><p style="margin:0 0 27px;color:#496477;font-size:17px;line-height:1.55;"><strong style="color:#102b46;">Affected areas:</strong> ${escapeHtml(areas)}</p><h2 style="margin:0 0 14px;color:#102b46;font-size:20px;line-height:1.25;">What you need to know</h2>${emailParagraphs(message)}</td></tr>
      <tr><td style="padding:10px 34px 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d7e8ef;">${emailDetail('Report issued', analysis?.issuedAt)}${emailDetail('Report expires', analysis?.expiresAt)}${emailDetail('ZIP-code coverage', analysis?.coverageNotes)}</table></td></tr>
      <tr><td style="padding:21px 34px;background:#102b46;color:#c9e8f2;font-size:12px;line-height:1.55;">Flood Sentry helps make weather information easier to understand. This summary is based on a bulletin provided to Flood Sentry and does not replace official emergency instructions.</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}
const hashPassword = async password => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`
}

async function sendResendAlert({ recipients, zipCode, triggerType, message, subject, analysis }) {
  if (!resendApiKey || !resendFromEmail) return { status: 'not_configured', sent: 0, failed: 0, details: ['Resend is not configured. Add both RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the API.'] }
  const html = providedBulletinEmail({ triggerType, message, analysis })
  const results = await Promise.all(recipients.map(async recipient => {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({ from: resendFromEmail, to: [recipient], subject, text: message, html }),
        signal: AbortSignal.timeout(30000),
      })
      if (resendResponse.ok) return { sent: true }
      const body = await resendResponse.json().catch(() => null)
      const reason = body?.message || body?.error || body?.name || 'Resend rejected the request.'
      return { sent: false, detail: `Resend returned HTTP ${resendResponse.status}: ${safeResendDetail(reason)}` }
    } catch (error) {
      const reason = error?.name === 'TimeoutError' || error?.name === 'AbortError'
        ? 'Resend did not respond within 30 seconds.'
        : 'Could not reach Resend. Check your internet connection and try again.'
      return { sent: false, detail: reason }
    }
  }))
  const sent = results.filter(result => result.sent).length
  const details = [...new Set(results.filter(result => !result.sent).map(result => result.detail))]
  return { status: sent === recipients.length ? 'sent' : 'partial_failure', sent, failed: recipients.length - sent, details }
}

const server = createServer(async (request, response) => {
  let isEventStream = false
  let progressHeartbeat
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); return response.end() }
  try {
    if (request.method === 'POST' && request.url === '/api/subscriptions') {
      const { email, zipCode, consent } = await readBody(request)
      if (!consent || !/^\d{5}$/.test(zipCode || '') || !/^\S+@\S+\.\S+$/.test(email || '')) return json(response, 400, { error: 'Enter a valid email, five-digit ZIP code, and accept the terms.' })
      const now = new Date().toISOString()
      db.prepare('INSERT INTO subscriptions (email, zip_code, consented_at, created_at) VALUES (?, ?, ?, ?)').run(email.trim().toLowerCase(), zipCode, now, now)
      return json(response, 201, { message: 'You are subscribed for local flood alerts.' })
    }
    if (request.method === 'GET' && request.url === '/api/subscriptions') return json(response, 200, { subscriptions: db.prepare('SELECT id, email, zip_code, consented_at, created_at FROM subscriptions ORDER BY id DESC').all() })
    if (request.method === 'POST' && request.url === '/api/accounts') {
      const { name, email, password, consent } = await readBody(request)
      const fullName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
      if (!consent || fullName.length < 2 || fullName.length > 100 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || typeof password !== 'string' || password.length < 12) return json(response, 400, { error: 'Enter your full name, a valid email, a password of at least 12 characters, and accept the terms.' })
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(password)
      db.prepare('INSERT INTO accounts (full_name, email, password_hash, consented_at, created_at) VALUES (?, ?, ?, ?, ?)').run(fullName, normalizedEmail, passwordHash, now, now)
      return json(response, 201, { message: 'Your local Flood Sentry account is ready.' })
    }
    if (request.method === 'POST' && (request.url === '/api/weather-bulletins' || request.url === '/api/test-alert')) {
      const { weatherReport } = await readBody(request)
      response.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
      })
      isEventStream = true
      response.flushHeaders()
      response.socket?.setNoDelay(true)
      let currentStage = { id: 'starting', label: 'Preparing the weather report' }
      const publishStage = stage => {
        currentStage = stage
        streamEvent(response, { type: 'stage', stage })
      }
      // Slow searches and delivery requests can take tens of seconds. Heartbeats
      // keep the connection visibly alive without pretending a step is complete.
      streamEvent(response, { type: 'connected', stage: currentStage })
      progressHeartbeat = setInterval(() => streamEvent(response, { type: 'heartbeat', stage: currentStage }), 2500)
      const result = await simulateWeatherReport(weatherReport, { db, sendAlert: sendResendAlert, onStage: publishStage })
      clearInterval(progressHeartbeat)
      streamEvent(response, { type: 'complete', result })
      return response.end()
    }
    if (request.method === 'GET' && request.url === '/api/notifications') return json(response, 200, { notifications: db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 20').all() })
    return json(response, 404, { error: 'Not found' })
  } catch (error) {
    clearInterval(progressHeartbeat)
    const message = error instanceof SimulatorError ? error.message : error.code === 'SQLITE_CONSTRAINT_UNIQUE' ? 'That email is already subscribed for local alerts.' : 'Local server error.'
    if (isEventStream) { streamEvent(response, { type: 'error', error: message }); return response.end() }
    if (error instanceof SimulatorError) return json(response, error.status, { error: message })
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return json(response, 409, { error: request.url === '/api/accounts' ? 'An account already uses that email address.' : 'That email is already subscribed for local alerts.' })
    console.error(error); return json(response, 500, { error: 'Local server error.' })
  }
})

server.listen(port, '127.0.0.1', () => console.log(`Flood Sentry local API: http://127.0.0.1:${port}`))
