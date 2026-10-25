import { ArrowDown, ArrowRight, ArrowUpRight, Bell, CloudLightning, FileText, MapPin, Snowflake, Users, Wind } from 'lucide-react'
import { Disclosure, handleRouteClick } from '../components'

const storms = [
  {
    title: 'Thunderstorms', icon: CloudLightning,
    summary: 'Lightning, heavy rain, and strong winds can arrive quickly.',
    detail: 'Severe thunderstorms produce winds of at least 58 mph or hail at least one inch wide.',
    image: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=900&q=85',
    source: 'https://www.weather.gov/safety/thunderstorm',
  },
  {
    title: 'Tornadoes', icon: Wind,
    summary: 'A rotating column of air can cause damage in seconds.',
    detail: 'A tornado extends from a thunderstorm to the ground. Tornadoes can occur at any time of day or night.',
    image: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?auto=format&fit=crop&w=900&q=85',
    source: 'https://www.weather.gov/safety/tornado',
  },
  {
    title: 'Hurricanes', icon: Wind,
    summary: 'Powerful ocean storms bring wind, heavy rain, and coastal flooding.',
    detail: 'Hurricanes have sustained winds of at least 74 mph. Their hazards include storm surge, inland flooding, and tornadoes.',
    image: '/images/hurricane-weather-scene.png', source: 'https://www.weather.gov/safety/hurricane',
  },
  {
    title: 'Blizzards', icon: Snowflake,
    summary: 'Strong winds and blowing snow can make travel dangerous.',
    detail: 'Blizzards bring sustained winds or frequent gusts of at least 35 mph. Snow reduces visibility below one-quarter mile for at least three hours.',
    image: 'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=900&q=85',
    source: 'https://www.weather.gov/safety/winter-snow',
  },
]

const tools = [
  { href: '/register', title: 'Register for alerts', text: 'Add your email and ZIP code.', icon: Bell },
  { href: '/bulletin', title: 'Upload a bulletin', text: 'Turn a weather report into a clear alert.', icon: FileText },
  { href: '/registrations', title: 'View registrations', text: 'See who has joined the alert list.', icon: Users },
]

