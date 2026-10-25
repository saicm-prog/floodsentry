import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { buildAlertEmailContent } from '../server/email-templates.mjs'

// Offline fixture only. This script does not load .env, call providers, or open a database.
const content = buildAlertEmailContent({
  triggerType: 'Email design preview',
  message: 'Design preview only. This example shows how FloodSentry explains flood damage and protective steps.\n\nThis is not a weather warning. No email was sent.',
  analysis: {
    areas: ['Preview only'], issuedAt: 'Not applicable', expiresAt: 'Not applicable', coverageNotes: 'No subscribers or ZIP codes are included.',
    expectedDamage: [
      'In a flash flood, fast-moving water can cover roads and enter low-lying homes. Water can damage furniture, electrical systems, and vehicles.',
      'Flooded roads can cut off access to work, school, and medical care. This example does not predict damage at any specific location.',
    ],
    actions: [
      'Move to higher ground if water rises near you. Follow instructions from local emergency officials.',
      'Stay out of floodwater. Never walk or drive across a flooded road.',
      'Keep your phone, medicine, drinking water, and essential documents ready if you can collect them safely.',
      'Use the official services below to find shelter or other help. Confirm a facility is open before travel.',
    ],
    localHelp: { status: 'none_found', areaLabel: 'Preview only — no location was searched', checkedAt: null,
      notice: 'This offline preview does not list real facilities. Live reports check official sources for help in the affected counties.',
      facilities: [], resources: [],
    },
  },
})
let html = content.html
for (const image of content.attachments) {
  html = html.replaceAll(`cid:${image.content_id}`, `data:${image.content_type};base64,${image.content}`)
}
const directory = new URL('../output/email-preview/', import.meta.url)
mkdirSync(directory, { recursive: true })
const file = new URL('index.html', directory)
writeFileSync(file, html)
console.log(`Email preview saved to ${fileURLToPath(file)}. No email sent.`)
