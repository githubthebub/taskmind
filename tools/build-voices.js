#!/usr/bin/env node
/* Merges the per-companion voice manifests (key -> hosted mp3 URL) into
   assets/voices.js, consumed by speak() in js/session.js.
   Usage: node tools/build-voices.js <dir-with-voices-{sera,noa,kai}.json> */
const fs = require('fs');
const path = require('path');

const src = process.argv[2] || '.';
const root = path.join(__dirname, '..');
const lib = {};
let total = 0;

for (const c of ['sera', 'noa', 'kai']) {
  const f = path.join(src, `voices-${c}.json`);
  lib[c] = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {};
  total += Object.keys(lib[c]).length;
}

fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'assets/voices.js'),
  '/* Generated voice-clip library: line-key -> hosted mp3. See tools/voice-corpus.js */\n' +
  'const VOICE_LIB = ' + JSON.stringify(lib, null, 1) + ';\n'
);
console.log('assets/voices.js written,', total, 'clips',
  Object.fromEntries(Object.entries(lib).map(([k, v]) => [k, Object.keys(v).length])));