export function HomePage() {
  return <main id="main-content" className="home" tabIndex={-1}>
    <div className="hero-wrap">
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow"><span className="label-dot" aria-hidden="true" /> A field guide to severe weather</p>
          <h1>When the sky<br />gets <em>serious.</em></h1>
          <p className="hero-text">Understand storm risks. Turn weather reports into clear local alerts.</p>
          <div className="hero-actions">
            <a className="button" href="/register" onClick={handleRouteClick}>Register for alerts <ArrowRight size={18} /></a>
            <a className="button secondary" href="#atlas">Explore storms <ArrowDown size={18} /></a>
          </div>
          <div className="hero-note"><MapPin size={15} /> U.S. ZIP codes <span aria-hidden="true">·</span> Free registration</div>
        </div>
        <figure className="hero-image">
          <img src="/images/hurricane-weather-scene.png" alt="A hurricane’s eye surrounded by swirling clouds over the ocean" fetchPriority="high" width="1672" height="941" />
          <figcaption><p>See the storm.<br /><strong>Understand the risk.</strong></p><a href="#atlas" aria-label="Explore the storm guide"><ArrowDown size={21} /></a></figcaption>
        </figure>
      </section>
    </div>

    <section className="section container why" id="why">
      <h2>Clarity when <br />it <em>matters.</em></h2>
      <div className="why-copy">
        <p className="section-lead">On July 4, 2025, flash flooding struck Camp Mystic near Hunt, Texas. Twenty-five campers, two counselors, and the camp’s co-director died.</p>
        <p>The National Weather Service issued a flash flood warning at 1:14 a.m. during the storm. The legislative investigation found that the camp delayed evacuation despite that warning.</p>
        <p>That tragedy inspired FloodSentry. Our mission is to turn official weather reports into clear local messages that explain the risk and needed action.</p>
        <Disclosure title="Timeline and sources">
          <p>A flood watch was already in effect on July 3. The 1:14 a.m. warning on July 4 identified life-threatening flooding near Hunt.</p>
          <p>The report places the start of camper evacuation shortly after 3 a.m. It found gaps in evacuation planning and response.</p>
          <p className="small-text">All times are CDT. Texas legislative report, June 18, 2026: pages 35 and 76–79; conclusions C-7, C-10, and C-12.</p>
          <p className="small-text">NWS warning: FFWEWX · VTEC O.NEW.KEWX.FF.W.0038 · July 4, 2025, 1:14 a.m. CDT.</p>
          <a className="text-link" href="https://www.house.texas.gov/pdfs/committees/355/Report-on-the-Camp-Mystic-Flood-Disaster-of-July-4-2025.pdf?d=06182026#page=105" target="_blank" rel="noreferrer">Read the investigation <ArrowUpRight size={16} /></a>
          <a className="text-link" href="https://mesonet.agron.iastate.edu/wx/afos/p.php?pil=FFWEWX&e=202507040614" target="_blank" rel="noreferrer">Read the original warning <ArrowUpRight size={16} /></a>
        </Disclosure>
      </div>
    </section>

    <section className="section container atlas" id="atlas">
      <div className="section-heading atlas-heading"><h2>Know the <em>storm.</em></h2><a className="text-link" href="/learn" onClick={handleRouteClick}>Read the weather guide <ArrowRight size={17} aria-hidden="true" /></a></div>
      <div className="storm-grid">{storms.map(storm => {
        const Icon = storm.icon
        return <article className="storm-card" key={storm.title}>
          <div className="storm-image"><img src={storm.image} alt={`${storm.title} weather scene`} loading="lazy" width="900" height="600" /><span className="storm-icon"><Icon size={20} /></span></div>
          <div className="storm-copy"><h3>{storm.title}</h3><p>{storm.summary}</p>
            <Disclosure title="Storm facts"><p>{storm.detail}</p><a className="text-link" href={storm.source} target="_blank" rel="noreferrer">NWS guidance <ArrowUpRight size={15} /></a></Disclosure>
          </div>
        </article>
      })}</div>
    </section>

    <div className="tools-wrap"><section className="section container tools-section">
      <div className="section-heading"><h2>Stay connected.</h2></div>
      <div className="tools-grid">{tools.map(tool => {
        const Icon = tool.icon
        return <a className="tool-card" href={tool.href} onClick={handleRouteClick} key={tool.href}>
          <span className="tool-icon"><Icon size={23} /></span><h3>{tool.title}</h3><p>{tool.text}</p><ArrowUpRight className="tool-arrow" size={21} />
        </a>
      })}</div>
    </section></div>

    <section className="section container sources" id="sources">
      <div className="sources-intro"><p>Start with clear explanations.<br />Explore the source when you need more detail.</p><h2>Built from <br /><em>good sources.</em></h2></div>
      <div className="source-list">
        <a href="https://www.weather.gov/safety" target="_blank" rel="noreferrer"><span><strong>National Weather Service</strong><small>Storm guidance and safety information</small></span><ArrowUpRight size={20} /></a>
        <a href="https://www.census.gov/geographies/reference-files/2020/geo/relationship-files.html" target="_blank" rel="noreferrer"><span><strong>U.S. Census Bureau</strong><small>2020 county and ZIP-area reference data</small></span><ArrowUpRight size={20} /></a>
        <a href="https://www.weather.gov/media/directives/010_pdfs/pd01017001curr.pdf" target="_blank" rel="noreferrer"><span><strong>NWS bulletin format</strong><small>NWS Instruction 10-1701 · Text product formats</small></span><ArrowUpRight size={20} /></a>
      </div>
    </section>
  </main>
}
