/* ============================================================================
 * Culture Bridge — Game Data
 * ----------------------------------------------------------------------------
 * A travel adventure across four cultures — India, Japan, the USA and the UK
 * (London). You wander the world, meet locals and folklore "Kindreds", and
 * learn how to behave by *doing* — you pick how to act, and the locals react
 * the way real people would. Bow in Tokyo and you make a friend; hug a stranger
 * and they recoil. The culture learning is a by-product of playing.
 *
 * (The collectible creatures are "Kindreds" — original folklore companions,
 * nothing to do with any other game's "Pals" or "-mon".)
 * ==========================================================================*/

/* ----------------------------------------------------------------------------
 * KINDREDS — folklore companions you can befriend, one set per culture.
 * -------------------------------------------------------------------------- */
const KINDREDS = [
  // ---- India ----
  { id: 'garuda', name: 'Garuda', home: 'india', title: 'The Sky-Sovereign',
    lore: 'A radiant eagle-being and mount of Vishnu, king of all birds.',
    palette: { body: '#e8a33d', accent: '#c0392b', detail: '#fff6e0' } },
  { id: 'naga', name: 'Naga', home: 'india', title: 'The River-Keeper',
    lore: 'A divine serpent guarding water, treasure and temple thresholds.',
    palette: { body: '#2e8b57', accent: '#145a32', detail: '#a9dfbf' } },
  { id: 'airavata', name: 'Airavata', home: 'india', title: 'The Cloud-Elephant',
    lore: 'The great white elephant of Indra who pulls rain from the clouds.',
    palette: { body: '#dfe4ea', accent: '#a4b0be', detail: '#f8c471' } },
  { id: 'hamsa', name: 'Hamsa', home: 'india', title: 'The Wisdom-Swan',
    lore: 'The sacred swan of Saraswati, symbol of knowledge and discernment.',
    palette: { body: '#fdfefe', accent: '#f39c12', detail: '#aed6f1' } },
  { id: 'makara', name: 'Makara', home: 'india', title: 'The Tide-Beast',
    lore: 'A sea-creature with a crocodile body and elephant trunk.',
    palette: { body: '#5dade2', accent: '#21618c', detail: '#d6eaf8' } },
  { id: 'nandi', name: 'Nandi', home: 'india', title: 'The Steadfast Bull',
    lore: 'The gentle bull who is Shiva\'s mount and devoted gatekeeper.',
    palette: { body: '#f5f5dc', accent: '#7d6608', detail: '#d7bde2' } },

  // ---- Japan ----
  { id: 'kitsune', name: 'Kitsune', home: 'japan', title: 'The Clever Fox',
    lore: 'A shape-shifting fox spirit and messenger of the rice deity Inari.',
    palette: { body: '#e67e22', accent: '#ffffff', detail: '#922b21' } },
  { id: 'tanuki', name: 'Tanuki', home: 'japan', title: 'The Jolly Shapeshifter',
    lore: 'A raccoon-dog spirit of good fortune, famous for cheerful mischief.',
    palette: { body: '#8b6f47', accent: '#5d4037', detail: '#f5deb3' } },
  { id: 'kappa', name: 'Kappa', home: 'japan', title: 'The River-Child',
    lore: 'A water imp with a dish on its head; polite if you bow to it first.',
    palette: { body: '#27ae60', accent: '#f9e79f', detail: '#145a32' } },
  { id: 'tengu', name: 'Tengu', home: 'japan', title: 'The Mountain Warrior',
    lore: 'A winged mountain spirit and master of the martial arts.',
    palette: { body: '#c0392b', accent: '#2c3e50', detail: '#f7dc6f' } },
  { id: 'ryu', name: 'Ryu', home: 'japan', title: 'The Wish-Dragon',
    lore: 'A wingless, benevolent water dragon that commands rain and sea.',
    palette: { body: '#3498db', accent: '#e74c3c', detail: '#d6eaf8' } },
  { id: 'baku', name: 'Baku', home: 'japan', title: 'The Dream-Eater',
    lore: 'A gentle chimera that devours nightmares when called at night.',
    palette: { body: '#a569bd', accent: '#4a235a', detail: '#f5eef8' } },

  // ---- USA ----
  { id: 'thunderbird', name: 'Thunderbird', home: 'usa', title: 'The Storm-Bringer',
    lore: 'A colossal sky-spirit whose wings make thunder and eyes flash lightning.',
    palette: { body: '#5d6d7e', accent: '#f4d03f', detail: '#d5dbdb' } },
  { id: 'jackalope', name: 'Jackalope', home: 'usa', title: 'The Tall-Tale Trickster',
    lore: 'A horned jackrabbit from frontier campfire tall tales.',
    palette: { body: '#c8a165', accent: '#7d5a3c', detail: '#f6ddcc' } },
  { id: 'sasquatch', name: 'Sasquatch', home: 'usa', title: 'The Forest Wanderer',
    lore: 'A giant, shy, ape-like being of the Pacific Northwest woods.',
    palette: { body: '#6e5849', accent: '#3e2c23', detail: '#b39a86' } },
  { id: 'mothman', name: 'Mothman', home: 'usa', title: 'The Winged Omen',
    lore: 'A red-eyed winged figure of legend, seen before great events.',
    palette: { body: '#4a235a', accent: '#e74c3c', detail: '#bb8fce' } },
  { id: 'babe', name: 'Babe', home: 'usa', title: 'The Mighty Blue Ox',
    lore: 'The enormous blue ox of lumberjack Paul Bunyan.',
    palette: { body: '#5dade2', accent: '#2874a6', detail: '#d6eaf8' } },
  { id: 'groundhog', name: 'Groundhog', home: 'usa', title: 'The Season-Seer',
    lore: 'The burrowing seer whose shadow is said to foretell spring.',
    palette: { body: '#a04000', accent: '#6e2c00', detail: '#e6b98f' } },

  // ---- UK ----
  { id: 'nessie', name: 'Nessie', home: 'uk', title: 'The Loch Guardian',
    lore: 'The elusive, long-necked creature of Scotland\'s Loch Ness.',
    palette: { body: '#1abc9c', accent: '#0e6655', detail: '#a3e4d7' } },
  { id: 'unicorn', name: 'Unicorn', home: 'uk', title: 'The Regal Horn',
    lore: 'Scotland\'s national animal: a proud, untameable horned horse.',
    palette: { body: '#f4f6f7', accent: '#af7ac5', detail: '#d2b4de' } },
  { id: 'welshdragon', name: 'Welsh Dragon', home: 'uk', title: 'The Red Dragon',
    lore: 'Y Ddraig Goch — the fierce red dragon on the flag of Wales.',
    palette: { body: '#c0392b', accent: '#145a32', detail: '#f5b7b1' } },
  { id: 'pixie', name: 'Cornish Pixie', home: 'uk', title: 'The Merry Sprite',
    lore: 'A tiny, mischievous sprite of the Cornish moors.',
    palette: { body: '#58d68d', accent: '#f7dc6f', detail: '#abebc6' } },
  { id: 'greenman', name: 'Green Man', home: 'uk', title: 'The Leaf-Face',
    lore: 'A foliage-covered spirit of forests and rebirth.',
    palette: { body: '#229954', accent: '#7d6608', detail: '#a9dfbf' } },
  { id: 'blackshuck', name: 'Black Shuck', home: 'uk', title: 'The Ghost Hound',
    lore: 'A huge spectral black dog with fiery eyes of England\'s coasts.',
    palette: { body: '#2c3e50', accent: '#e74c3c', detail: '#85929e' } }
];

