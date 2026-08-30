import type { ReactNode } from 'react';
import {
  AnchorReach,
  BismarckDistance,
  CandidateParadox,
  DescriptionGate,
  DirectConstellation,
  KnowledgeTree,
  SubjectRelation,
  TableBridge,
} from './components/Visuals';

export type Slide = {
  id: string;
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  body?: ReactNode;
  visual?: ReactNode;
  variant?: 'question' | 'cover' | 'split' | 'visual' | 'quote' | 'closing';
  notes: ReactNode;
};

export const slides: Slide[] = [
  {
    id: 'pregunta',
    eyebrow: 'Pregunta para dejar sonando',
    title: (
      <>
        Cuando digo «conozco esta mesa»,
        <br />
        ¿conozco <em>la mesa</em> o aquello que se me presenta?
      </>
    ),
    subtitle: 'Mírala. Tócala. Enumera qué aparece antes de responder.',
    variant: 'question',
    notes: (
      <>
        <p>Pide al público mirar una mesa u otro objeto cercano.</p>
        <p>
          Enumera color, forma, brillo, dureza y resistencia. Pregunta cuál de esas cosas es la mesa
          física. La exposición regresará a esta pregunta al final.
        </p>
      </>
    ),
  },
  {
    id: 'portada',
    eyebrow: 'Bertrand Russell · Los problemas de la filosofía · capítulo 5',
    title: (
      <>
        La arquitectura
        <br />
        <span className="accent-title">de lo ausente</span>
      </>
    ),
    subtitle: 'Conocimiento directo y conocimiento por referencia',
    body: (
      <div className="cover-thesis">
        <span>DIRECTO = ANCLAJE</span>
        <i aria-hidden="true" />
        <span>REFERENCIA = ALCANCE</span>
      </div>
    ),
    variant: 'cover',
    notes: (
      <p>
        La tesis rectora es doble: todo conocimiento se ancla en algo conocido directamente, y las
        descripciones permiten superar los límites de nuestra experiencia privada.
      </p>
    ),
  },
  {
    id: 'arquitectura',
    eyebrow: '01 · El mapa',
    title: 'Dos formas de conocer cosas',
    subtitle: 'No se oponen como verdad y error: cumplen funciones distintas.',
    visual: <KnowledgeTree compact />,
    variant: 'visual',
    notes: (
      <>
        <p>Russell distingue primero conocimiento de verdades y conocimiento de cosas.</p>
        <p>
          El capítulo divide el conocimiento de cosas en directo y por referencia. Lo directo es
          lógicamente independiente de una inferencia; la referencia necesita verdades que conecten
          una descripción con elementos conocidos directamente.
        </p>
      </>
    ),
  },
  {
    id: 'color',
    eyebrow: '02 · Presencia',
    title: 'El color está presente antes de que lo clasifique',
    body: (
      <div className="color-proposition">
        <div className="color-swatch" role="img" aria-label="Muestra visual de un matiz castaño" />
        <div className="color-truths">
          <span>el matiz</span>
          <strong>«es castaño»</strong>
          <strong>«es oscuro»</strong>
        </div>
        <div className="epistemic-brace">
          <span>cosa presentada</span>
          <span>verdades sobre ella</span>
        </div>
      </div>
    ),
    subtitle: (
      <>
        Nombrar propiedades añade <em>verdades</em>; no añade más presencia del matiz.
      </>
    ),
    variant: 'split',
    notes: (
      <>
        <p>
          Russell dice que el color presentado se conoce perfecta y completamente. El conocimiento
          directo no es una proposición verdadera o falsa: el posible error pertenece a los juicios
          que formulamos después, no a la mera relación de presentación.
        </p>
        <p>
          Decir «castaño» u «oscuro» añade conocimiento proposicional, pero el color mismo ya estaba
          presentado.
        </p>
      </>
    ),
  },
  {
    id: 'mesa',
    eyebrow: '03 · El experimento de la mesa',
    title: 'De lo que aparece a aquello que lo causa',
    visual: <TableBridge compact />,
    subtitle: 'Russell no niega la mesa: cambia su estatuto epistemológico.',
    variant: 'visual',
    notes: (
      <>
        <p>Conocemos directamente color, forma, dureza y suavidad como datos sensoriales.</p>
        <p>
          La mesa física se introduce como «el objeto físico que causa tales y cuales datos de los
          sentidos». Entre ambos niveles hay una verdad puente. La mesa es conocida por referencia.
        </p>
      </>
    ),
  },
  {
    id: 'inventario',
    eyebrow: '04 · Lo directamente conocido',
    title: 'La experiencia inmediata es más amplia que la sensación',
    visual: <DirectConstellation compact />,
    variant: 'visual',
    notes: (
      <>
        <p>Sensación: datos presentes. Memoria: fuente del pasado.</p>
        <p>Introspección: pensamientos, sentimientos, deseos y actos mentales.</p>
        <p>
          El yo es probable, no indudable. Los universales —blancura, diversidad, relaciones— también
          son directamente aprehendidos según Russell.
        </p>
      </>
    ),
  },
  {
    id: 'yo',
    eyebrow: '05 · La cautela de Russell',
    title: 'Encuentro pensamientos; ¿encuentro también al yo?',
    visual: <SubjectRelation compact />,
    subtitle: 'La relación cognitiva parece exigir un sujeto, pero no demuestra un yo permanente.',
    variant: 'visual',
    notes: (
      <>
        <p>
          Cuando conozco «mi acto de ver el sol», parecen intervenir el sujeto, el acto y el dato
          sensorial.
        </p>
        <p>
          Al mirar hacia dentro encontramos pensamientos y sentimientos concretos, no con claridad una
          persona permanente. Russell afirma solo que algún conocimiento directo del sujeto es probable.
        </p>
      </>
    ),
  },
  {
    id: 'universales',
    eyebrow: '06 · Lo general también se presenta',
    title: 'Sin universales no podríamos formar una oración',
    body: (
      <div className="universal-field" role="img" aria-label="Universal en el centro, relacionado con los ejemplos blancura, diversidad y fraternidad">
        <span className="universal u1">blancura</span>
        <span className="universal u2">diversidad</span>
        <span className="universal u3">fraternidad</span>
        <span className="universal u4">semejanza</span>
        <span className="universal u5">relación</span>
        <span className="universal u6">causar</span>
        <div className="universal-core">
          <strong>CONCEBIR</strong>
          <span>aprehender un universal</span>
        </div>
      </div>
    ),
    subtitle: 'Lo directo no se reduce a particulares existentes aquí y ahora.',
    variant: 'visual',
    notes: (
      <>
        <p>Russell llama concebir al acto de aprehender un universal, y concepto al universal aprehendido.</p>
        <p>
          Toda oración completa contiene al menos un término universal: los verbos ya expresan un
          sentido general. Esta tesis será desarrollada en los capítulos nueve y diez.
        </p>
      </>
    ),
  },
  {
    id: 'descripcion',
    eyebrow: '07 · La lógica de «el F»',
    title: 'Una descripción definida afirma existencia y unicidad',
    visual: <DescriptionGate compact />,
    body: <div className="logic-formula" role="img" aria-label="Existe exactamente un x tal que x es F">∃!x F(x)</div>,
    variant: 'visual',
    notes: (
      <>
        <p>«Un hombre» es una descripción ambigua. «El hombre de la máscara de hierro» es definida.</p>
        <p>
          «El F existe» significa que al menos un objeto satisface F y que no hay dos objetos distintos
          que lo satisfagan. Podemos saber esto sin poder identificar al individuo.
        </p>
      </>
    ),
  },
  {
    id: 'ganador',
    eyebrow: '08 · Contacto ≠ identificación',
    title: 'Puedo conocer a todos y no saber quién es «el ganador»',
    visual: <CandidateParadox compact />,
    variant: 'visual',
    notes: (
      <>
        <p>Imagina que trato personalmente con todos los candidatos.</p>
        <p>
          Antes del resultado conozco a cada persona y sé que exactamente una ganará, pero no sé qué
          individuo satisface la descripción «el candidato que obtendrá mayor número de votos».
        </p>
      </>
    ),
  },
  {
    id: 'bismarck',
    eyebrow: '09 · Nombres y distancia',
    title: '«Bismarck» no presenta lo mismo a todos',
    visual: <BismarckDistance compact />,
    subtitle: 'El referente puede mantenerse mientras cambian las descripciones asociadas.',
    variant: 'visual',
    notes: (
      <>
        <p>
          Para Bismarck, el nombre podría apoyarse en el yo. Para un amigo, en datos sensoriales. Para
          nosotros, en testimonios como «el primer canciller del Imperio alemán».
        </p>
        <p>
          Russell añade casos cada vez más distantes: la máscara de hierro y el hombre más longevo. En
          el último solo sabemos lo deducible de la definición.
        </p>
      </>
    ),
  },
  {
    id: 'principio',
    eyebrow: '10 · El principio fundamental',
    title: (
      <>
        «Toda proposición que podamos entender debe estar compuesta exclusivamente por elementos de los
        cuales tengamos un conocimiento directo.»
      </>
    ),
    body: (
      <div className="caesar-chain">
        <span>JULIO CÉSAR</span>
        <i aria-hidden="true">→</i>
        <span>«El hombre que fue asesinado en los Idus de marzo»</span>
        <i aria-hidden="true">→</i>
        <span>particulares + universales comprendidos</span>
      </div>
    ),
    variant: 'quote',
    notes: (
      <>
        <p>Julio César no está presente en nuestro pensamiento como individuo directamente conocido.</p>
        <p>
          Lo sustituye una descripción construida con sonidos, textos, recuerdos y universales que sí
          comprendemos. Así una proposición puede tratar sobre alguien nunca experimentado.
        </p>
      </>
    ),
  },
  {
    id: 'cautelas',
    eyebrow: '11 · Qué queda abierto',
    title: 'Una teoría fuerte con cuatro zonas de tensión',
    body: (
      <div className="tension-grid">
        <article>
          <span>01</span>
          <strong>Memoria</strong>
          <p>¿Qué se presenta en un recuerdo falso?</p>
        </article>
        <article>
          <span>02</span>
          <strong>Yo</strong>
          <p>¿Sujeto funcional o persona permanente?</p>
        </article>
        <article>
          <span>03</span>
          <strong>Universales</strong>
          <p>¿Objetos, conceptos o usos lingüísticos?</p>
        </article>
        <article>
          <span>04</span>
          <strong>Nombres</strong>
          <p>¿Siempre equivalen a descripciones?</p>
        </article>
      </div>
    ),
    variant: 'split',
    notes: (
      <>
        <p>
          Estas preguntas no refutan automáticamente el capítulo. Separan lo que Russell sostiene, lo
          que presenta como probable y lo que deja para capítulos posteriores.
        </p>
        <p>No presentes la teoría descriptiva de los nombres como consenso contemporáneo.</p>
      </>
    ),
  },
  {
    id: 'respuesta',
    eyebrow: 'Respuesta a la pregunta inicial',
    title: 'Conozco directamente lo que aparece; conozco la mesa como aquello que lo explica',
    visual: <AnchorReach compact />,
    subtitle: 'La experiencia proporciona el anclaje. La referencia construye el alcance.',
    variant: 'closing',
    notes: (
      <>
        <p>Vuelve a la mesa del comienzo.</p>
        <p>
          El color, la forma y la resistencia se presentan. La mesa física es conocida mediante la
          descripción del objeto que causa y organiza esos datos.
        </p>
        <p>
          La referencia no reemplaza el contacto con el mundo: lo presupone y permite hablar con sentido
          de un mundo mucho mayor que nuestra experiencia privada.
        </p>
      </>
    ),
  },
];
