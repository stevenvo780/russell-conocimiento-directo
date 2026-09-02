import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { useMotionBudget } from '../hooks/useMotionBudget';
import { useStageArrival } from '../hooks/useStageArrival';
import {
  EASE,
  MOTION,
  type MotionProfile,
  motionVars,
  sec,
  slideExitMs,
  slideTransitionMs,
  type TransitionKind,
  transitioningMs,
} from '../motion';
import { slides } from '../slides';

type Overlay = 'index' | 'notes' | 'help' | null;
type HistoryMode = 'push' | 'replace' | 'none';
type NotesScale = 'compact' | 'comfortable' | 'large';
type SlideMotionContext = {
  travel: number;
  transition: TransitionKind;
  variant: string;
};
type VisualStageSpec = {
  key: string;
  label: string;
  threshold: number;
};
type NavigationOptions = {
  closeOverlay?: boolean;
  focusSlide?: boolean;
  history?: HistoryMode;
  reveal?: 'start' | 'end';
  skipReveals?: boolean;
};

const slideLabels: Record<string, string> = {
  pregunta: 'Pregunta inicial: ¿qué conozco cuando conozco una mesa?',
  portada: 'La arquitectura de lo ausente',
  arquitectura: 'Dos formas de conocer cosas',
  color: 'La presencia del color',
  mesa: 'El experimento de la mesa',
  inventario: 'Inventario de lo directamente conocido',
  yo: 'La cautela de Russell ante el yo',
  universales: 'La presencia de los universales',
  descripcion: 'La lógica de la descripción definida',
  ganador: 'Contacto e identificación',
  bismarck: 'Bismarck, nombres y distancia',
  principio: 'El principio fundamental',
  cautelas: 'Cuatro zonas de tensión',
  respuesta: 'Respuesta a la pregunta inicial',
};

const sections = [
  { id: 'apertura', label: 'Apertura', start: 0, end: 1 },
  { id: 'anclaje', label: 'El anclaje directo', start: 2, end: 7 },
  { id: 'distancia', label: 'La distancia descriptiva', start: 8, end: 10 },
  { id: 'alcance', label: 'El alcance y sus límites', start: 11, end: 13 },
] as const;

const visualStagePlans: Record<string, readonly VisualStageSpec[]> = {
  arquitectura: [
    { key: 'familias', label: 'Verdades y cosas', threshold: 1 },
    { key: 'vias', label: 'Directo y por descripción', threshold: 2 },
  ],
  mesa: [
    { key: 'datos', label: 'Datos sensoriales', threshold: 2 },
    { key: 'puente', label: 'Verdad puente', threshold: 3 },
    { key: 'objeto', label: 'Objeto físico descrito', threshold: 5 },
  ],
  inventario: [
    { key: 'presente-pasado', label: 'Sensación y memoria', threshold: 2 },
    { key: 'mente-universales', label: 'Introspección y universales', threshold: 4 },
    { key: 'yo-probable', label: 'El yo: tesis probable', threshold: 5 },
  ],
  yo: [
    { key: 'sujeto', label: 'El sujeto problemático', threshold: 1 },
    { key: 'relacion', label: 'Acto mental y dato sensorial', threshold: 3 },
    { key: 'limite', label: 'Límite: no un yo permanente', threshold: 4 },
  ],
  descripcion: [
    { key: 'existencia', label: '¿Existe algún F?', threshold: 1 },
    { key: 'unicidad', label: '¿Es el único F?', threshold: 2 },
    { key: 'resolucion', label: 'Referencia o fracaso', threshold: 3 },
  ],
  ganador: [
    { key: 'candidatos', label: 'Candidatos conocidos', threshold: 1 },
    { key: 'descripcion', label: 'La descripción «el ganador»', threshold: 2 },
    { key: 'identidad', label: 'Identidad todavía ignorada', threshold: 3 },
  ],
  bismarck: [
    { key: 'presentacion', label: 'Presentación posible', threshold: 1 },
    { key: 'testimonio', label: 'Mediación testimonial', threshold: 3 },
    { key: 'definicion', label: 'Conocimiento solo descriptivo', threshold: 5 },
  ],
  respuesta: [
    { key: 'directo', label: 'Directo: términos presentes', threshold: 1 },
    { key: 'verdades', label: 'Verdades de enlace', threshold: 2 },
    { key: 'alcance', label: 'Referencia: alcance ampliado', threshold: 4 },
  ],
};

const actNumerals = ['·', 'I', 'II', 'III'] as const;

function sectionFor(index: number) {
  return sections.find((section) => index >= section.start && index <= section.end) ?? sections[0];
}

function labelFor(index: number) {
  const slide = slides[index];
  return slideLabels[slide.id] ?? slide.eyebrow?.replace(/^\d+ · /, '') ?? slide.id;
}

function revealCountFor(index: number) {
  return visualStagesFor(index).length + Number(Boolean(slides[index].body));
}

function revealLabelFor(index: number, step: number) {
  if (step === 0) return 'Planteamiento';
  const slide = slides[index];
  const visualStages = visualStagesFor(index);
  if (slide.visual && step <= visualStages.length) return visualStages[step - 1].label;
  return 'Desarrollo';
}

function visualStagesFor(index: number): readonly VisualStageSpec[] {
  const slide = slides[index];
  if (!slide.visual) return [];
  return visualStagePlans[slide.id] ?? [{ key: 'completo', label: 'Diagrama completo', threshold: 9 }];
}

