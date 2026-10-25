// Copy identifiers from the supplied bulletin. Never infer or generate a code.
// Format reference: NWSI 10-1701, sections 4.1 and 4.3.
export function extractBulletinReferences(report) {
  if (typeof report !== 'string') return []
  const references = []
  const add = (label, value) => {
    if (value && !references.some(ref => ref.label === label && ref.value === value)) references.push({ label, value })
  }
  const headerPattern = /\b[A-Z]{4}\d{2}[ \t]+[A-Z]{4}[ \t]+\d{6}(?:[ \t]+(?:AA|CC|RR)[A-Z])?\b/g
  for (const header of report.matchAll(headerPattern)) {
    add('WMO header', header[0])
    // AWIPS IDs immediately follow the WMO header. Do not search narrative text.
    const awips = report.slice(header.index + header[0].length).match(/^\s+([A-Z0-9]{6})\b/)
    if (awips) add('AWIPS product ID', awips[1])
  }
  const ugcPattern = /\b[A-Z]{2}[CZ]\d{3}(?:>\d{3})?(?:-\s*(?:[A-Z]{2}[CZ])?\d{3}(?:>\d{3})?)*-\s*\d{6}-?/g
  for (const code of report.matchAll(ugcPattern)) add('UGC area code', code[0])
  // Accept the missing Z suffix in pasted historical examples, without correcting it.
  const vtecPattern = /\/[OTEX]\.[A-Z]{3}\.[A-Z0-9]{4}\.[A-Z]{2}\.[A-Z]\.\d{4}\.\d{6}T\d{4}Z?-\d{6}T\d{4}Z?\//g
  for (const code of report.matchAll(vtecPattern)) add('VTEC (as supplied)', code[0])
  return references
}
