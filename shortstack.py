#!/usr/bin/env python3
"""
ShortStack — a featherweight Shorts editor.

Edit vertical clips for YouTube Shorts without iMovie: no media imports,
no library copies, no proxy/render files, tiny RAM footprint. Your source
videos are read in place and exports are done by ffmpeg, which streams
frames instead of loading the video into memory.

Usage:
    python3 shortstack.py [video-file] [--port 8765] [--no-browser]

Requires: Python 3.8+, ffmpeg + ffprobe on PATH (macOS: `brew install ffmpeg`).
"""

import json
import math
import mimetypes
import os
import platform
import re
import secrets
import shutil
import socket
import struct
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import webbrowser
from hashlib import sha1
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

APP_NAME = "ShortStack"
VERSION = "1.0.0"
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
TOKEN = secrets.token_hex(16)

VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mts", ".m2ts", ".3gp"}
AUDIO_EXTS = {".mp3", ".m4a", ".aac", ".wav", ".flac", ".ogg", ".opus"}

FFMPEG = shutil.which("ffmpeg")
FFPROBE = shutil.which("ffprobe")

# ---------------------------------------------------------------------------
# Cache dir (waveforms + thumbnails only — a few MB, cleaned after 30 days)
# ---------------------------------------------------------------------------

def cache_dir():
    if platform.system() == "Darwin":
        base = os.path.expanduser("~/Library/Caches")
    else:
        base = os.environ.get("XDG_CACHE_HOME", os.path.expanduser("~/.cache"))
    d = os.path.join(base, "shortstack")
    os.makedirs(d, exist_ok=True)
    return d

CACHE_DIR = cache_dir()

def clean_cache(max_age_days=30):
    cutoff = time.time() - max_age_days * 86400
    try:
        for name in os.listdir(CACHE_DIR):
            p = os.path.join(CACHE_DIR, name)
            try:
                if os.path.getmtime(p) < cutoff:
                    if os.path.isdir(p):
                        shutil.rmtree(p, ignore_errors=True)
                    else:
                        os.remove(p)
            except OSError:
                pass
    except OSError:
        pass

def cache_key(path):
    st = os.stat(path)
    return sha1(f"{path}|{st.st_mtime_ns}|{st.st_size}".encode()).hexdigest()[:24]

# ---------------------------------------------------------------------------
# ffprobe
# ---------------------------------------------------------------------------

_probe_cache = {}
_probe_lock = threading.Lock()
_filters_available = None

def ffmpeg_filters():
    """Set of available ffmpeg filter names (cached)."""
    global _filters_available
    if _filters_available is None:
        names = set()
        if FFMPEG:
            try:
                out = subprocess.run([FFMPEG, "-hide_banner", "-filters"],
                                     capture_output=True, text=True, timeout=20).stdout
                for line in out.splitlines():
                    m = re.match(r"\s*[TSC.]{3}\s+(\S+)\s", line)
                    if m:
                        names.add(m.group(1))
            except Exception:
                pass
        _filters_available = names
    return _filters_available

def parse_fps(rate):
    try:
        if "/" in rate:
            num, den = rate.split("/")
            num, den = float(num), float(den)
            return num / den if den else 0.0
        return float(rate)
    except (ValueError, ZeroDivisionError):
        return 0.0

def stream_rotation(stream):
    rot = 0
    try:
        rot = int(float(stream.get("tags", {}).get("rotate", 0)))
    except (ValueError, TypeError):
        pass
    for sd in stream.get("side_data_list", []) or []:
        if "rotation" in sd:
            try:
                rot = int(float(sd["rotation"]))
            except (ValueError, TypeError):
                pass
    return rot % 360

def probe(path):
    """Return a summary dict for a media file (cached by path+mtime)."""
    st = os.stat(path)
    key = (path, st.st_mtime_ns, st.st_size)
    with _probe_lock:
        if key in _probe_cache:
            return _probe_cache[key]
    if not FFPROBE:
        raise RuntimeError("ffprobe not found — install ffmpeg first")
    out = subprocess.run(
        [FFPROBE, "-v", "error", "-print_format", "json",
         "-show_format", "-show_streams", path],
        capture_output=True, text=True, timeout=60)
    if out.returncode != 0:
        raise RuntimeError((out.stderr or "ffprobe failed").strip().splitlines()[-1])
    data = json.loads(out.stdout)
    fmt = data.get("format", {})
    duration = float(fmt.get("duration") or 0)
    info = {
        "path": path,
        "name": os.path.basename(path),
        "size": st.st_size,
        "duration": duration,
        "container": fmt.get("format_name", ""),
        "video": None,
        "audio": None,
    }
    for s in data.get("streams", []):
        if s.get("codec_type") == "video" and info["video"] is None \
                and s.get("disposition", {}).get("attached_pic", 0) != 1:
            w, h = int(s.get("width") or 0), int(s.get("height") or 0)
            rot = stream_rotation(s)
            if rot in (90, 270):
                w, h = h, w
            fps = parse_fps(s.get("avg_frame_rate") or s.get("r_frame_rate") or "0")
            if not duration:
                duration = float(s.get("duration") or 0)
                info["duration"] = duration
            info["video"] = {
                "codec": s.get("codec_name", ""),
                "width": w, "height": h,
                "fps": round(fps, 3),
                "rotation": rot,
                "hdr": s.get("color_transfer") in ("smpte2084", "arib-std-b67"),
                "pix_fmt": s.get("pix_fmt", ""),
            }
        elif s.get("codec_type") == "audio" and info["audio"] is None:
            info["audio"] = {
                "codec": s.get("codec_name", ""),
                "channels": int(s.get("channels") or 0),
                "sample_rate": int(s.get("sample_rate") or 0),
            }
    with _probe_lock:
        _probe_cache[key] = info
    return info

