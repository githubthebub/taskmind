/* taskmind somatic — session player.
 *
 * Spoken guidance uses the browser's SpeechSynthesis voices (all on-device
 * or built into the OS/browser — nothing is sent to us; there is no "us").
 * If no voice is available or the user mutes, the session runs as timed,
 * readable captions with the breath pacer.
 */

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const screens = { menu: $("#menu"), player: $("#player"), done: $("#done") };
  const orb = $("#orb");
  const phaseEl = $("#phase");
  const captionEl = $("#caption");
  const progressEl = $("#progress-fill");
  const pauseBtn = $("#pause-btn");
  const muteBtn = $("#mute-btn");
  const voiceSel = $("#voice-select");
  const rateInput = $("#rate-input");

  // ---------- player state ----------

  let runId = 0;          // bumped to cancel an in-flight session
  let paused = false;
  let muted = localStorage.getItem("tm-muted") === "1";
  let rate = parseFloat(localStorage.getItem("tm-rate") || "0.85");
  let elapsed = 0;        // seconds, for the progress bar
  let sessionTotal = 1;

  rateInput.value = String(rate);
  updateMuteBtn();

  class Cancelled extends Error {}

  function showScreen(name) {
    for (const [k, el] of Object.entries(screens)) el.classList.toggle("hidden", k !== name);
  }

  // Sleep that respects pause (clock freezes) and cancellation (throws).
  function wait(seconds, myRun, countsTowardProgress = true) {
    return new Promise((resolve, reject) => {
      let remaining = seconds * 1000;
      let last = performance.now();
      const tick = () => {
        if (myRun !== runId) return reject(new Cancelled());
        const now = performance.now();
        if (!paused) {
          const dt = now - last;
          remaining -= dt;
          if (countsTowardProgress) {
            elapsed += dt / 1000;
            progressEl.style.width = Math.min(100, (elapsed / sessionTotal) * 100) + "%";
          }
        }
        last = now;
        if (remaining <= 0) return resolve();
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  // ---------- voices ----------

  const synth = window.speechSynthesis || null;
  let voices = [];

  const PREFERRED = /aria|jenny|libby|sonia|natasha|samantha|serena|karen|moira|tessa|zira|female|natural/i;

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
    if (!voices.length) voices = synth.getVoices();
    voiceSel.innerHTML = "";
    if (!voices.length) {
      voiceSel.innerHTML = "<option value=''>No voices on this device — captions only</option>";
      return;
    }
    const saved = localStorage.getItem("tm-voice");
    let defaultIdx = voices.findIndex((v) => v.name === saved);
    if (defaultIdx < 0) defaultIdx = voices.findIndex((v) => PREFERRED.test(v.name));
    if (defaultIdx < 0) defaultIdx = 0;
    voices.forEach((v, i) => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `${v.name} (${v.lang})`;
      if (i === defaultIdx) opt.selected = true;
      voiceSel.appendChild(opt);
    });
  }

  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  } else {
    voiceSel.innerHTML = "<option value=''>Speech not supported — captions only</option>";
  }

  function currentVoice() {
    const i = parseInt(voiceSel.value, 10);
    return Number.isFinite(i) ? voices[i] : null;
  }

  // Resolves when the utterance finishes, errors, or is cancelled.
  function speak(text) {
    return new Promise((resolve) => {
      if (!synth || muted || !voices.length) return resolve(false);
      const u = new SpeechSynthesisUtterance(text);
      const v = currentVoice();
      if (v) u.voice = v;
      u.rate = rate;
      u.pitch = 1.0;
      u.onend = () => resolve(true);
      u.onerror = () => resolve(false);
      synth.speak(u);
    });
  }

  function estimateSeconds(text) {
    const words = text.split(/\s+/).length;
    return Math.max(2, (words / (2.6 * rate)));
  }

  async function waitWhilePaused(myRun) {
    while (paused) {
      if (myRun !== runId) throw new Cancelled();
      await new Promise((r) => setTimeout(r, 120));
    }
    if (myRun !== runId) throw new Cancelled();
  }

  // Speak a line; if the user pauses mid-line, the utterance is cancelled
  // and the whole line replays on resume.
  async function playLine(text, myRun) {
    captionEl.textContent = text;
    captionEl.classList.add("visible");
    do {
      await waitWhilePaused(myRun);
      const spokenStart = performance.now();
      const spoke = await speak(text);
      if (myRun !== runId) throw new Cancelled();
      if (!spoke) {
        await wait(estimateSeconds(text), myRun);
      } else if (!paused) {
        elapsed += (performance.now() - spokenStart) / 1000;
      }
    } while (paused && myRun === runId);
    if (myRun !== runId) throw new Cancelled();
  }

  function setOrb(scale, seconds) {
    orb.classList.remove("idle");
    orb.style.transitionDuration = seconds + "s";
    orb.style.transform = `scale(${scale})`;
  }

  function orbIdle() {
    orb.style.transitionDuration = "1.5s";
    orb.style.transform = "scale(1)";
    orb.classList.add("idle");
    phaseEl.textContent = "";
  }

  async function playBreath(breath, myRun) {
    captionEl.classList.remove("visible");
    for (let c = 0; c < breath.cycles; c++) {
      for (const phase of breath.phases) {
        await waitWhilePaused(myRun);
        phaseEl.textContent = phase.p;
        setOrb(phase.scale, phase.s);
        // Cues ride on top of the pacer for the first two cycles, then it
        // runs silent — the rhythm is in the body by then.
        if (phase.cue && c < 2) speak(phase.cue);
        await wait(phase.s, myRun);
      }
    }
    if (synth) synth.cancel();
    orbIdle();
  }

  function sessionSeconds(session) {
    let total = 0;
    for (const step of session.steps) {
      if (step.say) total += estimateSeconds(step.say) + (step.pause || 0);
      if (step.breath) total += step.breath.cycles * step.breath.phases.reduce((a, p) => a + p.s, 0);
    }
    return total;
  }

  async function runSession(session) {
    const myRun = ++runId;
    paused = false;
    elapsed = 0;
    sessionTotal = sessionSeconds(session);
    pauseBtn.textContent = "Pause";
    progressEl.style.width = "0%";
    document.documentElement.style.setProperty("--hue", session.hue);
    showScreen("player");
    orbIdle();

    let wakeLock = null;
    try { wakeLock = await navigator.wakeLock?.request("screen"); } catch (_) {}

    try {
      await wait(1.2, myRun, false);
      for (const step of session.steps) {
        if (step.say) {
          await playLine(step.say, myRun);
          captionEl.classList.remove("visible");
          await wait(step.pause || 2, myRun);
        }
        if (step.breath) {
          await playBreath(step.breath, myRun);
          await wait(1.5, myRun, false);
        }
      }
      progressEl.style.width = "100%";
      showScreen("done");
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    } finally {
      if (synth) synth.cancel();
      try { wakeLock?.release(); } catch (_) {}
    }
  }

  function stopSession() {
    runId++;
    paused = false;
    if (synth) synth.cancel();
  }

  // ---------- controls ----------

  function updateMuteBtn() {
    muteBtn.textContent = muted ? "Voice off" : "Voice on";
  }

  pauseBtn.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    if (paused && synth) synth.cancel();
  });

  muteBtn.addEventListener("click", () => {
    muted = !muted;
    localStorage.setItem("tm-muted", muted ? "1" : "0");
    if (muted && synth) synth.cancel();
    updateMuteBtn();
  });

  $("#end-btn").addEventListener("click", () => {
    stopSession();
    showScreen("menu");
  });

  $("#done-back").addEventListener("click", () => showScreen("menu"));

  voiceSel.addEventListener("change", () => {
    const v = currentVoice();
    if (v) localStorage.setItem("tm-voice", v.name);
  });

  rateInput.addEventListener("change", () => {
    rate = parseFloat(rateInput.value);
    localStorage.setItem("tm-rate", String(rate));
  });

  $("#voice-test").addEventListener("click", () => {
    if (synth) synth.cancel();
    speak("Let your shoulders drop away from your ears. And again — there's a second drop hiding under the first.");
  });

  // ---------- menu ----------

  const list = $("#session-list");
  for (const session of SESSIONS) {
    const card = document.createElement("button");
    card.className = "session-card";
    card.style.setProperty("--card-hue", session.hue);
    card.innerHTML = `
      <div class="row">
        <span class="title"></span>
        <span class="mins">${session.minutes} min</span>
      </div>
      <div class="tagline"></div>`;
    card.querySelector(".title").textContent = session.title;
    card.querySelector(".tagline").textContent = session.tagline;
    card.addEventListener("click", () => runSession(session));
    list.appendChild(card);
  }
})();
