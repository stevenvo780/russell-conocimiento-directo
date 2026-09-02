/*
  Motion token table for the deck.

  One source of truth for every duration, easing, stagger and travel distance.
  The same values are exposed as CSS custom properties (`--m-*` on `.deck-shell`)
  and consumed by framer transitions, so diagrams, chrome and slide bodies share
  one cadence. `compact` shortens and halves distances; `reduced` collapses to
  10 ms with zero travel and zero delays.
*/

export type MotionProfile = 'spatial' | 'compact' | 'reduced';
export type TransitionKind = 'opening' | 'within-act' | 'act-forward' | 'act-backward' | 'direct-jump';

export type Easing = [number, number, number, number];

export const EASE: Record<'out' | 'settle' | 'in' | 'inout', Easing> = {
  out: [0.22, 1, 0.36, 1],
  settle: [0.16, 1, 0.3, 1],
  in: [0.4, 0, 1, 1],
  inout: [0.65, 0, 0.35, 1],
};

export type MotionTokens = {
  /** Durations in milliseconds. */
  dXs: number;
  dS: number;
  dM: number;
  dL: number;
  dXl: number;
  /** Stagger between slide parts, in ms. */
  stagger: number;
  /** Stagger between title words (line-level only in compact), in ms. */
  staggerWord: number;
  /** A dramatic pause before something that deserves one, in ms. */
  beat: number;
  /** Horizontal travel of a slide within an act, in px. */
  travel: number;
  /** Vertical rise of a title / act turn, in px. */
  rise: number;
  /** Stagger between diagram nodes of one stage, in ms. */
  nodeStagger: number;
  /** Edge draw-on duration, in ms. */
  edgeDraw: number;
};

export const MOTION: Record<MotionProfile, MotionTokens> = {
  spatial: {
    dXs: 120,
    dS: 220,
    dM: 420,
    dL: 640,
    dXl: 900,
    stagger: 70,
    staggerWord: 90,
    beat: 240,
    travel: 46,
    rise: 28,
    nodeStagger: 110,
    edgeDraw: 520,
  },
  compact: {
    dXs: 90,
    dS: 160,
    dM: 300,
    dL: 420,
    dXl: 560,
    stagger: 50,
    staggerWord: 0,
    beat: 160,
    travel: 20,
    rise: 14,
    nodeStagger: 80,
    edgeDraw: 360,
  },
  reduced: {
    dXs: 10,
    dS: 10,
    dM: 10,
    dL: 10,
    dXl: 10,
    stagger: 0,
    staggerWord: 0,
    beat: 0,
    travel: 0,
    rise: 0,
    nodeStagger: 0,
    edgeDraw: 0,
  },
};

export function cssEase(easing: Easing) {
  return `cubic-bezier(${easing.join(', ')})`;
}

/** Milliseconds → seconds, for framer transitions. */
export function sec(ms: number) {
  return ms / 1000;
}

/** The `--m-*` custom properties for a profile, ready to spread onto a style object. */
export function motionVars(profile: MotionProfile): Record<`--m-${string}`, string> {
  const t = MOTION[profile];
  return {
    '--m-d-xs': `${t.dXs}ms`,
    '--m-d-s': `${t.dS}ms`,
    '--m-d-m': `${t.dM}ms`,
    '--m-d-l': `${t.dL}ms`,
    '--m-d-xl': `${t.dXl}ms`,
    '--m-stagger': `${t.stagger}ms`,
    '--m-stagger-word': `${t.staggerWord}ms`,
    '--m-beat': `${t.beat}ms`,
    '--m-travel': `${t.travel}px`,
    '--m-rise': `${t.rise}px`,
    '--m-node-stagger': `${t.nodeStagger}ms`,
    '--m-edge-draw': `${t.edgeDraw}ms`,
    '--m-ease-out': cssEase(EASE.out),
    '--m-ease-settle': cssEase(EASE.settle),
    '--m-ease-in': cssEase(EASE.in),
    '--m-ease-inout': cssEase(EASE.inout),
  };
}

/** Duration of the slide article's entrance, in ms (exposed as `data-slide-transition-ms`). */
export function slideTransitionMs(profile: MotionProfile, kind: TransitionKind) {
  if (profile === 'reduced') return 10;
  const isActTurn = kind === 'act-forward' || kind === 'act-backward';
  if (profile === 'compact') return isActTurn ? 350 : kind === 'direct-jump' ? 240 : 280;
  return isActTurn ? 560 : kind === 'direct-jump' ? 360 : 480;
}

/** Budget for the outgoing slide, in ms. The exit is dead time in `mode="wait"`, so it stays short. */
export function slideExitMs(profile: MotionProfile, kind: TransitionKind) {
  if (profile === 'reduced') return 10;
  const isActTurn = kind === 'act-forward' || kind === 'act-backward';
  if (profile === 'compact') return isActTurn ? 150 : kind === 'direct-jump' ? 80 : 110;
  return isActTurn ? 220 : kind === 'direct-jump' ? 110 : 150;
}

/** How long `data-deck-transitioning` stays on after a navigation (exit + entrance + a margin). */
export function transitioningMs(profile: MotionProfile, kind: TransitionKind) {
  if (profile === 'reduced') return 40;
  return slideExitMs(profile, kind) + slideTransitionMs(profile, kind) + MOTION[profile].stagger * 4 + 80;
}
