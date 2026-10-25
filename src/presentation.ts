export type Notification = { id: number; zip_code: string; trigger_type: string; message: string; created_at: string }
export type NotificationGroup = Omit<Notification, 'zip_code'> & { zipCodes: string[] }

// The API stores one row per ZIP. Present those rows as one bulletin.
export function groupNotifications(records: Notification[]): NotificationGroup[] {
  const groups = new Map<string, NotificationGroup>()
  for (const record of records) {
    const key = JSON.stringify([record.created_at, record.trigger_type, record.message])
    const group = groups.get(key)
    if (group) {
      if (!group.zipCodes.includes(record.zip_code)) group.zipCodes.push(record.zip_code)
    } else {
      const { zip_code, ...rest } = record
      groups.set(key, { ...rest, zipCodes: [zip_code] })
    }
  }
  return [...groups.values()]
}

export function explainError(detail: string) {
  if (/RESEND|email|delivery/i.test(detail)) return 'The email could not be sent. Check the delivery details before you try again.'
  if (/OPENAI_API_KEY|HTTP 401/i.test(detail)) return 'The alert service is not connected. Ask the project owner to check the setup.'
  if (/429|quota|rate limit/i.test(detail)) return 'The alert service has reached its usage limit. Try again later or check the account limit.'
  if (/county|ZIP|crosswalk/i.test(detail)) return 'We could not match the affected areas. Check that the bulletin includes a U.S. county and state.'
  if (/40|20,000/i.test(detail)) return 'Paste the complete weather bulletin. Use between 40 and 20,000 characters.'
  if (/timed out|timeout/i.test(detail)) return 'The alert service took too long to respond. Check recent bulletins before you try again.'
  return 'We could not finish this request. Check recent bulletins before you try again; an email may already have been sent.'
}

export const formatDate = (value: string) => new Date(value).toLocaleString(undefined, {
  month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
})

export const processingSteps = [
  { id: 'starting', label: 'Read bulletin' },
  { id: 'areas', label: 'Find affected areas' },
  { id: 'research', label: 'Match ZIP codes' },
  { id: 'zip-codes', label: 'Check coverage' },
  { id: 'message', label: 'Write alert' },
  { id: 'local-help', label: 'Check local shelter and help' },
  { id: 'matching', label: 'Match registrations' },
  { id: 'saving', label: 'Save bulletin' },
  { id: 'sending', label: 'Send email' },
]
