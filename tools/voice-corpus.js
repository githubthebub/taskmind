#!/usr/bin/env node
/* Enumerates every line each companion can speak, with a stable key.
   Used to pre-generate the AI voice library and to build the manifest.
   Companion-tinted lines fall back to the 'sera' variant (matching pick()
   in js/session.js) but are still voiced in each companion's own voice. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const D = new Function(
  fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') +
  ';return {COMPANIONS,PRACTICES,SURF_LINES,WELCOME_LINES,CAP_LINES,SURF_OPENER,SURF_CLOSER,MILESTONE_LINES};'
)();

/* must match js/session.js lineKey() exactly */
function lineKey(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const IDS = Object.keys(D.COMPANIONS);
const out = Object.fromEntries(IDS.map(id => [id, {}]));
const add = (cid, text) => { if (text) out[cid][lineKey(text)] = text; };
const addAll = text => IDS.forEach(cid => add(cid, text));
const addPick = obj => {
  if (typeof obj === 'string') return addAll(obj);
  IDS.forEach(cid => add(cid, obj[cid] || obj.sera));
};

for (const c of Object.values(D.COMPANIONS)) {
  Object.values(c.greetings).forEach(g => add(c.id, g));
  c.farewells.forEach(f => add(c.id, f));
}
[D.WELCOME_LINES, D.CAP_LINES, D.SURF_OPENER, D.SURF_CLOSER].forEach(addPick);
Object.values(D.MILESTONE_LINES).forEach(addPick);
D.SURF_LINES.forEach(addAll);

for (const p of D.PRACTICES) {
  for (const step of p.script) {
    if (step.t === 'say') addPick(step.text);
    if (step.t === 'still') addAll(step.text);
    if (step.t === 'breath' && step.coach) step.coach.forEach(addAll);
    if (step.t === 'scan') step.regions.forEach(r => addAll(r.text));
  }
}

const counts = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Object.keys(v).length]));
const total = Object.values(counts).reduce((a, b) => a + b, 0);

if (process.argv[2] === '--json') {
  fs.writeFileSync(process.argv[3] || 'voice-corpus.json', JSON.stringify(out, null, 1));
  console.log('written', process.argv[3] || 'voice-corpus.json');
}

/* --missing <voices.js path>: emit only lines with no clip yet */
if (process.argv[2] === '--missing') {
  const libPath = process.argv[3] || path.join(root, 'assets/voices.js');
  const lib = fs.existsSync(libPath)
    ? new Function(fs.readFileSync(libPath, 'utf8') + ';return VOICE_LIB;')()
    : {};
  const missing = {};
  let n = 0;
  for (const cid of IDS) {
    missing[cid] = {};
    for (const [key, text] of Object.entries(out[cid])) {
      if (!lib[cid] || !lib[cid][key]) { missing[cid][key] = text; n++; }
    }
  }
  fs.writeFileSync(process.argv[4] || 'voice-missing.json', JSON.stringify(missing, null, 1));
  console.log('missing clips:', n,
    Object.fromEntries(Object.entries(missing).map(([k, v]) => [k, Object.keys(v).length])));
}

console.log(counts, 'total:', total);
