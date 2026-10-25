import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, BookOpen, CircleHelp, Printer, ShieldCheck } from 'lucide-react'
import { Disclosure, handleRouteClick } from '../components'
import { WeatherIllustration } from '../components/WeatherIllustration'
import { weatherChapters, type WeatherChapter } from '../data/weatherGuide'
import '../weather-guide.css'

const readingMinutes = Math.ceil(weatherChapters.map(chapter => [
  chapter.introduction, ...chapter.causes, ...chapter.impacts.map(impact => impact.text),
  chapter.action, ...chapter.before, ...chapter.during, ...chapter.after, chapter.remember.text, ...chapter.science,
].join(' ')).join(' ').split(/\s+/).length / 180)

function Chapter({ chapter, index }: { chapter: WeatherChapter; index: number }) {
  const phases = [chapter.before, chapter.during, chapter.after]
  const labels = chapter.phaseLabels || ['Before', 'During', 'After']
  const next = weatherChapters[index + 1]

  return <section className="learn-chapter" id={chapter.id} aria-labelledby={`${chapter.id}-title`} tabIndex={-1}>
    <div className="learn-chapter-heading"><span className="learn-chapter-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h2 id={`${chapter.id}-title`}>{chapter.shortTitle}</h2></div>
    <p className="learn-chapter-intro">{chapter.introduction}</p>
    <WeatherIllustration kind={chapter.id} />

    <div className="learn-explanation">
      <div className="learn-causes"><h3>{index === 9 ? 'Understand the message' : 'What causes it?'}</h3>{chapter.causes.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
      <div className="learn-impacts"><h3>{index === 9 ? 'Why a plan matters' : 'What can happen?'}</h3>{chapter.impacts.map(impact => <div className="learn-impact" key={impact.title}><h4>{impact.title}</h4><p>{impact.text}</p></div>)}</div>
    </div>

    <div className="learn-key-action"><ShieldCheck size={24} aria-hidden="true" /><p>{chapter.action}</p></div>
    <div className="learn-precautions"><h3>{index === 9 ? 'Build your plan' : 'What you can do'}</h3><div className="learn-phase-grid">{phases.map((items, phase) => <div className="learn-phase" key={labels[phase]}>
      <h4><span aria-hidden="true">{phase + 1}</span>{labels[phase]}</h4><ul>{items.map(item => <li key={item}>{item}</li>)}</ul>
    </div>)}</div></div>

    <aside className="learn-remember" aria-label="Important reminder"><CircleHelp size={21} aria-hidden="true" /><div><h3>{chapter.remember.title}</h3><p>{chapter.remember.text}</p></div></aside>
    <Disclosure title="A little more science">{chapter.science.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</Disclosure>
    <div className="learn-sources"><span>Sources</span><ul>{chapter.sources.map(source => <li key={source.href}><a href={source.href} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={13} aria-hidden="true" /><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul></div>
    <div className="learn-chapter-end"><a href="#guide-top">All topics <ArrowUp size={14} aria-hidden="true" /></a>{next && <a href={`#${next.id}`}>Next: {next.shortTitle} <ArrowRight size={14} aria-hidden="true" /></a>}</div>
  </section>
}

export function LearnPage() {
  const [active, setActive] = useState(weatherChapters[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActive(visible[0].target.id)
    }, { rootMargin: '-112px 0px -55% 0px', threshold: 0 })
    for (const chapter of weatherChapters) {
      const element = document.getElementById(chapter.id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [])

  return <main id="main-content" className="learn-page" tabIndex={-1}>
    <div className="learn-hero" id="guide-top">
      <div className="container">
        <p className="learn-eyebrow"><BookOpen size={16} aria-hidden="true" /> The weather guide</p>
        <h1>Understand the weather.<br /><em>Know what to do.</em></h1>
        <p className="learn-hero-copy">Learn what causes dangerous weather, how it can affect you, and how to stay safer. Start at the beginning or choose a topic.</p>
        <div className="learn-hero-actions"><a className="button" href="#weather-basics">Start reading <ArrowDown size={17} aria-hidden="true" /></a><button className="button" type="button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Print or save as PDF</button></div>
        <p className="learn-meta">{weatherChapters.length} illustrated chapters <span aria-hidden="true">·</span> About {readingMinutes} minutes</p>
      </div>
    </div>
    <div className="container learn-layout">
      <aside className="learn-toc"><nav aria-label="Weather guide chapters"><h2>In this guide</h2><ol>{weatherChapters.map((chapter, index) => <li key={chapter.id}>
        <a href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined} onClick={() => setActive(chapter.id)}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{chapter.shortTitle}</a>
      </li>)}</ol></nav><div className="learn-toc-note"><ShieldCheck size={18} aria-hidden="true" /><p>For decisions today, follow current NWS alerts and local emergency instructions.</p></div></aside>
      <div className="learn-content">
        {weatherChapters.map((chapter, index) => <Chapter key={chapter.id} chapter={chapter} index={index} />)}
        <section className="learn-finish" aria-labelledby="learn-finish-title"><BookOpen size={28} aria-hidden="true" /><h2 id="learn-finish-title">A safer next step.</h2><p>Choose your shelter, save your emergency contacts, and talk through your plan with someone you trust.</p><div><a className="button" href="/register" onClick={handleRouteClick}>Register for alerts <ArrowRight size={17} aria-hidden="true" /></a><a className="text-link" href="#guide-top">Back to the guide <ArrowUp size={15} aria-hidden="true" /></a></div></section>
        <p className="learn-editorial-note">Sources checked October 19, 2026. Illustrations show simplified ideas, not exact storm sizes or safe-distance measurements. Sources are linked in each chapter.</p>
      </div>
    </div>
  </main>
}
