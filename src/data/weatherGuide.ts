export type WeatherChapter = {
  id: string
  shortTitle: string
  title: string
  introduction: string
  causes: string[]
  impacts: { title: string; text: string }[]
  action: string
  before: string[]
  during: string[]
  after: string[]
  phaseLabels?: [string, string, string]
  remember: { title: string; text: string }
  science: string[]
  sources: { label: string; href: string }[]
}

export const weatherChapters: WeatherChapter[] = [
  {
    id: 'weather-basics', shortTitle: 'How weather works', title: 'It starts with sun, air, and water.',
    introduction: 'Weather is what the air is doing at a certain place and time. It includes temperature, clouds, rain, and wind. A sunny morning can become a stormy afternoon because the air around us keeps moving and changing.',
    causes: [
      'The Sun warms Earth unevenly. A parking lot can heat faster than a nearby lake. These differences help air move. Warm air can rise, while cooler air moves in underneath. Moving air is wind.',
      'The Sun also turns some liquid water into an invisible gas called water vapor. This change is evaporation. When moist air rises and cools enough, some vapor becomes tiny water drops or ice crystals. Together, they make a cloud.',
      'Cloud drops and ice particles can grow and fall as rain, snow, or other forms of water. Some water soaks into the ground. Some flows downhill into streams. The water cycle connects the sky, land, and ocean.',
    ],
    impacts: [
      { title: 'Daily life', text: 'Weather changes what we wear, how we travel, and whether it is safe to work or play outside.' },
      { title: 'Water and food', text: 'Rain supports drinking-water supplies and crops. Too much or too little can cause problems.' },
      { title: 'Different local risks', text: 'Hills, coastlines, streets, and nearby rivers help shape the weather and its effects.' },
    ],
    action: 'Check the forecast for the place you will be, not just the place you are now.',
    before: [
      'Check the whole day’s forecast before travel or outdoor plans. Look at rain, wind, temperature, and any alerts.',
      'Choose a nearby indoor place you could reach if the weather changes. Tell someone where you plan to go.',
      'Bring clothes and supplies for the expected conditions. A charged phone helps, but it should not be your only plan.',
    ],
    during: [
      'Notice changes, such as growing dark clouds, stronger wind, or thunder. Check for new official alerts.',
      'Change your plans when conditions become unsafe. A forecast is useful guidance, not a promise that weather will stay the same.',
      'Ask a trusted person to explain an unfamiliar alert. Read what place it covers and what action it asks you to take.',
    ],
    after: [
      'Compare what you saw with the forecast. This can help you recognize changes next time.',
      'Learn the risks near your home, school, or workplace. Different places can need different safety plans.',
    ],
    phaseLabels: ['Before you go out', 'As the day changes', 'Keep learning'],
    remember: { title: 'Weather and climate are different.', text: 'Weather describes conditions now or soon. Climate describes the usual patterns in a place over many years.' },
    science: [
      'Air pressure is the push from the weight of air. Differences in pressure help drive wind. Earth’s rotation also affects its direction.',
      'A front is a boundary between different air masses. Fronts can lift warm, moist air and help clouds or storms form.',
    ],
    sources: [
      { label: 'NOAA · Weather and atmosphere', href: 'https://www.noaa.gov/education/resource-collections/weather-atmosphere' },
      { label: 'NOAA · The water cycle', href: 'https://www.noaa.gov/education/resource-collections/freshwater/water-cycle' },
      { label: 'NOAA · Weather patterns', href: 'https://www.noaa.gov/education/resource-collections/weather-atmosphere/weather-systems-patterns' },
    ],
  },
  {
    id: 'floods', shortTitle: 'Floods & flash floods', title: 'When water has nowhere safe to go.',
    introduction: 'A flood happens when water covers land that is usually dry. A flash flood rises quickly, sometimes before people realize there is danger. Flooding can happen on a city street, beside a river, or in a dry canyon.',
    causes: [
      'Heavy rain can fall faster than the ground can absorb it. Soil that is already wet has less room for more water. Pavement also sends water toward drains and low places instead of letting it soak in.',
      'Rivers can overflow after rain or melting snow. A damaged dam can release water suddenly. Along the coast, a storm can push seawater onto land. Floodwater can arrive from rain that fell far upstream.',
      'Steep slopes help water move quickly downhill. Recently burned land can also produce dangerous runoff and flows of mud and rocks. A small creek or an empty road crossing can change very quickly.',
    ],
    impacts: [
      { title: 'Roads disappear', text: 'Water can wash away the road below it. You cannot judge its depth or speed by looking.' },
      { title: 'Homes lose protection', text: 'Water can damage walls, floors, wiring, and belongings. Mold may grow after the water leaves.' },
      { title: 'People and animals get trapped', text: 'Moving water can knock people down. Even large vehicles can be carried away.' },
    ],
    action: 'Move away from rising water toward higher ground. Never enter a flooded road.',
    before: [
      'Find out whether places you use can flood. Plan a route to higher ground that avoids low roads and stream crossings.',
      'Keep medicine, important papers, chargers, and pet supplies ready to carry. Arrange transport before bad weather if you need help.',
      'At a campsite, check nearby streams and uphill drainage areas. Rain does not need to fall on your tent to cause flooding.',
    ],
    during: [
      'Follow evacuation instructions promptly. Do not wait to see water inside your home before taking a flood warning seriously.',
      'Do not walk, swim, or drive through floodwater. Keep children away from flooded drains, creeks, and road crossings.',
      'If trapped, reach the highest safe point you can and call 911. Avoid a closed attic where rising water could trap you.',
    ],
    after: [
      'Wait for officials to say an area is safe. Avoid damaged buildings, fallen wires, and standing water near electrical equipment.',
      'Follow local drinking-water advice. Keep children out of cleanup areas, and ask for help with damaged wiring or unsafe floors.',
    ],
    remember: { title: 'A bigger vehicle is not a safe solution.', text: 'Floodwater can move vehicles and hide a missing road. Turn around and find a route that is open and dry.' },
    science: [
      'Runoff is water that flows over land instead of soaking into it. A watershed is the whole area that drains toward a stream or river.',
      'Flash flooding commonly begins within six hours of its cause, and it can begin much sooner. River flooding may build more slowly.',
    ],
    sources: [
      { label: 'NWS · How flash flooding happens', href: 'https://www.weather.gov/phi/FlashFloodingDefinition' },
      { label: 'NWS · During a flood', href: 'https://www.weather.gov/safety/flood-during' },
      { label: 'NWS · After a flood', href: 'https://www.weather.gov/safety/flood-after' },
      { label: 'NWS · Flood escape and shelter', href: 'https://www.weather.gov/pah/FloodSafetyWeek' },
    ],
  },
  {
    id: 'thunderstorms', shortTitle: 'Thunder, lightning & hail', title: 'One cloud can bring several hazards.',
    introduction: 'A thunderstorm is a storm that produces lightning and thunder. It can also bring heavy rain, hail, and damaging wind. A storm does not need to be called “severe” for its lightning to be dangerous.',
    causes: [
      'Thunderstorms need moist air, air that can keep rising, and a push upward. A warm surface, a hill, or a front can supply that push. As rising air cools, a tall cloud grows.',
      'Inside the cloud, water drops and ice particles collide. These collisions help separate electric charges. Lightning is a sudden electrical discharge. It heats the air so quickly that the air expands and makes the sound of thunder.',
      'Strong upward winds can hold growing pieces of ice inside the cloud. These pieces are hailstones. They fall when the cloud’s upward wind can no longer support them. Downward winds can spread out at the ground and damage trees or buildings.',
    ],
    impacts: [
      { title: 'Lightning injuries', text: 'A strike can seriously injure or kill a person. Lightning can reach places outside the heaviest rain.' },
      { title: 'Broken windows and roofs', text: 'Hail can damage cars, crops, and homes. Wind can throw loose objects and break branches.' },
      { title: 'Sudden water problems', text: 'Heavy rain can flood roads and low ground. Several hazards can happen at the same time.' },
    ],
    action: 'If you hear thunder, go inside a sturdy building or an enclosed, hard-topped vehicle.',
    before: [
      'Check for thunderstorms before outdoor work, sports, or swimming. Decide who will stop the activity and where everyone will shelter.',
      'Bring pets indoors. Secure loose outdoor items before the storm arrives, while it is still safe outside.',
      'Remember that a picnic shelter, open garage, tent, or isolated tree does not provide safe lightning shelter.',
    ],
    during: [
      'Leave open fields, water, and exposed high places. Reach proper shelter as soon as you hear thunder.',
      'Inside, stay away from windows and plumbing. Avoid showers, corded phones, and equipment plugged into electrical outlets.',
      'Stay sheltered for at least 30 minutes after the last thunder. Restart that wait if you hear thunder again.',
    ],
    after: [
      'Watch for fallen branches, broken glass, and damaged wires. Do not touch a wire or anything touching it.',
      'Call 911 if someone is struck by lightning. They do not carry an electrical charge. Follow the dispatcher’s first-aid instructions.',
    ],
    remember: { title: 'Thunder is your cue to act.', text: 'You do not need to see a lightning bolt or feel rain before seeking shelter.' },
    science: [
      'An updraft is air moving upward. A downdraft is air moving downward. Both can exist inside a mature thunderstorm.',
      'NWS severe-thunderstorm criteria include hail at least one inch across or wind gusts of at least 58 mph. Lightning is dangerous below these thresholds.',
    ],
    sources: [
      { label: 'NOAA · Thunderstorm ingredients', href: 'https://www.noaa.gov/jetstream/thunderstorms/ingredients-for-thunderstorm' },
      { label: 'NWS · Lightning science', href: 'https://www.weather.gov/safety/lightning-science-scienceintro' },
      { label: 'NOAA · Hail', href: 'https://www.noaa.gov/jetstream/hail' },
      { label: 'NWS · Lightning precautions', href: 'https://www.weather.gov/safety/lightning-tips' },
      { label: 'CDC · Lightning first aid', href: 'https://www.cdc.gov/lightning/safety/' },
      { label: 'NWS · Severe thunderstorms', href: 'https://www.weather.gov/safety/thunderstorm' },
    ],
  },
  {
    id: 'tornadoes', shortTitle: 'Tornadoes', title: 'Fast-moving wind. A small place to shelter.',
    introduction: 'A tornado is a violently rotating column of air that connects a thunderstorm to the ground. It can damage a small area very severely. Rain or darkness can hide it, so waiting to see a funnel is dangerous.',
    causes: [
      'Some thunderstorms grow in air where wind speed or direction changes with height. This change is called wind shear. Under the right conditions, the storm develops a rotating area of rising air.',
      'Most rotating thunderstorms do not produce tornadoes. When rotation becomes concentrated and reaches the ground, a tornado can form. Scientists still study why one storm produces a tornado while another does not.',
      'A tornado’s visible funnel is made of tiny water drops. Dust and flying debris can also reveal the rotation. The dangerous wind can reach beyond the part of the funnel you see.',
    ],
    impacts: [
      { title: 'Flying debris', text: 'Roof pieces, branches, and everyday objects can fly through the air and hit people at high speed.' },
      { title: 'Severe building damage', text: 'Roofs and walls can fail. Mobile homes are especially vulnerable.' },
      { title: 'Blocked roads and lost power', text: 'Debris and broken utilities can delay rescue and make travel unsafe after the tornado passes.' },
    ],
    action: 'For a tornado warning, reach a sturdy shelter immediately. Get low, stay inside, and protect your head.',
    before: [
      'Choose a basement, approved storm shelter, or small interior room on the lowest floor of a sturdy building.',
      'If you live in a mobile home, arrange a sturdy shelter you can reach before the storm. Practice the trip in advance.',
      'Keep shoes, a flashlight, and head protection near your shelter. Know the shelter plan at school, work, and places you visit.',
    ],
    during: [
      'Act on the warning for your location. Do not go outside to look for the tornado or film it.',
      'Stay away from windows and large open rooms. Cover your head and neck with your arms, a helmet, or a sturdy cushion.',
      'Do not shelter under a highway overpass. If outside, get to a nearby sturdy building as quickly as you safely can.',
    ],
    after: [
      'Keep monitoring alerts. More than one tornado or storm can affect the same area.',
      'Avoid damaged structures and power lines. Wear sturdy shoes where debris is present, and leave rescue routes clear.',
    ],
    remember: { title: 'Do not open windows.', text: 'Opening windows does not protect your home from a tornado. Spend that time reaching your shelter.' },
    science: [
      'A supercell is a thunderstorm with a persistent rotating updraft. Many strong tornadoes develop from supercells, but other storms can produce tornadoes too.',
      'The Enhanced Fujita scale rates tornadoes from EF0 to EF5 using surveyed damage. A rating is usually assigned after the event.',
    ],
    sources: [
      { label: 'NOAA NSSL · Tornado formation', href: 'https://www.nssl.noaa.gov/education/svrwx101/tornadoes/types/' },
      { label: 'NOAA NSSL · Tornado basics', href: 'https://www.nssl.noaa.gov/education/svrwx101/tornadoes/' },
      { label: 'NWS · Tornado precautions', href: 'https://www.weather.gov/safety/tornado-during' },
      { label: 'NWS · Shelter and common myths', href: 'https://www.weather.gov/bmx/sps_torsafetyrules' },
    ],
  },
  {
    id: 'hurricanes', shortTitle: 'Hurricanes & storm surge', title: 'An ocean storm can reach far inland.',
    introduction: 'A hurricane is a large rotating storm that forms over warm ocean water. Its strong winds are only part of the danger. Seawater, heavy rain, rough surf, and tornadoes can threaten different places at different times.',
    causes: [
      'Warm ocean water supplies heat and moisture. Air rises inside clusters of storms, and more air moves inward near the surface. When conditions support organized rotation, a tropical storm can develop and strengthen.',
      'A strong hurricane may have a relatively calm center called the eye. The ring around it, called the eyewall, contains some of its strongest winds. Other bands of rain can stretch far from the center.',
      'Wind can push seawater toward the coast. This extra rise above the expected tide is storm surge. Waves ride on top of that raised water. Inland, long periods of rain can overflow streams and rivers.',
    ],
    impacts: [
      { title: 'Coastal flooding', text: 'Storm surge can cover roads and buildings and cut off evacuation routes.' },
      { title: 'Inland flooding and wind', text: 'Danger can continue far from the beach and after the storm’s strongest winds weaken.' },
      { title: 'Long disruptions', text: 'Power, water, roads, and shops can remain unavailable for days or longer.' },
    ],
    action: 'Know your evacuation zone. Leave when local officials tell your zone to evacuate.',
    before: [
      'Plan where you will go and how you will get there. Include pets, medicine, mobility needs, and people who depend on you.',
      'Prepare supplies and protect windows before strong winds arrive. Bring loose outdoor items inside while conditions are still safe.',
      'Read the wind, rain, flood, and storm-surge information. Do not make decisions from the storm’s category alone.',
    ],
    during: [
      'If told to evacuate, follow the route and timing from local officials. Do not wait for wind or water to block your exit.',
      'If staying in a safe location outside flood danger, use an interior room away from windows. Keep listening for official instructions.',
      'Stay inside during a sudden calm. The eye may be passing, and dangerous winds can return from a different direction.',
    ],
    after: [
      'Return only when officials say it is safe. Treat flooded roads, damaged wiring, and unsafe drinking water as continuing hazards.',
      'Keep generators outside, at least 20 feet from doors, windows, and vents. Never use one in a house or garage.',
    ],
    remember: { title: 'A low category does not mean low flood risk.', text: 'The hurricane category describes sustained wind. It does not measure every danger from rain, storm surge, or tornadoes.' },
    science: [
      'A tropical cyclone is the broader name for this type of rotating ocean storm. Atlantic hurricanes have sustained winds of at least 74 mph.',
      'Storm tide combines storm surge with the normal tide. A forecast cone describes possible paths of the center, not the full area of danger.',
    ],
    sources: [
      { label: 'NOAA · How hurricanes form', href: 'https://oceanexplorer.noaa.gov/ocean-fact/hurricanes/' },
      { label: 'National Hurricane Center · Storm surge', href: 'https://www.nhc.noaa.gov/surge/' },
      { label: 'NWS · Hurricane actions', href: 'https://www.weather.gov/safety/hurricane-action' },
      { label: 'National Hurricane Center · All hurricane hazards', href: 'https://www.nhc.noaa.gov/prepare/hazards.php' },
      { label: 'CDC · Generator safety', href: 'https://www.cdc.gov/natural-disasters/psa-toolkit/use-a-generator-safely.html' },
    ],
  },
  {
    id: 'winter-storms', shortTitle: 'Snow, ice & winter storms', title: 'A thin layer of ice can change everything.',
    introduction: 'Winter storms can bring snow, ice, strong wind, and dangerous cold. A deep snowfall is easy to notice. A thin, nearly clear ice layer can be harder to see and still make a road or sidewalk unsafe.',
    causes: [
      'Snow forms as ice crystals in clouds. If the air below remains cold enough, the snow reaches the ground without melting. Wind can blow fresh or old snow across roads and reduce what you can see.',
      'Sleet begins as snow that melts and then freezes again before reaching the ground. Freezing rain reaches the ground as liquid and freezes when it touches a cold surface. It can coat trees, wires, steps, and roads.',
      'The temperature at your front door does not tell the whole story. Warmer or colder layers above you affect what falls. Road surfaces may also be colder than the air, especially on bridges.',
    ],
    impacts: [
      { title: 'Falls and crashes', text: 'Snow and ice reduce traction. Blowing snow can hide other vehicles and road edges.' },
      { title: 'Power and heating loss', text: 'Heavy ice can break branches and power lines. A long outage can make an indoor space dangerously cold.' },
      { title: 'Cold exposure', text: 'Wet clothes, wind, and being stranded increase the risk of injury from cold.' },
    ],
    action: 'Avoid unnecessary travel during dangerous winter weather. Reach a warm, safe shelter before conditions worsen.',
    before: [
      'Check the forecast and road reports. Keep blankets, water, food, and a phone charger in your vehicle.',
      'Stock essential medicine and food that does not need cooking. Prepare for a power outage, especially if you use medical equipment.',
      'Check heating equipment, smoke alarms, and carbon monoxide alarms. Plan a safe heated place to go if your home loses heat.',
    ],
    during: [
      'Stay indoors when possible. Outside, wear warm layers, cover exposed skin, and replace wet clothes with dry ones.',
      'If stranded in snow, usually stay with your vehicle and call for help. Do not walk into poor visibility searching for shelter.',
      'Never heat your home with an oven, charcoal grill, or indoor generator. Fuel-burning equipment can release carbon monoxide, a poisonous gas you cannot see or smell.',
    ],
    after: [
      'Keep watching for ice after the snow stops. Walk carefully and avoid standing under damaged branches or wires.',
      'Take breaks when clearing snow. Stop if you feel unwell, and ask for help rather than pushing through heavy work in the cold.',
    ],
    remember: { title: 'Wet-looking roads may be icy.', text: 'Ice is not always white or easy to see. Slow down and leave extra space if travel is necessary and roads are open.' },
    science: [
      'A blizzard combines strong wind and very low visibility from falling or blowing snow. Large snowfall totals alone do not define a blizzard.',
      'Freezing rain and sleet differ in where the water freezes: on contact with a surface, or in the air before landing.',
    ],
    sources: [
      { label: 'NWS · Freezing rain and sleet', href: 'https://www.weather.gov/rnk/measure_icing' },
      { label: 'NWS · Prepare for winter storms', href: 'https://www.weather.gov/safety/winter-before' },
      { label: 'NWS · During a winter storm', href: 'https://www.weather.gov/safety/winter-during' },
      { label: 'NWS · Winter hazards', href: 'https://www.weather.gov/dmx/wintersafety' },
    ],
  },
  {
    id: 'heat-and-cold', shortTitle: 'Extreme heat & cold', title: 'Weather affects the body, too.',
    introduction: 'Dangerous weather does not always look like a storm. Several very hot days or a period of bitter cold can harm people quietly. Age, health, work, housing, and access to heating or cooling all affect someone’s risk.',
    causes: [
      'Your body gives off heat to stay near a steady temperature. In hot weather, sweat can help cool you as it evaporates. Humid air slows that cooling. Direct sun and hard work can add more heat.',
      'In cold weather, your body can lose heat faster than it makes heat. Wind speeds up heat loss from exposed skin. Wet clothing also makes staying warm harder, even when the air is above freezing.',
      'Homes without safe heating or cooling can become dangerous during long temperature extremes. Young children, older adults, outdoor workers, and people with some health conditions may need extra support.',
    ],
    impacts: [
      { title: 'Heat illness', text: 'Heavy sweating, headache, weakness, or dizziness can signal heat exhaustion. Confusion or collapse can signal heat stroke.' },
      { title: 'Hypothermia', text: 'The body becomes dangerously cold. Warning signs can include confusion, slurred speech, clumsy hands, or unusual sleepiness.' },
      { title: 'Frostbite', text: 'Skin and other tissue can freeze. Numbness or skin that looks pale and feels firm can be a warning sign.' },
    ],
    action: 'Confusion, collapse, or severe symptoms in heat or cold need emergency help. Call 911.',
    before: [
      'Identify a cooling center or warm public place. Arrange a ride early if you cannot reach a safe temperature at home.',
      'Plan regular check-ins with people who may need help. Keep pets in a safe, comfortable space with water.',
      'Follow your doctor’s advice about fluids and medicines. Some health conditions require a personal plan during extreme temperatures.',
    ],
    during: [
      'In heat, use air-conditioned spaces, reduce hard outdoor work, and drink water regularly unless your doctor has limited fluids.',
      'For suspected heat stroke, call 911 and start cooling the person in a cooler place with wet cloths. Do not give anything to drink.',
      'In cold, get to warm shelter and change wet clothes. For suspected hypothermia, get emergency care and cover the person with dry layers.',
    ],
    after: [
      'Get medical advice for ongoing symptoms. Do not rub frostbitten skin or use direct high heat on numb areas.',
      'Keep checking on people during long outages. Never leave a child, dependent adult, or pet in a parked vehicle.',
    ],
    remember: { title: 'A person with heat stroke may still be sweating.', text: 'Do not wait for dry skin before calling for help. Confusion or collapse in the heat is an emergency.' },
    science: [
      'The heat index combines temperature and humidity to describe how hot conditions can feel. It is not the same as the air temperature.',
      'Wind chill describes heat loss from exposed skin in cold, windy air. Hypothermia can also happen in cool weather when someone is wet.',
    ],
    sources: [
      { label: 'CDC · Extreme heat precautions', href: 'https://www.cdc.gov/climate-health/php/resources/protect-yourself-from-the-dangers-of-extreme-heat.html' },
      { label: 'CDC · Heat illness and first aid', href: 'https://www.cdc.gov/niosh/heat-stress/about/illnesses.html' },
      { label: 'CDC · Heat illness quick guide', href: 'https://stacks.cdc.gov/view/cdc/59395' },
      { label: 'CDC · Cold injuries and precautions', href: 'https://www.cdc.gov/winter-weather/prevention/preventing-frostbite.html' },
    ],
  },
  {
    id: 'wind-dust-fog', shortTitle: 'Wind, dust & fog', title: 'When the road ahead disappears.',
    introduction: 'Strong wind can cause damage without a tornado. It can also lift dust into the air. Fog is different: it is a cloud near the ground. Both fog and blowing dust can make travel dangerous by hiding what lies ahead.',
    causes: [
      'Wind develops as air moves in response to differences in pressure. Storms can create short, powerful bursts. When wind reaches loose, dry soil, it can lift enough dust to form a thick wall across a road.',
      'Fog forms when air near the ground becomes cool and moist enough for tiny water drops to collect in it. It often forms near water or in valleys. It can also move into an area from somewhere else.',
      'Visibility means how far you can see clearly. It can drop suddenly as you enter a patch of fog or dust. A road that looked clear a moment ago may no longer be safe.',
    ],
    impacts: [
      { title: 'Falling objects', text: 'Strong wind can break limbs, topple trees, and move loose equipment.' },
      { title: 'Road collisions', text: 'Drivers may not see a stopped car or a sharp bend until they are very close.' },
      { title: 'Breathing problems', text: 'Blowing dust can irritate eyes and lungs. People with breathing conditions may be affected more.' },
    ],
    action: 'Delay travel when visibility is poor. Do not drive into a dust storm.',
    before: [
      'Check wind and visibility forecasts before a trip. Leave extra time, and choose to wait when travel conditions are unsafe.',
      'Secure loose items outdoors before strong wind arrives. Plan an indoor activity away from trees and exposed structures.',
      'Make sure vehicle lights and wipers work. Know where you could safely leave the road without stopping in a traffic lane.',
    ],
    during: [
      'In strong wind, go inside a sturdy building and stay away from windows. Avoid trees, signs, and damaged power lines.',
      'In fog, slow down and use low-beam headlights. Increase following distance. High beams can reflect off the fog and worsen glare.',
      'If dust blocks visibility, safely leave the roadway completely. Once stopped safely off the road, turn all lights off. Set the parking brake and release the brake pedal.',
    ],
    after: [
      'Wait for a clear view before returning to the road. Follow local road closures and traffic instructions.',
      'Avoid damaged trees and wires. Report hazards from a safe place rather than trying to move them yourself.',
    ],
    remember: { title: 'Fog and dust need different driving responses.', text: 'Use low beams while driving in fog. The lights-off dust guidance applies only after safely stopping completely off the roadway.' },
    science: [
      'Straight-line wind travels outward rather than rotating like a tornado. It can still cause severe damage.',
      'Fog contains suspended liquid water drops, not visible water vapor. Freezing fog can deposit ice on cold surfaces.',
    ],
    sources: [
      { label: 'NWS · High wind precautions', href: 'https://www.weather.gov/safety/wind-during' },
      { label: 'NWS · Driving in fog', href: 'https://www.weather.gov/safety/fog-driving' },
      { label: 'NWS · Dust storm safety', href: 'https://www.weather.gov/twc/monsoonsafety' },
      { label: 'NWS and ADOT · Dust storm road actions', href: 'https://www.weather.gov/media/twc/DustSafetyADOT2014Bold.pdf' },
    ],
  },
  {
    id: 'drought-fire-smoke', shortTitle: 'Drought, wildfire & smoke', title: 'Dry land can send danger downwind.',
    introduction: 'Drought is a long period without enough water for a place’s usual needs. It can dry plants and soil. A wildfire is a fire that spreads through vegetation. Smoke can affect people far from the flames.',
    causes: [
      'Too little rain over time can reduce water in soil, streams, and reservoirs. Heat and wind can dry the land further. Dry grass, leaves, and branches can become fuel that burns easily.',
      'A spark or lightning strike can start a fire when fuel is ready to burn. Wind can spread flames and carry burning pieces ahead of a fire. Hot, dry weather can make controlling it harder.',
      'Burning plants, buildings, and other material release smoke. Smoke contains gases and tiny particles. Wind can carry those particles across towns, states, and sometimes much longer distances.',
    ],
    impacts: [
      { title: 'Water and crop losses', text: 'Drought can strain drinking-water supplies, damage crops, and affect animals and ecosystems.' },
      { title: 'Fire and evacuation', text: 'A wildfire can destroy homes and block roads. Conditions can change quickly.' },
      { title: 'Unhealthy air', text: 'Smoke can irritate eyes and lungs and worsen heart or breathing conditions, even far from a fire.' },
    ],
    action: 'Follow evacuation orders for fire. For smoke, seek a safe indoor place with cleaner air.',
    before: [
      'Follow water restrictions and burn bans. Avoid activities that create sparks near dry grass or vegetation.',
      'Plan evacuation routes and prepare essential supplies. Arrange help for anyone who needs extra time or accessible transport.',
      'Identify a room or public space with filtered air. Check AirNow.gov for local air quality and smoke information.',
    ],
    during: [
      'Leave promptly when told to evacuate. A fire-weather warning describes dangerous conditions; it is not the same as an evacuation order.',
      'If staying in a safe area during smoke, close windows and doors and use an appropriate air cleaner if available.',
      'Reduce outdoor exercise. Adults who must go outside can use a well-fitting N95 to reduce smoke particles. It does not protect against all gases.',
    ],
    after: [
      'Keep checking air quality after flames are gone. Keep children away from ash and damaged buildings.',
      'Seek medical help for breathing symptoms. Call 911 for severe trouble breathing, chest pain, or another medical emergency.',
    ],
    remember: { title: 'Choose both cleaner air and a safe temperature.', text: 'If a closed home becomes too hot, reach a cooling or clean-air center. Do not trade smoke exposure for dangerous heat.' },
    science: [
      'The Air Quality Index, or AQI, turns air-pollution measurements into health guidance. Follow advice for your health needs and activity level.',
      'Fine particles in smoke are called PM2.5. They can enter deep into the lungs. A cloth face covering does not reliably filter them.',
    ],
    sources: [
      { label: 'NWS · Understanding drought', href: 'https://www.weather.gov/safety/drought' },
      { label: 'NWS · Fire weather and hazards', href: 'https://www.weather.gov/safety/wildfire-hazards' },
      { label: 'AirNow · When smoke is in the air', href: 'https://www.airnow.gov/wildfires/when-smoke-is-in-the-air/' },
      { label: 'CDC · Smoke exposure and respirators', href: 'https://www.cdc.gov/niosh/outdoor-workers/about/wildfire-smoke.html' },
      { label: 'CDC · Protecting children', href: 'https://www.cdc.gov/wildfires/risk-factors/wildfire-smoke-and-children.html' },
    ],
  },
  {
    id: 'alerts-and-plans', shortTitle: 'Alerts & your safety plan', title: 'A few small steps can make action easier.',
    introduction: 'You do not need to become a weather expert to prepare. Know your local risks, choose where you would go, and keep a few useful supplies ready. Make the plan fit the people and animals who depend on you.',
    causes: [
      'A watch means a hazard is possible. Use that time to prepare. A warning means the hazard is happening, is about to happen, or is expected. Read the message and take the action it describes.',
      'An advisory describes conditions that can still cause problems and need caution. Alert wording and timing vary with the hazard. A warning does not always come after a watch, so be ready to act on either message.',
      'Read four things in any alert: the hazard, the affected place, the time, and the action. Make sure the date is current. A ZIP code is useful for organizing information, but it may not match the exact warning boundary.',
    ],
    impacts: [
      { title: 'A phone may miss a message', text: 'Batteries, reception, power, and alert settings can fail. Keep more than one way to receive warnings.' },
      { title: 'Shelters differ by hazard', text: 'A basement may help during a tornado but can be dangerous during a flood. Match your action to the hazard.' },
      { title: 'Needs are not the same', text: 'Medicine, hearing or vision needs, mobility, language, pets, and transport can change what a useful plan looks like.' },
    ],
    action: 'Know your safer place, your route, and how you will hear the next update.',
    before: [
      'Choose a meeting place and a contact outside your area. Write phone numbers on paper in case your phone stops working.',
      'Use official phone alerts, local emergency messages, and another source such as a weather radio. Check that alerts can wake you.',
      'Discuss hearing, vision, mobility, or communication needs with your support network. Arrange backup power for essential equipment and a backup ride.',
    ],
    during: [
      'Keep water, ready-to-eat food, a flashlight, batteries, a first-aid kit, chargers, medicine, and copies of important documents together.',
      'Aim for at least one gallon of water per person per day for several days. Include water and food for pets.',
      'Build supplies gradually if money or space is limited. Start with items you already have and the needs you cannot do without.',
    ],
    after: [
      'Practice reaching your shelter and leaving by your backup route. Include children and anyone who may need help.',
      'Check supplies and contacts regularly. After an event, note what was difficult and improve the plan together.',
    ],
    phaseLabels: ['Make a plan', 'Gather essentials', 'Practice and update'],
    remember: { title: 'Keep following official instructions after the storm.', text: 'Return only when officials say it is safe. Damaged buildings, unsafe water, and fallen wires can remain dangerous after the sky clears.' },
    science: [
      'Wireless Emergency Alerts, or WEA, deliver selected urgent warnings to supported phones in affected areas. They do not include every weather alert.',
      'NWS means National Weather Service. NOAA means National Oceanic and Atmospheric Administration. Local emergency managers issue evacuation and local response instructions.',
    ],
    sources: [
      { label: 'NWS · Watch, warning, and advisory', href: 'https://www.weather.gov/lwx/FAQ' },
      { label: 'NWS · Wireless Emergency Alerts', href: 'https://www.weather.gov/wrn/wea' },
      { label: 'Ready.gov · Supply checklist (PDF)', href: 'https://www.ready.gov/sites/default/files/documents/files/checklist3.pdf' },
      { label: 'Ready.gov · Make a plan', href: 'https://www.ready.gov/plan' },
      { label: 'CDC · Returning home safely', href: 'https://www.cdc.gov/natural-disasters/safety/returning-home-after-natural-disaster.html' },
    ],
  },
]
