#!/usr/bin/env python3
"""taskmind — a task list that practices non-attachment.

Most task managers are built on craving: streaks, backlogs, red badges,
overdue guilt. taskmind is built on the opposite premises:

  * One thing at a time.   `now` shows a single task. There is no "next".
  * Non-attachment.        Tasks are released, not deleted. No guilt attaches.
  * Impermanence.          Old intentions fade on their own after 7 days.
  * Right intention.       Every task records *why*, not just *what*.
  * No metrics.            Nothing is counted, scored, or streaked.

Usage:
  taskmind add "water the plants" [--why "they are alive and in my care"]
  taskmind now               show the one present task
  taskmind done              complete the present task
  taskmind later             set the present task down; another surfaces
  taskmind release [n]       let go of a task without finishing it
  taskmind garden            view every intention still held
  taskmind sit [minutes]     a guided breathing pause (default 1 minute)
  taskmind path              the ideas this tool is built on
"""

import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone

FADE_AFTER = timedelta(days=7)

COMPLETIONS = [
    "It is done, and now it is gone.",
    "Finished. Let it go as easily as it arrived.",
    "Complete. The hand that carried it is empty again.",
    "Done. Notice: you are no lighter and no heavier.",
]

RELEASES = [
    "Released. Not everything planted needs to bloom.",
    "Let go. It was only ever a thought.",
    "Released without judgment. The garden has room again.",
    "Set down. Carrying it was optional all along.",
]

EMPTY = [
    "Nothing is held. This, too, is a state worth noticing.",
    "The garden is empty. Sit with that before planting more.",
    "No tasks. You are not behind; there is no behind.",
]


def store_path():
    home = os.environ.get("TASKMIND_HOME") or os.path.join(
        os.path.expanduser("~"), ".taskmind"
    )
    os.makedirs(home, exist_ok=True)
    return os.path.join(home, "garden.json")


def load():
    try:
        with open(store_path()) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"tasks": []}


def save(data):
    with open(store_path(), "w") as f:
        json.dump(data, f, indent=2)


def now_utc():
    return datetime.now(timezone.utc)


def parse_ts(ts):
    return datetime.fromisoformat(ts)


def fade_old_tasks(data):
    """Impermanence: intentions older than FADE_AFTER return to the soil."""
    kept, faded = [], []
    for t in data["tasks"]:
        if now_utc() - parse_ts(t["planted"]) > FADE_AFTER:
            faded.append(t)
        else:
            kept.append(t)
    data["tasks"] = kept
    return faded


def age_of(task):
    days = (now_utc() - parse_ts(task["planted"])).days
    if days == 0:
        return "planted today"
    if days == 1:
        return "planted yesterday"
    return f"planted {days} days ago"


def print_task(task, prefix="  "):
    print(f"{prefix}{task['what']}")
    if task.get("why"):
        print(f"{prefix}  why: {task['why']}")
    print(f"{prefix}  {age_of(task)}, fades in {fades_in(task)}")


def fades_in(task):
    left = FADE_AFTER - (now_utc() - parse_ts(task["planted"]))
    days = max(left.days, 0)
    return "less than a day" if days == 0 else f"{days} day{'s' if days != 1 else ''}"


def report_faded(faded):
    for t in faded:
        print(f"  ✧ '{t['what']}' faded quietly after seven days. "
              "If it still matters, it will return on its own.")
    if faded:
        print()


def cmd_add(args):
    if not args:
        print("What would you like to hold? Try: taskmind add \"one small thing\"")
        return 1
    why = None
    if "--why" in args:
        i = args.index("--why")
        why = " ".join(args[i + 1:]) or None
        args = args[:i]
    what = " ".join(args)
    data = load()
    report_faded(fade_old_tasks(data))
    data["tasks"].append({
        "what": what,
        "why": why,
        "planted": now_utc().isoformat(),
    })
    save(data)
    print(f"Planted: {what}")
    if not why:
        print("  (You may record an intention with --why. "
              "A task without a reason is worth questioning.)")
    return 0


def cmd_now(_args):
    data = load()
    report_faded(fade_old_tasks(data))
    save(data)
    if not data["tasks"]:
        print(random.choice(EMPTY))
        return 0
    print("The present task — there is only ever one:\n")
    print_task(data["tasks"][0])
    print("\nBegin when you have taken one full breath.")
    return 0


