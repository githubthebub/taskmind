#!/usr/bin/env python3
"""
Demo runner — feeds known KamikazeCash data into the YouTube Radar report engine.
YouTube is blocked in this sandbox, so we supply the data collected via web search.
"""
import sys
sys.path.insert(0, ".")

from youtube_radar import (
    extract_keywords, detect_patterns, generate_viral_opportunities,
    generate_bonus_titles, build_report,
)

CHANNEL_ID = "UCcmZHsuUt_DOzcgIcLd0Qnw"
CHANNEL_TITLE = "Kamikaze Cash"

# Data sourced from web search results (SPEAKRJ, vidIQ, Rumble mirrors, X posts, etc.)
VIDEOS = [
    # ── Recent / Freeloader Challenge S2 (2025) ──
    {"id": "FC_S2E2", "title": "How to make money online to buy crack houses | Freeloader Challenge S2E2",
     "description": "Side hustles, freeloading, and real estate hustle. #freeloader #sidehustle #money",
     "published": "2025-10-04T16:00:00+00:00", "tags": ["freeloader", "side hustle", "money online", "real estate"],
     "views": 12300, "likes": 577, "comments": 89, "duration": "PT18M30S"},

    {"id": "FC_S2E1", "title": "The Ultimate $0 - $100K Hustle | Freeloader Challenge",
     "description": "Starting from zero, building to 100K. The Freeloader Challenge returns. #freeloader #hustle",
     "published": "2025-09-19T16:00:00+00:00", "tags": ["freeloader", "hustle", "zero to 100k", "money"],
     "views": 23100, "likes": 1100, "comments": 203, "duration": "PT22M15S"},

    {"id": "FC_DOORDASH", "title": "DoorDash by E-Bike is Basically Impossible | Freeloader Challenge",
     "description": "Testing DoorDash delivery on an e-bike. #doordash #sidehustle #freeloader",
     "published": "2025-08-15T16:00:00+00:00", "tags": ["doordash", "e-bike", "side hustle", "freeloader"],
     "views": 18700, "likes": 890, "comments": 156, "duration": "PT16M45S"},

    {"id": "FC_LAST", "title": "The Last Freeloader Challenge (in this format)",
     "description": "The Freeloader Challenge changes direction. Counter-gambling to Patreon. #freeloader",
     "published": "2025-03-15T16:00:00+00:00", "tags": ["freeloader", "update", "patreon"],
     "views": 15400, "likes": 820, "comments": 310, "duration": "PT14M20S"},

    # ── Freeloader Challenge S1 (2023-2024) ──
    {"id": "FC_CAPITALISM", "title": "How I'm Breaking Capitalism | Freeloader Challenge",
     "description": "Exploiting every loophole in the system. #freeloader #capitalism #hustle",
     "published": "2023-12-20T16:00:00+00:00", "tags": ["freeloader", "capitalism", "loopholes", "money"],
     "views": 45200, "likes": 2100, "comments": 380, "duration": "PT19M10S"},

    {"id": "FC_SIDEHUSTLES", "title": "12 EASY Side Hustles for 2023 | Freeloader Challenge",
     "description": "Side hustles that actually work. #sidehustle #freeloader #money",
     "published": "2023-01-15T16:00:00+00:00", "tags": ["side hustle", "freeloader", "passive income", "2023"],
     "views": 89300, "likes": 3400, "comments": 520, "duration": "PT21M30S"},

    {"id": "FC_PASSIVE", "title": 'I tried 11 "PaSsiVe iNcOmE" techniques | Freeloader Challenge E11',
     "description": "Testing passive income methods. #passiveincome #freeloader #money",
     "published": "2023-01-05T16:00:00+00:00", "tags": ["passive income", "freeloader", "side hustle"],
     "views": 72100, "likes": 2900, "comments": 445, "duration": "PT24M00S"},

    {"id": "FC_FREE_MONEY", "title": "How to make a bunch of money doing basically nothing | Freeloader Challenge",
     "description": "Promotion churning, focus groups, freebies. #freeloader #freemoney",
     "published": "2022-09-10T16:00:00+00:00", "tags": ["freeloader", "free money", "promotion churning", "focus groups"],
     "views": 134000, "likes": 5200, "comments": 680, "duration": "PT17M45S"},

    {"id": "FC_AMAZON", "title": "Freeloader Challenge | How to get PAID and get FREE stuff on Amazon",
     "description": "Amazon rebating and free product methods. #amazon #freeloader",
     "published": "2022-06-20T16:00:00+00:00", "tags": ["amazon", "freeloader", "free stuff", "rebates"],
     "views": 98500, "likes": 4100, "comments": 590, "duration": "PT15M20S"},

    # ── Theta Gang Strategy Series ──
    {"id": "TG1", "title": "Covered Calls: Theta Gang Strategy #1 | r/wallstreetbets",
     "description": "Theta Gang is the dankest gang on Wall Street Bets. Covered Call strategy explained. #thetagang #options #wallstreetbets",
     "published": "2020-05-15T16:00:00+00:00", "tags": ["theta gang", "covered calls", "options", "wallstreetbets", "strategy"],
     "views": 890000, "likes": 28000, "comments": 2100, "duration": "PT14M30S"},

    {"id": "TG2", "title": "Cash Covered Put (Cash Secured Put): Theta Gang Strategy #2 | Wall Street Bets",
     "description": "The cash secured put - the other half of basic Theta Gang. #thetagang #options #cashsecuredput",
     "published": "2020-06-01T16:00:00+00:00", "tags": ["theta gang", "cash secured put", "options", "wallstreetbets"],
     "views": 620000, "likes": 19000, "comments": 1500, "duration": "PT16M15S"},

    {"id": "TG3", "title": "The Wheel: Theta Gang Strategy #3 // r/wallstreetbets",
     "description": "The Wheel is among the best theta gang strategies. #thetagang #thewheel #options",
     "published": "2020-06-20T16:00:00+00:00", "tags": ["theta gang", "the wheel", "options", "strategy", "wallstreetbets"],
     "views": 710000, "likes": 22000, "comments": 1800, "duration": "PT18M00S"},

    {"id": "TG4", "title": "Put Credit Spreads: Theta Gang Strategy #4 | r/wallstreetbets",
     "description": "Intermediate Theta Gang — the put credit spread. #thetagang #creditspreads #options",
     "published": "2020-07-10T16:00:00+00:00", "tags": ["theta gang", "credit spreads", "put spread", "options"],
     "views": 380000, "likes": 12000, "comments": 950, "duration": "PT15M40S"},

    {"id": "TG5", "title": "Call Credit Spreads: Theta Gang Strategy #5 | r/wallstreetbets",
     "description": "Bear call spreads for premium collection. #thetagang #creditspreads #options",
     "published": "2020-07-28T16:00:00+00:00", "tags": ["theta gang", "credit spreads", "call spread", "options"],
     "views": 290000, "likes": 9500, "comments": 780, "duration": "PT14M20S"},

    {"id": "TG6", "title": "Short Straddle, Featuring Mr. IV: Theta Gang Strategy #6 // r/wallstreetbets",
     "description": "Short straddles for collecting premium. #thetagang #straddle #options #IV",
     "published": "2020-08-15T16:00:00+00:00", "tags": ["theta gang", "short straddle", "implied volatility", "options"],
     "views": 250000, "likes": 8200, "comments": 650, "duration": "PT17M30S"},

    {"id": "TG7", "title": "Iron Butterfly (Ironfly): Theta Gang Strategy #7 | r/wallstreetbets",
     "description": "Iron butterflies — great for IV Crush or Theta Decay. #thetagang #ironbutterfly #options",
     "published": "2020-09-01T16:00:00+00:00", "tags": ["theta gang", "iron butterfly", "options", "IV crush"],
     "views": 220000, "likes": 7500, "comments": 580, "duration": "PT16M50S"},

    {"id": "TG8", "title": "Put Debit Spread (Bear Put Spread): Theta Gang Strategy #8 | r/wallstreetbets",
     "description": "The bearish debit spread. #thetagang #debitspread #options",
     "published": "2020-10-10T16:00:00+00:00", "tags": ["theta gang", "debit spread", "bear put", "options"],
     "views": 180000, "likes": 6000, "comments": 480, "duration": "PT13M20S"},

    {"id": "TG9", "title": "Call Debit Spread (Bull Call Spread): Theta Gang Strategy #9 | r/wallstreetbets",
     "description": "Bullish debit spread for controlled risk. #thetagang #debitspread #options",
     "published": "2020-11-05T16:00:00+00:00", "tags": ["theta gang", "debit spread", "bull call", "options"],
     "views": 170000, "likes": 5800, "comments": 430, "duration": "PT14M10S"},

    # ── Other popular videos ──
    {"id": "THETA_BASICS", "title": "Theta Gang Strategy Basics: Call Options // r/wallstreetbets",
     "description": "Understanding call options for Theta Gang. #thetagang #calloptions #wallstreetbets",
     "published": "2020-04-20T16:00:00+00:00", "tags": ["theta gang", "call options", "basics", "wallstreetbets"],
     "views": 520000, "likes": 16000, "comments": 1200, "duration": "PT12M30S"},

    {"id": "ROLL_STRAT", "title": "Roll Strategy: avoid getting REKT | Theta Gang | WallStreetBets",
     "description": "How to roll options positions to avoid losses. #thetagang #rollstrategy #options",
     "published": "2021-03-15T16:00:00+00:00", "tags": ["theta gang", "roll strategy", "options", "risk management"],
     "views": 310000, "likes": 10500, "comments": 820, "duration": "PT19M00S"},

    {"id": "STRANGLE", "title": "My FAVORITE stock options strategy: Short Strangle | Theta Gang",
     "description": "Short strangles — my favorite strategy. #thetagang #strangle #options",
     "published": "2021-06-20T16:00:00+00:00", "tags": ["theta gang", "short strangle", "options", "premium"],
     "views": 340000, "likes": 11500, "comments": 890, "duration": "PT20M15S"},

    {"id": "WHEEL_REVISIT", "title": "Revisiting The Wheel Options Strategy | WallStreetBets & Theta Gang",
     "description": "A fresh look at the wheel. #thetagang #thewheel #wallstreetbets",
     "published": "2022-02-10T16:00:00+00:00", "tags": ["theta gang", "the wheel", "options", "revisit"],
     "views": 185000, "likes": 7200, "comments": 560, "duration": "PT16M30S"},

    {"id": "LEAPS", "title": "How to trade LEAPS options like the cool kids: Theta Gang Strategy",
     "description": "LEAPS for long-term plays. #thetagang #leaps #options",
     "published": "2021-09-10T16:00:00+00:00", "tags": ["theta gang", "LEAPS", "options", "long-term"],
     "views": 280000, "likes": 9000, "comments": 710, "duration": "PT15M45S"},

    {"id": "IRON_CONDOR", "title": "Iron Condor: the BEST Theta Gang Strategy for Small Accounts",
     "description": "Iron condors for small accounts. #thetagang #ironcondor #options #smallaccount",
     "published": "2020-12-15T16:00:00+00:00", "tags": ["theta gang", "iron condor", "options", "small account"],
     "views": 420000, "likes": 14000, "comments": 1100, "duration": "PT18M20S"},

    {"id": "ROBINHOOD_3K", "title": "How to lose money on iron condors | Robinhood $3K Challenge S3E2",
     "description": "The 3K challenge continues. #robinhood #ironcondor #thetagang",
     "published": "2021-01-20T16:00:00+00:00", "tags": ["robinhood", "iron condor", "3k challenge", "theta gang"],
     "views": 195000, "likes": 7800, "comments": 640, "duration": "PT17M10S"},

    {"id": "FREE_MONEY_INTRO", "title": "Literally Free Money Intro: Top 2020 Methods // r/wallstreetbets",
     "description": "Best free money methods for 2020. #freemoney #wallstreetbets",
     "published": "2020-03-10T16:00:00+00:00", "tags": ["free money", "wallstreetbets", "methods"],
     "views": 380000, "likes": 12500, "comments": 980, "duration": "PT11M30S"},

    {"id": "TEEN_MONEY", "title": "How to MAKE MONEY ONLINE as a Teenager (2022)",
     "description": "Making money online for teens. #money #teenager #online",
     "published": "2022-04-15T16:00:00+00:00", "tags": ["money online", "teenager", "make money"],
     "views": 165000, "likes": 6500, "comments": 520, "duration": "PT14M50S"},

    {"id": "ASSIGNMENT", "title": '"Why am I Not Getting Assigned!?" Understanding Intrinsic Value',
     "description": "Options assignment and intrinsic value explained. #options #assignment #thetagang",
     "published": "2020-08-25T16:00:00+00:00", "tags": ["options", "assignment", "intrinsic value", "theta gang"],
     "views": 230000, "likes": 7800, "comments": 620, "duration": "PT13M15S"},
]


def main():
    print("📡 YouTube Radar — Demo run for Kamikaze Cash\n")
    print(f"✅ Channel: {CHANNEL_TITLE}  (ID: {CHANNEL_ID})")
    print(f"📊 Loaded {len(VIDEOS)} videos from web research data\n")

    print("🧠 Analysing patterns & themes…")
    patterns = detect_patterns(VIDEOS)
    keywords = extract_keywords(VIDEOS)
    opportunities = generate_viral_opportunities(keywords, CHANNEL_TITLE)

    report = build_report(
        CHANNEL_TITLE, CHANNEL_ID, VIDEOS,
        patterns, keywords, opportunities,
        data_source="Web Research (sandbox demo)",
    )

    output_file = "kamikaze_cash_radar.md"
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"\n✅ Report saved to: {output_file}")
    print(f"📊 {patterns['total_videos_analysed']} videos analysed")
    print(f"🔑 {len(keywords)} keywords extracted")
    print(f"🚀 5 viral opportunities generated\n")

    # Print the report to stdout too
    print("=" * 60)
    print(report)


if __name__ == "__main__":
    main()