# ---------------------------------------------------------------------------
# Waveform peaks (audio-only decode — fast and tiny)
# ---------------------------------------------------------------------------

WAVE_SR = 4000         # decode sample rate (keeps speech/music visible)
WAVE_PEAKS_PER_SEC = 25  # output resolution
_wave_lock = threading.Lock()

def waveform(path):
    cpath = os.path.join(CACHE_DIR, f"wave-{cache_key(path)}.json")
    if os.path.exists(cpath):
        with open(cpath) as f:
            return json.load(f)
    info = probe(path)
    if not info["audio"]:
        result = {"rate": WAVE_PEAKS_PER_SEC, "peaks": []}
    else:
        with _wave_lock:  # one decode at a time; they're quick
            out = subprocess.run(
                [FFMPEG, "-v", "error", "-i", path, "-map", "0:a:0",
                 "-ac", "1", "-ar", str(WAVE_SR), "-f", "s16le", "pipe:1"],
                capture_output=True, timeout=600)
        if out.returncode != 0 and not out.stdout:
            raise RuntimeError("couldn't decode audio for the waveform")
        raw = out.stdout
        n = len(raw) // 2
        samples_per_peak = WAVE_SR // WAVE_PEAKS_PER_SEC
        peaks = []
        for i in range(0, n, samples_per_peak):
            chunk = raw[i * 2:(i + samples_per_peak) * 2]
            if not chunk:
                break
            vals = struct.unpack(f"<{len(chunk)//2}h", chunk)
            peak = max(abs(v) for v in vals) / 32768.0
            peaks.append(round(peak * 100))
        result = {"rate": WAVE_PEAKS_PER_SEC, "peaks": peaks}
        if out.returncode != 0:
            return result  # partial decode — usable, but don't cache it
    tmp = f"{cpath}.{os.getpid()}.{threading.get_ident()}.tmp"
    try:
        with open(tmp, "w") as f:
            json.dump(result, f)
        os.replace(tmp, cpath)
    except OSError:
        pass
    return result

# ---------------------------------------------------------------------------
# Thumbnails (seek-based, generated in a background thread, cached)
# ---------------------------------------------------------------------------

THUMB_HEIGHT = 108
_thumb_jobs = {}
_thumb_lock = threading.Lock()

def thumb_dir(path):
    return os.path.join(CACHE_DIR, f"thumbs-{cache_key(path)}")

def thumb_plan(duration):
    """How many thumbnails and at what interval for a given duration."""
    if duration <= 0:
        return 0, 0
    count = max(10, min(120, int(duration / 2)))
    return count, duration / count

def start_thumbs(path):
    info = probe(path)
    if not info["video"]:
        return {"count": 0, "done": 0, "interval": 0}
    count, interval = thumb_plan(info["duration"])
    tdir = thumb_dir(path)
    os.makedirs(tdir, exist_ok=True)
    done_marker = os.path.join(tdir, "done")
    existing = len([f for f in os.listdir(tdir) if f.endswith(".jpg")])
    if os.path.exists(done_marker):
        return {"count": count, "done": existing, "interval": interval}
    with _thumb_lock:
        if path not in _thumb_jobs:
            t = threading.Thread(target=_gen_thumbs,
                                 args=(path, tdir, count, interval), daemon=True)
            _thumb_jobs[path] = t
            t.start()
    return {"count": count, "done": existing, "interval": interval}

def _gen_thumbs(path, tdir, count, interval):
    try:
        for i in range(count):
            out = os.path.join(tdir, f"{i:04d}.jpg")
            try:
                if os.path.exists(out) and os.path.getsize(out) > 0:
                    continue
                t = i * interval + interval / 2
                subprocess.run(
                    [FFMPEG, "-v", "error", "-ss", f"{t:.3f}", "-i", path,
                     "-frames:v", "1", "-vf", f"scale=-2:{THUMB_HEIGHT}",
                     "-q:v", "6", "-y", out],
                    capture_output=True, timeout=60)
                if os.path.exists(out) and os.path.getsize(out) == 0:
                    os.remove(out)  # failed/killed run left an empty file
            except (subprocess.TimeoutExpired, OSError):
                continue
        with open(os.path.join(tdir, "done"), "w") as f:
            f.write("ok")
    except Exception:
        pass
    finally:
        with _thumb_lock:
            _thumb_jobs.pop(path, None)