function transitionBetween(previousIndex: number, nextIndex: number): TransitionKind {
  const previousAct = sections.indexOf(sectionFor(previousIndex));
  const nextAct = sections.indexOf(sectionFor(nextIndex));
  if (nextAct > previousAct) return 'act-forward';
  if (nextAct < previousAct) return 'act-backward';
  if (Math.abs(nextIndex - previousIndex) > 1) return 'direct-jump';
  return 'within-act';
}

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${clock}` : clock;
}

function slideIndexFromHash(hash: string) {
  let id = hash.replace(/^#/, '');
  try {
    id = decodeURIComponent(id);
  } catch {
    return -1;
  }
  return slides.findIndex((slide) => slide.id === id);
}

function writeSlideHash(index: number, mode: Exclude<HistoryMode, 'none'>) {
  const target = `${window.location.pathname}${window.location.search}#${encodeURIComponent(slides[index].id)}`;
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` === target) return;
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](window.history.state, '', target);
}

function initialSlideIndex() {
  if (typeof window === 'undefined') return 0;
  const found = slideIndexFromHash(window.location.hash);
  return found >= 0 ? found : 0;
}

function useCompactMotion() {
  const query = '(max-width: 680px), (pointer: coarse)';
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  return compact;
}

/*
  Laser trail (interaction-06): the last samples of the pointer, in stage pixels,
  kept in a ring buffer and redrawn by a rAF loop that stops itself once every
  sample has faded. Samples closer than TRAIL_MIN_STEP px to the previous one are
  dropped so a resting pointer does not accumulate a blob.
*/
const TRAIL_CAPACITY = 32;
const TRAIL_LIFE_MS = 420;
const TRAIL_WIDTH = 8;
const TRAIL_MIN_STEP = 2;
const TRAIL_MAX_DPR = 1.5;

type TrailState = {
  samples: Float32Array;
  head: number;
  count: number;
  frame: number | null;
};

/* Chrome auto-hide in fullscreen (interaction-07). */
const CHROME_HIDE_MS = 2600;
const CHROME_WAKE_BAND_PX = 88;

export function PresentationPage() {
  const [index, setIndex] = useState(initialSlideIndex);
  const [direction, setDirection] = useState(1);
  const [revealStep, setRevealStep] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [transitionKind, setTransitionKind] = useState<TransitionKind>('opening');
  const [laserEnabled, setLaserEnabled] = useState(false);
  const [laserVisible, setLaserVisible] = useState(false);
  const [laserAnnouncement, setLaserAnnouncement] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [notesScale, setNotesScale] = useState<NotesScale>('comfortable');
  const [transitioning, setTransitioning] = useState(false);
  const [washTick, setWashTick] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const usesCompactMotion = useCompactMotion();
  const motionBudget = useMotionBudget({ overlayOpen: Boolean(overlay) });
  const indexRef = useRef(index);
  // The visual is held as state so the arrival hook runs on the commit that mounts it.
  const [visualElement, setVisualElement] = useState<HTMLDivElement | null>(null);
  // The footnote rail follows the slide once the outgoing one has left, not the keypress.
  const [railIndex, setRailIndex] = useState(index);
  const revealStepRef = useRef(revealStep);
  const touchOrigin = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const overlayPanel = useRef<HTMLElement>(null);
  const stage = useRef<HTMLElement>(null);
  const shell = useRef<HTMLElement>(null);
  const trailCanvas = useRef<HTMLCanvasElement>(null);
  const trail = useRef<TrailState>({
    samples: new Float32Array(TRAIL_CAPACITY * 3),
    head: 0,
    count: 0,
    frame: null,
  });
  const restoreFocus = useRef<HTMLElement | null>(null);
  const pendingStageFocus = useRef(false);
  const copyStatusTimer = useRef<number | null>(null);
  const timerAnchor = useRef(0);
  const overlayTitleId = useId();
  const slideTitleId = useId();
  const visualHintId = useId();
  const visualStageStatusId = useId();
  const current = slides[index];
  const currentLabel = labelFor(index);
  const currentSection = sectionFor(index);
  const currentSectionIndex = sections.indexOf(currentSection);
  const visualStages = visualStagesFor(index);
  const revealCount = revealCountFor(index);
  const visualRevealStep = current.visual ? 1 : null;
  const bodyRevealStep = current.body ? visualStages.length + 1 : null;
  const activeVisualStageIndex = current.visual && revealStep > 0
    ? Math.min(revealStep, visualStages.length) - 1
    : null;
  const activeVisualStage = activeVisualStageIndex === null ? null : visualStages[activeVisualStageIndex];
  const actProgress = (index - currentSection.start + 1) / (currentSection.end - currentSection.start + 1);
  const notesScales: NotesScale[] = ['compact', 'comfortable', 'large'];
  const notesScaleIndex = notesScales.indexOf(notesScale);
  const motionProfile: MotionProfile = prefersReducedMotion ? 'reduced' : usesCompactMotion ? 'compact' : 'spatial';
  const bodyArea: 'body' | 'foot' = current.visual && current.body ? 'foot' : 'body';
  const actNumeral = actNumerals[currentSectionIndex] ?? '·';
  const isActTurn = transitionKind === 'act-forward' || transitionKind === 'act-backward';
  const revealComplete = revealCount > 0 && revealStep === revealCount;
  const deckComplete = revealComplete && index === slides.length - 1;
  // The trail is a decoration on top of the dot: only run while the deck has a frame budget.
  const trailEnabled = laserEnabled && motionBudget.fps > 0;

  useStageArrival(visualElement, {
    slideId: current.id,
    threshold: activeVisualStage?.threshold ?? 0,
    stages: visualStages.map((stageSpec) => stageSpec.threshold),
    profile: motionProfile,
  });

  const updateRevealStep = useCallback((nextStep: number) => {
    const bounded = Math.max(0, Math.min(revealCountFor(indexRef.current), nextStep));
    revealStepRef.current = bounded;
    setRevealStep(bounded);
  }, []);

  const closeOverlay = useCallback(() => setOverlay(null), []);

  const openOverlay = useCallback((nextOverlay: Exclude<Overlay, null>) => {
    setOverlay(nextOverlay);
  }, []);

  const goTo = useCallback((nextIndex: number, options: NavigationOptions = {}) => {
    const {
      closeOverlay: shouldCloseOverlay = true,
      focusSlide = false,
      history = 'push',
      reveal = 'start',
    } = options;
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    const previousIndex = indexRef.current;

    if (focusSlide) pendingStageFocus.current = true;
    if (bounded !== previousIndex) {
      setDirection(bounded > previousIndex ? 1 : -1);
      setTransitionKind(transitionBetween(previousIndex, bounded));
      indexRef.current = bounded;
      const nextRevealStep = reveal === 'end' ? revealCountFor(bounded) : 0;
      revealStepRef.current = nextRevealStep;
      setRevealStep(nextRevealStep);
      setIndex(bounded);
      if (history !== 'none') writeSlideHash(bounded, history);
    } else if (reveal === 'end') {
      updateRevealStep(revealCountFor(bounded));
    } else if (focusSlide) {
      updateRevealStep(0);
    }
    if (shouldCloseOverlay) setOverlay(null);
  }, [updateRevealStep]);

  const previous = useCallback((options: NavigationOptions = {}) => {
    if (!options.skipReveals && revealStepRef.current > 0) {
      setDirection(-1);
      updateRevealStep(revealStepRef.current - 1);
      return;
    }
    goTo(indexRef.current - 1, { ...options, reveal: 'end' });
  }, [goTo, updateRevealStep]);

  const next = useCallback((options: NavigationOptions = {}) => {
    const availableReveals = revealCountFor(indexRef.current);
    if (!options.skipReveals && revealStepRef.current < availableReveals) {
      setDirection(1);
      updateRevealStep(revealStepRef.current + 1);
      return;
    }
    goTo(indexRef.current + 1, { ...options, reveal: 'start' });
  }, [goTo, updateRevealStep]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be denied by browser policy; navigation remains usable.
    }
  }, []);

  const toggleLaser = useCallback(() => {
    const nextActive = !laserEnabled;
    setLaserEnabled(nextActive);
    if (!nextActive) setLaserVisible(false);
    setLaserAnnouncement(
      nextActive
        ? 'Puntero láser activado. Muévelo dentro de la diapositiva.'
        : 'Puntero láser desactivado.',
    );
  }, [laserEnabled]);

  const clearTrail = useCallback(() => {
    const state = trail.current;
    if (state.frame !== null) {
      cancelAnimationFrame(state.frame);
      state.frame = null;
    }
    state.head = 0;
    state.count = 0;
    const canvas = trailCanvas.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawTrail = useCallback(() => {
    const state = trail.current;
    state.frame = null;
    const canvas = trailCanvas.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const { samples } = state;
    const now = performance.now();
    // Age out the oldest samples first; the loop ends once nothing is left to fade.
    while (state.count > 0) {
      const oldest = ((state.head - state.count + TRAIL_CAPACITY) % TRAIL_CAPACITY) * 3;
      if (now - samples[oldest + 2] > TRAIL_LIFE_MS) state.count -= 1;
      else break;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    // A lone sample draws nothing; it waits for the next one (or ages out above).
    if (state.count < 2) return;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    // Strokes are opaque so overlapping round caps never stack into beads; the
    // fade comes from scaling the colour toward black, which the canvas's
    // `mix-blend-mode: screen` renders as transparent. Oldest first, so each
    // newer (wider, brighter) cap covers the joint.
    const first = (state.head - state.count + TRAIL_CAPACITY) % TRAIL_CAPACITY;
    for (let i = 1; i < state.count; i += 1) {
      const from = ((first + i - 1) % TRAIL_CAPACITY) * 3;
      const to = ((first + i) % TRAIL_CAPACITY) * 3;
      const life = 1 - (now - samples[to + 2]) / TRAIL_LIFE_MS;
      if (life <= 0) continue;
      context.lineWidth = TRAIL_WIDTH * life;
      context.strokeStyle = `rgb(${Math.round(255 * life)}, ${Math.round(76 * life)}, ${Math.round(94 * life)})`;
      context.beginPath();
      context.moveTo(samples[from], samples[from + 1]);
      context.lineTo(samples[to], samples[to + 1]);
      context.stroke();
    }
    state.frame = requestAnimationFrame(drawTrail);
  }, []);

  const pushTrailSample = useCallback((x: number, y: number) => {
    const state = trail.current;
    const { samples } = state;
    if (state.count > 0) {
      const last = ((state.head - 1 + TRAIL_CAPACITY) % TRAIL_CAPACITY) * 3;
      if (Math.hypot(x - samples[last], y - samples[last + 1]) < TRAIL_MIN_STEP) return;
    }
    const slot = state.head * 3;
    samples[slot] = x;
    samples[slot + 1] = y;
    samples[slot + 2] = performance.now();
    state.head = (state.head + 1) % TRAIL_CAPACITY;
    state.count = Math.min(state.count + 1, TRAIL_CAPACITY);
    if (state.frame === null) state.frame = requestAnimationFrame(drawTrail);
  }, [drawTrail]);

  const moveLaser = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!laserEnabled || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - bounds.left;
    const py = event.clientY - bounds.top;
    const x = Math.max(0, Math.min(100, (px / bounds.width) * 100));
    const y = Math.max(0, Math.min(100, (py / bounds.height) * 100));
    event.currentTarget.style.setProperty('--laser-x', `${x.toFixed(2)}%`);
    event.currentTarget.style.setProperty('--laser-y', `${y.toFixed(2)}%`);
    setLaserVisible(true);
    if (trailEnabled) pushTrailSample(px, py);
  }, [laserEnabled, pushTrailSample, trailEnabled]);

  const startTimer = useCallback(() => {
    timerAnchor.current = Date.now() - timerSeconds * 1000;
    setTimerRunning(true);
  }, [timerSeconds]);

  const pauseTimer = useCallback(() => {
    setTimerSeconds(Math.max(0, Math.floor((Date.now() - timerAnchor.current) / 1000)));
    setTimerRunning(false);
  }, []);

  const resetTimer = useCallback(() => {
    timerAnchor.current = Date.now();
    setTimerRunning(false);
    setTimerSeconds(0);
  }, []);

  useEffect(() => {
    if (!timerRunning) return;
    const updateTimer = () => setTimerSeconds(Math.max(0, Math.floor((Date.now() - timerAnchor.current) / 1000)));
    updateTimer();
    const timer = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    const syncFromLocation = () => {
      const nextIndex = slideIndexFromHash(window.location.hash);
      if (nextIndex < 0) {
        writeSlideHash(indexRef.current, 'replace');
        return;
      }

      const previousIndex = indexRef.current;
      if (nextIndex === previousIndex) return;
      setDirection(nextIndex > previousIndex ? 1 : -1);
      setTransitionKind(transitionBetween(previousIndex, nextIndex));
      indexRef.current = nextIndex;
      revealStepRef.current = 0;
      setRevealStep(0);
      pendingStageFocus.current = true;
      setIndex(nextIndex);
      setOverlay(null);
    };

    if (slideIndexFromHash(window.location.hash) < 0) writeSlideHash(indexRef.current, 'replace');
    window.addEventListener('popstate', syncFromLocation);
    window.addEventListener('hashchange', syncFromLocation);
    return () => {
      window.removeEventListener('popstate', syncFromLocation);
      window.removeEventListener('hashchange', syncFromLocation);
    };
  }, []);

  // While a slide moves, the chrome that sits over the stage drops its backdrop blur
  // (motion-10) and the act wash is issued once per act turn (motion-4).
  useEffect(() => {
    setTransitioning(true);
    const timer = window.setTimeout(() => setTransitioning(false), transitioningMs(motionProfile, transitionKind));
    const railTimer = window.setTimeout(() => setRailIndex(index), slideExitMs(motionProfile, transitionKind));
    if (isActTurn && motionProfile !== 'reduced') setWashTick((tick) => tick + 1);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(railTimer);
    };
    // Deliberately keyed on the index only: kind and act flag are set in the same batch.
  }, [index]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Trail canvas: sized to the stage (device pixels, capped DPR) while the trail is
  // enabled; resizing the bitmap also clears it. Off → cleared and idle.
  useEffect(() => {
    if (!trailEnabled) {
      clearTrail();
      return;
    }
    const canvas = trailCanvas.current;
    const host = stage.current;
    if (!canvas || !host) return;
    const size = () => {
      const bounds = host.getBoundingClientRect();
      const dpr = Math.min(TRAIL_MAX_DPR, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(bounds.width * dpr));
      canvas.height = Math.max(1, Math.round(bounds.height * dpr));
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      trail.current.head = 0;
      trail.current.count = 0;
    };
    size();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(size) : null;
    observer?.observe(host);
    if (!observer) window.addEventListener('resize', size);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', size);
      clearTrail();
    };
  }, [clearTrail, trailEnabled]);

  // The slide moves under the trail: a stroke must not outlive the thing it circled.
  useEffect(() => {
    clearTrail();
  }, [clearTrail, index]);

  // Chrome auto-hide in fullscreen (interaction-07): after a silence the header and
  // footer slide out and the cursor hides; any key, pointer press or focus landing
  // in the chrome brings them back. With the laser on, only the top/bottom bands
  // wake the chrome so pointing at the slide does not keep it awake. The chrome is
  // never aria-hidden while hidden: it stays in the tree and :focus-within reveals it.
  useEffect(() => {
    if (!isFullscreen || overlay) {
      setChromeHidden(false);
      return;
    }
    const host = shell.current;
    if (!host) return;
    let timer: number | null = null;
    let frame: number | null = null;
    let pointerY = 0;
    const arm = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        setChromeHidden(true);
      }, CHROME_HIDE_MS);
    };
    const wake = () => {
      setChromeHidden(false);
      arm();
    };
    const handlePointerMove = (event: PointerEvent) => {
      pointerY = event.clientY;
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const inBand = pointerY < CHROME_WAKE_BAND_PX || pointerY > window.innerHeight - CHROME_WAKE_BAND_PX;
        if (!laserEnabled || inBand) wake();
      });
    };
    host.addEventListener('pointermove', handlePointerMove, { passive: true });
    host.addEventListener('pointerdown', wake, { passive: true });
    host.addEventListener('focusin', wake);
    window.addEventListener('keydown', wake, { passive: true });
    arm();
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      if (frame !== null) window.cancelAnimationFrame(frame);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerdown', wake);
      host.removeEventListener('focusin', wake);
      window.removeEventListener('keydown', wake);
    };
  }, [isFullscreen, laserEnabled, overlay]);

  useEffect(() => () => {
    if (copyStatusTimer.current !== null) window.clearTimeout(copyStatusTimer.current);
  }, []);

  useEffect(() => {
    if (overlay) {
      if (!restoreFocus.current && document.activeElement instanceof HTMLElement) {
        restoreFocus.current = document.activeElement;
      }
      const frame = window.requestAnimationFrame(() => {
        // Keyboard users may already have tabbed into the panel during this frame; do not steal that focus.
        if (overlayPanel.current?.contains(document.activeElement)) return;
        const firstFocusable = overlayPanel.current?.querySelector<HTMLElement>(
          'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        );
        (firstFocusable ?? overlayPanel.current)?.focus();
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (!pendingStageFocus.current) restoreFocus.current?.focus();
    restoreFocus.current = null;
  }, [overlay]);

  useEffect(() => {
    if (overlay || !pendingStageFocus.current) return;
    const frame = window.requestAnimationFrame(() => {
      stage.current?.focus({ preventScroll: true });
      pendingStageFocus.current = false;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [index, overlay]);

  const copyDeepLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    if (copyStatusTimer.current !== null) window.clearTimeout(copyStatusTimer.current);
    copyStatusTimer.current = window.setTimeout(() => setCopyStatus('idle'), 2400);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (overlay) {
        if (event.key === 'Escape') {
          event.preventDefault();
          closeOverlay();
          return;
        }

        if (event.key === 'Tab' && overlayPanel.current) {
          const focusable = Array.from(
            overlayPanel.current.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
            ),
          );
          const first = focusable[0];
          const last = focusable.at(-1);
          const active = document.activeElement;
          if (!first || !last) {
            event.preventDefault();
            overlayPanel.current.focus();
          } else if (!overlayPanel.current.contains(active)) {
            // Focus is still outside the dialog (e.g. on the now-inert opener): wrap into it.
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          } else if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (target?.closest('a, button, input, textarea, select, summary, [contenteditable="true"]')) return;

      const key = event.key.toLowerCase();
      if (key === 'escape' && laserEnabled) {
        event.preventDefault();
        toggleLaser();
      } else if (key === 'l') {
        event.preventDefault();
        toggleLaser();
      } else if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) {
        event.preventDefault();
        next();
      } else if (['arrowleft', 'arrowup', 'pageup', 'k'].includes(key)) {
        event.preventDefault();
        previous();
      } else if (key === 'j') {
        event.preventDefault();
        next();
      } else if (key === 'home') {
        event.preventDefault();
        goTo(0);
      } else if (key === 'end') {
        event.preventDefault();
        goTo(slides.length - 1);
      } else if (key === 'f') {
        event.preventDefault();
        void toggleFullscreen();
      } else if (key === 'o' || key === 'i') {
        event.preventDefault();
        setOverlay((active) => (active === 'index' ? null : 'index'));
      } else if (key === 's' || key === 'n') {
        event.preventDefault();
        setOverlay((active) => (active === 'notes' ? null : 'notes'));
      } else if (key === '?') {
        event.preventDefault();
        setOverlay((active) => (active === 'help' ? null : 'help'));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [closeOverlay, goTo, laserEnabled, next, overlay, previous, toggleFullscreen, toggleLaser]);

  const progress = ((index + 1) / slides.length) * 100;
  const tokens = MOTION[motionProfile];
  const isReducedProfile = motionProfile === 'reduced';
  const isActTurnKind = (kind: TransitionKind) => kind === 'act-forward' || kind === 'act-backward';
  const dur = (ms: number) => (isReducedProfile ? 0.01 : sec(ms));

  // The slide article orchestrates its parts (motion-2 / motion-4 / motion-9):
  // within an act it steps sideways, an act turn rises and settles, a jump is a cut.
  // Children stagger in reading order and release in reverse on exit.
  const variants = useMemo(
    () => ({
      enter: ({ travel, transition }: SlideMotionContext) => {
        const sign = travel > 0 ? 1 : -1;
        if (isReducedProfile) return { opacity: 0, x: 0, y: 0, scale: 1 };
        if (transition === 'opening') return { opacity: 1, x: 0, y: 0, scale: 1 };
        if (isActTurnKind(transition)) return { opacity: 1, x: 0, y: sign * tokens.rise * 1.4, scale: 0.97 };
        if (transition === 'direct-jump') return { opacity: 0, x: 0, y: 0, scale: 0.985 };
        return { opacity: 1, x: sign * tokens.travel, y: 0, scale: 1 };
      },
      center: ({ transition }: SlideMotionContext) => ({
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        transition: {
          duration: sec(slideTransitionMs(motionProfile, transition)),
          ease: isActTurnKind(transition) ? EASE.settle : EASE.out,
          delayChildren: isReducedProfile ? 0 : transition === 'opening' ? 0.45 : isActTurnKind(transition) ? 0.08 : 0.02,
          staggerChildren: sec(transition === 'direct-jump' ? Math.min(tokens.stagger, 40) : tokens.stagger),
        },
      }),
      exit: ({ travel, transition }: SlideMotionContext) => {
        const sign = travel > 0 ? 1 : -1;
        const orchestration = {
          duration: sec(slideExitMs(motionProfile, transition)),
          ease: EASE.in,
          staggerChildren: isReducedProfile || transition === 'direct-jump' ? 0 : 0.02,
          staggerDirection: -1,
        };
        if (isReducedProfile) return { opacity: 0, x: 0, y: 0, scale: 1, transition: orchestration };
        if (isActTurnKind(transition)) return { opacity: 0, x: 0, y: -sign * tokens.rise * 1.2, scale: 1.02, transition: orchestration };
        if (transition === 'direct-jump') return { opacity: 0, x: 0, y: 0, scale: 1.012, transition: orchestration };
        return { opacity: 0, x: -sign * tokens.travel * 0.7, y: 0, scale: 1, transition: orchestration };
      },
    }),
    [motionProfile], // tokens and dur derive from the profile
  );

  // Slide parts share the article's variant keys so they inherit its orchestration.
  // Question and cover titles are opacity-only: their words carry the motion (agent S).
  const wordsCarryTitle = current.variant === 'question' || current.variant === 'cover';
  const parts = useMemo(() => {
    const rise = tokens.rise;
    const titleRise = wordsCarryTitle ? 0 : rise;
    return {
      eyebrow: {
        enter: { opacity: 0, y: rise * 0.3 },
        center: { opacity: 1, y: 0, transition: { duration: dur(tokens.dS), ease: EASE.out } },
        exit: { opacity: 0, y: 0, transition: { duration: dur(tokens.dXs), ease: EASE.in } },
      },
      title: {
        enter: { opacity: 0, y: titleRise },
        center: { opacity: 1, y: 0, transition: { duration: dur(tokens.dL), ease: EASE.settle } },
        exit: { opacity: 0, y: -titleRise * 0.36, transition: { duration: dur(tokens.dS * 0.6), ease: EASE.in } },
      },
      subtitle: {
        enter: { opacity: 0, y: rise * 0.45 },
        center: { opacity: 1, y: 0, transition: { duration: dur(tokens.dM), ease: EASE.out } },
        exit: { opacity: 0, y: -rise * 0.3, transition: { duration: dur(tokens.dS * 0.6), ease: EASE.in } },
      },
      visual: {
        enter: { opacity: 0, y: rise * 0.5, scale: isReducedProfile ? 1 : 0.985 },
        center: { opacity: 1, y: 0, scale: 1, transition: { duration: dur(tokens.dM), ease: EASE.out } },
        exit: { opacity: 0, y: 0, scale: isReducedProfile ? 1 : 0.985, transition: { duration: dur(tokens.dS * 0.6), ease: EASE.in } },
      },
      body: {
        enter: { opacity: 0, y: rise * 0.5 },
        center: { opacity: 1, y: 0, transition: { duration: dur(tokens.dM), ease: EASE.out } },
        exit: { opacity: 0, y: -rise * 0.2, transition: { duration: dur(tokens.dS * 0.6), ease: EASE.in } },
      },
    };
  }, [motionProfile, wordsCarryTitle]); // tokens and dur derive from the profile

  // The gutter numeral rises on act turns (and once on the opening); it never moves within an act.
  const folioVariants = useMemo(
    () => ({
      enter: ({ travel, transition }: SlideMotionContext) => ({
        opacity: 0,
        y: transition === 'opening' ? tokens.rise * 1.2 : (travel > 0 ? 1 : -1) * tokens.rise * 1.2,
      }),
      center: ({ transition }: SlideMotionContext) => ({
        opacity: 1,
        y: 0,
        transition: {
          duration: dur(tokens.dL),
          ease: EASE.settle,
          delay: isReducedProfile ? 0 : transition === 'opening' ? 0.25 : 0.42,
        },
      }),
      exit: ({ travel }: SlideMotionContext) => ({
        opacity: 0,
        y: -(travel > 0 ? 1 : -1) * tokens.rise * 0.8,
        transition: { duration: dur(tokens.dS), ease: EASE.in },
      }),
    }),
    [motionProfile], // tokens and dur derive from the profile
  );

  // Serif folio counter: the number rolls like an odometer in the travel direction.
  const counterVariants = useMemo(
    () => ({
      enter: (travel: number) => ({ y: isReducedProfile ? 0 : travel > 0 ? '100%' : '-100%', opacity: 0 }),
      center: { y: 0, opacity: 1, transition: { duration: dur(tokens.dS), ease: EASE.out } },
      exit: (travel: number) => ({
        y: isReducedProfile ? 0 : travel > 0 ? '-100%' : '100%',
        opacity: 0,
        transition: { duration: dur(tokens.dS), ease: EASE.in },
      }),
    }),
    [motionProfile], // tokens and dur derive from the profile
  );

  const motionContext: SlideMotionContext = {
    travel: direction,
    transition: transitionKind,
    variant: current.variant ?? 'split',
  };
  const slideTransitionDurationMs = slideTransitionMs(motionProfile, transitionKind);
  const railSlide = slides[Math.min(railIndex, slides.length - 1)];

  return (
    <main
      ref={shell}
      id="main-content"
      className="deck-shell"
      aria-label="Presentación: La arquitectura de lo ausente"
      data-deck-act={currentSection.id}
      data-deck-act-index={currentSectionIndex + 1}
      data-deck-transition={transitionKind}
      data-deck-variant={current.variant ?? 'split'}
      data-motion-profile={motionProfile}
      data-motion-budget={motionBudget.mode}
      data-slide-transition-ms={slideTransitionDurationMs}
      data-deck-travel={direction > 0 ? 'forward' : 'backward'}
      data-deck-transitioning={transitioning ? 'true' : 'false'}
      data-deck-complete={deckComplete ? 'true' : 'false'}
      data-laser-enabled={laserEnabled ? 'true' : 'false'}
      data-chrome-hidden={chromeHidden ? 'true' : 'false'}
      style={{
        '--deck-progress': `${progress}%`,
        '--act-progress': actProgress,
        ...motionVars(motionProfile),
      } as CSSProperties}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        if ((event.target as HTMLElement).closest('a, button, .deck-overlay, .slide-visual, [data-deck-swipe="ignore"]')) {
          touchOrigin.current = null;
          return;
        }
        touchOrigin.current = { x: event.clientX, y: event.clientY, startedAt: performance.now() };
      }}
      onPointerUp={(event) => {
        if (!touchOrigin.current || event.pointerType !== 'touch') return;
        const dx = event.clientX - touchOrigin.current.x;
        const dy = event.clientY - touchOrigin.current.y;
        const elapsed = performance.now() - touchOrigin.current.startedAt;
        touchOrigin.current = null;
        const swipeThreshold = Math.min(84, Math.max(54, window.innerWidth * 0.12));
        if (elapsed < 1400 && Math.abs(dx) > swipeThreshold && Math.abs(dx) > Math.abs(dy) * 1.25) {
          if (dx < 0) next();
          else previous();
        }
      }}
      onPointerCancel={() => { touchOrigin.current = null; }}
    >
      <div className="deck-ambient" aria-hidden="true">
        <div className="deck-orbit orbit-direct" />
        <div className="deck-orbit orbit-reference" />
        <div className="deck-grid" />
        {washTick > 0 && (
          <div
            key={washTick}
            className="deck-act-wash"
            data-direction={direction > 0 ? 'forward' : 'backward'}
            onAnimationEnd={() => setWashTick(0)}
          />
        )}
      </div>

      <header className="deck-header" inert={Boolean(overlay)} aria-hidden={overlay ? true : undefined}>
        <Link to="/" className="deck-brand" aria-label="Volver al inicio">
          <span className="brand-mark" aria-hidden="true"><i /><i /><b /></span>
          <span>Russell · capítulo 5</span>
        </Link>
        <div className="deck-quick-actions">
          <button type="button" onClick={() => openOverlay('index')} aria-label="Abrir índice de diapositivas" aria-keyshortcuts="O I">
            Índice <kbd>O</kbd>
          </button>
          <button type="button" onClick={() => openOverlay('notes')} aria-label="Abrir notas del ponente" aria-keyshortcuts="S N">
            Notas <kbd>S</kbd>
          </button>
          <button
            type="button"
            className="deck-laser-toggle"
            onClick={toggleLaser}
            aria-label={laserEnabled ? 'Desactivar puntero láser' : 'Activar puntero láser'}
            aria-keyshortcuts="L"
            aria-pressed={laserEnabled}
          >
            {laserEnabled ? 'Láser activo' : 'Láser'} <kbd>L</kbd>
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
            aria-keyshortcuts="F"
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? 'Salir' : 'Pantalla'} <kbd>F</kbd>
          </button>
          <button
            type="button"
            className="deck-help"
            onClick={() => openOverlay('help')}
            aria-label="Mostrar ayuda de navegación"
            aria-keyshortcuts="?"
          >
            Ayuda <kbd>?</kbd>
          </button>
        </div>
      </header>

      <section
        ref={stage}
        className="deck-stage"
        tabIndex={-1}
        inert={Boolean(overlay)}
        aria-hidden={overlay ? true : undefined}
        aria-roledescription="diapositiva"
        aria-label={`Diapositiva ${index + 1} de ${slides.length}: ${currentLabel}. Sección ${currentSection.label}`}
        data-section={currentSection.label}
        data-slide-id={current.id}
        data-act={currentSection.id}
        data-act-index={currentSectionIndex + 1}
        data-act-numeral={actNumeral}
        data-slide-variant={current.variant ?? 'split'}
        data-transition={transitionKind}
        data-motion-profile={motionProfile}
        data-travel={direction > 0 ? 'forward' : 'backward'}
        data-reveal-step={revealStep}
        data-reveal-max={revealCount}
        data-laser-visible={laserEnabled && laserVisible ? 'true' : 'false'}
        onPointerMove={moveLaser}
        onPointerLeave={() => setLaserVisible(false)}
      >
        <canvas ref={trailCanvas} className="deck-laser-trail" aria-hidden="true" />
        <div className="deck-act-folio" aria-hidden="true">
          <AnimatePresence custom={motionContext}>
            <motion.div
              key={currentSection.id}
              className="deck-act-mark"
              custom={motionContext}
              variants={folioVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <b className="deck-act-numeral">{actNumeral}</b>
              <span className="deck-act-name">{currentSection.label}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <span className="deck-laser" aria-hidden="true">
          <i className="deck-laser-core" />
          <i className="deck-laser-aura" />
        </span>
        <AnimatePresence mode="wait" custom={motionContext}>
          <motion.article
            key={current.id}
            className={`deck-slide ${current.variant === 'visual' ? 'slide-variant-visual' : `slide-${current.variant ?? 'split'}`}`}
            custom={motionContext}
            variants={variants}
            data-foot={bodyArea === 'foot' ? 'true' : undefined}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <header className="slide-head">
              {current.eyebrow && <motion.p className="slide-eyebrow" variants={parts.eyebrow}>{current.eyebrow}</motion.p>}
              <motion.h1 id={slideTitleId} variants={parts.title}>{current.title}</motion.h1>
              {current.subtitle && <motion.div className="slide-subtitle" variants={parts.subtitle}>{current.subtitle}</motion.div>}
            </header>
            <AnimatePresence>
              {current.visual && activeVisualStage && visualRevealStep !== null && revealStep >= visualRevealStep && (
                <motion.div
                  key={`${current.id}-visual`}
                  ref={setVisualElement}
                  className="slide-visual"
                  data-slide={current.id}
                  variants={parts.visual}
                  exit={parts.visual.exit}
                  tabIndex={0}
                  role="region"
                  data-deck-swipe="ignore"
                  data-visual-stage={activeVisualStageIndex === null ? undefined : activeVisualStageIndex + 1}
                  data-visual-stage-max={visualStages.length}
                  data-semantic-threshold={activeVisualStage.threshold}
                  data-semantic-state={activeVisualStage.key}
                  aria-label={`Diagrama de «${currentLabel}». Etapa ${activeVisualStageIndex === null ? 1 : activeVisualStageIndex + 1} de ${visualStages.length}: ${activeVisualStage.label}`}
                  aria-describedby={`${visualHintId} ${visualStageStatusId}`}
                >
                  <span id={visualHintId} className="slide-visual-hint">
                    <span aria-hidden="true">↔</span> Desliza para explorar el diagrama
                  </span>
                  <span
                    id={visualStageStatusId}
                    className="visual-stage-status sr-only"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    Etapa visual {activeVisualStageIndex === null ? 1 : activeVisualStageIndex + 1} de {visualStages.length}: {activeVisualStage.label}.
                  </span>
                  <div
                    key={activeVisualStage.key}
                    className="visual-stage-cue"
                    data-state={activeVisualStage.key}
                    aria-hidden="true"
                    style={{ '--stage-fill': ((activeVisualStageIndex ?? 0) + 1) / visualStages.length } as CSSProperties}
                  >
                    <i className="visual-stage-ruler">
                      {visualStages.map((stageSpec, stageIndex) => (
                        <b
                          key={stageSpec.key}
                          data-state={stageIndex < (activeVisualStageIndex ?? 0) ? 'complete' : stageIndex === (activeVisualStageIndex ?? 0) ? 'current' : 'upcoming'}
                        />
                      ))}
                    </i>
                    <span className="visual-stage-cue-index">
                      <b>{String((activeVisualStageIndex ?? 0) + 1).padStart(2, '0')}</b> / {String(visualStages.length).padStart(2, '0')}
                    </span>
                    <strong className="visual-stage-cue-label"><i>{activeVisualStage.label}</i></strong>
                  </div>
                  {current.visual}
                </motion.div>
              )}
              {current.body && bodyRevealStep !== null && revealStep >= bodyRevealStep && (
                <motion.div
                  key={`${current.id}-body`}
                  className="slide-body"
                  data-area={bodyArea}
                  variants={parts.body}
                  exit={parts.body.exit}
                >
                  {current.body}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        </AnimatePresence>
        <figure
          className="deck-source-rail"
          data-source-page={railSlide.citation.page}
          data-state={railIndex === index ? 'settled' : 'leaving'}
          aria-label={`Cita textual de Bertrand Russell, capítulo 5, página ${railSlide.citation.page}`}
        >
          <blockquote key={`${railSlide.id}-quote`}>{railSlide.citation.quote}</blockquote>
          <figcaption key={`${railSlide.id}-caption`}>Russell · cap. 5 · p. {railSlide.citation.page}</figcaption>
        </figure>
      </section>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Diapositiva {index + 1} de {slides.length}: {currentLabel}. Sección {currentSection.label}.
        {revealCount > 0 && ` Paso ${revealStep + 1} de ${revealCount + 1}.`}
      </div>
      <span className="sr-only" role="status" aria-live="polite">{laserAnnouncement}</span>

      <footer
        className="deck-footer"
        inert={Boolean(overlay)}
        aria-hidden={overlay ? true : undefined}
        data-reveal-complete={revealComplete ? 'true' : 'false'}
      >
        <button
          type="button"
          className="deck-arrow"
          onClick={() => previous()}
          disabled={index === 0 && revealStep === 0}
          aria-label={
            revealStep > 0
              ? `Retroceder desde «${revealLabelFor(index, revealStep)}» hacia «${revealLabelFor(index, revealStep - 1)}»`
              : index === 0
                ? 'No hay una diapositiva anterior'
                : `Anterior: ${labelFor(index - 1)}`
          }
          title={revealStep > 0 ? `Volver a ${revealLabelFor(index, revealStep - 1)}` : index === 0 ? undefined : labelFor(index - 1)}
        >
          <span aria-hidden="true">←</span><small>anterior</small>
        </button>
        <div className="deck-progress-wrap">
          <ol
            className="deck-reveal-steps"
            aria-label={`Secuencia de revelado: paso ${revealStep + 1} de ${revealCount + 1}`}
          >
            {Array.from({ length: revealCount + 1 }, (_, step) => {
              const state = step < revealStep ? 'complete' : step === revealStep ? 'current' : 'upcoming';
              return (
                <li key={`${current.id}-reveal-${step}`}>
                  <button
                    type="button"
                    data-state={state}
                    aria-current={step === revealStep ? 'step' : undefined}
                    aria-label={`Paso ${step + 1} de ${revealCount + 1}: ${revealLabelFor(index, step)}`}
                    onClick={() => {
                      setDirection(step >= revealStepRef.current ? 1 : -1);
                      updateRevealStep(step);
                    }}
                  >
                    <i aria-hidden="true" />
                    <span>{revealLabelFor(index, step)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div
            className="deck-progress"
            role="progressbar"
            aria-label="Progreso de la presentación"
            aria-valuemin={1}
            aria-valuemax={slides.length}
            aria-valuenow={index + 1}
            aria-valuetext={`Diapositiva ${index + 1} de ${slides.length}; ${currentSection.label}${revealCount > 0 ? `; paso ${revealStep + 1} de ${revealCount + 1}` : ''}`}
          >
            {sections.map((section) => {
              const state = index > section.end ? 'done' : index >= section.start ? 'current' : 'todo';
              const fill = state === 'done' ? 1 : state === 'current' ? (index + 1 - section.start) / (section.end - section.start + 1) : 0;
              return (
                <i
                  key={section.id}
                  aria-hidden="true"
                  data-segment={section.id}
                  data-state={state}
                  style={{ '--fill': fill } as CSSProperties}
                />
              );
            })}
          </div>
          <span className="deck-folio" title={`${currentSection.label} · ${currentLabel}`}>
            <small className="deck-current-section">{currentSection.label}</small>
            <span className="deck-folio-count">
              <span className="deck-counter">
                <AnimatePresence mode="popLayout" initial={false} custom={direction}>
                  <motion.b
                    key={index}
                    custom={direction}
                    variants={counterVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </motion.b>
                </AnimatePresence>
              </span>
              {' '}/ {String(slides.length).padStart(2, '0')}
            </span>
          </span>
        </div>
        <button
          type="button"
          className="deck-arrow"
          onClick={() => next()}
          disabled={index === slides.length - 1 && revealStep === revealCount}
          aria-label={
            revealStep < revealCount
              ? `Revelar: ${revealLabelFor(index, revealStep + 1)}`
              : index === slides.length - 1
                ? 'No hay una diapositiva siguiente'
                : `Siguiente: ${labelFor(index + 1)}`
          }
          title={revealStep < revealCount ? `Revelar ${revealLabelFor(index, revealStep + 1)}` : index === slides.length - 1 ? undefined : labelFor(index + 1)}
        >
          <small>siguiente</small><span aria-hidden="true">→</span>
        </button>
      </footer>

      <AnimatePresence>
        {overlay && (
          <motion.div
            className="deck-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby={overlayTitleId}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeOverlay();
            }}
          >
            <motion.section
              ref={overlayPanel}
              tabIndex={-1}
              className={`overlay-panel overlay-${overlay}`}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: 14, scale: 0.99 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
            >
              <header>
                <div>
                  <span className="overlay-kicker">La arquitectura de lo ausente</span>
                  <h2 id={overlayTitleId}>{overlay === 'index' ? 'Índice' : overlay === 'notes' ? 'Notas del ponente' : 'Atajos'}</h2>
                </div>
                <button type="button" onClick={closeOverlay} aria-label="Cerrar panel">×</button>
              </header>

              {overlay === 'index' && (
                <div className="deck-overview">
                  <p className="overview-status">
                    Estás en <strong>{currentLabel}</strong>, dentro de <span>{currentSection.label}</span>.
                    Selecciona cualquier etapa para continuar desde allí.
                  </p>
                  <nav className="overview-sections" aria-label="Actos de la exposición">
                    {sections.map((section, sectionIndex) => (
                      <button
                        key={section.label}
                        type="button"
                        className={section.label === currentSection.label ? 'is-active' : ''}
                        data-act={section.id}
                        aria-current={section.label === currentSection.label ? 'location' : undefined}
                        onClick={() => goTo(section.start, { focusSlide: true })}
                      >
                        <b aria-hidden="true">{actNumerals[sectionIndex]}</b>
                        <span>{section.label}</span>
                        <small>{section.end - section.start + 1} diapositivas</small>
                      </button>
                    ))}
                  </nav>
                  <div className="slide-index-grid" aria-label="Todas las diapositivas">
                    {slides.map((slide, slideIndex) => {
                      const slideSection = sectionFor(slideIndex);
                      const slideLabel = labelFor(slideIndex);
                      return (
                        <button
                          key={slide.id}
                          type="button"
                          className={slideIndex === index ? 'is-active' : ''}
                          data-act={slideSection.id}
                          aria-current={slideIndex === index ? 'step' : undefined}
                          aria-label={`Ir a la diapositiva ${slideIndex + 1}: ${slideLabel}`}
                          onClick={() => goTo(slideIndex, { focusSlide: true })}
                        >
                          <span>{String(slideIndex + 1).padStart(2, '0')}</span>
                          <strong>{slideLabel}</strong>
                          <small>{slideSection.label}</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {overlay === 'notes' && (
                <div
                  className="speaker-notes"
                  data-note-scale={notesScale}
                  data-timer-state={timerRunning ? 'running' : timerSeconds > 0 ? 'paused' : 'ready'}
                >
                  <section className="speaker-console" aria-label="Consola del expositor">
                    <div className="speaker-console-context">
                      <span>{currentSection.label}</span>
                      <strong>Diapositiva {index + 1} de {slides.length}</strong>
                    </div>
                    <div className="speaker-timer">
                      <span>Tiempo de exposición</span>
                      <time
                        dateTime={`PT${timerSeconds}S`}
                        data-running={timerRunning ? 'true' : 'false'}
                        aria-label={`Tiempo transcurrido: ${formatTimer(timerSeconds)}`}
                      >
                        {formatTimer(timerSeconds)}
                      </time>
                      <div className="speaker-timer-controls" aria-label="Controles del temporizador">
                        <button type="button" onClick={startTimer} disabled={timerRunning} aria-label="Iniciar temporizador">
                          Iniciar
                        </button>
                        <button type="button" onClick={pauseTimer} disabled={!timerRunning} aria-label="Pausar temporizador">
                          Pausar
                        </button>
                        <button
                          type="button"
                          onClick={resetTimer}
                          disabled={!timerRunning && timerSeconds === 0}
                          aria-label="Reiniciar temporizador"
                        >
                          Reiniciar
                        </button>
                      </div>
                    </div>
                    <div className="speaker-note-scale" aria-label="Tamaño del texto de las notas">
                      <span>Texto {notesScale === 'compact' ? '90%' : notesScale === 'large' ? '115%' : '100%'}</span>
                      <button
                        type="button"
                        disabled={notesScaleIndex === 0}
                        aria-label="Reducir tamaño del texto de las notas"
                        onClick={() => setNotesScale(notesScales[Math.max(0, notesScaleIndex - 1)])}
                      >
                        A−
                      </button>
                      <button
                        type="button"
                        disabled={notesScaleIndex === notesScales.length - 1}
                        aria-label="Aumentar tamaño del texto de las notas"
                        onClick={() => setNotesScale(notesScales[Math.min(notesScales.length - 1, notesScaleIndex + 1)])}
                      >
                        A+
                      </button>
                    </div>
                  </section>
                  <div className="speaker-script">
                    <span>Guion de esta diapositiva</span>
                    <h3>{currentLabel}</h3>
                    <section className="speaker-evidence" aria-labelledby={`speaker-evidence-${current.id}`}>
                      <header>
                        <h4 id={`speaker-evidence-${current.id}`}>Pasaje de apoyo</h4>
                        <cite>Russell · capítulo 5 · p. {current.citation.page}</cite>
                      </header>
                      <blockquote>{current.citation.quote}</blockquote>
                      <p><strong>Qué demuestra:</strong> {current.citation.support}</p>
                    </section>
                    {current.notes}
                  </div>
                  <aside className="speaker-next-cue" aria-label="Próxima diapositiva">
                    <span>{index === slides.length - 1 ? 'Cierre' : 'A continuación'}</span>
                    <strong>
                      {index === slides.length - 1
                        ? 'Fin del recorrido · volver a la conversación'
                        : labelFor(index + 1)}
                    </strong>
                  </aside>
                  <div className="speaker-controls" aria-label="Controles de las notas">
                    <button
                      type="button"
                      onClick={() => previous({ closeOverlay: false, skipReveals: true })}
                      disabled={index === 0}
                      aria-label="Ver notas de la diapositiva anterior"
                    >
                      ← Anterior
                    </button>
                    <button type="button" onClick={() => void copyDeepLink()}>
                      {copyStatus === 'copied' ? 'Enlace copiado' : copyStatus === 'failed' ? 'No se pudo copiar' : 'Copiar enlace'}
                    </button>
                    <button
                      type="button"
                      onClick={() => next({ closeOverlay: false, skipReveals: true })}
                      disabled={index === slides.length - 1}
                      aria-label="Ver notas de la diapositiva siguiente"
                    >
                      Siguiente →
                    </button>
                  </div>
                  <span className="sr-only" role="status" aria-live="polite">
                    {copyStatus === 'copied' ? 'Enlace profundo copiado al portapapeles.' : copyStatus === 'failed' ? 'No fue posible copiar el enlace.' : ''}
                  </span>
                </div>
              )}

              {overlay === 'help' && (
                <dl className="shortcut-list">
                  <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Navegar</dd></div>
                  <div><dt><kbd>J</kbd> <kbd>K</kbd></dt><dd>Avanzar / retroceder</dd></div>
                  <div><dt><kbd>Espacio</kbd></dt><dd>Avanzar</dd></div>
                  <div><dt><kbd>O</kbd> / <kbd>I</kbd></dt><dd>Índice</dd></div>
                  <div><dt><kbd>S</kbd> / <kbd>N</kbd></dt><dd>Notas</dd></div>
                  <div><dt><kbd>L</kbd></dt><dd>Activar / desactivar puntero láser</dd></div>
                  <div><dt><kbd>F</kbd></dt><dd>Pantalla completa</dd></div>
                  <div><dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Inicio / final</dd></div>
                  <div><dt><kbd>Esc</kbd></dt><dd>Cerrar panel</dd></div>
                  <div><dt><kbd>Deslizar</kbd></dt><dd>Navegar en móvil</dd></div>
                </dl>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
