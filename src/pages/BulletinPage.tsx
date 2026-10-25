import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Check, CircleAlert, Clock3, FileText, MapPin, Send, Users } from 'lucide-react'
import { Disclosure, ErrorModal, Notice, PageIntro } from '../components'
import { explainError, formatDate, groupNotifications, processingSteps, type Notification } from '../presentation'
import { useLocalData } from '../useLocalData'
import { reportParts, type ResidentReport } from '../alertReport'

type Reference = { label: string; value: string }
type Analysis = ResidentReport & {
  eventType: string; areas: string[]; issuedAt: string; expiresAt: string; coverageNotes: string;
  zipCodes: { zipCode: string; area: string; evidence: string; sourceUrl: string }[];
  sources: { url: string; title: string }[]; subject: string; message: string; references?: Reference[];
}
type Delivery = { status: string; sent: number; failed: number; details?: string[] }
type Result = { analysis: Analysis; matchedSubscribers: number; message: string; email: Delivery }
type Stage = { id: string; label: string; receivedAt: number }
type StreamEvent = { type: string; stage?: Omit<Stage, 'receivedAt'>; result?: Result; error?: string }
type Issue = { title: string; message: string; detail: string }

const sampleBulletin = `WGUS84 KMRX 110026
FLWMRX
Bulletin – EAS Activation Requested
Flood Message
National Weather Service Morristown, TN
6:00 pm EDT Sun Jun 10 2012

TNC011-107-110100
/O.NEW.KMRX.FF.W.0022.120610T2200-120611T0100/
/00000.0.ER.000000T0000Z.000000T0000Z.000000T0000Z.OO/

FLASH FLOOD WARNING
The National Weather Service in Morristown has issued a
* Flash flood warning for Bradley and McMinn Counties in eastern Tennessee.
* Until 9 pm EDT Sunday.
* At 6:00 pm, radar indicated thunderstorms repeatedly moving over central and eastern Bradley and McMinn Counties.
Rains in excess of 2 inches have already occurred with at least another inch expected.
* Areas already reporting flooding include Cleveland and Fairview.

A flash flood warning means that rapid onset flooding is imminent or has been reported.
If flooding is observed, act quickly.
Do not stay in areas subject to flooding when water begins rising.`

const formatElapsed = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

async function readStream(response: Response, onEvent: (event: StreamEvent) => void) {
  if (!response.headers.get('content-type')?.includes('text/event-stream')) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `Unexpected server response (HTTP ${response.status}).`)
  }
  if (!response.body) throw new Error('The server did not return a progress stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const parse = (item: string) => {
    const data = item.split('\n').find(line => line.startsWith('data: '))?.slice(6)
    if (data) onEvent(JSON.parse(data))
  }
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done })
      const events = buffer.split('\n\n')
      buffer = events.pop() || ''
      events.forEach(parse)
      if (done) break
    }
    if (buffer.trim()) parse(buffer)
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
}

