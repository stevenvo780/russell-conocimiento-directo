import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import guideUrl from '../../Capitulo5.md?url';
import { AnchorReach, EpistemicField, KnowledgeTree, TableBridge } from '../components/Visuals';

const REPO_URL = 'https://github.com/stevenvo780/russell-conocimiento-directo';

type Theme = 'dark' | 'light';

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><i /><i /><b /></span>;
}

export function HomePage({ theme, onTheme }: { theme: Theme; onTheme: () => void }) {
  const [activeMode, setActiveMode] = useState<'direct' | 'reference'>('direct');

  return (
    <main id="main-content" className="site-shell">
      <header className="site-header">
        <a className="site-brand" href="#inicio" aria-label="Ir al inicio">
          <BrandMark />
          <span>
            <strong>Russell</strong>
            <small>capítulo 5</small>
          </span>
        </a>
        <nav aria-label="Navegación principal">
          <a href="#tesis">Tesis</a>
          <a href="#recorrido">Recorrido</a>
          <a href="#cierre">Síntesis</a>
          <Link to="/fuentes">Fuentes</Link>
        </nav>
        <div className="site-actions">
          <button type="button" className="theme-button" onClick={onTheme} aria-label={`Cambiar al tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span>
          </button>
          <Link className="button button-small" to="/presentacion">Presentar <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section id="inicio" className="hero-section">
        <EpistemicField />
        <div className="hero-orb hero-direct" aria-hidden="true" />
        <div className="hero-orb hero-reference" aria-hidden="true" />
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
            Cómo conocemos mesas, otras mentes y personajes históricos que nunca se presentan directamente ante nosotros.
          </p>
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
            <span>notas del ponente</span>
          </div>
        </motion.div>
        <a className="scroll-cue" href="#tesis">
          <span>explorar</span><i aria-hidden="true" />
        </a>
      </section>

      <section id="tesis" className="thesis-section content-frame">
        <div className="section-number">01</div>
        <div className="section-heading">
          <p className="section-kicker">La tesis en una frase</p>
          <h2>Lo directo nos ancla.<br />La referencia nos lleva más lejos.</h2>
        </div>
        <div className="thesis-copy">
          <p>
            Nuestra experiencia inmediata es estrecha: un color, una resistencia, un recuerdo, un pensamiento. Pero esos elementos pueden combinarse en verdades y descripciones que alcanzan objetos ausentes.
          </p>
          <blockquote>
            «Toda proposición que podamos entender debe estar compuesta exclusivamente por elementos de los cuales tengamos un conocimiento directo.»
            <cite>Bertrand Russell, capítulo 5</cite>
          </blockquote>
        </div>
      </section>

      <section className="comparison-section">
        <div className="content-frame comparison-frame">
          <div className="comparison-tabs" role="tablist" aria-label="Comparar formas de conocimiento">
            <button
              type="button"
              role="tab"
              id="tab-direct"
              aria-controls="comparison-panel"
              aria-selected={activeMode === 'direct'}
              className={activeMode === 'direct' ? 'is-active direct-tab' : 'direct-tab'}
              onClick={() => setActiveMode('direct')}
            >
              <span>01</span> Conocimiento directo
            </button>
            <button
              type="button"
              role="tab"
              id="tab-reference"
              aria-controls="comparison-panel"
              aria-selected={activeMode === 'reference'}
              className={activeMode === 'reference' ? 'is-active reference-tab' : 'reference-tab'}
              onClick={() => setActiveMode('reference')}
            >
              <span>02</span> Por referencia
            </button>
          </div>
          <motion.div
            key={activeMode}
            id="comparison-panel"
            className={`comparison-card mode-${activeMode}`}
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

      <section id="recorrido" className="map-section content-frame">
        <div className="section-number">02</div>
        <div className="section-heading map-heading">
          <p className="section-kicker">La arquitectura</p>
          <h2>Un mapa antes de entrar en los casos</h2>
          <p>El capítulo separa dos preguntas: qué cosas conocemos y mediante qué relación las conocemos.</p>
        </div>
        <div className="map-visual" tabIndex={0} role="region" aria-label="Diagrama desplazable: taxonomía del conocimiento">
          <KnowledgeTree />
        </div>
      </section>

      <section className="table-story-section">
        <div className="content-frame table-story-frame">
          <div className="table-story-copy">
            <p className="section-kicker">El experimento mental central</p>
            <h2>La mesa se divide en apariencia y explicación</h2>
            <p>
              Lo que vemos y tocamos está presente. El objeto físico, en cambio, aparece dentro de una descripción causal: «aquello que produce estos datos».
            </p>
            <div className="story-warning">
              <strong>Atención</strong>
              <span>Russell no niega la mesa. Niega que sea conocida del mismo modo que su color.</span>
            </div>
          </div>
          <div className="table-story-visual" tabIndex={0} role="region" aria-label="Diagrama desplazable: de los datos sensoriales a la mesa física">
            <TableBridge />
          </div>
        </div>
      </section>

      <section className="route-section content-frame">
        <div className="section-number">03</div>
        <div className="section-heading route-heading">
          <p className="section-kicker">Recorrido de la exposición</p>
          <h2>De la mesa al mundo histórico</h2>
        </div>
        <ol className="route-list">
          {[
            ['Presencia', 'El matiz y las verdades que formulamos sobre él.'],
            ['Apariencia', 'Los datos de los sentidos frente a la mesa física.'],
            ['Inventario', 'Sensación, memoria, introspección, yo y universales.'],
            ['Unicidad', 'Qué significa afirmar que existe «el F».'],
            ['Identificación', 'Conocer candidatos sin conocer aún al ganador.'],
            ['Distancia', 'Bismarck, la máscara de hierro y Julio César.'],
            ['Principio', 'Todo significado debe conservar un anclaje directo.'],
          ].map(([title, text], index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: index * 0.06 }}
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{title}</strong>
              <p>{text}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section className="questions-section">
        <div className="content-frame questions-frame">
          <div>
            <p className="section-kicker">Zonas de tensión</p>
            <h2>Russell abre problemas que su capítulo no cierra</h2>
          </div>
          <div className="question-grid">
            <article><span>01</span><h3>Memoria</h3><p>¿Qué se presenta cuando el recuerdo es falso?</p></article>
            <article><span>02</span><h3>Yo</h3><p>¿Conocemos al sujeto o solo sus estados?</p></article>
            <article><span>03</span><h3>Universales</h3><p>¿Son objetos, conceptos o usos de palabras?</p></article>
            <article><span>04</span><h3>Nombres</h3><p>¿Un nombre propio equivale siempre a una descripción?</p></article>
          </div>
        </div>
      </section>

      <section id="cierre" className="closing-section">
        <EpistemicField />
        <div className="content-frame closing-frame">
          <p className="section-kicker">Síntesis final</p>
          <h2>Una experiencia pequeña.<br />Un mundo inmenso.</h2>
          <p>
            La referencia no sustituye el contacto con el mundo: lo presupone y lo extiende. Con un vocabulario nacido de la experiencia podemos comprender aquello que jamás estuvo ante nosotros.
          </p>
          <div className="closing-visual" tabIndex={0} role="region" aria-label="Diagrama desplazable: anclaje y alcance del conocimiento"><AnchorReach /></div>
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
