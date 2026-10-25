import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { confirmSubscription, ensureSubscriptionVerification, requestSubscription, sendConfirmationEmail, VerificationError } from './subscription-verification.mjs'

const start = Date.parse('2026-10-14T12:00:00Z')
const input = { email: ' Person+Alerts@Example.com ', zipCode: '01234', consent: true }
const options = { now: start, generateCode: () => '012345' }
function fixture(t) {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  db.exec(`CREATE TABLE subscriptions (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE,
    zip_code TEXT NOT NULL, consented_at TEXT NOT NULL, created_at TEXT NOT NULL);
    INSERT INTO subscriptions VALUES (1, 'existing@example.com', '78732', '2026-01-01', '2026-01-01');`)
  ensureSubscriptionVerification(db)
  return db
}
const activeCount = db => db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count

test('migration preserves legacy registrations without claiming their emails are confirmed', t => {
  const db = fixture(t)
  ensureSubscriptionVerification(db)
  const row = db.prepare('SELECT * FROM subscriptions WHERE id = 1').get()
  assert.equal(row.email, 'existing@example.com')
  assert.equal(row.verified_at, null)
  assert.equal(activeCount(db), 1)
})

test('mail acceptance creates only a pending request with a hash, never an active subscription', async t => {
  const db = fixture(t)
  let delivered
  const result = await requestSubscription(db, { ...input, verified: true, verifiedAt: 'forged', code: '012345' }, async details => { delivered = details }, options)
  assert.equal(result.status, 202)
  assert.equal(activeCount(db), 1)
  assert.equal(delivered.email, 'person+alerts@example.com')
  assert.equal(delivered.code, '012345')
  assert.equal(delivered.zipCode, '01234')
  assert.equal(result.body.code, undefined)
  const pending = db.prepare('SELECT * FROM subscription_verifications').get()
  assert.match(pending.code_hash, /^[a-f0-9]{64}$/)
  assert.notEqual(pending.code_hash, delivered.code)
  assert.equal(pending.ready, 1)
  assert.equal(pending.expires_at, start + 600000)
})

test('a correct emailed code saves the pending email, ZIP, consent and confirmation once', async t => {
  const db = fixture(t)
  const request = await requestSubscription(db, input, async () => {}, options)
  const confirmInput = { verificationId: request.body.verificationId, code: '012345', email: 'forged@example.com', zipCode: '99999' }
  const result = confirmSubscription(db, confirmInput, { now: start + 30000 })
  assert.equal(result.status, 201)
  assert.equal(result.body.email, 'person+alerts@example.com')
  const row = db.prepare('SELECT * FROM subscriptions WHERE email = ?').get('person+alerts@example.com')
  assert.equal(row.zip_code, '01234')
  assert.equal(row.consented_at, new Date(start).toISOString())
  assert.equal(row.verified_at, new Date(start + 30000).toISOString())
  assert.equal(activeCount(db), 2)
  assert.equal(confirmSubscription(db, confirmInput).status, 400)
  assert.equal(activeCount(db), 2)
})

test('invalid email, invalid ZIP, missing consent and duplicate registrations send no email', async t => {
  const db = fixture(t)
  let sends = 0
  for (const value of [{ ...input, email: 'a@@example.com' }, { ...input, email: 'a@-example.com' },
    { ...input, zipCode: 12345 }, { ...input, consent: false }, { ...input, consent: 'true' },
    { ...input, email: 'existing@example.com' }]) {
    const result = await requestSubscription(db, value, async () => { sends++ }, options)
    assert.ok([400, 409].includes(result.status))
  }
  assert.equal(sends, 0)
  assert.equal(activeCount(db), 1)
})

test('provider rejection and unavailable configuration cannot create confirmable requests', async t => {
  const db = fixture(t)
  const result = await requestSubscription(db, input, async () => { throw new VerificationError('Email unavailable', 503) }, options)
  assert.equal(result.status, 503)
  const pending = db.prepare('SELECT * FROM subscription_verifications').get()
  assert.equal(pending.ready, 0)
  assert.equal(pending.code_hash, '')
  assert.equal(confirmSubscription(db, { verificationId: pending.id, code: '012345' }, { now: start }).status, 400)
  assert.equal(activeCount(db), 1)
})

test('a request still sending cannot be confirmed', async t => {
  const db = fixture(t)
  let release
  const sending = requestSubscription(db, input, () => new Promise(resolve => { release = resolve }), options)
  const pending = db.prepare('SELECT * FROM subscription_verifications').get()
  assert.equal(confirmSubscription(db, { verificationId: pending.id, code: '012345' }, { now: start }).status, 400)
  assert.equal(activeCount(db), 1)
  release()
  assert.equal((await sending).status, 202)
})