function BulletinResults({ result }: { result: Result }) {
  const { analysis, email } = result
  const { expectedDamage, actions, localHelp } = reportParts(analysis)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    heading.current?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }, [])
  return <section className="panel bulletin-results" aria-labelledby="results-title">
    <div className="record-heading"><h2 ref={heading} tabIndex={-1} id="results-title">Your alert</h2><span className="status-pill"><Check size={14} /> Bulletin saved</span></div>
    <div className="resident-message"><h3>{analysis.subject}</h3><div className="alert-message">{analysis.message}</div></div>
    <div className="resident-report-sections">
      <section aria-labelledby="damage-title"><h3 id="damage-title">Expected damage</h3>
        {expectedDamage.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
      </section>
      <section aria-labelledby="actions-title"><h3 id="actions-title">How to protect yourself</h3>
        <ol className="protective-actions">{actions.map((action, index) => <li key={index}>{action}</li>)}</ol>
        <aside className="local-help" aria-labelledby="help-title">
          <h4 id="help-title">Local shelter and help</h4><p>{localHelp.areaLabel}</p><p>{localHelp.notice}</p>
          {localHelp.checkedAt && <p className="small-text">Help information checked: {formatDate(localHelp.checkedAt)}</p>}
          {localHelp.facilities.map(facility => <div className="help-facility" key={`${facility.name}-${facility.address}`}>
            <h5>{facility.name}</h5><p>{facility.address}<br />{facility.county}, {facility.state}</p>
            <p>{facility.services}</p>{facility.phone && <p>Phone: {facility.phone}</p>}
            <p className="small-text">Opening and capacity: confirm before travel.</p>
            <a href={facility.sourceUrl} target="_blank" rel="noreferrer">{facility.sourceTitle}</a>
            <p className="small-text">Details checked: {formatDate(facility.checkedAt)}</p>
          </div>)}
          <ul className="help-resources">{localHelp.resources.map(resource => <li key={resource.url}>
            <a href={resource.url} target="_blank" rel="noreferrer">{resource.title}</a><p>{resource.description}</p>
          </li>)}</ul>
          <p><strong>For a life-threatening emergency, call 911.</strong></p>
        </aside>
      </section>
    </div>
    <div className="stats-grid result-stats">
      <div className="stat"><MapPin size={19} /><strong>{analysis.zipCodes.length}</strong><span>ZIP codes matched</span></div>
      <div className="stat"><Users size={19} /><strong>{result.matchedSubscribers}</strong><span>Registrations matched</span></div>
      <div className="stat"><Send size={19} /><strong>{email.sent}</strong><span>Emails accepted</span></div>
    </div>
    <p className="delivery-note">{email.status === 'sent' ? 'Resend accepted the email for the project test inbox. This does not confirm inbox delivery.' : 'Email delivery needs attention. The bulletin is still saved.'}</p>
    <Disclosure>
      <h3>Bulletin details</h3>
      <dl className="detail-list">
        <div><dt>Event</dt><dd>{analysis.eventType}</dd></div><div><dt>Affected areas</dt><dd>{analysis.areas.join(', ')}</dd></div>
        <div><dt>Issued</dt><dd>{analysis.issuedAt}</dd></div><div><dt>Expires</dt><dd>{analysis.expiresAt}</dd></div>
        {analysis.references?.map(ref => <div key={`${ref.label}-${ref.value}`}><dt>{ref.label}</dt><dd><code>{ref.value}</code></dd></div>)}
      </dl>
      {!analysis.references?.length && <p>No source identifiers were found in this bulletin.</p>}
      <h3>Geographic coverage</h3><p>{analysis.coverageNotes}</p>
      <div className="zip-results">{analysis.zipCodes.map(zip => <div key={zip.zipCode}><strong className="zip-pill">{zip.zipCode}</strong><span>{zip.area}</span><small>{zip.evidence}</small></div>)}</div>
      <h3>Delivery record</h3><p>{email.sent} accepted · {email.failed} failed · Status: <code>{email.status}</code></p>
      {email.details?.map(detail => <p key={detail} className="technical-text">{detail}</p>)}
      <h3>Source documents</h3>
      <ul className="reference-list">{analysis.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}
        <li><a href="https://www.weather.gov/media/directives/010_pdfs/pd01017001curr.pdf" target="_blank" rel="noreferrer">NWSI 10-1701 — Text product formats</a></li>
        <li><a href="https://www.weather.gov/vtec/" target="_blank" rel="noreferrer">NWSI 10-1703 — Valid Time Event Code</a></li>
      </ul>
    </Disclosure>
  </section>
}

