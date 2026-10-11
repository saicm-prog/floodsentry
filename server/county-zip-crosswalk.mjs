import { existsSync, readFileSync } from 'node:fs'

export const censusCrosswalkUrl = 'https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt'
export const censusCrosswalkSource = '2020 Census ZCTA-to-county relationship file'

const stateCodes = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI', '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI', '56': 'WY', '60': 'AS', '66': 'GU', '69': 'MP', '72': 'PR', '78': 'VI',
}

export const normalizeCountyName = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
const countyBaseName = value => normalizeCountyName(value).replace(/(?:county|parish|borough|censusarea|municipio|cityandborough|city)$/u, '')

export function createCountyZipTables(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS county_zip_crosswalk (
      zip_code TEXT NOT NULL,
      county_geoid TEXT NOT NULL,
      county_name TEXT NOT NULL,
      county_key TEXT NOT NULL,
      state_code TEXT NOT NULL,
      land_share REAL NOT NULL,
      source_file TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      PRIMARY KEY (zip_code, county_geoid)
    );
    CREATE INDEX IF NOT EXISTS county_zip_crosswalk_county_idx
      ON county_zip_crosswalk (state_code, county_key, zip_code);
  `)
}

export function importCountyZipCrosswalk(db, filePath, { now = new Date().toISOString() } = {}) {
  if (!existsSync(filePath)) throw new Error(`County-to-ZIP crosswalk file was not found at ${filePath}. Run npm run data:download first.`)
  createCountyZipTables(db)
  const lines = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/)
  const headers = lines.shift()?.split('|') || []
  const field = name => headers.indexOf(name)
  const zipIndex = field('GEOID_ZCTA5_20')
  const countyIdIndex = field('GEOID_COUNTY_20')
  const countyNameIndex = field('NAMELSAD_COUNTY_20')
  const zctaLandIndex = field('AREALAND_ZCTA5_20')
  const overlapLandIndex = field('AREALAND_PART')
  if ([zipIndex, countyIdIndex, countyNameIndex, zctaLandIndex, overlapLandIndex].some(index => index < 0)) throw new Error('County-to-ZIP crosswalk has an unexpected Census file layout.')
  const rows = []
  for (const line of lines) {
    if (!line) continue
    const values = line.split('|')
    const zipCode = values[zipIndex]
    const countyGeoid = values[countyIdIndex]
    const countyName = values[countyNameIndex]
    const stateCode = stateCodes[countyGeoid?.slice(0, 2)]
    if (!/^\d{5}$/.test(zipCode || '') || !/^\d{5}$/.test(countyGeoid || '') || !countyName || !stateCode) continue
    const zctaLand = Number(values[zctaLandIndex])
    const overlapLand = Number(values[overlapLandIndex])
    rows.push({ zipCode, countyGeoid, countyName, countyKey: normalizeCountyName(countyName), stateCode, landShare: Number.isFinite(zctaLand) && zctaLand > 0 && Number.isFinite(overlapLand) ? overlapLand / zctaLand : 0 })
  }
  if (!rows.length) throw new Error('County-to-ZIP crosswalk contained no usable US records.')
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM county_zip_crosswalk')
    const insert = db.prepare(`INSERT INTO county_zip_crosswalk (zip_code, county_geoid, county_name, county_key, state_code, land_share, source_file, imported_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    for (const row of rows) insert.run(row.zipCode, row.countyGeoid, row.countyName, row.countyKey, row.stateCode, row.landShare, censusCrosswalkSource, now)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  return { rows: rows.length, importedAt: now }
}

export function ensureCountyZipCrosswalk(db, filePath) {
  createCountyZipTables(db)
  const existing = db.prepare('SELECT COUNT(*) AS count FROM county_zip_crosswalk').get().count
  if (existing) return { ready: true, rows: existing, imported: false }
  const imported = importCountyZipCrosswalk(db, filePath)
  return { ready: true, ...imported, imported: true }
}

export function lookupCountyZipCodes(db, counties) {
  const results = new Map()
  const unresolved = []
  const countyNames = new Set()
  const countiesByState = new Map()
  for (const county of counties || []) {
    const stateCode = String(county?.state || '').trim().toUpperCase()
    const countyKey = normalizeCountyName(county?.name)
    if (!/^[A-Z]{2}$/.test(stateCode) || !countyKey) continue
    if (!countiesByState.has(stateCode)) countiesByState.set(stateCode, [])
    countiesByState.get(stateCode).push({ stateCode, countyKey, requestedName: String(county.name).trim() })
  }
  for (const [stateCode, requested] of countiesByState) {
    const available = db.prepare('SELECT DISTINCT county_name, county_key FROM county_zip_crosswalk WHERE state_code = ?').all(stateCode)
    for (const county of requested) {
      let matched = available.filter(row => row.county_key === county.countyKey)
      if (!matched.length) {
        const base = countyBaseName(county.requestedName)
        matched = available.filter(row => countyBaseName(row.county_name) === base)
      }
      if (!matched.length) { unresolved.push(`${county.requestedName}, ${stateCode}`); continue }
      for (const match of matched) {
        countyNames.add(`${match.county_name}, ${stateCode}`)
        const rows = db.prepare('SELECT zip_code FROM county_zip_crosswalk WHERE state_code = ? AND county_key = ? ORDER BY zip_code').all(stateCode, match.county_key)
        for (const row of rows) {
          if (!results.has(row.zip_code)) results.set(row.zip_code, new Set())
          results.get(row.zip_code).add(`${match.county_name}, ${stateCode}`)
        }
      }
    }
  }
  return { zipCodes: [...results].map(([zipCode, areas]) => ({ zipCode, areas: [...areas].sort() })).sort((a, b) => a.zipCode.localeCompare(b.zipCode)), unresolved, matchedCounties: [...countyNames].sort() }
}
