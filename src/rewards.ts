/**
 * RewardGate — identity-priming vault.
 *
 * Motivational text bundles and generated calming-audio scripts are strictly
 * gated behind verified block-clearing milestones: a bundle renders only when
 * the vault's persisted lifetime clear count meets its threshold. There is no
 * bypass path — the gate re-verifies against persisted state on every render,
 * so editing the DOM or replaying events cannot unlock content early.
 */

const REWARD_BUNDLES: RewardBundle[] = [
  {
    id: 'b01-first-clear',
    requiredClears: 1,
    title: 'First Clear — Proof of Motion',
    lines: [
      'You just demonstrated the only skill that matters: starting.',
      'Identity note: you are someone who converts restlessness into structure.',
    ],
    audio: { baseHz: 110, beatHz: 4, seconds: 45 },
  },
  {
    id: 'b02-persistence',
    requiredClears: 5,
    title: 'Five Clears — The Persistence Layer',
    lines: [
      'Five patterns held in working memory and executed. That is trainable capacity, and you are training it.',
      'Identity note: you finish small things on purpose, which is how large things get finished by accident.',
    ],
    audio: { baseHz: 96, beatHz: 3, seconds: 60 },
  },
  {
    id: 'b03-deep-worker',
    requiredClears: 15,
    title: 'Fifteen Clears — Deep-Work Credentials',
    lines: [
      'Your arousal curve is spending real time in the balanced band. That state transfers to everything you touch.',
      'Identity note: you regulate first, then act. Calm is your operating posture, not your reward.',
    ],
    audio: { baseHz: 82, beatHz: 2.5, seconds: 75 },
  },
  {
    id: 'b04-practitioner',
    requiredClears: 40,
    title: 'Forty Clears — The Practitioner',
    lines: [
      'At this volume the game is no longer the point. You have built a reliable off-ramp from rumination into action.',
      'Identity note: the device is a tool you put down. The real work happens after you lock the screen.',
    ],
    audio: { baseHz: 72, beatHz: 2, seconds: 90 },
  },
];

class RewardGate {
  private vault: FocusVault;
  private audio: CalmAudio;
  private listEl: HTMLElement;
  onUnlock: ((bundle: RewardBundle) => void) | null = null;

  constructor(root: HTMLElement, vault: FocusVault, audio: CalmAudio) {
    this.vault = vault;
    this.audio = audio;
    this.listEl = root.querySelector('.reward-list') as HTMLElement;
  }

  /** Pure gate check, used by both the UI and the test harness. */
  static isUnlocked(bundle: RewardBundle, verifiedClears: number): boolean {
    return verifiedClears >= bundle.requiredClears;
  }

  /** Re-verify every bundle against persisted milestones and render. */
  refresh(): void {
    const clears = this.vault.totalPatternsCleared;
    const frag = document.createDocumentFragment();
    for (const bundle of REWARD_BUNDLES) {
      const unlocked = RewardGate.isUnlocked(bundle, clears);
      if (unlocked && !this.vault.unlockedBundleIds.includes(bundle.id)) {
        this.vault.markBundleUnlocked(bundle.id);
        if (this.onUnlock !== null) this.onUnlock(bundle);
      }
      frag.appendChild(this.renderBundle(bundle, unlocked, clears));
    }
    this.listEl.replaceChildren(frag);
  }

  private renderBundle(bundle: RewardBundle, unlocked: boolean, clears: number): HTMLElement {
    const card = document.createElement('article');
    card.className = `reward-card ${unlocked ? 'unlocked' : 'locked'}`;
    const h = document.createElement('h4');
    h.textContent = unlocked ? bundle.title : 'Locked bundle';
    card.appendChild(h);
    if (unlocked) {
      for (const line of bundle.lines) {
        const p = document.createElement('p');
        p.textContent = line;
        card.appendChild(p);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-secondary';
      btn.textContent = `Play calming audio (${bundle.audio.seconds}s)`;
      btn.addEventListener('click', () => {
        // Gate is re-verified at play time against persisted state.
        if (RewardGate.isUnlocked(bundle, this.vault.totalPatternsCleared)) {
          this.audio.playScript(bundle.audio);
        }
      });
      card.appendChild(btn);
    } else {
      const p = document.createElement('p');
      p.className = 'reward-locked-note';
      p.textContent = `Clear ${bundle.requiredClears - clears} more pattern${bundle.requiredClears - clears === 1 ? '' : 's'} to unlock.`;
      card.appendChild(p);
    }
    return card;
  }
}
