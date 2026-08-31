import { motion } from 'framer-motion';
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Link } from 'react-router-dom';
import guideUrl from '../../Capitulo5.md?url';
import { AnchorReach, EpistemicField, KnowledgeTree, TableBridge } from '../components/Visuals';

const REPO_URL = 'https://github.com/stevenvo780/russell-conocimiento-directo';

type Theme = 'dark' | 'light';
type LabStage = 'datum' | 'inference' | 'object';

const LAB_STAGES: Array<{ id: LabStage; number: string; label: string; readout: string; detail: string }> = [
  {
    id: 'datum',
    number: '01',
    label: 'Lo dado',
    readout: 'color · dureza · forma aparente',
    detail: 'Presencia inmediata: todavía no aparece una mesa física.',
  },
  {
    id: 'inference',
    number: '02',
    label: 'El puente',
    readout: 'estos datos tienen una causa estable',
    detail: 'Una verdad enlaza la experiencia presente con algo que la explica.',
  },
  {
    id: 'object',
    number: '03',
    label: 'Lo referido',
    readout: '«el objeto físico que causa estos datos»',
    detail: 'La descripción alcanza la mesa, aunque la mesa no sea un dato sensorial.',
  },
];

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><b /></span>;
}

export function HomePage({ theme, onTheme }: { theme: Theme; onTheme: () => void }) {
  const [activeMode, setActiveMode] = useState<'direct' | 'reference'>('direct');
  const [labStage, setLabStage] = useState<LabStage>('datum');
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    let pointerFrame = 0;

    shell.classList.add('motion-ready');

    const updateScrollProgress = () => {
      const scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(Math.max(window.scrollY / scrollRange, 0), 1);
      shell.style.setProperty('--page-progress', progress.toFixed(4));
      const band = progress < 0.28 ? 'presence' : progress < 0.72 ? 'bridge' : 'reference';
      shell.dataset.scrollBand = band;
      const progressRail = shell.querySelector<HTMLElement>('.page-progress');
      progressRail?.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
      progressRail?.setAttribute('aria-valuetext', band === 'presence' ? 'Presencia' : band === 'bridge' ? 'Puente' : 'Referencia');
    };

    const updatePointer = (event: PointerEvent) => {
      if (!finePointer || reducedMotion) return;
      window.cancelAnimationFrame(pointerFrame);
      pointerFrame = window.requestAnimationFrame(() => {
        const x = event.clientX / Math.max(window.innerWidth, 1);
        const y = event.clientY / Math.max(window.innerHeight, 1);
        shell.style.setProperty('--pointer-x', `${event.clientX}px`);
        shell.style.setProperty('--pointer-y', `${event.clientY}px`);
        shell.style.setProperty('--pointer-nx', (x * 2 - 1).toFixed(3));
        shell.style.setProperty('--pointer-ny', (y * 2 - 1).toFixed(3));
        shell.dataset.pointerReady = (event.target as Element | null)?.closest('.hero-section') ? 'true' : 'false';
      });
    };

    const revealTargets = Array.from(shell.querySelectorAll<HTMLElement>('[data-reveal-section]'));
    let observer: IntersectionObserver | undefined;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealTargets.forEach((target) => { target.dataset.visible = 'true'; });
    } else {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = 'true';
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
      revealTargets.forEach((target) => observer?.observe(target));
    }

    const animatedFields = Array.from(shell.querySelectorAll<HTMLElement>('.epistemic-field, .semantic-diagram'));
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const setPlayback = (target: HTMLElement, running: boolean) => {
      target.dataset.playback = running ? 'running' : 'paused';
      target.getAnimations({ subtree: true }).forEach((animation) => {
        try {
          if (running) animation.play();
          else animation.pause();
        } catch {
          // Animaciones ya desmontadas pueden quedar un frame en la lista del navegador.
        }
      });
    };
    let motionObserver: IntersectionObserver | undefined;
    if (reducedMotion || saveData) {
      window.requestAnimationFrame(() => animatedFields.forEach((target) => setPlayback(target, false)));
    } else {
      motionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => setPlayback(entry.target as HTMLElement, entry.isIntersecting && !document.hidden));
      }, { threshold: 0.04, rootMargin: '12% 0px' });
      animatedFields.forEach((target) => motionObserver?.observe(target));
    }

    const syncDocumentVisibility = () => {
      if (document.hidden) animatedFields.forEach((target) => setPlayback(target, false));
      else if (!reducedMotion && !saveData) {
        animatedFields.forEach((target) => {
          const bounds = target.getBoundingClientRect();
          setPlayback(target, bounds.bottom >= -window.innerHeight * 0.12 && bounds.top <= window.innerHeight * 1.12);
        });
      }
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    shell.addEventListener('pointermove', updatePointer, { passive: true });
    document.addEventListener('visibilitychange', syncDocumentVisibility);

    return () => {
      window.cancelAnimationFrame(pointerFrame);
      window.removeEventListener('scroll', updateScrollProgress);
      shell.removeEventListener('pointermove', updatePointer);
      document.removeEventListener('visibilitychange', syncDocumentVisibility);
      observer?.disconnect();
      motionObserver?.disconnect();
    };
  }, []);

  const moveComparisonTab = (direction: 'previous' | 'next' | 'first' | 'last') => {
    const nextMode = direction === 'previous' || direction === 'first' ? 'direct' : 'reference';
    setActiveMode(nextMode);
    window.requestAnimationFrame(() => document.getElementById(`tab-${nextMode}`)?.focus());
  };

  const moveLabTab = (current: number, direction: number) => {
    const nextIndex = (current + direction + LAB_STAGES.length) % LAB_STAGES.length;
    const nextStage = LAB_STAGES[nextIndex];
    setLabStage(nextStage.id);
    window.requestAnimationFrame(() => document.getElementById(`lab-tab-${nextStage.id}`)?.focus());
  };

  const tiltCase = (event: ReactPointerEvent<HTMLElement>) => {
    if (!window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty('--card-x', `${(x * 100).toFixed(1)}%`);
    card.style.setProperty('--card-y', `${(y * 100).toFixed(1)}%`);
    card.style.setProperty('--card-rotate-x', `${((0.5 - y) * 7).toFixed(2)}deg`);
    card.style.setProperty('--card-rotate-y', `${((x - 0.5) * 9).toFixed(2)}deg`);
    card.dataset.pointerActive = 'true';
  };

  const resetCase = (event: ReactPointerEvent<HTMLElement>) => {
    event.currentTarget.dataset.pointerActive = 'false';
  };

  return (
    <main id="main-content" className="site-shell" ref={shellRef} data-scroll-band="presence" data-pointer-ready="false">
      <div className="page-progress" role="progressbar" aria-label="Progreso de lectura" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-valuetext="Presencia"><i /></div>
      <div className="epistemic-cursor" aria-hidden="true"><i /><span /></div>
      <header className="site-header">
        <div className="site-identity">
          <a className="site-brand" href="https://paideia.stevenvallejo.com/" aria-label="Volver a Paideía">
            <BrandMark />
            <span>
              <strong>Paideía</strong>
              <small>Mouseîon</small>
            </span>
          </a>
          <span aria-hidden="true">/</span>
          <a className="site-context" href="#inicio">Russell · 05</a>
        </div>
        <nav aria-label="Navegación principal">
          <a href="#tesis">Tesis</a>
          <a href="#recorrido">Recorrido</a>
          <a href="#cierre">Síntesis</a>
          <Link to="/fuentes">Fuentes</Link>
        </nav>
        <div className="site-actions">
          <a className="header-repo" href={REPO_URL} target="_blank" rel="noreferrer">GitHub ↗</a>
          <button type="button" className="theme-button" onClick={onTheme} aria-label={`Cambiar al tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
          </button>
          <Link className="button button-small" to="/presentacion">Presentar <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section id="inicio" className="hero-section">
        <EpistemicField />
        <div className="hero-lens" aria-hidden="true">
          <i className="lens-ring lens-ring-outer" />
          <i className="lens-ring lens-ring-inner" />
          <span className="lens-axis lens-axis-x" />
          <span className="lens-axis lens-axis-y" />
          <b><small>campo</small> conciencia</b>
        </div>
        <div className="hero-orb hero-direct" aria-hidden="true" />
        <div className="hero-orb hero-reference" aria-hidden="true" />
        <div className="hero-side-note hero-side-direct" aria-hidden="true">
          <span>01 · lo dado</span>
          <i />
          <strong>presencia</strong>
        </div>
        <div className="hero-side-note hero-side-reference" aria-hidden="true">
          <span>02 · lo ausente</span>
          <i />
          <strong>descripción</strong>
        </div>
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="hero-kicker">Bertrand Russell · epistemología · 1912 / 1995</p>
          <h1>
            La arquitectura
            <br />
            <em>de lo ausente</em>
          </h1>
          <p className="hero-subtitle">
            Una investigación visual sobre cómo una experiencia mínima puede abrir un mundo que jamás se presenta por completo.
          </p>
          <div className="hero-problem">
            <span>El problema en diez segundos</span>
            <p>Veo color. Toco dureza. Pero ¿dónde está <em>la mesa</em>?</p>
          </div>
          <div className="hero-legend" aria-label="Código visual de la exposición">
            <span className="legend-direct"><i /> presentado</span>
            <span className="legend-inference"><i /> inferido</span>
            <span className="legend-reference"><i /> referido</span>
            <span className="legend-doubt"><i /> discutible</span>
          </div>
          <div className="hero-ctas">
            <Link className="button button-primary" to="/presentacion">
              Ver presentación <span aria-hidden="true">→</span>
            </Link>
            <a className="button button-ghost" href={guideUrl} download>
              Descargar guion .md
            </a>
          </div>
          <div className="hero-meta">
            <span>14 diapositivas</span>
            <span>25–30 minutos</span>
            <span>8 visuales</span>
            <span>modo ponente</span>
          </div>
        </motion.div>
        <a className="scroll-cue" href="#tesis">
          <span>explorar</span><i aria-hidden="true" />
        </a>
      </section>

      <section id="tesis" className="thesis-section content-frame" data-reveal-section>
        <div className="section-number" data-reveal-item>01</div>
        <div className="section-heading" data-reveal-item>
          <p className="section-kicker">La tesis en una frase</p>
          <h2>Lo directo nos ancla.<br />La referencia nos lleva más lejos.</h2>
        </div>
        <div className="thesis-copy" data-reveal-item>
          <p>
            Nuestra experiencia inmediata es estrecha: un color, una resistencia, un recuerdo. Russell convierte esa limitación en una arquitectura: lo presente aporta los materiales; las descripciones construyen el alcance.
          </p>
          <blockquote>
            «Toda proposición que podamos entender debe estar compuesta exclusivamente por elementos de los cuales tengamos un conocimiento directo.»
            <cite>Bertrand Russell, capítulo 5</cite>
          </blockquote>
        </div>
      </section>

      <section className="cases-section content-frame" aria-labelledby="cases-title" data-reveal-section>
        <header className="cases-heading" data-reveal-item>
          <p className="section-kicker">Tres pruebas de distancia</p>
          <h2 id="cases-title">El objeto se aleja.<br />El conocimiento no desaparece.</h2>
          <p>Cada caso conserva un anclaje, pero exige una operación más compleja para alcanzar aquello de lo que hablamos.</p>
        </header>
        <div className="case-grid">
          {[
            {
              number: '01',
              label: 'Percepción',
              title: 'La mesa',
              question: '¿Cómo paso del color y la dureza al objeto físico?',
              path: ['datos', 'causa'],
              tone: 'direct',
              slideId: 'mesa',
            },
            {
              number: '02',
              label: 'Identificación',
              title: 'El ganador',
              question: 'Puedo conocer a todos y todavía no saber quién satisface «el F».',
              path: ['personas', 'unicidad'],
              tone: 'bridge',
              slideId: 'ganador',
            },
            {
              number: '03',
              label: 'Historia',
              title: 'Bismarck',
              question: 'El nombre llega hasta mí sin que el individuo haya estado presente.',
              path: ['testimonio', 'referente'],
              tone: 'reference',
              slideId: 'bismarck',
            },
          ].map((item) => (
            <article
              key={item.number}
              className={`case-card case-${item.tone}`}
              data-number={item.number}
              data-reveal-item
              data-pointer-active="false"
              onPointerMove={tiltCase}
              onPointerLeave={resetCase}
            >
              <Link className="case-card-link" to={`/presentacion#${item.slideId}`} aria-label={`Abrir el caso «${item.title}» en la presentación`} />
              <div className="case-card-top"><span>{item.number}</span><small>{item.label}</small></div>
              <h3>{item.title}</h3>
              <p>{item.question}</p>
              <div className="case-path" aria-label={`Recorrido: ${item.path.join(' hacia ')}`}>
                <span>{item.path[0]}</span><i aria-hidden="true" /><span>{item.path[1]}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-section" data-reveal-section>
        <div className="content-frame comparison-frame">
          <div className="comparison-tabs" role="tablist" aria-label="Comparar formas de conocimiento" data-reveal-item>
            <button
              type="button"
              role="tab"
              id="tab-direct"
              aria-controls="comparison-panel"
              aria-selected={activeMode === 'direct'}
              tabIndex={activeMode === 'direct' ? 0 : -1}
              className={activeMode === 'direct' ? 'is-active direct-tab' : 'direct-tab'}
              onClick={() => setActiveMode('direct')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight' || event.key === 'End') {
                  event.preventDefault();
                  moveComparisonTab(event.key === 'End' ? 'last' : 'next');
                }
              }}
            >
              <span>01</span> Conocimiento directo
            </button>
            <button
              type="button"
              role="tab"
              id="tab-reference"
              aria-controls="comparison-panel"
              aria-selected={activeMode === 'reference'}
              tabIndex={activeMode === 'reference' ? 0 : -1}
              className={activeMode === 'reference' ? 'is-active reference-tab' : 'reference-tab'}
              onClick={() => setActiveMode('reference')}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft' || event.key === 'Home') {
                  event.preventDefault();
                  moveComparisonTab(event.key === 'Home' ? 'first' : 'previous');
                }
              }}
            >
              <span>02</span> Por referencia
            </button>
          </div>
          <motion.div
            key={activeMode}
            id="comparison-panel"
            className={`comparison-card mode-${activeMode}`}
            data-reveal-item
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            role="tabpanel"
            aria-labelledby={`tab-${activeMode}`}
            tabIndex={0}
          >
            <div className="comparison-word" aria-hidden="true">{activeMode === 'direct' ? 'D' : 'R'}</div>
            <p className="section-kicker">{activeMode === 'direct' ? 'Presencia' : 'Descripción'}</p>
            <h3>{activeMode === 'direct' ? 'El objeto está ante la conciencia' : 'El objeto satisface «el F»'}</h3>
            <p>
              {activeMode === 'direct'
                ? 'No llegamos a él mediante una inferencia constitutiva. El matiz visto, un recuerdo, un deseo o un universal están inmediatamente presentados.'
                : 'Sabemos que existe exactamente un objeto con cierta propiedad, aunque no podamos identificarlo con algo directamente conocido.'}
            </p>
            <dl>
              <div><dt>Ejemplo</dt><dd>{activeMode === 'direct' ? 'el matiz castaño' : 'la mesa física que causa los datos'}</dd></div>
              <div><dt>Función</dt><dd>{activeMode === 'direct' ? 'fundamento' : 'extensión'}</dd></div>
              <div><dt>Operación</dt><dd>{activeMode === 'direct' ? 'presentación' : 'inferencia + unicidad'}</dd></div>
            </dl>
          </motion.div>
        </div>
      </section>

      <section id="recorrido" className="map-section content-frame" data-reveal-section>
        <div className="section-number" data-reveal-item>02</div>
        <div className="section-heading map-heading" data-reveal-item>
          <p className="section-kicker">La arquitectura</p>
          <h2>Un mapa antes de entrar en los casos</h2>
          <p>El capítulo separa dos preguntas: qué cosas conocemos y mediante qué relación las conocemos.</p>
        </div>
        <div className="map-visual" tabIndex={0} role="region" aria-label="Diagrama: taxonomía del conocimiento" data-reveal-item>
          <KnowledgeTree compact />
        </div>
      </section>

      <section className="table-story-section" data-reveal-section>
        <div className="content-frame table-story-frame">
          <div className="table-story-copy" data-reveal-item>
            <p className="section-kicker">El experimento mental central</p>
            <h2>La mesa se divide en apariencia y explicación</h2>
            <p>
              Lo que vemos y tocamos está presente. El objeto físico, en cambio, aparece dentro de una descripción causal: «aquello que produce estos datos».
            </p>
            <div className="story-warning">
              <strong>Atención</strong>
              <span>Russell no niega la mesa. Niega que sea conocida del mismo modo que su color.</span>
            </div>
            <div className="epistemic-lab-tabs" role="tablist" aria-label="Reconstruir la mesa por capas">
              {LAB_STAGES.map((stage, index) => (
                <button
                  key={stage.id}
                  type="button"
                  role="tab"
                  id={`lab-tab-${stage.id}`}
                  aria-controls="epistemic-lab-panel"
                  aria-selected={labStage === stage.id}
                  tabIndex={labStage === stage.id ? 0 : -1}
                  className={labStage === stage.id ? 'is-active' : undefined}
                  onClick={() => setLabStage(stage.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveLabTab(index, 1);
                    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveLabTab(index, -1);
                    } else if (event.key === 'Home' || event.key === 'End') {
                      event.preventDefault();
                      const targetIndex = event.key === 'Home' ? 0 : LAB_STAGES.length - 1;
                      setLabStage(LAB_STAGES[targetIndex].id);
                      window.requestAnimationFrame(() => document.getElementById(`lab-tab-${LAB_STAGES[targetIndex].id}`)?.focus());
                    }
                  }}
                >
                  <span>{stage.number}</span>{stage.label}
                </button>
              ))}
            </div>
          </div>
          <div
            id="epistemic-lab-panel"
            className={`table-story-visual epistemic-lab lab-${labStage}`}
            data-lab-stage={labStage}
            tabIndex={0}
            role="tabpanel"
            aria-labelledby={`lab-tab-${labStage}`}
            data-reveal-item
          >
            <div className="lab-readout" aria-live="polite">
              <span>{LAB_STAGES.find((stage) => stage.id === labStage)?.label}</span>
              <strong>{LAB_STAGES.find((stage) => stage.id === labStage)?.readout}</strong>
              <small>{LAB_STAGES.find((stage) => stage.id === labStage)?.detail}</small>
            </div>
            <div className="lab-scan" aria-hidden="true"><i /></div>
            <TableBridge compact />
          </div>
        </div>
      </section>

      <section className="questions-section" data-reveal-section>
        <div className="content-frame questions-frame">
          <div data-reveal-item>
            <p className="section-kicker">Zonas de tensión</p>
            <h2>Russell abre problemas que su capítulo no cierra</h2>
          </div>
          <div className="question-grid" data-reveal-item>
            <article><span>01</span><h3>Memoria</h3><p>¿Qué se presenta cuando el recuerdo es falso?</p></article>
            <article><span>02</span><h3>Yo</h3><p>¿Conocemos al sujeto o solo sus estados?</p></article>
            <article><span>03</span><h3>Universales</h3><p>¿Son objetos, conceptos o usos de palabras?</p></article>
            <article><span>04</span><h3>Nombres</h3><p>¿Un nombre propio equivale siempre a una descripción?</p></article>
          </div>
        </div>
      </section>

      <section id="cierre" className="closing-section" data-reveal-section>
        <EpistemicField />
        <div className="content-frame closing-frame" data-reveal-item>
          <p className="section-kicker">Síntesis final</p>
          <h2>Una experiencia pequeña.<br />Un mundo inmenso.</h2>
          <p>
            La referencia no sustituye el contacto con el mundo: lo presupone y lo extiende. Con un vocabulario nacido de la experiencia podemos comprender aquello que jamás estuvo ante nosotros.
          </p>
          <div className="closing-equation" aria-label="Conocimiento directo más verdades y descripciones produce alcance">
            <span><small>01</small> directo</span>
            <b aria-hidden="true">+</b>
            <span><small>02</small> verdades</span>
            <b aria-hidden="true">+</b>
            <span><small>03</small> descripción</span>
            <b aria-hidden="true">=</b>
            <span className="equation-result"><small>resultado</small> alcance</span>
          </div>
          <div className="closing-visual" tabIndex={0} role="region" aria-label="Diagrama: anclaje y alcance del conocimiento"><AnchorReach compact /></div>
          <div className="closing-actions">
            <Link className="button button-primary" to="/presentacion">Iniciar exposición <span aria-hidden="true">→</span></Link>
            <a className="button button-ghost" href={guideUrl}>Abrir el guion completo</a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="content-frame footer-frame">
          <div>
            <BrandMark />
            <p>Una exposición de Steven Vallejo sobre Bertrand Russell.</p>
          </div>
          <div className="footer-links">
            <Link to="/presentacion">Presentación</Link>
            <a href={guideUrl}>Guion .md</a>
            <Link to="/fuentes">Fuentes</Link>
            <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub ↗</a>
            <a href="https://paideia.stevenvallejo.com/" target="_blank" rel="noreferrer">Paideía ↗</a>
          </div>
          <small>Medellín · 2026</small>
        </div>
      </footer>
    </main>
  );
}