# ---------------------------------------------------------------------------
# Fonts for drawtext
# ---------------------------------------------------------------------------

FONT_CANDIDATES = {
    "bold": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf",
    ],
    "regular": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/TTF/DejaVuSans.ttf",
        "C:\\Windows\\Fonts\\arial.ttf",
    ],
}

def find_font(weight):
    for p in FONT_CANDIDATES.get(weight, []) + FONT_CANDIDATES["regular"]:
        if os.path.exists(p):
            return p
    return None

# ---------------------------------------------------------------------------
# Export command builder
# ---------------------------------------------------------------------------

def esc_filter(v):
    """Escape a value used inside a filtergraph option.

    ffmpeg parses filter args twice: the graph parser strips one level of
    escaping, then the option parser splits on ':'. So special characters
    need two levels of backslash-escaping (see "filtergraph escaping" in
    the ffmpeg docs). Quoting alone is not enough — a ':' in e.g. a Windows
    path (C:\\...) would still split the option value.
    """
    s = str(v)
    s = s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'")
    return "".join("\\" + c if c in "\\'[],;" else c for c in s)

def wrap_text(text, fontsize, width):
    """Word-wrap overlay text so drawtext matches the preview (which wraps).

    Uses a rough average glyph width; the JS preview mirrors the same
    numbers so editor and export agree closely.
    """
    import textwrap
    max_chars = max(4, int((width * 0.92) / (fontsize * 0.52)))
    lines = []
    for raw in text.split("\n"):
        lines.extend(textwrap.wrap(raw, max_chars,
                                   break_long_words=True) or [""])
    return "\n".join(lines)

_drawtext_align = None

def drawtext_supports_align():
    global _drawtext_align
    if _drawtext_align is None:
        _drawtext_align = False
        if FFMPEG:
            try:
                out = subprocess.run([FFMPEG, "-hide_banner", "-h",
                                      "filter=drawtext"],
                                     capture_output=True, text=True,
                                     timeout=20).stdout
                _drawtext_align = "text_align" in out
            except Exception:
                pass
    return _drawtext_align

def hex_color(c, default="#FFFFFF"):
    m = re.fullmatch(r"#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?", str(c or default))
    if not m:
        m = re.fullmatch(r"#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?", default)
    rgb, alpha = m.group(1), m.group(2)
    out = "0x" + rgb.upper()
    if alpha:
        out += f"@{int(alpha, 16) / 255:.3f}"
    return out

def clampf(v, lo, hi, default):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return default
    if not math.isfinite(v):
        return default
    return max(lo, min(hi, v))

def atempo_chain(speed):
    """atempo only accepts 0.5–2.0 per instance; chain for wider ranges."""
    factors = []
    f = speed
    while f > 2.0:
        factors.append(2.0)
        f /= 2.0
    while f < 0.5:
        factors.append(0.5)
        f /= 0.5
    factors.append(f)
    return ",".join(f"atempo={x:.6f}" for x in factors)

def validate_project(project):
    segs = project.get("segments") or []
    if not segs:
        raise ValueError("Project has no clips")
    if len(segs) > 200:
        raise ValueError("Too many segments (max 200)")
    for s in segs:
        path = s.get("file", "")
        if not os.path.isfile(path):
            raise ValueError(f"File not found: {path}")
        info = probe(path)
        if not info["video"]:
            raise ValueError(f"No video stream in {os.path.basename(path)}")
        t_in = clampf(s.get("in"), 0, info["duration"], None)
        t_out = clampf(s.get("out"), 0, info["duration"] + 0.5, None)
        if t_in is None or t_out is None or t_out - t_in < 0.04:
            raise ValueError(f"Bad in/out points on a clip from {info['name']}")
        s["in"], s["out"] = t_in, t_out
        s["speed"] = clampf(s.get("speed", 1), 0.25, 4.0, 1.0)
        s["volume"] = 0.0 if s.get("muted") else clampf(s.get("volume", 1), 0, 3.0, 1.0)
        crop = s.get("crop") or {}
        s["crop"] = {"cx": clampf(crop.get("cx", 0.5), 0, 1, 0.5),
                     "cy": clampf(crop.get("cy", 0.5), 0, 1, 0.5)}
    music = project.get("music")
    if music and music.get("file"):
        if not os.path.isfile(music["file"]):
            raise ValueError(f"Music file not found: {music['file']}")
        music["volume"] = clampf(music.get("volume", 0.2), 0, 2.0, 0.2)
    else:
        project["music"] = None
    for t in project.get("texts") or []:
        t["text"] = str(t.get("text", ""))[:500]
        t["start"] = clampf(t.get("start", 0), 0, 36000, 0)
        t["end"] = clampf(t.get("end", 1), 0, 36000, 1)
        t["y"] = clampf(t.get("y", 0.8), 0, 1, 0.8)
        t["size"] = clampf(t.get("size", 6), 1, 25, 6)
    return project

