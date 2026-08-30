import { motion } from 'framer-motion';
import { useId } from 'react';

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
};

type VisualProps = {
  compact?: boolean;
};

export function EpistemicField() {
  const nodes = [
    [6, 18], [14, 72], [23, 35], [31, 84], [42, 14], [49, 58],
    [57, 32], [66, 78], [74, 16], [83, 49], [92, 27], [96, 82],
  ];

  return (
    <div className="epistemic-field" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="field-line" x1="0" x2="1">
            <stop offset="0" stopColor="var(--direct)" />
            <stop offset="0.5" stopColor="var(--paper)" />
            <stop offset="1" stopColor="var(--reference)" />
          </linearGradient>
        </defs>
        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[index + 1];
          return (
            <motion.line
              key={`line-${index}`}
              x1={node[0]}
              y1={node[1]}
              x2={next[0]}
              y2={next[1]}
              stroke="url(#field-line)"
              strokeWidth="0.16"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.08, 0.3, 0.08] }}
              transition={{ duration: 5 + index * 0.2, repeat: Infinity }}
            />
          );
        })}
        {nodes.map((node, index) => (
          <motion.circle
            key={`node-${index}`}
            cx={node[0]}
            cy={node[1]}
            r={index === 5 || index === 6 ? 0.8 : 0.45}
            fill={index < 6 ? 'var(--direct)' : 'var(--reference)'}
            animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.25, 1] }}
            transition={{ duration: 3.2 + index * 0.18, repeat: Infinity }}
          />
        ))}
      </svg>
    </div>
  );
}

export function KnowledgeTree({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  return (
    <svg
      className={`concept-visual knowledge-tree${compact ? ' is-compact' : ''}`}
      viewBox="0 0 920 500"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Taxonomía del conocimiento en el capítulo cinco</title>
      <desc id={descriptionId}>El conocimiento se divide en conocimiento de verdades y de cosas. El conocimiento de cosas se divide en directo, sin inferencia, y por referencia, que implica verdades.</desc>
      <motion.path
        d="M460 96 V150 M460 150 H238 V202 M460 150 H682 V202"
        className="line-neutral"
        variants={draw}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.9 }}
      />
      <motion.path
        d="M682 276 V322 M682 322 H570 V374 M682 322 H794 V374"
        className="line-reference"
        variants={draw}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.8, delay: 0.35 }}
      />

      <g className="visual-node neutral-node">
        <rect x="348" y="34" width="224" height="62" rx="18" />
        <text x="460" y="72">CONOCIMIENTO</text>
      </g>
      <g className="visual-node truth-node">
        <rect x="126" y="202" width="224" height="74" rx="18" />
        <text x="238" y="234">DE VERDADES</text>
        <text x="238" y="257" className="node-caption">saber que p</text>
      </g>
      <g className="visual-node neutral-node">
        <rect x="570" y="202" width="224" height="74" rx="18" />
        <text x="682" y="234">DE COSAS</text>
        <text x="682" y="257" className="node-caption">conocer x</text>
      </g>
      <g className="visual-node direct-node">
        <rect x="458" y="374" width="224" height="82" rx="18" />
        <text x="570" y="407">DIRECTO</text>
        <text x="570" y="433" className="node-caption">sin inferencia</text>
      </g>
      <g className="visual-node reference-node">
        <rect x="682" y="374" width="224" height="82" rx="18" />
        <text x="794" y="407">REFERENCIA</text>
        <text x="794" y="433" className="node-caption">«el F»</text>
      </g>
      <motion.path
        d="M700 409 C630 332 423 326 294 276"
        className="line-reference dashed"
        variants={draw}
        initial="hidden"
        animate="visible"
        transition={{ duration: 1, delay: 0.7 }}
      />
      <text x="469" y="326" className="edge-label">implica verdades</text>
    </svg>
  );
}

