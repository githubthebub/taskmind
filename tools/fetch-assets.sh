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

echo "Portraits saved to assets/. Haven is now fully offline."
