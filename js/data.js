/* ============================================================================
 * Culture Bridge — Game Data
 * ----------------------------------------------------------------------------
 * All learning content lives here: the Kotomon (folklore companions), the
 * culture-exchange questions, the bilingual phrasebook, and the world's signs.
 *
 * The design goal is CROSS-cultural fluency between India and Japan, so the
 * facts and questions deliberately foreground the historical and mythological
 * threads that connect the two cultures (Buddhism's journey from India to
 * Japan, Garuda -> Karura, Saraswati -> Benzaiten, curry, shared festivals).
 * ==========================================================================*/

/* ----------------------------------------------------------------------------
 * KOTOMON — culture companions drawn from the folklore of both nations.
 * Each has a "home" culture but every one carries a cross-cultural note,
 * because that connection is the whole point of the game.
 * `glyph` + `palette` are used to draw the creature procedurally on canvas.
 * -------------------------------------------------------------------------- */
const KOTOMON = [
  // ---- Bharat (India-inspired) ----
  {
    id: 'garuda',
    name: 'Garuda',
    home: 'india',
    title: 'The Sky-Sovereign',
    lore: 'A radiant eagle-being and mount of Vishnu, king of all birds in Hindu myth.',
    bridge: 'Buddhism carried Garuda to Japan, where it became "Karura" (迦楼羅), ' +
            'a fire-breathing guardian still honoured in temples today.',
    palette: { body: '#e8a33d', accent: '#c0392b', detail: '#fff6e0' },
    glyph: 'bird'
  },
  {
    id: 'naga',
    name: 'Naga',
    home: 'india',
    title: 'The River-Keeper',
    lore: 'A divine serpent guarding water, treasure and the thresholds of temples.',
    bridge: 'Nagas became the "Ryu" dragons and "Ryujin" sea-kings of Japan as ' +
            'Buddhist stories travelled east along the Silk Road.',
    palette: { body: '#2e8b57', accent: '#145a32', detail: '#a9dfbf' },
    glyph: 'serpent'
  },
  {
    id: 'airavata',
    name: 'Airavata',
    home: 'india',
    title: 'The Cloud-Elephant',
    lore: 'The great white elephant of Indra, said to draw water from clouds to make rain.',
    bridge: 'The elephant-headed Ganesha travelled to Japan as "Kangiten", ' +
            'showing how deeply Indian imagery reached Japanese temples.',
    palette: { body: '#dfe4ea', accent: '#a4b0be', detail: '#f8c471' },
    glyph: 'elephant'
  },
  {
    id: 'hamsa',
    name: 'Hamsa',
    home: 'india',
    title: 'The Wisdom-Swan',
    lore: 'The sacred goose-swan of Saraswati, symbol of knowledge and discernment.',
    bridge: 'Saraswati herself became beloved in Japan as "Benzaiten", ' +
            'goddess of music, water and eloquence.',
    palette: { body: '#fdfefe', accent: '#f39c12', detail: '#aed6f1' },
    glyph: 'swan'
  },
  {
    id: 'makara',
    name: 'Makara',
    home: 'india',
    title: 'The Tide-Beast',
    lore: 'A sea-creature with a crocodile body and elephant trunk, mount of the river goddess Ganga.',
    bridge: 'The Makara appears in Japanese Buddhist art too, its swirling ' +
            'form echoing across gateways from India to Kyoto.',
    palette: { body: '#5dade2', accent: '#21618c', detail: '#d6eaf8' },
    glyph: 'makara'
  },
  {
    id: 'nandi',
    name: 'Nandi',
    home: 'india',
    title: 'The Steadfast Bull',
    lore: 'The gentle bull who is Shiva\'s mount and devoted gatekeeper.',
    bridge: 'The ox is honoured across Asia — in Japan the ox carries the scholar-god ' +
            'Tenjin, echoing Nandi\'s role as a faithful divine companion.',
    palette: { body: '#f5f5dc', accent: '#7d6608', detail: '#d7bde2' },
    glyph: 'bull'
  },

  // ---- Nihon (Japan-inspired) ----
  {
    id: 'kitsune',
    name: 'Kitsune',
    home: 'japan',
    title: 'The Clever Fox',
    lore: 'A shape-shifting fox spirit and messenger of Inari, the rice deity.',
    bridge: 'Clever animal tricksters fill Indian tales too — like the jackal of the ' +
            'Panchatantra, whose fables travelled the world.',
    palette: { body: '#e67e22', accent: '#ffffff', detail: '#922b21' },
    glyph: 'fox'
  },
  {
    id: 'tanuki',
    name: 'Tanuki',
    home: 'japan',
    title: 'The Jolly Shapeshifter',
    lore: 'A raccoon-dog spirit of good fortune, famous for mischief and disguise.',
    bridge: 'Its lucky-charm statues outside shops mirror India\'s Lakshmi, ' +
            'goddess of prosperity welcomed at every doorway.',
    palette: { body: '#8b6f47', accent: '#5d4037', detail: '#f5deb3' },
    glyph: 'tanuki'
  },
  {
    id: 'kappa',
    name: 'Kappa',
    home: 'japan',
    title: 'The River-Child',
    lore: 'A water imp with a dish of water on its head; polite if you bow to it first.',
    bridge: 'Both cultures fill their rivers with spirits — the Kappa is kin to the ' +
            'Indian Naga, guardians who demand respect at the water\'s edge.',
    palette: { body: '#27ae60', accent: '#f9e79f', detail: '#145a32' },
    glyph: 'kappa'
  },
  {
    id: 'tengu',
    name: 'Tengu',
    home: 'japan',
    title: 'The Mountain Warrior',
    lore: 'A winged mountain spirit, master of martial arts and guardian of forests.',
    bridge: 'The bird-like Tengu shares ancestry with Garuda/Karura — proof of how ' +
            'Indian sky-beings were reimagined on Japanese peaks.',
    palette: { body: '#c0392b', accent: '#2c3e50', detail: '#f7dc6f' },
    glyph: 'tengu'
  },
  {
    id: 'ryu',
    name: 'Ryu',
    home: 'japan',
    title: 'The Wish-Dragon',
    lore: 'A wingless, benevolent water dragon that commands rain and the sea.',
    bridge: 'The Ryu is the eastern cousin of the Indian Naga — the same serpent ' +
            'spirit, transformed as the story crossed the continent.',
    palette: { body: '#3498db', accent: '#e74c3c', detail: '#d6eaf8' },
    glyph: 'dragon'
  },
  {
    id: 'baku',
    name: 'Baku',
    home: 'japan',
    title: 'The Dream-Eater',
    lore: 'A gentle chimera that devours nightmares when called upon at night.',
    bridge: 'Guarding sleep is an ancient Asian idea — Indian tradition too invokes ' +
            'protectors and mantras to keep bad dreams away.',
    palette: { body: '#a569bd', accent: '#4a235a', detail: '#f5eef8' },
    glyph: 'baku'
  }
];

