# taskmind

*A task list that practices non-attachment.*

Most task managers are built on craving — streaks to maintain, badges that
turn red, backlogs that only grow, the quiet guilt of the overdue. taskmind
is a to-do list built on the opposite premises, borrowed from a teacher who
never owned a calendar:

| Principle | How taskmind embodies it |
|---|---|
| **One thing at a time** | `now` shows a single task. There is no "up next". |
| **Non-attachment** | Tasks are *released*, not deleted. No judgment attaches. |
| **Impermanence** | Intentions older than seven days fade away on their own. |
| **Right intention** | Every task can record *why*, not just *what*. |
| **No craving** | Nothing is counted, scored, streaked, or gamified. |

## Install

No dependencies. Python 3.8+.

```sh
git clone https://github.com/githubthebub/taskmind && cd taskmind
alias taskmind='python3 '"$PWD"'/taskmind.py'
```

## Use

```sh
taskmind add "water the plants" --why "they are alive and in my care"
taskmind now          # the one present task — begin after one full breath
taskmind done         # complete it; it dissolves
taskmind later        # set it down without judgment; another surfaces
taskmind garden       # everything still held (and when each will fade)
taskmind release 2    # let go of a task without finishing it
taskmind sit 2        # a guided two-minute breathing pause
taskmind path         # the ideas this tool is built on
```

A session looks like this:

```
$ taskmind now
The present task — there is only ever one:

  water the plants
    why: they are alive and in my care
    planted today, fades in 7 days

Begin when you have taken one full breath.

$ taskmind done
✓ water the plants
  It is done, and now it is gone.
```

## What it deliberately does not have

Due dates, priorities, projects, tags, reminders, notifications, sync,
accounts, streaks, statistics, or an "overdue" state. If a task fades before
you do it and it still matters, it will return on its own — plant it again.

## Where things live

Tasks are stored as plain JSON in `~/.taskmind/garden.json` (override with
`$TASKMIND_HOME`). Your intentions are yours; they never leave your machine.

## Tests

```sh
python3 -m unittest -v
```

---

> "All that we are is the result of what we have thought."
> — Dhammapada, verse 1
