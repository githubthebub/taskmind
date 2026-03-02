#!/usr/bin/env python3
"""
Company Analyzer — local server.

Serves index.html and handles POST /analyze requests.
Fetches the target company website, sends content to Claude,
and returns structured analysis.

Usage:
    export ANTHROPIC_API_KEY=sk-ant-...
    python server.py              # starts on http://localhost:8000
    python server.py --port 3000  # custom port
"""

import argparse
import json
import os
import re
import sys
import textwrap
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.error import URLError

API_KEY_ENV = "ANTHROPIC_API_KEY"
MODEL = "claude-sonnet-4-6"
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


def fetch_website(url: str) -> str:
    """Fetch a company website and return text content (truncated)."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; CompanyAnalyzer/1.0)",
    })
    try:
        with urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        raise RuntimeError(f"Could not fetch {url}: {e}")

    # Strip HTML tags, scripts, styles to get readable text
    text = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.S | re.I)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Truncate to ~6000 chars to fit context
    return text[:6000]


def call_claude(api_key: str, website_text: str, url: str) -> dict:
    """Send the website text to Claude and get structured analysis."""
    prompt = textwrap.dedent(f"""\
        You are a business automation consultant. I will give you the text content
        scraped from a company's website. Analyze it and respond with ONLY valid JSON
        (no markdown fences, no extra text) in this exact format:

        {{
          "summary": "2-3 sentence summary of what the company does, their industry, and target market.",
          "opportunities": [
            {{
              "title": "Short name for automation opportunity",
              "description": "One sentence explaining the opportunity and why it matters.",
              "time_saved": "Estimated time saved per week/month (e.g. '5-10 hrs/week')"
            }},
            {{
              "title": "...",
              "description": "...",
              "time_saved": "..."
            }},
            {{
              "title": "...",
              "description": "...",
              "time_saved": "..."
            }}
          ],
          "outreach": "A personalized cold outreach email (3-4 short paragraphs) to the company offering automation services. Reference specific things from their website. Keep it concise and value-focused. Do NOT use brackets or placeholders."
        }}

        Company URL: {url}
        Website content:
        {website_text}
    """)

    payload = json.dumps({
        "model": MODEL,
        "max_tokens": 1500,
        "messages": [{"role": "user", "content": prompt}],
    }).encode()

    req = Request(ANTHROPIC_API_URL, data=payload, headers={
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    })

    try:
        with urlopen(req, timeout=60) as resp:
            body = json.loads(resp.read())
    except URLError as e:
        raise RuntimeError(f"Claude API request failed: {e}")

    # Extract text from response
    text = body.get("content", [{}])[0].get("text", "")
    if not text:
        raise RuntimeError("Empty response from Claude")

    # Parse the JSON from Claude's response
    # Strip markdown fences if present
    text = re.sub(r"^```json\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        raise RuntimeError("Claude returned invalid JSON")


class Handler(SimpleHTTPRequestHandler):
    """Serves static files and handles the /analyze API endpoint."""

    def do_POST(self):
        if self.path != "/analyze":
            self.send_error(404)
            return

        # Check API key
        api_key = os.environ.get(API_KEY_ENV)
        if not api_key:
            self._json_error(500, f"Set {API_KEY_ENV} environment variable")
            return

        # Read request body
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        url = body.get("url", "").strip()

        if not url:
            self._json_error(400, "URL is required")
            return

        try:
            # Fetch website
            website_text = fetch_website(url)
            if len(website_text) < 50:
                self._json_error(400, "Could not extract enough content from that URL")
                return

            # Call Claude
            result = call_claude(api_key, website_text, url)

            # Send response
            self._json_response(200, result)

        except RuntimeError as e:
            self._json_error(500, str(e))
        except Exception as e:
            self._json_error(500, f"Unexpected error: {e}")

    def _json_response(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _json_error(self, code, message):
        self._json_response(code, {"error": message})

    def log_message(self, fmt, *args):
        # Cleaner log output
        sys.stderr.write(f"  {args[0]}\n")


def main():
    parser = argparse.ArgumentParser(description="Company Analyzer server")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    api_key = os.environ.get(API_KEY_ENV)
    if not api_key:
        print(f"⚠️  Warning: {API_KEY_ENV} not set. Set it before analyzing:")
        print(f"   export {API_KEY_ENV}=sk-ant-...\n")

    # Change to script directory so index.html is served
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    server = HTTPServer(("", args.port), Handler)
    print(f"🚀 Company Analyzer running at http://localhost:{args.port}")
    print(f"   Press Ctrl+C to stop\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()


if __name__ == "__main__":
    main()
