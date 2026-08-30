import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { slides } from '../slides';

type Overlay = 'index' | 'notes' | 'help' | null;
type HistoryMode = 'push' | 'replace' | 'none';
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
  { label: 'Apertura', start: 0, end: 1 },
  { label: 'El anclaje directo', start: 2, end: 7 },
  { label: 'La distancia descriptiva', start: 8, end: 10 },
  { label: 'El alcance y sus límites', start: 11, end: 13 },
] as const;

function sectionFor(index: number) {
  return sections.find((section) => index >= section.start && index <= section.end) ?? sections[0];
}

function labelFor(index: number) {
  const slide = slides[index];
  return slideLabels[slide.id] ?? slide.eyebrow?.replace(/^\d+ · /, '') ?? slide.id;
}

function revealCountFor(index: number) {
  return Number(Boolean(slides[index].visual)) + Number(Boolean(slides[index].body));
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

export function PresentationPage() {
  const [index, setIndex] = useState(initialSlideIndex);
  const [direction, setDirection] = useState(1);
  const [revealStep, setRevealStep] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const prefersReducedMotion = useReducedMotion();
  const indexRef = useRef(index);
  const revealStepRef = useRef(revealStep);
  const touchOrigin = useRef<{ x: number; y: number; startedAt: number } | null>(null);
  const overlayPanel = useRef<HTMLElement>(null);
  const stage = useRef<HTMLElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const pendingStageFocus = useRef(false);
  const copyStatusTimer = useRef<number | null>(null);
  const overlayTitleId = useId();
  const slideTitleId = useId();
  const visualHintId = useId();
  const current = slides[index];
  const currentLabel = labelFor(index);
  const currentSection = sectionFor(index);
  const revealCount = revealCountFor(index);
  const visualRevealStep = current.visual ? 1 : null;
  const bodyRevealStep = current.body ? (current.visual ? 2 : 1) : null;

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

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => () => {
    if (copyStatusTimer.current !== null) window.clearTimeout(copyStatusTimer.current);
  }, []);

  useEffect(() => {
    if (overlay) {
      if (!restoreFocus.current && document.activeElement instanceof HTMLElement) {
        restoreFocus.current = document.activeElement;
      }
      const frame = window.requestAnimationFrame(() => {
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
          if (!first || !last) {
            event.preventDefault();
            overlayPanel.current.focus();
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (target?.closest('a, button, input, textarea, select, summary, [contenteditable="true"], [data-deck-keyboard="local"]')) return;

      const key = event.key.toLowerCase();
      if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) {
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
  }, [closeOverlay, goTo, next, overlay, previous, toggleFullscreen]);

  const progress = ((index + 1) / slides.length) * 100;
  const variants = useMemo(
    () => ({
      enter: (travel: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : travel > 0 ? 46 : -46, scale: prefersReducedMotion ? 1 : 0.985 }),
      center: { opacity: 1, x: 0, scale: 1 },
      exit: (travel: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : travel > 0 ? -34 : 34, scale: prefersReducedMotion ? 1 : 0.99 }),
    }),
    [prefersReducedMotion],
  );

  return (
    <main
      id="main-content"
      className="deck-shell"
      aria-label="Presentación: La arquitectura de lo ausente"
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
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Entrar en pantalla completa'}
            aria-keyshortcuts="F"
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? 'Salir' : 'Pantalla'} <kbd>F</kbd>
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
        data-reveal-step={revealStep}
        data-reveal-max={revealCount}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={current.id}
            className={`deck-slide ${current.variant === 'visual' ? 'slide-variant-visual' : `slide-${current.variant ?? 'split'}`}`}
            custom={direction}
            variants={variants}
            layout={!prefersReducedMotion}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: prefersReducedMotion ? 0.01 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.eyebrow && <p className="slide-eyebrow">{current.eyebrow}</p>}
            <h1 id={slideTitleId}>{current.title}</h1>
            {current.subtitle && <div className="slide-subtitle">{current.subtitle}</div>}
            <AnimatePresence initial={false}>
              {current.visual && visualRevealStep !== null && revealStep >= visualRevealStep && (
                <motion.div
                  key={`${current.id}-visual`}
                  className="slide-visual"
                  tabIndex={0}
                  role="region"
                  data-deck-keyboard="local"
                  data-deck-swipe="ignore"
                  aria-label={`Diagrama de «${currentLabel}»`}
                  aria-describedby={visualHintId}
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.32 }}
                >
                  <span id={visualHintId} className="slide-visual-hint">
                    <span aria-hidden="true">↔</span> Desliza para explorar el diagrama
                  </span>
                  {current.visual}
                </motion.div>
              )}
              {current.body && bodyRevealStep !== null && revealStep >= bodyRevealStep && (
                <motion.div
                  key={`${current.id}-body`}
                  className="slide-body"
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
                  transition={{ duration: prefersReducedMotion ? 0.01 : 0.28 }}
                >
                  {current.body}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.article>
        </AnimatePresence>
      </section>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Diapositiva {index + 1} de {slides.length}: {currentLabel}. Sección {currentSection.label}.
        {revealCount > 0 && ` Paso ${revealStep + 1} de ${revealCount + 1}.`}
      </div>

      <footer className="deck-footer" inert={Boolean(overlay)} aria-hidden={overlay ? true : undefined}>
        <button
          type="button"
          className="deck-arrow"
          onClick={() => previous()}
          disabled={index === 0 && revealStep === 0}
          aria-label={
            revealStep > 0
              ? 'Ocultar el último elemento revelado'
              : index === 0
                ? 'No hay una diapositiva anterior'
                : `Anterior: ${labelFor(index - 1)}`
          }
          title={revealStep > 0 ? 'Retroceder un paso' : index === 0 ? undefined : labelFor(index - 1)}
        >
          <span aria-hidden="true">←</span><small>anterior</small>
        </button>
        <div className="deck-progress-wrap">
          <div
            className="deck-progress"
            role="progressbar"
            aria-label="Progreso de la presentación"
            aria-valuemin={1}
            aria-valuemax={slides.length}
            aria-valuenow={index + 1}
            aria-valuetext={`Diapositiva ${index + 1} de ${slides.length}; ${currentSection.label}${revealCount > 0 ? `; paso ${revealStep + 1} de ${revealCount + 1}` : ''}`}
          >
            <i aria-hidden="true" style={{ width: `${progress}%` }} />
          </div>
          <span title={`${currentSection.label} · ${currentLabel}`}>
            <small className="deck-current-section">
              {currentSection.label}{revealCount > 0 ? ` · ${revealStep + 1}/${revealCount + 1}` : ''}
            </small>{' '}
            <b>{String(index + 1).padStart(2, '0')}</b> / {String(slides.length).padStart(2, '0')}
          </span>
        </div>
        <button
          type="button"
          className="deck-arrow"
          onClick={() => next()}
          disabled={index === slides.length - 1 && revealStep === revealCount}
          aria-label={
            revealStep < revealCount
              ? `Revelar ${visualRevealStep !== null && revealStep < visualRevealStep ? 'el diagrama' : 'la siguiente idea'}`
              : index === slides.length - 1
                ? 'No hay una diapositiva siguiente'
                : `Siguiente: ${labelFor(index + 1)}`
          }
          title={revealStep < revealCount ? 'Revelar el siguiente paso' : index === slides.length - 1 ? undefined : labelFor(index + 1)}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) closeOverlay();
            }}
          >
            <motion.section
              ref={overlayPanel}
              tabIndex={-1}
              className={`overlay-panel overlay-${overlay}`}
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.99 }}
              transition={{ duration: prefersReducedMotion ? 0.01 : 0.24 }}
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
                    {sections.map((section) => (
                      <button
                        key={section.label}
                        type="button"
                        className={section.label === currentSection.label ? 'is-active' : ''}
                        aria-current={section.label === currentSection.label ? 'location' : undefined}
                        onClick={() => goTo(section.start, { focusSlide: true })}
                      >
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
                <div className="speaker-notes">
                  <span>Diapositiva {index + 1} de {slides.length}</span>
                  <h3>{currentLabel}</h3>
                  {current.notes}
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
                  <div><dt><kbd>F</kbd></dt><dd>Pantalla completa</dd></div>
                  <div><dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Inicio / final</dd></div>
                  <div><dt><kbd>Esc</kbd></dt><dd>Cerrar panel</dd></div>
                  <div><dt>Deslizar</dt><dd>Navegar en móvil</dd></div>
                </dl>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        className="deck-help"
        inert={Boolean(overlay)}
        aria-hidden={overlay ? true : undefined}
        onClick={() => openOverlay('help')}
        aria-label="Mostrar ayuda de navegación"
        aria-keyshortcuts="?"
      >
        ?
      </button>
    </main>
  );
}
