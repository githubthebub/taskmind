/* ============================================================================
 * Culture Bridge — Game Data
 * ----------------------------------------------------------------------------
 * All learning content lives here: the Kotomon (folklore companions), the
 * culture-exchange questions, the bilingual phrasebook, the Business Guide,
 * and the world's signs.
 *
 * The design goal is practical CROSS-cultural fluency across four cultures —
 * India, Japan, the USA and the UK (London) — with a strong emphasis on the
 * things that actually trip people up in everyday life and in business
 * negotiations: greetings, hierarchy, communication style, punctuality,
 * dining, tipping and how each culture says "no".
 * ==========================================================================*/

/* ----------------------------------------------------------------------------
 * KOTOMON — culture companions drawn from the folklore of all four cultures.
 * Each has a "home" culture but carries a cross-cultural note, because those
 * connections are the whole point of the game.
 * -------------------------------------------------------------------------- */
const KOTOMON = [
  // ---- Bharat (India) ----
  {
    id: 'garuda', name: 'Garuda', home: 'india', title: 'The Sky-Sovereign',
    lore: 'A radiant eagle-being and mount of Vishnu, king of all birds in Hindu myth.',
    bridge: 'Buddhism carried Garuda to Japan, where it became "Karura" — and its ' +
            'sky-king role echoes America\'s Thunderbird an ocean away.',
    palette: { body: '#e8a33d', accent: '#c0392b', detail: '#fff6e0' }
  },
  {
    id: 'naga', name: 'Naga', home: 'india', title: 'The River-Keeper',
    lore: 'A divine serpent guarding water, treasure and the thresholds of temples.',
    bridge: 'Water-serpents swim through every myth: India\'s Naga, Japan\'s Ryu, ' +
            'and Scotland\'s Loch Ness Monster are all cousins.',
    palette: { body: '#2e8b57', accent: '#145a32', detail: '#a9dfbf' }
  },
  {
    id: 'airavata', name: 'Airavata', home: 'india', title: 'The Cloud-Elephant',
    lore: 'The great white elephant of Indra, said to draw water from clouds to make rain.',
    bridge: 'Reading the sky for rain unites farmers everywhere — from India\'s monsoon ' +
            'lore to America\'s groundhog forecasts.',
    palette: { body: '#dfe4ea', accent: '#a4b0be', detail: '#f8c471' }
  },
  {
    id: 'hamsa', name: 'Hamsa', home: 'india', title: 'The Wisdom-Swan',
    lore: 'The sacred goose-swan of Saraswati, symbol of knowledge and discernment.',
    bridge: 'Saraswati became Japan\'s goddess Benzaiten — proof that ideas, like ' +
            'business, travel best when they cross borders.',
    palette: { body: '#fdfefe', accent: '#f39c12', detail: '#aed6f1' }
  },
  {
    id: 'makara', name: 'Makara', home: 'india', title: 'The Tide-Beast',
    lore: 'A sea-creature with a crocodile body and elephant trunk, mount of the goddess Ganga.',
    bridge: 'The Makara appears in Japanese Buddhist art too, its swirling form ' +
            'echoing across gateways from India to Kyoto.',
    palette: { body: '#5dade2', accent: '#21618c', detail: '#d6eaf8' }
  },
  {
    id: 'nandi', name: 'Nandi', home: 'india', title: 'The Steadfast Bull',
    lore: 'The gentle bull who is Shiva\'s mount and devoted gatekeeper.',
    bridge: 'The faithful ox is honoured worldwide — from Nandi to Japan\'s Tenjin ox ' +
            'to Babe, the giant blue ox of American tall tales.',
    palette: { body: '#f5f5dc', accent: '#7d6608', detail: '#d7bde2' }
  },

  // ---- Nihon (Japan) ----
  {
    id: 'kitsune', name: 'Kitsune', home: 'japan', title: 'The Clever Fox',
    lore: 'A shape-shifting fox spirit and messenger of Inari, the rice deity.',
    bridge: 'Trickster animals fill folklore everywhere — India\'s Panchatantra jackal, ' +
            'America\'s Jackalope, Cornwall\'s pixies.',
    palette: { body: '#e67e22', accent: '#ffffff', detail: '#922b21' }
  },
  {
    id: 'tanuki', name: 'Tanuki', home: 'japan', title: 'The Jolly Shapeshifter',
    lore: 'A raccoon-dog spirit of good fortune, famous for mischief and disguise.',
    bridge: 'Its lucky statues outside shops mirror India\'s Lakshmi at the doorway — ' +
            'every culture invites prosperity in its own way.',
    palette: { body: '#8b6f47', accent: '#5d4037', detail: '#f5deb3' }
  },
  {
    id: 'kappa', name: 'Kappa', home: 'japan', title: 'The River-Child',
    lore: 'A water imp with a dish of water on its head; polite if you bow to it first.',
    bridge: 'Bow to the Kappa and it bows back — a lesson in Japanese reciprocity that ' +
            'serves you well in any negotiation.',
    palette: { body: '#27ae60', accent: '#f9e79f', detail: '#145a32' }
  },
  {
    id: 'tengu', name: 'Tengu', home: 'japan', title: 'The Mountain Warrior',
    lore: 'A winged mountain spirit, master of martial arts and guardian of forests.',
    bridge: 'Wild mountain guardians appear worldwide — kin to Britain\'s Green Man and ' +
            'America\'s forest-roaming Sasquatch.',
    palette: { body: '#c0392b', accent: '#2c3e50', detail: '#f7dc6f' }
  },
  {
    id: 'ryu', name: 'Ryu', home: 'japan', title: 'The Wish-Dragon',
    lore: 'A wingless, benevolent water dragon that commands rain and the sea.',
    bridge: 'The Ryu is the eastern cousin of India\'s Naga. Note: Asian dragons bring ' +
            'water and luck, while Britain\'s Welsh dragon breathes fire.',
    palette: { body: '#3498db', accent: '#e74c3c', detail: '#d6eaf8' }
  },
  {
    id: 'baku', name: 'Baku', home: 'japan', title: 'The Dream-Eater',
    lore: 'A gentle chimera that devours nightmares when called upon at night.',
    bridge: 'Guardians of sleep and omen recur everywhere, from India\'s protective ' +
            'mantras to America\'s ominous Mothman.',
    palette: { body: '#a569bd', accent: '#4a235a', detail: '#f5eef8' }
  },

  // ---- Columbia (USA) ----
  {
    id: 'thunderbird', name: 'Thunderbird', home: 'usa', title: 'The Storm-Bringer',
    lore: 'A colossal Native American sky-spirit whose beating wings make thunder and ' +
          'whose eyes flash lightning.',
    bridge: 'Sky-kings rule the heavens across cultures — the Thunderbird is the New ' +
            'World\'s Garuda and Karura.',
    palette: { body: '#5d6d7e', accent: '#f4d03f', detail: '#d5dbdb' }
  },
  {
    id: 'jackalope', name: 'Jackalope', home: 'usa', title: 'The Tall-Tale Trickster',
    lore: 'A horned jackrabbit from frontier tall tales told around campfires out West.',
    bridge: 'Every culture spins tall tales; the Jackalope is America\'s wink-and-a-grin ' +
            'cousin to Japan\'s trickster fox.',
    palette: { body: '#c8a165', accent: '#7d5a3c', detail: '#f6ddcc' }
  },
  {
    id: 'sasquatch', name: 'Sasquatch', home: 'usa', title: 'The Forest Wanderer',
    lore: 'A giant, shy, ape-like being said to roam the forests of the Pacific Northwest.',
    bridge: 'Elusive wild guardians haunt every wilderness — Japan\'s Tengu, Britain\'s ' +
            'Green Man, America\'s Bigfoot.',
    palette: { body: '#6e5849', accent: '#3e2c23', detail: '#b39a86' }
  },
  {
    id: 'mothman', name: 'Mothman', home: 'usa', title: 'The Winged Omen',
    lore: 'A red-eyed winged figure of West Virginia legend, said to appear before great events.',
    bridge: 'Omen-bringers span the globe, kin to Japan\'s night-guardian Baku and the ' +
            'ghostly hounds of British folklore.',
    palette: { body: '#4a235a', accent: '#e74c3c', detail: '#bb8fce' }
  },
  {
    id: 'babe', name: 'Babe', home: 'usa', title: 'The Mighty Blue Ox',
    lore: 'The enormous blue ox of lumberjack Paul Bunyan, strong enough to reshape the land.',
    bridge: 'The mighty, faithful ox is honoured from India\'s Nandi to the working ' +
            'oxen of every farming culture.',
    palette: { body: '#5dade2', accent: '#2874a6', detail: '#d6eaf8' }
  },
  {
    id: 'groundhog', name: 'Groundhog', home: 'usa', title: 'The Season-Seer',
    lore: 'The burrowing seer whose shadow on Groundhog Day is said to foretell an early spring.',
    bridge: 'Reading nature for the seasons unites cultures — India\'s monsoon signs, ' +
            'Japan\'s cherry-blossom front, America\'s groundhog.',
    palette: { body: '#a04000', accent: '#6e2c00', detail: '#e6b98f' }
  },

  // ---- Britannia (UK / London) ----
  {
    id: 'nessie', name: 'Nessie', home: 'uk', title: 'The Loch Guardian',
    lore: 'The elusive, long-necked creature said to glide through Scotland\'s Loch Ness.',
    bridge: 'Water-serpents surface in every mythology — Nessie is the northern cousin ' +
            'of India\'s Naga and Japan\'s Ryu.',
    palette: { body: '#1abc9c', accent: '#0e6655', detail: '#a3e4d7' }
  },
  {
    id: 'unicorn', name: 'Unicorn', home: 'uk', title: 'The Regal Horn',
    lore: 'Scotland\'s national animal: a proud, untameable horned horse of legend.',
    bridge: 'Pure, magical beasts stand for the ideal across cultures, echoing Japan\'s ' +
            'dream-guardian Baku.',
    palette: { body: '#f4f6f7', accent: '#af7ac5', detail: '#d2b4de' }
  },
  {
    id: 'welshdragon', name: 'Welsh Dragon', home: 'uk', title: 'The Red Dragon',
    lore: 'Y Ddraig Goch — the fierce red dragon on the flag of Wales, a proud national emblem.',
    bridge: 'A telling contrast: India\'s and Japan\'s dragons are gentle water-serpents, ' +
            'while Britain\'s breathes fire — same beast, opposite temper.',
    palette: { body: '#c0392b', accent: '#145a32', detail: '#f5b7b1' }
  },
  {
    id: 'pixie', name: 'Cornish Pixie', home: 'uk', title: 'The Merry Sprite',
    lore: 'A tiny, mischievous sprite of the Cornish moors who leads travellers astray for fun.',
    bridge: 'Playful little spirits pop up worldwide — close kin to Japan\'s mischievous ' +
            'Tanuki and America\'s trickster Jackalope.',
    palette: { body: '#58d68d', accent: '#f7dc6f', detail: '#abebc6' }
  },
  {
    id: 'greenman', name: 'Green Man', home: 'uk', title: 'The Leaf-Face',
    lore: 'A foliage-covered face carved in old churches — an ancient spirit of forests and rebirth.',
    bridge: 'Nature-guardians grow in every land, from Japan\'s mountain Tengu to the ' +
            'sacred groves of India.',
    palette: { body: '#229954', accent: '#7d6608', detail: '#a9dfbf' }
  },
  {
    id: 'blackshuck', name: 'Black Shuck', home: 'uk', title: 'The Ghost Hound',
    lore: 'A huge spectral black dog with fiery eyes said to roam England\'s eastern coasts by night.',
    bridge: 'Loyal, fearsome guardian-dogs pace the thresholds of folklore, much as spirit ' +
            'guardians watch over Japanese shrine gates.',
    palette: { body: '#2c3e50', accent: '#e74c3c', detail: '#85929e' }
  }
];

