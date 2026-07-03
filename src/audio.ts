/**
 * CalmAudio — fully generated calming audio via WebAudio.
 * No samples, no fetches: every sound is synthesized on-device from
 * oscillators (a warm drone with a slow binaural-style beat and a
 * breathing-paced amplitude swell).
 */

class CalmAudio {
  private ctx: AudioContext | null = null;
  private activeNodes: { stop(): void }[] = [];

  private ensureCtx(): AudioContext | null {
    if (typeof AudioContext === 'undefined') return null;
    if (this.ctx === null) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  get playing(): boolean {
    return this.activeNodes.length > 0;
  }

  /** Play a generated calming drone described by a reward bundle's audio script. */
  playScript(script: { baseHz: number; beatHz: number; seconds: number }): void {
    const ctx = this.ensureCtx();
    if (ctx === null) return;
    this.stop();

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const now = ctx.currentTime;
    const end = now + script.seconds;
    // Gentle fade in / out so the drone never clicks.
    master.gain.linearRampToValueAtTime(0.16, now + 2);
    master.gain.setValueAtTime(0.16, end - 2);
    master.gain.linearRampToValueAtTime(0, end);

    const oscA = ctx.createOscillator();
    oscA.type = 'sine';
    oscA.frequency.value = script.baseHz;
    const oscB = ctx.createOscillator();
    oscB.type = 'sine';
    oscB.frequency.value = script.baseHz + script.beatHz;

    // Slow amplitude swell at a resting-breath cadence (~6 breaths/min).
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.1;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);

    oscA.connect(master);
    oscB.connect(master);
    oscA.start(now);
    oscB.start(now);
    lfo.start(now);
    oscA.stop(end);
    oscB.stop(end);
    lfo.stop(end);

    const handle = {
      stop: () => {
        try {
          oscA.stop();
          oscB.stop();
          lfo.stop();
        } catch {
          /* already stopped */
        }
        master.disconnect();
      },
    };
    this.activeNodes.push(handle);
    oscA.onended = () => {
      this.activeNodes = this.activeNodes.filter((n) => n !== handle);
      master.disconnect();
    };
  }

  /** Short soft cue tone used by the breathing guide at phase changes. */
  cue(freqHz: number): void {
    const ctx = this.ensureCtx();
    if (ctx === null) return;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freqHz;
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  stop(): void {
    for (const node of this.activeNodes) node.stop();
    this.activeNodes = [];
  }
}
