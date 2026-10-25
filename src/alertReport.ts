export type HelpFacility = {
  name: string; address: string; county: string; state: string; services: string;
  phone: string | null; sourceUrl: string; sourceTitle: string; checkedAt: string;
}
export type HelpResource = { title: string; url: string; description: string }
export type LocalHelp = {
  status: 'found' | 'none_found' | 'unavailable'; areaLabel: string; checkedAt: string | null;
  notice: string; facilities: HelpFacility[]; resources: HelpResource[];
}
export type ResidentReport = {
  message?: string; expectedDamage?: string[]; actions?: string[]; localHelp?: LocalHelp;
}

export const helpResources: HelpResource[] = [
  { title: 'American Red Cross: find open shelters', url: 'https://www.redcross.org/get-help/disaster-relief-and-recovery-services/find-an-open-shelter.html', description: 'Check current shelter listings for your location.' },
  { title: '211: local help', url: 'https://www.211.org/get-help/disaster-recovery', description: 'Call 211 to ask about nearby shelter, food, transport, and other local help.' },
]

// These links are also checked at rendering time, including for old or preview data.
export function trustedAidUrl(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null
    const host = url.hostname.toLowerCase()
    if (!(host.endsWith('.gov') || ['redcross.org', '211.org'].some(domain => host === domain || host.endsWith(`.${domain}`)))) return null
    url.hash = ''
    return url.href
  } catch { return null }
}

const lines = (value: unknown): string[] => Array.isArray(value) ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()) : []

export function reportParts(report: ResidentReport = {}) {
  const damage = lines(report.expectedDamage).slice(0, 2)
  const actions = lines(report.actions).slice(0, 8)
  const help = report.localHelp
  return {
    expectedDamage: damage.length ? damage : ['The bulletin does not provide enough detail to describe expected damage. Check official local updates for more information.'],
    actions: actions.length ? actions : ['Follow the safety instructions in the bulletin and current local alerts.', 'Use the official shelter and help services below if you need assistance.'],
    localHelp: {
      status: help?.status || 'unavailable', areaLabel: help?.areaLabel || 'The affected area', checkedAt: help?.checkedAt || null,
      notice: help?.notice || 'Local facility details could not be checked. Use these official services for current shelter and help information.',
      facilities: (Array.isArray(help?.facilities) ? help.facilities : []).filter(facility => facility &&
        ['name', 'address', 'county', 'state', 'services', 'sourceTitle'].every(field => typeof facility[field as keyof HelpFacility] === 'string') &&
        trustedAidUrl(facility.sourceUrl) && Number.isFinite(Date.parse(facility.checkedAt))),
      resources: helpResources,
    },
  }
}

export function residentReportText(report: ResidentReport = {}) {
  const { expectedDamage, actions, localHelp } = reportParts(report)
  const facilities = localHelp.facilities.map(facility => [
    facility.name, `${facility.address} (${facility.county}, ${facility.state})`, facility.services,
    facility.phone ? `Phone: ${facility.phone}` : '', 'Opening and capacity: confirm before travel.',
    `Source: ${trustedAidUrl(facility.sourceUrl)}`, `Details checked: ${facility.checkedAt}`,
  ].filter(Boolean).join('\n'))
  return [report.message || '', 'Expected damage', expectedDamage.join('\n\n'),
    'How to protect yourself', actions.map((action, index) => `${index + 1}. ${action}`).join('\n'),
    `Local shelter and help — ${localHelp.areaLabel}`, localHelp.notice,
    localHelp.checkedAt ? `Help information checked: ${localHelp.checkedAt}` : '', ...facilities,
    ...localHelp.resources.map(resource => `${resource.title}\n${resource.description}\n${resource.url}`),
    'For a life-threatening emergency, call 911.',
  ].filter(Boolean).join('\n\n')
}