/* ----------------------------------------------------------------------------
 * SCENES — the heart of the game. You meet a local (or a curious Kindred) and
 * choose how to ACT. Each choice has a realistic reaction, so you learn the
 * dos and don'ts by consequence, not by being quizzed. Pick a good action and
 * you make a friend; a faux pas gets an (often funny) awkward reaction.
 * Every scene quietly logs a `tip` into your Journal.
 * -------------------------------------------------------------------------- */
const SCENES = {
  india: [
    {
      setup: 'A silver-haired shopkeeper looks up and smiles as you enter.',
      prompt: 'How do you greet them?',
      actions: [
        { text: '🙏 Palms together — "Namaste"', good: true,
          reaction: 'They light up and return your Namaste warmly. A perfect start!',
          tip: 'India: "Namaste" (palms together) is the warm, respectful greeting for anyone.' },
        { text: '🤝 Offer a handshake', good: true,
          reaction: 'They shake your hand kindly — handshakes are fine here too, especially in business.',
          tip: 'India: a handshake is acceptable, but Namaste is always welcome and respectful.' },
        { text: '🤗 Big hug', good: false,
          reaction: 'They stiffen politely — hugging someone you just met is a bit much.',
          tip: 'India: save hugs for close friends; greet elders and strangers with Namaste.' }
      ]
    },
    {
      setup: 'A family invites you into their home for dinner. Slippers wait by the door.',
      prompt: 'At the doorway you...',
      actions: [
        { text: '👟 Slip off your shoes', good: true,
          reaction: 'The host nods, pleased — the home stays clean and respected.',
          tip: 'India (and Japan): remove your shoes before entering a home.' },
        { text: '🚶 Walk straight in with shoes', good: false,
          reaction: 'The host winces and gently points at your feet. Oops — shoes off, please!',
          tip: 'India: wearing outdoor shoes inside a home is considered unclean.' }
      ]
    },
    {
      setup: 'You\'re handed a plate of warm food at a roadside stall.',
      prompt: 'You reach for the food with...',
      actions: [
        { text: '🫱 Your right hand', good: true,
          reaction: 'The vendor beams. Right-handed eating is the polite norm.',
          tip: 'India: eat and pass food with the right hand; the left is considered unclean.' },
        { text: '🫲 Your left hand', good: false,
          reaction: 'The vendor gently nudges your other hand forward. Righty, please!',
          tip: 'India: avoid using the left hand for eating or giving.' }
      ]
    },
    {
      setup: 'A supplier you want a deal with pours you a cup of chai and starts chatting about cricket.',
      prompt: 'You...',
      actions: [
        { text: '☕ Sip, relax and chat first', good: true,
          reaction: 'They grin — trust is building. The deal will come once you\'re friends.',
          tip: 'India: business is relationship-first. Small talk and chai come before the contract.' },
        { text: '📄 Cut to the contract now', good: false,
          reaction: 'They look faintly disappointed at the rush. Slow down — build rapport first.',
          tip: 'India: pushing straight to business can feel cold; invest in the relationship.' }
      ]
    }
  ],

  japan: [
    {
      setup: 'A Tokyo shopkeeper greets you with a neat, polite bow.',
      prompt: 'You respond with...',
      actions: [
        { text: '🙇 A bow back', good: true,
          reaction: 'She bows again, delighted. Beautifully done.',
          tip: 'Japan: greet with a bow — the deeper the bow, the more respect it shows.' },
        { text: '🤝 A handshake', good: false,
          reaction: 'She hesitates, then lightly shakes. Handshakes feel foreign to her.',
          tip: 'Japan: a bow is safer and more natural than a handshake with strangers.' },
        { text: '🤗 A friendly hug', good: false,
          reaction: 'She freezes and steps back, flustered! Personal space, please.',
          tip: 'Japan: never hug someone you just met — it\'s very uncomfortable.' }
      ]
    },
    {
      setup: 'A businesswoman presents her card ("meishi") to you with both hands.',
      prompt: 'You take it and...',
      actions: [
        { text: '🙌 Receive with both hands, read it', good: true,
          reaction: 'She looks impressed — you clearly understand the ritual.',
          tip: 'Japan: take a business card with both hands, study it, place it on the table.' },
        { text: '🤙 Grab it, stuff it in your pocket', good: false,
          reaction: 'Her smile tightens. Pocketing a card carelessly is a real faux pas.',
          tip: 'Japan: never shove a business card into your back pocket or write on it.' }
      ]
    },
    {
      setup: 'You finish a lovely bowl of ramen. The waiter clears your table.',
      prompt: 'You...',
      actions: [
        { text: '🙏 Say thanks, leave no tip', good: true,
          reaction: 'He smiles and thanks you. Great service is simply expected here.',
          tip: 'Japan: there is no tipping culture — a tip can even cause confusion.' },
        { text: '💵 Leave a big cash tip', good: false,
          reaction: 'He chases you down to return the "forgotten" money, confused!',
          tip: 'Japan: tipping is not customary and can feel awkward — a sincere thank-you is enough.' }
      ]
    },
    {
      setup: 'Dinner arrives. You pick up your chopsticks.',
      prompt: 'Between bites you...',
      actions: [
        { text: '🥢 Rest them on the holder', good: true,
          reaction: 'Your host nods approvingly at your table manners.',
          tip: 'Japan: rest chopsticks on the holder; say "itadakimasu" before eating.' },
        { text: '⛩️ Stick them upright in the rice', good: false,
          reaction: 'The table goes quiet — that pose is only for funerals!',
          tip: 'Japan: never stand chopsticks upright in rice; it echoes a funeral rite.' }
      ]
    }
  ],

  usa: [
    {
      setup: 'At a New York meeting, a colleague strides over with a big smile.',
      prompt: 'You greet them with...',
      actions: [
        { text: '🤝 Firm handshake, eye contact', good: true,
          reaction: '"Great to meet you!" They\'re instantly at ease. Solid first impression.',
          tip: 'USA: a firm handshake with eye contact reads as confident and friendly.' },
        { text: '🙇 A deep formal bow', good: false,
          reaction: 'They chuckle, a little unsure how to respond. Bit too formal here!',
          tip: 'USA: skip the bow — a handshake and first names are the norm.' },
        { text: '🤝 A limp, brief handshake', good: false,
          reaction: 'Their smile flickers — a weak handshake reads as unsure.',
          tip: 'USA: a firm (not crushing) handshake signals confidence.' }
      ]
    },
    {
      setup: 'You share a hotel elevator with a stranger. They say "How\'s it going?"',
      prompt: 'You...',
      actions: [
        { text: '😀 Smile and chat back', good: true,
          reaction: 'Easy small talk, a few laughs. You\'ve made the ride friendly.',
          tip: 'USA: friendly small talk with strangers is normal and welcome.' },
        { text: '😐 Stare ahead in silence', good: false,
          reaction: 'An awkward, frosty silence fills the elevator.',
          tip: 'USA: ignoring a friendly opener can come across as cold or rude.' }
      ]
    },
    {
      setup: 'Your diner check arrives: $40 for a great meal, served with a smile.',
      prompt: 'You leave...',
      actions: [
        { text: '💵 About $8 (20%) tip', good: true,
          reaction: 'The server beams — servers here rely on tips as income.',
          tip: 'USA: tip 18–20% at restaurants; it\'s expected, not optional.' },
        { text: '🪙 Just the exact $40', good: false,
          reaction: 'The server\'s face falls. No tip stings in the States.',
          tip: 'USA: not tipping is a real faux pas — servers depend on it.' }
      ]
    },
    {
      setup: 'In a negotiation, your counterpart asks directly: "So, can you do this price?"',
      prompt: 'You reply...',
      actions: [
        { text: '🎯 Clearly: "Yes" or "No, but here\'s my offer"', good: true,
          reaction: 'They nod, appreciating the straight answer. Deal moves fast.',
          tip: 'USA: be direct — say what you mean. "Yes means yes, no means no."' },
        { text: '🌫️ Vaguely: "We\'ll see, maybe, it\'s complicated"', good: false,
          reaction: 'They look frustrated by the runaround. Get to the point!',
          tip: 'USA: dodging a direct question reads as evasive; clarity builds trust.' }
      ]
    }
  ],

  uk: [
    {
      setup: 'At a London office you meet a colleague. It\'s raining, of course.',
      prompt: 'You open with...',
      actions: [
        { text: '🌧️ A handshake and "Miserable weather, eh?"', good: true,
          reaction: 'They relax instantly — weather chat is the perfect ice-breaker.',
          tip: 'UK: a handshake plus light weather small talk is the classic warm opener.' },
        { text: '🤗 A big hug and "Hey buddy!"', good: false,
          reaction: 'They go rigid and give a strained smile. Bit familiar, that.',
          tip: 'UK: greetings are reserved — save the hug, keep some polite distance.' }
      ]
    },
    {
      setup: 'You reach a busy bus stop. Several people are waiting in a neat line.',
      prompt: 'You...',
      actions: [
        { text: '🚶 Join the back of the queue', good: true,
          reaction: 'Approving nods all round. You clearly understand The Queue.',
          tip: 'UK: always join the back of the queue — orderly lines are sacred.' },
        { text: '💨 Slip to the front', good: false,
          reaction: 'Icy glares and loud tuts. Queue-jumping is a cardinal sin here!',
          tip: 'UK: never jump the queue — it\'s one of the great British taboos.' }
      ]
    },
    {
      setup: 'A colleague reviews your work and says: "Yeah, that\'s not bad at all."',
      prompt: 'You take this as...',
      actions: [
        { text: '😊 Genuine praise', good: true,
          reaction: 'Correct! From a Brit, "not bad" often means "really rather good."',
          tip: 'UK: understatement is key — "not bad" is high praise, not faint praise.' },
        { text: '😟 A polite insult', good: false,
          reaction: 'You look crestfallen; they\'re baffled — they meant it as a compliment!',
          tip: 'UK: read the understatement. "Not bad" = good; "interesting" may mean they disagree.' }
      ]
    },
    {
      setup: 'You\'re at the pub with new coworkers. It\'s your turn at the bar.',
      prompt: 'You...',
      actions: [
        { text: '🍻 Buy a round for the whole group', good: true,
          reaction: 'Cheers all round! You\'ve grasped the sacred pub tradition.',
          tip: 'UK: buy your "round" for the group — taking turns at the bar builds bonds.' },
        { text: '🍺 Buy only your own drink', good: false,
          reaction: 'A few raised eyebrows. Skipping your round is quietly frowned upon.',
          tip: 'UK: not buying your round when it\'s your turn seems a bit stingy.' }
      ]
    }
  ]
};

