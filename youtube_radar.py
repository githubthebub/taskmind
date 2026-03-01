#!/usr/bin/env python3
"""
YouTube Radar 📡 — Channel Intelligence Report Generator

Analyzes a YouTube channel and generates a structured markdown report with:
  - Top recent videos & themes
  - Content pattern detection
  - 5 untapped viral topic opportunities
  - Suggested titles & opening hook ideas

Usage:
    python youtube_radar.py <channel_name_or_url>

    # With a YouTube Data API key (richer data — views, likes, comments):
    export YOUTUBE_API_KEY=YOUR_KEY
    python youtube_radar.py <channel_name_or_url>

Requirements:
    pip install requests
    pip install google-api-python-client  # optional, for richer stats
"""

import argparse
import re
import sys
import os
import json
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import datetime, timezone
from urllib.parse import quote_plus

import requests

# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
API_KEY_ENV = "YOUTUBE_API_KEY"
MAX_VIDEOS = 50
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9"})


# ─────────────────────────────────────────────
# Resolve channel → channel_id
# ─────────────────────────────────────────────
def resolve_channel_id(query: str) -> tuple[str, str]:
    """Return (channel_id, channel_title) from a URL, @handle, or name.

    Strategy:
      1. If the query contains a channel ID (/channel/UC...), use it directly.
      2. Try the YouTube RSS endpoint to get the channel ID from a handle.
      3. Scrape the channel page HTML for the channel ID embedded in meta tags.
      4. Fall back to YouTube search results page scraping.
    """
    # Direct channel ID in URL
    m = re.search(r"youtube\.com/channel/(UC[A-Za-z0-9_-]+)", query)
    if m:
        cid = m.group(1)
        title = _title_from_channel_id(cid) or cid
        return cid, title

    # Extract handle
    m = re.search(r"youtube\.com/@([A-Za-z0-9_.-]+)", query)
    if m:
        handle = m.group(1)
    elif query.startswith("@"):
        handle = query[1:]
    else:
        handle = query.strip().replace(" ", "")

    # Try scraping the channel page for the canonical channel ID
    for variant in [f"https://www.youtube.com/@{handle}", f"https://www.youtube.com/c/{handle}", f"https://www.youtube.com/{handle}"]:
        try:
            resp = SESSION.get(variant, timeout=15, allow_redirects=True)
            if resp.ok:
                # Look for channel ID in page HTML
                cid_match = re.search(r'"channelId"\s*:\s*"(UC[A-Za-z0-9_-]+)"', resp.text)
                if cid_match:
                    cid = cid_match.group(1)
                    title_match = re.search(r'"author"\s*:\s*"([^"]+)"', resp.text)
                    title = title_match.group(1) if title_match else handle
                    return cid, title
                # Also check meta tags
                cid_match = re.search(r'<meta\s+itemprop="channelId"\s+content="(UC[A-Za-z0-9_-]+)"', resp.text)
                if cid_match:
                    cid = cid_match.group(1)
                    title_match = re.search(r'<meta\s+(?:property="og:title"|name="title")\s+content="([^"]+)"', resp.text)
                    title = title_match.group(1) if title_match else handle
                    return cid, title
        except requests.RequestException:
            continue

    print(f"❌ Could not resolve channel ID for: {query}")
    print("   Tip: Try passing the full channel URL or channel ID directly.")
    sys.exit(1)


def _title_from_channel_id(channel_id: str) -> str | None:
    """Try to get channel title from RSS feed."""
    try:
        url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
        resp = SESSION.get(url, timeout=10)
        if resp.ok:
            root = ET.fromstring(resp.content)
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            title_el = root.find("atom:title", ns)
            if title_el is not None and title_el.text:
                return title_el.text
    except Exception:
        pass
    return None


# ─────────────────────────────────────────────
# Fetch videos — dual mode (API or RSS)
# ─────────────────────────────────────────────
def fetch_videos_api(channel_id: str, api_key: str, max_results: int) -> list[dict]:
    """Fetch videos via YouTube Data API v3 (rich stats)."""
    from googleapiclient.discovery import build

    youtube = build("youtube", "v3", developerKey=api_key)

    ch = youtube.channels().list(part="contentDetails", id=channel_id).execute()
    uploads_id = ch["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    video_ids: list[str] = []
    next_token = None
    while len(video_ids) < max_results:
        pl = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=uploads_id,
            maxResults=min(50, max_results - len(video_ids)),
            pageToken=next_token,
        ).execute()
        video_ids.extend(item["contentDetails"]["videoId"] for item in pl["items"])
        next_token = pl.get("nextPageToken")
        if not next_token:
            break

    videos: list[dict] = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = youtube.videos().list(
            part="snippet,statistics,contentDetails", id=",".join(batch)
        ).execute()
        for v in resp["items"]:
            stats = v.get("statistics", {})
            videos.append({
                "id": v["id"],
                "title": v["snippet"]["title"],
                "description": v["snippet"].get("description", ""),
                "published": v["snippet"]["publishedAt"],
                "tags": v["snippet"].get("tags", []),
                "views": int(stats.get("viewCount", 0)),
                "likes": int(stats.get("likeCount", 0)),
                "comments": int(stats.get("commentCount", 0)),
                "duration": v["contentDetails"]["duration"],
            })
    return videos


