#!/bin/bash
# ─────────────────────────────────────────────
# Company Analyzer — Double-click to launch
# ─────────────────────────────────────────────
# On Mac: double-click this file in Finder.
# On Linux: run ./run.command from terminal.
# ─────────────────────────────────────────────

# Move to the script's directory
cd "$(dirname "$0")"

echo ""
echo "====================================================="
echo "  Company Analyzer — Starting up..."
echo "====================================================="
echo ""

# ── Check Python ──
if command -v python3 &>/dev/null; then
    PY=python3
elif command -v python &>/dev/null; then
    PY=python
else
    echo "ERROR: Python is not installed."
    echo ""
    echo "  Install Python from: https://www.python.org/downloads/"
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

echo "Using: $($PY --version)"

# ── Check API key ──
if [ -z "$ANTHROPIC_API_KEY" ]; then
    # Try loading from .env file
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
fi

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo ""
    echo "ERROR: ANTHROPIC_API_KEY is not set."
    echo ""
    echo "  Option 1 — Create a .env file in this folder:"
    echo "    echo 'ANTHROPIC_API_KEY=sk-ant-...' > .env"
    echo ""
    echo "  Option 2 — Set it in your terminal:"
    echo "    export ANTHROPIC_API_KEY=sk-ant-..."
    echo ""
    echo "  Get a key at: https://console.anthropic.com/settings/keys"
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

# ── Install dependencies if needed ──
if ! $PY -c "import flask" 2>/dev/null; then
    echo "Installing dependencies (first run only)..."
    $PY -m pip install -r requirements.txt --quiet
    echo "Done."
    echo ""
fi

# ── Launch ──
echo "Starting server..."
echo "Open http://localhost:5000 in your browser"
echo "Press Ctrl+C to stop"
echo ""
$PY app.py
