import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Disclosure, Notice } from './components'
import { EmailField } from './EmailField'
import { validateEmail } from './emailValidation'

type RemovalTarget = { email: string; zipCode: string }

export function RemoveRegistration({ onRemoved }: { onRemoved?: () => void }) {
  const fieldId = useId()
  const [email, setEmail] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [pending, setPending] = useState<RemovalTarget | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const successNotice = useRef<HTMLDivElement>(null)
  const requestActive = useRef(false)

  useEffect(() => {
    if (!pending) return
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    return () => { element?.close(); previous?.focus() }
  }, [pending])

  useEffect(() => { if (success) successNotice.current?.focus() }, [success])

  const review = (event: FormEvent) => {
    event.preventDefault()
    const checkedEmail = validateEmail(email)
    if (!checkedEmail.valid) return
    setError(''); setSuccess('')
    setPending({ email: checkedEmail.normalized, zipCode: zipCode.trim() })
  }

  const remove = async () => {
    if (!pending || requestActive.current) return
    requestActive.current = true
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...pending, confirmRemoval: true }),
        signal: AbortSignal.timeout(15000),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'We could not remove this registration. Try again.')
        return
      }
      setPending(null); setEmail(''); setZipCode('')
      setSuccess('Your registration was removed. You can register again at any time.')
      onRemoved?.()
    } catch {
      setError('We could not confirm removal. Check the registration list and local server before you try again.')
    } finally {
      requestActive.current = false
      setBusy(false)
    }
  }

  return <section className="remove-registration" aria-label="Remove your registration">
    <Disclosure title="Remove your registration">
      <p>Enter the email and ZIP code you registered with.</p>
      <form className="registration-form removal-form" onSubmit={review}>
        <EmailField id={`${fieldId}-email`} label="Registration email" value={email} onChange={setEmail} disabled={busy} />
        <label htmlFor={`${fieldId}-zip`}>Registration ZIP code
          <input id={`${fieldId}-zip`} type="text" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}"
            maxLength={5} required placeholder="Five-digit ZIP code" value={zipCode} onChange={event => setZipCode(event.target.value)} />
        </label>
        <button type="submit" className="button quiet">Review removal</button>
      </form>
      {success && <div ref={successNotice} className="removal-result" tabIndex={-1}><Notice>{success}</Notice></div>}
    </Disclosure>
    {pending && <dialog ref={dialog} className="error-modal removal-dialog" aria-labelledby={`${fieldId}-title`}
      aria-describedby={`${fieldId}-description`} aria-busy={busy}
      onCancel={event => { event.preventDefault(); if (!requestActive.current) setPending(null) }}>
      <div className="modal-content">
        <h2 id={`${fieldId}-title`}>Remove this registration?</h2>
        <p id={`${fieldId}-description`}>This removes the registration below from the alert list.</p>
        <dl className="removal-target"><div><dt>Email</dt><dd>{pending.email}</dd></div><div><dt>ZIP code</dt><dd>{pending.zipCode}</dd></div></dl>
        <p>You can register again later.</p>
        {error && <div className="removal-result"><Notice error>{error}</Notice></div>}
        <div className="removal-actions">
          <button className="button quiet" type="button" autoFocus disabled={busy} onClick={() => setPending(null)}>Keep registration</button>
          <button className="button" type="button" disabled={busy} onClick={() => void remove()}>{busy ? 'Removing…' : 'Remove registration'}</button>
        </div>
      </div>
    </dialog>}
  </section>
}