def output_duration(project):
    return sum((s["out"] - s["in"]) / s["speed"] for s in project["segments"])

def even(n):
    n = int(round(n))
    return n if n % 2 == 0 else n + 1

def build_export_cmd(project, output, tmpdir):
    """Build the full ffmpeg argv for an export. Returns (cmd, total_out_duration)."""
    segs = project["segments"]
    mode = (project.get("frame") or {}).get("mode", "fill")
    texts = project.get("texts") or []
    music = project.get("music")

    first = probe(segs[0]["file"])
    if mode == "original":
        W = even(first["video"]["width"])
        H = even(first["video"]["height"])
    else:
        W = even(clampf(output.get("width", 1080), 240, 3840, 1080))
        H = even(clampf(output.get("height", 1920), 240, 3840, 1920))

    fps = clampf(output.get("fps", 0), 0, 120, 0)
    if not fps:
        fps = max((probe(s["file"])["video"]["fps"] or 30 for s in segs), default=30)
        fps = max(24, min(60, fps))

    crf = int(clampf(output.get("crf", 20), 14, 32, 20))
    preset = output.get("preset", "medium")
    if preset not in ("ultrafast", "veryfast", "fast", "medium", "slow"):
        preset = "medium"

    have_zscale = "zscale" in ffmpeg_filters() and "tonemap" in ffmpeg_filters()
    aspect = W / H

    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-nostats"]
    filters = []
    total = 0.0

    for i, s in enumerate(segs):
        info = probe(s["file"])
        dur_in = s["out"] - s["in"]
        dur_out = dur_in / s["speed"]
        total += dur_out
        cmd += ["-ss", f"{s['in']:.4f}", "-t", f"{dur_in:.4f}", "-i", s["file"]]

        # --- video chain -------------------------------------------------
        v = f"[{i}:v]setpts=(PTS-STARTPTS)/{s['speed']:.6f}"
        if info["video"]["hdr"] and have_zscale:
            v += (",zscale=transfer=linear:npl=100,format=gbrpf32le"
                  ",zscale=primaries=bt709,tonemap=tonemap=hable:desat=0"
                  ",zscale=transfer=bt709:matrix=bt709:range=tv")
        if mode == "fill":
            cx, cy = s["crop"]["cx"], s["crop"]["cy"]
            a = f"{aspect:.8f}"
            v += (f",crop='min(iw,ih*{a})':'min(ih,iw/{a})'"
                  f":'(iw-ow)*{cx:.4f}':'(ih-oh)*{cy:.4f}'"
                  f",scale={W}:{H}")
        elif mode == "blur":
            v += (f",split=2[bg{i}][fg{i}];"
                  f"[bg{i}]scale={W}:{H}:force_original_aspect_ratio=increase"
                  f",crop={W}:{H},boxblur=luma_radius=24:luma_power=2"
                  f":chroma_radius=12:chroma_power=2[bgb{i}];"
                  f"[fg{i}]scale={W}:{H}:force_original_aspect_ratio=decrease[fgs{i}];"
                  f"[bgb{i}][fgs{i}]overlay=(W-w)/2:(H-h)/2")
        else:  # original
            v += f",scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2"
        v += f",fps={fps:.4f},format=yuv420p,setsar=1[v{i}]"
        filters.append(v)

        # --- audio chain -------------------------------------------------
        if info["audio"]:
            a_chain = (f"[{i}:a]asetpts=PTS-STARTPTS,{atempo_chain(s['speed'])}"
                       f",volume={s['volume']:.4f}"
                       f",aformat=sample_fmts=fltp:sample_rates=48000"
                       f":channel_layouts=stereo,apad=whole_dur={dur_out:.4f}"
                       f",atrim=end={dur_out:.4f}[a{i}]")
        else:
            a_chain = (f"anullsrc=channel_layout=stereo:sample_rate=48000"
                       f",atrim=end={dur_out:.4f},asetpts=PTS-STARTPTS[a{i}]")
        filters.append(a_chain)

    pairs = "".join(f"[v{i}][a{i}]" for i in range(len(segs)))
    filters.append(f"{pairs}concat=n={len(segs)}:v=1:a=1[vcat][acat]")

    vlabel = "[vcat]"
    if texts:
        draw = []
        for j, t in enumerate(texts):
            if not t["text"].strip() or t["end"] <= t["start"]:
                continue
            font = find_font("bold" if t.get("font", "bold") == "bold" else "regular")
            size = max(8, int(t["size"] / 100 * H))
            tf = os.path.join(tmpdir, f"text{j}.txt")
            with open(tf, "w", encoding="utf-8") as f:
                f.write(wrap_text(t["text"], size, W))
            opts = [
                f"textfile={esc_filter(tf)}",
                "expansion=none",
                f"fontsize={size}",
                f"fontcolor={hex_color(t.get('color'), '#FFFFFF')}",
                "x=(w-text_w)/2",
                f"y=(h-text_h)*{t['y']:.4f}",
                f"enable='between(t,{t['start']:.3f},{t['end']:.3f})'",
            ]
            if drawtext_supports_align():
                opts.append("text_align=center")
            if font:
                opts.append(f"fontfile={esc_filter(font)}")
            if t.get("outline", True):
                opts.append(f"borderw={max(2, size // 14)}")
                opts.append("bordercolor=black")
            if t.get("box"):
                opts.append("box=1")
                opts.append(f"boxcolor={hex_color(t.get('boxColor'), '#000000AA')}")
                opts.append(f"boxborderw={max(4, size // 3)}")
            draw.append("drawtext=" + ":".join(opts))
        if draw:
            filters.append("[vcat]" + ",".join(draw) + "[vtxt]")
            vlabel = "[vtxt]"

    alabel = "[acat]"
    if music:
        midx = len(segs)
        cmd += ["-stream_loop", "-1", "-i", music["file"]]
        filters.append(
            f"[{midx}:a]aformat=sample_fmts=fltp:sample_rates=48000"
            f":channel_layouts=stereo,volume={music['volume']:.4f}[mus]")
        filters.append(
            f"[acat][mus]amix=inputs=2:duration=first"
            f":dropout_transition=0:normalize=0[amix]")
        alabel = "[amix]"

    cmd += ["-filter_complex", ";".join(filters),
            "-map", vlabel, "-map", alabel,
            "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
            "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-movflags", "+faststart",
            "-y", output["path"]]
    return cmd, total

