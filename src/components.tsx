import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { ArrowUpRight, Check, CircleAlert, Menu, X } from 'lucide-react'

export function handleRouteClick(event: MouseEvent<HTMLAnchorElement>) {
  const href = event.currentTarget.getAttribute('href')
  if (!href?.startsWith('/') || href.startsWith('/#') || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  window.dispatchEvent(new CustomEvent('flood-sentry:navigate', { detail: { href } }))
}

export function Logo() {
  return <a className="logo" href="/" onClick={handleRouteClick} aria-label="FloodSentry home">
    <img className="logo-mark" src="/flood-sentry-wave-shield.svg" width="44" height="49" alt="" aria-hidden="true" />
    <span>FloodSentry</span>
  </a>
}

const navigation = [
  ['/', 'Home'], ['/learn', 'Weather guide'], ['/register', 'Register'], ['/registrations', 'Registrations'],
  ['/bulletin', 'Upload bulletin'], ['/errors', 'Errors'],
]

export function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  useEffect(() => { setOpen(false) }, [path])
  return <header className="header">
    <div className="header-inner">
      <Logo />
      <nav id="main-navigation" aria-label="Main navigation" className={open ? 'nav open' : 'nav'} onKeyDown={event => {
        if (event.key === 'Escape') { setOpen(false); toggle.current?.focus() }
      }}>
        {navigation.map(([href, label]) => <a key={href} href={href}
          aria-current={(path === href || (href === '/bulletin' && path === '/simulate')) ? 'page' : undefined}
          onClick={event => { setOpen(false); handleRouteClick(event) }}>{label}</a>)}
      </nav>
      <button ref={toggle} className="menu-button icon-button" type="button" onClick={() => setOpen(!open)}
        aria-expanded={open} aria-controls="main-navigation" aria-label={open ? 'Close menu' : 'Open menu'}>
        {open ? <X size={23} /> : <Menu size={23} />}
      </button>
    </div>
  </header>
}

export function Footer() {
  return <footer className="footer"><div className="footer-inner">
    <Logo />
    <p>A student-built prototype. Follow official weather alerts.</p>
    <a href="https://www.weather.gov/" target="_blank" rel="noreferrer">National Weather Service <ArrowUpRight size={15} /></a>
  </div></footer>
}

export function PageIntro({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="page-intro"><div><h1>{title}</h1>{children && <p>{children}</p>}</div>{action}</div>
}

export function Disclosure({ title = 'Technical details', children, className = 'disclosure', bodyClassName = 'disclosure-body' }: {
  title?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()

  return <div className={className}>
    <button className="disclosure-toggle" type="button" aria-expanded={expanded} aria-controls={panelId}
      onClick={() => setExpanded(value => !value)}>
      <span className="disclosure-label">{title}</span>
      <span className="disclosure-icon" aria-hidden="true" />
    </button>
    {/* Keep content mounted for a reversible height transition. Inert prevents
        hidden links and controls from receiving focus during or after closing. */}
    <div className="disclosure-panel" id={panelId} data-expanded={expanded} aria-hidden={!expanded} inert={!expanded}>
      <div className="disclosure-clip"><div className={bodyClassName}>{children}</div></div>
    </div>
  </div>
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>
    {error ? <CircleAlert size={19} aria-hidden="true" /> : <Check size={19} aria-hidden="true" />}<div>{children}</div>
  </div>
}

export function ErrorModal({ title, message, detail, onClose }: { title: string; message: string; detail: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current
    element?.showModal()
    return () => { element?.close(); previous?.focus() }
  }, [])
  return <dialog ref={dialog} className="error-modal" aria-labelledby="error-title" aria-describedby="error-message"
    onCancel={event => { event.preventDefault(); onClose() }}
    onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="modal-content">
      <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Dismiss error"><X size={20} /></button>
      <span className="modal-icon"><CircleAlert size={26} /></span>
      <h2 id="error-title">{title}</h2><p id="error-message">{message}</p>
      <Disclosure><p className="technical-text">{detail}</p></Disclosure>
      <button className="button" type="button" onClick={onClose}>Got it</button>
    </div>
  </dialog>
}
