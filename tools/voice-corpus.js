#!/usr/bin/env node
/* Enumerates every line each companion can speak, with a stable key.
   Used to pre-generate the AI voice library and to build the manifest. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
// evaluate data.js in a bare sandbox to get the constants
const D = new Function(
  fs.readFileSync(path.join(root, 'js/data.js'), 'utf8') +
  ';return {COMPANIONS,PRACTICES,SURF_LINES,WELCOME_LINES,CAP_LINES,SURF_OPENER,SURF_CLOSER};'
)();

/* must match js/app.js lineKey() exactly */
function lineKey(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const out = { sera: {}, noa: {}, kai: {} };
const add = (companion, text) => {
  if (!text) return;
  out[companion][lineKey(text)] = text;
};
const addAll = text => { add('sera', text); add('noa', text); add('kai', text); };
const addPick = obj => {
  if (typeof obj === 'string') return addAll(obj);
  add('sera', obj.sera); add('noa', obj.noa); add('kai', obj.kai);
};

for (const c of Object.values(D.COMPANIONS)) {
  Object.values(c.greetings).forEach(g => add(c.id, g));
  c.farewells.forEach(f => add(c.id, f));
}
[D.WELCOME_LINES, D.CAP_LINES, D.SURF_OPENER, D.SURF_CLOSER].forEach(addPick);
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
console.log(counts, 'total:', total);
