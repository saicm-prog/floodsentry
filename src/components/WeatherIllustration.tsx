import { useId, type ReactNode } from 'react'

type Scene = 'weather-basics' | 'floods' | 'thunderstorms' | 'tornadoes' | 'hurricanes' | 'winter-storms' | 'heat-and-cold' | 'wind-dust-fog' | 'drought-fire-smoke' | 'alerts-and-plans'

const captions: Record<Scene, { title: string; description: string; caption: string }> = {
  'weather-basics': { title: 'Sun, water, clouds, and rain', description: 'Sunlight helps water evaporate from a lake. Moist air rises and cools into a cloud. Rain returns water to the land and lake.', caption: 'The Sun supplies energy. Water moves between the ground, the air, and clouds. This is a simple view of the water cycle.' },
  floods: { title: 'Leave floodwater and move toward higher ground', description: 'Rain fills a low river crossing. A person on dry land moves uphill toward a house, away from the flooded road.', caption: 'Water gathers in low places. Choose an open, dry route to higher ground. Never use a flooded crossing.' },
  thunderstorms: { title: 'A storm cloud and a safer indoor shelter', description: 'Moist air rises into a tall storm cloud. Rain, hail, and lightning fall below it. A person shelters inside a sturdy house away from windows.', caption: 'One thunderstorm can produce several hazards. Hearing thunder is enough reason to go inside proper shelter.' },
  tornadoes: { title: 'Choose a small interior room on the lowest floor', description: 'A cutaway house shows a person in a small room in the center of the lowest floor. Outer rooms and windows are farther from the sheltered person.', caption: 'For a tornado, put walls between you and the outside. Use a basement or storm shelter when available. This drawing shows an interior-room option.' },
  hurricanes: { title: 'Storm surge pushes seawater toward land', description: 'Wind arrows push ocean water toward a shoreline. The water rises above its usual level and reaches coastal buildings. Higher ground lies farther inland.', caption: 'Wind pushes seawater onto the coast. This extra water level is storm surge. Waves can ride on top of it.' },
  'winter-storms': { title: 'Rain can freeze onto cold roads and trees', description: 'Rain falls from a cloud onto surfaces below freezing. Ice coats a tree branch and a road. A nearby house represents warm shelter.', caption: 'Freezing rain makes ice on contact with cold surfaces. A thin layer can cause falls, crashes, and broken branches.' },
  'heat-and-cold': { title: 'Match your protection to the temperature', description: 'On the hot-weather side, a person moves toward shade and water. On the cold-weather side, a person wears layers and moves toward warm shelter.', caption: 'Heat calls for cooling and water. Cold calls for dry layers and warmth. Confusion or collapse needs urgent medical help.' },
  'wind-dust-fog': { title: 'Fog reduces the distance a driver can see', description: 'Two cars on a road are separated by a wide gap. Bands of fog hide the distant road. The nearer vehicle uses low beams.', caption: 'In fog, slow down, use low beams, and leave extra room. Delay travel if you cannot see far enough to drive safely.' },
  'drought-fire-smoke': { title: 'Smoke travels beyond the fire', description: 'Smoke rises from a dry hillside and moves toward a house. The house has closed windows and an air cleaner inside.', caption: 'Wind can carry smoke far from a wildfire. If your location is safe from fire, a cool indoor space with filtered air can reduce exposure.' },
  'alerts-and-plans': { title: 'Prepare during a watch; take action during a warning', description: 'A watch card points to a warning card. Below them are water, a flashlight, and a charged phone. The cards explain prepare and act.', caption: 'A watch gives you time to prepare. A warning calls for action. Warnings can also arrive without an earlier watch.' },
}

