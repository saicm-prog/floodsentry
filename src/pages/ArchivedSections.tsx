import { ArrowUpRight } from 'lucide-react'

// Keep the original sections intact. They stay off the page until requested.
export function ArchivedSafetySection() {
  return <section className="safety section" id="safety"><div><h2>Watch means<br /><em>be ready.</em></h2><p className="safety-text">Warning means take action. Have more than one way to receive alerts, know where you will shelter, and follow instructions from your local emergency managers.</p><a className="button dark" href="https://www.weather.gov/safety" target="_blank" rel="noreferrer">NWS safety hub <ArrowUpRight size={17} /></a></div><div className="safety-steps"><div><strong>01</strong><span>Get inside</span><p>Put walls between you and the weather.</p></div><div><strong>02</strong><span>Get informed</span><p>Use NOAA Weather Radio or official alerts.</p></div><div><strong>03</strong><span>Stay put</span><p>Wait for the all-clear from officials.</p></div></div></section>
}

export function ArchivedIntroSection() {
  return <section className="intro section"><div><p className="eyebrow">The big picture</p><h2>Every storm<br />has a <em>story.</em></h2></div><p>Storms are disturbances in the atmosphere, ranging from a brief thunderstorm to a sprawling tropical cyclone. Their shapes, ingredients, and hazards are different—but understanding the basics helps us make better decisions.</p></section>
}