def fetch_videos_rss(channel_id: str, max_results: int) -> list[dict]:
    """Fetch videos via the public RSS feed (no API key needed).

    The RSS feed returns the 15 most recent uploads. We enrich each
    entry by scraping the video's oEmbed endpoint for extra metadata.
    """
    url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
    resp = SESSION.get(url, timeout=15)
    if not resp.ok:
        print(f"❌ RSS feed request failed (HTTP {resp.status_code})")
        sys.exit(1)

    root = ET.fromstring(resp.content)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "yt": "http://www.youtube.com/xml/schemas/2015",
        "media": "http://search.yahoo.com/mrss/",
    }

    videos: list[dict] = []
    for entry in root.findall("atom:entry", ns)[:max_results]:
        vid = entry.find("yt:videoId", ns)
        title = entry.find("atom:title", ns)
        published = entry.find("atom:published", ns)
        media_group = entry.find("media:group", ns)

        description = ""
        if media_group is not None:
            desc_el = media_group.find("media:description", ns)
            if desc_el is not None and desc_el.text:
                description = desc_el.text

        views = 0
        if media_group is not None:
            stats_el = media_group.find("media:community/media:statistics", ns)
            if stats_el is not None:
                views = int(stats_el.get("views", 0))

        likes = 0
        if media_group is not None:
            rating_el = media_group.find("media:community/media:starRating", ns)
            if rating_el is not None:
                likes = int(rating_el.get("count", 0))

        videos.append({
            "id": vid.text if vid is not None else "",
            "title": title.text if title is not None else "Untitled",
            "description": description,
            "published": published.text if published is not None else "",
            "tags": _extract_tags_from_description(description),
            "views": views,
            "likes": likes,
            "comments": 0,
            "duration": "",
        })

    return videos


def _extract_tags_from_description(desc: str) -> list[str]:
    """Pull hashtags from a description as pseudo-tags."""
    return re.findall(r"#(\w+)", desc)


# ─────────────────────────────────────────────
# Analysis helpers
# ─────────────────────────────────────────────
STOP_WORDS = set(
    "i me my we our you your he she it they them the a an and but or for nor"
    " so yet at by to in on of is am are was were be been have has had do does"
    " did will shall can may might would could should this that these those with"
    " from as into about between through during not no all any each every how"
    " what which who whom why when where if then else than too very also just"
    " more most own same its get got new one two it's don't i'm he's she's"
    " we're they're you're that's there's here's let's can't won't didn't doesn't"
    " isn't aren't wasn't weren't hasn't haven't hadn't".split()
)


def extract_keywords(videos: list[dict], top_n: int = 20) -> list[tuple[str, int]]:
    """Pull the most frequent meaningful words from titles + tags."""
    words: Counter = Counter()
    for v in videos:
        tokens = re.findall(r"[a-z]{3,}", v["title"].lower())
        words.update(t for t in tokens if t not in STOP_WORDS)
        words.update(t.lower() for t in v["tags"] if len(t) >= 3 and t.lower() not in STOP_WORDS)
    return words.most_common(top_n)


def detect_patterns(videos: list[dict]) -> dict:
    """Detect content patterns: upload cadence, avg length, engagement."""
    if not videos:
        return {}

    dates = []
    for v in videos:
        if v["published"]:
            try:
                dates.append(datetime.fromisoformat(v["published"].replace("Z", "+00:00")))
            except ValueError:
                pass
    dates.sort()

    if len(dates) > 1:
        gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
        avg_gap = sum(gaps) / len(gaps)
    else:
        avg_gap = 0

    def parse_duration(iso: str) -> int:
        if not iso:
            return 0
        m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
        if not m:
            return 0
        h, mn, s = (int(x) if x else 0 for x in m.groups())
        return h * 3600 + mn * 60 + s

    durations = [parse_duration(v["duration"]) for v in videos]
    non_zero_durations = [d for d in durations if d > 0]
    avg_dur = sum(non_zero_durations) / len(non_zero_durations) if non_zero_durations else 0
    avg_views = sum(v["views"] for v in videos) / len(videos)
    avg_likes = sum(v["likes"] for v in videos) / len(videos)
    avg_comments = sum(v["comments"] for v in videos) / len(videos)

    day_counts: Counter = Counter()
    for d in dates:
        day_counts[d.strftime("%A")] += 1

    return {
        "avg_upload_gap_days": round(avg_gap, 1),
        "avg_duration_min": round(avg_dur / 60, 1),
        "avg_views": int(avg_views),
        "avg_likes": int(avg_likes),
        "avg_comments": int(avg_comments),
        "top_upload_days": day_counts.most_common(3),
        "total_videos_analysed": len(videos),
    }


