import { useEffect, useRef, useState } from 'react';

/*
  One motion governor for every JavaScript-driven loop in the deck.

  mode:
    'static' – the user prefers reduced motion or asked for Save-Data: loops never start.
    'off'    – the tab is hidden or an overlay is open: every running loop stops.
    'active' – input in the last few seconds: full frame budget.
    'idle'   – no input for a while: loops drop to a low frame rate.

  `static` outranks `off` because it is the user's durable preference; both mean
  "do not animate". The deck mirrors the mode as `data-motion-budget` on `.deck-shell`
  so CSS can pause looping keyframes.
*/

export type MotionBudgetMode = 'off' | 'static' | 'idle' | 'active';

export type MotionBudget = {
  mode: MotionBudgetMode;
  /** Suggested frame rate for a JS loop in this mode (0 when the loop must not run). */
  fps: number;
};

type Options = {
  overlayOpen?: boolean;
  /** Silence before `active` decays to `idle`, in ms. */
  idleAfterMs?: number;
};

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
const NARROW_QUERY = '(max-width: 680px)';

function readSaveData() {
  if (typeof navigator === 'undefined') return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(connection?.saveData);
}

function matches(query: string) {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

export function useMotionBudget({ overlayOpen = false, idleAfterMs = 6000 }: Options = {}): MotionBudget {
  const [reduced, setReduced] = useState(() => matches(REDUCED_QUERY));
  const [narrow, setNarrow] = useState(() => matches(NARROW_QUERY));
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden');
  const [active, setActive] = useState(true);
  const [saveData] = useState(readSaveData);
  const activeRef = useRef(true);
  const idleTimer = useRef<number | null>(null);
  const lastArmed = useRef(0);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const reducedMedia = window.matchMedia(REDUCED_QUERY);
    const narrowMedia = window.matchMedia(NARROW_QUERY);
    const syncReduced = () => setReduced(reducedMedia.matches);
    const syncNarrow = () => setNarrow(narrowMedia.matches);
    syncReduced();
    syncNarrow();
    reducedMedia.addEventListener('change', syncReduced);
    narrowMedia.addEventListener('change', syncNarrow);
    return () => {
      reducedMedia.removeEventListener('change', syncReduced);
      narrowMedia.removeEventListener('change', syncNarrow);
    };
  }, []);

  useEffect(() => {
    const syncVisibility = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', syncVisibility);
    return () => document.removeEventListener('visibilitychange', syncVisibility);
  }, []);

  useEffect(() => {
    // Pointer moves arrive every frame: the timer is re-armed at most twice a second.
    const armIdle = () => {
      const now = performance.now();
      if (idleTimer.current !== null && now - lastArmed.current < 500) return;
      lastArmed.current = now;
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        idleTimer.current = null;
        activeRef.current = false;
        setActive(false);
      }, idleAfterMs);
    };
    const wake = () => {
      // Only re-render when the mode actually flips; pointer moves are frequent.
      if (!activeRef.current) {
        activeRef.current = true;
        setActive(true);
      }
      armIdle();
    };
    armIdle();
    window.addEventListener('pointermove', wake, { passive: true });
    window.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('keydown', wake, { passive: true });
    window.addEventListener('touchstart', wake, { passive: true });
    return () => {
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      window.removeEventListener('pointermove', wake);
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
      window.removeEventListener('touchstart', wake);
    };
  }, [idleAfterMs]);

  if (reduced || saveData) return { mode: 'static', fps: 0 };
  if (!visible || overlayOpen) return { mode: 'off', fps: 0 };
  if (active) return { mode: 'active', fps: narrow ? 24 : 30 };
  return { mode: 'idle', fps: narrow ? 10 : 12 };
}