/* ----------------------------------------------------------------------------
 * CULTURE-EXCHANGE QUESTIONS
 * Every question teaches something, and the `explain` field fires whether the
 * player is right or wrong, so failure is still learning.
 * `topic` groups them; `link` marks questions specifically about the
 * India<->Japan connection.
 * -------------------------------------------------------------------------- */
const QUESTIONS = [
  // ---------- Greetings & Language ----------
  {
    topic: 'Language',
    q: 'You meet a traveller from India. Which greeting, with palms pressed together, means "I bow to you"?',
    choices: ['Namaste', 'Konnichiwa', 'Sawasdee', 'Ni hao'],
    answer: 0,
    explain: 'Namaste (नमस्ते) joins "namas" (to bow) and "te" (to you). Fittingly, the ' +
             'Japanese Buddhist chant "Namu" comes from the very same Sanskrit root, "namas".'
  },
  {
    topic: 'Language',
    q: 'In Japan, what do you say to greet someone during the daytime?',
    choices: ['Namaste', 'Arigato', 'Konnichiwa', 'Sayonara'],
    answer: 2,
    explain: 'Konnichiwa (こんにちは) literally grew from "as for this day...". ' +
             'Say "Arigato" for thanks and "Sayonara" to say goodbye.'
  },
  {
    topic: 'Language',
    q: 'The Japanese Buddhist word "Namu" (as in Namu Amida Butsu) shares a root with which Hindi word?',
    choices: ['Dhanyavaad', 'Namaste', 'Accha', 'Paani'],
    answer: 1,
    link: true,
    explain: 'Both come from Sanskrit "namas" (reverent bowing). Chanting "Namu" in a ' +
             'Kyoto temple echoes the same word offered in a Varanasi greeting.'
  },
  {
    topic: 'Language',
    q: 'How do you say "thank you" in Japanese?',
    choices: ['Arigato', 'Shukriya', 'Kudasai', 'Ohayo'],
    answer: 0,
    explain: 'Arigato (ありがとう) means thank you. In Hindi you would say "Dhanyavaad" ' +
             'or "Shukriya" — three languages, one warm sentiment.'
  },

  // ---------- Food ----------
  {
    topic: 'Food',
    q: 'Japanese "kare raisu" (curry rice) is a national comfort food. Where did curry originally come from?',
    choices: ['Japan', 'India', 'Thailand', 'Korea'],
    answer: 1,
    link: true,
    explain: 'Curry is Indian in origin. It reached Japan in the late 1800s via the ' +
             'British navy, and Japan then made it wholly its own — a perfect culture bridge on a plate.'
  },
  {
    topic: 'Food',
    q: 'Which South Indian dish is a thin, crispy fermented-rice crepe?',
    choices: ['Ramen', 'Dosa', 'Tempura', 'Idli'],
    answer: 1,
    explain: 'A Dosa is a crispy crepe from South India. Idli (also from the region) is a ' +
             'soft steamed cake — both made from the same fermented rice-and-lentil batter.'
  },
  {
    topic: 'Food',
    q: 'What is the Japanese art of arranging rice, fish and seaweed into small bites called?',
    choices: ['Sushi', 'Sashimi', 'Thali', 'Bento'],
    answer: 0,
    explain: 'Sushi centres on vinegared rice. "Sashimi" is sliced raw fish alone; a "Bento" ' +
             'is a packed lunch box; a "Thali" is an Indian platter of many small dishes — a lovely parallel.'
  },
  {
    topic: 'Food',
    q: 'Both cultures love a shared platter. India has the "thali"; what is Japan\'s compartmented meal box?',
    choices: ['Bento', 'Wok', 'Tiffin', 'Katana'],
    answer: 0,
    link: true,
    explain: 'A Japanese "bento" and an Indian "thali" (or lunch "tiffin") both serve balance and ' +
             'variety in one tray — different foods, the same idea of a complete, harmonious meal.'
  },

  // ---------- Festivals ----------
  {
    topic: 'Festivals',
    q: 'Which Indian festival is celebrated by lighting rows of oil lamps to mark light over darkness?',
    choices: ['Holi', 'Diwali', 'Onam', 'Tanabata'],
    answer: 1,
    explain: 'Diwali, the festival of lights, uses rows of "diya" lamps. Japan has its own ' +
             'lantern festival, Obon, when glowing lanterns guide ancestors\' spirits home.'
  },
  {
    topic: 'Festivals',
    q: 'In Japan, families float lanterns and honour their ancestors during which summer festival?',
    choices: ['Obon', 'Holi', 'Setsubun', 'Diwali'],
    answer: 0,
    link: true,
    explain: 'Obon honours ancestors with lanterns and dance. It grew from a Buddhist story ' +
             'that came from India — so Obon and India\'s ancestor rites share deep roots.'
  },
  {
    topic: 'Festivals',
    q: 'Which joyful Indian festival is famous for people throwing brightly coloured powders?',
    choices: ['Holi', 'Diwali', 'Obon', 'Navratri'],
    answer: 0,
    explain: 'Holi, the festival of colours, welcomes spring. Japan welcomes spring differently — ' +
             'with "hanami", picnicking quietly beneath blooming cherry blossoms.'
  },
  {
    topic: 'Festivals',
    q: 'What is the Japanese springtime custom of viewing and picnicking under cherry blossoms called?',
    choices: ['Hanami', 'Obon', 'Matsuri', 'Holi'],
    answer: 0,
    explain: 'Hanami means "flower viewing". The fleeting sakura bloom teaches "mono no aware" — ' +
             'a tender awareness that beautiful things do not last.'
  },

  // ---------- Mythology & the great connection ----------
  {
    topic: 'Mythology',
    q: 'Which religion, born in India, travelled to Japan and shaped its temples, art and festivals?',
    choices: ['Shinto', 'Buddhism', 'Jainism', 'Taoism'],
    answer: 1,
    link: true,
    explain: 'Buddhism began with the Buddha in India (~5th c. BCE) and reached Japan around ' +
             '552 CE via China and Korea, carrying Indian gods, words and stories with it.'
  },
  {
    topic: 'Mythology',
    q: 'The Indian goddess Saraswati became beloved in Japan under which name?',
    choices: ['Amaterasu', 'Benzaiten', 'Kannon', 'Inari'],
    answer: 1,
    link: true,
    explain: 'Saraswati, goddess of knowledge and music, became "Benzaiten" in Japan — still ' +
             'shown holding a lute-like instrument, worshipped near water just as in India.'
  },
  {
    topic: 'Mythology',
    q: 'The fierce Japanese temple guardian "Karura" is a version of which Indian mythological being?',
    choices: ['Garuda', 'Hanuman', 'Ganesha', 'Naga'],
    answer: 0,
    link: true,
    explain: 'Karura (迦楼羅) is Garuda, the eagle-king, reborn in Japanese Buddhism — the same ' +
             'sky-sovereign, its name and form carried east across the whole continent.'
  },
  {
    topic: 'Mythology',
    q: 'Japan\'s water dragons ("Ryu") are cousins of which Indian serpent-spirit?',
    choices: ['Rakshasa', 'Naga', 'Yaksha', 'Garuda'],
    answer: 1,
    link: true,
    explain: 'The Indian Naga became the East Asian dragon. As Buddhist tales moved along the ' +
             'Silk Road, the guardian serpent of India transformed into Japan\'s benevolent Ryu.'
  },

  // ---------- Customs & etiquette ----------
  {
    topic: 'Customs',
    q: 'Before entering a home in BOTH India and Japan, what is the polite thing to do?',
    choices: ['Remove your shoes', 'Knock three times', 'Bring flowers', 'Bow to the north'],
    answer: 0,
    link: true,
    explain: 'Both cultures remove shoes at the door to keep the home pure and clean — a shared ' +
             'sign of respect. In Japan you often step into slippers just inside the "genkan" entryway.'
  },
  {
    topic: 'Customs',
    q: 'How do people most traditionally show respect when greeting in Japan?',
    choices: ['A bow', 'A handshake', 'A high five', 'A wave'],
    answer: 0,
    explain: 'A bow ("ojigi") shows respect in Japan; deeper bows show greater respect. In India ' +
             'the "namaste" gesture — palms together with a slight bow — carries the same warmth.'
  },
  {
    topic: 'Customs',
    q: 'A red gateway marking the entrance to a Japanese Shinto shrine is called a...',
    choices: ['Torana', 'Torii', 'Stupa', 'Pagoda'],
    answer: 1,
    link: true,
    explain: 'A "torii" gate marks sacred ground. Intriguingly, its name and form recall the Indian ' +
             '"torana" — the ceremonial gateways of ancient stupas like the one at Sanchi.'
  },
  {
    topic: 'Customs',
    q: 'The multi-tiered Japanese "pagoda" tower evolved from which Indian Buddhist structure?',
    choices: ['Stupa', 'Minaret', 'Ziggurat', 'Haveli'],
    answer: 0,
    link: true,
    explain: 'The dome-shaped Indian "stupa" — a mound holding sacred relics — travelled through ' +
             'China and became the graceful tiered pagoda you see across Japan.'
  }
];