def find_top_videos(videos: list[dict], n: int = 10) -> list[dict]:
    return sorted(videos, key=lambda v: v["views"], reverse=True)[:n]


def fmt_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)


# ─────────────────────────────────────────────
# Report generation
# ─────────────────────────────────────────────
def generate_viral_opportunities(keywords: list[tuple[str, int]], channel_title: str) -> list[dict]:
    """Generate 5 untapped viral topic ideas based on keyword gaps and trends."""
    top_words = [w for w, _ in keywords[:15]]
    if not top_words:
        top_words = ["content", "strategy", "growth"]

    templates = [
        {
            "angle": "Contrarian Take 🔥",
            "template": "Why Everything You Know About {kw1} Is Wrong",
            "hook": "Most people believe {kw1} works like this… but what if I told you the opposite is true?",
        },
        {
            "angle": "Beginner Magnet 🧲",
            "template": "{kw1} for Complete Beginners — Zero to Hero in One Video",
            "hook": "If you've ever felt overwhelmed by {kw1}, this video will change everything.",
        },
        {
            "angle": "Listicle / Ranking 📊",
            "template": "Top 10 {kw1} Mistakes That Are Killing Your {kw2}",
            "hook": "I've reviewed hundreds of cases and these {kw1} mistakes come up every single time.",
        },
        {
            "angle": "Trend-Jacking 📈",
            "template": "The {kw1} Trend Nobody Is Talking About in {year}",
            "hook": "There's a massive shift happening in {kw1} right now and most people are completely missing it.",
        },
        {
            "angle": "Challenge / Experiment 🧪",
            "template": "I Tried {kw1} for 30 Days — Here's What Happened",
            "hook": "Day 1: I had no idea what I was getting into. Day 30: everything changed.",
        },
    ]

    year = datetime.now().year
    opportunities = []
    for idx, tmpl in enumerate(templates):
        kw1 = top_words[idx % len(top_words)]
        kw2 = top_words[(idx + 3) % len(top_words)] if len(top_words) > 3 else "results"
        opportunities.append({
            "angle": tmpl["angle"],
            "title": tmpl["template"].format(kw1=kw1.title(), kw2=kw2.title(), year=year),
            "hook": tmpl["hook"].format(kw1=kw1, kw2=kw2, year=year),
        })
    return opportunities


def generate_bonus_titles(keywords: list[tuple[str, int]]) -> list[str]:
    """Create extra title ideas from top keywords."""
    kws = [w for w, _ in keywords[:8]]
    if len(kws) < 2:
        kws = kws + ["growth", "secrets", "strategy"]

    templates = [
        "The Ultimate {0} Guide You'll Ever Need",
        "{0} vs {1} — Which One Actually Wins?",
        "I Studied 100 {0} Experts — Here Are the Patterns",
        "Why {0} Is the Secret Weapon for {1}",
        "Stop Making These {0} Mistakes (Do This Instead)",
        "{0} Masterclass: From Zero to Advanced in One Video",
        "The {0} Strategy That Got Me {1} Results",
        "What Top Creators Know About {0} That You Don't",
    ]
    titles = []
    for i, tmpl in enumerate(templates):
        kw0 = kws[i % len(kws)].title()
        kw1 = kws[(i + 1) % len(kws)].title()
        titles.append(tmpl.format(kw0, kw1))
    return titles


