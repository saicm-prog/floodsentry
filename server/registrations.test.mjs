import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { removeRegistration } from './registrations.mjs'

function fixture(t) {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  db.exec(`CREATE TABLE subscriptions (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, zip_code TEXT NOT NULL);
    CREATE TABLE notifications (message TEXT);
    CREATE TABLE accounts (email TEXT);
    INSERT INTO notifications VALUES ('Keep this bulletin');
    INSERT INTO accounts VALUES ('person@example.com');`)
  const insert = db.prepare('INSERT INTO subscriptions (email, zip_code) VALUES (?, ?)')
  insert.run('person@example.com', '01234')
  insert.run('persom@example.com', '01234')
  insert.run('neighbor@example.com', '78732')
  return db
}
const target = { email: 'persom@example.com', zipCode: '01234', confirmRemoval: true }

test('removes only the exact email and ZIP while preserving similar addresses and other tables', t => {
  const db = fixture(t)
  assert.equal(removeRegistration(db, target).status, 200)
  assert.deepEqual(db.prepare('SELECT email FROM subscriptions ORDER BY id').all().map(r => r.email), ['person@example.com', 'neighbor@example.com'])
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM notifications').get().count, 1)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM accounts').get().count, 1)
})

test('normalizes email case and whitespace without losing ZIP leading zeroes', t => {
  const db = fixture(t)
  assert.equal(removeRegistration(db, { ...target, email: ' PERSOM@example.com ', zipCode: ' 01234 ' }).status, 200)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 2)
})

test('wrong ZIP or email never deletes a registration', t => {
  const db = fixture(t)
  for (const input of [{ ...target, zipCode: '78732' }, { ...target, email: 'missing@example.com' }]) {
    assert.equal(removeRegistration(db, input).status, 404)
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 3)
})

test('requires explicit confirmation and valid string fields', t => {
  const db = fixture(t)
  for (const input of [null, {}, { ...target, confirmRemoval: false }, { ...target, confirmRemoval: 'true' },
    { ...target, email: [] }, { ...target, email: 'bad-address' }, { ...target, email: 'a@b@c.com' },
    { ...target, zipCode: 1234 }, { ...target, zipCode: '1234' }, { ...target, zipCode: '123456' }]) {
    assert.equal(removeRegistration(db, input).status, 400)
  }
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 3)
})

test('SQL-looking email input cannot remove other records', t => {
  const db = fixture(t)
  assert.notEqual(removeRegistration(db, { ...target, email: "x'OR'1'='1@example.com" }).status, 200)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 3)
})

test('repeated removal leaves all other records intact', t => {
  const db = fixture(t)
  assert.equal(removeRegistration(db, target).status, 200)
  assert.equal(removeRegistration(db, target).status, 404)
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM subscriptions').get().count, 2)
})
