import { readFileSync } from 'node:fs'
import { reportParts, residentReportText, trustedAidUrl } from '../src/alertReport.ts'
import { normalizeBrandName } from '../src/branding.ts'

// Inline PNGs work in email clients that do not display SVGs. Keep the live
// wordmark as text so the brand remains readable when images are blocked.
export const emailLogoContentId = 'flood-sentry-wave-shield'
const logoContent = readFileSync(new URL('../public/flood-sentry-wave-shield-email.png', import.meta.url)).toString('base64')
export const emailLogoAttachments = () => [{
  filename: 'flood-sentry-wave-shield.png',
  content: logoContent,
  content_type: 'image/png',
  content_id: emailLogoContentId,
}]
export const emailLogo = () => `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td width="44" style="width:44px;vertical-align:middle;"><img src="cid:${emailLogoContentId}" width="44" height="49" alt="Wave Shield" style="display:block;width:44px;height:49px;border:0;color:#f3f8fb;font-size:10px;"></td><td style="padding-left:12px;color:#f3f8fb!important;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:700;letter-spacing:-.8px;line-height:32px;white-space:nowrap;">FloodSentry</td></tr></table>`

const escapeHtml = value => normalizeBrandName(String(value)).replace(/[&<>'\"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[character]))
const emailParagraphs = value => escapeHtml(value).split(/\n{2,}/).filter(Boolean).map(paragraph => `<p style="margin:0 0 16px;color:#29465c;font-size:16px;line-height:1.65;">${paragraph.replace(/\n/g, '<br>')}</p>`).join('')
const emailDetail = (label, value) => `<tr><td style="padding:14px 0;border-bottom:1px solid #d7e8ef;"><span style="display:block;margin-bottom:4px;color:#5b7384;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;">${escapeHtml(label)}</span><span style="color:#102b46;font-size:15px;line-height:1.45;">${escapeHtml(value || 'Not specified')}</span></td></tr>`
const checkedTime = value => Number.isFinite(Date.parse(value)) ? `${new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })} UTC` : ''
export const residentActionSections = analysis => {
  const { expectedDamage, actions, localHelp } = reportParts(analysis)
  const facilities = localHelp.facilities.map(facility => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:16px 0;border:1px solid #c9e2ee;border-radius:9px;"><tr><td style="padding:18px;word-break:break-word;">
    <h4 style="margin:0 0 8px;color:#102b46;font-size:17px;line-height:1.4;">${escapeHtml(facility.name)}</h4>
    <p style="margin:0 0 8px;color:#29465c;font-size:15px;line-height:1.6;">${escapeHtml(facility.address)}<br>${escapeHtml(facility.county)}, ${escapeHtml(facility.state)}</p>
    <p style="margin:0 0 8px;color:#29465c;font-size:15px;line-height:1.6;">${escapeHtml(facility.services)}</p>
    ${facility.phone ? `<p style="margin:0 0 8px;color:#29465c;font-size:15px;">Phone: ${escapeHtml(facility.phone)}</p>` : ''}
    <p style="margin:0 0 10px;color:#526778;font-size:13px;line-height:1.6;">Opening and capacity: confirm before travel.</p>
    <p style="margin:0;font-size:13px;line-height:1.6;"><a href="${escapeHtml(trustedAidUrl(facility.sourceUrl))}" style="color:#176a8b;">${escapeHtml(facility.sourceTitle)}</a><br><span style="color:#526778;">Details checked: ${escapeHtml(checkedTime(facility.checkedAt))}</span></p>
  </td></tr></table>`).join('')
  return `<h2 style="margin:28px 0 14px;color:#102b46;font-size:22px;line-height:1.25;">Expected damage</h2>
    ${expectedDamage.map(paragraph => emailParagraphs(paragraph)).join('')}
    <h2 style="margin:28px 0 16px;color:#102b46;font-size:22px;line-height:1.25;">How to protect yourself</h2>
    <ol style="margin:0 0 24px;padding-left:24px;color:#29465c;font-size:16px;line-height:1.7;">${actions.map(action => `<li style="padding-left:4px;margin-bottom:12px;">${escapeHtml(action)}</li>`).join('')}</ol>
    <div style="margin:22px 0 8px;padding:20px;background:#eff8fc;border:1px solid #d1e7f1;border-radius:10px;">
      <h3 style="margin:0 0 9px;color:#102b46;font-size:18px;line-height:1.3;">Local shelter and help</h3>
      <p style="margin:0 0 10px;color:#29465c;font-size:14px;line-height:1.6;">${escapeHtml(localHelp.areaLabel)}</p>
      <p style="margin:0;color:#526778;font-size:14px;line-height:1.65;">${escapeHtml(localHelp.notice)}</p>
      ${localHelp.checkedAt ? `<p style="margin:10px 0 0;color:#526778;font-size:12px;">Help information checked: ${escapeHtml(checkedTime(localHelp.checkedAt))}</p>` : ''}
      ${facilities}
      ${localHelp.resources.map(resource => `<p style="margin:17px 0 0;font-size:15px;line-height:1.6;"><a href="${escapeHtml(resource.url)}" style="color:#176a8b;font-weight:700;">${escapeHtml(resource.title)}</a><br><span style="color:#29465c;">${escapeHtml(resource.description)}</span></p>`).join('')}
      <p style="margin:20px 0 0;color:#102b46;font-size:14px;font-weight:700;line-height:1.6;">For a life-threatening emergency, call 911.</p>
    </div>`
}
export const floodSentryEmail = ({ triggerType, message, analysis }) => {
  const areas = Array.isArray(analysis?.areas) && analysis.areas.length ? analysis.areas.join(' · ') : 'Affected area details are included below.'
  const summary = message.replace(/^Internal training scenario[^\n]*\n\n/, '')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#eaf5f9;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">Internal training scenario: ${escapeHtml(triggerType)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eaf5f9;"><tr><td align="center" style="padding:30px 14px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(16,43,70,.14);"><tr><td style="padding:28px 34px;background:#102b46;">${emailLogo()}</td></tr><tr><td style="padding:30px 34px 12px;"><div style="margin-bottom:22px;padding:12px 14px;background:#e2f6fc;border-left:4px solid #5cc9ed;color:#18465f;font-size:13px;line-height:1.5;"><strong>Internal training scenario:</strong> This is not an official emergency alert. For live weather information, follow the National Weather Service and local officials.</div><div style="display:inline-block;margin-bottom:11px;padding:6px 9px;border-radius:999px;background:#102b46;color:#bcefff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">FloodSentry alert</div><h1 style="margin:0 0 10px;color:#102b46;font-size:32px;line-height:1.12;letter-spacing:-1px;">${escapeHtml(triggerType)}</h1><p style="margin:0 0 27px;color:#496477;font-size:17px;line-height:1.55;"><strong style="color:#102b46;">Affected areas:</strong> ${escapeHtml(areas)}</p><h2 style="margin:0 0 14px;color:#102b46;font-size:20px;line-height:1.25;">What you need to know</h2>${emailParagraphs(summary)}${residentActionSections(analysis)}</td></tr><tr><td style="padding:10px 34px 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d7e8ef;">${emailDetail('Report issued', analysis?.issuedAt)}${emailDetail('Report expires', analysis?.expiresAt)}${emailDetail('ZIP-code coverage', analysis?.coverageNotes)}</table></td></tr><tr><td style="padding:21px 34px;background:#102b46;color:#c9e8f2;font-size:12px;line-height:1.55;">FloodSentry helps make weather information easier to understand. This internal training scenario does not replace official emergency instructions.</td></tr></table></td></tr></table></body></html>`
}
export const providedBulletinEmail = ({ triggerType, message, analysis }) => {
  const areas = Array.isArray(analysis?.areas) && analysis.areas.length ? analysis.areas.join(' · ') : 'Affected area details are included below.'
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#eaf5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">FloodSentry alert: ${escapeHtml(triggerType)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eaf5f9;"><tr><td align="center" style="padding:30px 14px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 32px rgba(16,43,70,.14);">
      <tr><td style="padding:28px 34px;background:#102b46;">${emailLogo()}</td></tr>
      <tr><td style="padding:30px 34px 12px;"><div style="margin-bottom:22px;padding:12px 14px;background:#e2f6fc;border-left:4px solid #5cc9ed;color:#18465f;font-size:13px;line-height:1.5;">This summary was prepared from a weather bulletin provided to FloodSentry. Follow local emergency managers and the National Weather Service for official updates.</div><div style="display:inline-block;margin-bottom:11px;padding:6px 9px;border-radius:999px;background:#102b46;color:#bcefff;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">FloodSentry alert</div><h1 style="margin:0 0 10px;color:#102b46;font-size:32px;line-height:1.12;letter-spacing:-1px;">${escapeHtml(triggerType)}</h1><p style="margin:0 0 27px;color:#496477;font-size:17px;line-height:1.55;"><strong style="color:#102b46;">Affected areas:</strong> ${escapeHtml(areas)}</p><h2 style="margin:0 0 14px;color:#102b46;font-size:20px;line-height:1.25;">What you need to know</h2>${emailParagraphs(message)}</td></tr>
      <tr><td style="padding:0 34px 18px;">${residentActionSections(analysis)}</td></tr>
      <tr><td style="padding:10px 34px 30px;"><h2 style="margin:12px 0;color:#102b46;font-size:20px;">Technical details</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #d7e8ef;">${emailDetail('Report issued', analysis?.issuedAt)}${emailDetail('Report expires', analysis?.expiresAt)}${(analysis?.references || []).map(reference => emailDetail(reference.label, reference.value)).join('')}${emailDetail('ZIP-code coverage', analysis?.coverageNotes)}</table><p style="font-size:12px;line-height:1.6;color:#526778;">Bulletin format: <a href="https://www.weather.gov/media/directives/010_pdfs/pd01017001curr.pdf" style="color:#176a8b;">NWSI 10-1701</a>. Event codes: <a href="https://www.weather.gov/vtec/" style="color:#176a8b;">NWSI 10-1703</a>.</p></td></tr>
      <tr><td style="padding:21px 34px;background:#102b46;color:#c9e8f2;font-size:12px;line-height:1.55;">FloodSentry helps make weather information easier to understand. This summary is based on a bulletin provided to FloodSentry and does not replace official emergency instructions.</td></tr>
    </table>
  </td></tr></table>
</body></html>`
}

export function buildAlertEmailContent({ triggerType, message, analysis }) {
  return {
    html: providedBulletinEmail({ triggerType, message, analysis }),
    text: normalizeBrandName(`${residentReportText({ ...analysis, message })}\n\nTechnical details\nIssued: ${analysis?.issuedAt || 'Not specified'}\nExpires: ${analysis?.expiresAt || 'Not specified'}\n${(analysis?.references || []).map(reference => `${reference.label}: ${reference.value}`).join('\n')}\n${analysis?.coverageNotes || ''}`),
    attachments: emailLogoAttachments(),
  }
}
