import { createServer } from 'node:http'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const port = 8787
const databasePath = resolve('data/flood-sentry.sqlite')
mkdirSync(dirname(databasePath), { recursive: true })
const db = new DatabaseSync(databasePath)
db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    zip_code TEXT NOT NULL,
    consented_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    zip_code TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)) }
const readBody = request => new Promise((resolveBody, reject) => { let body = ''; request.on('data', chunk => { body += chunk }); request.on('end', () => resolveBody(JSON.parse(body || '{}'))); request.on('error', reject) })

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); return response.end() }
  try {
    if (request.method === 'POST' && request.url === '/api/subscriptions') {
      const { email, zipCode, consent } = await readBody(request)
      if (!consent || !/^\d{5}$/.test(zipCode || '') || !/^\S+@\S+\.\S+$/.test(email || '')) return json(response, 400, { error: 'Enter a valid email, five-digit ZIP code, and accept the terms.' })
      const now = new Date().toISOString()
      db.prepare('INSERT INTO subscriptions (email, zip_code, consented_at, created_at) VALUES (?, ?, ?, ?)').run(email.trim().toLowerCase(), zipCode, now, now)
      return json(response, 201, { message: 'You are subscribed for local test alerts.' })
    }
    if (request.method === 'POST' && request.url === '/api/test-alert') {
      const { zipCode, triggerType = 'dummy_damage_risk' } = await readBody(request)
      if (!/^\d{5}$/.test(zipCode || '')) return json(response, 400, { error: 'Enter a valid five-digit ZIP code.' })
      const message = `Local test alert for ${zipCode}: ${triggerType.replaceAll('_', ' ')} condition detected.`
      const now = new Date().toISOString()
      db.prepare('INSERT INTO notifications (zip_code, trigger_type, message, created_at) VALUES (?, ?, ?, ?)').run(zipCode, triggerType, message, now)
      const recipients = db.prepare('SELECT COUNT(*) AS count FROM subscriptions WHERE zip_code = ?').get(zipCode).count
      return json(response, 201, { message: `${message} Matched ${recipients} local subscriber(s).` })
    }
    if (request.method === 'GET' && request.url === '/api/notifications') return json(response, 200, { notifications: db.prepare('SELECT * FROM notifications ORDER BY id DESC LIMIT 20').all() })
    return json(response, 404, { error: 'Not found' })
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return json(response, 409, { error: 'That email is already subscribed for local alerts.' })
    console.error(error); return json(response, 500, { error: 'Local server error.' })
  }
})

server.listen(port, '127.0.0.1', () => console.log(`Flood Sentry local API: http://127.0.0.1:${port}`))