function Cloud({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path className="diagram-cloud" d="M22 57C2 57 0 31 19 27C17 4 50-4 62 17C78 2 105 11 105 32C130 29 135 57 111 57Z" /></g>
}

function House({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="diagram-house"><path d="M0 43L55 0L110 43" /><path fill="white" d="M9 38V107H101V38L55 3Z" /><path d="M42 107V69H66V107" /><path className="diagram-fill-light" d="M21 53H34V69H21ZM76 53H89V69H76Z" /></g>
}

function Person({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="diagram-person"><circle cx="0" cy="0" r="8" /><path d="M0 11V39M-16 23L0 15L15 25M0 39L-13 58M0 39L14 58" /></g>
}

function Tree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path className="diagram-fill-light" d="M0 0L-26 41H-15L-36 72H36L15 41H26Z" /><path className="diagram-stroke" d="M0 72V100" /></g>
}

function Car({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`} className="diagram-car"><path d="M0 27L13 21L24 3H61L75 23H90V44H0Z" /><path className="diagram-fill-light" d="M28 8H56L66 23H19Z" /><circle cx="19" cy="44" r="9" /><circle cx="71" cy="44" r="9" /></g>
}

export function WeatherIllustration({ kind }: { kind: string }) {
  const id = useId()
  const scene = kind as Scene
  const caption = captions[scene]
  const arrow = `url(#${id}-arrow)`
  const Arrow = ({ d }: { d: string }) => <path className="diagram-arrow" d={d} markerEnd={arrow} />
  const Label = ({ x, y, children, small = false }: { x: number; y: number; children: ReactNode; small?: boolean }) => <text x={x} y={y} textAnchor="middle" className={small ? 'diagram-label small' : 'diagram-label'}>{children}</text>
  let drawing: ReactNode

  switch (scene) {
    case 'weather-basics': drawing = <>
      <circle cx="57" cy="48" r="23" className="diagram-sun" /><path className="diagram-stroke" d="M57 10V2M57 85V77M20 48H12M102 48H94M31 22L25 16M83 22L89 16" />
      <path className="diagram-land" d="M0 207L200 190L310 150L480 205V260H0Z" /><path className="diagram-water" d="M0 214Q50 204 100 214T200 214V260H0Z" />
      <Cloud x={238} y={29} scale={1.45} />
      <Arrow d="M109 183Q126 82 236 64" /><Arrow d="M375 133L356 172" /><Arrow d="M315 205Q267 230 214 229" />
      <path className="diagram-rain" d="M332 122L325 140M357 122L350 140M382 122L375 140" />
      <Label x={77} y={137}>Vapor rises</Label><Label x={337} y={26}>Clouds form</Label><Label x={419} y={162}>Rain falls</Label><Label x={101} y={244}>Lake</Label>
    </>; break
    case 'floods': drawing = <>
      <Cloud x={28} y={18} /><path className="diagram-rain" d="M49 86L39 107M77 86L67 107M105 86L95 107M133 86L123 107" />
      <path className="diagram-land" d="M0 192H172L343 113H480V260H0Z" /><path className="diagram-road" d="M0 200H173" />
      <path className="diagram-water" d="M0 178Q32 166 64 178T128 178T192 178L173 213H0Z" />
      <House x={351} y={16} scale={.9} /><Person x={257} y={112} scale={.7} /><Arrow d="M274 139L330 112" />
      <Label x={96} y={151}>Flooded crossing</Label><Label x={365} y={174}>Higher ground</Label><Label x={101} y={242}>Stay out of water</Label>
    </>; break
    case 'thunderstorms': drawing = <>
      <Cloud x={20} y={17} scale={1.65} /><path className="diagram-rain" d="M56 130L43 155M86 130L73 155M116 130L103 155" />
      <path className="diagram-bolt" d="M173 118L145 158H164L144 193L192 145H170L187 118Z" />
      <circle className="diagram-hail" cx="66" cy="183" r="5" /><circle className="diagram-hail" cx="95" cy="174" r="7" />
      <path className="diagram-land" d="M0 222H480V260H0Z" /><House x={318} y={115} /><Person x={373} y={191} scale={.53} />
      <Arrow d="M229 183H294" /><Arrow d="M24 187Q7 127 26 101" />
      <Label x={134} y={26}>Storm cloud</Label><Label x={363} y={76}>Go inside</Label><Label x={104} y={244}>Rain · hail · lightning</Label>
    </>; break
    case 'tornadoes': drawing = <>
      <Cloud x={12} y={20} scale={1.1} /><path className="diagram-funnel" d="M36 88Q90 97 125 87L111 111L90 128L83 158L60 183L67 143L49 117Z" />
      <path className="diagram-stroke" d="M45 106L114 100M56 124L98 117M65 143L86 136" />
      <path className="diagram-house" fill="white" d="M190 107L321 24L454 107V228H190Z" /><path className="diagram-stroke" d="M190 138H454M269 138V228M374 138V228" />
      <rect className="diagram-safe-room" x="273" y="143" width="96" height="80" rx="5" /><Person x={321} y={185} scale={.65} />
      <path className="diagram-house" d="M210 158H240V183H210ZM403 158H432V183H403Z" /><Arrow d="M384 111L347 148" />
      <Label x={325} y={251}>Lowest floor · interior room</Label><Label x={323} y={109}>Away from windows</Label>
    </>; break
    case 'hurricanes': drawing = <>
      <path className="diagram-land" d="M257 214L355 160H480V260H257Z" /><House x={363} y={69} scale={.85} />
      <path className="diagram-water" d="M0 163Q30 151 60 163T120 163T180 163T240 163T300 163L342 175L257 224H0Z" />
      <path className="diagram-dashed" d="M0 214H257" /><Arrow d="M65 58H224" /><Arrow d="M86 91H247" />
      <path className="diagram-stroke" d="M279 167V210M272 168H286M272 211H286" />
      <Label x={145} y={40}>Wind toward land</Label><Label x={135} y={145}>Raised water level</Label><Label x={120} y={239}>Usual sea level</Label><Label x={380} y={228}>Coast</Label>
    </>; break
    case 'winter-storms': drawing = <>
      <Cloud x={34} y={11} scale={1.25} /><path className="diagram-rain" d="M71 99L60 121M105 99L94 121M139 99L128 121M173 99L162 121" />
      <path className="diagram-land" d="M0 215H480V260H0Z" /><path className="diagram-ice" d="M0 213H480" />
      <path className="diagram-stroke" d="M70 215V164L41 143M70 180L106 145M70 170L69 128" /><path className="diagram-ice" d="M44 143L69 163L101 147M52 153V166M83 157V170M69 132V158" />
      <House x={326} y={107} scale={.95} /><Car x={158} y={181} scale={.6} />
      <Label x={295} y={56}>Rain meets cold surfaces</Label><Label x={98} y={246}>Ice on roads and branches</Label><Label x={379} y={246}>Warm shelter</Label>
    </>; break
    case 'heat-and-cold': drawing = <>
      <path className="diagram-dashed" d="M240 21V236" /><circle className="diagram-sun" cx="53" cy="50" r="22" />
      <path className="diagram-stroke" d="M53 17V8M53 92V83M20 50H11M95 50H86" /><Tree x={147} y={53} scale={1.2} />
      <Person x={148} y={151} scale={.8} /><path className="diagram-stroke" d="M59 166V204Q59 210 65 210H82Q88 210 88 204V166ZM66 159H81V166H66Z" />
      <path className="diagram-stroke" d="M287 29V77M266 41L308 65M266 65L308 41" /><House x={344} y={51} scale={.9} />
      <Person x={296} y={142} scale={.9} /><path className="diagram-coat" d="M284 154H307L315 181H278Z" /><Arrow d="M321 176L352 176" />
      <Label x={120} y={28}>Hot weather</Label><Label x={119} y={245}>Cooling · shade · water</Label><Label x={367} y={28}>Cold weather</Label><Label x={360} y={245}>Dry layers · warmth</Label>
    </>; break
    case 'wind-dust-fog': drawing = <>
      <path className="diagram-road" d="M0 205H480M0 260H480" /><path className="diagram-dashed" d="M0 234H480" />
      <path className="diagram-fog" d="M49 63H373M125 89H452M27 115H351M154 142H464M263 169H477" />
      <Car x={57} y={164} /><Car x={345} y={155} scale={.75} />
      <path className="diagram-light" d="M147 191L193 203L148 204Z" /><path className="diagram-stroke" d="M204 200H320M204 195V205M320 195V205" />
      <Label x={106} y={148}>Low beams</Label><Label x={260} y={185}>Extra space</Label><Label x={252} y={43}>Fog hides the road ahead</Label>
    </>; break
    case 'drought-fire-smoke': drawing = <>
      <path className="diagram-land" d="M0 194L70 140L150 175L226 215H480V260H0Z" /><Tree x={58} y={91} scale={.62} /><Tree x={131} y={115} scale={.7} />
      <path className="diagram-fire" d="M72 191Q45 174 69 145Q69 164 81 165Q94 144 96 122Q125 156 110 186Q93 207 72 191Z" />
      <path className="diagram-smoke" d="M100 116Q61 62 108 52Q124 15 171 44Q222 25 243 55Q272 41 303 62" /><Arrow d="M234 93H327" />
      <House x={345} y={106} /><rect className="diagram-fill-light" x="366" y="175" width="19" height="29" rx="3" /><path className="diagram-stroke" d="M371 181H380M371 187H380M371 193H380" />
      <Label x={161} y={27}>Smoke moves with wind</Label><Label x={90} y={242}>Dry plants can burn</Label><Label x={370} y={242}>Cleaner air indoors</Label>
    </>; break
    case 'alerts-and-plans': drawing = <>
      <rect className="diagram-alert-card" x="24" y="28" width="190" height="120" rx="12" /><rect className="diagram-safe-room" x="267" y="28" width="190" height="120" rx="12" />
      <Label x={119} y={67}>WATCH</Label><Label x={119} y={96}>Possible</Label><Label x={119} y={124}>Prepare</Label>
      <Arrow d="M226 87H253" /><Label x={363} y={67}>WARNING</Label><Label x={363} y={96}>Read the action</Label><Label x={363} y={124}>Act on it</Label>
      <path className="diagram-house" d="M64 187V234Q64 239 70 239H94Q100 239 100 234V187ZM73 176H91V187H73Z" />
      <path className="diagram-house" d="M202 194H239L230 206V241H211V206ZM209 184H232V194H209Z" />
      <rect className="diagram-house" x="349" y="177" width="35" height="64" rx="5" /><path className="diagram-stroke" d="M358 186H375M363 232H370" />
      <Label x={142} y={210}>Water</Label><Label x={287} y={221}>Light</Label><Label x={426} y={210}>Alerts</Label>
    </>; break
  }

  return <figure className="weather-illustration">
    <svg viewBox="0 0 480 270" role="img" aria-labelledby={`${id}-title ${id}-description`} xmlns="http://www.w3.org/2000/svg">
      <title id={`${id}-title`}>{caption.title}</title><desc id={`${id}-description`}>{caption.description}</desc>
      <defs><marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#176a8b" /></marker></defs>
      {drawing}
    </svg>
    <figcaption>{caption.caption}</figcaption>
  </figure>
}
