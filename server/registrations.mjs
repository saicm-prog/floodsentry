import { validateEmail } from '../src/emailValidation.ts'

export function isUniqueConstraintError(error) {
  // node:sqlite exposes SQLite's extended result code for unique constraints.
  return error?.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
    (error?.code === 'ERR_SQLITE_ERROR' && error.errcode === 2067)
}

export function registerSubscription(db, input, verifiedAt) {
  const email = validateEmail(input?.email)
  if (!email.valid) return { status: 400, body: { error: email.error } }
  const zipCode = typeof input?.zipCode === 'string' ? input.zipCode.trim() : ''
  if (!/^\d{5}$/.test(zipCode) || input?.consent !== true) {
    return { status: 400, body: { error: 'Enter a five-digit ZIP code and accept the terms.' } }
  }
  const now = new Date().toISOString()
  try {
    if (verifiedAt) {
      db.prepare('INSERT INTO subscriptions (email, zip_code, consented_at, created_at, verified_at) VALUES (?, ?, ?, ?, ?)')
        .run(email.normalized, zipCode, input.consentedAt || now, now, verifiedAt)
    } else {
      db.prepare('INSERT INTO subscriptions (email, zip_code, consented_at, created_at) VALUES (?, ?, ?, ?)')
        .run(email.normalized, zipCode, now, now)
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: 409, body: { error: 'That email is already subscribed for local alerts.' } }
    }
    throw error
  }
  return { status: 201, body: { message: 'You are subscribed for local flood alerts.' } }
}

// Local prototype only: email + ZIP matching is not proof of email ownership.
// Use verified, signed unsubscribe links before exposing this flow publicly.
export function removeRegistration(db, input) {
  const email = validateEmail(input?.email)
  if (!email.valid) return { status: 400, body: { error: email.error } }
  const zipCode = typeof input?.zipCode === 'string' ? input.zipCode.trim() : ''
  if (!/^\d{5}$/.test(zipCode)) {
    return { status: 400, body: { error: 'Enter your registration email and five-digit ZIP code.' } }
  }
  if (input.confirmRemoval !== true) {
    return { status: 400, body: { error: 'Confirm that you want to remove this registration.' } }
  }
  const result = db.prepare('DELETE FROM subscriptions WHERE email = ? AND zip_code = ?').run(email.normalized, zipCode)
  if (result.changes === 0) {
    return { status: 404, body: { error: 'No registration matches this email and ZIP code. Check both and try again.' } }
  }
  return { status: 200, body: { message: 'Your registration was removed. You can register again at any time.' } }
}
