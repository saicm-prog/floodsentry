import test from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { analyzeWeatherReport, simulateWeatherReport } from './weather-alerts.mjs'

const report = 'National Weather Service: Flash flood warning for Bradley and McMinn Counties, Tennessee, June 10, 2012, 6 pm EDT until 9 pm EDT.'
const sourceUrl = 'https://example.org/zip-coverage'
const coverage = {
  eventType: 'Flash flood warning', areas: ['Bradley County, TN', 'McMinn County, TN'],
  issuedAt: 'June 10, 2012, 6 pm EDT', expiresAt: 'June 10, 2012, 9 pm EDT', coverageNotes: 'County-level approximation.',
  zipCodes: ['37311', '37303', '37311'].map(zipCode => ({ zipCode, area: 'Test county', evidence: 'Test ZIP mapping evidence.', sourceUrl })),
}
const draft = { subject: 'Flash flood simulation', message: 'Historical report from June 10, 2012: flooding reported. Act quickly if flooding is observed.' }
function modelResponse(data, search = false) {
  return { ok: true, json: async () => ({ status: 'completed', output: [
    ...(search ? [{ type: 'web_search_call', action: { sources: [{ url: sourceUrl, title: 'Test ZIP source' }] } }] : []),
    { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(data) }] },
  ] }) }
}
function provider(first = coverage, second = draft) {
  const calls = []
  return { calls, apiKey: 'test-key', fetchImpl: async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses')
    calls.push(JSON.parse(options.body))
    return modelResponse(calls.length === 1 ? first : second, calls.length === 1)
  } }
}
function database() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE subscriptions (email TEXT, zip_code TEXT);
    CREATE TABLE notifications (id INTEGER PRIMARY KEY, zip_code TEXT, trigger_type TEXT, message TEXT, created_at TEXT);
    INSERT INTO subscriptions VALUES ('a@example.org','37311'), ('b@example.org','37303'), ('c@example.org','78732');`)
  return db
}

test('two calls: required web lookup then drafting; evidence retained and ZIPs deduplicated', async () => {
  const mock = provider()
  const result = await analyzeWeatherReport(report, mock)
  assert.equal(mock.calls.length, 2)
  assert.equal(mock.calls[0].tool_choice, 'required')
  assert.equal(mock.calls[0].tools[0].type, 'web_search')
  assert.equal(mock.calls[1].tools, undefined)
  assert.equal(mock.calls[0].store, false)
  assert.deepEqual(result.zipCodes.map(zip => zip.zipCode), ['37303', '37311'])
  assert.match(mock.calls[1].input, /37311/)
  assert.match(result.subject, /^\[TEST\]/)
  assert.match(result.message, /2012/)
  assert.equal(result.sources[0].url, sourceUrl)
})

test('missing key and invalid reports stop before any provider call', async () => {
  for (const invalid of ['', null, 12, 'x'.repeat(20001)]) await assert.rejects(analyzeWeatherReport(invalid), /Paste a weather report/)
  await assert.rejects(analyzeWeatherReport(report, { apiKey: '' }), /OPENAI_API_KEY/)
})

test('empty coverage and malformed ZIPs prevent drafting', async () => {
  for (const zipCodes of [[], [{ ...coverage.zipCodes[0], zipCode: 'TNC011' }]]) {
    const mock = provider({ ...coverage, zipCodes })
    await assert.rejects(analyzeWeatherReport(report, mock), /No supported|invalid ZIP codes/)
    assert.equal(mock.calls.length, 1)
  }
})

test('tracking parameters and fragments do not invalidate an otherwise matching source', async () => {
  const mock = provider({ ...coverage, zipCodes: [{ ...coverage.zipCodes[0], sourceUrl: `${sourceUrl}?utm_source=chatgpt.com#zip-list` }] })
  const result = await analyzeWeatherReport(report, mock)
  assert.equal(mock.calls.length, 2)
  assert.equal(result.zipCodes[0].sourceUrl, sourceUrl)
  assert.equal(result.sources.length, 1)
})

test('pages opened directly are accepted even without search source lists', async () => {
  for (const actionType of ['open_page', 'find_in_page']) {
    let calls = 0
    const result = await analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async () => {
      if (++calls > 1) return modelResponse(draft)
      const payload = await modelResponse(coverage, true).json()
      payload.output[0] = { type: 'web_search_call', status: 'completed', action: { type: actionType, url: sourceUrl } }
      return { ok: true, json: async () => payload }
    } })
    assert.equal(calls, 2)
    assert.equal(result.sources[0].url, sourceUrl)
  }
})

