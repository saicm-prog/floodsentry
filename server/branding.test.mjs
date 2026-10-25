import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { brandName, normalizeBrandName } from '../src/branding.ts'
import { migrateNotificationBranding } from './branding.mjs'

const previousName = ['Flood', 'Sentry'].join(' ')

test('normalizes legacy names without changing verified mailboxes or asset paths', () => {
  assert.equal(brandName, 'FloodSentry')
  for (const value of [previousName, previousName.toLowerCase(), previousName.toUpperCase(), ['Flood', 'Sentry'].join('\t')]) {
    assert.equal(normalizeBrandName(`${value} alerts — ${value}’s mission`), 'FloodSentry alerts — FloodSentry’s mission')
  }
  assert.equal(normalizeBrandName(`${previousName} <alerts@example.com>`), 'FloodSentry <alerts@example.com>')
  for (const value of ['FloodSentry', 'alerts@example.com', '/flood-sentry-wave-shield.svg', 'data/flood-sentry.sqlite']) {
    assert.equal(normalizeBrandName(value), value)
  }
})

test('renames saved reports without changing registrations, IDs, ZIP codes, or dates', t => {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  db.exec(`CREATE TABLE notifications (id INTEGER PRIMARY KEY, zip_code TEXT, trigger_type TEXT, message TEXT, created_at TEXT);
    CREATE TABLE subscriptions (email TEXT, zip_code TEXT);
    INSERT INTO subscriptions VALUES ('resident@example.com', '01234');`)
  const insert = db.prepare('INSERT INTO notifications VALUES (?, ?, ?, ?, ?)')
  insert.run(1, '01234', 'Flash flood warning', `${previousName} alert. Keep this warning text. ${previousName} helps.`, '2026-10-01T12:00:00Z')
  insert.run(2, '78732', 'Wind advisory', 'FloodSentry alert. Already correct.', '2026-10-02T12:00:00Z')
  insert.run(3, '37311', 'Flood watch', 'No product name in this report.', '2026-10-03T12:00:00Z')
  const before = db.prepare('SELECT * FROM notifications ORDER BY id').all()
  assert.equal(migrateNotificationBranding(db), 1)
  const after = db.prepare('SELECT * FROM notifications ORDER BY id').all()
  assert.deepEqual(after.map(row => ({ ...row })), before.map(row => ({ ...row, message: normalizeBrandName(row.message) })))
  assert.equal(db.prepare('SELECT email FROM subscriptions').get().email, 'resident@example.com')
  assert.equal(migrateNotificationBranding(db), 0)
})

test('a failed rename rolls back every saved report', t => {
  const db = new DatabaseSync(':memory:')
  t.after(() => db.close())
  db.exec('CREATE TABLE notifications (id INTEGER PRIMARY KEY, message TEXT)')
  const insert = db.prepare('INSERT INTO notifications VALUES (?, ?)')
  insert.run(1, previousName); insert.run(2, previousName)
  db.exec("CREATE TRIGGER reject_second BEFORE UPDATE ON notifications WHEN OLD.id = 2 BEGIN SELECT RAISE(ABORT, 'Test failure'); END")
  assert.throws(() => migrateNotificationBranding(db), /Test failure/)
  assert.deepEqual(db.prepare('SELECT message FROM notifications ORDER BY id').all().map(row => row.message), [previousName, previousName])
})

test('all source copy, titles, SVG metadata, documentation, and sender examples use the joined name', () => {
  const root = new URL('../', import.meta.url)
  const files = ['README.md', 'index.html', '.env.example']
  for (const folder of ['src', 'server', 'public', 'scripts']) {
    for (const file of readdirSync(new URL(`${folder}/`, root), { recursive: true })) {
      if (/\.(?:tsx?|m?js|svg|html|md)$/.test(file)) files.push(`${folder}/${file}`)
    }
  }
  for (const file of files) assert.doesNotMatch(readFileSync(new URL(file, root), 'utf8'), /\bflood[ \t]+sentry\b/i, file)
})
