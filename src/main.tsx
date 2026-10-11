import { StrictMode, useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, CloudLightning, Menu, Snowflake, Wind, X } from 'lucide-react'
import './styles.css'

type Storm = { id: string; title: string; summary: string; detail: string; image: string; icon: typeof Wind }
type Notification = { id: number; zip_code: string; trigger_type: string; message: string; created_at: string }
type Registration = { id: number; email: string; zip_code: string; consented_at: string; created_at: string }

function handleRouteClick(event: MouseEvent<HTMLAnchorElement>) {
  const href = event.currentTarget.getAttribute('href')
  if (!href || !href.startsWith('/') || href.startsWith('/#') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  window.dispatchEvent(new CustomEvent('flood-sentry:navigate', { detail: { href } }))
}

const storms: Storm[] = [
  { id: 'thunderstorms', title: 'Thunderstorms', summary: 'The atmosphere puts on a light show.', detail: 'A thunderstorm is a local storm produced by a cumulonimbus cloud and accompanied by lightning and thunder. Severe thunderstorms can produce hail at least 1 inch in diameter or wind gusts of 58 mph or higher.', image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1400&q=85', icon: CloudLightning },
  { id: 'tornadoes', title: 'Tornadoes', summary: 'Small in scale. Enormous in force.', detail: 'A tornado is a violently rotating column of air extending from the base of a thunderstorm down to the ground. They can occur at any time of day or night and at any time of year.', image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1400&q=85', icon: Wind },
  { id: 'hurricanes', title: 'Hurricanes', summary: 'A vast engine powered by warm ocean water.', detail: 'Hurricanes are tropical cyclones with maximum sustained winds of 74 mph or greater. Their hazards include storm surge, flooding, extreme winds, and tornadoes.', image: '/images/hurricane-weather-scene.png', icon: ArrowUpRight },
  { id: 'blizzards', title: 'Blizzards', summary: 'When snow and wind erase the horizon.', detail: 'A blizzard is a winter storm with frequent wind gusts of at least 35 mph and falling or blowing snow that reduces visibility to a quarter mile or less for at least three hours.', image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1400&q=85', icon: Snowflake },
]

function Logo() { return <a className="logo" href="/" onClick={handleRouteClick} aria-label="Flood Sentry home"><span className="logo-mark">✳</span><span className="logo-wordmark"><span className="logo-flood">Flood</span><span className="logo-sentry">Sentry</span></span></a> }

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="header"><Logo /><nav className={open ? 'nav open' : 'nav'}><a href="/" onClick={event => { close(); handleRouteClick(event) }}>Home</a><a href="/register" onClick={event => { close(); handleRouteClick(event) }}>Register</a><a href="/registrations" onClick={event => { close(); handleRouteClick(event) }}>Registrations</a><a href="/bulletin" onClick={event => { close(); handleRouteClick(event) }}>Provide bulletin</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></header>
}

function Card({ storm }: { storm: Storm }) {
  const Icon = storm.icon
  return <article className="storm-card" id={storm.id}><div className="storm-image"><img src={storm.image} alt={`${storm.title} weather scene`} loading="lazy" /><span className="storm-icon"><Icon size={21} /></span></div><div className="storm-copy"><p className="eyebrow">Storm type / field guide</p><h3>{storm.title}</h3><p className="lead">{storm.summary}</p><p>{storm.detail}</p><a className="text-link" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">Safety guidance <ArrowUpRight size={16} /></a></div></article>
}

function SubscribeForm() {
  const [status, setStatus] = useState('')
  const [email, setEmail] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [consent, setConsent] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setStatus('Saving locally…')
    try {
      const response = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, zipCode, consent }) })
      const result = await response.json(); setStatus(result.message || result.error)
      if (response.ok) { setEmail(''); setZipCode(''); setConsent(false) }
    } catch { setStatus('Start the local API with npm run dev:api first.') }
  }
  return <form onSubmit={submit} className="registration-form"><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>U.S. ZIP code<input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zipCode} onChange={event => setZipCode(event.target.value)} placeholder="00000" required /></label><label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /> I agree to receive local flood alerts.</label><button className="button" type="submit">Register for alerts <ArrowUpRight size={17} /></button>{status && <p className="form-status" role="status">{status}</p>}</form>
}