/* ----------------------------------------------------------------------------
 * CULTURE-EXCHANGE QUESTIONS
 * Every question teaches something, and the `explain` field fires whether the
 * player is right or wrong, so failure is still learning.
 * `culture` biases which spirit is likely to ask it. `link: true` marks a
 * question about how cultures compare — worth extra Harmony Points.
 * -------------------------------------------------------------------------- */
const QUESTIONS = [
  /* ---------------- Business: greetings & first impressions --------------- */
  {
    topic: 'Business', culture: 'japan', link: true,
    q: 'A Japanese colleague hands you their business card ("meishi"). What is the polite thing to do?',
    choices: ['Receive it with both hands and study it', 'Slip it into your back pocket',
              'Write your notes on it', 'Wave it off — cards are old-fashioned'],
    answer: 0,
    explain: 'In Japan, receive a meishi with BOTH hands, read it carefully, and set it on ' +
             'the table during the meeting. Pocketing it (especially a back pocket) or writing ' +
             'on it is seen as disrespectful.'
  },
  {
    topic: 'Business', culture: 'usa',
    q: 'At a first business meeting in the USA, which greeting makes the best impression?',
    choices: ['A firm handshake with eye contact', 'A deep bow', 'A hug', 'A wait to be introduced by rank'],
    answer: 0,
    explain: 'Americans favour a firm handshake, direct eye contact and quickly moving to ' +
             'first names. Confidence and warmth open doors; a limp handshake reads as unsure.'
  },
  {
    topic: 'Business', culture: 'india',
    q: 'Meeting a senior Indian executive named Mr. Sharma, how might you respectfully address him?',
    choices: ['"Sharma-ji"', 'By his first name immediately', '"Hey, buddy"', 'No name — just start talking'],
    answer: 0,
    explain: 'Adding "-ji" (as in "Sharma-ji") is a warm mark of respect in India. Seniority and ' +
             'age matter, so use titles until invited to be less formal.'
  },
  {
    topic: 'Business', culture: 'uk',
    q: 'In a UK office, what is the classic ice-breaker before getting down to business?',
    choices: ['The weather', 'Your salary', 'Politics', 'Nothing — start immediately'],
    answer: 0,
    explain: 'Brits open with small talk — famously the weather. It is low-stakes, universal, ' +
             'and eases into business gently. Salary and politics are considered too personal.'
  },

  /* ---------------- Business: communication style ------------------------ */
  {
    topic: 'Negotiation', culture: 'japan', link: true,
    q: 'In a negotiation, your Japanese counterpart says "That would be a little difficult...". This usually means:',
    choices: ['A polite "no"', 'An enthusiastic yes', 'Please raise the price', 'They did not understand'],
    answer: 0,
    explain: 'Japanese communication is high-context and indirect. "Chotto muzukashii" (a little ' +
             'difficult) is a courteous refusal. A direct "no" is often avoided to preserve harmony.'
  },
  {
    topic: 'Negotiation', culture: 'uk', link: true,
    q: 'A British colleague responds to your proposal with "That\'s not bad at all." How should you read it?',
    choices: ['High praise', 'Mild insult', 'They are confused', 'They rejected it'],
    answer: 0,
    explain: 'British understatement runs deep: "not bad" often means "really rather good." ' +
             'Likewise "with the greatest respect" usually signals polite disagreement is coming.'
  },
  {
    topic: 'Negotiation', culture: 'usa',
    q: 'What communication style should you expect from American negotiators?',
    choices: ['Direct and explicit — they say what they mean', 'Highly indirect and subtle',
              'Silent for long stretches', 'Decisions only after weeks of consensus'],
    answer: 0,
    explain: 'US business culture prizes directness: get to the point, "yes means yes, no means no," ' +
             'and expect a detailed written contract. "Time is money," so decisions move fast.'
  },
  {
    topic: 'Negotiation', culture: 'india',
    q: 'What matters most when closing a deal in India?',
    choices: ['Building a personal relationship and trust first', 'Skipping small talk to save time',
              'A take-it-or-leave-it first offer', 'Avoiding all bargaining'],
    answer: 0,
    explain: 'Indian business is relationship-driven. Invest in rapport (and chai) before pushing ' +
             'for the deal, expect some lively bargaining, and be patient — trust seals the contract.'
  },

  /* ---------------- Business: time, meetings, hierarchy ------------------ */
  {
    topic: 'Meetings', culture: 'japan',
    q: 'How important is punctuality for a business meeting in Japan?',
    choices: ['Arrive early — lateness is a serious insult', 'Ten minutes late is polite',
              'Time is flexible', 'Only the boss needs to be on time'],
    answer: 0,
    explain: 'In Japan, being on time means being early. Lateness signals disrespect for others\' ' +
             'time. This punctuality is shared with Germany and, increasingly, corporate everywhere.'
  },
  {
    topic: 'Meetings', culture: 'japan', link: true,
    q: 'Decisions in a traditional Japanese company are typically made by:',
    choices: ['Group consensus ("nemawashi") before the meeting', 'One bold leader on the spot',
              'A quick majority vote', 'Whoever speaks loudest'],
    answer: 0,
    explain: 'Japanese firms build agreement quietly in advance ("nemawashi") so the meeting merely ' +
             'confirms it. Be patient — the silent senior person may be the real decision-maker.'
  },
  {
    topic: 'Meetings', culture: 'usa',
    q: 'An American says "Let\'s circle back on that." What do they mean?',
    choices: ['Let\'s return to this topic later', 'Let\'s cancel the project',
              'Let\'s go around the building', 'Let\'s vote right now'],
    answer: 0,
    explain: 'US offices love idioms: "circle back" = revisit later, "touch base" = check in, ' +
             '"ballpark figure" = rough estimate, "on the same page" = in agreement.'
  },
  {
    topic: 'Etiquette', culture: 'india', link: true,
    q: 'In both India and Japan, what should you do before entering many homes and some offices?',
    choices: ['Remove your shoes', 'Knock exactly three times', 'Bring cash', 'Bow to the north'],
    answer: 0,
    explain: 'Both cultures remove shoes to keep a space clean and respected. In Japan you often ' +
             'step into slippers at the "genkan" entryway.'
  },

  /* ---------------- Day-to-day: dining & tipping ------------------------- */
  {
    topic: 'Dining', culture: 'usa',
    q: 'You finish a restaurant meal in the USA. The tip is usually:',
    choices: ['18–20% of the bill', 'Nothing — it\'s included', 'Exactly 5%', 'Only round up the coins'],
    answer: 0,
    explain: 'Tipping 18–20% is expected in US restaurants because servers rely on tips as wages. ' +
             'Under-tipping is a real faux pas — very different from Japan.'
  },
  {
    topic: 'Dining', culture: 'japan', link: true,
    q: 'How much should you tip a waiter in Japan?',
    choices: ['Nothing — tipping can cause confusion', '20% always', '10% in cash', 'Double on holidays'],
    answer: 0,
    explain: 'Japan has essentially no tipping culture; good service is standard and a tip can ' +
             'even feel awkward. Contrast this sharply with the USA\'s 18–20% norm.'
  },
  {
    topic: 'Dining', culture: 'uk',
    q: 'At a UK restaurant, how do you handle the tip?',
    choices: ['Around 10–12.5%, unless a service charge is already added',
              'Always 25%', 'Never tip anything', 'Tip the chef in the kitchen directly'],
    answer: 0,
    explain: 'In Britain, ~10–12.5% is typical — but check the bill first, as many places add an ' +
             '"optional service charge" automatically. Pubs generally aren\'t tipped at the bar.'
  },
  {
    topic: 'Dining', culture: 'india',
    q: 'Traditionally in India, which hand do you use to eat and to pass food?',
    choices: ['The right hand', 'The left hand', 'Either, it makes no difference', 'Both at once'],
    answer: 0,
    explain: 'The right hand is used for eating and giving, as the left is considered unclean. ' +
             'Many Indians are also vegetarian — always check dietary needs before hosting.'
  },

  /* ---------------- Day-to-day: everyday language & customs -------------- */
  {
    topic: 'Language', culture: 'india',
    q: 'Which greeting, with palms pressed together, means "I bow to you" in India?',
    choices: ['Namaste', 'Konnichiwa', 'Cheers', 'Howdy'],
    answer: 0,
    explain: 'Namaste (नमस्ते) joins "namas" (to bow) and "te" (to you). The Japanese Buddhist ' +
             'chant "Namu" comes from the same Sanskrit root.'
  },
  {
    topic: 'Language', culture: 'uk',
    q: 'A Londoner says "Cheers, mate!" as you hold a door. What does "cheers" mean here?',
    choices: ['Thank you', 'Let\'s drink', 'Goodbye forever', 'Congratulations'],
    answer: 0,
    explain: 'In Britain "cheers" is an everyday "thanks" (and also "bye"). "Mate" is a friendly ' +
             '"friend." The Americans would say "Thanks, buddy!"'
  },
  {
    topic: 'Language', culture: 'usa', link: true,
    q: 'You need a bathroom. What word works best in the USA versus the UK?',
    choices: ['"Restroom" in the US, "loo" or "toilet" in the UK', '"Toilet" is rude in both',
              '"Washroom" only in the US', 'They are identical everywhere'],
    answer: 0,
    explain: 'Americans ask for the "restroom" or "bathroom"; Brits say "toilet" or "loo." Saying ' +
             '"toilet" in the US sounds a touch blunt, while "restroom" sounds oddly formal in the UK.'
  },
  {
    topic: 'Language', culture: 'japan',
    q: 'How do you say "thank you" in Japanese?',
    choices: ['Arigato', 'Shukriya', 'Cheers', 'Gracias'],
    answer: 0,
    explain: 'Arigato (ありがとう) means thank you. In Hindi you\'d say "Dhanyavaad"; a Brit might ' +
             'just say "Cheers" — three cultures, one warm sentiment.'
  },
  {
    topic: 'Etiquette', culture: 'uk',
    q: 'You approach a busy bus stop in London. What is the unspoken rule?',
    choices: ['Join the back of the queue', 'Push to the front politely', 'Wait to be called', 'Wave money'],
    answer: 0,
    explain: 'Queuing is almost sacred in Britain — jump the queue and you\'ll get very cold stares. ' +
             'Orderly lines and "after you" politeness are core to daily life.'
  },
  {
    topic: 'Etiquette', culture: 'usa',
    q: 'What kind of small talk is normal and expected between strangers in the USA?',
    choices: ['Friendly chat with a stranger, e.g. in a queue or elevator',
              'Total silence with strangers', 'Only speaking after a formal introduction',
              'Never making eye contact'],
    answer: 0,
    explain: 'Americans are comfortable with friendly small talk and quick first names, even with ' +
             'strangers. In Japan or Britain, unsolicited chat with strangers is less common.'
  },

  /* ---------------- Culture, festivals & mythology (the connections) ----- */
  {
    topic: 'Mythology', culture: 'india', link: true,
    q: 'Which religion, born in India, travelled to Japan and shaped its temples, art and festivals?',
    choices: ['Buddhism', 'Shinto', 'Taoism', 'Jainism'],
    answer: 0,
    explain: 'Buddhism began in India (~5th c. BCE) and reached Japan around 552 CE via China and ' +
             'Korea, carrying Indian gods, words and stories with it.'
  },
  {
    topic: 'Mythology', culture: 'japan', link: true,
    q: 'The fierce Japanese temple guardian "Karura" is a version of which Indian being?',
    choices: ['Garuda', 'Hanuman', 'Ganesha', 'Naga'],
    answer: 0,
    explain: 'Karura is Garuda, the eagle-king, reborn in Japanese Buddhism — the same sky-sovereign, ' +
             'carried east across the whole continent.'
  },
  {
    topic: 'Festivals', culture: 'india',
    q: 'Which Indian festival is celebrated by lighting rows of oil lamps for light over darkness?',
    choices: ['Diwali', 'Holi', 'Onam', 'Obon'],
    answer: 0,
    explain: 'Diwali, the festival of lights, uses rows of "diya" lamps. Japan\'s Obon similarly ' +
             'uses lanterns to guide ancestors\' spirits home.'
  },
  {
    topic: 'Festivals', culture: 'japan',
    q: 'What is the Japanese springtime custom of picnicking under cherry blossoms called?',
    choices: ['Hanami', 'Obon', 'Holi', 'Setsubun'],
    answer: 0,
    explain: 'Hanami means "flower viewing." The fleeting sakura bloom teaches "mono no aware" — a ' +
             'tender awareness that beautiful things do not last.'
  },
  {
    topic: 'Festivals', culture: 'usa',
    q: 'Which American holiday centres on a big family meal of turkey and giving thanks?',
    choices: ['Thanksgiving', 'The Fourth of July', 'Labor Day', 'Groundhog Day'],
    answer: 0,
    explain: 'Thanksgiving (fourth Thursday of November) is a huge family gathering. The Fourth of ' +
             'July (Independence Day) is the flag-and-fireworks celebration instead.'
  },
  {
    topic: 'Customs', culture: 'uk',
    q: 'What is "afternoon tea" in Britain?',
    choices: ['A light meal of tea, sandwiches and cakes, often mid-afternoon',
              'A business contract', 'A type of dance', 'A morning coffee run'],
    answer: 0,
    explain: 'Afternoon tea pairs tea with finger sandwiches, scones and cakes. Everyday "having a ' +
             'cuppa" is also central — much British bonding happens over a simple cup of tea.'
  },
  {
    topic: 'Customs', culture: 'japan', link: true,
    q: 'A red gateway marking the entrance to a Japanese Shinto shrine is called a...',
    choices: ['Torii', 'Torana', 'Stupa', 'Big Ben'],
    answer: 0,
    explain: 'A "torii" gate marks sacred ground — and its name and form recall the Indian "torana," ' +
             'the carved gateways of ancient stupas.'
  }
];