/* ----------------------------------------------------------------------------
 * PHRASEBOOK — everyday & business phrases across all four cultures (menu).
 * -------------------------------------------------------------------------- */
const PHRASEBOOK = [
  { meaning: 'Hello (casual)',   india: 'Namaste — नमस्ते', japan: 'Konnichiwa — こんにちは',
    usa: 'Hey / Hi there',        uk: 'Hiya / You alright?' },
  { meaning: 'Thank you',        india: 'Dhanyavaad — धन्यवाद', japan: 'Arigato — ありがとう',
    usa: 'Thanks / Thank you',    uk: 'Cheers / Ta' },
  { meaning: 'Please',           india: 'Kripya — कृपया', japan: 'Onegai — お願い',
    usa: 'Please',                uk: 'Please / If you would' },
  { meaning: 'Yes / Agreed',     india: 'Haan — हाँ', japan: 'Hai — はい',
    usa: 'Yep / Sure / Sounds good', uk: 'Right / Quite / Lovely' },
  { meaning: 'A polite "no"',    india: 'Nahin — नहीं', japan: 'Chotto... — ちょっと…',
    usa: 'No / I\'ll pass',       uk: 'I\'m not sure that works' },
  { meaning: 'Sorry / Excuse me', india: 'Maaf kijiye — माफ़ कीजिए', japan: 'Sumimasen — すみません',
    usa: 'Excuse me / My bad',    uk: 'Sorry / Pardon' },
  { meaning: 'Nice to meet you', india: 'Aap se mil kar khushi hui', japan: 'Hajimemashite — はじめまして',
    usa: 'Great to meet you!',    uk: 'Pleased to meet you' },
  { meaning: 'Friend',           india: 'Dost — दोस्त', japan: 'Tomodachi — 友達',
    usa: 'Buddy / Pal',           uk: 'Mate' },
  { meaning: 'Delicious',        india: 'Swaadisht — स्वादिष्ट', japan: 'Oishii — 美味しい',
    usa: 'Delicious / So good',   uk: 'Lovely / Gorgeous' },
  { meaning: 'Where\'s the toilet?', india: 'Shauchalay kahan hai?', japan: 'Toire wa doko? — トイレはどこ？',
    usa: 'Where\'s the restroom?', uk: 'Where\'s the loo?' },
  { meaning: 'Cheers! (a toast)', india: 'Cheers!', japan: 'Kanpai! — 乾杯',
    usa: 'Cheers! / Bottoms up',  uk: 'Cheers! / Chin chin' },
  { meaning: 'Goodbye',          india: 'Alvida — अलविदा', japan: 'Sayonara — さようなら',
    usa: 'Bye / Take care',       uk: 'Cheerio / Bye then' }
];

