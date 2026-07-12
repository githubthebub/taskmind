#!/bin/bash
# Double-click launcher for macOS.
# First run: right-click -> Open (Gatekeeper blocks unknown .command files).
cd "$(dirname "$0")"

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required. macOS will offer to install the developer tools:"
  xcode-select --install 2>/dev/null
  read -r -p "Press Enter to quit."
  exit 1
fi

# Make Homebrew's ffmpeg visible even when launched from Finder
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

exec python3 shortstack.py
