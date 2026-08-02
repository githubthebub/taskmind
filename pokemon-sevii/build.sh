#!/usr/bin/env bash
# Build a self-contained single-file version of the game.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
OUT=dist/pokemon-sevii.html
{
  echo '<title>Pokémon Sevii Adventures</title>'
  echo '<style>'
  cat css/fonts.css css/style.css
  echo '</style>'
  # body markup (canvas + touch controls), extracted from index.html
  sed -n '/<canvas id="game"/,/^<\/div>$/p' index.html
  echo '<script>'
  cat js/audio.js js/sprites.js js/data.js js/maps.js js/ui.js js/engine.js js/battle.js js/main.js
  echo '</script>'
} > "$OUT"
echo "built $OUT ($(wc -c < "$OUT") bytes)"