def cmd_done(_args):
    data = load()
    report_faded(fade_old_tasks(data))
    if not data["tasks"]:
        print(random.choice(EMPTY))
        return 0
    task = data["tasks"].pop(0)
    save(data)
    print(f"✓ {task['what']}")
    print(f"  {random.choice(COMPLETIONS)}")
    return 0


def cmd_later(_args):
    data = load()
    report_faded(fade_old_tasks(data))
    if len(data["tasks"]) < 2:
        save(data)
        if data["tasks"]:
            print("Only one thing is held. Setting it down leaves it where it is.")
            print_task(data["tasks"][0])
        else:
            print(random.choice(EMPTY))
        return 0
    task = data["tasks"].pop(0)
    data["tasks"].append(task)
    save(data)
    print(f"Set down without judgment: {task['what']}")
    print("\nWhat surfaces now:\n")
    print_task(data["tasks"][0])
    return 0


def cmd_release(args):
    data = load()
    report_faded(fade_old_tasks(data))
    if not data["tasks"]:
        save(data)
        print(random.choice(EMPTY))
        return 0
    index = 0
    if args:
        try:
            index = int(args[0]) - 1
        except ValueError:
            print("Give the number shown in the garden, e.g.: taskmind release 2")
            return 1
    if not 0 <= index < len(data["tasks"]):
        print("No task holds that number. See the garden: taskmind garden")
        return 1
    task = data["tasks"].pop(index)
    save(data)
    print(f"✧ {task['what']}")
    print(f"  {random.choice(RELEASES)}")
    return 0


def cmd_garden(_args):
    data = load()
    report_faded(fade_old_tasks(data))
    save(data)
    if not data["tasks"]:
        print(random.choice(EMPTY))
        return 0
    n = len(data["tasks"])
    print(f"The garden holds {n} intention{'s' if n != 1 else ''}:\n")
    for i, task in enumerate(data["tasks"], 1):
        marker = "●" if i == 1 else "○"
        print(f"  {marker} {i}. {task['what']}" +
              (f"  — {task['why']}" if task.get("why") else ""))
        print(f"       {age_of(task)}, fades in {fades_in(task)}")
    if n > 3:
        print(f"\nYou are holding {n} things. "
              "Consider whether each still deserves a place: taskmind release <n>")
    return 0


def cmd_sit(args):
    minutes = 1.0
    if args:
        try:
            minutes = float(args[0])
        except ValueError:
            print("Try: taskmind sit 2")
            return 1
    breaths = max(1, int(minutes * 60 / 16))  # one slow breath ~16 seconds
    print(f"Sitting for about {minutes:g} minute{'s' if minutes != 1 else ''}. "
          "Nothing else is required of you.\n")
    try:
        for i in range(breaths):
            print("  breathe in  ────", flush=True)
            time.sleep(4)
            print("  hold        ────", flush=True)
            time.sleep(4)
            print("  breathe out ────────", flush=True)
            time.sleep(8)
            if i < breaths - 1:
                print()
    except KeyboardInterrupt:
        print("\n\nThe sitting ended when it ended. That is fine.")
        return 0
    print("\nThe bell has rung. Carry the pause with you.")
    return 0


def cmd_path(_args):
    print(__doc__.split("Usage:")[0].rstrip())
    print("""
As the Dhammapada opens: "All that we are is the result of what we have
thought." A task list is a record of thought. Tend it the way you would
tend a mind — gently, and without gripping.""")
    return 0


COMMANDS = {
    "add": cmd_add,
    "now": cmd_now,
    "done": cmd_done,
    "later": cmd_later,
    "release": cmd_release,
    "garden": cmd_garden,
    "sit": cmd_sit,
    "path": cmd_path,
}


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if not argv or argv[0] in ("-h", "--help", "help"):
        print(__doc__.strip())
        return 0
    cmd, args = argv[0], argv[1:]
    if cmd not in COMMANDS:
        print(f"Unknown command '{cmd}'. The paths are: {', '.join(COMMANDS)}")
        return 1
    return COMMANDS[cmd](args)


if __name__ == "__main__":
    sys.exit(main())