/* ----------------------------------------------------------------------------
 * PHRASEBOOK — everyday & business phrases across all four cultures (open: P).
 * For the USA and UK the "phrase" shows the natural register/idiom, since the
 * interesting differences are in *how* English is used, not translation.
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
  { meaning: 'Let\'s do business', india: 'Vyaapaar karein', japan: 'Yoroshiku onegai shimasu — よろしく',
    usa: 'Let\'s make a deal',    uk: 'Shall we get down to it?' },
  { meaning: 'I\'ll get back to you', india: 'Main aap ko bataunga', japan: 'Kentou shimasu (we\'ll consider)',
    usa: 'I\'ll circle back',     uk: 'I\'ll be in touch' },
  { meaning: 'Well done!',       india: 'Shaabaash! — शाबाश', japan: 'Yoku dekimashita — よくできました',
    usa: 'Awesome job!',          uk: 'Well done / Not bad at all' },
  { meaning: 'Goodbye',          india: 'Alvida — अलविदा', japan: 'Sayonara — さようなら',
    usa: 'Bye / Take care',       uk: 'Cheerio / Bye then' }
];

/* ----------------------------------------------------------------------------
 * BUSINESS GUIDE — a quick, practical cheat-sheet per culture (open: B).
 * Focused on the things that actually make or break meetings and negotiations.
 * -------------------------------------------------------------------------- */