/* ----------------------------------------------------------------------------
 * PHRASEBOOK — quick bilingual reference the player can open any time (P).
 * -------------------------------------------------------------------------- */
const PHRASEBOOK = [
  { meaning: 'Hello / I bow to you', hindi: 'Namaste', hindiScript: 'नमस्ते',
    japanese: 'Konnichiwa', japaneseScript: 'こんにちは' },
  { meaning: 'Thank you', hindi: 'Dhanyavaad', hindiScript: 'धन्यवाद',
    japanese: 'Arigato', japaneseScript: 'ありがとう' },
  { meaning: 'Yes', hindi: 'Haan', hindiScript: 'हाँ',
    japanese: 'Hai', japaneseScript: 'はい' },
  { meaning: 'No', hindi: 'Nahin', hindiScript: 'नहीं',
    japanese: 'Iie', japaneseScript: 'いいえ' },
  { meaning: 'Please', hindi: 'Kripya', hindiScript: 'कृपया',
    japanese: 'Onegai', japaneseScript: 'お願い' },
  { meaning: 'Sorry / Excuse me', hindi: 'Maaf kijiye', hindiScript: 'माफ़ कीजिए',
    japanese: 'Sumimasen', japaneseScript: 'すみません' },
  { meaning: 'Friend', hindi: 'Dost', hindiScript: 'दोस्त',
    japanese: 'Tomodachi', japaneseScript: '友達' },
  { meaning: 'Delicious', hindi: 'Swaadisht', hindiScript: 'स्वादिष्ट',
    japanese: 'Oishii', japaneseScript: '美味しい' },
  { meaning: 'Water', hindi: 'Paani', hindiScript: 'पानी',
    japanese: 'Mizu', japaneseScript: '水' },
  { meaning: 'Goodbye', hindi: 'Alvida', hindiScript: 'अलविदा',
    japanese: 'Sayonara', japaneseScript: 'さようなら' },
  { meaning: 'Let\'s be friends!', hindi: 'Dosti karein!', hindiScript: 'दोस्ती करें!',
    japanese: 'Tomodachi ni naro!', japaneseScript: '友達になろう！' }
];

