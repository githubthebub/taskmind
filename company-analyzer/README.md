# Company Analyzer

AI-powered tool that analyzes any company's website and generates:

- Company summary and business model
- 3 automation opportunities with time-saved estimates
- Ready-to-send cold outreach email

## Setup (one time)

### 1. Install Python

Download from [python.org/downloads](https://www.python.org/downloads/) if you don't have it.

### 2. Get an API key

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)
2. Create a new API key
3. Create a file called `.env` in this folder with one line:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

## Run

**Mac:** Double-click `run.command` in Finder.

**Terminal:**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
python app.py
```

The app opens at [http://localhost:5000](http://localhost:5000).

## Files

```
company-analyzer/
  app.py            - Backend server
  templates/
    index.html      - Frontend page
  requirements.txt  - Python dependencies
  run.command       - Mac double-click launcher
  .env              - Your API key (create this)
```
