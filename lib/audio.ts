// Minimal Web Audio API helper for ambient tones during sessions.
// Client-side only. AudioContext is created lazily on first user gesture
// (calling playTone or startBinaural) since browsers block autoplay.

let audioContext: AudioContext | null = null;

let binauralNodes: {
  left: OscillatorNode;
  right: OscillatorNode;
  leftPanner: StereoPannerNode;
  rightPanner: StereoPannerNode;
  gain: GainNode;
} | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }
  if (audioContext.state === "suspended") {
    // Must be called from within a user-gesture handler to succeed.
    void audioContext.resume();
  }
  return audioContext;
}

/** Play a single sine tone for durationMs, with a short fade in/out to avoid clicks. */
export function playTone(freq: number, durationMs: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = freq;

  const now = ctx.currentTime;
  const durationSec = durationMs / 1000;
  const fade = Math.min(0.05, durationSec / 4);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + fade);
  gain.gain.setValueAtTime(0.15, now + durationSec - fade);
  gain.gain.linearRampToValueAtTime(0, now + durationSec);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + durationSec);
}

/**
 * Start a binaural beat: one oscillator at baseFreq panned hard left,
 * one at baseFreq + beatFreq panned hard right. The perceived "beat"
 * is the difference between the two frequencies.
 */
export function startBinaural(baseFreq: number, beatFreq: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Avoid stacking multiple simultaneous binaural pairs.
  stopBinaural();

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);
  gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 1.5);

  const left = ctx.createOscillator();
  left.type = "sine";
  left.frequency.value = baseFreq;
  const leftPanner = ctx.createStereoPanner();
  leftPanner.pan.value = -1;
  left.connect(leftPanner);
  leftPanner.connect(gain);

  const right = ctx.createOscillator();
  right.type = "sine";
  right.frequency.value = baseFreq + beatFreq;
  const rightPanner = ctx.createStereoPanner();
  rightPanner.pan.value = 1;
  right.connect(rightPanner);
  rightPanner.connect(gain);

  left.start();
  right.start();

  binauralNodes = { left, right, leftPanner, rightPanner, gain };
}

export function stopBinaural(): void {
  if (!binauralNodes || !audioContext) {
    binauralNodes = null;
    return;
  }
  const { left, right, gain } = binauralNodes;
  const ctx = audioContext;
  const now = ctx.currentTime;

  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + 0.4);

  try {
    left.stop(now + 0.5);
    right.stop(now + 0.5);
  } catch {
    // already stopped
  }

  binauralNodes = null;
}

export function isBinauralPlaying(): boolean {
  return binauralNodes !== null;
}