/* ----------------------------------------------------------------------------
 * SIGNS — placed in the world; walking into one and pressing SPACE reads it.
 * Keyed by "x,y" tile coordinates (populated by the world builder).
 * -------------------------------------------------------------------------- */
const SIGN_TEXTS = {
  welcome: 'Welcome to CULTURE BRIDGE! Walk into the tall grass to meet Kotomon — ' +
           'folklore spirits of India and Japan. Answer their culture questions to befriend them. ' +
           'Press [C] for your Culturedex, [P] for the Phrasebook.',
  india: 'BHARAT REGION (India). Land of lamps and lotus. The tall grass here hums with ' +
         'spice-garden spirits. Try greeting anyone with "Namaste"!',
  japan: 'NIHON REGION (Japan). Land of blossoms and shrines. Bamboo-grove spirits gather in ' +
         'the tall grass. A polite "Konnichiwa" opens every door.',
  bridge: 'THE HARMONY BRIDGE. Two thousand years ago, Buddhism crossed from India to Japan, ' +
          'carrying gods, words and stories. You now walk that same bridge between two great cultures.',
  torii: 'A TORII gate marks sacred ground in Japan. Its cousin is the Indian "torana" — ' +
         'the carved gateways of ancient stupas. Same idea, two lands.',
  temple: 'An Indian TEMPLE (mandir). Notice the tiered tower — the "stupa" that inspired it ' +
          'also became the Japanese pagoda you can see across the river.'
};