/* ----------------------------------------------------------------------------
 * BUSINESS GUIDE — a quick, practical cheat-sheet per culture (menu).
 * -------------------------------------------------------------------------- */
const BUSINESS_GUIDE = [
  { culture: 'india', flag: '🇮🇳', name: 'India', tips: [
    { label: 'Greeting', text: '"Namaste" or a handshake. Use titles + "-ji" to show respect.' },
    { label: 'Relationships', text: 'Business is personal — chai and trust come before the contract.' },
    { label: 'Hierarchy', text: 'Seniority and age carry weight; greet the most senior person first.' },
    { label: 'Negotiation', text: 'Expect lively bargaining. A head-wobble or "we\'ll see" is not a firm yes.' },
    { label: 'Dining', text: 'Eat with the right hand. Many guests are vegetarian — always ask first.' }
  ] },
  { culture: 'japan', flag: '🇯🇵', name: 'Japan', tips: [
    { label: 'Business cards', text: 'Exchange with both hands, study it, never pocket or write on it.' },
    { label: 'Communication', text: 'Indirect and polite. "That\'s difficult" means no; silence is thoughtful.' },
    { label: 'Punctuality', text: 'Be early. Lateness is a genuine insult.' },
    { label: 'Decisions', text: 'Consensus is built quietly in advance ("nemawashi").' },
    { label: 'Dining', text: 'Pour drinks for others, not yourself. No tipping.' }
  ] },
  { culture: 'usa', flag: '🇺🇸', name: 'USA', tips: [
    { label: 'Greeting', text: 'Firm handshake, eye contact, first names fast.' },
    { label: 'Communication', text: 'Direct and explicit — say what you mean; "no" is fine.' },
    { label: 'Time', text: '"Time is money." Be punctual and expect quick decisions.' },
    { label: 'Negotiation', text: 'Assertive, win-win, and sealed in a detailed written contract.' },
    { label: 'Tipping', text: 'Tip 18–20% at restaurants; business happens over lunch or coffee.' }
  ] },
  { culture: 'uk', flag: '🇬🇧', name: 'UK (London)', tips: [
    { label: 'Greeting', text: 'Handshake with reserved warmth. Open with the weather.' },
    { label: 'Understatement', text: '"Not bad" is high praise; "with respect" precedes disagreement.' },
    { label: 'Politeness', text: '"Please", "thank you", "sorry" — and never jump the queue.' },
    { label: 'Humour', text: 'Dry, self-deprecating irony is a bonding tool.' },
    { label: 'The pub', text: 'Buy your round; relationships grow over a pint. Tip ~10–12.5%.' }
  ] }
];

