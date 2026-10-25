import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Footer, handleRouteClick, Header, PageIntro } from './components'
import { HomePage } from './pages/HomePage'
import { RegisterPage, RegistrationsPage } from './pages/RegistrationPages'
import { BulletinPage } from './pages/BulletinPage'
import { ErrorsPage } from './pages/ErrorsPage'
import { LearnPage } from './pages/LearnPage'
import './styles.css'

const readPath = () => window.location.pathname.replace(/\/$/, '') || '/'
const titles: Record<string, string> = {
  '/': 'Clear weather information', '/register': 'Register for alerts', '/registrations': 'Registrations',
  '/bulletin': 'Upload a bulletin', '/simulate': 'Upload a bulletin', '/errors': 'Errors', '/learn': 'Weather guide',
}

function App() {
  const [path, setPath] = useState(readPath)
  const [leaving, setLeaving] = useState(false)
  const navigated = useRef(false)
  useEffect(() => {
    let timer: number | undefined
    const navigate = (event: Event) => {
      const href = (event as CustomEvent<{ href: string }>).detail.href
      window.clearTimeout(timer)
      if (href === window.location.pathname) {
        if (window.location.hash) window.history.pushState({}, '', href)
        setLeaving(false); document.getElementById('main-content')?.focus()
        window.scrollTo({ top: 0, behavior: 'smooth' }); return
      }
      setLeaving(true)
      timer = window.setTimeout(() => {
        window.history.pushState({}, '', href); navigated.current = true
        setPath(readPath()); setLeaving(false)
      }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 140)
    }
    const pop = () => {
      window.clearTimeout(timer); navigated.current = true
      setPath(readPath()); setLeaving(false)
    }
    window.addEventListener('flood-sentry:navigate', navigate)
    window.addEventListener('popstate', pop)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('flood-sentry:navigate', navigate)
      window.removeEventListener('popstate', pop)
    }
  }, [])
  useEffect(() => {
    document.title = `${titles[path] || 'Page not found'} · FloodSentry`
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView()
    else if (navigated.current) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      document.getElementById('main-content')?.focus({ preventScroll: true })
    }
  }, [path])
  const page = path === '/' ? <HomePage /> : path === '/learn' ? <LearnPage /> : path === '/register' ? <RegisterPage />
    : path === '/registrations' ? <RegistrationsPage /> : path === '/errors' ? <ErrorsPage />
    : path === '/bulletin' || path === '/simulate' ? <BulletinPage />
    : <main id="main-content" className="page-shell" tabIndex={-1}><PageIntro title="Page not found">Let’s get you back to FloodSentry.</PageIntro><a className="button" href="/" onClick={handleRouteClick}>Go home</a></main>
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a><Header path={path} />
    <div className={`route-frame ${leaving ? 'route-leaving' : 'route-entering'}`} key={path}>{page}</div><Footer />
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