/* NPC dialogue — friendly guides who teach a phrase or fact. */
const NPCS = [
  {
    name: 'Priya',
    home: 'india',
    lines: [
      'Namaste, traveller! I am Priya, from the Bharat region.',
      'Did you know? When you press your palms together and say "Namaste", the word means ' +
      '"I bow to the light in you."',
      'The Japanese chant "Namu" comes from the very same ancient word. Our cultures are ' +
      'already speaking to each other!'
    ]
  },
  {
    name: 'Haruki',
    home: 'japan',
    lines: [
      'Konnichiwa! I am Haruki, of the Nihon region.',
      'When we meet, we bow — the deeper the bow, the greater the respect.',
      'Come spring, we sit beneath the sakura for "hanami". In India they welcome spring with ' +
      'the colours of Holi. Two ways to say: the world is beautiful again!'
    ]
  },
  {
    name: 'Master Bodhi',
    home: 'bridge',
    lines: [
      'Ah, a culture-bridger! I have walked from Nalanda to Nara in my studies.',
      'Everything you see connects: Garuda became Karura, Saraswati became Benzaiten, ' +
      'the stupa became the pagoda.',
      'Befriend all twelve Kotomon and you will truly understand: India and Japan are two ' +
      'lanterns lit from a single flame.'
    ]
  }
];
