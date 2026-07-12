# 🎬 ShortStack

**A featherweight Shorts editor.** Cut, caption, and export vertical clips for
YouTube Shorts — without iMovie eating your disk and RAM.

ShortStack is a single Python script that opens an editor in your browser.
There is nothing else to install except [ffmpeg](https://ffmpeg.org).

## Why not iMovie?

| | iMovie | ShortStack |
|---|---|---|
| Importing a clip | **copies it** into a library | edits it **in place** |
| Proxy / render files | gigabytes per project | none |
| RAM while editing | the whole app + engine | one browser tab |
| Export | full re-render every time | ffmpeg streaming (or **instant lossless cut**) |
| Project file size | huge library bundles | a few KB of JSON |

Your videos never get copied or converted just to be edited. Previews play the
original file directly; exports stream through ffmpeg frame-by-frame, so even a
30-minute source barely registers in Activity Monitor.

## Setup (one time)

1. **Install ffmpeg** — open Terminal and run:
   ```
   brew install ffmpeg
   ```
   (No Homebrew? Get it at [brew.sh](https://brew.sh) — one command, pasted in Terminal.)

2. **Get ShortStack** — click the green *Code* button on this page → *Download ZIP*
   (or `git clone` it), and unzip it somewhere handy.

## Run it

Double-click **`Start ShortStack.command`**
*(first time: right-click → Open, because macOS is suspicious of new apps)*

…or from Terminal:

```
python3 shortstack.py                # opens the editor in your browser
python3 shortstack.py clip.mp4       # opens straight into a video
```

Linux/Windows work too: `python3 shortstack.py` / `py shortstack.py`.

## Editing workflow

1. **Open a video** (📂) — browse to the raw footage they sent you.
2. **Play and cut**: hit <kbd>Space</kbd> to play, tap <kbd>S</kbd> at every cut
   point, then click the dead clips and press <kbd>⌫</kbd>. The waveform on the
   timeline makes silences easy to spot.
3. **Reframe**: in *Crop 9:16* mode, drag the preview to choose what stays in
   frame — per clip. Or use *Blur 9:16* for the fit-with-blurred-background look.
4. **Captions**: press <kbd>T</kbd> to drop text at the playhead; drag its block
   on the timeline to retime it.
5. **Speed / volume / music** in the side panel.
6. **Export** (⌘E): 1080×1920 H.264 — upload-ready for Shorts. The badge above
   the timeline tells you if you're inside the 3-minute Shorts limit.

### ⚡ Lossless quick cut

If all you did was trim the ends of one clip (no crop/text/speed), the export
dialog offers a lossless cut: no re-encode, zero quality loss, done in about a
second. Cuts snap to the nearest keyframe, so allow ~1–2 s of slack.

### Keyboard shortcuts

| Key | Action |
|---|---|
| <kbd>Space</kbd> | play / pause |
| <kbd>S</kbd> | split clip at playhead |
| <kbd>⌫</kbd> | delete selected clip / text |
| <kbd>←</kbd> <kbd>→</kbd> | step one frame (⇧ = 1 s) |
| <kbd>↑</kbd> <kbd>↓</kbd> | previous / next cut |
| <kbd>I</kbd> / <kbd>O</kbd> | trim clip start / end to playhead |
| <kbd>T</kbd> | add text at playhead |
| <kbd>M</kbd> | mute selected clip |
| <kbd>⌘Z</kbd> / <kbd>⇧⌘Z</kbd> | undo / redo |
| <kbd>⌘E</kbd> | export |

## Notes & limits

- **Formats**: anything your browser can play previews smoothly (MP4/MOV H.264 —
  which is what phones and screen recorders produce). HEVC previews work in
  Safari. Exports handle anything ffmpeg can read.
- **HDR footage** (iPhone HDR) is tone-mapped to standard colors on export when
  your ffmpeg has `zscale` (Homebrew's does).
- **Storage**: ShortStack keeps only tiny waveform/thumbnail caches
  (`~/Library/Caches/shortstack`, a few MB, auto-cleaned after 30 days).
- **Privacy**: the editor runs entirely on your machine, bound to `127.0.0.1`,
  guarded by a per-session token. Nothing is uploaded anywhere.
- Projects autosave in the browser; use 💾 *Save* to keep a `.json` you can
  reload later or move between machines (it references the source files by path).