const BUSINESS_GUIDE = [
  {
    culture: 'india', flag: '🇮🇳', name: 'India',
    tips: [
      { label: 'Greeting', text: '"Namaste" (palms together) or a handshake among men. Use titles + "-ji" to show respect.' },
      { label: 'Hierarchy', text: 'Seniority and age carry weight. Greet and defer to the most senior person first.' },
      { label: 'Relationships', text: 'Business is personal — invest in small talk and chai; trust comes before the contract.' },
      { label: 'Time', text: 'Schedules can flex, but you should still be on time. Patience and persistence win.' },
      { label: 'Negotiation', text: 'Expect lively bargaining. A head-wobble or "we\'ll see" is not a firm yes.' },
      { label: 'Dining', text: 'Eat and pass with the right hand. Many guests are vegetarian — always ask first.' }
    ]
  },
  {
    culture: 'japan', flag: '🇯🇵', name: 'Japan',
    tips: [
      { label: 'Business cards', text: 'Exchange "meishi" with both hands, study it, and never write on it or pocket it carelessly.' },
      { label: 'Communication', text: 'Indirect and polite. "That\'s difficult" means no; silence is thoughtful, not awkward.' },
      { label: 'Decisions', text: 'Consensus is built quietly in advance ("nemawashi"). The quiet senior person may decide.' },
      { label: 'Punctuality', text: 'Be early. Lateness is a genuine insult to everyone\'s time.' },
      { label: 'Hierarchy', text: 'Rank shapes seating and speaking order — wait to be shown your seat.' },
      { label: 'Dining', text: 'Pour drinks for others (not yourself); no tipping; say "itadakimasu" before eating.' }
    ]
  },
  {
    culture: 'usa', flag: '🇺🇸', name: 'USA',
    tips: [
      { label: 'Greeting', text: 'Firm handshake, eye contact, first names fast. A confident, warm opener works.' },
      { label: 'Communication', text: 'Direct and explicit — say what you mean, and "no" is perfectly acceptable.' },
      { label: 'Time', text: '"Time is money." Be punctual, follow the agenda, and expect quick decisions.' },
      { label: 'Negotiation', text: 'Assertive and win-win framed. Everything lands in a detailed written contract.' },
      { label: 'Networking', text: 'Self-promotion is normal — sell your ideas and yourself with confidence.' },
      { label: 'Dining / tipping', text: 'Business happens over lunch or coffee. Tip 18–20% at restaurants.' }
    ]
  },
  {
    culture: 'uk', flag: '🇬🇧', name: 'UK (London)',
    tips: [
      { label: 'Greeting', text: 'Handshake with reserved warmth. Open with small talk — the weather never fails.' },
      { label: 'Understatement', text: '"Not bad" is high praise; "with respect" precedes disagreement. Read between the lines.' },
      { label: 'Politeness', text: '"Please", "thank you" and "sorry" flow constantly — and never, ever jump the queue.' },
      { label: 'Humour', text: 'Dry, self-deprecating irony is a bonding tool. Don\'t take every joke literally.' },
      { label: 'Punctuality', text: 'Be on time; "fashionably late" is not done in business.' },
      { label: 'Dining / tipping', text: 'Relationships grow in the pub. Tip ~10–12.5% unless a service charge is added.' }
    ]
  }
];

