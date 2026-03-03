# YouTube Radar

Channel intelligence report generator. Analyzes a YouTube channel and produces a markdown report with top videos, content patterns, keyword analysis, and viral topic ideas.

## Quick start

```bash
pip install requests
python youtube_radar.py @KamikazeCash
```

That's it. No API key needed — it pulls data from YouTube's public RSS feed.

## Usage

```
python youtube_radar.py <@handle or URL>
python youtube_radar.py --channel-id UCcmZHsuUt_DOzcgIcLd0Qnw
python youtube_radar.py @mkbhd -o mkbhd_report.md -n 30
```

### Options

| Flag | Description |
|------|-------------|
| `--channel-id ID` | Pass a channel ID directly (skips the resolve step) |
| `--channel-name NAME` | Display name to use with `--channel-id` |
| `-o FILE` | Output file path (default: `<channel>_radar.md`) |
| `-n N` | Number of recent videos to analyse (default: 50) |

### Richer stats with an API key (optional)

Set a [YouTube Data API v3](https://developers.google.com/youtube/v3/getting-started) key for full stats (likes, comments, tags, duration):

```bash
export YOUTUBE_API_KEY=your_key_here
pip install google-api-python-client
python youtube_radar.py @KamikazeCash
```

Without a key, the script uses the public RSS feed which still gives titles, view counts, and publish dates for the 15 most recent uploads.

## What's in the report

- Executive summary (avg views, likes, upload frequency, duration)
- Top 10 videos ranked by views
- Recurring themes and keyword frequency
- Content pattern analysis (format, cadence, engagement rate, title patterns)
- 5 viral topic opportunities with suggested titles and opening hooks
- Bonus title ideas and hook templates