export function BulletinPage() {
  const [weatherReport, setWeatherReport] = useState('')
  const [busy, setBusy] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [stages, setStages] = useState<Stage[]>([])
  const [result, setResult] = useState<Result | null>(null)
  const [issue, setIssue] = useState<Issue | null>(null)
  const [failed, setFailed] = useState(false)
  const [sampleLoaded, setSampleLoaded] = useState(false)
  const started = useRef(0)
  const submitButton = useRef<HTMLButtonElement>(null)
  const { data: notifications, error: historyError, loading: historyLoading, refresh } = useLocalData<Notification>('/api/notifications', 'notifications')

  useEffect(() => {
    if (!busy) return
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 500)
    return () => window.clearInterval(timer)
  }, [busy])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    started.current = Date.now()
    setBusy(true); setElapsed(0); setStages([{ ...processingSteps[0], receivedAt: 0 }]); setResult(null); setIssue(null); setFailed(false)
    let finalResult: Result | undefined
    try {
      const response = await fetch('/api/weather-bulletins', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weatherReport }),
      })
      await readStream(response, update => {
        if (update.stage) {
          const stage = update.stage
          setStages(current => current.some(item => item.id === stage.id) ? current : [...current, { ...stage, receivedAt: Math.floor((Date.now() - started.current) / 1000) }])
        }
        if (update.type === 'error') throw new Error(update.error || 'The server could not process this bulletin.')
        if (update.type === 'complete') finalResult = update.result
      })
      if (!finalResult) throw new Error('The connection ended before the server confirmed a result.')
      setResult(finalResult)
      if (finalResult.email.status !== 'sent') {
        setIssue({ title: 'Email not sent', message: 'The bulletin is saved, but email delivery needs attention. Check the details before you try again.', detail: finalResult.email.details?.join(' ') || `Delivery status: ${finalResult.email.status}. Repeating this request may send another email.` })
      }
    } catch (cause) {
      const detail = cause instanceof Error && !(cause instanceof TypeError) && !(cause instanceof SyntaxError)
        ? cause.message : 'The connection to the local API ended. Check saved records before retrying; an email may already have been sent.'
      setFailed(true)
      setIssue({ title: 'We could not finish', message: explainError(detail), detail })
    } finally {
      setElapsed(Math.floor((Date.now() - started.current) / 1000)); setBusy(false)
      void refresh()
    }
  }

  const active = stages[stages.length - 1]
  const activeLabel = processingSteps.find(step => step.id === active?.id)?.label || active?.label
  const groups = groupNotifications(notifications)

  return <main id="main-content" className="page-shell bulletin-page" tabIndex={-1}>
    <PageIntro title="Upload a bulletin">Turn a weather report into a clear local alert.</PageIntro>
    <section className="panel bulletin-editor" aria-labelledby="bulletin-label">
      <form onSubmit={submit} aria-busy={busy}>
        <div className="panel-toolbar"><label id="bulletin-label" htmlFor="weather-report"><FileText size={20} /> Weather bulletin</label>
          <button type="button" className="button quiet small-button" disabled={busy} onClick={() => { setWeatherReport(sampleBulletin); setSampleLoaded(true) }}>Load sample</button>
        </div>
        <textarea id="weather-report" value={weatherReport} onChange={event => { setWeatherReport(event.target.value); setSampleLoaded(false) }}
          rows={10} minLength={40} maxLength={20000} required disabled={busy}
          placeholder="Paste the full weather bulletin here…" aria-describedby="bulletin-help bulletin-delivery" />
        <div className="input-caption"><p id="bulletin-help">Include the affected counties, state, and report date.</p><span>{weatherReport.length.toLocaleString()} / 20,000</span></div>
        {sampleLoaded && <p className="sample-note">Historical sample · June 10, 2012. This is not a current warning.</p>}
        <div className="editor-actions"><p id="bulletin-delivery"><Send size={16} /> Sends one email to the project test inbox.</p>
          <button ref={submitButton} className="button" type="submit" disabled={busy}>{busy ? 'Processing…' : 'Prepare and send alert'} <Send size={17} /></button>
        </div>
      </form>
    </section>

    {stages.length > 0 && <section className="panel processing-panel" aria-label="Bulletin progress">
      <div className="record-heading"><div className="processing-status" role="status">
        {busy ? <span className="spinner" /> : failed ? <CircleAlert size={21} /> : <Check size={21} />}
        <strong>{busy ? activeLabel : failed ? 'Processing stopped' : 'Bulletin saved'}</strong>
      </div><span className="elapsed"><Clock3 size={15} /> {formatElapsed(elapsed)}</span></div>
      <Disclosure title="Processing details"><ol className="progress-steps">{processingSteps.map((step, index) => {
        const seen = stages.findIndex(stage => stage.id === step.id)
        const last = active?.id === step.id
        const complete = seen !== -1 && (!last || !!result)
        const end = stages[seen + 1]?.receivedAt ?? elapsed
        return <li key={step.id} className={busy && last ? 'current' : complete ? 'complete' : ''}>
          <span>{complete ? <Check size={14} /> : index + 1}</span><strong>{step.label}</strong>
          <small>{busy && last ? 'In progress' : failed && last ? 'Stopped' : complete ? formatElapsed(end - stages[seen].receivedAt) : 'Waiting'}</small>
        </li>
      })}</ol></Disclosure>
    </section>}

    {result && <BulletinResults result={result} />}

    <section className="panel recent-bulletins" aria-labelledby="history-title">
      <h2 id="history-title">Recent bulletins</h2>
      {historyError ? <Notice error>{historyError}</Notice> : historyLoading ? <p className="empty-state" role="status">Loading bulletins…</p>
        : !groups.length ? <div className="empty-state"><FileText size={30} /><h3>No bulletins yet.</h3><p>Your saved alerts will appear here.</p></div>
        : <div className="bulletin-history">{groups.map(item => <Disclosure key={item.id} className="history-item" bodyClassName="history-body"
          title={<><span><strong>{item.trigger_type.replace(/_/g, ' ')}</strong><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></span><span className="history-zips">{item.zipCodes.length} ZIP{item.zipCodes.length === 1 ? '' : 's'}</span></>}>
          <p className="alert-message">{item.message}</p><div className="zip-tags">{item.zipCodes.map(zip => <span className="zip-pill" key={zip}>{zip}</span>)}</div><p className="small-text">Latest local record: #{item.id}</p>
        </Disclosure>)}</div>}
      {!!groups.length && <p className="table-caption">Latest 20 ZIP records, grouped by bulletin. Older ZIP records may not appear.</p>}
    </section>
    <Disclosure title="How this works">
      <p>FloodSentry reads your bulletin, finds county matches, and writes an alert.</p>
      <p>ZIP coverage is approximate. This prototype sends to one test inbox, not to registered users.</p>
      <p>OpenAI reads the bulletin. A local Census crosswalk maps counties to ZIP areas. Resend handles the email.</p>
      <p>A web search checks official sources for local help. Confirm opening and capacity before travel.</p>
      <p>Follow the National Weather Service and local officials for current warnings.</p>
    </Disclosure>
    {issue && <ErrorModal {...issue} onClose={() => { setIssue(null); window.requestAnimationFrame(() => submitButton.current?.focus()) }} />}
  </main>
}
