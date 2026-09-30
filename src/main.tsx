import { StrictMode, useEffect, useState, type FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, CloudLightning, Menu, Snowflake, Wind, X } from 'lucide-react'
import './styles.css'

type Storm = { id: string; title: string; summary: string; detail: string; image: string; icon: typeof Wind }
type Notification = { id: number; zip_code: string; trigger_type: string; message: string; created_at: string }

const storms: Storm[] = [
  { id: 'thunderstorms', title: 'Thunderstorms', summary: 'The atmosphere puts on a light show.', detail: 'A thunderstorm is a local storm produced by a cumulonimbus cloud and accompanied by lightning and thunder. Severe thunderstorms can produce hail at least 1 inch in diameter or wind gusts of 58 mph or higher.', image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1400&q=85', icon: CloudLightning },
  { id: 'tornadoes', title: 'Tornadoes', summary: 'Small in scale. Enormous in force.', detail: 'A tornado is a violently rotating column of air extending from the base of a thunderstorm down to the ground. They can occur at any time of day or night and at any time of year.', image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1400&q=85', icon: Wind },
  { id: 'hurricanes', title: 'Hurricanes', summary: 'A vast engine powered by warm ocean water.', detail: 'Hurricanes are tropical cyclones with maximum sustained winds of 74 mph or greater. Their hazards include storm surge, flooding, extreme winds, and tornadoes.', image: '/images/hurricane-weather-scene.png', icon: ArrowUpRight },
  { id: 'blizzards', title: 'Blizzards', summary: 'When snow and wind erase the horizon.', detail: 'A blizzard is a winter storm with frequent wind gusts of at least 35 mph and falling or blowing snow that reduces visibility to a quarter mile or less for at least three hours.', image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1400&q=85', icon: Snowflake },
]

const eventTypes = [
  { value: 'dummy_damage_risk', label: 'Dummy damage risk' },
  { value: 'severe_wind', label: 'Severe wind' },
  { value: 'flash_flooding', label: 'Flash flooding' },
  { value: 'tornado_watch', label: 'Tornado watch' },
]

function Logo() { return <a className="logo" href="/" aria-label="Flood Sentry home"><span className="logo-mark">✳</span><span>flood sentry</span></a> }

function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return <header className="header"><Logo /><nav className={open ? 'nav open' : 'nav'}><a href="/" onClick={close}>Home</a><a href="/#atlas" onClick={close}>Explore storms</a><a href="/register" onClick={close}>Register</a><a href="/simulate" onClick={close}>Simulate event</a><a href="/#safety" onClick={close}>Safety basics</a><a href="/#sources" onClick={close}>Sources</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></header>
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
  return <><Header /><main className="page-shell"><section className="page-intro"><p className="eyebrow">Local preview / email alerts</p><h1>Stay ahead<br /><em>of the weather.</em></h1><p>Register by ZIP code for local test alerts. This phase stores everything on your computer and does not send real email.</p></section><section className="register-card"><SubscribeForm /></section></main><Footer /></>
}

function SimulatorPage() {
  const [zipCode, setZipCode] = useState('')
  const [triggerType, setTriggerType] = useState('dummy_damage_risk')
  const [status, setStatus] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadNotifications = async () => {
    try { const response = await fetch('/api/notifications'); const result = await response.json(); setNotifications(result.notifications || []) } catch { setStatus('Start the local API with npm run dev:api first.') }
  }
  useEffect(() => { void loadNotifications() }, [])
  const sendTest = async (event: FormEvent) => {
    event.preventDefault(); setStatus('Creating local event…')
    try {
      const response = await fetch('/api/test-alert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ zipCode, triggerType }) })
      const result = await response.json(); setStatus(result.message || result.error)
      if (response.ok) { setZipCode(''); await loadNotifications() }
    } catch { setStatus('Start the local API with npm run dev:api first.') }
  }
  return <><Header /><main className="page-shell"><section className="page-intro"><p className="eyebrow">Developer simulator</p><h1>Trigger a local<br /><em>storm event.</em></h1><p>Create a local alert record for a ZIP code and see how many registered subscribers would match. Nothing is sent outside this computer.</p></section><section className="simulator-grid"><div className="simulator-card"><form onSubmit={sendTest}><label>U.S. ZIP code<input inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zipCode} onChange={event => setZipCode(event.target.value)} placeholder="00000" required /></label><label>Event type<select value={triggerType} onChange={event => setTriggerType(event.target.value)}>{eventTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><button className="button" type="submit">Run local event <ArrowUpRight size={17} /></button>{status && <p className="form-status" role="status">{status}</p>}</form></div><div className="notifications-card"><p className="eyebrow">Recent local events</p>{notifications.length === 0 ? <p className="empty-state">No simulated events yet.</p> : <div className="notification-list">{notifications.map(notification => <article key={notification.id}><strong>{notification.trigger_type.split('_').join(' ')}</strong><span>{notification.zip_code}</span><p>{notification.message}</p><time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time></article>)}</div>}</div></section></main><Footer /></>
}

function HomePage() {
  return <><Header /><main><section className="hero"><div><p className="eyebrow"><span className="pulse" /> A field guide to severe weather</p><h1>When the sky<br />gets <em>serious.</em></h1><p className="hero-text">Flood Sentry is a clear, visual introduction to the forces that shape our atmosphere—and how to stay ready when they arrive.</p><div className="hero-actions"><a className="button" href="#atlas">Explore the guide <ArrowDown size={17} /></a><a className="button secondary" href="/register">Register for alerts <ArrowUpRight size={17} /></a></div></div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-sun" /></div></section><section className="intro section"><div><p className="eyebrow">The big picture</p><h2>Every storm<br />has a <em>story.</em></h2></div><p>Storms are disturbances in the atmosphere, ranging from a brief thunderstorm to a sprawling tropical cyclone. Their shapes, ingredients, and hazards are different—but understanding the basics helps us make better decisions.</p></section><section className="atlas section" id="atlas"><div className="section-heading"><div><p className="eyebrow">The guide / 04 entries</p><h2>Meet the <em>forces.</em></h2></div><p>Explore four of Earth’s most powerful weather systems.</p></div><div className="storm-grid">{storms.map(storm => <Card key={storm.id} storm={storm} />)}</div></section><section className="safety section" id="safety"><div><h2>Watch means<br /><em>be ready.</em></h2><p className="safety-text">Warning means take action. Have more than one way to receive alerts, know where you will shelter, and follow instructions from your local emergency managers.</p><a className="button dark" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">NWS safety hub <ArrowUpRight size={17} /></a></div><div className="safety-steps"><div><strong>01</strong><span>Get inside</span><p>Put walls between you and the weather.</p></div><div><strong>02</strong><span>Get informed</span><p>Use NOAA Weather Radio or official alerts.</p></div><div><strong>03</strong><span>Stay put</span><p>Wait for the all-clear from officials.</p></div></div></section><section className="sources section" id="sources"><p className="eyebrow">Keep exploring</p><h2>Built from<br /><em>good sources.</em></h2><div className="source-list"><a href="https://www.weather.gov/spotterguide/types" target="_blank" rel="noreferrer"><span>NOAA / National Weather Service</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/hurricane" target="_blank" rel="noreferrer"><span>Hurricane safety & science</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/tornado" target="_blank" rel="noreferrer"><span>Tornado safety & science</span><ArrowUpRight size={16} /></a></div></section></main><Footer /></>
}

function Footer() { return <footer><Logo /><p>Educational guide · Always follow local official guidance.</p><a href="/">Back to top ↑</a></footer> }

function App() {
  const path = window.location.pathname.replace(/\/$/, '') || '/'
  if (path === '/register') return <RegisterPage />
  if (path === '/simulate') return <SimulatorPage />
  return <HomePage />
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