/* ----------------------------------------------------------------------------
 * SIGNS — placed in the world; walk into one and press SPACE to read it.
 * -------------------------------------------------------------------------- */
const SIGN_TEXTS = {
  welcome: 'Welcome to CULTURE BRIDGE! Four roads lead to four cultures — India (west), ' +
           'Japan (east), London (north) and the USA (south). Walk into the tall grass to meet ' +
           'folklore spirits and learn everyday & business customs. [C] Culturedex  [P] Phrasebook  [B] Business Guide.',
  india: 'BHARAT ROAD (India). Land of lamps, lotus and relationships. Greet elders with ' +
         '"Namaste", use the right hand, and remember: trust is built before the deal.',
  japan: 'NIHON ROAD (Japan). Land of blossoms and shrines. Bow, exchange cards with two hands, ' +
         'be early — and read what is left unsaid.',
  london: 'LONDON ROAD (UK). Mind the queue and the understatement. "Not bad" is high praise, ' +
          '"sorry" is said constantly, and much is settled over a cup of tea.',
  usa: 'COLUMBIA ROAD (USA). Land of the direct and the fast. Firm handshake, first names, ' +
       'get to the point — and tip your server well.',
  hub: 'THE HARMONY EXCHANGE. Four cultures meet here. Ideas and trade have always crossed ' +
       'borders — from Buddhism\'s road to Japan to the spice routes to today\'s boardrooms.',
  torii: 'A TORII gate marks sacred ground in Japan. Its cousin is the Indian "torana" — ' +
         'the carved gateways of ancient stupas. Same idea, two lands.'
};