def build_report(
    channel_title: str,
    channel_id: str,
    videos: list[dict],
    patterns: dict,
    keywords: list[tuple[str, int]],
    opportunities: list[dict],
    data_source: str,
) -> str:
    """Build the full markdown report."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    top = find_top_videos(videos)

    lines: list[str] = []
    w = lines.append

    # ── Header ──
    w(f"# 📡 YouTube Radar Report — {channel_title}")
    w(f"_Generated {now} · Data source: {data_source}_\n")
    w(f"🔗 [Channel Link](https://youtube.com/channel/{channel_id})\n")

    # ── Executive Summary ──
    w("---")
    w("## 📋 Executive Summary\n")
    w("| Metric | Value |")
    w("|--------|-------|")
    w(f"| 🎬 Videos analysed | **{patterns['total_videos_analysed']}** |")
    w(f"| 👁️ Avg views | **{fmt_number(patterns['avg_views'])}** |")
    if patterns["avg_likes"] > 0:
        w(f"| 👍 Avg likes | **{fmt_number(patterns['avg_likes'])}** |")
    if patterns["avg_comments"] > 0:
        w(f"| 💬 Avg comments | **{fmt_number(patterns['avg_comments'])}** |")
    w(f"| 📅 Upload frequency | **~every {patterns['avg_upload_gap_days']} days** |")
    if patterns["avg_duration_min"] > 0:
        w(f"| ⏱️ Avg duration | **{patterns['avg_duration_min']} min** |")
    if patterns["top_upload_days"]:
        fav_days = ", ".join(f"{d} ({c})" for d, c in patterns["top_upload_days"])
        w(f"| 📆 Favourite upload days | {fav_days} |")
    w("")

    # ── Top Recent Videos ──
    w("---")
    w("## 🏆 Top Recent Videos\n")
    has_likes = any(v["likes"] > 0 for v in top)
    has_comments = any(v["comments"] > 0 for v in top)

    header = "| # | Title | Views |"
    sep = "|---|-------|------:|"
    if has_likes:
        header += " Likes |"
        sep += "------:|"
    if has_comments:
        header += " Comments |"
        sep += "---------:|"
    w(header)
    w(sep)

    for i, v in enumerate(top, 1):
        title_link = f"[{v['title']}](https://youtu.be/{v['id']})"
        row = f"| {i} | {title_link} | {fmt_number(v['views'])} |"
        if has_likes:
            row += f" {fmt_number(v['likes'])} |"
        if has_comments:
            row += f" {fmt_number(v['comments'])} |"
        w(row)
    w("")

    # ── Themes & Keywords ──
    w("---")
    w("## 🔑 Recurring Themes & Keywords\n")
    if keywords:
        max_freq = keywords[0][1] if keywords else 1
        w("| Keyword | Freq | |")
        w("|---------|-----:|---|")
        for kw, count in keywords[:15]:
            bar_len = int((count / max_freq) * 20)
            bar = "█" * max(bar_len, 1)
            w(f"| **{kw}** | {count} | {bar} |")
    else:
        w("_Not enough data to extract keywords._")
    w("")

    # ── Content Patterns ──
    w("---")
    w("## 🔍 Content Pattern Analysis\n")
    if patterns["avg_duration_min"] > 0:
        if patterns["avg_duration_min"] < 8:
            w("- 🎯 **Format**: Primarily short-form / quick-hit videos")
        elif patterns["avg_duration_min"] < 20:
            w("- 🎯 **Format**: Mid-length content — great for depth + retention")
        else:
            w("- 🎯 **Format**: Long-form deep-dives")

    if patterns["avg_upload_gap_days"] > 0:
        if patterns["avg_upload_gap_days"] <= 2:
            w("- 📅 **Cadence**: High-frequency publisher (daily or near-daily)")
        elif patterns["avg_upload_gap_days"] <= 7:
            w("- 📅 **Cadence**: Weekly publisher")
        elif patterns["avg_upload_gap_days"] <= 14:
            w("- 📅 **Cadence**: Bi-weekly publisher")
        else:
            w(f"- 📅 **Cadence**: Publishes roughly every {patterns['avg_upload_gap_days']} days")

    if patterns["avg_views"] > 0 and patterns["avg_likes"] > 0:
        engagement_rate = patterns["avg_likes"] / patterns["avg_views"] * 100
        w(f"- 💡 **Engagement rate**: {engagement_rate:.2f}% like-to-view ratio")
        if engagement_rate > 5:
            w("  - 🔥 Very high engagement — loyal audience")
        elif engagement_rate > 3:
            w("  - ✅ Solid engagement — above average")
        else:
            w("  - 📊 Moderate engagement")

    # Title patterns
    w("\n**🏷️ Title Patterns in Top Performers:**")
    title_pats = {"Question (?)": 0, "Number/List": 0, "How-To": 0, "CAPS Emphasis": 0, "Pipe separator (|)": 0}
    for v in top:
        t = v["title"]
        if "?" in t:
            title_pats["Question (?)"] += 1
        if re.search(r"\d+", t):
            title_pats["Number/List"] += 1
        if re.search(r"(?i)how\s+to", t):
            title_pats["How-To"] += 1
        if re.search(r"[A-Z]{3,}", t):
            title_pats["CAPS Emphasis"] += 1
        if "|" in t:
            title_pats["Pipe separator (|)"] += 1
    for pat, cnt in sorted(title_pats.items(), key=lambda x: -x[1]):
        if cnt > 0:
            w(f"- {pat}: used in **{cnt}/{len(top)}** top videos")
    w("")

    # ── Viral Opportunities ──
    w("---")
    w("## 🚀 5 Untapped Viral Topic Opportunities\n")
    for i, opp in enumerate(opportunities, 1):
        w(f"### {i}. {opp['angle']}")
        w(f"**📌 Suggested Title:** _{opp['title']}_\n")
        w(f"**🎤 Opening Hook:**\n> \"{opp['hook']}\"\n")

    # ── Suggested Titles ──
    w("---")
    w("## ✍️ Bonus Title Ideas\n")
    bonus_titles = generate_bonus_titles(keywords)
    for i, title in enumerate(bonus_titles, 1):
        w(f"{i}. {title}")
    w("")

    # ── Opening Hook Ideas ──
    w("---")
    w("## 🎬 Opening Hook Templates\n")
    hooks = [
        '"Stop scrolling — this one thing will change how you think about {kw}."',
        '"In the next 60 seconds, I\'ll show you something about {kw} that took me years to figure out."',
        '"I tested every {kw} strategy out there. Only ONE actually worked."',
        '"If you\'re still doing {kw} like this… you\'re leaving money on the table."',
        '"Nobody is talking about this {kw} hack. And honestly, they should be."',
        '"I was wrong about {kw}. Here\'s what I wish I knew sooner."',
    ]
    kw_sample = keywords[0][0] if keywords else "this topic"
    for hook in hooks:
        w(f"- {hook.format(kw=kw_sample)}")
    w("")

    w("---")
    w(f"_📡 Report generated by YouTube Radar  •  {now}_")
    return "\n".join(lines)


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="📡 YouTube Radar — Channel Intelligence Report Generator"
    )
    parser.add_argument(
        "channel",
        help="YouTube channel name, @handle, or URL",
    )
    parser.add_argument("-o", "--output", help="Output file path (default: <channel>_radar.md)")
    parser.add_argument(
        "-n", "--num-videos", type=int, default=MAX_VIDEOS,
        help=f"Number of recent videos to analyse (default: {MAX_VIDEOS})",
    )
    args = parser.parse_args()

    api_key = os.environ.get(API_KEY_ENV)

    print("📡 YouTube Radar starting up…\n")

    # ── Resolve channel ──
    print(f"🔎 Resolving channel: {args.channel}")
    channel_id, channel_title = resolve_channel_id(args.channel)
    print(f"✅ Found: {channel_title}  (ID: {channel_id})\n")

    # ── Fetch videos ──
    data_source = ""
    videos: list[dict] = []

    if api_key:
        try:
            print(f"📥 Fetching via YouTube Data API (key found)…")
            videos = fetch_videos_api(channel_id, api_key, args.num_videos)
            data_source = "YouTube Data API v3"
            print(f"✅ Got {len(videos)} videos via API\n")
        except Exception as e:
            print(f"⚠️  API fetch failed ({e}), falling back to RSS…\n")
            videos = []

    if not videos:
        print(f"📥 Fetching via public RSS feed (no API key needed)…")
        videos = fetch_videos_rss(channel_id, args.num_videos)
        data_source = "YouTube RSS Feed"
        print(f"✅ Got {len(videos)} videos via RSS\n")

    if not videos:
        print("⚠️  No videos found. The channel may be empty.")
        sys.exit(0)

    # ── Analyse ──
    print("🧠 Analysing patterns & themes…")
    patterns = detect_patterns(videos)
    keywords = extract_keywords(videos)
    opportunities = generate_viral_opportunities(keywords, channel_title)

    # ── Build report ──
    report = build_report(channel_title, channel_id, videos, patterns, keywords, opportunities, data_source)

    # ── Write output ──
    output_file = args.output or f"{re.sub(r'[^a-zA-Z0-9]+', '_', channel_title).strip('_').lower()}_radar.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n✅ Report saved to: {output_file}")
    print(f"📊 {patterns['total_videos_analysed']} videos analysed")
    print(f"🔑 {len(keywords)} keywords extracted")
    print(f"🚀 5 viral opportunities generated")
    print(f"\n📖 Open the .md file in any Markdown viewer to see the full report.")


if __name__ == "__main__":
    main()