def build_lossless_cmd(project, output):
    s = project["segments"][0]
    dur = s["out"] - s["in"]
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-nostats",
           "-ss", f"{s['in']:.4f}", "-t", f"{dur:.4f}", "-i", s["file"],
           "-map", "0:v:0", "-map", "0:a:0?",
           "-c", "copy", "-avoid_negative_ts", "make_zero",
           "-movflags", "+faststart", "-y", output["path"]]
    return cmd, dur

MP4_VIDEO_CODECS = {"h264", "hevc", "av1", "mpeg4"}
MP4_AUDIO_CODECS = {"aac", "mp3", "ac3", "eac3", "alac"}

def lossless_eligible(project):
    segs = project.get("segments") or []
    if len(segs) != 1:
        return False
    s = segs[0]
    if s.get("speed", 1) != 1 or s.get("muted") or s.get("volume", 1) != 1:
        return False
    if (project.get("frame") or {}).get("mode", "fill") != "original":
        return False
    if project.get("texts") or project.get("music"):
        return False
    try:  # the source codecs must be remuxable into .mp4
        info = probe(s["file"])
    except Exception:
        return False
    if not info["video"] or info["video"]["codec"] not in MP4_VIDEO_CODECS:
        return False
    if info["audio"] and info["audio"]["codec"] not in MP4_AUDIO_CODECS:
        return False
    return True

# ---------------------------------------------------------------------------
# Export jobs
# ---------------------------------------------------------------------------

JOBS = {}
_jobs_lock = threading.Lock()

class ExportJob:
    def __init__(self, project, output):
        self.id = secrets.token_hex(8)
        self.project = project
        self.output = output
        self.state = "queued"
        self.progress = 0.0
        self.error = ""
        self.started = time.time()
        self.total = 0.0
        self.proc = None
        self.tmpdir = tempfile.mkdtemp(prefix="shortstack-")
        self.out_size = 0
        self._lock = threading.Lock()

    def _transition(self, new):
        """Move to a new state unless already cancelled. Returns success."""
        with self._lock:
            if self.state == "cancelled":
                return False
            self.state = new
            return True

    def run(self):
        try:
            if self.output.get("lossless") and lossless_eligible(self.project):
                cmd, self.total = build_lossless_cmd(self.project, self.output)
            else:
                cmd, self.total = build_export_cmd(self.project, self.output,
                                                   self.tmpdir)
            cmd = cmd[:1] + ["-progress", "pipe:1"] + cmd[1:]
            if not self._transition("running"):
                return  # cancelled while queued
            self.proc = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            stderr_lines = []

            def drain_err(pipe):
                for line in pipe:
                    stderr_lines.append(line.rstrip())
                    if len(stderr_lines) > 80:
                        stderr_lines.pop(0)
            terr = threading.Thread(target=drain_err,
                                    args=(self.proc.stderr,), daemon=True)
            terr.start()
            for line in self.proc.stdout:
                line = line.strip()
                if line.startswith("out_time_us=") or line.startswith("out_time_ms="):
                    try:
                        us = max(0, int(line.split("=")[1]))
                        if self.total > 0:
                            self.progress = min(0.999, us / 1e6 / self.total)
                    except ValueError:
                        pass
                elif line == "progress=end":
                    self.progress = 1.0
            self.proc.wait()
            terr.join(timeout=5)
            if self.proc.returncode == 0 and self._transition("done"):
                self.progress = 1.0
                try:
                    self.out_size = os.path.getsize(self.output["path"])
                except OSError:
                    pass
            elif self.state == "cancelled":
                try:
                    os.remove(self.output["path"])
                except OSError:
                    pass
            elif self._transition("error"):
                self.error = "\n".join(stderr_lines[-12:]) or \
                    f"ffmpeg exited with code {self.proc.returncode}"
        except Exception as e:
            if self._transition("error"):
                self.error = str(e)
        finally:
            shutil.rmtree(self.tmpdir, ignore_errors=True)

    def cancel(self):
        with self._lock:
            if self.state not in ("queued", "running"):
                return
            self.state = "cancelled"
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()

    def status(self):
        eta = 0
        if self.state == "running" and 0 < self.progress < 1:
            elapsed = time.time() - self.started
            eta = elapsed / self.progress * (1 - self.progress)
        return {"id": self.id, "state": self.state,
                "progress": round(self.progress, 4),
                "eta": round(eta), "error": self.error,
                "outPath": self.output.get("path", ""),
                "outSize": self.out_size}