export function TableBridge({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const steps = [
    { x: 38, label: ['VER / TOCAR'], kind: 'neutral' },
    { x: 212, label: ['COLOR · FORMA', 'DUREZA'], kind: 'direct' },
    { x: 422, label: ['VERDAD', 'PUENTE'], kind: 'bridge' },
    { x: 614, label: ['«EL OBJETO', 'QUE LOS CAUSA»'], kind: 'reference' },
    { x: 826, label: ['MESA', 'FÍSICA'], kind: 'reference' },
  ];

  return (
    <svg
      className={`concept-visual table-bridge${compact ? ' is-compact' : ''}`}
      viewBox="0 0 1040 360"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Cadena desde la percepción hasta la mesa física conocida por referencia</title>
      <desc id={descriptionId}>Una secuencia va de ver y tocar a los datos de color, forma y dureza; una verdad puente los conecta con la descripción del objeto que los causa y, finalmente, con la mesa física.</desc>
      <defs>
        <marker id={`arrow-${titleId}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="currentColor" />
        </marker>
      </defs>
      <path d="M116 180 H938" className="bridge-spine" />
      {steps.map((step, index) => (
        <motion.g
          key={step.x}
          className={`bridge-step ${step.kind}-step`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.16, duration: 0.45 }}
        >
          <circle cx={step.x + 72} cy="180" r="11" />
          <rect x={step.x} y={index % 2 === 0 ? 58 : 220} width="144" height="78" rx="16" />
          <path d={index % 2 === 0 ? `M${step.x + 72} 136 V169` : `M${step.x + 72} 191 V220`} />
          {step.label.map((line, lineIndex) => (
            <text
              key={line}
              x={step.x + 72}
              y={(index % 2 === 0 ? 91 : 253) + lineIndex * 22}
            >
              {line}
            </text>
          ))}
        </motion.g>
      ))}
      <text x="314" y="314" className="zone-label direct-label">PRESENTACIÓN</text>
      <text x="732" y="38" className="zone-label reference-label">DESCRIPCIÓN</text>
    </svg>
  );
}

export function DirectConstellation({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const items = [
    { x: 454, y: 64, label: 'SENSACIÓN', note: 'presente' },
    { x: 724, y: 166, label: 'MEMORIA', note: 'pasado' },
    { x: 668, y: 390, label: 'INTROSPECCIÓN', note: 'vida mental' },
    { x: 240, y: 390, label: 'UNIVERSALES', note: 'conceptos' },
    { x: 184, y: 166, label: 'YO', note: 'probable' },
  ];

  return (
    <svg
      className={`concept-visual direct-constellation${compact ? ' is-compact' : ''}`}
      viewBox="0 0 908 500"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Cinco clases de objetos del conocimiento directo</title>
      <desc id={descriptionId}>El conocimiento directo ocupa el centro y se conecta con sensación presente, memoria del pasado, introspección de la vida mental, universales o conceptos y el yo, cuyo conocimiento Russell considera probable.</desc>
      <circle cx="454" cy="257" r="74" className="orbit-core" />
      <circle cx="454" cy="257" r="179" className="orbit-ring" />
      <text x="454" y="247" className="core-title">DIRECTO</text>
      <text x="454" y="276" className="core-note">presencia</text>
      {items.map((item, index) => (
        <motion.g
          key={item.label}
          className={item.label === 'YO' ? 'orbit-item uncertain-item' : 'orbit-item'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 * index, type: 'spring', stiffness: 110 }}
        >
          <line x1="454" y1="257" x2={item.x} y2={item.y} />
          <circle cx={item.x} cy={item.y} r="58" />
          <text x={item.x} y={item.y - 3}>{item.label}</text>
          <text x={item.x} y={item.y + 20} className="node-caption">{item.note}</text>
        </motion.g>
      ))}
    </svg>
  );
}

export function SubjectRelation({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  return (
    <svg
      className={`concept-visual subject-relation${compact ? ' is-compact' : ''}`}
      viewBox="0 0 960 390"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Relación entre el sujeto, el acto de ver y el dato sensorial</title>
      <desc id={descriptionId}>Un yo interrogado conoce el acto de ver, que tiene por objeto un dato sensorial. La relación parece exigir un sujeto, pero no demuestra la existencia de un yo permanente.</desc>
      <motion.path d="M240 195 H408" className="line-direct" variants={draw} initial="hidden" animate="visible" />
      <motion.path d="M552 195 H720" className="line-direct" variants={draw} initial="hidden" animate="visible" transition={{ delay: 0.25 }} />
      <g className="subject-node uncertain-node">
        <circle cx="164" cy="195" r="76" />
        <text x="164" y="189">¿YO?</text>
        <text x="164" y="216" className="node-caption">probable</text>
      </g>
      <g className="subject-node direct-node">
        <rect x="408" y="126" width="144" height="138" rx="28" />
        <text x="480" y="188">ACTO</text>
        <text x="480" y="215" className="node-caption">de ver</text>
      </g>
      <g className="subject-node direct-node">
        <circle cx="796" cy="195" r="76" />
        <text x="796" y="187">DATO</text>
        <text x="796" y="214" className="node-caption">«el sol»</text>
      </g>
      <text x="324" y="174" className="edge-label">conoce</text>
      <text x="636" y="174" className="edge-label">tiene por objeto</text>
      <path d="M164 286 C270 352 690 352 796 286" className="line-uncertain dashed" />
      <text x="480" y="354" className="uncertain-label">la relación exige un sujeto; no demuestra un yo permanente</text>
    </svg>
  );
}

export function DescriptionGate({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  return (
    <svg
      className={`concept-visual description-gate${compact ? ' is-compact' : ''}`}
      viewBox="0 0 920 470"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Decisión lógica para una descripción definida</title>
      <desc id={descriptionId}>La descripción el F pregunta si existe exactamente un objeto F. Si no, no identifica un objeto único; si sí, permite la referencia expresada como existe un único x tal que F de x.</desc>
      <defs>
        <marker id={`gate-arrow-${titleId}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="currentColor" />
        </marker>
      </defs>
      <g className="gate-node neutral-node">
        <rect x="340" y="24" width="240" height="66" rx="18" />
        <text x="460" y="64">DESCRIPCIÓN «EL F»</text>
      </g>
      <path d="M460 90 V132" className="line-neutral" />
      <g className="gate-diamond">
        <path d="M460 132 L610 204 L460 276 L310 204 Z" />
        <text x="460" y="198">¿EXISTE</text>
        <text x="460" y="224">EXACTAMENTE UNO?</text>
      </g>
      <path d="M310 204 H170 V326" className="line-fail" />
      <text x="216" y="183" className="edge-label fail-label">NO</text>
      <g className="gate-node fail-node">
        <rect x="52" y="326" width="236" height="78" rx="18" />
        <text x="170" y="358">NO IDENTIFICA</text>
        <text x="170" y="383" className="node-caption">un objeto único</text>
      </g>
      <path d="M610 204 H750 V326" className="line-reference" />
      <text x="704" y="183" className="edge-label reference-label">SÍ</text>
      <g className="gate-node reference-node">
        <rect x="632" y="326" width="236" height="78" rx="18" />
        <text x="750" y="358">REFERENCIA</text>
        <text x="750" y="383" className="node-caption">∃!x F(x)</text>
      </g>
    </svg>
  );
}

export function CandidateParadox({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const people = [188, 316, 444, 572, 700];
  return (
    <svg
      className={`concept-visual candidate-paradox${compact ? ' is-compact' : ''}`}
      viewBox="0 0 888 460"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Cinco candidatos conocidos y un ganador todavía no identificado</title>
      <desc id={descriptionId}>Cinco personas, A, B, C, D y E, son conocidas. Sabemos que exactamente una ganará, pero aún no sabemos qué persona satisface la descripción el ganador.</desc>
      <text x="444" y="54" className="visual-kicker">CONOZCO A LAS CINCO PERSONAS</text>
      {people.map((x, index) => (
        <motion.g
          key={x}
          className="person-symbol"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <circle cx={x} cy="148" r="28" />
          <path d={`M${x - 46} 234 Q${x} 172 ${x + 46} 234`} />
          <text x={x} y="280">{String.fromCharCode(65 + index)}</text>
        </motion.g>
      ))}
      <path d="M188 320 H700" className="line-neutral dashed" />
      <text x="444" y="354" className="visual-kicker">EXACTAMENTE UNA GANARÁ</text>
      <rect x="274" y="378" width="340" height="58" rx="18" className="winner-box" />
      <text x="444" y="414" className="winner-text">¿QUIÉN ES «EL GANADOR»?</text>
    </svg>
  );
}

export function BismarckDistance({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  const stops = [
    { x: 74, label: ['SÍ MISMO'], note: 'yo probable', level: 'near' },
    { x: 258, label: ['CONOCIDO'], note: 'presencia', level: 'near' },
    { x: 442, label: ['HISTORIA'], note: 'testimonio', level: 'middle' },
    { x: 626, label: ['MÁSCARA'], note: 'sin identidad', level: 'far' },
    { x: 810, label: ['MÁS LONGEVO'], note: 'definición', level: 'far' },
  ];
  return (
    <svg
      className={`concept-visual bismarck-distance${compact ? ' is-compact' : ''}`}
      viewBox="0 0 884 420"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>Escala de distancia epistemológica propuesta por Russell</title>
      <desc id={descriptionId}>La escala se aleja progresivamente de la presentación: uno mismo, una persona conocida, Bismarck por la historia, el hombre de la máscara de hierro y el hombre más longevo conocido solo por definición.</desc>
      <defs>
        <linearGradient id={`distance-gradient-${titleId}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--direct)" />
          <stop offset="1" stopColor="var(--reference)" />
        </linearGradient>
      </defs>
      <path d="M74 196 H810" stroke={`url(#distance-gradient-${titleId})`} className="distance-spine" />
      {stops.map((stop, index) => (
        <motion.g
          key={stop.x}
          className={`distance-stop ${stop.level}-stop`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.13 }}
        >
          <circle cx={stop.x} cy="196" r={index === 0 ? 30 : 22} />
          <line x1={stop.x} y1="222" x2={stop.x} y2="266" />
          {stop.label.map((line, lineIndex) => (
            <text key={line} x={stop.x} y={296 + lineIndex * 22}>{line}</text>
          ))}
          <text x={stop.x} y={348} className="node-caption">{stop.note}</text>
        </motion.g>
      ))}
      <text x="74" y="90" className="distance-pole direct-label">PRESENTACIÓN</text>
      <text x="810" y="90" className="distance-pole reference-label">DESCRIPCIÓN</text>
      <text x="442" y="388" className="edge-label">aumenta la distancia respecto del particular</text>
    </svg>
  );
}

export function AnchorReach({ compact = false }: VisualProps) {
  const titleId = useId();
  const descriptionId = `${titleId}-description`;
  return (
    <svg
      className={`concept-visual anchor-reach${compact ? ' is-compact' : ''}`}
      viewBox="0 0 980 440"
      role="img"
      aria-labelledby={`${titleId} ${descriptionId}`}
    >
      <title id={titleId}>El conocimiento directo ancla y la referencia amplía el conocimiento</title>
      <desc id={descriptionId}>El conocimiento directo proporciona el anclaje; las verdades y los conceptos forman el puente hacia el alcance de la referencia y permiten conocer un mundo mayor que la experiencia privada.</desc>
      <defs>
        <linearGradient id={`reach-gradient-${titleId}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--direct)" />
          <stop offset="0.48" stopColor="var(--paper)" />
          <stop offset="1" stopColor="var(--reference)" />
        </linearGradient>
      </defs>
      <motion.path
        d="M110 220 C260 70 370 370 490 220 C610 70 720 370 870 220"
        stroke={`url(#reach-gradient-${titleId})`}
        className="reach-wave"
        variants={draw}
        initial="hidden"
        animate="visible"
        transition={{ duration: 1.5 }}
      />
      <g className="reach-pole direct-pole">
        <circle cx="110" cy="220" r="78" />
        <text x="110" y="208">DIRECTO</text>
        <text x="110" y="239" className="node-caption">ANCLAJE</text>
      </g>
      <g className="reach-center">
        <circle cx="490" cy="220" r="64" />
        <text x="490" y="211">VERDADES</text>
        <text x="490" y="239" className="node-caption">y conceptos</text>
      </g>
      <g className="reach-pole reference-pole">
        <circle cx="870" cy="220" r="78" />
        <text x="870" y="208">REFERENCIA</text>
        <text x="870" y="239" className="node-caption">ALCANCE</text>
      </g>
      <text x="490" y="392" className="reach-conclusion">un mundo mayor que la experiencia privada</text>
    </svg>
  );
}
