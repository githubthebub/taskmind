/* ShortStack editor app */
"use strict";

/* ═══════════════════════ helpers ═══════════════════════ */

const $ = (id) => document.getElementById(id);
const TOKEN = window.SS_TOKEN;

async function api(path, params = {}) {
  const q = new URLSearchParams(params).toString();
  const r = await fetch(`${path}${q ? "?" + q : ""}`, {
    headers: { "X-Token": TOKEN },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

async function apiPost(path, body) {
  const r = await fetch(path, {
    method: "POST",
    headers: { "X-Token": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

const mediaURL = (p) => `/media?path=${encodeURIComponent(p)}&t=${TOKEN}`;

function fmtTime(t, decimals = 1) {
  if (!isFinite(t) || t < 0) t = 0;
  const f = Math.pow(10, decimals);
  t = Math.round(t * f) / f; // round first so 59.96 → 1:00.0, not 0:60.0
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(decimals).padStart(decimals ? 3 + decimals : 2, "0")}`;
}
function parseTime(str) {
  str = String(str).trim();
  if (str.includes(":")) {
    const [m, s] = str.split(":");
    const v = parseInt(m, 10) * 60 + parseFloat(s);
    return isFinite(v) ? v : null;
  }
  const v = parseFloat(str);
  return isFinite(v) ? v : null;
}
const fmtSize = (b) =>
  b > 1e9 ? (b / 1e9).toFixed(2) + " GB" : (b / 1e6).toFixed(1) + " MB";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const deep = (o) => JSON.parse(JSON.stringify(o));

function toast(msg, isError = false) {
  const el = document.createElement("div");
  el.className = "toast" + (isError ? " error" : "");
  el.textContent = msg;
  $("toast-holder").appendChild(el);
  setTimeout(() => el.remove(), isError ? 6000 : 3000);
}

/* ═══════════════════════ state ═══════════════════════ */

let CONFIG = { home: "", sep: "/", platform: "", ffmpeg: true, shortcuts: [] };

let project = newProject();
function newProject() {
  return { version: 1, segments: [], texts: [], frame: { mode: "fill" }, music: null };
}

let sel = { type: null, index: -1 }; // 'clip' | 'text'
let playing = false;
let projTime = 0; // current time on the output timeline

const probes = new Map();     // path -> probe info (resolved)
const waveforms = new Map();  // path -> {rate, peaks}
const thumbMeta = new Map();  // path -> {count, interval, done}
const thumbImgs = new Map();  // `${path}#${i}` -> Image (only if loaded ok)

/* ---- undo / redo ---- */
let undoStack = [], redoStack = [], histPrev = JSON.stringify(project);
function commit() {
  undoStack.push(histPrev);
  if (undoStack.length > 100) undoStack.shift();
  redoStack = [];
  histPrev = JSON.stringify(project);
  autosave();
  updateUndoButtons();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(project));
  project = JSON.parse(undoStack.pop());
  histPrev = JSON.stringify(project);
  afterHistoryJump();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(project));
  project = JSON.parse(redoStack.pop());
  histPrev = JSON.stringify(project);
  afterHistoryJump();
}
function afterHistoryJump() {
  sel = { type: null, index: -1 };
  clampPlayhead();
  ensureMediaLoaded();
  refreshAll();
  autosave();
}
function updateUndoButtons() {
  $("btn-undo").disabled = !undoStack.length;
  $("btn-redo").disabled = !redoStack.length;
}

function autosave() {
  try {
    localStorage.setItem("shortstack.last", JSON.stringify(project));
  } catch (e) { /* quota — ignore */ }
}

function addRecent(path) {
  try {
    let r = JSON.parse(localStorage.getItem("shortstack.recents") || "[]");
    r = [path, ...r.filter((p) => p !== path)].slice(0, 6);
    localStorage.setItem("shortstack.recents", JSON.stringify(r));
  } catch (e) {}
}

/* ---- derived timeline geometry ---- */
const segDur = (s) => (s.out - s.in) / s.speed;
function segStarts() {
  const starts = [];
  let t = 0;
  for (const s of project.segments) { starts.push(t); t += segDur(s); }
  return starts;
}
const totalDuration = () =>
  project.segments.reduce((a, s) => a + segDur(s), 0);

function locate(T) {
  // output time -> {index, local (source seconds)}
  const starts = segStarts();
  for (let i = 0; i < project.segments.length; i++) {
    const s = project.segments[i];
    const end = starts[i] + segDur(s);
    if (T < end - 1e-6 || i === project.segments.length - 1) {
      const local = clamp(s.in + (T - starts[i]) * s.speed, s.in, s.out);
      return { index: i, local, start: starts[i] };
    }
  }
  return null;
}
function clampPlayhead() {
  projTime = clamp(projTime, 0, Math.max(0, totalDuration() - 1e-4));
}

/* ═══════════════════════ media probing ═══════════════════════ */

async function ensureProbe(path) {
  if (probes.has(path)) return probes.get(path);
  const info = await api("/api/probe", { path });
  probes.set(path, info);
  return info;
}
const probeSync = (path) => probes.get(path) || null;

function ensureWaveform(path) {
  if (waveforms.has(path)) return;
  waveforms.set(path, { rate: 25, peaks: [] }); // placeholder to dedupe
  api("/api/waveform", { path })
    .then((w) => { waveforms.set(path, w); drawTimeline(); })
    .catch(() => {});
}

function ensureThumbs(path) {
  if (thumbMeta.has(path)) return;
  thumbMeta.set(path, { count: 0, interval: 0, done: 0 });
  const poll = async (tries) => {
    try {
      const m = await api("/api/thumbs", { path });
      thumbMeta.set(path, m);
      drawTimeline();
      if (m.done < m.count && tries > 0) setTimeout(() => poll(tries - 1), 1500);
    } catch (e) {}
  };
  poll(120);
}

function thumbImage(path, i) {
  const key = `${path}#${i}`;
  if (thumbImgs.has(key)) return thumbImgs.get(key);
  const meta = thumbMeta.get(path);
  if (!meta || i >= meta.done) return null; // not generated yet
  const img = new Image();
  img.onload = () => drawTimeline();
  img.src = `/api/thumb?path=${encodeURIComponent(path)}&i=${i}&t=${TOKEN}`;
  thumbImgs.set(key, img);
  return img;
}

/* ═══════════════════════ player engine ═══════════════════════ */

const video = $("video");
const videoBg = $("video-bg");
let loadedFile = null;   // path currently in <video>
let pendingSeek = null;  // source-seconds to apply once metadata loads
let previewVol = 1;

function ensureMediaLoaded() {
  const loc = locate(projTime);
  if (!loc) { loadedFile = null; video.removeAttribute("src"); video.load(); return; }
  loadFileAndSeek(project.segments[loc.index].file, loc.local);
}

function loadFileAndSeek(path, local) {
  if (loadedFile !== path) {
    loadedFile = path;
    pendingSeek = local;
    const url = mediaURL(path);
    video.src = url;
    videoBg.src = url;
    video.load();
  } else if (video.readyState >= 1) {
    if (Math.abs(video.currentTime - local) > 0.01) video.currentTime = local;
  } else {
    pendingSeek = local;
  }
}

video.addEventListener("loadedmetadata", () => {
  if (pendingSeek != null) {
    video.currentTime = pendingSeek;
    pendingSeek = null;
  }
  // load() resets playbackRate/volume — re-apply the current segment's
  const loc = locate(projTime);
  if (loc) applySegmentPlayback(project.segments[loc.index]);
  layoutPreview();
  if (playing) video.play().catch(() => {});
});
video.addEventListener("seeked", () => {
  videoBg.currentTime = video.currentTime;
  layoutPreview();
});
/* codec the browser can't decode → say so instead of a silent black frame */
video.addEventListener("error", () => {
  if (!loadedFile) return;
  const info = probeSync(loadedFile);
  const codec = info?.video?.codec ? ` (${info.video.codec})` : "";
  $("codec-warning").classList.remove("hidden");
  $("codec-warning").textContent =
    `⚠️ Your browser can't preview this format${codec}. ` +
    `Editing by timecode and exporting still work — or try Safari for HEVC.`;
});
video.addEventListener("loadeddata", () => $("codec-warning").classList.add("hidden"));

function applySegmentPlayback(seg) {
  video.playbackRate = clamp(seg.speed, 0.25, 4);
  videoBg.playbackRate = video.playbackRate;
  video.volume = clamp((seg.muted ? 0 : seg.volume ?? 1) * previewVol, 0, 1);
}

function setProjectTime(T, forceSeek = true) {
  clampPlayhead();
  projTime = clamp(T, 0, Math.max(0, totalDuration()));
  const loc = locate(projTime);
  if (loc) {
    const seg = project.segments[loc.index];
    applySegmentPlayback(seg);
    if (forceSeek) loadFileAndSeek(seg.file, loc.local);
  }
  updateTimeUI();
  renderTexts();
  drawTimeline();
}

function play() {
  if (!project.segments.length) return;
  if (projTime >= totalDuration() - 0.02) setProjectTime(0);
  playing = true;
  $("btn-play").textContent = "⏸";
  video.play().catch((e) => { playing = false; $("btn-play").textContent = "▶"; });
  if (frameMode() === "blur") videoBg.play().catch(() => {});
  musicPreviewSync();
}
function pause() {
  playing = false;
  $("btn-play").textContent = "▶";
  video.pause();
  videoBg.pause();
  musicPreviewSync();
}

/* music preview */
const musicAudio = new Audio();
musicAudio.loop = true;
let musicFile = null;
function musicPreviewSync() {
  const m = project.music;
  if (!m || !m.file) {
    musicAudio.pause();
    musicFile = null;
    musicAudio.removeAttribute("src");
    return;
  }
  if (musicFile !== m.file) {
    musicFile = m.file;
    musicAudio.src = mediaURL(m.file);
  }
  musicAudio.volume = clamp(m.volume * previewVol, 0, 1);
  if (playing) {
    if (musicAudio.paused) {
      musicAudio.currentTime = projTime % (musicAudio.duration || 1e9);
      musicAudio.play().catch(() => {});
    }
  } else musicAudio.pause();
}

/* main clock: map the <video> clock back to project time */
function tick() {
  requestAnimationFrame(tick);
  if (!project.segments.length) return;
  const loc = locate(projTime);
  if (!loc) return;
  const seg = project.segments[loc.index];

  if (playing && loadedFile === seg.file && video.readyState >= 2) {
    const t = video.currentTime;
    if (t >= seg.out - 0.02 || video.ended) {
      // advance to next segment (or stop)
      if (loc.index + 1 < project.segments.length) {
        const starts = segStarts();
        projTime = starts[loc.index + 1];
        const next = project.segments[loc.index + 1];
        applySegmentPlayback(next);
        loadFileAndSeek(next.file, next.in);
        if (loadedFile === next.file && video.paused) video.play().catch(() => {});
      } else {
        pause();
        projTime = totalDuration();
      }
    } else {
      projTime = loc.start + (clamp(t, seg.in, seg.out) - seg.in) / seg.speed;
    }
    updateTimeUI();
    renderTexts();
    drawTimeline();
  }
  // keep blurred background roughly in sync
  if (frameMode() === "blur" && videoBg.src) {
    if (playing && videoBg.paused) videoBg.play().catch(() => {});
    if (!playing && !videoBg.paused) videoBg.pause();
    if (Math.abs(videoBg.currentTime - video.currentTime) > 0.2)
      videoBg.currentTime = video.currentTime;
  }
}
requestAnimationFrame(tick);

/* ═══════════════════════ preview layout ═══════════════════════ */

const frame = $("preview-frame");
const cropViewport = $("crop-viewport");
const frameMode = () => project.frame?.mode || "fill";

function layoutPreview() {
  const hasClips = project.segments.length > 0;
  $("preview-empty").classList.toggle("hidden", hasClips);
  if (!hasClips) return;

  const mode = frameMode();
  frame.classList.toggle("mode-blur", mode === "blur");

  const loc = locate(projTime);
  const seg = loc ? project.segments[loc.index] : project.segments[0];
  const info = probeSync(seg.file);
  const vw = info?.video?.width || 1920, vh = info?.video?.height || 1080;

  // frame aspect: 9:16 unless "original", which uses the video's true aspect
  // (so text size/position previews match the export for any aspect ratio)
  if (mode === "original") {
    frame.classList.toggle("landscape", vw >= vh);
    frame.style.aspectRatio = `${vw} / ${vh}`;
  } else {
    frame.classList.remove("landscape");
    frame.style.aspectRatio = "";
  }

  const cw = frame.clientWidth, ch = frame.clientHeight;
  if (!cw || !ch) return;

  frame.classList.toggle("croppable", mode === "fill");
  if (mode === "fill") {
    video.classList.remove("contain");
    const aspect = cw / ch;
    let rw, rh;
    if (vw / vh > aspect) { rh = vh; rw = vh * aspect; }
    else { rw = vw; rh = vw / aspect; }
    const cx = seg.crop?.cx ?? 0.5, cy = seg.crop?.cy ?? 0.5;
    const ox = (vw - rw) * cx, oy = (vh - rh) * cy;
    const s = ch / rh;
    video.style.width = vw * s + "px";
    video.style.height = vh * s + "px";
    video.style.transform = `translate(${-ox * s}px, ${-oy * s}px)`;
  } else {
    video.classList.add("contain");
    video.style.width = "";
    video.style.height = "";
    video.style.transform = "";
  }
  renderTexts();
}
window.addEventListener("resize", layoutPreview);

/* drag-to-reframe on the preview (fill mode) */
let cropDrag = null;
cropViewport.addEventListener("pointerdown", (e) => {
  if (frameMode() !== "fill" || !project.segments.length) return;
  const loc = locate(projTime);
  if (!loc) return;
  const seg = project.segments[loc.index];
  const info = probeSync(seg.file);
  if (!info?.video) return;
  const vw = info.video.width, vh = info.video.height;
  const cw = frame.clientWidth, ch = frame.clientHeight;
  const aspect = cw / ch;
  let rw, rh;
  if (vw / vh > aspect) { rh = vh; rw = vh * aspect; }
  else { rw = vw; rh = vw / aspect; }
  const s = ch / rh;
  cropDrag = {
    segIndex: loc.index,
    startX: e.clientX, startY: e.clientY,
    cx0: seg.crop?.cx ?? 0.5, cy0: seg.crop?.cy ?? 0.5,
    panX: (vw - rw) * s,  // total pannable px in screen space
    panY: (vh - rh) * s,
  };
  frame.classList.add("dragging");
  $("crop-hint").classList.remove("hidden");
  cropViewport.setPointerCapture(e.pointerId);
});
cropViewport.addEventListener("pointermove", (e) => {
  if (!cropDrag) return;
  const seg = project.segments[cropDrag.segIndex];
  if (!seg) return;
  seg.crop = seg.crop || { cx: 0.5, cy: 0.5 };
  if (cropDrag.panX > 1)
    seg.crop.cx = clamp(cropDrag.cx0 - (e.clientX - cropDrag.startX) / cropDrag.panX, 0, 1);
  if (cropDrag.panY > 1)
    seg.crop.cy = clamp(cropDrag.cy0 - (e.clientY - cropDrag.startY) / cropDrag.panY, 0, 1);
  layoutPreview();
});
["pointerup", "pointercancel"].forEach((ev) =>
  cropViewport.addEventListener(ev, () => {
    if (!cropDrag) return;
    const seg = project.segments[cropDrag.segIndex];
    const moved = seg && (seg.crop.cx !== cropDrag.cx0 || seg.crop.cy !== cropDrag.cy0);
    cropDrag = null;
    frame.classList.remove("dragging");
    $("crop-hint").classList.add("hidden");
    if (moved) commit(); // no ghost undo entries from plain clicks
  })
);

/* word-wrap mirroring the server's export wrap (same numbers) so the
   preview and the rendered video break lines in the same places */
function wrapOverlayText(text, fontPx, frameW) {
  const maxChars = Math.max(4, Math.floor((frameW * 0.92) / (fontPx * 0.52)));
  const out = [];
  for (const raw of text.split("\n")) {
    let line = "";
    for (const word of raw.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > maxChars) { // hard-break very long words
        if (line) { out.push(line); line = ""; }
        out.push(w.slice(0, maxChars));
        w = w.slice(maxChars);
      }
      if (!line) line = w;
      else if (line.length + 1 + w.length <= maxChars) line += " " + w;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out.join("\n");
}

/* text overlays in preview */
function renderTexts() {
  const layer = $("text-layer");
  layer.innerHTML = "";
  const ch = frame.clientHeight, cw = frame.clientWidth;
  if (!ch) return;
  project.texts.forEach((t, i) => {
    const isSel = sel.type === "text" && sel.index === i;
    const visible = projTime >= t.start && projTime <= t.end;
    if (!visible && !isSel) return;
    const el = document.createElement("div");
    el.className = "overlay-text" + (isSel ? " sel" : "");
    const px = (t.size / 100) * ch;
    el.textContent = wrapOverlayText(t.text, px, cw);
    el.style.fontSize = px + "px";
    el.style.color = t.color || "#FFFFFF";
    el.style.fontWeight = t.font === "regular" ? "400" : "700";
    el.style.opacity = visible ? "1" : "0.35";
    if (t.outline !== false) {
      const o = Math.max(1, px / 16);
      el.style.textShadow =
        `${o}px 0 0 #000, -${o}px 0 0 #000, 0 ${o}px 0 #000, 0 -${o}px 0 #000,` +
        `${o}px ${o}px 0 #000, -${o}px -${o}px 0 #000, ${o}px -${o}px 0 #000, -${o}px ${o}px 0 #000`;
    }
    if (t.box) {
      el.style.background = t.boxColor
        ? t.boxColor.slice(0, 7) + "AA"
        : "rgba(0,0,0,0.65)";
      el.style.padding = `${px * 0.15}px ${px * 0.3}px`;
      el.style.borderRadius = px * 0.12 + "px";
      el.style.width = "auto";
      el.style.maxWidth = "92%";
    }
    el.style.top = `${t.y * 100}%`;
    el.style.transform = `translate(-50%, -${t.y * 100}%)`;
    layer.appendChild(el);
  });
}

/* ═══════════════════════ time display ═══════════════════════ */

function updateTimeUI() {
  const total = totalDuration();
  $("time-display").textContent = `${fmtTime(projTime)} / ${fmtTime(total)}`;
  const badge = $("dur-badge");
  if (!project.segments.length) { badge.classList.add("hidden"); return; }
  badge.classList.remove("hidden");
  badge.className = "badge";
  if (total <= 60.5) { badge.classList.add("ok"); badge.textContent = "✓ Shorts"; }
  else if (total <= 180.5) { badge.classList.add("warn"); badge.textContent = "✓ Shorts (3 min max)"; }
  else { badge.classList.add("over"); badge.textContent = "⚠ too long for Shorts"; }
}

/* ═══════════════════════ timeline canvas ═══════════════════════ */

const tl = $("timeline");
const ctx = tl.getContext("2d");
const TL = { padX: 12, rulerH: 20, clipY: 26, clipH: 78, textY: 112, textH: 24 };
let tlScroll = 0;   // seconds
let tlZoom = 0;     // 0..100

function tlPPS() {
  const w = tl.clientWidth - TL.padX * 2;
  const total = Math.max(totalDuration(), 1);
  const fit = w / total;
  const max = Math.max(fit * 1.01, 160);
  return fit * Math.pow(max / fit, tlZoom / 100);
}
const timeToX = (t, pps) => TL.padX + (t - tlScroll) * pps;
const xToTime = (x, pps) => tlScroll + (x - TL.padX) / pps;

function niceStep(pps) {
  for (const s of [0.1, 0.2, 0.5, 1, 2, 5, 10, 15, 30, 60, 120])
    if (s * pps >= 60) return s;
  return 300;
}

function roundRect(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function drawTimeline() {
  const dpr = window.devicePixelRatio || 1;
  const w = tl.clientWidth, h = tl.clientHeight;
  if (!w) return;
  if (tl.width !== w * dpr || tl.height !== h * dpr) {
    tl.width = w * dpr;
    tl.height = h * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const total = totalDuration();
  if (!project.segments.length) {
    ctx.fillStyle = "#5a5f6c";
    ctx.font = "13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Open a video to start editing", w / 2, h / 2);
    return;
  }
  const pps = tlPPS();
  tlScroll = clamp(tlScroll, 0, Math.max(0, total - (w - TL.padX * 2) / pps));

  /* ruler */
  const step = niceStep(pps);
  ctx.font = "10px " + "ui-monospace, monospace";
  ctx.textAlign = "left";
  const t0 = Math.floor(tlScroll / step) * step;
  for (let t = t0; t <= tlScroll + w / pps + step; t += step) {
    const x = timeToX(t, pps);
    if (x < TL.padX - 4 || x > w) continue;
    ctx.fillStyle = "#3c414d";
    ctx.fillRect(x, 6, 1, TL.rulerH - 8);
    ctx.fillStyle = "#8a90a0";
    ctx.fillText(fmtTime(t, step < 1 ? 1 : 0), x + 4, 15);
  }

  /* clip blocks */
  const starts = segStarts();
  project.segments.forEach((s, i) => {
    const x = timeToX(starts[i], pps);
    const bw = segDur(s) * pps;
    if (x + bw < 0 || x > w) return;
    const y = TL.clipY, bh = TL.clipH;
    const selc = sel.type === "clip" && sel.index === i;

    roundRect(ctx, x + 1, y, bw - 2, bh, 8);
    ctx.fillStyle = "#2c313c";
    ctx.fill();
    ctx.save();
    ctx.clip();

    /* filmstrip */
    const meta = thumbMeta.get(s.file);
    if (meta?.interval) {
      const thumbW = 58, thumbH = 54;
      for (let tx = 0; tx < bw; tx += thumbW) {
        const frac = (tx + thumbW / 2) / bw;
        const srcT = s.in + frac * (s.out - s.in);
        const idx = clamp(Math.floor(srcT / meta.interval), 0, meta.count - 1);
        const img = thumbImage(s.file, idx);
        if (img && img.complete && img.naturalWidth) {
          const iw = (thumbH * img.naturalWidth) / img.naturalHeight;
          ctx.drawImage(img, x + 1 + tx + (thumbW - iw) / 2, y, iw, thumbH);
        }
      }
      ctx.fillStyle = "#00000038";
      ctx.fillRect(x + 1, y, bw - 2, thumbH);
    }

    /* waveform strip */
    const wf = waveforms.get(s.file);
    if (wf?.peaks?.length) {
      const wy = y + bh - 22, wh = 20;
      ctx.fillStyle = s.muted ? "#ffffff30" : "#7fd0a066";
      const pStep = Math.max(1, Math.floor((s.out - s.in) * wf.rate / bw));
      for (let px = 0; px < bw - 2; px++) {
        const srcT = s.in + (px / bw) * (s.out - s.in);
        const pi = Math.floor(srcT * wf.rate);
        let peak = 0;
        for (let k = 0; k < pStep; k++) peak = Math.max(peak, wf.peaks[pi + k] || 0);
        const ph = Math.max(1, (peak / 100) * wh);
        ctx.fillRect(x + 1 + px, wy + wh - ph, 1, ph);
      }
    }

    /* labels */
    ctx.fillStyle = "#ffffffd8";
    ctx.font = "10.5px sans-serif";
    const label = `${s.speed !== 1 ? s.speed + "× · " : ""}${s.muted ? "🔇 " : ""}${fmtTime(segDur(s))}`;
    ctx.fillText(label, x + 7, y + bh - 26);
    ctx.restore();

    ctx.lineWidth = selc ? 2 : 1;
    ctx.strokeStyle = selc ? "#4f8cff" : "#454b58";
    roundRect(ctx, x + 1, y, bw - 2, bh, 8);
    ctx.stroke();

    /* trim handles when selected */
    if (selc && bw > 26) {
      ctx.fillStyle = "#4f8cff";
      roundRect(ctx, x + 1, y, 7, bh, 3); ctx.fill();
      roundRect(ctx, x + bw - 8, y, 7, bh, 3); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + 4, y + bh / 2 - 7, 1, 14);
      ctx.fillRect(x + bw - 5, y + bh / 2 - 7, 1, 14);
    }
  });

  /* text track */
  project.texts.forEach((t, i) => {
    const x = timeToX(t.start, pps);
    const bw = Math.max(4, (t.end - t.start) * pps);
    if (x + bw < 0 || x > w) return;
    const selt = sel.type === "text" && sel.index === i;
    roundRect(ctx, x, TL.textY, bw, TL.textH, 6);
    ctx.fillStyle = selt ? "#c9a648" : "#8a7a3a";
    ctx.fill();
    if (selt) { ctx.strokeStyle = "#ffd75e"; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#141519";
    ctx.font = "10.5px sans-serif";
    ctx.fillText("T " + t.text.replace(/\s+/g, " ").slice(0, 40), x + 6, TL.textY + 16);
    ctx.restore();
  });

  /* playhead */
  const px = timeToX(projTime, pps);
  if (px >= TL.padX - 2 && px <= w) {
    ctx.fillStyle = "#ff5d5d";
    ctx.fillRect(px - 0.5, 4, 1.5, h - 8);
    ctx.beginPath();
    ctx.moveTo(px - 5, 4); ctx.lineTo(px + 5, 4); ctx.lineTo(px, 12);
    ctx.closePath();
    ctx.fill();
  }
}

/* ---- timeline interactions ---- */
let tlDrag = null; // {kind, ...}

function tlHitTest(x, y) {
  const pps = tlPPS();
  if (y < TL.rulerH + 4) return { kind: "scrub" };
  const starts = segStarts();
  if (y >= TL.clipY && y <= TL.clipY + TL.clipH) {
    for (let i = 0; i < project.segments.length; i++) {
      const bx = timeToX(starts[i], pps);
      const bw = segDur(project.segments[i]) * pps;
      if (x >= bx && x <= bx + bw) {
        if (x - bx <= 9) return { kind: "trim-in", index: i };
        if (bx + bw - x <= 9) return { kind: "trim-out", index: i };
        return { kind: "clip", index: i };
      }
    }
    return { kind: "empty" };
  }
  if (y >= TL.textY - 2 && y <= TL.textY + TL.textH + 2) {
    for (let i = project.texts.length - 1; i >= 0; i--) {
      const t = project.texts[i];
      const bx = timeToX(t.start, pps);
      const bw = Math.max(4, (t.end - t.start) * pps);
      if (x >= bx - 3 && x <= bx + bw + 3) {
        if (x - bx <= 6) return { kind: "text-in", index: i };
        if (bx + bw - x <= 6) return { kind: "text-out", index: i };
        return { kind: "text", index: i };
      }
    }
  }
  return { kind: "empty" };
}

tl.addEventListener("pointerdown", (e) => {
  if (!project.segments.length) return;
  const rect = tl.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const hit = tlHitTest(x, y);
  const pps = tlPPS();
  tl.setPointerCapture(e.pointerId);

  if (hit.kind === "scrub" || hit.kind === "empty") {
    if (hit.kind === "empty") select(null);
    pause();
    setProjectTime(clamp(xToTime(x, pps), 0, totalDuration()));
    tlDrag = { kind: "scrub" };
  } else if (hit.kind === "clip") {
    select("clip", hit.index);
    tlDrag = { kind: "clip-move", index: hit.index, startX: x, moved: false };
  } else if (hit.kind === "trim-in" || hit.kind === "trim-out") {
    select("clip", hit.index);
    pause();
    const s = project.segments[hit.index];
    tlDrag = { kind: hit.kind, index: hit.index, changed: false,
               x0: x, in0: s.in, out0: s.out };
  } else if (hit.kind === "text" || hit.kind === "text-in" || hit.kind === "text-out") {
    select("text", hit.index);
    const t = project.texts[hit.index];
    tlDrag = { kind: hit.kind, index: hit.index, startX: x,
               s0: t.start, e0: t.end, changed: false };
  }
  drawTimeline();
});

tl.addEventListener("pointermove", (e) => {
  const rect = tl.getBoundingClientRect();
  const x = e.clientX - rect.left, y = e.clientY - rect.top;
  const pps = tlPPS();

  if (!tlDrag) {
    const hit = tlHitTest(x, y);
    tl.style.cursor =
      hit.kind.startsWith("trim") || hit.kind.endsWith("-in") || hit.kind.endsWith("-out")
        ? "col-resize"
        : hit.kind === "clip" || hit.kind === "text" ? "pointer"
        : hit.kind === "scrub" ? "ew-resize" : "default";
    return;
  }

  if (tlDrag.kind === "scrub") {
    setProjectTime(clamp(xToTime(x, pps), 0, totalDuration()));
  } else if (tlDrag.kind === "trim-in" || tlDrag.kind === "trim-out") {
    const s = project.segments[tlDrag.index];
    const info = probeSync(s.file);
    const fileDur = info?.duration || s.out + 3600;
    // pointer delta since drag start, converted to source seconds
    const dSrc = ((x - tlDrag.x0) / pps) * s.speed;
    if (tlDrag.kind === "trim-in") {
      s.in = clamp(tlDrag.in0 + dSrc, 0, s.out - 0.05);
    } else {
      s.out = clamp(tlDrag.out0 + dSrc, s.in + 0.05, fileDur);
    }
    tlDrag.changed = true;
    // show the trimmed frame for feedback
    loadFileAndSeek(s.file, tlDrag.kind === "trim-in" ? s.in : s.out);
    clampPlayhead();
    updateTimeUI();
    updateClipPanel();
    drawTimeline();
  } else if (tlDrag.kind === "clip-move") {
    const dx = x - tlDrag.startX;
    if (!tlDrag.moved && Math.abs(dx) < 7) return;
    tlDrag.moved = true;
    // live-reorder: compute target slot from pointer time
    const T = xToTime(x, pps);
    const starts = segStarts();
    let target = project.segments.length - 1;
    for (let i = 0; i < project.segments.length; i++) {
      const mid = starts[i] + segDur(project.segments[i]) / 2;
      if (T < mid) { target = i; break; }
      target = Math.min(i + 1, project.segments.length - 1);
    }
    if (target !== tlDrag.index) {
      const [moved] = project.segments.splice(tlDrag.index, 1);
      project.segments.splice(target, 0, moved);
      sel.index = target;
      tlDrag.index = target;
      tlDrag.changed = true;
      drawTimeline();
    }
  } else if (tlDrag.kind === "text" || tlDrag.kind === "text-in" || tlDrag.kind === "text-out") {
    const t = project.texts[tlDrag.index];
    const dt = (x - tlDrag.startX) / pps;
    const total = totalDuration();
    if (tlDrag.kind === "text") {
      const len = tlDrag.e0 - tlDrag.s0;
      t.start = clamp(tlDrag.s0 + dt, 0, Math.max(0, total - len));
      t.end = t.start + len;
    } else if (tlDrag.kind === "text-in") {
      t.start = clamp(tlDrag.s0 + dt, 0, t.end - 0.1);
    } else {
      t.end = clamp(tlDrag.e0 + dt, t.start + 0.1, total + 10);
    }
    tlDrag.changed = true;
    updateTextPanel();
    renderTexts();
    drawTimeline();
  }
});

["pointerup", "pointercancel"].forEach((ev) =>
  tl.addEventListener(ev, () => {
    if (!tlDrag) return;
    const changed = tlDrag.changed || (tlDrag.kind === "clip-move" && tlDrag.moved);
    try {
      if (changed) {
        clampPlayhead();
        setProjectTime(projTime);
        commit();
        refreshAll();
      }
    } finally {
      tlDrag = null; // always end the drag, even if a render throws
    }
  })
);

tl.addEventListener("wheel", (e) => {
  e.preventDefault();
  const pps = tlPPS();
  if (e.ctrlKey || e.metaKey) {
    const rect = tl.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const tAtMouse = xToTime(mx, pps);
    tlZoom = clamp(tlZoom - e.deltaY * 0.5, 0, 100);
    $("tl-zoom").value = tlZoom;
    const pps2 = tlPPS();
    tlScroll = tAtMouse - (mx - TL.padX) / pps2;
  } else {
    const d = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    tlScroll += d / pps;
  }
  drawTimeline();
}, { passive: false });

$("tl-zoom").addEventListener("input", (e) => {
  const pps = tlPPS();
  const center = tlScroll + (tl.clientWidth / 2 - TL.padX) / pps;
  tlZoom = +e.target.value;
  const pps2 = tlPPS();
  tlScroll = center - (tl.clientWidth / 2 - TL.padX) / pps2;
  drawTimeline();
});
window.addEventListener("resize", drawTimeline);

/* ═══════════════════════ selection + inspector ═══════════════════════ */

function select(type, index = -1) {
  sel = { type, index };
  $("panel-project").classList.toggle("hidden", type !== null);
  $("panel-clip").classList.toggle("hidden", type !== "clip");
  $("panel-text").classList.toggle("hidden", type !== "text");
  $("btn-delete").disabled = type === null;
  if (type === "clip") updateClipPanel();
  if (type === "text") updateTextPanel();
  if (type === null) updateProjectPanel();
  renderTexts();
  drawTimeline();
}
const selClip = () => (sel.type === "clip" ? project.segments[sel.index] : null);
const selText = () => (sel.type === "text" ? project.texts[sel.index] : null);

function updateClipPanel() {
  const s = selClip();
  if (!s) return;
  $("clip-index").textContent = `${sel.index + 1} of ${project.segments.length}`;
  $("clip-file").textContent = s.file.split(/[\\/]/).pop();
  $("clip-file").title = s.file;
  if (document.activeElement !== $("clip-in")) $("clip-in").value = fmtTime(s.in, 2);
  if (document.activeElement !== $("clip-out")) $("clip-out").value = fmtTime(s.out, 2);
  $("clip-duration").textContent =
    `${(s.out - s.in).toFixed(2)}s source → ${segDur(s).toFixed(2)}s output`;
  $("clip-speed").value = Math.log2(s.speed);
  $("speed-label").textContent = s.speed + "×";
  document.querySelectorAll("#speed-presets button").forEach((b) =>
    b.classList.toggle("active", +b.dataset.speed === s.speed));
  $("clip-mute").checked = !!s.muted;
  $("clip-vol").value = Math.round((s.volume ?? 1) * 100);
  $("clip-vol-label").textContent = volLabel(s.volume ?? 1);
  $("clip-crop-row").classList.toggle("hidden", frameMode() !== "fill");
}

function updateTextPanel() {
  const t = selText();
  if (!t) return;
  if (document.activeElement !== $("text-content")) $("text-content").value = t.text;
  if (document.activeElement !== $("text-start")) $("text-start").value = fmtTime(t.start, 2);
  if (document.activeElement !== $("text-end")) $("text-end").value = fmtTime(t.end, 2);
  $("text-y").value = Math.round(t.y * 100);
  $("text-y-label").textContent = t.y < 0.33 ? "top" : t.y < 0.66 ? "middle" : "bottom";
  $("text-size").value = t.size;
  $("text-size-label").textContent = t.size + "%";
  $("text-color").value = t.color || "#FFFFFF";
  $("text-font").value = t.font || "bold";
  $("text-outline").checked = t.outline !== false;
  $("text-box").checked = !!t.box;
}

function updateProjectPanel() {
  document.querySelectorAll("#frame-mode button").forEach((b) =>
    b.classList.toggle("active", b.dataset.mode === frameMode()));
  /* text list */
  const list = $("text-list");
  list.innerHTML = "";
  const total = totalDuration();
  project.texts.forEach((t, i) => {
    const el = document.createElement("div");
    el.className = "item";
    const stranded = t.start >= total - 0.01;
    el.innerHTML = `<span class="when">${fmtTime(t.start, 0)}–${fmtTime(t.end, 0)}</span>`;
    el.appendChild(document.createTextNode(
      (stranded ? "⚠ " : "") + (t.text.slice(0, 30) || "(empty)")));
    if (stranded) el.title = "Starts after the video ends — it won't appear in the export";
    el.onclick = () => { select("text", i); setProjectTime(clamp(projTime, t.start, t.end)); };
    list.appendChild(el);
  });
  /* music */
  const m = project.music;
  $("btn-music").classList.toggle("hidden", !!m);
  $("music-info").classList.toggle("hidden", !m);
  if (m) {
    $("music-name").textContent = "🎵 " + m.file.split(/[\\/]/).pop();
    $("music-vol").value = Math.round(m.volume * 100);
    $("music-vol-label").textContent = Math.round(m.volume * 100) + "%";
  }
  $("btn-add-text").disabled = !project.segments.length;
}

function refreshAll() {
  updateTimeUI();
  layoutPreview();
  renderTexts();
  drawTimeline();
  updateProjectPanel();
  if (sel.type === "clip") updateClipPanel();
  if (sel.type === "text") updateTextPanel();
  const has = project.segments.length > 0;
  ["btn-add", "btn-save", "btn-export", "btn-split"].forEach((id) => ($(id).disabled = !has));
  updateUndoButtons();
  project.segments.forEach((s) => { ensureWaveform(s.file); ensureThumbs(s.file); });
}

/* ═══════════════════════ edit operations ═══════════════════════ */

async function openVideo(path, { append = false } = {}) {
  let info;
  try {
    info = await ensureProbe(path);
  } catch (e) {
    toast("Can't open: " + e.message, true);
    return;
  }
  if (!info.video) { toast("No video track in that file", true); return; }
  if (!info.duration) { toast("Couldn't read video duration", true); return; }
  const seg = {
    file: path, in: 0, out: info.duration, speed: 1,
    volume: 1, muted: false, crop: { cx: 0.5, cy: 0.5 },
  };
  if (append && project.segments.length) {
    project.segments.push(seg);
    select("clip", project.segments.length - 1);
    setProjectTime(segStarts()[project.segments.length - 1]);
    commit();
  } else {
    // fresh project: reset history with no ghost undo entry
    project = newProject();
    project.segments = [seg];
    undoStack = []; redoStack = []; histPrev = JSON.stringify(project);
    select(null);
    setProjectTime(0);
    autosave();
    updateUndoButtons();
  }
  addRecent(path);
  ensureMediaLoaded();
  refreshAll();
  if (info.video.hdr) toast("HDR video — export will tone-map to standard colors");
}

function splitAtPlayhead() {
  const loc = locate(projTime);
  if (!loc) return;
  const s = project.segments[loc.index];
  const local = loc.local;
  if (local - s.in < 0.05 || s.out - local < 0.05) {
    toast("Playhead is too close to a cut");
    return;
  }
  const right = deep(s);
  right.in = local;
  s.out = local;
  project.segments.splice(loc.index + 1, 0, right);
  select("clip", loc.index + 1);
  commit();
  refreshAll();
}

function deleteSelected() {
  if (sel.type === "clip" && selClip()) {
    project.segments.splice(sel.index, 1);
    select(null);
    clampPlayhead();
    if (project.segments.length) { setProjectTime(projTime); ensureMediaLoaded(); }
    else { pause(); loadedFile = null; video.removeAttribute("src"); video.load(); }
    commit();
    refreshAll();
  } else if (sel.type === "text" && selText()) {
    project.texts.splice(sel.index, 1);
    select(null);
    commit();
    refreshAll();
  }
}

function addTextAtPlayhead() {
  if (!project.segments.length) return;
  const total = totalDuration();
  const start = clamp(projTime, 0, Math.max(0, total - 0.5));
  const t = {
    text: "YOUR TEXT", start, end: Math.min(start + 2.5, total),
    y: 0.8, size: 6, color: "#FFFFFF", outline: true, box: false, font: "bold",
  };
  project.texts.push(t);
  select("text", project.texts.length - 1);
  commit();
  refreshAll();
  $("text-content").focus();
  $("text-content").select();
}

function trimToPlayhead(side) {
  // always trims the clip under the playhead — that's what the eye is on
  const loc = locate(projTime);
  if (!loc) return;
  const s = project.segments[loc.index];
  if (side === "in" && loc.local < s.out - 0.05) s.in = Math.max(0, loc.local);
  else if (side === "out" && loc.local > s.in + 0.05) {
    const info = probeSync(s.file);
    s.out = Math.min(loc.local, info?.duration || loc.local);
  } else return;
  select("clip", loc.index);
  clampPlayhead();
  setProjectTime(projTime);
  commit();
  refreshAll();
}

function jumpCut(dir) {
  const starts = segStarts();
  const marks = [...starts, totalDuration()];
  if (dir > 0) {
    const next = marks.find((m) => m > projTime + 0.02);
    if (next != null) setProjectTime(next);
  } else {
    const prev = [...marks].reverse().find((m) => m < projTime - 0.02);
    setProjectTime(prev ?? 0);
  }
}

/* ═══════════════════════ inspector events ═══════════════════════ */

/* frame mode */
document.querySelectorAll("#frame-mode button").forEach((b) =>
  b.addEventListener("click", () => {
    project.frame = { mode: b.dataset.mode };
    commit();
    refreshAll();
  })
);

/* clip fields */
$("clip-in").addEventListener("change", (e) => {
  const s = selClip(); if (!s) return;
  const v = parseTime(e.target.value);
  if (v != null && v >= 0 && v < s.out - 0.04) { s.in = v; commit(); }
  clampPlayhead(); setProjectTime(projTime); refreshAll();
});
$("clip-out").addEventListener("change", (e) => {
  const s = selClip(); if (!s) return;
  const v = parseTime(e.target.value);
  const info = probeSync(s.file);
  if (v != null && v > s.in + 0.04 && v <= (info?.duration || 1e9)) { s.out = v; commit(); }
  clampPlayhead(); setProjectTime(projTime); refreshAll();
});
$("clip-speed").addEventListener("input", (e) => {
  const s = selClip(); if (!s) return;
  let sp = Math.pow(2, +e.target.value);
  const snaps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
  for (const sn of snaps) if (Math.abs(sp - sn) < 0.06) sp = sn;
  s.speed = Math.round(sp * 100) / 100;
  applySegmentPlayback(s);
  updateClipPanel(); updateTimeUI(); drawTimeline();
});
$("clip-speed").addEventListener("change", () => {
  clampPlayhead(); setProjectTime(projTime); commit(); refreshAll();
});
document.querySelectorAll("#speed-presets button").forEach((b) =>
  b.addEventListener("click", () => {
    const s = selClip(); if (!s) return;
    s.speed = +b.dataset.speed;
    applySegmentPlayback(s);
    clampPlayhead(); setProjectTime(projTime);
    commit(); refreshAll();
  })
);
$("clip-mute").addEventListener("change", (e) => {
  const s = selClip(); if (!s) return;
  s.muted = e.target.checked;
  applySegmentPlayback(s);
  commit(); refreshAll();
});
/* preview playback caps at 100%; boosts above that only apply on export */
const volLabel = (v) =>
  Math.round(v * 100) + "%" + (v > 1 ? " (boost applies on export)" : "");
$("clip-vol").addEventListener("input", (e) => {
  const s = selClip(); if (!s) return;
  s.volume = +e.target.value / 100;
  $("clip-vol-label").textContent = volLabel(s.volume);
  applySegmentPlayback(s);
});
$("clip-vol").addEventListener("change", () => { commit(); drawTimeline(); });
$("btn-crop-reset").addEventListener("click", () => {
  const s = selClip(); if (!s) return;
  s.crop = { cx: 0.5, cy: 0.5 };
  commit(); layoutPreview();
});
$("btn-clip-left").addEventListener("click", () => moveClip(-1));
$("btn-clip-right").addEventListener("click", () => moveClip(1));
function moveClip(d) {
  const i = sel.index, j = i + d;
  if (sel.type !== "clip" || j < 0 || j >= project.segments.length) return;
  const [m] = project.segments.splice(i, 1);
  project.segments.splice(j, 0, m);
  sel.index = j;
  commit(); refreshAll();
}
$("btn-clip-delete").addEventListener("click", deleteSelected);

/* text fields */
$("text-content").addEventListener("input", (e) => {
  const t = selText(); if (!t) return;
  t.text = e.target.value;
  renderTexts(); drawTimeline();
});
$("text-content").addEventListener("change", () => { commit(); updateProjectPanel(); });
$("text-start").addEventListener("change", (e) => {
  const t = selText(); if (!t) return;
  const v = parseTime(e.target.value);
  if (v != null && v >= 0 && v < t.end) { t.start = v; commit(); }
  refreshAll();
});
$("text-end").addEventListener("change", (e) => {
  const t = selText(); if (!t) return;
  const v = parseTime(e.target.value);
  if (v != null && v > t.start) { t.end = v; commit(); }
  refreshAll();
});
$("text-y").addEventListener("input", (e) => {
  const t = selText(); if (!t) return;
  t.y = +e.target.value / 100;
  updateTextPanel(); renderTexts();
});
$("text-y").addEventListener("change", () => commit());
$("text-size").addEventListener("input", (e) => {
  const t = selText(); if (!t) return;
  t.size = +e.target.value;
  updateTextPanel(); renderTexts();
});
$("text-size").addEventListener("change", () => commit());
$("text-color").addEventListener("input", (e) => {
  const t = selText(); if (!t) return;
  t.color = e.target.value.toUpperCase();
  renderTexts();
});
$("text-color").addEventListener("change", () => commit());
$("text-font").addEventListener("change", (e) => {
  const t = selText(); if (!t) return;
  t.font = e.target.value;
  commit(); renderTexts();
});
$("text-outline").addEventListener("change", (e) => {
  const t = selText(); if (!t) return;
  t.outline = e.target.checked;
  commit(); renderTexts();
});
$("text-box").addEventListener("change", (e) => {
  const t = selText(); if (!t) return;
  t.box = e.target.checked;
  commit(); renderTexts();
});
$("btn-text-delete").addEventListener("click", deleteSelected);

/* music */
$("btn-music").addEventListener("click", () =>
  browse("audio", "Choose music", (path) => {
    project.music = { file: path, volume: 0.2 };
    commit(); updateProjectPanel(); musicPreviewSync();
  })
);
$("music-vol").addEventListener("input", (e) => {
  if (!project.music) return;
  project.music.volume = +e.target.value / 100;
  $("music-vol-label").textContent = e.target.value + "%";
  musicPreviewSync();
});
$("music-vol").addEventListener("change", () => commit());
$("btn-music-remove").addEventListener("click", () => {
  project.music = null;
  commit(); updateProjectPanel(); musicPreviewSync();
});

/* ═══════════════════════ file browser modal ═══════════════════════ */

let browseCb = null, browseKind = "video";

async function browse(kind, title, cb) {
  browseKind = kind;
  browseCb = cb;
  $("browse-title").textContent = title;
  $("modal-browse").classList.remove("hidden");
  const start =
    localStorage.getItem("shortstack.dir." + kind) || CONFIG.home;
  // fall back to home if the remembered folder no longer exists
  if (!(await loadDir(start)) && start !== CONFIG.home) await loadDir(CONFIG.home);
}

async function loadDir(dir) {
  $("browse-list").innerHTML = ""; // no stale rows while loading
  $("browse-path").textContent = "Loading…";
  let data;
  try {
    data = await api("/api/browse", { dir, kind: browseKind === "dir" ? "video" : browseKind });
  } catch (e) {
    toast(e.message, true);
    $("browse-path").textContent = dir;
    return false;
  }
  localStorage.setItem("shortstack.dir." + browseKind, data.dir);
  $("browse-path").textContent = data.dir;
  const list = $("browse-list");
  list.innerHTML = "";

  if (browseKind === "dir") {
    const pick = document.createElement("div");
    pick.className = "browse-row pick-dir-row";
    pick.innerHTML = `<span>✓</span><span class="nm">Save into this folder</span>`;
    pick.onclick = () => { closeModal("modal-browse"); browseCb?.(data.dir); };
    list.appendChild(pick);
  }
  if (data.parent) {
    const up = document.createElement("div");
    up.className = "browse-row";
    up.innerHTML = `<span>⬆️</span><span class="nm">..</span>`;
    up.onclick = () => loadDir(data.parent);
    list.appendChild(up);
  }
  for (const d of data.dirs) {
    const el = document.createElement("div");
    el.className = "browse-row";
    el.innerHTML = `<span>📁</span>`;
    const nm = document.createElement("span");
    nm.className = "nm";
    nm.textContent = d.name;
    el.appendChild(nm);
    el.onclick = () => loadDir(d.path);
    list.appendChild(el);
  }
  if (browseKind !== "dir")
    for (const f of data.files) {
      const el = document.createElement("div");
      el.className = "browse-row";
      el.innerHTML = `<span>${browseKind === "audio" ? "🎵" : "🎞"}</span>`;
      const nm = document.createElement("span");
      nm.className = "nm";
      nm.textContent = f.name;
      el.appendChild(nm);
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = fmtSize(f.size);
      el.appendChild(meta);
      el.onclick = () => { closeModal("modal-browse"); browseCb?.(f.path); };
      list.appendChild(el);
    }
  /* shortcuts */
  const sc = $("browse-shortcuts");
  sc.innerHTML = "";
  for (const s of CONFIG.shortcuts) {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = s.name;
    b.onclick = () => loadDir(s.path);
    sc.appendChild(b);
  }
  return true;
}

function closeModal(id) {
  if (id === "modal-export" && exportJob) {
    toast("An export is running — cancel it first");
    return false;
  }
  $(id).classList.add("hidden");
  return true;
}
document.querySelectorAll(".modal-close").forEach((b) =>
  b.addEventListener("click", () => closeModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach((m) =>
  m.addEventListener("pointerdown", (e) => { if (e.target === m) closeModal(m.id); }));

/* ═══════════════════════ export ═══════════════════════ */

let exportJob = null, exportPoll = null;
let exportSize = { w: 1080, h: 1920 };

const MP4_V = ["h264", "hevc", "av1", "mpeg4"];
const MP4_A = ["aac", "mp3", "ac3", "eac3", "alac"];
function losslessOK() {
  if (!(project.segments.length === 1 &&
    project.segments[0].speed === 1 &&
    !project.segments[0].muted &&
    (project.segments[0].volume ?? 1) === 1 &&
    frameMode() === "original" &&
    !project.texts.length && !project.music)) return false;
  // source codecs must be remuxable into .mp4 (mirrors the server check)
  const info = probeSync(project.segments[0].file);
  if (!info?.video || !MP4_V.includes(info.video.codec)) return false;
  if (info.audio && !MP4_A.includes(info.audio.codec)) return false;
  return true;
}

async function openExport() {
  if (!project.segments.length) return;
  if (!CONFIG.ffmpeg) { toast("Install ffmpeg first (brew install ffmpeg)", true); return; }
  pause();
  showExportPane("form");
  $("modal-export").classList.remove("hidden");
  const total = totalDuration();
  const clips = project.segments.length;
  const stranded = project.texts.filter((t) => t.start >= total - 0.01).length;
  $("export-summary").textContent =
    `${fmtTime(total)} · ${clips} clip${clips > 1 ? "s" : ""}` +
    `${project.texts.length ? ` · ${project.texts.length} text` : ""}` +
    `${project.music ? " · music" : ""}` +
    (total > 180.5 ? "  ⚠ over the 3-minute Shorts limit" : "") +
    (stranded ? `  ⚠ ${stranded} text overlay${stranded > 1 ? "s start" : " starts"} after the video ends` : "");
  const canLossless = losslessOK();
  $("export-lossless").disabled = !canLossless;
  $("export-lossless").checked = false;
  $("lossless-row").style.opacity = canLossless ? "1" : ".45";
  const sizeDisabled = frameMode() === "original";
  document.querySelectorAll("#export-size button").forEach((b) => (b.disabled = sizeDisabled));
  try {
    const s = await apiPost("/api/suggest_output", { project });
    $("export-path").value = s.path;
  } catch (e) {}
}

function showExportPane(which) {
  for (const p of ["form", "progress", "done", "error"])
    $("export-" + p).classList.toggle("hidden", p !== which);
}

document.querySelectorAll("#export-size button").forEach((b) =>
  b.addEventListener("click", () => {
    document.querySelectorAll("#export-size button").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    exportSize = { w: +b.dataset.w, h: +b.dataset.h };
  })
);

$("btn-export-browse").addEventListener("click", () =>
  browse("dir", "Choose output folder", (dir) => {
    const cur = $("export-path").value;
    const name = cur.split(/[\\/]/).pop() || "short.mp4";
    $("export-path").value = dir + CONFIG.sep + name;
    $("modal-export").classList.remove("hidden");
  })
);

$("btn-export-start").addEventListener("click", async () => {
  if (exportJob) return; // an export is already running
  const outPath = $("export-path").value.trim();
  if (!outPath) { toast("Choose where to save", true); return; }
  const btn = $("btn-export-start");
  btn.disabled = true;
  try {
    const ex = await apiPost("/api/exists", { path: outPath });
    if (ex.exists && !confirm(`"${outPath.split(/[\\/]/).pop()}" already exists.\nOverwrite it?`))
      return;
    const res = await apiPost("/api/export", {
      project,
      output: {
        path: outPath,
        width: exportSize.w, height: exportSize.h,
        fps: +$("export-fps").value,
        crf: +$("export-crf").value,
        lossless: $("export-lossless").checked,
      },
    });
    exportJob = res.id;
    pollFails = 0;
    showExportPane("progress");
    $("progress-bar").style.width = "0%";
    $("progress-label").textContent = "Starting…";
    exportPoll = setInterval(pollExport, 500);
  } catch (e) {
    toast(e.message, true);
  } finally {
    btn.disabled = false;
  }
});

let pollFails = 0;
async function pollExport() {
  if (!exportJob) return;
  let st;
  try {
    st = await api("/api/export/status", { id: exportJob });
    pollFails = 0;
  } catch (e) {
    if (++pollFails >= 8) { // ~4s of failures: server gone or job lost
      clearInterval(exportPoll);
      exportPoll = null;
      exportJob = null;
      showExportPane("error");
      $("error-info").textContent =
        "Lost contact with the ShortStack server — is it still running?\n" + e.message;
    }
    return;
  }
  if (st.state === "running" || st.state === "queued") {
    const pct = Math.round(st.progress * 100);
    $("progress-bar").style.width = pct + "%";
    $("progress-label").textContent =
      `${pct}%${st.eta ? ` · about ${st.eta > 90 ? Math.ceil(st.eta / 60) + " min" : st.eta + " s"} left` : ""}`;
  } else {
    clearInterval(exportPoll);
    exportPoll = null;
    if (st.state === "done") {
      showExportPane("done");
      $("done-info").textContent =
        `${st.outPath}\n${fmtSize(st.outSize)} — ready to upload 🎉`;
      $("btn-reveal").onclick = () => apiPost("/api/reveal", { path: st.outPath }).catch(() => {});
    } else if (st.state === "error") {
      showExportPane("error");
      $("error-info").textContent = st.error || "Export failed";
    } else {
      showExportPane("form");
    }
    exportJob = null;
  }
}

$("btn-export-cancel").addEventListener("click", async () => {
  if (exportJob) await apiPost("/api/export/cancel", { id: exportJob }).catch(() => {});
});
$("btn-export-again").addEventListener("click", () => showExportPane("form"));
$("btn-export-back").addEventListener("click", () => showExportPane("form"));

/* ═══════════════════════ save / load project ═══════════════════════ */

$("btn-save").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const base = project.segments[0]?.file.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, "") || "project";
  a.download = base + ".shortstack.json";
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Project saved to Downloads");
});
$("btn-load").addEventListener("click", () => $("project-file-input").click());
$("project-file-input").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  e.target.value = "";
  if (!f) return;
  try {
    const p = JSON.parse(await f.text());
    if (!Array.isArray(p.segments)) throw new Error("not a ShortStack project");
    for (const s of p.segments) await ensureProbe(s.file);
    project = Object.assign(newProject(), p);
    undoStack = []; redoStack = []; histPrev = JSON.stringify(project);
    select(null);
    setProjectTime(0);
    ensureMediaLoaded();
    autosave();
    updateUndoButtons();
    refreshAll();
  } catch (err) {
    toast("Couldn't load project: " + err.message, true);
  }
});

/* ═══════════════════════ top bar + transport ═══════════════════════ */

const openVideoDialog = (append) =>
  browse("video", append ? "Add a clip" : "Open video", (path) => {
    if (!append && project.segments.length &&
        !confirm("Replace the current project with this video?\n(Use “＋ Add clip” to append instead.)"))
      return;
    openVideo(path, { append });
  });

$("btn-open").addEventListener("click", () => openVideoDialog(false));
$("btn-open2").addEventListener("click", () => openVideoDialog(false));
$("btn-add").addEventListener("click", () => openVideoDialog(true));
$("btn-undo").addEventListener("click", undo);
$("btn-redo").addEventListener("click", redo);
$("btn-export").addEventListener("click", openExport);
$("btn-help").addEventListener("click", () => $("modal-help").classList.remove("hidden"));
$("btn-play").addEventListener("click", () => (playing ? pause() : play()));
$("btn-prev").addEventListener("click", () => jumpCut(-1));
$("btn-next").addEventListener("click", () => jumpCut(1));
$("btn-split").addEventListener("click", splitAtPlayhead);
$("btn-delete").addEventListener("click", deleteSelected);
$("btn-add-text").addEventListener("click", addTextAtPlayhead);
$("preview-vol").addEventListener("input", (e) => {
  previewVol = +e.target.value / 100;
  const loc = locate(projTime);
  if (loc) applySegmentPlayback(project.segments[loc.index]);
  musicPreviewSync();
});

/* ═══════════════════════ keyboard ═══════════════════════ */

document.addEventListener("keydown", (e) => {
  if (tlDrag || cropDrag) return; // no edits while mid-drag — state would corrupt
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  const modalOpen = [...document.querySelectorAll(".modal")].some(
    (m) => !m.classList.contains("hidden"));

  if (e.key === "Escape") {
    if (modalOpen) document.querySelectorAll(".modal").forEach((m) => {
      if (!m.classList.contains("hidden")) closeModal(m.id);
    });
    else if (inField) document.activeElement.blur();
    else select(null);
    return;
  }
  if (inField || modalOpen) return;

  const meta = e.metaKey || e.ctrlKey;
  if (meta && e.key.toLowerCase() === "z") {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (meta && e.key.toLowerCase() === "e") { e.preventDefault(); openExport(); return; }
  if (meta && e.key.toLowerCase() === "s") {
    e.preventDefault();
    if (!$("btn-save").disabled) $("btn-save").click();
    return;
  }
  if (meta) return;

  switch (e.key) {
    case " ":
      e.preventDefault();
      playing ? pause() : play();
      break;
    case "s": case "S": e.preventDefault(); splitAtPlayhead(); break;
    case "Backspace": case "Delete": e.preventDefault(); deleteSelected(); break;
    case "t": case "T":
      // preventDefault so the keystroke doesn't leak into the auto-focused textarea
      e.preventDefault();
      addTextAtPlayhead();
      break;
    case "i": case "I": e.preventDefault(); trimToPlayhead("in"); break;
    case "o": case "O": e.preventDefault(); trimToPlayhead("out"); break;
    case "m": case "M": {
      e.preventDefault();
      const s = selClip();
      if (s) { s.muted = !s.muted; applySegmentPlayback(s); commit(); refreshAll(); }
      break;
    }
    case "ArrowLeft": case "ArrowRight": {
      e.preventDefault();
      pause();
      const loc = locate(projTime);
      const info = loc ? probeSync(project.segments[loc.index].file) : null;
      const fps = info?.video?.fps || 30;
      const stepSrc = e.shiftKey ? 1 : 1 / fps;
      const speed = loc ? project.segments[loc.index].speed : 1;
      setProjectTime(projTime + (e.key === "ArrowRight" ? 1 : -1) * stepSrc / speed);
      break;
    }
    case "ArrowUp": e.preventDefault(); jumpCut(-1); break;
    case "ArrowDown": e.preventDefault(); jumpCut(1); break;
    case "?": $("modal-help").classList.remove("hidden"); break;
  }
});

/* ═══════════════════════ boot ═══════════════════════ */

function renderRecents() {
  const holder = $("recent-list");
  holder.innerHTML = "";
  let recents = [];
  try { recents = JSON.parse(localStorage.getItem("shortstack.recents") || "[]"); } catch (e) {}
  for (const p of recents.slice(0, 4)) {
    const el = document.createElement("button");
    el.className = "recent-item";
    el.textContent = "🕘 " + p;
    el.onclick = () => openVideo(p);
    holder.appendChild(el);
  }
}

async function boot() {
  try {
    CONFIG = await api("/api/config");
  } catch (e) {
    toast("Can't reach the ShortStack server — restart it and reload.", true);
    return;
  }
  if (!CONFIG.ffmpeg) $("ffmpeg-warning").classList.remove("hidden");
  renderRecents();

  if (CONFIG.openFile) {
    await openVideo(CONFIG.openFile);
  } else {
    /* restore last session if its files still exist */
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("shortstack.last") || "null");
    } catch (e) {
      localStorage.removeItem("shortstack.last"); // corrupt JSON only
    }
    if (saved?.segments?.length) {
      const missing = [];
      for (const s of saved.segments) {
        try { await ensureProbe(s.file); }
        catch (e) { missing.push(s.file.split(/[\\/]/).pop()); }
      }
      if (missing.length) {
        // keep the autosave — the user may restore the file and reload
        toast(`Couldn't restore last session — missing: ${missing.join(", ")}. ` +
              `Put the file back and reload to recover it.`, true);
      } else {
        project = Object.assign(newProject(), saved);
        histPrev = JSON.stringify(project);
        setProjectTime(0);
        ensureMediaLoaded();
        toast("Restored your last session");
      }
    }
  }
  select(null);
  refreshAll();
  setProjectTime(projTime);
}

boot();