# ---------------------------------------------------------------------------
# HTTP handler
# ---------------------------------------------------------------------------

def is_media_file(name):
    return os.path.splitext(name)[1].lower() in (VIDEO_EXTS | AUDIO_EXTS)

def shortcuts():
    home = os.path.expanduser("~")
    out = [{"name": "Home", "path": home}]
    for name in ("Desktop", "Downloads", "Movies", "Videos", "Documents"):
        p = os.path.join(home, name)
        if os.path.isdir(p):
            out.append({"name": name, "path": p})
    if platform.system() == "Darwin" and os.path.isdir("/Volumes"):
        try:
            for v in sorted(os.listdir("/Volumes")):
                p = os.path.join("/Volumes", v)
                if os.path.isdir(p) and not v.startswith("."):
                    out.append({"name": f"💾 {v}", "path": p})
        except OSError:
            pass
    return out

def normalize_output_path(raw):
    """One canonical form for output paths so /api/exists and /api/export
    always agree (the overwrite confirmation must test the same path that
    the export will actually write)."""
    p = os.path.abspath(os.path.expanduser(str(raw or "")))
    if os.path.splitext(p)[1].lower() not in (".mp4", ".mov", ".m4v"):
        p += ".mp4"
    return p

def suggest_output_path(project):
    segs = project.get("segments") or []
    if not segs:
        return os.path.join(os.path.expanduser("~"), "short.mp4")
    src = segs[0]["file"]
    d = os.path.dirname(src)
    base = os.path.splitext(os.path.basename(src))[0]
    if not os.access(d, os.W_OK):
        d = os.path.expanduser("~")
    cand = os.path.join(d, f"{base}_short.mp4")
    n = 2
    while os.path.exists(cand):
        cand = os.path.join(d, f"{base}_short-{n}.mp4")
        n += 1
    return cand

OPEN_FILE = None  # set from CLI arg