/* ----------------------------------------------------------------------------
 * SIGNS — read them by walking up and pressing SPACE.
 * -------------------------------------------------------------------------- */
const SIGN_TEXTS = {
  welcome: 'Welcome to CULTURE BRIDGE! Four roads lead to four countries. Explore, meet the ' +
           'locals, and see how they react to what you do — that\'s how you\'ll learn. ' +
           'Move: W/A/D + arrows · Talk: Space · Menu: F or Enter · Bike: S (on cycle paths).',
  hub: 'THE CROSSROADS. West → India · East → Japan · North → London · South → USA. ' +
       'Your Passport (in the menu) stamps each country you visit.',
  india_border: '🇮🇳 WEST ROAD → INDIA (Bharat). Land of chai, colour and warm hospitality. ' +
                'Greet with "Namaste" and lead with the relationship.',
  japan_border: '🇯🇵 EAST ROAD → JAPAN (Nihon). Land of bows and blossoms. Watch, listen, and ' +
                'mind what is left unsaid.',
  london_border: '🇬🇧 NORTH ROAD → LONDON (UK). Mind the queue and the understatement. ' +
                 '"Not bad" is a compliment.',
  usa_border: '🇺🇸 SOUTH ROAD → USA. Direct, fast and friendly. Firm handshake, first names, ' +
              'and tip your server well.',
  bike: '🚲 CYCLE PATH. Press S here to hop on your bike and zoom around. Press S again to hop off.',
  torii: 'A TORII gate marks sacred ground in Japan. Bow slightly as you pass through.'
};

