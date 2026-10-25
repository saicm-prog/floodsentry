import test from 'node:test'
import assert from 'node:assert/strict'
import { findLocalHelp } from './local-help.mjs'
import { trustedAidUrl } from '../src/alertReport.ts'

// Fictional locations, mocked HTTP only. These fixtures never reach a live email.
const details = { areas: ['Example County, TN'], counties: [{ name: 'Example County', state: 'TN' }] }
const checkedAt = '2026-10-20T17:00:00Z'
const url = 'https://county.example.gov/emergency-management'
const facility = { name: 'Example help office', address: '1 Example Road, Sample City, TN 37000', county: 'Example County', state: 'TN',
  services: 'Emergency management assistance', phone: '423-555-0100', sourceUrl: url, sourceTitle: 'County emergency management' }
const page = `<html><body><h1>${facility.name}</h1><p>${facility.address}</p><p>${facility.services}</p><p>${facility.phone}</p></body></html>`

function options(facilities = [facility], sources = [url]) {
  const calls = [], sourceCalls = []
  return { apiKey: 'test-key', model: 'gpt-4.1', now: checkedAt, calls, sourceCalls,
    fetchImpl: async (target, init) => {
      assert.equal(target, 'https://api.openai.com/v1/responses')
      calls.push(JSON.parse(init.body))
      return Response.json({ status: 'completed', output: [
        { type: 'web_search_call', status: 'completed', action: { sources: sources.map(source => ({ type: 'url', url: source })) } },
        { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ facilities }) }] },
      ] })
    },
    fetchSourceImpl: async (target, init) => {
      sourceCalls.push(target)
      assert.equal(init.redirect, 'manual')
      return new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    },
  }
}

test('keeps only a cited, page-checked facility in an affected county with a current check time', async () => {
  const mock = options()
  const result = await findLocalHelp(details, mock)
  assert.equal(result.status, 'found')
  assert.equal(result.facilities.length, 1)
  assert.deepEqual(result.facilities[0], { ...facility, checkedAt })
  assert.equal(result.checkedAt, checkedAt)
  assert.match(result.notice, /must be confirmed before travel/)
  assert.deepEqual(mock.sourceCalls, [url])
  assert.equal(mock.calls[0].store, false)
  assert.equal(mock.calls[0].tool_choice, 'required')
  assert.deepEqual(mock.calls[0].tools, [{ type: 'web_search' }])
  assert.deepEqual(JSON.parse(mock.calls[0].input), { counties: details.counties, areas: details.areas, checkedAt })
})

test('rejects unsafe URLs, absent citations, missing addresses, and other counties before source fetch', async () => {
  const cases = [
    [{ ...facility, sourceUrl: 'https://untrusted.example/help' }],
    [{ ...facility, sourceUrl: 'http://county.example.gov/help' }],
    [{ ...facility, sourceUrl: 'https://county.example.gov:8787/help' }],
    [{ ...facility, sourceUrl: 'https://county.example.gov/uncited' }],
    [{ ...facility, sourceUrl: 'https://127.0.0.1/help' }],
    [{ ...facility, address: '' }], [{ ...facility, county: 'Other County' }],
    [{ ...facility, state: 'TX' }], [{ ...facility, state: 1 }],
  ]
  for (const candidates of cases) {
    const mock = options(candidates)
    const result = await findLocalHelp(details, mock)
    assert.equal(result.status, 'none_found')
    assert.equal(result.facilities.length, 0)
    assert.equal(mock.sourceCalls.length, 0)
  }
})

test('a source URL alone does not verify invented names, addresses, or services', async () => {
  for (const field of ['name', 'address', 'services']) {
    const mock = options([{ ...facility, [field]: 'Invented content absent from the page' }])
    const result = await findLocalHelp(details, mock)
    assert.equal(result.status, 'none_found')
    assert.equal(result.facilities.length, 0)
  }
  const mock = options()
  mock.fetchSourceImpl = async () => new Response(`<script>${facility.name} ${facility.address} ${facility.services}</script>`, { headers: { 'content-type': 'text/html' } })
  assert.equal((await findLocalHelp(details, mock)).status, 'none_found')
})

test('drops an unverified phone without discarding an otherwise checked office', async () => {
  const result = await findLocalHelp(details, options([{ ...facility, phone: '423-555-0199' }]))
  assert.equal(result.status, 'found')
  assert.equal(result.facilities[0].phone, null)
})

test('rejects long agency mission statements in place of a readable service label', async () => {
  const mock = options([{ ...facility, services: 'This long agency mission statement has more words than a short service label should contain.' }])
  const result = await findLocalHelp(details, mock)
  assert.equal(result.status, 'none_found')
  assert.equal(mock.sourceCalls.length, 0)
})

test('fetches duplicate source pages once and removes duplicate facilities', async () => {
  const mock = options([facility, { ...facility }])
  const result = await findLocalHelp(details, mock)
  assert.equal(mock.sourceCalls.length, 1)
  assert.equal(result.facilities.length, 1)
})

test('does not follow a trusted source redirect to a non-official or local address', async () => {
  for (const location of ['http://county.example.gov/help', 'https://untrusted.example/help', 'https://127.0.0.1/']) {
    const mock = options()
    let count = 0
    mock.fetchSourceImpl = async () => { count++; return new Response(null, { status: 302, headers: { location } }) }
    assert.equal((await findLocalHelp(details, mock)).status, 'none_found')
    assert.equal(count, 1)
  }
})

test('failed, unsupported, or oversized source pages produce an honest fallback', async () => {
  for (const response of [new Response('missing', { status: 404 }), new Response(page, { headers: { 'content-type': 'application/pdf' } }),
    new Response(page, { headers: { 'content-type': 'text/html', 'content-length': '300001' } }),
    new Response('x'.repeat(300001), { headers: { 'content-type': 'text/html' } })]) {
    const mock = options()
    mock.fetchSourceImpl = async () => response
    const result = await findLocalHelp(details, mock)
    assert.equal(result.status, 'none_found')
    assert.equal(result.facilities.length, 0)
    assert.match(result.notice, /No local facility details could be verified/)
    assert.equal(result.resources.length, 2)
  }
})

test('search outages or incomplete responses do not invent local help', async () => {
  for (const response of [new Response(null, { status: 429 }), Response.json({ status: 'incomplete', output: [] }),
    Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'No' }] }] })]) {
    const mock = options()
    mock.fetchImpl = async () => response
    const result = await findLocalHelp(details, mock)
    assert.equal(result.status, 'unavailable')
    assert.equal(result.checkedAt, null)
    assert.equal(result.facilities.length, 0)
    assert.match(result.notice, /could not be checked/)
  }
})

test('facility links allow only HTTPS primary-source hosts without credentials or custom ports', () => {
  for (const value of ['javascript:alert(1)', 'http://agency.gov', 'https://agency.gov.evil.test', 'https://user:password@agency.gov',
    'https://agency.gov:8787', 'https://localhost', null]) assert.equal(trustedAidUrl(value), null)
  assert.equal(trustedAidUrl('https://agency.gov/directory#office'), 'https://agency.gov/directory')
  assert.equal(trustedAidUrl('https://www.redcross.org/help'), 'https://www.redcross.org/help')
})
