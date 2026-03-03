#!/usr/bin/env python3
"""
Company Analyzer — AI-powered company research tool.

Fetches a company website, sends the content to Claude,
and returns a structured analysis with automation opportunities
and a ready-to-send outreach message.
"""

import json
import os
import re
import sys
import webbrowser
import threading

import anthropic
import requests
from bs4 import BeautifulSoup
from flask import Flask, render_template, request, jsonify

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
PORT = 5000
MODEL = "claude-sonnet-4-6"

app = Flask(__name__)


# ─────────────────────────────────────────────
# Website fetcher
# ─────────────────────────────────────────────
def fetch_website_text(url: str) -> str:
    """Fetch a URL and return clean readable text."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
    }

    resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    # Remove non-content elements
    for tag in soup(["script", "style", "nav", "footer", "header", "iframe", "noscript"]):
        tag.decompose()

    text = soup.get_text(separator=" ", strip=True)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()
    # Truncate to fit context window comfortably
    return text[:8000]


# ─────────────────────────────────────────────
# Claude analysis
# ─────────────────────────────────────────────
ANALYSIS_PROMPT = """\
You are a senior business analyst and automation consultant.

I scraped the following text from a company's website. Analyze it thoroughly.

Respond with ONLY valid JSON — no markdown fences, no commentary, no text
before or after the JSON. Use this exact structure:

{
  "company_name": "The company name",
  "summary": "2-3 sentences describing what the company does, who they serve, and their value proposition.",
  "business_model": "1-2 sentences on how they likely make money (SaaS, services, e-commerce, etc).",
  "industry": "Their industry or sector.",
  "opportunities": [
    {
      "title": "Short name of the automation opportunity",
      "description": "2-3 sentences explaining what could be automated and why it matters to this specific company.",
      "time_saved": "Estimated time saved (e.g. '5-10 hrs/week')",
      "impact": "High, Medium, or Low"
    },
    {
      "title": "...",
      "description": "...",
      "time_saved": "...",
      "impact": "..."
    },
    {
      "title": "...",
      "description": "...",
      "time_saved": "...",
      "impact": "..."
    }
  ],
  "outreach": "A personalized 3-4 paragraph cold email to this company offering AI/automation services. Reference specific details from their website. Be concise, specific, and value-focused. Include a clear call to action. Do not use placeholder brackets — write it ready to send."
}

Company URL: {url}

Website content:
{content}
"""


def analyze_company(url: str, website_text: str) -> dict:
    """Send website text to Claude and return structured analysis."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY not set. "
            "Run: export ANTHROPIC_API_KEY=sk-ant-..."
        )

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model=MODEL,
        max_tokens=2000,
        messages=[
            {
                "role": "user",
                "content": ANALYSIS_PROMPT.format(url=url, content=website_text),
            }
        ],
    )

    text = message.content[0].text.strip()

    # Strip markdown fences if Claude added them
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    return json.loads(text)


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    url = (data or {}).get("url", "").strip()

    if not url:
        return jsonify({"error": "Please enter a URL."}), 400

    try:
        website_text = fetch_website_text(url)
    except requests.exceptions.ConnectionError:
        return jsonify({"error": f"Could not connect to {url}. Check the URL and try again."}), 400
    except requests.exceptions.Timeout:
        return jsonify({"error": f"Request to {url} timed out. Try again."}), 400
    except requests.exceptions.HTTPError as e:
        return jsonify({"error": f"Website returned an error: {e.response.status_code}"}), 400
    except Exception as e:
        return jsonify({"error": f"Could not fetch website: {e}"}), 400

    if len(website_text) < 50:
        return jsonify({"error": "Could not extract enough text from that URL. Try the homepage."}), 400

    try:
        result = analyze_company(url, website_text)
    except ValueError as e:
        return jsonify({"error": str(e)}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "AI returned an unexpected format. Try again."}), 500
    except anthropic.APIError as e:
        return jsonify({"error": f"Claude API error: {e.message}"}), 500
    except Exception as e:
        return jsonify({"error": f"Analysis failed: {e}"}), 500

    return jsonify(result)


# ─────────────────────────────────────────────
# Startup
# ─────────────────────────────────────────────
def open_browser():
    """Open the browser after a short delay to let Flask start."""
    import time
    time.sleep(1.5)
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    # Check for API key early
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print()
        print("=" * 55)
        print("  ANTHROPIC_API_KEY not set!")
        print()
        print("  Run this first:")
        print("    export ANTHROPIC_API_KEY=sk-ant-...")
        print()
        print("  Then re-run:")
        print("    python app.py")
        print("=" * 55)
        print()
        sys.exit(1)

    # Open browser automatically
    threading.Thread(target=open_browser, daemon=True).start()

    print()
    print("=" * 55)
    print("  Company Analyzer is running!")
    print(f"  Open http://localhost:{PORT} in your browser")
    print("  Press Ctrl+C to stop")
    print("=" * 55)
    print()

    app.run(host="0.0.0.0", port=PORT, debug=False)
