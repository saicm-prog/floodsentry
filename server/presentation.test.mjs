import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { extractBulletinReferences } from './bulletin-references.mjs'
import { explainError, groupNotifications } from '../src/presentation.ts'

test('copies actual bulletin codes without changing historical timestamps', () => {
  const report = `WGUS84 KMRX 110026 FLWMRX Bulletin
TNC011-107-110100
/O.NEW.KMRX.FF.W.0022.120610T2200-120611T0100/`
  assert.deepEqual(extractBulletinReferences(report), [
    { label: 'WMO header', value: 'WGUS84 KMRX 110026' },
    { label: 'AWIPS product ID', value: 'FLWMRX' },
    { label: 'UGC area code', value: 'TNC011-107-110100' },
    { label: 'VTEC (as supplied)', value: '/O.NEW.KMRX.FF.W.0022.120610T2200-120611T0100/' },
  ])
})

test('handles wrapped UGC ranges and complete VTEC strings', () => {
  const report = 'WGUS84 KMRX 110026 CCA\nFFWMRX\nTNC011>013-\n107-110100-\n/O.NEW.KMRX.FF.W.0022.120610T2200Z-120611T0100Z/'
  const refs = extractBulletinReferences(report)
  assert.equal(refs.length, 4)
  assert.equal(refs[0].value, 'WGUS84 KMRX 110026 CCA')
  assert.equal(refs[2].value, 'TNC011>013-\n107-110100-')
  assert.equal(refs[3].value, '/O.NEW.KMRX.FF.W.0022.120610T2200Z-120611T0100Z/')
})

test('never invents source identifiers or treats a ZIP as a UGC code', () => {
  assert.deepEqual(extractBulletinReferences('Flooding near ZIP 37311. County 47011. DOC number not supplied.'), [])
  assert.deepEqual(extractBulletinReferences(null), [])
  const code = '/O.NEW.KMRX.FF.W.0022.120610T2200Z-120611T0100Z/'
  assert.equal(extractBulletinReferences(`${code}\n${code}`).length, 1)
})

test('groups ZIP records without merging different bulletins or modifying records', () => {
  const base = { trigger_type: 'Flash flood warning', message: 'Heavy rain.', created_at: '2026-01-01T00:00:00Z' }
  const records = [
    { ...base, id: 4, zip_code: '01234' }, { ...base, id: 3, zip_code: '01235' },
    { ...base, id: 2, zip_code: '01234' }, { ...base, id: 1, zip_code: '01234', message: 'Different report.' },
  ]
  const groups = groupNotifications(records)
  assert.equal(groups.length, 2)
  assert.deepEqual(groups[0].zipCodes, ['01234', '01235'])
  assert.equal(records[0].zip_code, '01234')
  assert.deepEqual(groupNotifications([]), [])
})

test('errors lead with plain language rather than provider codes', () => {
  for (const detail of ['HTTP 401', 'HTTP 429', 'OPENAI_API_KEY missing', 'Resend HTTP 403', 'No county mapping', 'Unknown error']) {
    const summary = explainError(detail)
    assert.doesNotMatch(summary, /HTTP|RESEND|OPENAI_API_KEY/)
    for (const sentence of summary.split(/[.!?]/).filter(Boolean)) assert.ok(sentence.trim().split(/\s+/).length < 25)
  }
})

test('core text colors meet WCAG AA normal-text contrast', () => {
  const luminance = hex => {
    const [r, g, b] = hex.match(/[a-f\d]{2}/gi).map(value => {
      const s = parseInt(value, 16) / 255
      return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4
    })
    return .2126 * r + .7152 * g + .0722 * b
  }
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
  const colors = Object.fromEntries([...css.matchAll(/--([a-z-]+): #([a-f\d]{6});/g)].map(match => [match[1], match[2]]))
  for (const [text, background] of [[colors.ink, colors.canvas], [colors.muted, colors.white], [colors.navy, colors.sky], ['bfd3e2', colors.navy], [colors.ocean, colors.white], [colors['sky-light'], '173751'], ['344b58', colors.sky]]) {
    const a = luminance(text), b = luminance(background)
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, `${text} on ${background}`)
  }
})