class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    server_version = f"{APP_NAME}/{VERSION}"

    # --- plumbing ----------------------------------------------------------

    def log_message(self, fmt, *args):
        pass  # keep the terminal clean

    def send_json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def send_error_json(self, msg, code=400):
        self.send_json({"error": str(msg)}, code)

    def host_ok(self):
        host = (self.headers.get("Host") or "").split(":")[0].lower()
        return host in ("127.0.0.1", "localhost", "[::1]", "::1")

    def token_ok(self, q):
        tok = self.headers.get("X-Token") or (q.get("t", [""])[0])
        return secrets.compare_digest(tok, TOKEN)

    def parse(self):
        parsed = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(parsed.query)
        return parsed.path, q

    def read_body_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > 8_000_000:
            raise ValueError("Request too large")
        return json.loads(self.rfile.read(length) or b"{}")

    # --- static + media ----------------------------------------------------

    def serve_index(self):
        p = os.path.join(STATIC_DIR, "index.html")
        with open(p, "r", encoding="utf-8") as f:
            html = f.read()
        html = html.replace("{{TOKEN}}", TOKEN)
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def serve_static(self, rel):
        rel = os.path.normpath(rel).lstrip(os.sep + "/")
        p = os.path.join(STATIC_DIR, rel)
        if not os.path.abspath(p).startswith(os.path.abspath(STATIC_DIR)) \
                or not os.path.isfile(p):
            self.send_error_json("not found", 404)
            return
        ctype = mimetypes.guess_type(p)[0] or "application/octet-stream"
        with open(p, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def serve_media(self, path):
        """Stream a media file with Range support.

        Handles its own errors: after headers are sent we must never write
        a JSON error into the body — on failure we close the connection so
        HTTP framing stays intact.
        """
        if not os.path.isfile(path):
            self.send_error_json("file not found", 404)
            return
        size = os.path.getsize(path)
        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        rng = self.headers.get("Range")
        start, end = 0, size - 1
        code = 200
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            if m:
                if m.group(1):
                    start = int(m.group(1))
                    if m.group(2):
                        end = min(int(m.group(2)), size - 1)
                elif m.group(2):
                    start = max(0, size - int(m.group(2)))
                if start > end or start >= size:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{size}")
                    self.send_header("Content-Length", "0")
                    self.end_headers()
                    return
                code = 206
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Length", str(end - start + 1))
        if code == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        try:
            with open(path, "rb") as f:
                f.seek(start)
                remaining = end - start + 1
                while remaining > 0:
                    chunk = f.read(min(256 * 1024, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            if remaining > 0:  # short read — body incomplete, can't keep alive
                self.close_connection = True
        except OSError:
            # client aborted (normal for <video> seeks) or read failed
            self.close_connection = True

    # --- routing -----------------------------------------------------------

    def do_GET(self):
        if not self.host_ok():
            self.send_error_json("forbidden", 403)
            return
        path, q = self.parse()
        try:
            if path == "/":
                return self.serve_index()
            if path.startswith("/static/"):
                return self.serve_static(path[len("/static/"):])
            # everything below requires the session token
            if not self.token_ok(q):
                return self.send_error_json("bad token", 403)
            if path == "/media":
                return self.serve_media(q.get("path", [""])[0])
            if path == "/api/config":
                return self.send_json({
                    "app": APP_NAME, "version": VERSION,
                    "platform": platform.system(),
                    "home": os.path.expanduser("~"),
                    "sep": os.sep,
                    "ffmpeg": bool(FFMPEG and FFPROBE),
                    "shortcuts": shortcuts(),
                    "openFile": OPEN_FILE,
                })
            if path == "/api/browse":
                return self.api_browse(q)
            if path == "/api/probe":
                return self.send_json(probe(q.get("path", [""])[0]))
            if path == "/api/waveform":
                return self.send_json(waveform(q.get("path", [""])[0]))
            if path == "/api/thumbs":
                return self.send_json(start_thumbs(q.get("path", [""])[0]))
            if path == "/api/thumb":
                return self.api_thumb(q)
            if path == "/api/export/status":
                jid = q.get("id", [""])[0]
                with _jobs_lock:
                    job = JOBS.get(jid)
                if not job:
                    return self.send_error_json("no such job", 404)
                return self.send_json(job.status())
            self.send_error_json("not found", 404)
        except FileNotFoundError as e:
            self.send_error_json(f"file not found: {e}", 404)
        except Exception as e:
            self.send_error_json(e, 500)

    def do_POST(self):
        if not self.host_ok():
            self.send_error_json("forbidden", 403)
            return
        path, q = self.parse()
        try:
            # always drain the body first so keep-alive connections stay in sync
            body = self.read_body_json()
            if not self.token_ok(q):
                return self.send_error_json("bad token", 403)
            if path == "/api/export":
                return self.api_export(body)
            if path == "/api/export/cancel":
                jid = body.get("id", "")
                with _jobs_lock:
                    job = JOBS.get(jid)
                if job:
                    job.cancel()
                return self.send_json({"ok": True})
            if path == "/api/suggest_output":
                return self.send_json(
                    {"path": suggest_output_path(body.get("project") or {})})
            if path == "/api/exists":
                return self.send_json(
                    {"exists": os.path.exists(
                        normalize_output_path(body.get("path", "")))})
            if path == "/api/reveal":
                return self.api_reveal(body)
            self.send_error_json("not found", 404)
        except Exception as e:
            self.send_error_json(e, 500)

    # --- API impl ----------------------------------------------------------

    def api_browse(self, q):
        d = q.get("dir", [os.path.expanduser("~")])[0] or os.path.expanduser("~")
        d = os.path.abspath(os.path.expanduser(d))
        if not os.path.isdir(d):
            return self.send_error_json("not a directory", 404)
        kinds = q.get("kind", ["video"])[0]
        exts = {"video": VIDEO_EXTS, "audio": AUDIO_EXTS,
                "any": VIDEO_EXTS | AUDIO_EXTS, "dir": set()}.get(kinds, VIDEO_EXTS)
        dirs, files = [], []
        try:
            for entry in sorted(os.listdir(d), key=str.lower):
                if entry.startswith("."):
                    continue
                p = os.path.join(d, entry)
                try:
                    if os.path.isdir(p):
                        dirs.append({"name": entry, "path": p})
                    elif os.path.splitext(entry)[1].lower() in exts:
                        st = os.stat(p)
                        files.append({"name": entry, "path": p,
                                      "size": st.st_size, "mtime": st.st_mtime})
                except OSError:
                    continue
        except PermissionError:
            return self.send_error_json("permission denied", 403)
        parent = os.path.dirname(d) if os.path.dirname(d) != d else None
        self.send_json({"dir": d, "parent": parent, "dirs": dirs, "files": files})

    def api_thumb(self, q):
        path = q.get("path", [""])[0]
        i = int(q.get("i", ["0"])[0])
        p = os.path.join(thumb_dir(path), f"{i:04d}.jpg")
        if not os.path.isfile(p) or os.path.getsize(p) == 0:
            return self.send_error_json("not ready", 404)
        with open(p, "rb") as f:
            body = f.read()
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "max-age=3600")
        self.end_headers()
        self.wfile.write(body)

    def api_export(self, body):
        if not FFMPEG:
            return self.send_error_json("ffmpeg not installed", 500)
        project = validate_project(body.get("project") or {})
        output = body.get("output") or {}
        if not str(output.get("path") or "").strip():
            return self.send_error_json("bad output path")
        out_path = normalize_output_path(output.get("path"))
        if os.path.isdir(out_path):
            return self.send_error_json("bad output path")
        out_dir = os.path.dirname(out_path)
        if not os.path.isdir(out_dir):
            return self.send_error_json(f"folder does not exist: {out_dir}")
        for s in project["segments"]:
            if os.path.abspath(s["file"]) == out_path:
                return self.send_error_json(
                    "output path would overwrite a source clip")
        if (project.get("music") or {}).get("file") and \
                os.path.abspath(project["music"]["file"]) == out_path:
            return self.send_error_json(
                "output path would overwrite the music file")
        output["path"] = out_path
        job = ExportJob(project, output)
        with _jobs_lock:
            for other in JOBS.values():
                if other.state in ("queued", "running") and \
                        other.output.get("path") == out_path:
                    return self.send_error_json(
                        "an export to this file is already running")
            JOBS[job.id] = job
            # keep only recent jobs
            if len(JOBS) > 20:
                for k in list(JOBS)[:-20]:
                    if JOBS[k].state in ("done", "error", "cancelled"):
                        del JOBS[k]
        threading.Thread(target=job.run, daemon=True).start()
        return self.send_json({"id": job.id,
                               "duration": round(output_duration(project), 3)})

    def api_reveal(self, body):
        path = str(body.get("path", ""))
        if not os.path.exists(path):
            return self.send_error_json("file not found", 404)
        system = platform.system()
        try:
            if system == "Darwin":
                subprocess.Popen(["open", "-R", path])
            elif system == "Windows":
                subprocess.Popen(["explorer", "/select,", path])
            else:
                subprocess.Popen(["xdg-open", os.path.dirname(path)])
        except OSError as e:
            return self.send_error_json(e, 500)
        return self.send_json({"ok": True})

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

class QuietServer(ThreadingHTTPServer):
    daemon_threads = True

    def handle_error(self, request, client_address):
        # client disconnects (aborted <video> range requests etc.) are normal
        import traceback
        exc = sys.exc_info()[1]
        if isinstance(exc, (BrokenPipeError, ConnectionResetError,
                            TimeoutError)):
            return
        traceback.print_exc()

def find_port(start):
    for port in range(start, start + 30):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    raise RuntimeError("no free port found")

def main():
    global OPEN_FILE
    args = sys.argv[1:]
    port = 8765
    open_browser = True
    files = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--port" and i + 1 < len(args):
            port = int(args[i + 1])
            i += 2
        elif a == "--no-browser":
            open_browser = False
            i += 1
        elif a in ("-h", "--help"):
            print(__doc__)
            return
        else:
            files.append(a)
            i += 1
    if files:
        f = os.path.abspath(os.path.expanduser(files[0]))
        if os.path.isfile(f):
            OPEN_FILE = f
        else:
            print(f"warning: file not found: {f}")

    clean_cache()
    port = find_port(port)
    server = QuietServer(("127.0.0.1", port), Handler)
    url = f"http://127.0.0.1:{port}/"

    import signal
    signal.signal(signal.SIGTERM, lambda *_: os._exit(0))

    print(f"""
  ┌──────────────────────────────────────────────┐
  │  🎬 {APP_NAME} v{VERSION}                        │
  │                                              │
  │  Editor running at:  {url:<24}│
  │  Press Ctrl+C to quit.                       │
  └──────────────────────────────────────────────┘""")
    if not (FFMPEG and FFPROBE):
        print("  ⚠️  ffmpeg not found — you can browse the UI but exports")
        print("     won't work. Install it first:")
        print("       macOS:  brew install ffmpeg")
        print("       Ubuntu: sudo apt install ffmpeg")
        print("       Windows: winget install ffmpeg\n")
    if open_browser:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Bye! 👋")

if __name__ == "__main__":
    main()
