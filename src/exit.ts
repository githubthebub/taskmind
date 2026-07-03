/**
 * ExitDirector — exit-driven UX.
 *
 * The application's terminal success state is the user *leaving it*. When the
 * behavioral engine reports a sustained BALANCED state with at least one
 * verified pattern clear this session, the director takes the foreground and
 * explicitly commands the transition: lock the device, move the regained
 * focus onto a real-world task. Dismissing the prompt is possible but the
 * prompt re-arms after a cooldown — the app never converts balance into more
 * screen time by default.
 */

class ExitDirector {
  private root: HTMLElement;
  private statsEl: HTMLElement;
  private cooldownUntil = 0;
  /** ms of sustained BALANCED residency required before prompting */
  static readonly SUSTAIN_MS = 45000;
  /** ms before a dismissed prompt is allowed to re-arm */
  static readonly COOLDOWN_MS = 120000;

  onExitConfirmed: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.statsEl = root.querySelector('.exit-stats') as HTMLElement;
    (root.querySelector('.exit-confirm') as HTMLButtonElement).addEventListener('click', () => {
      this.hide();
      if (this.onExitConfirmed !== null) this.onExitConfirmed();
    });
    (root.querySelector('.exit-dismiss') as HTMLButtonElement).addEventListener('click', () => {
      this.cooldownUntil = performance.now() + ExitDirector.COOLDOWN_MS;
      this.hide();
    });
  }

  get isVisible(): boolean {
    return this.root.classList.contains('visible');
  }

  /** Pure eligibility check, shared with the test harness. */
  static shouldPrompt(
    state: FocusStateId,
    residencyMs: number,
    patternsClearedThisSession: number,
    now: number,
    cooldownUntil: number,
  ): boolean {
    return (
      state === 'BALANCED' &&
      residencyMs >= ExitDirector.SUSTAIN_MS &&
      patternsClearedThisSession >= 1 &&
      now >= cooldownUntil
    );
  }

  maybePrompt(state: FocusStateId, residencyMs: number, patternsCleared: number, sessionMinutes: number): void {
    if (this.isVisible) return;
    if (!ExitDirector.shouldPrompt(state, residencyMs, patternsCleared, performance.now(), this.cooldownUntil)) {
      return;
    }
    this.statsEl.textContent =
      `${patternsCleared} pattern${patternsCleared === 1 ? '' : 's'} cleared · ` +
      `${Math.max(1, Math.round(sessionMinutes))} min session · balanced state held for ` +
      `${Math.round(residencyMs / 1000)}s`;
    this.root.classList.add('visible');
  }

  private hide(): void {
    this.root.classList.remove('visible');
  }
}
