import { Link } from 'react-router-dom';
import guideUrl from '../../Capitulo5.md?url';

const REPO_URL = 'https://github.com/stevenvo780/russell-conocimiento-directo';

export function SourcesPage() {
  return (
    <main id="main-content" className="sources-page">
      <header className="sources-header">
        <Link to="/" className="back-link"><span aria-hidden="true">←</span> Volver</Link>
        <span className="sources-mark">R · 05</span>
        <Link to="/presentacion" className="button button-small">Presentar <span aria-hidden="true">↗</span></Link>
      </header>

      <article className="sources-content">
        <p className="section-kicker">Aparato mínimo</p>
        <h1>Fuentes y criterio editorial</h1>
        <p className="sources-lead">
          La exposición reconstruye un solo capítulo y distingue con claridad entre la tesis de Russell, la explicación pedagógica y las preguntas críticas.
        </p>

        <section>
          <span className="source-index">01</span>
          <div>
            <h2>Texto primario</h2>
            <p>
              Russell, Bertrand. <em>Los problemas de la filosofía</em>. Traducción de Joaquín Xirau; prólogo de Emilio Lledó. Barcelona: Editorial Labor, 1995. Capítulo 5, «Conocimiento directo y conocimiento por referencia».
            </p>
            <p className="source-note">
              El libro apareció originalmente en inglés en 1912. La exposición conserva «por referencia», vocabulario de la edición estudiada, y aclara su equivalencia contextual con «por descripción».
            </p>
          </div>
        </section>

        <section>
          <span className="source-index">02</span>
          <div>
            <h2>Guion canónico</h2>
            <p>
              El desarrollo completo, los siete diagramas Mermaid, el glosario, las preguntas y las notas por diapositiva están en un único documento Markdown.
            </p>
            <a className="text-link" href={guideUrl}>Abrir Capitulo5.md <span aria-hidden="true">→</span></a>
          </div>
        </section>

        <section>
          <span className="source-index">03</span>
          <div>
            <h2>Criterio de fidelidad</h2>
            <ul>
              <li>Las citas literales son breves y se identifican como tales.</li>
              <li>Los ejemplos de la mesa, el candidato, Bismarck y Julio César proceden del capítulo.</li>
              <li>Los ejemplos contemporáneos se señalan como recursos didácticos.</li>
              <li>El yo se presenta como probable, no indudable.</li>
              <li>Las objeciones no se atribuyen a Russell como conclusiones propias.</li>
              <li>No se redistribuyen el PDF ni la transcripción integral de la traducción.</li>
            </ul>
          </div>
        </section>

        <section>
          <span className="source-index">04</span>
          <div>
            <h2>Proyecto abierto</h2>
            <p>
              El código, el guion original y los diagramas están disponibles para auditoría y reutilización. El repositorio no incluye la obra fuente digitalizada.
            </p>
            <a className="text-link" href={REPO_URL} target="_blank" rel="noreferrer">Ver repositorio en GitHub <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </article>

      <footer className="sources-footer">
        <span>La arquitectura de lo ausente</span>
        <span>Steven Vallejo · 2026</span>
      </footer>
    </main>
  );
}
