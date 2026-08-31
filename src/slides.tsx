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

type SpeakerNotesProps = {
  slideId: string;
  time: string;
  objective: ReactNode;
  opening: ReactNode;
  explanation: ReactNode;
  interaction: ReactNode;
  pitfall: ReactNode;
  transition: ReactNode;
};

function SpeakerNotes({
  slideId,
  time,
  objective,
  opening,
  explanation,
  interaction,
  pitfall,
  transition,
}: SpeakerNotesProps) {
  return (
    <article className="speaker-note" aria-label={`Guion oral de la diapositiva ${slideId}`}>
      <header className="speaker-note__header">
        <p className="speaker-note__time"><strong>Tiempo:</strong> {time}</p>
        <p className="speaker-note__objective"><strong>Objetivo:</strong> {objective}</p>
      </header>
      <section className="speaker-note__beat speaker-note__beat--opening">
        <h4>Frase de apertura</h4>
        <div className="speaker-note__content">{opening}</div>
      </section>
      <section className="speaker-note__beat speaker-note__beat--explanation">
        <h4>Explicación</h4>
        <div className="speaker-note__content">{explanation}</div>
      </section>
      <section className="speaker-note__beat speaker-note__beat--interaction">
        <h4>Ejemplo o pregunta al público</h4>
        <div className="speaker-note__content">{interaction}</div>
      </section>
      <aside className="speaker-note__pitfall">
        <h4>Error que debes evitar</h4>
        <div className="speaker-note__content">{pitfall}</div>
      </aside>
      <footer className="speaker-note__transition">
        <strong>Transición:</strong>
        <div className="speaker-note__transition-copy">{transition}</div>
      </footer>
    </article>
  );
}

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
      <SpeakerNotes
        slideId="1"
        time="1:30"
        objective="Instalar la diferencia entre lo que se presenta y el objeto físico, sin resolverla todavía."
        opening={<p>«Antes de definir nada, toca la mesa. Dime qué aparece ante tu vista y bajo tu mano».</p>}
        explanation={(
          <p>
            Recoge palabras como color, forma, textura, frío, dureza y resistencia. Son candidatos a datos de
            los sentidos. La pregunta no es aún si la mesa existe, sino si el objeto físico se presenta del
            mismo modo que esas cualidades.
          </p>
        )}
        interaction={(
          <p>
            Pide a una persona que toque la mesa y pregunta: «¿Cuál de todo eso es <em>la mesa física</em>?».
            Guarda cinco segundos de silencio y deja la pregunta abierta.
          </p>
        )}
        pitfall={(
          <p>No concluyas «solo hay sensaciones» ni niegues la mesa. Este momento crea el problema; no lo resuelve.</p>
        )}
        transition={<p>«Russell convierte esta duda cotidiana en un mapa completo de nuestro conocimiento».</p>}
      />
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
      <SpeakerNotes
        slideId="2"
        time="1:00"
        objective="Presentar la promesa del recorrido: explicar cómo una experiencia privada estrecha alcanza objetos ausentes."
        opening={<p>«Nuestra experiencia inmediata cabe en muy poco; nuestro conocimiento, en cambio, habla de un mundo inmenso».</p>}
        explanation={(
          <p>
            Contrasta este color, este recuerdo y este pensamiento con mesas físicas, otras mentes, Bismarck y
            Julio César. «Anclaje» y «alcance» son una <strong>PARÁFRASIS</strong> pedagógica del movimiento del
            capítulo, no palabras de Russell.
          </p>
        )}
        interaction={<p>Pregunta: «¿Quién sabe algo de Bismarck sin haberlo conocido?». Una mano basta para mostrar el problema.</p>}
        pitfall={<p>No presentes la fórmula «directo = anclaje; referencia = alcance» como una cita textual.</p>}
        transition={<p>«Para responder, Russell abre primero la palabra conocer».</p>}
      />
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
      <SpeakerNotes
        slideId="3"
        time="2:00"
        objective="Distinguir conocimiento de cosas y de verdades, y después conocimiento directo y por referencia."
        opening={<p>«Russell usa la palabra conocer para dos trabajos distintos. Si no los separamos, todo el capítulo se vuelve borroso».</p>}
        explanation={(
          <p>
            Recorre el árbol de arriba abajo. Saber <em>que p</em> es conocimiento de verdades; conocer
            <em> x</em> es conocimiento de cosas. Este último puede ser directo —lógicamente independiente de
            una inferencia— o por referencia —fundado en verdades de enlace—. La independencia es lógica, no
            la afirmación psicológica de que percibimos sin pensar simultáneamente nada.
          </p>
        )}
        interaction={(
          <p>Pide clasificar dos expresiones: «veo este matiz» y «sé que este matiz es oscuro». La primera apunta a la cosa; la segunda, a una verdad sobre ella.</p>
        )}
        pitfall={<p>No traduzcas el contraste como «verdadero frente a dudoso» ni como una secuencia temporal obligatoria.</p>}
        transition={<p>«Veamos la independencia lógica en un caso que todos podemos observar».</p>}
      />
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
      <SpeakerNotes
        slideId="4"
        time="2:00"
        objective="Mostrar que el conocimiento del dato no depende lógicamente de las proposiciones que formulamos sobre él."
        opening={<p>«Miren primero el matiz. Ahora escuchen las frases: “es castaño”, “es oscuro”. ¿Las frases añadieron más color?».</p>}
        explanation={(
          <p>
            El matiz está presentado cuando lo vemos; podemos <em>además</em> clasificarlo. Esas clasificaciones
            añaden verdades sobre el color, no más conocimiento del color mismo. Russell escribe que lo conocemos
            «de un modo perfecto y completo» —<strong>CITA, p. 48</strong>— en el sentido preciso de que no
            llegamos al dato por inferencia.
          </p>
        )}
        interaction={<p>Señala el círculo y pregunta: «¿Qué añadió la palabra <em>castaño</em>: presencia o una verdad?».</p>}
        pitfall={(
          <p>
            No digas que el color llega cronológicamente antes que toda frase, que conocemos todas sus propiedades
            o que los juicios posteriores son infalibles.
          </p>
        )}
        transition={<p>«El color se presenta. La mesa física, en cambio, no se presenta de ese modo».</p>}
      />
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
      <SpeakerNotes
        slideId="5"
        time="2:30"
        objective="Reconstruir el paso específico de los datos sensoriales a la mesa física conocida por referencia."
        opening={<p>«Hasta aquí no hemos salido del color y la resistencia. El salto ocurre cuando preguntamos qué los causa».</p>}
        explanation={(
          <p>
            Avanza de izquierda a derecha: datos directamente conocidos; verdad de enlace; descripción; objeto
            físico referido. La mesa es «el objeto físico que causa tales y cuales datos de los sentidos»
            —<strong>CITA, p. 48</strong>—. Lo directamente presentado no es idéntico al objeto que se describe
            como su causa.
          </p>
        )}
        interaction={<p>Pregunta: «¿Cuál es el último eslabón que realmente ven o tocan?». La respuesta son los datos, no la mesa física como tal.</p>}
        pitfall={(
          <p>
            No digas que Russell niega la mesa. Tampoco conviertas esta cadena causal, propia del ejemplo de la
            mesa, en la forma universal de toda referencia.
          </p>
        )}
        transition={<p>«Si lo directo terminara en este instante sensible, ni siquiera sabríamos que existe un pasado».</p>}
      />
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
      <SpeakerNotes
        slideId="6"
        time="2:30"
        objective="Ampliar el inventario directo más allá de la sensación presente sin borrar sus diferentes grados de certeza."
        opening={<p>«Si lo directo fuera solo lo que siento ahora, no habría pasado, vida mental comprensible ni términos generales».</p>}
        explanation={(
          <ul>
            <li><strong>Sensación:</strong> datos presentes.</li>
            <li><strong>Memoria:</strong> datos antes presentados y fuente de nuestro saber del pasado.</li>
            <li><strong>Introspección:</strong> pensamientos, sentimientos, deseos y actos mentales propios.</li>
            <li><strong>Universales:</strong> algunos términos generales, como blancura o diversidad.</li>
            <li><strong>Yo:</strong> conocimiento probable, no indudable.</li>
          </ul>
        )}
        interaction={(
          <p>
            Pide recordar el desayuno y luego notar el acto presente de recordarlo. Pregunta: «¿Qué corresponde a
            memoria y qué a introspección?».
          </p>
        )}
        pitfall={(
          <p>
            Memoria como fuente no significa recuerdo siempre verdadero. No incluyas objetos físicos ni mentes
            ajenas entre lo directo, ni afirmes que todos los universales lo sean.
          </p>
        )}
        transition={<p>«Una pieza del inventario conserva un signo de interrogación: ¿conocemos también al yo que conoce?».</p>}
      />
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
      <SpeakerNotes
        slideId="7"
        time="2:00"
        objective="Distinguir la consciencia de estados mentales del conocimiento de un sujeto permanente."
        opening={<p>«Cuando miro hacia dentro encuentro un pensamiento. La pregunta difícil es si encuentro también al pensador».</p>}
        explanation={(
          <p>
            En «mi acto de ver el sol» distinguimos el dato sensorial, el acto cognitivo y algo que conoce.
            Russell juzga probable algún conocimiento directo de ese sujeto, pues comprendemos «yo conozco este
            dato». Pero no deriva de ahí una persona permanente, idéntica ayer y hoy, ni una certeza indudable.
          </p>
        )}
        interaction={<p>Invita a notar durante tres segundos un pensamiento y pregunta: «¿Apareció con igual claridad el yo que lo tiene?».</p>}
        pitfall={<p>No conviertas la cautela de Russell en una certeza cartesiana ni confundas introspección de un estado con prueba de un yo permanente.</p>}
        transition={<p>«El inventario guarda otra sorpresa: no todo lo directo tiene que ser particular y existente».</p>}
      />
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
      <SpeakerNotes
        slideId="8"
        time="1:45"
        objective="Explicar por qué algunos universales forman parte de los elementos directamente conocidos."
        opening={<p>«Intenten comprender “esta mesa resiste” sin usar nada general. Incluso el verbo ya rebasa este caso particular».</p>}
        explanation={(
          <p>
            <em>Concebir</em> es el acto de aprehender un universal; <em>concepto</em> es el universal aprehendido.
            Toda frase completa contiene al menos un término universal porque sus verbos tienen sentido general.
            Russell desarrolla esta teoría después y añade que muchos universales solo se conocen por referencia.
          </p>
        )}
        interaction={<p>Pide trasladar el verbo «resistir» a dos casos distintos. Su aplicabilidad general hace visible la función del universal.</p>}
        pitfall={<p>No confundas el acto de concebir con el concepto ni afirmes que Russell considera directamente conocido todo universal.</p>}
        transition={<p>«Ya tenemos particulares y universales; ahora podemos construir una descripción de lo ausente».</p>}
      />
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
      <SpeakerNotes
        slideId="9"
        time="2:00"
        objective="Explicar que una referencia definida exige existencia y unicidad, aunque no ofrezca identificación."
        opening={<p>«Entre “un hombre” y “el hombre” hay una diferencia lógica: el segundo pretende señalar exactamente a uno».</p>}
        explanation={(
          <p>
            «Un hombre» es referencia ambigua; «el hombre de la máscara de hierro», definida. Decir que
            «el F existe» significa que hay justamente un objeto F. Podemos saberlo sin conocimiento directo
            de ese objeto y sin poder decir cuál es. ∃!x F(x) es una <strong>EXTENSIÓN PEDAGÓGICA</strong>:
            resume existencia y unicidad, pero no aparece así en el capítulo.
          </p>
        )}
        interaction={<p>Contrasta «un estudiante» con «el estudiante que obtuvo la nota más alta». Pregunta qué dos condiciones exige la segunda expresión.</p>}
        pitfall={<p>No confundas saber que existe exactamente un F con saber qué individuo es F; tampoco atribuyas la fórmula simbólica a Russell.</p>}
        transition={<p>«Veamos un caso en que conocemos a todas las personas y, aun así, no sabemos quién satisface la descripción».</p>}
      />
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
      <SpeakerNotes
        slideId="10"
        time="2:00"
        objective="Demostrar que la familiaridad disponible con un individuo no equivale a identificarlo bajo una descripción."
        opening={<p>«Conozco a A, B, C, D y E. Sé que exactamente uno ganará. ¿Sé ya quién es “el ganador”?».</p>}
        explanation={(
          <p>
            Antes del resultado sabemos que existe un único candidato con más votos, pero no conocemos ninguna
            proposición «A es el candidato que obtendrá mayor número de votos». El individuo y la descripción
            pueden estar disponibles sin que conozcamos la identidad que los conecta.
          </p>
        )}
        interaction={<p>Deja que alguien elija una letra y pregunta: «¿Qué dato justificaría que esa persona es el ganador?». La familiaridad no basta.</p>}
        pitfall={(
          <p>
            No digas que conocemos directamente el cuerpo físico o la mente del candidato: respecto de otra
            persona, lo directo son datos sensoriales asociados con su cuerpo.
          </p>
        )}
        transition={<p>«Si una descripción puede separarse de la persona, preguntemos qué contiene realmente un nombre propio».</p>}
      />
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
      <SpeakerNotes
        slideId="11"
        time="2:30"
        objective="Mostrar cómo un referente puede permanecer mientras cambian las descripciones y aumenta la distancia epistemológica."
        opening={<p>«Un solo nombre puede activar pensamientos muy distintos sin dejar de pretender el mismo referente».</p>}
        explanation={(
          <p>
            Para Bismarck, el nombre podría apoyarse en el yo —si lo conoce directamente—. Quien lo trató
            conoce directamente datos sensoriales y refiere su cuerpo y mente. Nosotros dependemos de una
            descripción histórica y de testimonios oídos o leídos. La escala continúa con la máscara de hierro,
            cuya identidad ignoramos, y con el hombre más longevo, quizá conocido solo por lo deducible de la definición.
          </p>
        )}
        interaction={<p>Pregunta qué aparece en la mente al oír «Bertrand Russell». Compara dos respuestas para mostrar que el contenido descriptivo varía.</p>}
        pitfall={(
          <p>
            No pintes a quien trató a Bismarck como si conociera directamente al objeto físico: solo sus datos
            sensoriales son directos. Tampoco supongas idéntico contenido mental entre hablantes.
          </p>
        )}
        transition={<p>«La distancia puede crecer, pero Russell le impone una condición de significado».</p>}
      />
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
      <SpeakerNotes
        slideId="12"
        time="2:30"
        objective="Enunciar el principio fundamental y mostrar cómo permite comprender proposiciones sobre individuos ausentes."
        opening={<p>«Ahora sí, leamos lentamente la frase que Russell llama el principio fundamental».</p>}
        explanation={(
          <p>
            Lee la <strong>CITA de la p. 56</strong>. Julio César no comparece como individuo en la mente;
            opera una referencia como «El hombre que fue asesinado en los Idus de marzo». Sus constituyentes
            —sonidos, datos visuales, recuerdos y universales— pueden ser directamente conocidos. De ellos pasamos
            a la descripción y de la descripción al referente ausente.
          </p>
        )}
        interaction={<p>Pregunta: «Cuando piensan en Julio César, ¿qué está efectivamente presente: la persona o sonidos, trazos, recuerdos y conceptos?».</p>}
        pitfall={(
          <p>
            No marques a César como directamente conocido ni trates textos e imágenes físicas como datos directos.
            El principio no dice que solo podamos hablar de objetos ya experimentados.
          </p>
        )}
        transition={<p>«Antes de celebrar el alcance de la referencia, distingamos qué afirma Russell y qué deja abierto».</p>}
      />
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
      <SpeakerNotes
        slideId="13"
        time="1:30"
        objective="Separar afirmación, cautela, desarrollo posterior y problema abierto sin iniciar todavía el coloquio."
        opening={<p>«Estas cuatro casillas no tienen el mismo peso: afirmar, matizar, desarrollar después y dejar abierto no son lo mismo».</p>}
        explanation={(
          <p>
            Russell afirma la dependencia última respecto de lo directamente conocido; presenta el yo como
            probable; desarrolla los universales en capítulos posteriores; y admite que aún debe responder
            objeciones al principio fundamental. La autoconsciencia animal aparece como suposición, no como hecho científico.
          </p>
        )}
        interaction={<p>Pregunta solo: «¿Qué palabra protege aquí la fidelidad respecto del yo?». Espera «probable» y continúa; reserva las objeciones para el coloquio.</p>}
        pitfall={<p>No atribuyas a Russell las críticas sobre memoria, percepción o nombres, ni intentes discutir las cuatro en noventa segundos.</p>}
        transition={<p>«Con esas cautelas, volvamos a la mesa que dejamos esperando desde el comienzo».</p>}
      />
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
      <SpeakerNotes
        slideId="14"
        time="1:30"
        objective="Responder la pregunta inicial y cerrar el arco sin confundir datos directamente presentados con contacto directo con la mesa física."
        opening={<p>«Toquen otra vez la mesa. Ahora sí podemos responder qué conocen y de qué manera».</p>}
        explanation={(
          <p>
            Color, forma y resistencia se presentan directamente. La mesa física se conoce por referencia como
            el objeto que causa esos datos. Esta dependencia permite «ir más allá de los límites de nuestra
            experiencia privada» —<strong>CITA, p. 57</strong>—. «Anclaje» y «alcance» siguen siendo nuestra
            <strong> PARÁFRASIS</strong> de ese resultado.
          </p>
        )}
        interaction={<p>Pide completar dos frases: «Directamente conozco…» y «Por referencia conozco…». Busca «los datos» y «la mesa física».</p>}
        pitfall={<p>No hables de contacto directo con el mundo físico ni añadas otra tesis después de la frase final.</p>}
        transition={(
          <p>
            Haz una pausa y cierra: «Una experiencia diminuta no nos condena a un mundo diminuto: lo directo
            nos da anclaje; la referencia, alcance».
          </p>
        )}
      />
    ),
  },
];
