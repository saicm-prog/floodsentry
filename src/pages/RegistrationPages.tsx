import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Bell, Check, CircleCheck, Mail, MapPin, RefreshCw, Search, Users } from 'lucide-react'
import { Disclosure, handleRouteClick, Notice, PageIntro } from '../components'
import { formatDate } from '../presentation'
import { useLocalData } from '../useLocalData'
import { RemoveRegistration } from '../RemoveRegistration'
import { EmailField } from '../EmailField'
import { validateEmail } from '../emailValidation'

type Registration = { id: number; email: string; zip_code: string; consented_at: string; created_at: string; verified_at: string | null }
type EmailConfirmation = { verificationId: string; email: string; zipCode: string; expiresAt: string; retryAfter: number }

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState<EmailConfirmation | null>(null)
  const [completed, setCompleted] = useState<{ email: string; zipCode: string } | null>(null)
  const [code, setCode] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const codeInput = useRef<HTMLInputElement>(null)
  const completePanel = useRef<HTMLDivElement>(null)
  const requestActive = useRef(false)

  useEffect(() => { if (confirmation) codeInput.current?.focus() }, [confirmation])
  useEffect(() => { if (completed) completePanel.current?.focus() }, [completed])
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn(value => Math.max(0, value - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  const sendCode = async () => {
    if (requestActive.current) return
    const checkedEmail = validateEmail(email)
    if (!checkedEmail.valid) { setMessage(checkedEmail.error); return }
    requestActive.current = true
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: checkedEmail.normalized, zipCode, consent }), signal: AbortSignal.timeout(25000),
      })
      const result = await response.json()
      if (!response.ok) {
        if (result.retryAfter) setResendIn(result.retryAfter)
        throw new Error(result.error || 'We could not send your confirmation email. Try again.')
      }
      setConfirmation(result as EmailConfirmation); setCode(''); setResendIn(result.retryAfter || 60)
    } catch (cause) {
      setMessage(cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError) && cause.name !== 'TimeoutError'
        ? cause.message : 'We could not connect. Please try again shortly.')
    } finally { requestActive.current = false; setBusy(false) }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await sendCode()
  }

  const confirmEmail = async (event: FormEvent) => {
    event.preventDefault()
    if (!confirmation || requestActive.current) return
    requestActive.current = true
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/subscriptions/confirm', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId: confirmation.verificationId, code }), signal: AbortSignal.timeout(15000),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'We could not confirm your email. Try again.')
      setCompleted({ email: result.email, zipCode: result.zipCode }); setConfirmation(null)
    } catch (cause) {
      setMessage(cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError) && cause.name !== 'TimeoutError'
        ? cause.message : 'We could not connect. Please try again shortly.')
    } finally { requestActive.current = false; setBusy(false) }
  }

  return <main id="main-content" className="page-shell registration-page" tabIndex={-1}>
    <div className="registration-layout">
      <section className="registration-intro">
        <span className="feature-icon"><Bell size={26} /></span>
        <h1>Stay connected <br />to your <em>community.</em></h1>
        <p>Join the free alert list for your ZIP code.</p>
        <ul className="feature-list"><li><Mail size={19} /> Email updates</li><li><MapPin size={19} /> Local ZIP-code matching</li><li><Check size={19} /> No account needed</li></ul>
        <a className="text-link" href="/#atlas">Explore the storm guide <ArrowRight size={17} /></a>
      </section>
      <section className="panel register-card" aria-labelledby="register-title">
        <h2 id="register-title">{completed ? 'You’re registered.' : confirmation ? 'Confirm your email' : 'Register for alerts'}</h2>
        {completed ? <div className="registration-complete" ref={completePanel} tabIndex={-1} role="status">
          <CircleCheck size={38} aria-hidden="true" />
          <p>Your email is confirmed.<br /><strong>{completed.email}</strong></p>
          <p>Registered for ZIP code <span className="zip-pill">{completed.zipCode}</span>.</p>
          <a className="button" href="/" onClick={handleRouteClick}>Go home <ArrowRight size={18} /></a>
          <button className="button quiet" type="button" onClick={() => { setCompleted(null); setEmail(''); setZipCode(''); setConsent(false); setCode(''); setMessage(''); setResendIn(0) }}>Register another email</button>
        </div> : confirmation ? <>
          <div className="verification-summary"><p>We sent a code to <strong>{confirmation.email}</strong>.</p><span className="zip-pill">ZIP {confirmation.zipCode}</span><p>Enter the code within 10 minutes to finish registration.</p></div>
          <form onSubmit={confirmEmail} className="registration-form verification-form" aria-busy={busy}>
            <label htmlFor="confirmation-code">Email confirmation code<input ref={codeInput} id="confirmation-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} placeholder="Six-digit code" required disabled={busy} /></label>
            <button className="button" type="submit" disabled={busy}>{busy ? 'Please wait…' : 'Confirm and register'} <ArrowRight size={18} /></button>
            {message && <Notice error>{message}</Notice>}
          </form>
          <div className="verification-actions">
            <button className="button quiet" type="button" disabled={busy || resendIn > 0} onClick={() => void sendCode()}>{resendIn > 0 ? `Send again in ${resendIn}s` : 'Send a new code'}</button>
            <button className="button quiet" type="button" disabled={busy} onClick={() => { setConfirmation(null); setCode(''); setMessage(''); setResendIn(0) }}>Change email</button>
          </div>
          <p className="prototype-note">No code yet? Check your spam folder or check the email address.</p>
        </> : <form onSubmit={submit} className="registration-form" aria-busy={busy}>
          <EmailField id="email" value={email} onChange={setEmail} disabled={busy} />
          <label htmlFor="zip">U.S. ZIP code<input id="zip" type="text" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={zipCode} onChange={event => setZipCode(event.target.value)} placeholder="Five-digit ZIP code" required disabled={busy} /></label>
          <label className="consent"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required disabled={busy} /><span>I agree to receive FloodSentry email alerts.</span></label>
          <button className="button" type="submit" disabled={busy || resendIn > 0}>{busy ? 'Sending code…' : resendIn > 0 ? `Try again in ${resendIn}s` : 'Send confirmation code'} <ArrowRight size={18} /></button>
          <p className="small-text">Confirm your email to finish registration.</p>
          {message && <Notice error>{message}</Notice>}
        </form>}
        <p className="prototype-note">Storm alert previews currently go to the project test inbox.</p>
        <Disclosure title="How we use your information">
          <p>We confirm your email before adding you to the alert list.</p>
          <p>We save your email, ZIP code, consent time, and confirmation time on this computer.</p>
          <p>This prototype has no account login. Anyone with access to this app can view the registration list.</p>
          <p className="technical-text">Storage: SQLite · data/flood-sentry.sqlite · subscriptions table</p>
        </Disclosure>
      </section>
    </div>
    <RemoveRegistration />
  </main>
}

