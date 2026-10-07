import { StrictMode, useEffect, useState, type FormEvent, type MouseEvent } from 'react'
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

function Logo() { return <a className="logo" href="/" onClick={handleRouteClick} aria-label="Flood Sentry home"><span className="logo-mark">✳</span><span>flood sentry</span></a> }

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="header"><Logo /><nav className={open ? 'nav open' : 'nav'}><a href="/" onClick={event => { close(); handleRouteClick(event) }}>Home</a><a href="/register" onClick={event => { close(); handleRouteClick(event) }}>Register</a><a href="/registrations" onClick={event => { close(); handleRouteClick(event) }}>Registrations</a><a href="/simulate" onClick={event => { close(); handleRouteClick(event) }}>Simulate event</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></header>
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
  return <form onSubmit={submit} className="registration-form"><label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>U.S. ZIP code<input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zipCode} onChange={event => setZipCode(event.target.value)} placeholder="00000" required /></label><label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required /> I agree to receive local test alerts.</label><button className="button" type="submit">Register for alerts <ArrowUpRight size={17} /></button>{status && <p className="form-status" role="status">{status}</p>}</form>
}

function RegisterPage() {
  return <><Header /><main className="page-shell"><section className="page-intro"><p className="eyebrow">Local preview / email alerts</p><h1>Stay ahead<br /><em>of the weather.</em></h1><p>Register by ZIP code for local alerts. Your registration is stored on this computer, and matching simulated events can send email through the configured Resend account.</p></section><section className="register-card"><SubscribeForm /></section></main><Footer /></>
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
type DeliveryResult = { status: string; sent: number; failed: number; details?: string[] }
type SimulationResult = { analysis: WeatherAnalysis; message: string; email: DeliveryResult }
type SimulatorIssue = { title: string; message: string }

const formatElapsed = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

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
  const [stages, setStages] = useState<ProcessingStage[]>([])
  const [analysis, setAnalysis] = useState<WeatherAnalysis | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState<SimulatorIssue | null>(null)
  const [delivery, setDelivery] = useState<DeliveryResult | null>(null)
  const [historyError, setHistoryError] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])

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
    const startedAt = Date.now()
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250)
    return () => window.clearInterval(timer)
  }, [busy])

  const receiveStage = (stage: ProcessingStage) => setStages(current => current.some(item => item.id === stage.id) ? current : [...current, stage])

  const sendTest = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    setBusy(true); setElapsedSeconds(0); setStages([{ id: 'starting', label: 'Starting report analysis' }]); setAnalysis(null); setDelivery(null); setError(null); setStatus('')
    let finalResult: SimulationResult | undefined
    try {
      const response = await fetch('/api/test-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weatherReport }) })
      await readSimulationStream(response, update => {
        if (update.type === 'stage' && update.stage) receiveStage(update.stage)
        if (update.type === 'error') throw new Error(update.error || 'The simulator returned an unexpected error.')
        if (update.type === 'complete' && update.result) finalResult = update.result
      })
      if (!finalResult) throw new Error('The simulator finished without a result.')
      setAnalysis(finalResult.analysis)
      setDelivery(finalResult.email)
      setStatus(finalResult.message)
      if (finalResult.email.status === 'not_configured') setError({ title: 'Email delivery is not configured.', message: finalResult.email.details?.join(' ') || 'The event was saved, but no email was sent. Add RESEND_API_KEY and RESEND_FROM_EMAIL to .env, then restart the API.' })
      if (finalResult.email.status === 'partial_failure') setError({ title: 'Alert delivery needs attention.', message: `The event was saved. ${finalResult.email.sent} email(s) sent and ${finalResult.email.failed} failed. ${finalResult.email.details?.join(' ') || 'Resend did not provide more detail.'} Running the simulator again sends another test email to every matching subscriber.` })
      await loadNotifications()
    } catch (cause) {
      setStatus('')
      setError({ title: 'The simulation could not finish.', message: cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError) ? cause.message : 'The simulator lost contact with the local API. Check recent events before trying again; an event may already have been saved or sent.' })
    } finally { setBusy(false) }
  }
  return <><Header /><main className="page-shell">
    <section className="page-intro"><p className="eyebrow">Developer simulator</p><h1>Simulate a<br /><em>weather report.</em></h1><p>Paste a weather bulletin to find affected ZIP codes and send a tailored test alert to matching subscribers.</p></section>
    <section className="simulator-card weather-report-card">
      <form onSubmit={sendTest} aria-busy={busy}>
        <label htmlFor="weather-report">Weather report</label>
        <textarea id="weather-report" value={weatherReport} onChange={event => setWeatherReport(event.target.value)} rows={17} minLength={40} maxLength={20000} required disabled={busy} placeholder="Paste the complete weather bulletin here…" aria-describedby="report-help" />
        <p id="report-help">Paste the full report, including the affected places and state. Emails are labeled TEST, and ZIP coverage is estimated from the places named in the report.</p>
        <button className="button" type="submit" disabled={busy}>{busy ? 'Processing report…' : 'Simulate and send test alerts'} <ArrowUpRight size={17} /></button>
        {status && <p className="form-status success-status" role="status">{status}</p>}
      </form>
    </section>
    {busy && <section className="simulation-progress" aria-live="polite" aria-label="Simulation progress">
      <div><p className="eyebrow">Processing</p><h2>Working through<br />the <em>report.</em></h2></div>
      <div className="elapsed-time"><span>Elapsed time</span><strong>{formatElapsed(elapsedSeconds)}</strong></div>
      <ol>{stages.map((stage, index) => <li key={stage.id} className={index === stages.length - 1 ? 'current' : 'complete'}><span>{index === stages.length - 1 ? '●' : '✓'}</span>{stage.label}</li>)}</ol>
    </section>}
    {analysis && <section className="notifications-card weather-results" aria-label="Simulation results">
      <h2>Simulation results</h2>
      <p><strong>{analysis.eventType}</strong> — {analysis.areas.join(', ')}</p>
      <p>Report issued: {analysis.issuedAt}<br />Report expires: {analysis.expiresAt}</p>
      <h3>Affected ZIP codes ({analysis.zipCodes.length})</h3>
      <p>{analysis.coverageNotes}</p>
      <ul className="zip-results">{analysis.zipCodes.map(zip => <li key={zip.zipCode}><strong>{zip.zipCode}</strong> — {zip.area}<p>{zip.evidence} <a href={zip.sourceUrl} target="_blank" rel="noreferrer">Source for {zip.zipCode} ↗</a></p></li>)}</ul>
      <h3>Resident alert</h3><strong>{analysis.subject}</strong><p className="alert-message">{analysis.message}</p>
      {delivery && <section className={`delivery-summary delivery-${delivery.status}`}><h3>Email delivery</h3><p><strong>{delivery.sent} sent</strong> · {delivery.failed} failed</p>{delivery.details?.length ? <ul>{delivery.details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul> : delivery.status === 'sent' ? <p>Resend accepted every matching email for delivery.</p> : <p>No registered subscriber matched the affected ZIP codes.</p>}</section>}
      <details><summary>Lookup sources</summary><ul>{analysis.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul></details>
    </section>}
    <section className="notifications-card weather-results"><h2>Recent local events</h2>
      {historyError ? <p role="alert">{historyError}</p> : notifications.length === 0 ? <p className="empty-state">No simulated events yet.</p> : <div className="notification-list">{notifications.map(notification => <article key={notification.id}><strong>{notification.trigger_type.split('_').join(' ')}</strong><span>{notification.zip_code}</span><p className="alert-message">{notification.message}</p><time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time></article>)}</div>}
    </section>
  </main><Footer />{error && <ErrorModal title={error.title} message={error.message} onClose={() => setError(null)} />}</>
}

function HomePage() {
  return <><Header /><main><section className="hero"><div><p className="eyebrow"><span className="pulse" /> A field guide to severe weather</p><h1>When the sky<br />gets <em>serious.</em></h1><p className="hero-text">Flood Sentry is a clear, visual introduction to the forces that shape our atmosphere—and how to stay ready when they arrive.</p><div className="hero-actions"><a className="button" href="#atlas">Explore the guide <ArrowDown size={17} /></a><a className="button secondary" href="/register" onClick={handleRouteClick}>Register for alerts <ArrowUpRight size={17} /></a></div></div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-sun" /></div></section><section className="intro section"><div><p className="eyebrow">The big picture</p><h2>Every storm<br />has a <em>story.</em></h2></div><p>Storms are disturbances in the atmosphere, ranging from a brief thunderstorm to a sprawling tropical cyclone. Their shapes, ingredients, and hazards are different—but understanding the basics helps us make better decisions.</p></section><section className="atlas section" id="atlas"><div className="section-heading"><div><p className="eyebrow">The guide / 04 entries</p><h2>Meet the <em>forces.</em></h2></div><p>Explore four of Earth’s most powerful weather systems.</p></div><div className="storm-grid">{storms.map(storm => <Card key={storm.id} storm={storm} />)}</div></section><section className="tools-section section"><div className="section-heading"><div><p className="eyebrow">Flood Sentry tools</p><h2>Stay <em>connected.</em></h2></div><p>Register for local alerts, review current subscribers, or simulate an event from one place.</p></div><div className="tools-grid"><a className="tool-card" href="/register" onClick={handleRouteClick}><span className="tool-number">01</span><strong>Register for alerts</strong><p>Join the local ZIP-code alert list.</p><ArrowUpRight size={19} /></a><a className="tool-card" href="/registrations" onClick={handleRouteClick}><span className="tool-number">02</span><strong>Current registrations</strong><p>Review the local subscriber directory.</p><ArrowUpRight size={19} /></a><a className="tool-card" href="/simulate" onClick={handleRouteClick}><span className="tool-number">03</span><strong>Simulate an event</strong><p>Create a local storm alert for testing.</p><ArrowUpRight size={19} /></a></div></section><section className="safety section" id="safety"><div><h2>Watch means<br /><em>be ready.</em></h2><p className="safety-text">Warning means take action. Have more than one way to receive alerts, know where you will shelter, and follow instructions from your local emergency managers.</p><a className="button dark" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">NWS safety hub <ArrowUpRight size={17} /></a></div><div className="safety-steps"><div><strong>01</strong><span>Get inside</span><p>Put walls between you and the weather.</p></div><div><strong>02</strong><span>Get informed</span><p>Use NOAA Weather Radio or official alerts.</p></div><div><strong>03</strong><span>Stay put</span><p>Wait for the all-clear from officials.</p></div></div></section><section className="sources section" id="sources"><p className="eyebrow">Keep exploring</p><h2>Built from<br /><em>good sources.</em></h2><div className="source-list"><a href="https://www.weather.gov/spotterguide/types" target="_blank" rel="noreferrer"><span>NOAA / National Weather Service</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/hurricane" target="_blank" rel="noreferrer"><span>Hurricane safety & science</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/tornado" target="_blank" rel="noreferrer"><span>Tornado safety & science</span><ArrowUpRight size={16} /></a></div></section></main><Footer /></>
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
  const page = path === '/register' ? <RegisterPage /> : path === '/registrations' ? <RegistrationsPage /> : path === '/simulate' ? <SimulatorPage /> : <HomePage />
  return <div className={`route-frame route-${transition}`} key={path}>{page}</div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
