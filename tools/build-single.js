#!/usr/bin/env node
/* Builds dist/haven.html — the whole app inlined into a single file.
   Used for the hosted deploy bundle and the claude.ai artifact. */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const css = read('css/haven.css');
const js = ['js/data.js', 'js/state.js', 'js/breath.js', 'js/session.js', 'js/app.js']
  .map(f => `/* ---- ${f} ---- */\n` + read(f))
  .join('\n\n');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet"[^>]*>/, () => `<style>\n${css}\n</style>`);
html = html.replace(/(\s*<script src="[^"]*"><\/script>)+/, () => `\n<script>\n${js}\n</script>\n`);

fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/haven.html'), html);
console.log('dist/haven.html:', (html.length / 1024).toFixed(1), 'KB');
