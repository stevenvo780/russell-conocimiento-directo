import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { slides } from '../slides';

type Overlay = 'index' | 'notes' | 'help' | null;

function initialSlideIndex() {
  if (typeof window === 'undefined') return 0;
  const id = window.location.hash.replace(/^#/, '');
  const found = slides.findIndex((slide) => slide.id === id);
  return found >= 0 ? found : 0;
}

export function PresentationPage() {
  const [index, setIndex] = useState(initialSlideIndex);
  const [direction, setDirection] = useState(1);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const touchOrigin = useRef<{ x: number; y: number } | null>(null);
  const overlayPanel = useRef<HTMLElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const overlayTitleId = useId();
  const current = slides[index];

  const closeOverlay = useCallback(() => setOverlay(null), []);

  const openOverlay = useCallback((nextOverlay: Exclude<Overlay, null>) => {
    setOverlay(nextOverlay);
  }, []);

  const goTo = useCallback((nextIndex: number) => {
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    setIndex((previous) => {
      setDirection(bounded >= previous ? 1 : -1);
      return bounded;
    });
    setOverlay(null);
  }, []);

  const previous = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen can be denied by browser policy; navigation remains usable.
    }
  }, []);

  useEffect(() => {
    window.history.replaceState(null, '', `${window.location.pathname}#${current.id}`);
  }, [current.id]);

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

    restoreFocus.current?.focus();
    restoreFocus.current = null;
  }, [overlay]);

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

      if (target?.closest('a, button, input, textarea, select, summary, [contenteditable="true"], [role="region"]')) return;

      const key = event.key.toLowerCase();
      if (['arrowright', 'arrowdown', 'pagedown', ' '].includes(key)) {
        event.preventDefault();
        next();
      } else if (['arrowleft', 'arrowup', 'pageup'].includes(key)) {
        event.preventDefault();
        previous();
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
      enter: (travel: number) => ({ opacity: 0, x: travel > 0 ? 46 : -46, scale: 0.985 }),
      center: { opacity: 1, x: 0, scale: 1 },
      exit: (travel: number) => ({ opacity: 0, x: travel > 0 ? -34 : 34, scale: 0.99 }),
    }),
    [],
  );

  return (
    <main
      id="main-content"
      className="deck-shell"
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return;
        if ((event.target as HTMLElement).closest('.slide-visual')) {
          touchOrigin.current = null;
          return;
        }
        touchOrigin.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        if (!touchOrigin.current || event.pointerType !== 'touch') return;
        const dx = event.clientX - touchOrigin.current.x;
        const dy = event.clientY - touchOrigin.current.y;
        touchOrigin.current = null;
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.25) {
          if (dx < 0) next();
          else previous();
        }
      }}
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
          <button type="button" onClick={() => openOverlay('index')} aria-label="Abrir índice de diapositivas">
            Índice <kbd>O</kbd>
          </button>
          <button type="button" onClick={() => openOverlay('notes')} aria-label="Abrir notas del ponente">
            Notas <kbd>S</kbd>
          </button>
          <button type="button" onClick={() => void toggleFullscreen()} aria-label="Alternar pantalla completa">
            Pantalla <kbd>F</kbd>
          </button>
        </div>
      </header>

      <section className="deck-stage" inert={Boolean(overlay)} aria-hidden={overlay ? true : undefined} aria-roledescription="diapositiva" aria-label={`Diapositiva ${index + 1} de ${slides.length}`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={current.id}
            className={`deck-slide slide-${current.variant ?? 'split'}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            {current.eyebrow && <p className="slide-eyebrow">{current.eyebrow}</p>}
            <h1>{current.title}</h1>
            {current.subtitle && <div className="slide-subtitle">{current.subtitle}</div>}
            {current.visual && <div className="slide-visual" tabIndex={0} role="region" aria-label="Diagrama de la diapositiva; en pantallas pequeñas puede desplazarse horizontalmente">{current.visual}</div>}
            {current.body && <div className="slide-body">{current.body}</div>}
          </motion.article>
        </AnimatePresence>
      </section>

      <div className="sr-only" aria-live="polite">Diapositiva {index + 1}: {current.eyebrow}</div>

      <footer className="deck-footer" inert={Boolean(overlay)} aria-hidden={overlay ? true : undefined}>
        <button type="button" className="deck-arrow" onClick={previous} disabled={index === 0} aria-label="Diapositiva anterior">
          <span aria-hidden="true">←</span><small>anterior</small>
        </button>
        <div className="deck-progress-wrap">
          <div className="deck-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
          <span><b>{String(index + 1).padStart(2, '0')}</b> / {String(slides.length).padStart(2, '0')}</span>
        </div>
        <button type="button" className="deck-arrow" onClick={next} disabled={index === slides.length - 1} aria-label="Diapositiva siguiente">
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
            >
              <header>
                <div>
                  <span className="overlay-kicker">La arquitectura de lo ausente</span>
                  <h2 id={overlayTitleId}>{overlay === 'index' ? 'Índice' : overlay === 'notes' ? 'Notas del ponente' : 'Atajos'}</h2>
                </div>
                <button type="button" onClick={closeOverlay} aria-label="Cerrar panel">×</button>
              </header>

              {overlay === 'index' && (
                <div className="slide-index-grid">
                  {slides.map((slide, slideIndex) => (
                    <button
                      key={slide.id}
                      type="button"
                      className={slideIndex === index ? 'is-active' : ''}
                      onClick={() => goTo(slideIndex)}
                    >
                      <span>{String(slideIndex + 1).padStart(2, '0')}</span>
                      <strong>{slide.eyebrow?.replace(/^\d+ · /, '') ?? slide.id}</strong>
                    </button>
                  ))}
                </div>
              )}

              {overlay === 'notes' && (
                <div className="speaker-notes">
                  <span>Diapositiva {index + 1} de {slides.length}</span>
                  <h3>{current.eyebrow}</h3>
                  {current.notes}
                </div>
              )}

              {overlay === 'help' && (
                <dl className="shortcut-list">
                  <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Navegar</dd></div>
                  <div><dt><kbd>Espacio</kbd></dt><dd>Avanzar</dd></div>
                  <div><dt><kbd>O</kbd> / <kbd>I</kbd></dt><dd>Índice</dd></div>
                  <div><dt><kbd>S</kbd> / <kbd>N</kbd></dt><dd>Notas</dd></div>
                  <div><dt><kbd>F</kbd></dt><dd>Pantalla completa</dd></div>
                  <div><dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Inicio / final</dd></div>
                  <div><dt><kbd>Esc</kbd></dt><dd>Cerrar panel</dd></div>
                </dl>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      <button type="button" className="deck-help" inert={Boolean(overlay)} aria-hidden={overlay ? true : undefined} onClick={() => openOverlay('help')} aria-label="Mostrar ayuda de teclado">?</button>
    </main>
  );
}
