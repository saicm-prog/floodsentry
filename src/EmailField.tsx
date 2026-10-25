import { useEffect, useId, useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import { validateEmail } from './emailValidation'

export function EmailField({ value, onChange, label = 'Email address', id, name, disabled = false }: {
  value: string; onChange: (value: string) => void; label?: string; id?: string; name?: string; disabled?: boolean
}) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const input = useRef<HTMLInputElement>(null)
  const [touched, setTouched] = useState(false)
  const result = validateEmail(value)
  const messageId = `${fieldId}-feedback`

  useEffect(() => { input.current?.setCustomValidity(result.error) }, [result.error])
  useEffect(() => { if (!value) setTouched(false) }, [value])

  return <div className="email-field">
    <label htmlFor={fieldId}>{label}
      <input ref={input} id={fieldId} name={name} type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
        placeholder="you@example.com" maxLength={254} required disabled={disabled} value={value}
        aria-invalid={touched && !result.valid ? true : undefined} aria-describedby={touched && !result.valid ? messageId : undefined}
        onChange={event => { event.currentTarget.setCustomValidity(validateEmail(event.target.value).error); onChange(event.target.value) }}
        onBlur={() => { onChange(value.trim()); setTouched(true) }} onInvalid={() => setTouched(true)} />
    </label>
    <div className="email-feedback" id={messageId} aria-live="polite" aria-atomic="true">
      {touched && !result.valid && <span className="email-invalid">
        <CircleAlert size={15} aria-hidden="true" />
        {result.error}
      </span>}
    </div>
  </div>
}