function RegisterPage() {
  return <><Header /><main className="page-shell"><section className="page-intro"><p className="eyebrow">Local preview / email alerts</p><h1>Stay ahead<br /><em>of the weather.</em></h1><p>Register by ZIP code for local alerts. Your registration is stored on this computer, and provided weather bulletins can send email through the configured Resend account.</p></section><section className="register-card"><SubscribeForm /></section></main><Footer /></>
}

function AccountPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('Creating your local account…')
    try {
      const response = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, consent }) })
      const result = await response.json()
      setStatus(result.message || result.error || 'The account could not be created.')
      if (response.ok) { setName(''); setEmail(''); setPassword(''); setConsent(false) }
    } catch { setStatus('Start the local API with npm run dev:api first.') }
  }
  return <><Header /><main className="page-shell account-page"><section className="page-intro"><h1>Set up your<br /><em>Flood Sentry account.</em></h1><p>Save your account details and stay ready for local storm risk.</p></section><section className="account-card"><h2>Account details</h2><form onSubmit={submit} className="registration-form account-form"><label>Full name<input type="text" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Your full name" required /></label><label>Email address<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Create a password" minLength={12} required /></label><label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /> I agree to save my information to create a local Flood Sentry account.</label><button className="button" type="submit">Create account <ArrowUpRight size={17} /></button>{status && <p className="form-status" role="status">{status}</p>}</form><p className="account-note">Account sign-in is not included in this local prototype yet.</p></section></main><Footer /></>
}

