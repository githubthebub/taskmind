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

Requirements:
    pip install google-api-python-client
"""

import argparse
import re
import sys
import os
import json
from collections import Counter
from datetime import datetime, timezone

try:
    from googleapiclient.discovery import build
except ImportError:
    print("❌ Missing dependency. Install it with:\n   pip install google-api-python-client")
    sys.exit(1)


# ─────────────────────────────────────────────
# Config
# ─────────────────────────────────────────────
API_KEY_ENV = "YOUTUBE_API_KEY"
MAX_VIDEOS = 50  # recent videos to analyse


def get_api_key():
    key = os.environ.get(API_KEY_ENV)
    if not key:
        print(f"❌ Set your YouTube Data API v3 key:\n   export {API_KEY_ENV}=YOUR_KEY")
        sys.exit(1)
    return key


# ─────────────────────────────────────────────
# YouTube helpers
# ─────────────────────────────────────────────
def resolve_channel_id(youtube, query: str) -> tuple[str, str]:
    """Return (channel_id, channel_title) from a URL, @handle, or search term."""

    # Full URL: extract channel ID or handle
    m = re.search(r"youtube\.com/channel/([A-Za-z0-9_-]+)", query)
    if m:
        resp = youtube.channels().list(part="snippet", id=m.group(1)).execute()
        if resp["items"]:
            item = resp["items"][0]
            return item["id"], item["snippet"]["title"]

    m = re.search(r"youtube\.com/@([A-Za-z0-9_.-]+)", query)
    if m:
        handle = m.group(1)
    elif query.startswith("@"):
        handle = query[1:]
    else:
        handle = None

    if handle:
        resp = youtube.channels().list(part="snippet", forHandle=handle).execute()
        if resp.get("items"):
            item = resp["items"][0]
            return item["id"], item["snippet"]["title"]

    # Fallback: search
    resp = youtube.search().list(part="snippet", q=query, type="channel", maxResults=1).execute()
    if resp["items"]:
        item = resp["items"][0]
        return item["snippet"]["channelId"], item["snippet"]["channelTitle"]

    print(f"❌ Could not find a channel for: {query}")
    sys.exit(1)


def fetch_recent_videos(youtube, channel_id: str, max_results: int = MAX_VIDEOS) -> list[dict]:
    """Fetch recent uploads with stats."""
    # Get uploads playlist
    ch = youtube.channels().list(part="contentDetails", id=channel_id).execute()
    uploads_id = ch["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    video_ids = []
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

    # Fetch full details in batches of 50
    videos = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = youtube.videos().list(
            part="snippet,statistics,contentDetails", id=",".join(batch)
        ).execute()
        for v in resp["items"]:
            stats = v.get("statistics", {})
            videos.append(
                {
                    "id": v["id"],
                    "title": v["snippet"]["title"],
                    "description": v["snippet"].get("description", ""),
                    "published": v["snippet"]["publishedAt"],
                    "tags": v["snippet"].get("tags", []),
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                    "duration": v["contentDetails"]["duration"],
                }
            )
    return videos


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
    words = Counter()
    for v in videos:
        tokens = re.findall(r"[a-z]{3,}", v["title"].lower())
        words.update(t for t in tokens if t not in STOP_WORDS)
        words.update(t.lower() for t in v["tags"] if t.lower() not in STOP_WORDS)
    return words.most_common(top_n)


def detect_patterns(videos: list[dict]) -> dict:
    """Detect content patterns: upload cadence, avg length, engagement."""
    if not videos:
        return {}

    dates = sorted(
        datetime.fromisoformat(v["published"].replace("Z", "+00:00")) for v in videos
    )
    if len(dates) > 1:
        gaps = [(dates[i + 1] - dates[i]).days for i in range(len(dates) - 1)]
        avg_gap = sum(gaps) / len(gaps)
    else:
        avg_gap = 0

    def parse_duration(iso: str) -> int:
        m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
        if not m:
            return 0
        h, mn, s = (int(x) if x else 0 for x in m.groups())
        return h * 3600 + mn * 60 + s

    durations = [parse_duration(v["duration"]) for v in videos]
    avg_dur = sum(durations) / len(durations) if durations else 0
    avg_views = sum(v["views"] for v in videos) / len(videos)
    avg_likes = sum(v["likes"] for v in videos) / len(videos)
    avg_comments = sum(v["comments"] for v in videos) / len(videos)

    # Day-of-week distribution
    day_counts = Counter(
        datetime.fromisoformat(v["published"].replace("Z", "+00:00")).strftime("%A")
        for v in videos
    )

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
def generate_viral_opportunities(keywords: list[tuple[str, int]], patterns: dict, channel_title: str) -> list[dict]:
    """Generate 5 untapped viral topic ideas based on keyword gaps and trends."""
    top_words = [w for w, _ in keywords[:15]]

    # Combine popular keywords into fresh angles
    combos = []
    for i in range(min(len(top_words), 10)):
        for j in range(i + 1, min(len(top_words), 10)):
            combos.append((top_words[i], top_words[j]))

    templates = [
        {
            "angle": "Contrarian Take",
            "template": "Why Everything You Know About {kw1} Is Wrong",
            "hook": "Most people believe {kw1} works like this… but what if I told you the opposite is true?",
        },
        {
            "angle": "Beginner Magnet",
            "template": "{kw1} for Complete Beginners — Zero to Hero in One Video",
            "hook": "If you've ever felt overwhelmed by {kw1}, this video will change everything.",
        },
        {
            "angle": "Listicle / Ranking",
            "template": "Top 10 {kw1} Mistakes That Are Killing Your {kw2}",
            "hook": "I've reviewed hundreds of channels and these {kw1} mistakes come up every single time.",
        },
        {
            "angle": "Trend-Jacking",
            "template": "The {kw1} Trend Nobody Is Talking About in {year}",
            "hook": "There's a massive shift happening in {kw1} right now and most creators are completely missing it.",
        },
        {
            "angle": "Challenge / Experiment",
            "template": "I Tried {kw1} for 30 Days — Here's What Happened",
            "hook": "Day 1: I had no idea what I was getting into. Day 30: everything changed.",
        },
    ]

    year = datetime.now().year
    opportunities = []
    for idx, tmpl in enumerate(templates):
        kw1 = top_words[idx % len(top_words)] if top_words else "this topic"
        kw2 = top_words[(idx + 3) % len(top_words)] if len(top_words) > 3 else "results"
        opportunities.append(
            {
                "angle": tmpl["angle"],
                "title": tmpl["template"].format(kw1=kw1.title(), kw2=kw2.title(), year=year),
                "hook": tmpl["hook"].format(kw1=kw1, kw2=kw2, year=year),
            }
        )
    return opportunities


def build_report(
    channel_title: str,
    channel_id: str,
    videos: list[dict],
    patterns: dict,
    keywords: list[tuple[str, int]],
    opportunities: list[dict],
) -> str:
    """Build the full markdown report."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    top = find_top_videos(videos)

    lines = []
    w = lines.append

    # Header
    w(f"# 📡 YouTube Radar Report — {channel_title}")
    w(f"_Generated {now}_\n")
    w(f"🔗 [Channel Link](https://youtube.com/channel/{channel_id})\n")

    # ── Executive Summary ──
    w("---")
    w("## 📋 Executive Summary\n")
    w(f"| Metric | Value |")
    w(f"|--------|-------|")
    w(f"| 🎬 Videos analysed | **{patterns['total_videos_analysed']}** |")
    w(f"| 👁️ Avg views | **{fmt_number(patterns['avg_views'])}** |")
    w(f"| 👍 Avg likes | **{fmt_number(patterns['avg_likes'])}** |")
    w(f"| 💬 Avg comments | **{fmt_number(patterns['avg_comments'])}** |")
    w(f"| 📅 Upload frequency | **~every {patterns['avg_upload_gap_days']} days** |")
    w(f"| ⏱️ Avg duration | **{patterns['avg_duration_min']} min** |")
    fav_days = ", ".join(f"{d} ({c})" for d, c in patterns["top_upload_days"])
    w(f"| 📆 Favourite upload days | {fav_days} |")
    w("")

    # ── Top Recent Videos ──
    w("---")
    w("## 🏆 Top Recent Videos\n")
    w("| # | Title | Views | Likes | Comments |")
    w("|---|-------|------:|------:|---------:|")
    for i, v in enumerate(top, 1):
        title_link = f"[{v['title']}](https://youtu.be/{v['id']})"
        w(f"| {i} | {title_link} | {fmt_number(v['views'])} | {fmt_number(v['likes'])} | {fmt_number(v['comments'])} |")
    w("")

    # ── Themes & Keywords ──
    w("---")
    w("## 🔑 Recurring Themes & Keywords\n")
    w("| Keyword | Frequency |")
    w("|---------|----------:|")
    for kw, count in keywords[:15]:
        bar = "█" * min(count, 30)
        w(f"| **{kw}** | {count}  {bar} |")
    w("")

    # ── Content Patterns ──
    w("---")
    w("## 🔍 Content Pattern Analysis\n")
    if patterns["avg_duration_min"] < 8:
        w("- 🎯 **Format**: Primarily short-form / quick-hit videos")
    elif patterns["avg_duration_min"] < 20:
        w("- 🎯 **Format**: Mid-length content — great for depth + retention")
    else:
        w("- 🎯 **Format**: Long-form deep-dives")

    if patterns["avg_upload_gap_days"] <= 2:
        w("- 📅 **Cadence**: High-frequency publisher (daily or near-daily)")
    elif patterns["avg_upload_gap_days"] <= 7:
        w("- 📅 **Cadence**: Weekly publisher")
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

    # Top performing title patterns
    w("\n**🏷️ Title Patterns in Top Performers:**")
    title_patterns = {
        "question": 0,
        "number/list": 0,
        "how-to": 0,
        "caps emphasis": 0,
    }
    for v in top:
        t = v["title"]
        if "?" in t:
            title_patterns["question"] += 1
        if re.search(r"\d+", t):
            title_patterns["number/list"] += 1
        if re.search(r"(?i)how\s+to", t):
            title_patterns["how-to"] += 1
        if re.search(r"[A-Z]{3,}", t):
            title_patterns["caps emphasis"] += 1
    for pat, cnt in sorted(title_patterns.items(), key=lambda x: -x[1]):
        if cnt > 0:
            w(f"- {pat.title()}: used in **{cnt}/{len(top)}** top videos")
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
        "\"Stop scrolling — this one thing will change how you think about {kw}.\"",
        "\"In the next 60 seconds, I'll show you something about {kw} that took me years to figure out.\"",
        "\"I tested every {kw} strategy out there. Only ONE actually worked.\"",
        "\"If you're still doing {kw} like this… you're leaving views on the table.\"",
        "\"Nobody is talking about this {kw} hack. And honestly, they should be.\"",
        "\"I was wrong about {kw}. Here's what I wish I knew sooner.\"",
    ]
    kw_sample = keywords[0][0] if keywords else "this topic"
    for hook in hooks:
        w(f"- {hook.format(kw=kw_sample)}")
    w("")

    w("---")
    w(f"_📡 Report generated by YouTube Radar  •  {now}_")
    return "\n".join(lines)


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


# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="📡 YouTube Radar — Channel Intelligence Report Generator"
    )
    parser.add_argument(
        "channel",
        help="YouTube channel name, @handle, or URL (e.g. '@mkbhd', 'https://youtube.com/@mkbhd')",
    )
    parser.add_argument(
        "-o", "--output",
        help="Output file path (default: <channel>_radar.md)",
    )
    parser.add_argument(
        "-n", "--num-videos",
        type=int,
        default=MAX_VIDEOS,
        help=f"Number of recent videos to analyse (default: {MAX_VIDEOS})",
    )
    args = parser.parse_args()

    api_key = get_api_key()
    youtube = build("youtube", "v3", developerKey=api_key)

    print("📡 YouTube Radar starting up…\n")

    # Resolve channel
    print(f"🔎 Resolving channel: {args.channel}")
    channel_id, channel_title = resolve_channel_id(youtube, args.channel)
    print(f"✅ Found: {channel_title}  (ID: {channel_id})\n")

    # Fetch videos
    print(f"📥 Fetching last {args.num_videos} videos…")
    videos = fetch_recent_videos(youtube, channel_id, args.num_videos)
    print(f"✅ Got {len(videos)} videos\n")

    if not videos:
        print("⚠️  No videos found. The channel may be empty.")
        sys.exit(0)

    # Analyse
    print("🧠 Analysing patterns & themes…")
    patterns = detect_patterns(videos)
    keywords = extract_keywords(videos)
    opportunities = generate_viral_opportunities(keywords, patterns, channel_title)

    # Build report
    report = build_report(channel_title, channel_id, videos, patterns, keywords, opportunities)

    # Write output
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
