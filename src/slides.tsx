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
    eyebrow: '00 · Un experimento de diez segundos',
    title: (
      <>
        Toca la mesa.
        <br />
        ¿Qué conoces <em>realmente</em>?
      </>
    ),
    subtitle: '¿El objeto físico… o color, forma, dureza y resistencia?',
    variant: 'question',
    notes: (
      <>
        <p><strong>Tiempo: 1:30.</strong> No empieces con una definición. Pide silencio y que alguien toque la mesa.</p>
        <p>
          Haz que el público nombre lo que aparece: color, forma, textura, resistencia. Luego pregunta:
          «¿Cuál de esas cosas es la mesa física?». No aceptes todavía una respuesta; promete volver al objeto al final.
        </p>
        <p><strong>Transición:</strong> «Russell convierte esta duda cotidiana en un mapa completo de nuestro conocimiento».</p>
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
    subtitle: 'Cómo una experiencia diminuta puede abrirnos un mundo inmenso',
    body: (
      <div className="cover-thesis">
        <span>DIRECTO = ANCLAJE</span>
        <i aria-hidden="true" />
        <span>REFERENCIA = ALCANCE</span>
      </div>
    ),
    variant: 'cover',
    notes: (
      <>
        <p><strong>Tiempo: 1:00.</strong> Presenta la promesa, no todas las conclusiones.</p>
        <p>
          La experiencia directa es estrecha: este color, este recuerdo, este pensamiento. Sin embargo,
          hablamos de mesas físicas, otras mentes, Bismarck y Julio César. La pregunta del capítulo es cómo
          cruzamos esa distancia sin perder el significado.
        </p>
        <p><strong>Transición:</strong> «Para responder, Russell abre primero la palabra conocer».</p>
      </>
    ),
  },
  {
    id: 'arquitectura',
    eyebrow: 'ACTO I · Presencia · 01',
    title: 'Russell abre una grieta en la palabra «conocer»',
    subtitle: 'Conocer una cosa no es lo mismo que conocer verdades sobre ella.',
    visual: <KnowledgeTree compact />,
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:00.</strong> Recorre el diagrama de arriba abajo.</p>
        <p>
          Primero: conocimiento de verdades —saber que algo es el caso— y conocimiento de cosas —conocer
          algo—. Segundo: el conocimiento de cosas puede ser directo o por referencia. Lo directo es
          lógicamente independiente de una inferencia; la referencia implica verdades que la fundamentan.
        </p>
        <p>
          Aclara que no son «conocimiento verdadero» y «conocimiento dudoso». Son dos relaciones
          epistemológicas con funciones distintas.
        </p>
        <p><strong>Transición:</strong> «Veamos la diferencia antes de ponerle palabras».</p>
      </>
    ),
  },
  {
    id: 'color',
    eyebrow: 'ACTO I · Presencia · 02',
    title: 'El color no depende de la frase',
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
    subtitle: 'El color se presenta; clasificarlo añade verdades.',
    variant: 'split',
    notes: (
      <>
        <p><strong>Tiempo: 2:00.</strong> Señala primero el círculo; después, las dos frases.</p>
        <p>
          El matiz está presentado cuando lo vemos. Decir «castaño» u «oscuro» añade conocimiento de
          verdades sobre él, pero no mejora el conocimiento del color mismo. Russell dice que lo conocemos
          «de un modo perfecto y completo» (p. 48) en este sentido preciso: no llegamos al dato mediante inferencia.
        </p>
        <p>
          Evita traducir esto como «sé todo acerca del color» o «nunca puedo equivocarme». El error aparece
          en el juicio; la presentación no es todavía una proposición verdadera o falsa.
        </p>
        <p><strong>Transición:</strong> «El color se presenta. La mesa física, en cambio, nunca llega así».</p>
      </>
    ),
  },
  {
    id: 'mesa',
    eyebrow: 'ACTO I · Presencia · 03',
    title: 'Aquí ocurre el salto',
    visual: <TableBridge compact />,
    subtitle: 'Datos presentes → verdad puente → objeto físico descrito',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:30.</strong> Haz avanzar la cadena de izquierda a derecha.</p>
        <p>
          Color, forma, dureza y suavidad son datos sensoriales conocidos directamente. La mesa física es
          «el objeto físico que causa tales y cuales datos de los sentidos». Para alcanzarla hace falta la
          verdad puente de que un objeto físico causa esos datos (p. 48).
        </p>
        <p>
          Russell no niega aquí la existencia de la mesa. Cambia su estatuto epistemológico: los datos se
          presentan; la mesa que los explica es conocida por referencia.
        </p>
        <p><strong>Transición:</strong> «Si solo conociéramos este instante sensible, nuestro mundo sería diminuto».</p>
      </>
    ),
  },
  {
    id: 'inventario',
    eyebrow: 'ACTO I · Presencia · 04',
    title: 'Lo directo es más amplio que este instante',
    visual: <DirectConstellation compact />,
    subtitle: 'Sensación · memoria · introspección · yo probable · universales',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:30.</strong> Presenta el inventario como una ampliación necesaria.</p>
        <p>
          Sensación: datos presentes. Memoria: datos antes presentados y fuente de todo saber del pasado.
          Introspección: pensamientos, sentimientos, deseos y actos mentales propios. Universales: ideas
          generales como blancura, diversidad y fraternidad.
        </p>
        <p>
          Marca la excepción: Russell considera probable, no indudable, el conocimiento directo del yo.
          Tampoco incluye objetos físicos ni mentes ajenas entre lo directamente conocido.
        </p>
        <p><strong>Transición:</strong> «En el inventario hay una pieza que Russell dibuja con línea discontinua: el yo».</p>
      </>
    ),
  },
  {
    id: 'yo',
    eyebrow: 'ACTO I · Presencia · 05',
    title: 'Encuentro pensamientos. ¿Encuentro al pensador?',
    visual: <SubjectRelation compact />,
    subtitle: 'La relación parece exigir un sujeto; no demuestra una persona permanente.',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:00.</strong> Distingue introspección y conocimiento del yo.</p>
        <p>
          Cuando conozco «mi acto de ver el sol», aparecen el dato sensorial, el acto y aquello que conoce.
          Pero al mirar hacia dentro encuentro pensamientos y sentimientos particulares, no con claridad un
          yo permanente idéntico ayer y hoy.
        </p>
        <p>
          La conclusión textual es deliberadamente cauta: algún conocimiento del sujeto parece necesario y
          probable, pero no es prudente llamarlo indudable.
        </p>
        <p><strong>Transición:</strong> «Y lo más extraño del inventario no es el yo: también lo general puede presentarse».</p>
      </>
    ),
  },
  {
    id: 'universales',
    eyebrow: 'ACTO I · Presencia · 06',
    title: 'Lo más abstracto también puede ser directo',
    body: (
      <div
        className="universal-field"
        role="img"
        aria-label="Concebir significa aprehender un universal; alrededor aparecen blancura, diversidad, fraternidad, semejanza, relación y causar"
      >
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
    subtitle: 'Sin términos generales no habría una sola oración completa.',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 1:45.</strong> Usa un verbo sencillo: «tocar» vale para muchos actos particulares.</p>
        <p>
          Russell llama <em>concebir</em> al acto de aprehender un universal y <em>concepto</em> al universal
          aprehendido. Toda frase completa contiene al menos una palabra universal, porque los verbos tienen
          sentido general. No todo lo directamente conocido es particular y existente; tampoco afirma que
          todo universal sea directo, pues muchos universales solo se conocen por referencia.
        </p>
        <p><strong>Transición:</strong> «Ya tenemos las piezas. Ahora veamos la máquina que construye lo ausente».</p>
      </>
    ),
  },
  {
    id: 'descripcion',
    eyebrow: 'ACTO II · Distancia · 07',
    title: 'La palabra «el» abre una puerta lógica',
    visual: <DescriptionGate compact />,
    body: <div className="logic-formula" role="img" aria-label="Existe exactamente un x tal que x es F">∃!x F(x)</div>,
    subtitle: 'No basta con que exista un F: debe existir uno y solo uno.',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:00.</strong> Contrasta «un hombre» con «el hombre de la máscara de hierro».</p>
        <p>
          La primera es una referencia ambigua; la segunda, definida. En el vocabulario del capítulo,
          «el F existe» quiere decir que hay justamente un objeto que es F. Podemos saber que existe ese
          único objeto aunque no tengamos conocimiento directo de él ni sepamos identificarlo.
        </p>
        <p>La fórmula ∃!x F(x) es una reconstrucción pedagógica compacta; no aparece impresa así en el capítulo.</p>
        <p><strong>Transición:</strong> «El siguiente caso demuestra que familiaridad e identificación pueden separarse».</p>
      </>
    ),
  },
  {
    id: 'ganador',
    eyebrow: 'ACTO II · Distancia · 08',
    title: 'Conozco a cada candidato. Aún no conozco «al ganador»',
    visual: <CandidateParadox compact />,
    subtitle: 'Familiaridad con las personas ≠ identificación bajo una descripción',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:00.</strong> Este es el contraejemplo decisivo; deja que el público responda.</p>
        <p>
          Supón que conocemos a todos los candidatos —en el único sentido en que es posible conocer
          directamente a otro, mediante datos asociados a su cuerpo— y sabemos que uno obtendrá más votos.
          Aun así, antes del resultado no conocemos ninguna proposición «A es el candidato que obtendrá
          mayor número de votos».
        </p>
        <p>
          Por tanto, conocer al objeto y saber que una descripción tiene referente no implica identificar qué
          objeto satisface esa descripción.
        </p>
        <p><strong>Transición:</strong> «Si una descripción puede separarse de la persona, ¿qué ocurre con un nombre propio?»</p>
      </>
    ),
  },
  {
    id: 'bismarck',
    eyebrow: 'ACTO II · Distancia · 09',
    title: 'Un solo Bismarck. Varios caminos mentales',
    visual: <BismarckDistance compact />,
    subtitle: 'El referente puede permanecer aunque cambie la descripción que lo alcanza.',
    variant: 'visual',
    notes: (
      <>
        <p><strong>Tiempo: 2:30.</strong> Cuenta la escala como un alejamiento progresivo.</p>
        <p>
          Para Bismarck mismo, el nombre podría designar directamente al yo, si ese conocimiento existe. Para
          alguien que lo trató, remite a datos sensoriales enlazados con su cuerpo. Para nosotros, a una
          descripción histórica como «el primer canciller del Imperio de Alemania» y a testimonios oídos o leídos.
        </p>
        <p>
          Después vienen el hombre de la máscara de hierro, cuya identidad ignoramos, y el hombre que ha vivido
          más tiempo, del que quizá solo sabemos lo deducible de la definición. No todos los nombres colocan el
          mismo contenido en cada mente.
        </p>
        <p><strong>Transición:</strong> «La distancia parece crecer sin límite. Russell le impone una condición».</p>
      </>
    ),
  },
  {
    id: 'principio',
    eyebrow: 'ACTO III · Alcance · 10 · La condición · p. 56',
    title: (
      <>
        «Toda proposición que podamos entender debe estar compuesta exclusivamente por elementos de los
        cuales tengamos un conocimiento directo.»
      </>
    ),
    body: (
      <div className="caesar-chain">
        <span>particulares + universales conocidos</span>
        <i aria-hidden="true">→</i>
        <span>«El hombre que fue asesinado en los Idus de marzo»</span>
        <i aria-hidden="true">→</i>
        <span>JULIO CÉSAR AUSENTE</span>
      </div>
    ),
    variant: 'quote',
    notes: (
      <>
        <p><strong>Tiempo: 2:30.</strong> Lee la cita lentamente: es el principio fundamental del capítulo.</p>
        <p>
          Julio César no está presente como individuo en nuestro pensamiento. En su lugar opera una referencia:
          «El hombre que fue asesinado en los Idus de marzo», «el fundador del Imperio romano» o incluso «el
          hombre cuyo nombre era Julio César». La descripción se compone de particulares y universales conocidos
          directamente.
        </p>
        <p>
          La condición no encierra el conocimiento: explica cómo una proposición significativa puede tratar sobre
          un individuo nunca experimentado.
        </p>
        <p><strong>Transición:</strong> «Antes de celebrar la salida, distingamos lo que Russell afirma de lo que deja abierto».</p>
      </>
    ),
  },
  {
    id: 'cautelas',
    eyebrow: 'ACTO III · Alcance · 11 · Control de fidelidad',
    title: 'No todo tiene el mismo grado de compromiso',
    body: (
      <div className="tension-grid">
        <article>
          <span>AFIRMA</span>
          <strong>Dos vías</strong>
          <p>Lo directo funda; la referencia implica verdades.</p>
        </article>
        <article>
          <span>MATIZA</span>
          <strong>El yo</strong>
          <p>Probable, pero no prudente llamarlo indudable.</p>
        </article>
        <article>
          <span>DESPUÉS</span>
          <strong>Universales</strong>
          <p>Los desarrolla después; aquí fija su función.</p>
        </article>
        <article>
          <span>ABRE</span>
          <strong>Objeciones</strong>
          <p>Admite que el principio aún debe defenderse.</p>
        </article>
      </div>
    ),
    variant: 'split',
    notes: (
      <>
        <p><strong>Tiempo: 1:30.</strong> Usa esta diapositiva para no sobreatribuirle tesis al autor.</p>
        <p>
          Russell afirma la dependencia última respecto del conocimiento directo; presenta como probable el yo;
          remite el estudio de los universales a capítulos posteriores; y reconoce que todavía no responde todas
          las objeciones al principio fundamental.
        </p>
        <p>
          Recuerdos falsos, percepción cargada de conceptos o teorías rivales de los nombres son preguntas críticas
          útiles, pero no conclusiones del capítulo 5.
        </p>
        <p><strong>Transición:</strong> «Con esas cautelas, volvamos a la mesa que dejamos esperando».</p>
      </>
    ),
  },
  {
    id: 'respuesta',
    eyebrow: 'ACTO III · Alcance · 12 · Respuesta',
    title: 'La mesa no se presenta. La alcanzamos.',
    visual: <AnchorReach compact />,
    subtitle: 'El dato ancla; las verdades y descripciones extienden el conocimiento.',
    variant: 'closing',
    notes: (
      <>
        <p><strong>Tiempo: 1:30.</strong> Pide otra vez tocar la mesa.</p>
        <p>
          El color, la forma y la resistencia se presentan directamente. La mesa física se conoce como el objeto
          que causa esos datos. No son dos mundos separados: una verdad puente convierte la presencia
          en referencia.
        </p>
        <p>
          Cierra con la ganancia del capítulo: la referencia nos permite «ir más allá de los límites de nuestra
          experiencia privada» (p. 57). Una experiencia diminuta no nos condena a un mundo diminuto.
        </p>
        <p><strong>Última frase:</strong> «Lo directo nos da anclaje; la referencia, alcance».</p>
      </>
    ),
  },
];