function ErrorModal({ title = 'The event could not finish cleanly.', message, onClose }: { title?: string; message: string; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><section className="error-modal" role="alertdialog" aria-modal="true" aria-labelledby="simulator-error-title" aria-describedby="simulator-error-message"><button className="modal-close" type="button" onClick={onClose} aria-label="Dismiss error"><X size={20} /></button><span className="modal-icon" aria-hidden="true">!</span><p className="eyebrow error-eyebrow">Simulator error</p><h2 id="simulator-error-title">{title}</h2><p id="simulator-error-message">{message}</p><button className="button" type="button" onClick={onClose}>Dismiss</button></section></div>
}

function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [status, setStatus] = useState('Loading registrations…')
  const loadRegistrations = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setRegistrations(result.subscriptions || [])
      setStatus('')
    } catch { setStatus('Start the local API with npm run dev:api first.') }
  }
  useEffect(() => { void loadRegistrations() }, [])
  return <><Header /><main className="page-shell"><section className="page-intro"><p className="eyebrow">Local-only subscriber directory</p><h1>Current<br /><em>registrations.</em></h1><p>Review the people registered for local alerts. This page reads from the SQLite database on this computer and is not protected by login.</p></section><section className="registrations-card"><div className="registrations-heading"><p className="eyebrow">{registrations.length} registered subscriber{registrations.length === 1 ? '' : 's'}</p><button className="button small-button" type="button" onClick={() => void loadRegistrations()}>Refresh</button></div>{status ? <p className="form-status" role="status">{status}</p> : registrations.length === 0 ? <p className="empty-state">No users have registered yet.</p> : <div className="registration-table-wrap"><table className="registration-table"><thead><tr><th>Email</th><th>ZIP code</th><th>Consented</th><th>Registered</th></tr></thead><tbody>{registrations.map(registration => <tr key={registration.id}><td>{registration.email}</td><td>{registration.zip_code}</td><td>{new Date(registration.consented_at).toLocaleString()}</td><td>{new Date(registration.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>}</section></main><Footer /></>
}

type WeatherAnalysis = {
  eventType: string; areas: string[]; issuedAt: string; expiresAt: string; coverageNotes: string;
  zipCodes: { zipCode: string; area: string; evidence: string; sourceUrl: string }[];
  sources: { url: string; title: string }[]; subject: string; message: string;
}
type ProcessingStage = { id: string; label: string }
type ProgressStage = ProcessingStage & { receivedAt: number }
type BulletinTiming = Pick<WeatherAnalysis, 'issuedAt' | 'expiresAt'>
type DeliveryResult = { status: string; sent: number; failed: number; details?: string[] }
type SimulationResult = { analysis: WeatherAnalysis; message: string; email: DeliveryResult }
type SimulatorIssue = { title: string; message: string }

const formatElapsed = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

const simulationSteps: Array<ProcessingStage & { detail: string }> = [
  { id: 'starting', label: 'Preparing the weather report', detail: 'Opening a live connection to process the provided bulletin.' },
  { id: 'areas', label: 'Identifying affected counties and cities', detail: 'Reading the bulletin for the hazard, places, and timing.' },
  { id: 'research', label: 'Researching ZIP-code coverage from trusted sources', detail: 'Searching for evidence that connects the named areas to ZIP codes.' },
  { id: 'zip-codes', label: 'Reviewing affected ZIP-code coverage', detail: 'Checking the geographic matches before any alert can be sent.' },
  { id: 'verification', label: 'Verifying ZIP-code sources', detail: 'Cross-checking sources when the first lookup needs more evidence.' },
  { id: 'message', label: 'Drafting the resident message', detail: 'Writing a clear, local message from the verified report.' },
  { id: 'matching', label: 'Matching registered subscribers', detail: 'Finding local registrations in the affected ZIP codes.' },
  { id: 'saving', label: 'Saving the local alert record', detail: 'Recording this bulletin in the local database.' },
  { id: 'sending', label: 'Sending the alert to the delivery inbox', detail: 'Handing the email to Resend for delivery.' },
]

const stageDetail = (stage: ProcessingStage) => simulationSteps.find(step => step.id === stage.id)?.detail || 'Flood Sentry is working on this step.'

async function readSimulationStream(response: Response, onEvent: (event: { type: string; stage?: ProcessingStage; result?: SimulationResult; error?: string }) => void) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream')) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'The simulator returned an unexpected error.')
  }
  if (!response.body) throw new Error('The simulator did not return a progress stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
    const events = buffer.split('\n\n')
    buffer = events.pop() || ''
    for (const item of events) {
      const data = item.split('\n').find(line => line.startsWith('data: '))?.slice(6)
      if (data) onEvent(JSON.parse(data))
    }
    if (done) break
  }
  if (buffer.trim()) {
    const data = buffer.split('\n').find(line => line.startsWith('data: '))?.slice(6)
    if (data) onEvent(JSON.parse(data))
  }
}

function SimulatorPage() {
  const [weatherReport, setWeatherReport] = useState('')
  const [busy, setBusy] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [stages, setStages] = useState<ProgressStage[]>([])
  const [analysis, setAnalysis] = useState<WeatherAnalysis | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<SimulatorIssue | null>(null)
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null)
  const [historyError, setHistoryError] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [bulletinTiming, setBulletinTiming] = useState<BulletinTiming | null>(null)
  const simulationStartedAt = useRef<number | null>(null)
  const lastProcessedBulletin = useRef('')

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      const result = await response.json()
      if (!response.ok) throw new Error()
      setNotifications(result.notifications || [])
      setHistoryError('')
    } catch { setHistoryError('Recent events could not be loaded. Please check the local server.') }
  }
  useEffect(() => { void loadNotifications() }, [])
  useEffect(() => {
    if (!busy) return
    const updateElapsed = () => setElapsedSeconds(Math.floor((Date.now() - (simulationStartedAt.current || Date.now())) / 1000))
    updateElapsed()
    const timer = window.setInterval(updateElapsed, 250)
    return () => window.clearInterval(timer)
  }, [busy])

  const receiveStage = (stage: ProcessingStage) => {
    const receivedAt = Math.floor((Date.now() - (simulationStartedAt.current || Date.now())) / 1000)
    setStages(current => current.some(item => item.id === stage.id) ? current : [...current, { ...stage, receivedAt }])
  }

  const provideBulletin = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    simulationStartedAt.current = Date.now()
    setBusy(true); setElapsedSeconds(0); setStages([{ id: 'starting', label: 'Preparing the weather report', receivedAt: 0 }]); setAnalysis(null); setDelivery(null); setError(null); setStatus('')
    let finalResult: SimulationResult | undefined
    try {
      const response = await fetch('/api/weather-bulletins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weatherReport }) })
      await readSimulationStream(response, update => {
        if ((update.type === 'stage' || update.type === 'connected' || update.type === 'heartbeat') && update.stage) receiveStage(update.stage)
        if (update.type === 'error') throw new Error(update.error || 'The simulator returned an unexpected error.')
        if (update.type === 'complete' && update.result) finalResult = update.result
      })
      if (!finalResult) throw new Error('The simulator finished without a result.')
      setAnalysis(finalResult.analysis)
      setBulletinTiming({ issuedAt: finalResult.analysis.issuedAt, expiresAt: finalResult.analysis.expiresAt })
      lastProcessedBulletin.current = weatherReport.trim()
      setDelivery(finalResult.email)
      setStatus(finalResult.message)
      if (finalResult.email.status === 'not_configured') setError({ title: 'Email delivery is not configured.', message: finalResult.email.details?.join(' ') || 'The event was saved, but no email was sent. Add RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the API.' })
      if (finalResult.email.status === 'partial_failure') setError({ title: 'Alert delivery needs attention.', message: `The bulletin was saved. ${finalResult.email.sent} email(s) sent and ${finalResult.email.failed} failed. ${finalResult.email.details?.join(' ') || 'Resend did not provide more detail.'} Providing the bulletin again sends a new email to the delivery inbox.` })
      await loadNotifications()
    } catch (cause) {
      setStatus('')
      setError({ title: 'The bulletin could not finish processing.', message: cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError) ? cause.message : 'Flood Sentry lost contact with the local API. Check recent events before trying again; an alert may already have been saved or sent.' })
    } finally { setBusy(false); simulationStartedAt.current = null }
  }
  const activeStage = stages[stages.length - 1] || { id: 'starting', label: 'Preparing the weather report', receivedAt: 0 }
  const activeStepIndex = simulationSteps.findIndex(step => step.id === activeStage.id)
  const completedStepIds = new Set(stages.map(stage => stage.id))
  const activeStepElapsed = Math.max(0, elapsedSeconds - activeStage.receivedAt)
  return <><Header /><main className="page-shell">
    <section className="page-intro"><p className="eyebrow">Weather bulletin</p><h1>Provide a weather<br /><em>bulletin.</em></h1><p>Paste a weather bulletin to identify affected ZIP codes and prepare a clear alert. Each bulletin sends one email to the delivery inbox; subscriber matches are shown for reference only.</p></section>
    <section className="simulator-card weather-report-card">
      <form onSubmit={provideBulletin} aria-busy={busy}>
        <label htmlFor="weather-report">Weather bulletin</label>
        <textarea id="weather-report" value={weatherReport} onChange={event => { const nextBulletin = event.target.value; setWeatherReport(nextBulletin); if (nextBulletin.trim() !== lastProcessedBulletin.current) setBulletinTiming(null) }} rows={17} minLength={40} maxLength={20000} required disabled={busy} placeholder="Paste the complete weather bulletin here…" aria-describedby="report-help" />
        <p id="report-help">Paste the full bulletin, including affected places and state. ZIP coverage is estimated from the places named in the report.</p>
        <button className="button" type="submit" disabled={busy}>{busy ? 'Processing bulletin…' : 'Prepare and send alert'} <ArrowUpRight size={17} /></button>
        {status && <p className="form-status success-status" role="status">{status}</p>}
      </form>
    </section>
    {bulletinTiming && <section className="bulletin-timing" aria-label="Most recent bulletin timing"><p>Most recent bulletin timing</p><div><span>Issued</span><strong>{bulletinTiming.issuedAt}</strong></div><div><span>Expires</span><strong>{bulletinTiming.expiresAt}</strong></div></section>}
    {busy && <section className="simulation-progress" aria-live="polite" aria-label="Bulletin processing progress">
      <div><p className="eyebrow">Live processing</p><h2>Working through<br />the <em>report.</em></h2></div>
      <div className="elapsed-time"><span>Time in this step</span><strong>{formatElapsed(activeStepElapsed)}</strong><small><i aria-hidden="true" /> Live connection active</small></div>
      <div className="progress-now"><span className="progress-kicker">Now working on</span><strong>{activeStage.label}</strong><p>{stageDetail(activeStage)}</p><div className="progress-track" aria-hidden="true"><span style={{ width: `${Math.max(8, ((Math.max(activeStepIndex, 0) + 1) / simulationSteps.length) * 100)}%` }} /></div><small>Updates appear as each task completes. Source research can take a little while.</small></div>
      <ol className="progress-steps">{simulationSteps.map((step, index) => {
        const skipped = step.id === 'verification' && activeStepIndex > index && !completedStepIds.has(step.id)
        const complete = completedStepIds.has(step.id) && step.id !== activeStage.id
        const current = step.id === activeStage.id
        return <li key={step.id} className={current ? 'current' : complete ? 'complete' : skipped ? 'skipped' : 'pending'}><span>{current ? '●' : complete ? '✓' : skipped ? '–' : String(index + 1).padStart(2, '0')}</span><div><strong>{step.label}</strong><small>{current ? `In progress · ${formatElapsed(activeStepElapsed)}` : complete ? 'Completed' : skipped ? 'Not needed for this report' : 'Waiting to begin'}</small></div></li>
      })}</ol>
    </section>}
    {analysis && <section className="notifications-card weather-results" aria-label="Bulletin results">
      <h2>Bulletin results</h2>
      <p><strong>{analysis.eventType}</strong> — {analysis.areas.join(', ')}</p>
      <p>Report issued: {analysis.issuedAt}<br />Report expires: {analysis.expiresAt}</p>
      <h3>Affected ZIP codes ({analysis.zipCodes.length})</h3>
      <p>{analysis.coverageNotes}</p>
      <ul className="zip-results">{analysis.zipCodes.map(zip => <li key={zip.zipCode}><strong>{zip.zipCode}</strong> — {zip.area}<p>{zip.evidence} <a href={zip.sourceUrl} target="_blank" rel="noreferrer">Source for {zip.zipCode} ↗</a></p></li>)}</ul>
      <h3>Resident alert</h3><strong>{analysis.subject}</strong><p className="alert-message">{analysis.message}</p>
      {delivery && <section className={`delivery-summary delivery-${delivery.status}`}><h3>Email delivery</h3><p><strong>{delivery.sent} sent</strong> · {delivery.failed} failed</p>{delivery.details?.length ? <ul>{delivery.details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul> : delivery.status === 'sent' ? <p>Resend accepted the email for delivery to the dedicated inbox.</p> : <p>No email was accepted for delivery. The delivery inbox is used for every provided bulletin.</p>}</section>}
      <details><summary>Lookup sources</summary><ul>{analysis.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
    </section>}
    <section className="notifications-card weather-results"><h2>Recent bulletins</h2>
      {historyError ? <p role="alert">{historyError}</p> : notifications.length === 0 ? <p className="empty-state">No bulletins have been provided yet.</p> : <div className="notification-list">{notifications.map(notification => <article key={notification.id}><strong>{notification.trigger_type.split('_').join(' ')}</strong><span>{notification.zip_code}</span><p className="alert-message">{notification.message}</p><time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time></article>)}</div>}
    </section>
  </main><Footer />{error && <ErrorModal title={error.title} message={error.message} onClose={() => setError(null)} />}</>
}

function HomePage() {
  return <>
    <Header />
    <main>
      <section className="hero"><div>
        <p className="eyebrow"><span className="pulse" /> A field guide to severe weather</p>
        <h1>When the sky<br />gets <em>serious.</em></h1>
        <p className="hero-text"><strong>The Purpose:</strong> Flood Sentry helps people get ahead of storm risk with local forecasts and alerts—giving communities more time to prepare, protect one another, and save lives.</p>
        <div className="hero-actions"><a className="button" href="#atlas">Explore the guide <ArrowDown size={17} /></a><a className="button secondary" href="/register" onClick={handleRouteClick}>Register for alerts <ArrowUpRight size={17} /></a></div>
      </div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-sun" /></div></section>
      <section className="why section" id="why"><div><h2>Why <em>Flood<br />Sentry?</em></h2></div><div className="why-copy"><p>Emergency alerts often arrive while a storm is already unfolding. When danger moves quickly, people may have too little time to understand the risk, reach safety, and take the measures that protect their families and neighbors.</p><p>Flood Sentry was inspired by the July 2025 Central Texas floods. More than two dozen campers and counselors died at Camp Mystic, and the tragedy brought urgent attention to warning and evacuation timing. This project starts with a simple idea: earlier, clearer local information can give people more time to act.</p><a className="text-link" href="https://www.house.texas.gov/pdfs/committees/355/Report-on-the-Camp-Mystic-Flood-Disaster-of-July-4-2025.pdf?d=06182026" target="_blank" rel="noreferrer">Read the Texas House investigation <ArrowUpRight size={16} /></a></div></section>
      <section className="intro section"><div><p className="eyebrow">The big picture</p><h2>Every storm<br />has a <em>story.</em></h2></div><p>Storms are disturbances in the atmosphere, ranging from a brief thunderstorm to a sprawling tropical cyclone. Their shapes, ingredients, and hazards are different—but understanding the basics helps us make better decisions.</p></section>
      <section className="atlas section" id="atlas"><div className="section-heading"><div><p className="eyebrow">The guide / 04 entries</p><h2>Meet the <em>forces.</em></h2></div><p>Explore four of Earth’s most powerful weather systems.</p></div><div className="storm-grid">{storms.map(storm => <Card key={storm.id} storm={storm} />)}</div></section>
      <section className="tools-section section"><div className="section-heading"><div><p className="eyebrow">Flood Sentry tools</p><h2>Stay <em>connected.</em></h2></div><p>Register for local alerts, review current subscribers, or provide a weather bulletin from one place.</p></div><div className="tools-grid"><a className="tool-card" href="/register" onClick={handleRouteClick}><span className="tool-number">01</span><strong>Register for alerts</strong><p>Join the local ZIP-code alert list.</p><ArrowUpRight size={19} /></a><a className="tool-card" href="/registrations" onClick={handleRouteClick}><span className="tool-number">02</span><strong>Current registrations</strong><p>Review the local subscriber directory.</p><ArrowUpRight size={19} /></a><a className="tool-card" href="/bulletin" onClick={handleRouteClick}><span className="tool-number">03</span><strong>Provide a weather bulletin</strong><p>Prepare a local flood alert from a supplied bulletin.</p><ArrowUpRight size={19} /></a></div></section>
      <section className="safety section" id="safety"><div><h2>Watch means<br /><em>be ready.</em></h2><p className="safety-text">Warning means take action. Have more than one way to receive alerts, know where you will shelter, and follow instructions from your local emergency managers.</p><a className="button dark" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">NWS safety hub <ArrowUpRight size={17} /></a></div><div className="safety-steps"><div><strong>01</strong><span>Get inside</span><p>Put walls between you and the weather.</p></div><div><strong>02</strong><span>Get informed</span><p>Use NOAA Weather Radio or official alerts.</p></div><div><strong>03</strong><span>Stay put</span><p>Wait for the all-clear from officials.</p></div></div></section>
      <section className="sources section" id="sources"><p className="eyebrow">Keep exploring</p><h2>Built from<br /><em>good sources.</em></h2><div className="source-list"><a href="https://www.weather.gov/spotterguide/types" target="_blank" rel="noreferrer"><span>NOAA / National Weather Service</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/hurricane" target="_blank" rel="noreferrer"><span>Hurricane safety & science</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/tornado" target="_blank" rel="noreferrer"><span>Tornado safety & science</span><ArrowUpRight size={16} /></a></div></section>
    </main><Footer />
  </>
}

function Footer() { return <footer><Logo /><p>Educational guide · Always follow local official guidance.</p><a href="/" onClick={handleRouteClick}>Back to top ↑</a></footer> }

function App() {
  const readPath = () => window.location.pathname.replace(/\/$/, '') || '/'
  const [path, setPath] = useState(readPath)
  const [transition, setTransition] = useState<'idle' | 'leaving' | 'entering'>('idle')
  useEffect(() => {
    const navigate = (event: Event) => {
      const href = (event as CustomEvent<{ href: string }>).detail.href
      if (href === window.location.pathname) return
      setTransition('leaving')
      window.setTimeout(() => {
        window.history.pushState({}, '', href)
        setPath(readPath())
        setTransition('entering')
        window.setTimeout(() => setTransition('idle'), 420)
      }, 180)
    }
    const handlePopState = () => { setPath(readPath()); setTransition('entering'); window.setTimeout(() => setTransition('idle'), 420) }
    window.addEventListener('flood-sentry:navigate', navigate)
    window.addEventListener('popstate', handlePopState)
    return () => { window.removeEventListener('flood-sentry:navigate', navigate); window.removeEventListener('popstate', handlePopState) }
  }, [])
  // AccountPage and its local API are intentionally retained but hidden until the account experience is ready to return.
  const page = path === '/register' ? <RegisterPage /> : path === '/registrations' ? <RegistrationsPage /> : path === '/bulletin' || path === '/simulate' ? <SimulatorPage /> : <HomePage />
  return <div className={`route-frame route-${transition}`} key={path}>{page}</div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
