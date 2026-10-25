import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { validateEmail } from '../src/emailValidation.ts'
import { registerSubscription } from './registrations.mjs'
import { emailLogo, emailLogoAttachments } from './email-templates.mjs'

const lifetimeMs = 10 * 60 * 1000
const cooldownMs = 60 * 1000
const sendWindowMs = 60 * 60 * 1000
const maxSends = 5
const maxAttempts = 5
const hashCode = (id, code) => createHash('sha256').update(`${id}:${code}`).digest('hex')
const failure = (status, error, extra = {}) => ({ status, body: { error, ...extra } })

export class VerificationError extends Error {
  constructor(message, status = 502) { super(message); this.status = status }
}

export function ensureSubscriptionVerification(db) {
  if (!db.prepare('PRAGMA table_info(subscriptions)').all().some(column => column.name === 'verified_at')) {
    db.exec('ALTER TABLE subscriptions ADD COLUMN verified_at TEXT')
  }
  db.exec(`CREATE TABLE IF NOT EXISTS subscription_verifications (
    email TEXT PRIMARY KEY,
    id TEXT NOT NULL UNIQUE,
    zip_code TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    consented_at TEXT NOT NULL,
    sent_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    send_count INTEGER NOT NULL,
    send_window_started INTEGER NOT NULL,
    ready INTEGER NOT NULL DEFAULT 0
  )`)
}

// A pending request is not a registration. Only possession of its emailed code
// lets confirmSubscription create a row in the active subscriptions table.
export async function requestSubscription(db, input, sendCode, { now = Date.now(), generateCode = () => String(randomInt(0, 1000000)).padStart(6, '0') } = {}) {
  const email = validateEmail(input?.email)
  if (!email.valid) return failure(400, email.error)
  const zipCode = typeof input?.zipCode === 'string' ? input.zipCode.trim() : ''
  if (!/^\d{5}$/.test(zipCode) || input?.consent !== true) return failure(400, 'Enter a five-digit ZIP code and accept the terms.')
  if (db.prepare('SELECT id FROM subscriptions WHERE email = ?').get(email.normalized)) {
    return failure(409, 'That email is already subscribed for local alerts.')
  }
  // Keep expired challenges briefly so expiration does not reset send limits.
  db.prepare('DELETE FROM subscription_verifications WHERE sent_at < ?').run(now - 24 * sendWindowMs)
  const previous = db.prepare('SELECT * FROM subscription_verifications WHERE email = ?').get(email.normalized)
  if (previous && now < previous.sent_at + cooldownMs) {
    return failure(429, 'Wait a moment before requesting another code.', { retryAfter: Math.ceil((previous.sent_at + cooldownMs - now) / 1000) })
  }
  const sameWindow = previous && now < previous.send_window_started + sendWindowMs
  if (sameWindow && previous.send_count >= maxSends) {
    return failure(429, 'Too many code requests. Please try again later.', { retryAfter: Math.ceil((previous.send_window_started + sendWindowMs - now) / 1000) })
  }
  const id = randomBytes(24).toString('hex')
  const code = generateCode()
  const consentedAt = new Date(now).toISOString()
  db.prepare(`INSERT INTO subscription_verifications
    (email, id, zip_code, code_hash, consented_at, sent_at, expires_at, attempts, send_count, send_window_started, ready)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
    ON CONFLICT(email) DO UPDATE SET id=excluded.id, zip_code=excluded.zip_code, code_hash=excluded.code_hash,
    consented_at=excluded.consented_at, sent_at=excluded.sent_at, expires_at=excluded.expires_at,
    attempts=0, send_count=excluded.send_count, send_window_started=excluded.send_window_started, ready=0`)
    .run(email.normalized, id, zipCode, hashCode(id, code), consentedAt, now, now + lifetimeMs,
      sameWindow ? previous.send_count + 1 : 1, sameWindow ? previous.send_window_started : now)
  try {
    await sendCode({ email: email.normalized, zipCode, code, requestId: id })
  } catch (error) {
    // A delivery failure cannot leave a code eligible to activate an address.
    db.prepare('UPDATE subscription_verifications SET code_hash = ?, expires_at = ?, ready = 0 WHERE id = ?').run('', now, id)
    if (error instanceof VerificationError) return failure(error.status, error.message)
    return failure(502, 'We could not send your confirmation email. Please try again shortly.')
  }
  const result = db.prepare('UPDATE subscription_verifications SET ready = 1 WHERE id = ?').run(id)
  if (!result.changes) return failure(409, 'A newer code was requested. Use the most recent email.')
  return { status: 202, body: {
    verificationId: id, email: email.normalized, zipCode,
    expiresAt: new Date(now + lifetimeMs).toISOString(), retryAfter: cooldownMs / 1000,
    message: 'Check your inbox. Enter the six-digit code to finish registration.',
  } }
}

