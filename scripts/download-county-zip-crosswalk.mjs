import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { censusCrosswalkUrl, importCountyZipCrosswalk } from '../server/county-zip-crosswalk.mjs'

const dataFile = resolve('data/tab20_zcta520_county20_natl.txt')
const databaseFile = resolve('data/flood-sentry.sqlite')
const response = await fetch(censusCrosswalkUrl, { signal: AbortSignal.timeout(120000) })
if (!response.ok) throw new Error(`Census download failed with HTTP ${response.status}.`)
const text = await response.text()
if (!text.includes('GEOID_ZCTA5_20') || text.length < 1_000_000) throw new Error('Census download was incomplete or had an unexpected format.')
mkdirSync(dirname(dataFile), { recursive: true })
writeFileSync(dataFile, text)
const db = new DatabaseSync(databaseFile)
try {
  const imported = importCountyZipCrosswalk(db, dataFile)
  console.log(`Downloaded and imported ${imported.rows.toLocaleString()} county-to-ZIP relationships.`)
} finally { db.close() }
