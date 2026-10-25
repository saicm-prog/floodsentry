import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { isValidEmail, validateEmail } from '../src/emailValidation.ts'
import { registerSubscription, removeRegistration } from './registrations.mjs'

test('accepts common mailbox formats, plus tags, subdomains, and punycode domains', () => {
  for (const email of ['name@example.com', 'first.last+alerts@example.co.uk', "o'brien@example.org",
    'first_last@example.net', 'a@x.io', 'user@mail.example.travel', 'user@xn--bcher-kva.de']) {
    assert.equal(isValidEmail(email), true, email)
    assert.equal(validateEmail(email).error, '')
  }
})

test('normalizes spaces and case but never rewrites a mailbox name', () => {
  assert.deepEqual(validateEmail('  First.Last+Alerts@EXAMPLE.COM  '), {
    valid: true, normalized: 'first.last+alerts@example.com', error: '',
  })
  assert.equal(isValidEmail('janedoe@example.com'), true)
  assert.equal(isValidEmail('janedow@example.com'), true)
  assert.equal(isValidEmail('unverified@not-checked.invalid'), true)
})

test('rejects malformed emails and unsafe input types with clear messages', () => {
  for (const email of [null, undefined, false, 123, {}, [], '', '   ', 'name', 'name@', '@example.com',
    'name@@example.com', 'name@example', 'first last@example.com', 'name@exa mple.com',
    '.name@example.com', 'name.@example.com', 'first..last@example.com', 'name@example..com',
    'name@-example.com', 'name@example-.com', 'name@exam_ple.com', 'name@example.com.',
    'a@example.com,b@example.com', 'Name <name@example.com>', 'name@example.com\r\nBcc:x@example.com',
    'name\u0000@example.com', '用户@example.com', '"quoted name"@example.com', 'name@例子.com']) {
    const result = validateEmail(email)
    assert.equal(result.valid, false, JSON.stringify(email))
    assert.ok(result.error.length > 0)
    assert.equal(isValidEmail(email), false)
  }
})

test('checks total length, local-part length, and individual domain labels', () => {
  const longest = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`
  assert.equal(longest.length, 254)
  assert.equal(isValidEmail(longest), true)
  assert.equal(isValidEmail(longest + 'd'), false)
  assert.equal(isValidEmail(`${'a'.repeat(64)}@example.com`), true)
  assert.equal(isValidEmail(`${'a'.repeat(65)}@example.com`), false)
  assert.equal(isValidEmail(`name@${'a'.repeat(64)}.com`), false)
})

function fixture(t) {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  db.exec('CREATE TABLE subscriptions (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, zip_code TEXT NOT NULL, consented_at TEXT NOT NULL, created_at TEXT NOT NULL)')
  registerSubscription(db, { email: 'keep@example.com', zipCode: '01234', consent: true })
  return db
}

test('registration rejects invalid formats before writing to SQLite', t => {
  const db = fixture(t)
  for (const email of ['first..last@example.com', 'name@-example.com', 'name@example', 'name@@example.com', {}, '']) {
    const result = registerSubscription(db, { email, zipCode: '01234', consent: true })
    assert.equal(result.status, 400)
    assert.equal(result.body.error, validateEmail(email).error)
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 1)
})

test('registration stores a valid normalized email without losing plus tags or leading-zero ZIPs', t => {
  const db = fixture(t)
  assert.equal(registerSubscription(db, { email: ' First.Last+Storm@Example.com ', zipCode: '01234', consent: true }).status, 201)
  const row = db.prepare('SELECT * FROM subscriptions WHERE email = ?').get('first.last+storm@example.com')
  assert.equal(row.zip_code, '01234')
  assert.ok(row.consented_at)
  assert.equal(row.consented_at, row.created_at)
})

test('normalized duplicate emails return a clear conflict without changing existing registrations', t => {
  const db = fixture(t)
  const before = db.prepare('SELECT * FROM subscriptions').all()
  assert.deepEqual(registerSubscription(db, { email: ' KEEP@example.com ', zipCode: '78732', consent: true }), {
    status: 409, body: { error: 'That email is already subscribed for local alerts.' },
  })
  assert.deepEqual(db.prepare('SELECT * FROM subscriptions').all(), before)
})

test('unexpected database errors are not reported as duplicate emails', () => {
  const error = Object.assign(new Error('Database unavailable'), { code: 'ERR_SQLITE_ERROR', errcode: 14 })
  const db = { prepare() { throw error } }
  assert.throws(() => registerSubscription(db, { email: 'name@example.com', zipCode: '01234', consent: true }), value => value === error)
})

test('valid email does not bypass ZIP validation or consent', t => {
  const db = fixture(t)
  for (const fields of [{ zipCode: '123', consent: true }, { zipCode: 12345, consent: true },
    { zipCode: '12345', consent: false }, { zipCode: '12345', consent: 'true' }]) {
    assert.equal(registerSubscription(db, { email: 'new@example.com', ...fields }).status, 400)
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 1)
})

test('removal uses the same email validation and preserves existing registrations on errors', t => {
  const db = fixture(t)
  const result = removeRegistration(db, { email: 'keep..@example.com', zipCode: '01234', confirmRemoval: true })
  assert.equal(result.status, 400)
  assert.equal(result.body.error, validateEmail('keep..@example.com').error)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 1)
})
