import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ArrowDown, ArrowUpRight, CloudLightning, Menu, Snowflake, Wind, X } from 'lucide-react'
import './styles.css'

type Storm = { id: string; title: string; summary: string; detail: string; image: string; icon: typeof Wind }

const storms: Storm[] = [
  { id: 'thunderstorms', title: 'Thunderstorms', summary: 'The atmosphere puts on a light show.', detail: 'A thunderstorm is a local storm produced by a cumulonimbus cloud and accompanied by lightning and thunder. Severe thunderstorms can produce hail at least 1 inch in diameter or wind gusts of 58 mph or higher.', image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1400&q=85', icon: CloudLightning },
  { id: 'tornadoes', title: 'Tornadoes', summary: 'Small in scale. Enormous in force.', detail: 'A tornado is a violently rotating column of air extending from the base of a thunderstorm down to the ground. They can occur at any time of day or night and at any time of year.', image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=1400&q=85', icon: Wind },
  { id: 'hurricanes', title: 'Hurricanes', summary: 'A vast engine powered by warm ocean water.', detail: 'Hurricanes are tropical cyclones with maximum sustained winds of 74 mph or greater. Their hazards include storm surge, flooding, extreme winds, and tornadoes.', image: 'https://images.unsplash.com/photo-1561553590-267fc7166989?auto=format&fit=crop&w=1400&q=85', icon: ArrowUpRight },
  { id: 'blizzards', title: 'Blizzards', summary: 'When snow and wind erase the horizon.', detail: 'A blizzard is a winter storm with frequent wind gusts of at least 35 mph and falling or blowing snow that reduces visibility to a quarter mile or less for at least three hours.', image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=1400&q=85', icon: Snowflake },
]

function Logo() { return <a className="logo" href="#top"><span className="logo-mark">✳</span><span>flood sentry</span></a> }

function Header() {
  const [open, setOpen] = useState(false)
  return <header className="header"><Logo /><nav className={open ? 'nav open' : 'nav'}><a href="#atlas" onClick={() => setOpen(false)}>Explore storms</a><a href="#sources" onClick={() => setOpen(false)}>Sources</a></nav><button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button></header>
}

function Card({ storm }: { storm: Storm }) {
  const Icon = storm.icon
  return <article className="storm-card" id={storm.id}><div className="storm-image"><img src={storm.image} alt={`${storm.title} weather scene`} loading="lazy" /><span className="storm-icon"><Icon size={21} /></span></div><div className="storm-copy"><p className="eyebrow">Storm type / field guide</p><h3>{storm.title}</h3><p className="lead">{storm.summary}</p><p>{storm.detail}</p><a className="text-link" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">Safety guidance <ArrowUpRight size={16} /></a></div></article>
}

function App() {
  return <div id="top"><Header /><main>
    <section className="hero"><div><p className="eyebrow"><span className="pulse" /> A field guide to severe weather</p><h1>When the sky<br />gets <em>serious.</em></h1><p className="hero-text">Flood Sentry is a clear, visual introduction to the forces that shape our atmosphere—and how to stay ready when they arrive.</p><a className="button" href="#atlas">Explore the guide <ArrowDown size={17} /></a></div><div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbital-sun" /></div></section>
    <section className="intro section"><div><p className="eyebrow">The big picture</p><h2>Every storm<br />has a <em>story.</em></h2></div><p>Storms are disturbances in the atmosphere, ranging from a brief thunderstorm to a sprawling tropical cyclone. Their shapes, ingredients, and hazards are different—but understanding the basics helps us make better decisions.</p></section>
    <section className="atlas section" id="atlas"><div className="section-heading"><div><p className="eyebrow">The guide / 04 entries</p><h2>Meet the <em>forces.</em></h2></div><p>Explore four of Earth’s most powerful weather systems.</p></div><div className="storm-grid">{storms.map(storm => <Card key={storm.id} storm={storm} />)}</div></section>
    <section className="sources section" id="sources"><p className="eyebrow">Keep exploring</p><h2>Built from<br /><em>good sources.</em></h2><div className="source-list"><a href="https://www.weather.gov/spotterguide/types" target="_blank" rel="noreferrer"><span>NOAA / National Weather Service</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/hurricane" target="_blank" rel="noreferrer"><span>Hurricane safety & science</span><ArrowUpRight size={16} /></a><a href="https://www.weather.gov/safety/tornado" target="_blank" rel="noreferrer"><span>Tornado safety & science</span><ArrowUpRight size={16} /></a></div></section>
  </main><footer><Logo /><p>Educational guide · Always follow local official guidance.</p><a href="#top">Back to top ↑</a></footer></div>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