test('incorrect codes and the attempt limit never activate an email', async t => {
  const db = fixture(t)
  const request = await requestSubscription(db, input, async () => {}, options)
  for (let attempt = 0; attempt < 5; attempt++) {
    assert.equal(confirmSubscription(db, { verificationId: request.body.verificationId, code: '999999' }, { now: start }).status, 400)
  }
  assert.equal(confirmSubscription(db, { verificationId: request.body.verificationId, code: '012345' }, { now: start }).status, 429)
  assert.equal(activeCount(db), 1)
})

test('expired, unknown, and malformed challenges never activate an email', async t => {
  const db = fixture(t)
  const request = await requestSubscription(db, input, async () => {}, options)
  assert.equal(confirmSubscription(db, { verificationId: request.body.verificationId, code: '012345' }, { now: start + 600000 }).status, 410)
  for (const value of [null, {}, { verificationId: 'x', code: '012345' },
    { verificationId: request.body.verificationId, code: 12345 }, { verificationId: 'a'.repeat(48), code: '012345' }]) {
    assert.equal(confirmSubscription(db, value).status, 400)
  }
  assert.equal(activeCount(db), 1)
})

test('resending enforces cooldown and replaces the old code and request', async t => {
  const db = fixture(t)
  const first = await requestSubscription(db, input, async () => {}, options)
  const limited = await requestSubscription(db, input, async () => assert.fail('No second email during cooldown'), options)
  assert.equal(limited.status, 429)
  assert.equal(limited.body.retryAfter, 60)
  const second = await requestSubscription(db, input, async () => {}, { now: start + 60000, generateCode: () => '678901' })
  assert.equal(second.status, 202)
  assert.notEqual(second.body.verificationId, first.body.verificationId)
  assert.equal(confirmSubscription(db, { verificationId: first.body.verificationId, code: '012345' }, { now: start + 60000 }).status, 400)
  assert.equal(confirmSubscription(db, { verificationId: second.body.verificationId, code: '012345' }, { now: start + 60000 }).status, 400)
  assert.equal(confirmSubscription(db, { verificationId: second.body.verificationId, code: '678901' }, { now: start + 60000 }).status, 201)
})

test('hourly send limits survive code expiration and reset after the window', async t => {
  const db = fixture(t)
  for (let i = 0; i < 5; i++) assert.equal((await requestSubscription(db, input, async () => {}, { ...options, now: start + i * 600000 })).status, 202)
  const limited = await requestSubscription(db, input, async () => assert.fail('No sixth email'), { ...options, now: start + 3000000 })
  assert.equal(limited.status, 429)
  assert.equal((await requestSubscription(db, input, async () => {}, { ...options, now: start + 3600000 })).status, 202)
})

test('a storage failure rolls back confirmation without consuming the pending request', async t => {
  const db = fixture(t)
  const request = await requestSubscription(db, input, async () => {}, options)
  db.exec("CREATE TRIGGER reject_insert BEFORE INSERT ON subscriptions BEGIN SELECT RAISE(ABORT, 'Storage error'); END")
  assert.throws(() => confirmSubscription(db, { verificationId: request.body.verificationId, code: '012345' }, { now: start }), /Storage error/)
  assert.equal(activeCount(db), 1)
  assert.ok(db.prepare('SELECT * FROM subscription_verifications WHERE id = ?').get(request.body.verificationId))
})

test('Resend sends the code only to the requested inbox with the Wave Shield and idempotency', async () => {
  let payload, headers
  await sendConfirmationEmail({ email: 'person@example.com', code: '012345', zipCode: '01234', requestId: 'test-id' }, {
    apiKey: 'test-only-key', fromEmail: 'FloodSentry <alerts@example.com>', fetchImpl: async (url, request) => {
      assert.equal(url, 'https://api.resend.com/emails')
      payload = JSON.parse(request.body); headers = request.headers
      return { ok: true }
    },
  })
  assert.deepEqual(payload.to, ['person@example.com'])
  assert.equal(payload.from, 'FloodSentry <alerts@example.com>')
  assert.equal(payload.subject, 'Confirm your FloodSentry email')
  assert.match(payload.text, /Confirm your FloodSentry email/)
  assert.match(payload.html, />FloodSentry<\/td>/)
  assert.match(payload.text, /012345/)
  assert.match(payload.html, /cid:flood-sentry-wave-shield/)
  assert.equal(payload.attachments.length, 1)
  assert.equal(headers['Idempotency-Key'], 'verification-test-id')
  await assert.rejects(sendConfirmationEmail({ email: 'person@example.com' }, {}), { status: 503 })
  await assert.rejects(sendConfirmationEmail({ email: 'person@example.com', code: '012345', zipCode: '01234', requestId: 'test-id' }, {
    apiKey: 'test-key', fromEmail: 'alerts@example.com', fetchImpl: async () => ({ ok: false }),
  }), { status: 502 })
})
