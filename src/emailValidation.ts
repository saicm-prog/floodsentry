export type EmailValidation = { valid: boolean; normalized: string; error: string }

// Practical ASCII mailbox syntax for this app, not inbox or ownership verification.
// Preserve the app's existing case-insensitive email storage. Never remove dots,
// plus tags, or other characters that could identify a different mailbox.
export function validateEmail(value: unknown): EmailValidation {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  const invalid = (error: string): EmailValidation => ({ valid: false, normalized, error })
  if (!normalized) return invalid('Enter your email address.')
  if (normalized.length > 254) return invalid('Keep the email address under 255 characters.')
  if (/\s/.test(normalized)) return invalid('Remove spaces from the email address.')
  const parts = normalized.split('@')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return invalid('Enter an address like name@example.com.')
  const [local, domain] = parts
  if (local.length > 64) return invalid('Keep the part before @ under 65 characters.')
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return invalid('Use a standard email address like name@example.com.')
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return invalid('Check the dots before @. Avoid repeated dots or dots at either end.')
  }
  const labels = domain.split('.')
  if (labels.length < 2 || labels.some(label => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))) {
    return invalid('Check the domain after @. Use a full domain like example.com.')
  }
  return { valid: true, normalized, error: '' }
}

export function isValidEmail(value: unknown): boolean {
  return validateEmail(value).valid
}
