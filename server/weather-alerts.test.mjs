import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { createCountyZipTables, lookupCountyZipCodes } from './county-zip-crosswalk.mjs'
import { analyzeWeatherReport, simulateWeatherReport } from './weather-alerts.mjs'

const report = 'National Weather Service: Flash flood warning for Bradley and McMinn Counties, Tennessee, June 10, 2012, 6 pm EDT until 9 pm EDT.'
const details = {
  eventType: 'Flash flood warning', areas: ['Bradley County, TN', 'McMinn County, TN'],
  counties: [{ name: 'Bradley County', state: 'TN' }, { name: 'McMinn County', state: 'TN' }],
  issuedAt: 'June 10, 2012, 6 pm EDT', expiresAt: 'June 10, 2012, 9 pm EDT',
}
const draft = { subject: 'Flash flood warning: Bradley and McMinn Counties', message: 'Flooding has been reported. Act quickly if flooding is observed.' }
const localZips = {
  zipCodes: [{ zipCode: '37311', areas: ['Bradley County, TN'] }, { zipCode: '37303', areas: ['McMinn County, TN'] }],
  unresolved: [], matchedCounties: ['Bradley County, TN', 'McMinn County, TN'],
}
function modelResponse(data) {
  return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(data) }] }] }) }
}
function provider(first = details, second = draft) {
  const calls = []
  return { calls, apiKey: 'test-key', lookupCountyZipCodes: () => localZips, fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses')
    calls.push(JSON.parse(options.body))
    return modelResponse(calls.length === 1 ? first : second)
  } }
}
function database() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE subscriptions (email TEXT, zip_code TEXT);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, zip_code TEXT, trigger_type TEXT, message TEXT, created_at TEXT);
    INSERT INTO subscriptions VALUES ('a@example.org','37311'), ('b@example.org','37303'), ('c@example.org','78732');`)
  return db
}

test('uses a local county lookup and drafts the message without web search', async () => {
  const mock = provider()
  const result = await analyzeWeatherReport(report, mock)
  assert.equal(mock.calls.length, 2)
  assert.equal(mock.calls[0].tools, undefined)
  assert.equal(mock.calls[0].store, false)
  assert.deepEqual(result.zipCodes.map(zip => zip.zipCode), ['37311', '37303'])
  assert.match(mock.calls[1].input, /37311/)
  assert.equal(result.subject, draft.subject)
  assert.match(result.coverageNotes, /locally stored 2020 Census/)
})

test('missing key and invalid reports stop before any provider call', async () => {
  for (const invalid of ['', null, 12, 'x'.repeat(20001)]) await assert.rejects(analyzeWeatherReport(invalid), /Paste a weather report/)
  await assert.rejects(analyzeWeatherReport(report, { apiKey: '' }), /OPENAI_API_KEY/)
})

test('missing counties stop before local matching or drafting', async () => {
  const mock = provider({ ...details, counties: [] })
  await assert.rejects(analyzeWeatherReport(report, mock), /usable US county/)
  assert.equal(mock.calls.length, 1)
})

test('unresolved local county mapping stops before drafting', async () => {
  const mock = provider()
  mock.lookupCountyZipCodes = () => ({ zipCodes: [], unresolved: ['Imaginary County, TN'], matchedCounties: [] })
  await assert.rejects(analyzeWeatherReport(report, mock), /No local ZIP mapping/)
  assert.equal(mock.calls.length, 1)
})

test('leading zeroes from the local crosswalk survive matching', async () => {
  const mock = provider()
  mock.lookupCountyZipCodes = () => ({ zipCodes: [{ zipCode: '01234', areas: ['Test County, MA'] }], unresolved: [], matchedCounties: ['Test County, MA'] })
  const result = await analyzeWeatherReport(report, mock)
  assert.equal(result.zipCodes[0].zipCode, '01234')
})

test('provider failures are actionable and never expose provider error bodies', async () => {
  for (const status of [401, 429, 500]) {
    await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', lookupCountyZipCodes: () => localZips, fetchImpl: async () => ({ ok: false, status }) }), new RegExp(`HTTP ${status}`))
  }
  await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', lookupCountyZipCodes: () => localZips, fetchImpl: async () => { throw { name: 'TimeoutError' } } }), /timed out/)
})

test('local crosswalk matches a county name with or without its suffix', () => {
  const db = new DatabaseSync(':memory:')
  try {
    createCountyZipTables(db)
    db.prepare(`INSERT INTO county_zip_crosswalk (zip_code, county_geoid, county_name, county_key, state_code, land_share, source_file, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run('37311', '47011', 'Bradley County', 'bradleycounty', 'TN', 1, 'test', '2026-01-01T00:00:00Z')
    const result = lookupCountyZipCodes(db, [{ name: 'Bradley', state: 'TN' }])
    assert.deepEqual(result.zipCodes, [{ zipCode: '37311', areas: ['Bradley County, TN'] }])
    assert.deepEqual(result.unresolved, [])
  } finally { db.close() }
})

test('multi-ZIP bulletin saves once per ZIP and sends one alert to the dedicated inbox', async () => {
  const db = database()
  try {
    const sent = []
    const result = await simulateWeatherReport(report, { ...provider(), db, sendAlert: async message => { sent.push(message); return { status: 'sent', sent: 1, failed: 0 } } })
    assert.equal(result.matchedSubscribers, 2)
    assert.equal(sent.length, 1)
    assert.deepEqual(sent[0].recipients, ['muthup.yt@gmail.com'])
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2)
  } finally { db.close() }
})

test('reports the local lookup processing stages in order', async () => {
  const db = database()
  try {
    const stages = []
    await simulateWeatherReport(report, { ...provider(), db, onStage: stage => stages.push(stage.id), sendAlert: async () => ({ status: 'sent', sent: 1, failed: 0 }) })
    assert.deepEqual(stages, ['starting', 'areas', 'research', 'zip-codes', 'message', 'matching', 'saving', 'sending'])
  } finally { db.close() }
})

test('draft failure creates no notifications and sends nothing', async () => {
  const db = database()
  try {
    await assert.rejects(simulateWeatherReport(report, { ...provider(details, { subject: '', message: '' }), db, sendAlert: () => assert.fail('Must not send') }), /Alert drafting/)
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 0)
  } finally { db.close() }
})

test('no matching subscribers still sends the dedicated email and records the bulletin', async () => {
  const db = database()
  db.exec('DELETE FROM subscriptions')
  try {
    const sent = []
    const result = await simulateWeatherReport(report, { ...provider(), db, sendAlert: async message => { sent.push(message); return { status: 'sent', sent: 1, failed: 0 } } })
    assert.equal(result.email.status, 'sent')
    assert.equal(result.matchedSubscribers, 0)
    assert.deepEqual(sent[0].recipients, ['muthup.yt@gmail.com'])
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2)
  } finally { db.close() }
})
