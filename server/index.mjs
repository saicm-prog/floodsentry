import { createServer } from 'node:http'
import { randomBytes, scrypt as scryptCallback } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { promisify } from 'node:util'
import { SimulatorError, simulateWeatherReport } from './weather-alerts.mjs'
import { ensureCountyZipCrosswalk } from './county-zip-crosswalk.mjs'
import { trainedModelStatus } from './trained-model.mjs'
import { buildAlertEmailContent } from './email-templates.mjs'
import { isUniqueConstraintError, removeRegistration } from './registrations.mjs'
import { confirmSubscription, ensureSubscriptionVerification, requestSubscription, sendConfirmationEmail } from './subscription-verification.mjs'
import { validateEmail } from '../src/emailValidation.ts'
import { normalizeBrandName } from '../src/branding.ts'
import { migrateNotificationBranding } from './branding.mjs'

const port = 8787
const databasePath = resolve('data/flood-sentry.sqlite')
const crosswalkPath = resolve('data/tab20_zcta520_county20_natl.txt')
const resendApiKey = process.env.RESEND_API_KEY
const resendFromEmail = normalizeBrandName(process.env.RESEND_FROM_EMAIL || '')
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
  CREATE TABLE IF NOT EXISTS bulletin_errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)
ensureSubscriptionVerification(db)
const rebrandedReports = migrateNotificationBranding(db)
if (rebrandedReports) console.log(`Updated FloodSentry branding in ${rebrandedReports} saved report records.`)
const crosswalk = ensureCountyZipCrosswalk(db, crosswalkPath)
console.log(`Local county-to-ZIP crosswalk ready (${crosswalk.rows.toLocaleString()} relationships${crosswalk.imported ? ', imported now' : ''}).`)
console.log(`Trained model integration: ${trainedModelStatus().enabled ? 'enabled' : 'disabled'} (${trainedModelStatus().modelPath}).`)

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
const safeResendDetail = value => String(value || 'Resend did not provide an error message.').replace(/[\r\n]+/g, ' ').trim().slice(0, 500)
const recordBulletinError = (stage, message) => {
  try {
    db.prepare('INSERT INTO bulletin_errors (stage, message, created_at) VALUES (?, ?, ?)').run(String(stage || 'Unknown stage').slice(0, 160), safeResendDetail(message), new Date().toISOString())
  } catch (error) { console.error('Could not save bulletin error', error) }
}
const hashPassword = async password => {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, 64)
  return `scrypt$${salt}$${Buffer.from(derivedKey).toString('hex')}`
}

async function sendResendAlert({ recipients, zipCode, triggerType, message, subject, analysis }) {
  if (!resendApiKey || !resendFromEmail) return { status: 'not_configured', sent: 0, failed: 0, details: ['Resend is not configured. Add both RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the API.'] }
  const emailContent = buildAlertEmailContent({ triggerType, message, analysis })
  const results = await Promise.all(recipients.map(async recipient => {
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({ from: resendFromEmail, to: [recipient], subject, ...emailContent }),
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
  let errorStage = 'Request setup'
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS' }); return response.end() }
  try {
    if (request.method === 'POST' && request.url === '/api/subscriptions') {
      const result = await requestSubscription(db, await readBody(request), details => sendConfirmationEmail(details, { apiKey: resendApiKey, fromEmail: resendFromEmail }))
      return json(response, result.status, result.body)
    }
    if (request.method === 'POST' && request.url === '/api/subscriptions/confirm') {
      const result = confirmSubscription(db, await readBody(request))
      return json(response, result.status, result.body)
    }
    if (request.method === 'GET' && request.url === '/api/subscriptions') return json(response, 200, { subscriptions: db.prepare('SELECT id, email, zip_code, consented_at, created_at, verified_at FROM subscriptions ORDER BY id DESC').all() })
    if (request.method === 'DELETE' && request.url === '/api/subscriptions') {
      const result = removeRegistration(db, await readBody(request))
      return json(response, result.status, result.body)
    }
    if (request.method === 'POST' && request.url === '/api/accounts') {
      const { name, email, password, consent } = await readBody(request)
      const fullName = typeof name === 'string' ? name.trim().replace(/\s+/g, ' ') : ''
      const checkedEmail = validateEmail(email)
      if (!checkedEmail.valid) return json(response, 400, { error: checkedEmail.error })
      if (consent !== true || fullName.length < 2 || fullName.length > 100 || typeof password !== 'string' || password.length < 12) return json(response, 400, { error: 'Enter your full name, a valid email, a password of at least 12 characters, and accept the terms.' })
      const now = new Date().toISOString()
      const passwordHash = await hashPassword(password)
      db.prepare('INSERT INTO accounts (full_name, email, password_hash, consented_at, created_at) VALUES (?, ?, ?, ?, ?)').run(fullName, checkedEmail.normalized, passwordHash, now, now)
      return json(response, 201, { message: 'Your local FloodSentry account is ready.' })
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
        errorStage = stage.label
        streamEvent(response, { type: 'stage', stage })
      }
      // Slow searches and delivery requests can take tens of seconds. Heartbeats
      // keep the connection visibly alive without pretending a step is complete.
      streamEvent(response, { type: 'connected', stage: currentStage })
      progressHeartbeat = setInterval(() => streamEvent(response, { type: 'heartbeat', stage: currentStage }), 2500)
      const result = await simulateWeatherReport(weatherReport, { db, sendAlert: sendResendAlert, onStage: publishStage })
      clearInterval(progressHeartbeat)
      if (result.email.status !== 'sent') recordBulletinError('Email delivery', result.email.details?.join(' ') || `Email delivery ended with status: ${result.email.status}.`)
      streamEvent(response, { type: 'complete', result })
      return response.end()
    }
    if (request.method === 'GET' && request.url === '/api/notifications') return json(response, 200, { notifications: db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 20').all() })
    if (request.method === 'GET' && request.url === '/api/errors') return json(response, 200, { errors: db.prepare('SELECT * FROM bulletin_errors ORDER BY id DESC LIMIT 50').all() })
    return json(response, 404, { error: 'Not found' })
  } catch (error) {
    clearInterval(progressHeartbeat)
    const message = error instanceof SimulatorError ? error.message : isUniqueConstraintError(error) ? 'That email is already subscribed for local alerts.' : 'Local server error.'
    if (request.method === 'POST' && (request.url === '/api/weather-bulletins' || request.url === '/api/test-alert')) recordBulletinError(errorStage, message)
    if (isEventStream) { streamEvent(response, { type: 'error', error: message }); return response.end() }
    if (error instanceof SimulatorError) return json(response, error.status, { error: message })
    if (isUniqueConstraintError(error)) return json(response, 409, { error: request.url === '/api/accounts' ? 'An account already uses that email address.' : 'That email is already subscribed for local alerts.' })
    console.error(error); return json(response, 500, { error: 'Local server error.' })
  }
})

server.listen(port, '127.0.0.1', () => console.log(`FloodSentry local API: http://127.0.0.1:${port}`))