/* NPC dialogue — friendly guides, one per culture plus a hub sage. */
const NPCS = [
  {
    name: 'Priya', home: 'india',
    lines: [
      'Namaste, traveller! I am Priya, from the Bharat road.',
      '"Namaste" means "I bow to the light in you." Press your palms together and mean it.',
      'One tip for business here: share a cup of chai and build the friendship first. ' +
      'In India, the relationship comes before the contract.'
    ]
  },
  {
    name: 'Haruki', home: 'japan',
    lines: [
      'Konnichiwa! I am Haruki, of the Nihon road.',
      'When we meet, we bow — and we trade business cards with both hands.',
      'Listen for what is not said. If I say a plan is "a little difficult," I am politely ' +
      'saying no. Harmony matters more than bluntness.'
    ]
  },
  {
    name: 'Eleanor', home: 'uk',
    lines: [
      'Hiya, you alright? Eleanor here, down from London.',
      'A word to the wise: when a Brit says "that\'s not bad," we actually mean it\'s rather good. ' +
      'Understatement is our love language.',
      'Fancy a cuppa? Half of British business gets sorted over a nice cup of tea — and do mind the queue!'
    ]
  },
  {
    name: 'Marcus', home: 'usa',
    lines: [
      'Hey there! Marcus, from the States — great to meet you!',
      'Here we get right to the point: firm handshake, eye contact, and say what you mean. ' +
      'A clear "no" is totally fine.',
      'Time is money, so let\'s make it count — and don\'t forget to tip your server 18 to 20 percent!'
    ]
  },
  {
    name: 'Master Bodhi', home: 'hub',
    lines: [
      'Ah, a culture-bridger! I have travelled from Nalanda to Nara, London to New York.',
      'Everything connects: Garuda became Karura, the spice routes became container ships, ' +
      'a bow and a handshake both mean "I respect you."',
      'Befriend spirits from all four lands and you will hold your own in any room — a Tokyo ' +
      'boardroom, a London pub, a Delhi market, a New York pitch.'
    ]
  }
];
