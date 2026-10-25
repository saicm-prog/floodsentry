import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildAlertEmailContent, emailLogo, emailLogoContentId, floodSentryEmail, providedBulletinEmail } from './email-templates.mjs'

const fixture = {
  triggerType: 'Design preview',
  message: 'This is a logo preview. No weather event is being reported.',
  analysis: {
    areas: ['Sample area'], issuedAt: 'Not applicable', expiresAt: 'Not applicable',
    references: [{ label: 'Example code', value: 'PREVIEW-ONLY' }],
    coverageNotes: 'No recipients. No delivery.',
    expectedDamage: ['Water could cover low roads.', 'Power cuts could disrupt daily activities.'],
    actions: ['Move to higher ground if water rises.', 'Stay out of floodwater.', 'Follow local emergency instructions.'],
  },
}

test('both email templates use the same Wave Shield and readable text wordmark', () => {
  for (const render of [providedBulletinEmail, floodSentryEmail]) {
    const html = render(fixture)
    assert.ok(html.includes(emailLogo()))
    assert.equal(html.match(/src="cid:/g)?.length, 1)
    assert.match(html, /alt="Wave Shield"/)
    assert.match(html, />FloodSentry<\/td>/)
    assert.doesNotMatch(html, /✳|10035|<svg|src="(?:https?:|data:)/)
  }
})

test('email HTML and plain text normalize legacy branding in dynamic report content', () => {
  const previousName = ['Flood', 'Sentry'].join(' ')
  const oldBrand = new RegExp(previousName, 'i')
  const content = buildAlertEmailContent({ ...fixture, triggerType: `${previousName} alert`, message: `${previousName} explains this report.`,
    analysis: { ...fixture.analysis, expectedDamage: [`${previousName} describes possible impacts.`], actions: [`Read the ${previousName} report.`] } })
  for (const value of [content.html, content.text]) {
    assert.doesNotMatch(value, oldBrand)
    assert.match(value, /FloodSentry explains this report/)
    assert.match(value, /FloodSentry describes possible impacts/)
    assert.match(value, /Read the FloodSentry report/)
  }
})

test('Resend payload embeds the PNG with its exact matching content ID', () => {
  const content = buildAlertEmailContent(fixture)
  const attachments = content.attachments
  assert.equal(attachments.length, 1)
  const logo = attachments[0]
  assert.equal(logo.content_id, emailLogoContentId)
  assert.ok(content.html.includes(`src="cid:${logo.content_id}"`))
  assert.equal(logo.content_type, 'image/png')
  assert.equal(logo.filename, 'flood-sentry-wave-shield.png')
  assert.equal(logo.path, undefined)
  const png = Buffer.from(logo.content, 'base64')
  assert.deepEqual(png, readFileSync(new URL('../public/flood-sentry-wave-shield-email.png', import.meta.url)))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), 132)
  assert.equal(png.readUInt32BE(20), 147)
  assert.ok(png.length < 50000)
})

test('logo changes preserve escaped content, plain text, and technical details', () => {
  const content = buildAlertEmailContent({ ...fixture, triggerType: '<test>', message: '<script>alert(1)</script>\n\nPreview & test.' })
  assert.match(content.html, /&lt;test&gt;/)
  assert.match(content.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.doesNotMatch(content.html, /<script>/)
  assert.ok(content.html.indexOf('What you need to know') < content.html.indexOf('Technical details'))
  assert.match(content.text, /Example code: PREVIEW-ONLY/)
  assert.match(content.text, /No recipients\. No delivery\./)
  assert.doesNotMatch(content.text, /cid:|<img/)
})

test('website and favicon share the same two Wave Shield shapes', () => {
  const svg = readFileSync(new URL('../public/flood-sentry-wave-shield.svg', import.meta.url), 'utf8')
  const favicon = readFileSync(new URL('../public/flood-sentry-favicon.svg', import.meta.url), 'utf8')
  const paths = svg.match(/<path[^>]+>/g)
  assert.equal(paths.length, 2)
  for (const path of paths) assert.ok(favicon.includes(path))
  assert.match(svg, /fill="#f3f8fb"/)
  assert.match(svg, /fill="#5cc9ed"/)
  assert.match(favicon, /fill="#102b46"/)
})

test('both templates put damage and numbered protective steps before technical details', () => {
  for (const render of [providedBulletinEmail, floodSentryEmail]) {
    const html = render(fixture)
    assert.ok(html.indexOf('What you need to know') < html.indexOf('Expected damage'))
    assert.ok(html.indexOf('Expected damage') < html.indexOf('How to protect yourself'))
    assert.ok(html.indexOf('How to protect yourself') < html.indexOf('Local shelter and help'))
    assert.ok(html.indexOf('Local shelter and help') < html.indexOf('Report issued'))
    for (const paragraph of fixture.analysis.expectedDamage) assert.ok(html.includes(paragraph))
    assert.equal(html.match(/<li /g)?.length, 3)
    assert.match(html, /<ol /)
    assert.match(html, /Local facility details could not be checked/)
    assert.match(html, /American Red Cross: find open shelters/)
    assert.match(html, /211: local help/)
  }
  const { text } = buildAlertEmailContent(fixture)
  assert.match(text, /Expected damage\n\nWater could cover low roads\./)
  assert.match(text, /1\. Move to higher ground if water rises\./)
  assert.match(text, /2\. Stay out of floodwater\./)
  assert.ok(text.indexOf('How to protect yourself') < text.indexOf('Technical details'))
})

test('facility cards include source, address, phone, check time, and a clear opening-status limit', () => {
  const localHelp = { status: 'found', areaLabel: 'Example County, TN', checkedAt: '2026-10-20T17:00:00Z',
    notice: 'Confirm opening and capacity before travel.', resources: [], facilities: [{
      name: 'Example assistance office', address: '1 Example Road', county: 'Example County', state: 'TN', services: 'Emergency management',
      phone: '423-555-0100', sourceUrl: 'https://county.example.gov/help', sourceTitle: 'County office listing', checkedAt: '2026-10-20T17:00:00Z',
    }],
  }
  const { html, text } = buildAlertEmailContent({ ...fixture, analysis: { ...fixture.analysis, localHelp } })
  for (const content of [html, text]) {
    assert.match(content, /1 Example Road/)
    assert.match(content, /423-555-0100/)
    assert.match(content, /Details checked:/)
    assert.match(content, /Opening and capacity: confirm before travel/)
    assert.match(content, /https:\/\/county\.example\.gov\/help/)
  }
  assert.match(html, /Oct 20, 2026/)
  assert.match(html, /UTC/)
})

test('new report sections escape model text and omit unsafe facility links', () => {
  const facility = { name: '<img src=x>', address: '<b>Address</b>', county: 'Example County', state: 'TN', services: '<script>bad</script>',
    phone: null, sourceUrl: 'https://county.example.gov/help', sourceTitle: 'Source " & name', checkedAt: '2026-10-20T17:00:00Z' }
  const analysis = { ...fixture.analysis, expectedDamage: ['<script>damage</script>'], actions: ['<img onerror=bad>'],
    localHelp: { status: 'found', areaLabel: 'Example area', checkedAt: null, notice: 'Confirm first.', resources: [],
      facilities: [facility, { ...facility, name: 'UNSAFE FACILITY', sourceUrl: 'javascript:alert(1)' }] },
  }
  const { html, text } = buildAlertEmailContent({ ...fixture, analysis })
  assert.match(html, /&lt;script&gt;damage&lt;\/script&gt;/)
  assert.match(html, /&lt;img onerror=bad&gt;/)
  assert.match(html, /&lt;b&gt;Address&lt;\/b&gt;/)
  assert.doesNotMatch(html, /<script>|<img onerror|javascript:|UNSAFE FACILITY/)
  assert.doesNotMatch(text, /UNSAFE FACILITY|javascript:/)
})

test('legacy reports show an honest fallback instead of fabricated damage or facilities', () => {
  const { html, text } = buildAlertEmailContent({ ...fixture, analysis: { areas: ['Sample area'] } })
  for (const content of [html, text]) {
    assert.match(content, /does not provide enough detail to describe expected damage/)
    assert.match(content, /Local facility details could not be checked/)
    assert.match(content, /For a life-threatening emergency, call 911/)
  }
})
