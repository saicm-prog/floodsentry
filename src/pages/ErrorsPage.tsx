import { CircleCheck, RefreshCw } from 'lucide-react'
import { Disclosure, Notice, PageIntro } from '../components'
import { explainError, formatDate } from '../presentation'
import { useLocalData } from '../useLocalData'

type BulletinError = { id: number; stage: string; message: string; created_at: string }

export function ErrorsPage() {
  const { data, loading, error, refresh } = useLocalData<BulletinError>('/api/errors', 'errors')
  return <main id="main-content" className="page-shell" tabIndex={-1}>
    <PageIntro title="Errors" action={<button className="button quiet" onClick={() => void refresh()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} />Refresh</button>}>Find what went wrong and what to do next.</PageIntro>
    <section className="panel" aria-label="Bulletin error history">
      {error ? <Notice error>{error}</Notice> : loading ? <p className="empty-state" role="status">Loading errors…</p>
        : !data.length ? <div className="empty-state"><CircleCheck size={32} /><h2>No errors recorded.</h2><p>New processing errors will appear here.</p></div>
        : <div className="error-list">{data.map(item => <article key={item.id}>
          <div className="record-heading"><h2>{item.stage}</h2><time dateTime={item.created_at}>{formatDate(item.created_at)}</time></div>
          <p>{explainError(item.message)}</p>
          <Disclosure><dl className="detail-list"><div><dt>Local error record</dt><dd>#{item.id}</dd></div><div><dt>Stage</dt><dd>{item.stage}</dd></div></dl><p className="technical-text">{item.message}</p></Disclosure>
        </article>)}</div>}
    </section>
  </main>
}