/* NPC dialogue — friendly local guides, one per country + a hub host. */
const NPCS = [
  { name: 'Priya', home: 'india', lines: [
    'Namaste, traveller! I\'m Priya. Welcome to India!',
    'Tip from me: greet people with "Namaste" — palms together — and share a cup of chai before talking business.',
    'Wander into the gardens and see how the locals respond to you. That\'s the best way to learn!'
  ] },
  { name: 'Haruki', home: 'japan', lines: [
    'Konnichiwa! I\'m Haruki. Welcome to Japan.',
    'Here we bow to greet, and we listen for what isn\'t said. If someone says a plan is "a little difficult," that\'s a polite no.',
    'Try things out with the locals — they\'ll show you, gently, what feels right.'
  ] },
  { name: 'Eleanor', home: 'uk', lines: [
    'Hiya, you alright? Eleanor here — welcome to London.',
    'Two golden rules: never jump the queue, and remember "not bad" is actually high praise.',
    'Pop to the pub with the locals and buy your round — that\'s how friendships are made here.'
  ] },
  { name: 'Marcus', home: 'usa', lines: [
    'Hey there! Marcus — welcome to the States!',
    'We keep it direct and friendly: firm handshake, first names, say what you mean.',
    'Chat with folks, and don\'t forget to tip your server 18 to 20 percent!'
  ] },
  { name: 'Senzo', home: 'hub', lines: [
    'Welcome, world-traveller! I\'m Senzo, host of the Crossroads.',
    'Every country has its own way of doing things. The trick isn\'t memorising rules — it\'s watching how people react to you.',
    'Befriend a Kindred in all four countries and you\'ll be at home anywhere on Earth.'
  ] }
];