test('an unsupported citation is repaired with one search before drafting', async () => {
  const requests = []
  const result = await analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async (_url, options) => {
    requests.push(JSON.parse(options.body))
    if (requests.length === 1) return modelResponse({ ...coverage, zipCodes: [{ ...coverage.zipCodes[0], sourceUrl: 'https://invented.example' }] }, true)
    return modelResponse(requests.length === 2 ? coverage : draft, requests.length === 2)
  } })
  assert.equal(requests.length, 3)
  assert.equal(requests[1].tools[0].type, 'web_search')
  assert.match(requests[1].input, /consultedSources/)
  assert.equal(requests[2].tools, undefined)
  assert.equal(result.zipCodes.length, 2)
})

test('invented or meaningfully different URLs still fail after one retry without saving or sending', async () => {
  for (const badUrl of ['https://invented.example', `${sourceUrl}?county=another`, 'https://example.org/other-county']) {
    const db = database()
    let calls = 0
    try {
      await assert.rejects(simulateWeatherReport(report, {
        db, apiKey: 'test-key', sendAlert: () => assert.fail('Must not send'),
        fetchImpl: async () => { calls++; return modelResponse({ ...coverage, zipCodes: [{ ...coverage.zipCodes[0], sourceUrl: badUrl }] }, true) },
      }), /could not be verified after an automatic retry/)
      assert.equal(calls, 2)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 0)
    } finally { db.close() }
  }
})

test('failed page opens are not treated as evidence', async () => {
  let calls = 0
  await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async () => {
    calls++
    const payload = await modelResponse(coverage, true).json()
    payload.output[0] = { type: 'web_search_call', status: 'failed', action: { type: 'open_page', url: sourceUrl } }
    return { ok: true, json: async () => payload }
  } }), /could not be verified after an automatic retry/)
  assert.equal(calls, 2)
})

test('leading zeroes survive normalization', async () => {
  const result = await analyzeWeatherReport(report, provider({ ...coverage, zipCodes: [{ ...coverage.zipCodes[0], zipCode: '01234' }] }))
  assert.equal(result.zipCodes[0].zipCode, '01234')
})

test('provider failures are actionable and never expose provider error bodies', async () => {
  for (const status of [401, 429, 500]) {
    await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async () => ({ ok: false, status }) }), new RegExp(`HTTP ${status}`))
  }
  await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async () => { throw { name: 'TimeoutError' } } }), /timed out/)
  await assert.rejects(analyzeWeatherReport(report, { apiKey: 'test-key', fetchImpl: async () => ({ ok: true, json: async () => ({ status: 'incomplete' }) }) }), /incomplete/)
})

test('multi-ZIP event saves once per ZIP and emails only matching subscribers once', async () => {
  const db = database()
  try {
    const sent = []
    const result = await simulateWeatherReport(report, { ...provider(), db, sendAlert: async message => { sent.push(message); return { status: 'sent', sent: 2, failed: 0 } } })
    assert.equal(result.matchedSubscribers, 2)
    assert.equal(sent.length, 1)
    assert.deepEqual(sent[0].recipients.sort(), ['a@example.org', 'b@example.org'])
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2)
    assert.match(db.prepare('SELECT message FROM notifications').get().message, /^TEST/)
  } finally { db.close() }
})

test('draft failure creates no notifications and sends nothing', async () => {
  const db = database()
  try {
    await assert.rejects(simulateWeatherReport(report, { ...provider(coverage, { subject: '', message: '' }), db, sendAlert: () => assert.fail('Must not send') }), /Alert drafting/)
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 0)
  } finally { db.close() }
})

test('no matching subscribers skips delivery but records the simulated event', async () => {
  const db = database()
  db.exec('DELETE FROM subscriptions')
  try {
    const result = await simulateWeatherReport(report, { ...provider(), db, sendAlert: () => assert.fail('Must not send') })
    assert.equal(result.email.status, 'no_recipients')
    assert.equal(result.matchedSubscribers, 0)
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2)
  } finally { db.close() }
})

test('missing Resend configuration and partial delivery retain saved events', async () => {
  for (const email of [{ status: 'not_configured', sent: 0, failed: 0 }, { status: 'partial_failure', sent: 1, failed: 1 }]) {
    const db = database()
    try {
      const result = await simulateWeatherReport(report, { ...provider(), db, sendAlert: async () => email })
      assert.deepEqual(result.email, email)
      assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notifications').get().n, 2)
    } finally { db.close() }
  }
})
