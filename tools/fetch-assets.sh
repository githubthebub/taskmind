#!/usr/bin/env bash
# Downloads the companion portraits into assets/ so Haven works fully offline.
# Without this, the app transparently loads the same images from their hosted URLs.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p assets

base="https://d8j0ntlcm91z4.cloudfront.net/user_36KNmFd6iH5Y3yk4Gh9GpEgWGDw"

curl -fsSL "$base/hf_20260702_181043_fd67e02d-4a1c-4029-897c-6a1c63e504e1.png" -o assets/sera.png
curl -fsSL "$base/hf_20260702_181046_453520db-45e2-420c-9dd7-9602f7021420.png" -o assets/noa.png
curl -fsSL "$base/hf_20260702_181049_d71cab0b-51b0-44f4-91f0-8c7ae7f31df3.png" -o assets/kai.png

curl -fsSL "$base/hf_20260703_115824_7ce4d64c-0d47-4730-ae38-426dc938746e.png" -o assets/amara.png
curl -fsSL "$base/hf_20260703_115827_8da41db9-6ca3-40cd-9b70-b896c2c54478.png" -o assets/yuki.png

# breathing video loops (480x640, ~6s, silent)
curl -fsSL "$base/hf_20260702_184419_dbfabd7f-8bf9-4183-8bb0-47630cbf1e96.mp4" -o assets/sera.mp4
curl -fsSL "$base/hf_20260702_184422_dceb591c-1892-4bc4-a0b4-cfdfb17d9fd6.mp4" -o assets/noa.mp4
curl -fsSL "$base/hf_20260702_184424_55d4a78c-d2ea-4e6b-9783-b99b913da34a.mp4" -o assets/kai.mp4
curl -fsSL "$base/hf_20260703_120643_e7f6f086-0c84-46ec-8012-0a2661466a7f.mp4" -o assets/amara.mp4
curl -fsSL "$base/hf_20260703_120644_29bdbe9a-a9aa-4808-b880-3ad4c5a716d4.mp4" -o assets/yuki.mp4

# voice clip library (reads assets/voices.js, saves to assets/voice/<companion>/<key>.mp3)
if [ -f assets/voices.js ]; then
  node - <<'EOF'
const fs = require('fs');
const { execSync } = require('child_process');
const lib = new Function(fs.readFileSync('assets/voices.js', 'utf8') + ';return VOICE_LIB;')();
for (const [c, clips] of Object.entries(lib)) {
  fs.mkdirSync(`assets/voice/${c}`, { recursive: true });
  for (const [key, url] of Object.entries(clips)) {
    const out = `assets/voice/${c}/${key}.mp3`;
    if (!fs.existsSync(out)) execSync(`curl -fsSL "${url}" -o "${out}"`);
  }
  console.log(c, Object.keys(clips).length, 'clips');
}
EOF
fi

echo "Portraits, breathing loops, and voices saved to assets/. Haven is now fully offline."