export function RegistrationsPage() {
  const { data, loading, error, refresh } = useLocalData<Registration>('/api/subscriptions', 'subscriptions')
  const [query, setQuery] = useState('')
  const filtered = data.filter(item => `${item.email} ${item.zip_code}`.toLowerCase().includes(query.trim().toLowerCase()))
  const zipCount = new Set(data.map(item => item.zip_code)).size
  return <main id="main-content" className="page-shell" tabIndex={-1}>
    <PageIntro title="Registrations" action={<a href="/register" className="button" onClick={handleRouteClick}>Add registration <ArrowRight size={17} /></a>}>Your community’s alert list.</PageIntro>
    <div className="stats-grid two-stats" aria-label="Registration totals">
      <div className="stat"><Users size={21} /><strong>{loading || error ? '—' : data.length}</strong><span>Registrations</span></div>
      <div className="stat"><MapPin size={21} /><strong>{loading || error ? '—' : zipCount}</strong><span>ZIP codes</span></div>
    </div>
    <section className="panel registrations-card" aria-label="Registered users">
      <div className="panel-toolbar">
        <label className="search-field"><Search size={18} /><span className="sr-only">Search email or ZIP code</span><input type="search" placeholder="Email or ZIP code" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <button className="button quiet" type="button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />Refresh</button>
      </div>
      {error ? <Notice error>{error}</Notice> : loading ? <p className="empty-state" role="status">Loading registrations…</p>
        : !data.length ? <div className="empty-state"><Users size={30} /><h3>Your list starts here.</h3><p>No one has registered yet.</p><a className="text-link" href="/register" onClick={handleRouteClick}>Add the first registration <ArrowRight size={16} /></a></div>
        : !filtered.length ? <p className="empty-state" role="status">No registrations match your search.</p>
        : <><div className="registration-table-wrap" role="region" aria-label="Registrations table" tabIndex={0}><table className="registration-table">
          <thead><tr><th scope="col">Email address</th><th scope="col">ZIP code</th><th scope="col">Consent</th><th scope="col">Registered</th></tr></thead>
          <tbody>{filtered.map(item => <tr key={item.id}><td>{item.email}{item.verified_at && <span className="table-detail">Email confirmed</span>}</td><td><span className="zip-pill">{item.zip_code}</span></td><td><span className="consent-status"><CircleCheck size={15} /> Given</span><time className="table-detail" dateTime={item.consented_at}>{formatDate(item.consented_at)}</time></td><td><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></td></tr>)}</tbody>
        </table></div><p className="table-caption">{filtered.length} of {data.length} registrations</p></>}
    </section>
    <p className="page-note">Local prototype · This directory has no login protection.</p>
    <RemoveRegistration onRemoved={() => void refresh()} />
  </main>
}

// Retain local account creation without adding an unfinished sign-in flow to navigation.
export function AccountPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const fields = new FormData(form)
    setBusy(true)
    try {
      const response = await fetch('/api/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), consent: fields.has('consent') }) })
      const result = await response.json()
      setStatus(result.message || result.error)
      if (response.ok) { form.reset(); setEmail('') }
    } catch { setStatus('We could not connect. Check the local server, then try again.') }
    finally { setBusy(false) }
  }
  return <main id="main-content" className="page-shell"><PageIntro title="Create an account" /><section className="panel register-card"><form className="registration-form" onSubmit={submit}>
    <label>Full name<input name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
    <EmailField name="email" value={email} onChange={setEmail} disabled={busy} />
    <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} required /><small>Use at least 12 characters.</small></label>
    <label className="consent"><input name="consent" type="checkbox" required /><span>I agree to save my information for a local account.</span></label>
    <button className="button" disabled={busy}>{busy ? 'Saving…' : 'Create account'}</button>{status && <p role="status">{status}</p>}
  </form><p className="page-note">Account sign-in is not available in this prototype.</p></section></main>
}
