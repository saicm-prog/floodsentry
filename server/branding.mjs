import { normalizeBrandName } from '../src/branding.ts'

// Change only the product name in saved reports. Preserve IDs, dates, ZIPs,
// registrations, and all other bulletin content. Safe to run on every startup.
export function migrateNotificationBranding(db) {
  const changes = db.prepare('SELECT id, message FROM notifications').all()
    .map(row => ({ ...row, updated: normalizeBrandName(row.message) }))
    .filter(row => row.message !== row.updated)
  if (!changes.length) return 0
  db.exec('BEGIN')
  try {
    const update = db.prepare('UPDATE notifications SET message = ? WHERE id = ?')
    for (const row of changes) update.run(row.updated, row.id)
    db.exec('COMMIT')
  } catch (error) { db.exec('ROLLBACK'); throw error }
  return changes.length
}
