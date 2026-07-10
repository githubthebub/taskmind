import { useEffect } from 'react';

/**
 * Keep the screen awake while a practice session is active.
 *
 * A phone dimming and locking mid-kumbhaka is the app's worst interruption:
 * the pacing cues die with the tab and the user surfaces from a deep state
 * to a black screen. The Screen Wake Lock API prevents that.
 *
 * Everything here degrades silently: on browsers without the API (or when
 * the request is denied, e.g. low battery) practice simply proceeds without
 * the lock, exactly as before.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const wakeLock = (navigator as Partial<Navigator>).wakeLock;
    if (!wakeLock) return;

    let sentinel: WakeLockSentinel | null = null;
    let disposed = false;

    const acquire = async () => {
      try {
        const s = await wakeLock.request('screen');
        if (disposed) {
          void s.release().catch(() => {});
        } else {
          sentinel = s;
        }
      } catch {
        // Denied or unavailable — practice continues without the lock.
      }
    };

    // The OS releases the lock whenever the page is hidden (app switch,
    // notification shade); re-acquire when the user comes back.
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sentinel?.released !== false) {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', onVisibility);
      void sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [active]);
}

export default useWakeLock;