export function confirmSubscription(db, input, { now = Date.now() } = {}) {
  const id = typeof input?.verificationId === 'string' ? input.verificationId : ''
  const code = typeof input?.code === 'string' ? input.code.trim() : ''
  if (!/^[a-f0-9]{48}$/.test(id) || !/^\d{6}$/.test(code)) return failure(400, 'Enter the six-digit code from your email.')
  const pending = db.prepare('SELECT * FROM subscription_verifications WHERE id = ?').get(id)
  if (!pending) return failure(400, 'This code request is no longer active. Request a new code.')
  if (!pending.ready) return failure(400, 'No confirmation email is ready. Request a new code.')
  if (now >= pending.expires_at) return failure(410, 'Your code expired. Request a new code.')
  if (pending.attempts >= maxAttempts) return failure(429, 'Too many incorrect codes. Request a new code.')
  const expected = Buffer.from(pending.code_hash, 'hex')
  const received = Buffer.from(hashCode(id, code), 'hex')
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    db.prepare('UPDATE subscription_verifications SET attempts = attempts + 1 WHERE id = ?').run(id)
    return failure(400, pending.attempts + 1 >= maxAttempts
      ? 'Too many incorrect codes. Request a new code.' : 'That code does not match. Check the email and try again.')
  }
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = registerSubscription(db, { email: pending.email, zipCode: pending.zip_code, consent: true, consentedAt: pending.consented_at }, new Date(now).toISOString())
    if (result.status === 201 || result.status === 409) db.prepare('DELETE FROM subscription_verifications WHERE id = ?').run(id)
    db.exec('COMMIT')
    return result.status === 201 ? { status: 201, body: {
      message: 'Your email is confirmed. You are registered for local flood alerts.', email: pending.email, zipCode: pending.zip_code,
    } } : result
  } catch (error) { db.exec('ROLLBACK'); throw error }
}

export function buildConfirmationEmail({ code, zipCode }) {
  return {
    text: `Confirm your FloodSentry email\n\nYour confirmation code is ${code}.\nEnter it on the registration page to receive updates for ZIP code ${zipCode}.\nThis code expires in 10 minutes.\nIf you did not request this code, you can ignore this email.`,
    html: `<!doctype html><html lang="en"><body style="margin:0;background:#f3f8fb;font-family:Arial,Helvetica,sans-serif;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;"><tr><td style="padding:24px 30px;background:#102b46;">${emailLogo()}</td></tr><tr><td style="padding:30px;color:#18384d;"><h1 style="font-size:25px;margin:0 0 18px;">Confirm your email</h1><p style="line-height:1.6;">Enter this code on the registration page to get updates for ZIP code ${zipCode}.</p><p style="padding:20px;background:#e8f6fc;color:#102b46;font-size:32px;letter-spacing:8px;font-weight:700;text-align:center;border-radius:8px;">${code}</p><p style="color:#526778;font-size:14px;line-height:1.6;">The code expires in 10 minutes.</p><p style="color:#526778;font-size:12px;line-height:1.6;">If you did not request this code, you can ignore this email.</p></td></tr></table></td></tr></table></body></html>`,
    attachments: emailLogoAttachments(),
  }
}

export async function sendConfirmationEmail({ email, code, zipCode, requestId }, { apiKey, fromEmail, fetchImpl = fetch } = {}) {
  if (!apiKey || !fromEmail) throw new VerificationError('Email confirmation is unavailable. Please try again later.', 503)
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, 'Idempotency-Key': `verification-${requestId}` },
      body: JSON.stringify({ from: fromEmail, to: [email], subject: 'Confirm your FloodSentry email', ...buildConfirmationEmail({ code, zipCode }) }),
      signal: AbortSignal.timeout(20000),
    })
    if (!response.ok) throw new VerificationError('We could not send your confirmation email. Check the address and try again shortly.')
  } catch (error) {
    if (error instanceof VerificationError) throw error
    throw new VerificationError('We could not reach the email service. Please try again shortly.')
  }
}
