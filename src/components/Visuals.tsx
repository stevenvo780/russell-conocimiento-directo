import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useId, useState } from 'react';

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
};

type VisualProps = { compact?: boolean };

function useDiagramIds(prefix: string) {
  const suffix = useId().replace(/:/g, '');
  return {
    title: `${prefix}-${suffix}-title`,
    description: `${prefix}-${suffix}-description`,
    arrow: `${prefix}-${suffix}-arrow`,
    gradient: `${prefix}-${suffix}-gradient`,
    glow: `${prefix}-${suffix}-glow`,
  };
}

function reveal(reduced: boolean | null, delay = 0, duration = 0.55) {
  return {
    delay: reduced ? 0 : delay,
    duration: reduced ? 0 : duration,
    ease: [0.22, 1, 0.36, 1] as const,
  };
}

function responsiveStyle(compact: boolean) {
  return compact ? { width: '100%', maxWidth: '100%', minWidth: 0 } : undefined;
}

function useNarrowLayout(compact: boolean) {
  const [narrow, setNarrow] = useState(() => (
    compact && typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  ));

  useEffect(() => {
    if (!compact) return undefined;
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [compact]);

  return compact && narrow;
}

type MobileStep = {
  title: string;
  caption: string;
  kind?: 'neutral' | 'direct' | 'reference' | 'truth' | 'fail';
};

type MobileVisualProps = {
  className: string;
  ids: ReturnType<typeof useDiagramIds>;
  title: string;
  description: string;
  kicker: string;
  steps: MobileStep[];
  conclusion?: string;
  reduced: boolean | null;
};

function MobileFlow({ className, ids, title, description, kicker, steps, conclusion, reduced }: MobileVisualProps) {
  const top = 38;
  const row = conclusion ? 56 : 60;
  return (
    <svg className={`concept-visual ${className} is-compact is-mobile-layout`} data-layout="mobile-stack" style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 360" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>{title}</title>
      <desc id={ids.description}>{description}</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L6 3.5 L0 7 Z" fill="var(--paper)" opacity="0.72" /></marker>
      </defs>
      <text x="180" y="18" className="visual-kicker">{kicker}</text>
      {steps.map((step, index) => {
        const y = top + index * row;
        const nodeClass = step.kind === 'direct' ? 'direct-node' : step.kind === 'reference' ? 'reference-node' : step.kind === 'truth' ? 'truth-node' : step.kind === 'fail' ? 'fail-node' : 'neutral-node';
        return (
          <motion.g key={`${step.title}-${index}`} className={`visual-node ${nodeClass}`} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.1, 0.42)}>
            <rect x="25" y={y} width="310" height="45" rx="14" />
            <circle cx="48" cy={y + 22.5} r="11" fill={step.kind === 'reference' ? 'var(--reference)' : step.kind === 'direct' ? 'var(--direct)' : 'var(--surface-2)'} stroke="var(--line-strong)" />
            <text x="48" y={y + 26} style={{ fontSize: 9 }}>{String(index + 1).padStart(2, '0')}</text>
            <text x="68" y={y + 19} style={{ textAnchor: 'start', fontSize: 12 }}>{step.title}</text>
            <text x="68" y={y + 36} className="node-caption" style={{ textAnchor: 'start', fontSize: 10 }}>{step.caption}</text>
            {index < steps.length - 1 && <motion.path d={`M180 ${y + 45} V${y + row - 5}`} className={step.kind === 'direct' ? 'line-direct' : step.kind === 'reference' ? 'line-reference' : 'line-neutral'} markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.14 + index * 0.1, 0.36)} />}
          </motion.g>
        );
      })}
      {conclusion && <text x="180" y="344" className="reach-conclusion" style={{ fontSize: 10 }}>{conclusion}</text>}
    </svg>
  );
}

function MobileKnowledge({ ids, reduced }: Pick<MobileVisualProps, 'ids' | 'reduced'>) {
  return (
    <svg className="concept-visual knowledge-tree is-compact is-mobile-layout" data-layout="mobile-branch" style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 360" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Mapa del conocimiento según el capítulo cinco</title>
      <desc id={ids.description}>El conocimiento se divide en verdades y cosas. El conocimiento de cosas se divide en directo y por descripción. La descripción se apoya en verdades.</desc>
      <defs><marker id={ids.arrow} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L6 3.5 L0 7 Z" fill="var(--reference)" /></marker></defs>
      <text x="180" y="18" className="visual-kicker">LA ARQUITECTURA DE «CONOCER»</text>
      <g className="visual-node neutral-node"><rect x="94" y="34" width="172" height="46" rx="14" /><text x="180" y="62" style={{ fontSize: 12 }}>CONOCIMIENTO</text></g>
      <motion.path d="M180 80 V100 M180 100 H91 V119 M180 100 H269 V119" className="line-neutral" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.1)} />
      <motion.g className="visual-node truth-node" initial={reduced ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}><rect x="12" y="119" width="158" height="62" rx="14" /><text x="91" y="144" style={{ fontSize: 11 }}>DE VERDADES</text><text x="91" y="164" className="node-caption" style={{ fontSize: 9 }}>saber que p</text></motion.g>
      <motion.g className="visual-node neutral-node" initial={reduced ? false : { opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}><rect x="190" y="119" width="158" height="62" rx="14" /><text x="269" y="144" style={{ fontSize: 11 }}>DE COSAS</text><text x="269" y="164" className="node-caption" style={{ fontSize: 9 }}>conocer x</text></motion.g>
      <motion.path d="M269 181 V207 M269 207 H91 V229 M269 207 V229" className="line-neutral" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.34)} />
      <motion.g className="visual-node direct-node" initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.45)}><text x="91" y="220" className="zone-label direct-label">INMEDIATO</text><rect x="12" y="229" width="158" height="70" rx="14" /><text x="91" y="257" style={{ fontSize: 11 }}>DIRECTO</text><text x="91" y="278" className="node-caption" style={{ fontSize: 9 }}>presencia · sin inferir</text></motion.g>
      <motion.g className="visual-node reference-node" initial={reduced ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.54)}><text x="269" y="220" className="zone-label reference-label">MEDIADO</text><rect x="190" y="229" width="158" height="70" rx="14" /><text x="269" y="254" style={{ fontSize: 10 }}>POR DESCRIPCIÓN</text><text x="269" y="278" className="node-caption" style={{ fontSize: 9 }}>«el F» · verdades</text></motion.g>
      <motion.path d="M269 299 C250 332 132 332 96 182" className="line-reference dashed" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.68, 0.8)} />
      <rect x="111" y="316" width="150" height="26" rx="13" fill="var(--surface)" stroke="var(--reference)" strokeOpacity="0.4" /><text x="186" y="333" className="edge-label reference-label" style={{ fontSize: 9 }}>SE APOYA EN VERDADES</text>
    </svg>
  );
}

function MobileDirect({ ids, reduced }: Pick<MobileVisualProps, 'ids' | 'reduced'>) {
  const items = [
    { x: 180, y: 58, label: 'SENSACIÓN' }, { x: 298, y: 124, label: 'MEMORIA' },
    { x: 280, y: 270, label: 'INTROSPECCIÓN' }, { x: 80, y: 270, label: 'UNIVERSALES' },
    { x: 62, y: 124, label: '¿YO?', uncertain: true },
  ];
  return (
    <svg className="concept-visual direct-constellation is-compact is-mobile-layout" data-layout="mobile-radial" style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 360" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Campo del conocimiento directo</title><desc id={ids.description}>Sensación, memoria, introspección y universales rodean la presencia directa. El yo aparece como una tesis probable.</desc>
      <circle cx="180" cy="176" r="104" className="orbit-ring" /><circle cx="180" cy="176" r="64" className="orbit-core" />
      {items.map((item, index) => <motion.g key={item.label} className={item.uncertain ? 'orbit-item uncertain-item' : 'orbit-item'} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={reveal(reduced, index * 0.1)}><motion.line x1="180" y1="176" x2={item.x} y2={item.y} className={item.uncertain ? 'line-uncertain dashed' : 'line-direct'} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, index * 0.1, 0.5)} /><circle cx={item.x} cy={item.y} r="38" /><text x={item.x} y={item.y + 4} style={{ fontSize: item.label.length > 10 ? 8 : 10 }}>{item.label}</text></motion.g>)}
      <text x="180" y="170" className="core-title" style={{ fontSize: 13 }}>DIRECTO</text><text x="180" y="191" className="core-note" style={{ fontSize: 9 }}>sin inferencia</text>
      <text x="180" y="336" className="edge-label" style={{ fontSize: 9 }}>DISCONTINUA = «YO» PROBABLE, NO CIERTO</text>
    </svg>
  );
}

function MobileSubject({ ids, reduced }: Pick<MobileVisualProps, 'ids' | 'reduced'>) {
  return <MobileFlow className="subject-relation" ids={ids} reduced={reduced} title="Anatomía relacional de una experiencia" description="Un sujeto incierto realiza el acto mental de ver, dirigido a un dato sensorial. La relación no demuestra un yo permanente." kicker="UNA EXPERIENCIA · TRES POSICIONES" steps={[
    { title: '¿SUJETO?', caption: 'portador del acto · no presentado', kind: 'neutral' },
    { title: 'ACTO MENTAL', caption: '«estoy viendo» · introspección', kind: 'direct' },
    { title: 'DATO SENSORIAL', caption: 'objeto del acto · sensación', kind: 'direct' },
  ]} conclusion="HAY SUJETO DEL ACTO ≠ CONOZCO UN YO PERMANENTE" />;
}

function MobileGate({ ids, reduced }: Pick<MobileVisualProps, 'ids' | 'reduced'>) {
  return <MobileFlow className="description-gate" ids={ids} reduced={reduced} title="Prueba lógica de una descripción definida" description="El F debe existir y ser único. Si no existe, la descripción queda vacía; si hay varios, no identifica un referente único. Solo ambas condiciones producen una referencia unívoca." kicker="LA DESCRIPCIÓN «EL F» PASA DOS PRUEBAS" steps={[
    { title: 'EXISTENCIA', caption: '∃x F(x) · si no: descripción vacía', kind: 'truth' },
    { title: 'UNICIDAD', caption: 'a lo sumo un F · si no: no unívoca', kind: 'truth' },
    { title: 'REFERENTE ÚNICO', caption: '∃!x F(x) · referencia lograda', kind: 'reference' },
  ]} conclusion="DESCRIBIR = IDENTIFICAR MEDIANTE VERDADES" />;
}

function MobileCandidates({ ids, reduced }: Pick<MobileVisualProps, 'ids' | 'reduced'>) {
  const people = [44, 112, 180, 248, 316];
  return (
    <svg className="concept-visual candidate-paradox is-compact is-mobile-layout" data-layout="mobile-convergence" style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 360" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Cinco candidatos conocidos y un ganador desconocido</title><desc id={ids.description}>Conocemos a A, B, C, D y E, y sabemos que uno ganará, pero aún ignoramos quién satisface la descripción el ganador.</desc>
      <text x="180" y="18" className="visual-kicker direct-label">CINCO CANDIDATOS FAMILIARES</text>
      {people.map((x, index) => <motion.g key={x} className="person-symbol" initial={reduced ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.08)}><circle cx={x} cy="65" r="18" /><text x={x} y="70" style={{ fontSize: 10 }}>{String.fromCharCode(65 + index)}</text><motion.path d={`M${x} 84 C${x} 120 180 122 180 152`} className="line-reference dashed" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.4 + index * 0.06)} /></motion.g>)}
      <rect x="62" y="151" width="236" height="66" rx="17" className="winner-box" /><text x="180" y="178" className="winner-text" style={{ fontSize: 12 }}>«LA PERSONA GANADORA»</text><text x="180" y="199" className="node-caption" style={{ fontSize: 9 }}>referente todavía desconocido</text>
      <g className="visual-node truth-node"><rect x="25" y="242" width="310" height="48" rx="14" /><text x="180" y="262" style={{ fontSize: 10 }}>VERDAD CONOCIDA · ∃!x Ganará(x)</text><text x="180" y="280" className="node-caption" style={{ fontSize: 9 }}>sé que exactamente una persona ganará</text></g>
      <text x="180" y="327" className="reach-conclusion" style={{ fontSize: 10 }}>CONOCER CADA x ≠ SABER CUÁL x SATISFACE F</text>
    </svg>
  );
}

export function EpistemicField() {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('field');
  const nodes = [
    [5, 22], [14, 73], [23, 39], [32, 86], [41, 16], [49, 56],
    [58, 31], [67, 77], [76, 14], [84, 49], [93, 28], [97, 81],
  ];
  const links = [
    [0, 2], [1, 2], [2, 4], [2, 5], [3, 5], [4, 6], [5, 6],
    [5, 7], [6, 8], [6, 9], [7, 9], [8, 10], [9, 10], [9, 11],
  ];

  return (
    <div className="epistemic-field" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={ids.gradient} x1="0" x2="1">
            <stop offset="0" stopColor="var(--direct)" />
            <stop offset="0.5" stopColor="var(--paper)" />
            <stop offset="1" stopColor="var(--reference)" />
          </linearGradient>
          <radialGradient id={ids.glow}>
            <stop offset="0" stopColor="var(--paper)" stopOpacity="0.65" />
            <stop offset="1" stopColor="var(--paper)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="54" r="15" fill={`url(#${ids.glow})`} opacity="0.12" />
        {links.map(([from, to], index) => (
          <motion.line
            key={`${from}-${to}`}
            x1={nodes[from][0]}
            y1={nodes[from][1]}
            x2={nodes[to][0]}
            y2={nodes[to][1]}
            stroke={`url(#${ids.gradient})`}
            strokeWidth="0.14"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: 0.16 } : { opacity: [0.08, 0.28, 0.08] }}
            transition={reduced ? { duration: 0 } : { duration: 5.2 + index * 0.11, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {nodes.map((node, index) => (
          <motion.circle
            key={`${node[0]}-${node[1]}`}
            cx={node[0]}
            cy={node[1]}
            r={index === 5 || index === 6 ? 0.82 : 0.44}
            fill={index < 6 ? 'var(--direct)' : 'var(--reference)'}
            initial={{ opacity: 0 }}
            animate={reduced ? { opacity: index === 5 || index === 6 ? 0.7 : 0.42 } : { opacity: [0.28, 0.82, 0.28] }}
            transition={reduced ? { duration: 0 } : { duration: 3.4 + index * 0.13, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    </div>
  );
}

export function KnowledgeTree({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('knowledge');
  const narrow = useNarrowLayout(compact);
  if (narrow) return <MobileKnowledge ids={ids} reduced={reduced} />;
  return (
    <svg className={`concept-visual knowledge-tree mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 920 530" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Mapa del conocimiento según el capítulo cinco</title>
      <desc id={ids.description}>El conocimiento se divide en conocimiento de verdades y de cosas. El conocimiento de cosas se divide en directo, que presenta algo sin inferencia, y por descripción, que identifica algo mediante propiedades y depende de verdades.</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker>
        <linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.16" /><stop offset="0.5" stopColor="var(--line-strong)" stopOpacity="0.04" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.16" /></linearGradient>
      </defs>
      <rect x="28" y="18" width="864" height="478" rx="32" fill={`url(#${ids.gradient})`} opacity="0.45" />
      <text x="460" y="46" className="edge-label">DOS PREGUNTAS: ¿QUÉ SÉ? · ¿CON QUÉ TIPO DE ACCESO?</text>
      <motion.path d="M460 126 V158 M460 158 H235 V194 M460 158 H685 V194" className="line-neutral" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.05, 0.8)} />
      <motion.path d="M685 278 V320 M685 320 H565 V366 M685 320 H805 V366" className="line-neutral" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.3, 0.75)} />
      <motion.g className="visual-node neutral-node" initial={reduced ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced)}>
        <rect x="340" y="66" width="240" height="60" rx="18" /><rect x="340" y="66" width="7" height="60" rx="3.5" fill="var(--paper)" stroke="none" /><text x="460" y="103">CONOCIMIENTO</text>
      </motion.g>
      <motion.g className="visual-node truth-node" initial={reduced ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}>
        <rect x="95" y="194" width="280" height="84" rx="20" /><text x="235" y="227">DE VERDADES</text><text x="235" y="254" className="node-caption">saber que p · proposiciones</text>
      </motion.g>
      <motion.g className="visual-node neutral-node" initial={reduced ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}>
        <rect x="545" y="194" width="280" height="84" rx="20" /><text x="685" y="227">DE COSAS</text><text x="685" y="254" className="node-caption">particulares · universales</text>
      </motion.g>
      <motion.g className="visual-node direct-node" initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.45)}>
        <text x="565" y="349" className="zone-label direct-label">INMEDIATO</text><rect x="450" y="366" width="230" height="96" rx="22" /><circle cx="478" cy="394" r="7" fill="var(--direct)" stroke="none" /><text x="565" y="405">DIRECTO</text><text x="565" y="435" className="node-caption">presencia · sin inferencia</text>
      </motion.g>
      <motion.g className="visual-node reference-node" initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.57)}>
        <text x="805" y="349" className="zone-label reference-label">MEDIADO</text><rect x="690" y="366" width="230" height="96" rx="22" /><circle cx="718" cy="394" r="7" fill="var(--reference)" stroke="none" /><text x="805" y="405" style={{ fontSize: 13 }}>POR DESCRIPCIÓN</text><text x="805" y="435" className="node-caption">«el F» · mediante verdades</text>
      </motion.g>
      <motion.path d="M782 366 C740 308 602 300 448 309 C330 316 275 302 258 278" className="line-reference dashed" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.72, 0.95)} />
      <rect x="382" y="294" width="196" height="29" rx="14" fill="var(--surface)" stroke="var(--reference)" strokeOpacity="0.35" /><text x="480" y="313" className="edge-label reference-label">SE APOYA EN VERDADES</text>
      {!compact && <text x="460" y="492" className="edge-label">LA DESCRIPCIÓN AMPLÍA EL ALCANCE, PERO CONSERVA UN ANCLA EN LO PRESENTADO</text>}
    </svg>
  );
}

export function TableBridge({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('table');
  const narrow = useNarrowLayout(compact);
  const steps = [
    { x: 20, number: '01', title: 'PERCIBIR', lines: ['ver · tocar'], kind: 'neutral', relation: 'presenta' },
    { x: 222, number: '02', title: 'DATOS', lines: ['color · forma', 'dureza'], kind: 'direct', relation: 'formula' },
    { x: 424, number: '03', title: 'VERDAD', lines: ['«un objeto físico', 'causa estos datos»'], kind: 'bridge', relation: 'describe' },
    { x: 626, number: '04', title: '«EL OBJETO»', lines: ['que causa', 'estos datos'], kind: 'reference', relation: 'refiere a' },
    { x: 828, number: '05', title: 'MESA', lines: ['objeto físico'], kind: 'reference', relation: '' },
  ];
  if (narrow) return <MobileFlow className="table-bridge" ids={ids} reduced={reduced} title="Del dato sensorial a la mesa física" description="Percibir presenta datos sensoriales. Una verdad causal permite describir el objeto que causa esos datos y referirse a la mesa física." kicker="DEL DATO PRESENTE AL OBJETO DESCRITO" steps={[
    { title: 'PERCIBIR', caption: 'ver · tocar', kind: 'neutral' },
    { title: 'DATOS SENSORIALES', caption: 'color · forma · dureza', kind: 'direct' },
    { title: 'VERDAD PUENTE', caption: '«un objeto físico causa estos datos»', kind: 'truth' },
    { title: 'DESCRIPCIÓN', caption: '«el objeto que causa estos datos»', kind: 'reference' },
    { title: 'MESA FÍSICA', caption: 'objeto conocido por referencia', kind: 'reference' },
  ]} conclusion="LO DADO → INFERENCIA → LO DESCRITO" />;
  return (
    <svg className={`concept-visual table-bridge mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 1020 410" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Del dato sensorial a la mesa física</title>
      <desc id={ids.description}>Cinco pasos muestran la inferencia. Percibir presenta datos sensoriales. Una verdad causal permite describir el objeto que causa esos datos y referirse a la mesa física. Solo los datos están presentados directamente.</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--paper)" opacity="0.72" /></marker>
        <linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.14" /><stop offset="0.47" stopColor="var(--direct)" stopOpacity="0.05" /><stop offset="0.53" stopColor="var(--reference)" stopOpacity="0.05" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.14" /></linearGradient>
      </defs>
      <rect x="10" y="36" width="394" height="290" rx="28" fill="var(--direct-soft)" opacity="0.42" /><rect x="414" y="36" width="192" height="290" rx="28" fill="var(--surface-2)" opacity="0.62" /><rect x="616" y="36" width="394" height="290" rx="28" fill="var(--reference-soft)" opacity="0.48" />
      <text x="207" y="24" className="zone-label direct-label">PRESENTACIÓN · LO DADO</text><text x="510" y="24" className="zone-label">VERDAD PUENTE</text><text x="813" y="24" className="zone-label reference-label">DESCRIPCIÓN · LO INFERIDO</text>
      {steps.slice(0, -1).map((step, index) => <g key={`arrow-${step.number}`}>
        <motion.path d={`M${step.x + 172} 179 H${steps[index + 1].x - 9}`} className={index < 1 ? 'line-direct' : index > 1 ? 'line-reference' : 'line-neutral'} markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.22 + index * 0.15, 0.5)} />
        <text x={(step.x + 172 + steps[index + 1].x - 9) / 2} y="104" className="edge-label" style={{ fontSize: 8 }}>{step.relation.toUpperCase()}</text>
      </g>)}
      {steps.map((step, index) => <motion.g key={step.number} className={`bridge-step ${step.kind}-step`} initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.13, 0.5)}>
        <rect x={step.x} y="116" width="172" height="126" rx="20" /><circle cx={step.x + 24} cy="136" r="15" /><text x={step.x + 24} y="141" style={{ fontSize: 10 }}>{step.number}</text><text x={step.x + 86} y="174" style={{ fontSize: step.title.length > 10 ? 11 : 13 }}>{step.title}</text>
        {step.lines.map((line, lineIndex) => <text key={line} x={step.x + 86} y={202 + lineIndex * 21} className="node-caption">{line}</text>)}
      </motion.g>)}
      <motion.path d="M106 292 H914" stroke={`url(#${ids.gradient})`} strokeWidth="8" strokeLinecap="round" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.72, 0.9)} />
      <text x="106" y="318" className="edge-label direct-label" textAnchor="start">CERTEZA DE LOS DATOS</text><text x="914" y="318" className="edge-label reference-label" textAnchor="end">HIPÓTESIS SOBRE LA CAUSA</text>
      {!compact && <g><text x="510" y="365" className="reach-conclusion">LA MESA NO SE PRESENTA: LA IDENTIFICAMOS POR LO QUE EXPLICA</text><text x="510" y="389" className="node-caption">directo → verdad causal → descripción → objeto físico</text></g>}
    </svg>
  );
}

export function DirectConstellation({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('direct');
  const narrow = useNarrowLayout(compact);
  const items = [
    { x: 460, y: 76, label: ['SENSACIÓN'], note: 'dato presente', uncertain: false },
    { x: 748, y: 190, label: ['MEMORIA'], note: 'dato pasado', uncertain: false },
    { x: 672, y: 432, label: ['INTROS-', 'PECCIÓN'], note: 'acto mental', uncertain: false },
    { x: 248, y: 432, label: ['UNIVERSALES'], note: 'blancura · relación', uncertain: false },
    { x: 172, y: 190, label: ['¿YO?'], note: 'tesis probable', uncertain: true },
  ];
  if (narrow) return <MobileDirect ids={ids} reduced={reduced} />;
  return (
    <svg className={`concept-visual direct-constellation mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 920 540" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Campo del conocimiento directo</title>
      <desc id={ids.description}>En el centro está la presencia sin inferencia. De ella parten sensación de datos presentes, memoria de datos pasados, introspección de actos mentales, universales y, como tesis probable marcada por una línea discontinua, el yo.</desc>
      <defs><radialGradient id={ids.gradient}><stop offset="0" stopColor="var(--direct)" stopOpacity="0.25" /><stop offset="0.52" stopColor="var(--direct)" stopOpacity="0.07" /><stop offset="1" stopColor="var(--direct)" stopOpacity="0" /></radialGradient></defs>
      <circle cx="460" cy="274" r="178" fill={`url(#${ids.gradient})`} /><circle cx="460" cy="274" r="178" className="orbit-ring" /><circle cx="460" cy="274" r="112" className="orbit-ring" opacity="0.7" />
      {items.map((item, index) => <motion.g key={item.note} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={reveal(reduced, 0.08 + index * 0.12)}>
        <motion.line x1="460" y1="274" x2={item.x} y2={item.y} className={item.uncertain ? 'line-uncertain dashed' : 'line-direct'} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.12 + index * 0.12, 0.65)} />
        <g className={item.uncertain ? 'orbit-item uncertain-item' : 'orbit-item'}><circle cx={item.x} cy={item.y} r="61" /><circle cx={item.x} cy={item.y} r="48" fill="none" stroke="var(--direct)" strokeOpacity="0.14" />
          {item.label.map((line, lineIndex) => <text key={line} x={item.x} y={item.y - (item.label.length - 1) * 9 + lineIndex * 19} style={{ fontSize: line.length > 11 ? 11 : 13 }}>{line}</text>)}<text x={item.x} y={item.y + 34} className="node-caption">{item.note}</text>
        </g>
      </motion.g>)}
      <motion.g initial={reduced ? false : { opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.18, 0.65)} style={{ transformOrigin: '460px 274px' }}><circle cx="460" cy="274" r="82" className="orbit-core" /><circle cx="460" cy="274" r="66" fill="none" stroke="var(--direct)" strokeOpacity="0.26" /><text x="460" y="254" className="core-title">DIRECTO</text><text x="460" y="279" className="core-note">presencia</text><text x="460" y="301" className="core-note">sin inferencia</text></motion.g>
      <rect x="72" y="496" width="18" height="2" fill="var(--direct)" /><text x="100" y="501" className="edge-label" textAnchor="start">CONTINUA: TESIS FIRME</text><path d="M610 497 h18" className="line-uncertain dashed" /><text x="638" y="501" className="edge-label" textAnchor="start">DISCONTINUA: TESIS PROBABLE</text>
      {!compact && <text x="460" y="528" className="edge-label">DIRECTO NO SIGNIFICA FÍSICAMENTE CERCANO, SINO EPISTÉMICAMENTE PRESENTE</text>}
    </svg>
  );
}

export function SubjectRelation({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('subject');
  const narrow = useNarrowLayout(compact);
  if (narrow) return <MobileSubject ids={ids} reduced={reduced} />;
  return (
    <svg className={`concept-visual subject-relation mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 980 500" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Anatomía relacional de una experiencia visual</title>
      <desc id={ids.description}>Un sujeto incierto realiza un acto mental de ver, y ese acto se dirige a un dato sensorial. El acto se conoce por introspección y el dato por sensación. La estructura exige un sujeto, pero no demuestra un yo permanente conocido directamente.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--direct)" /></marker><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0" /><stop offset="0.5" stopColor="var(--direct)" stopOpacity="0.16" /><stop offset="1" stopColor="var(--direct)" stopOpacity="0" /></linearGradient></defs>
      <text x="490" y="34" className="visual-kicker">UNA EXPERIENCIA · DOS TÉRMINOS CONOCIDOS · UNA INCÓGNITA</text><rect x="50" y="70" width="880" height="260" rx="32" fill={`url(#${ids.gradient})`} />
      <motion.path d="M275 200 H382" className="line-direct" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.2, 0.65)} /><motion.path d="M598 200 H705" className="line-direct" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.42, 0.65)} />
      <motion.g className="subject-node uncertain-node" initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.05)}><circle cx="185" cy="200" r="90" /><circle cx="185" cy="200" r="72" fill="none" stroke="var(--direct)" strokeOpacity="0.14" strokeDasharray="4 7" /><text x="185" y="187">¿SUJETO?</text><text x="185" y="216" className="node-caption">portador del acto</text><text x="185" y="240" className="node-caption">no presentado con certeza</text></motion.g>
      <motion.g className="subject-node direct-node" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.24)}><rect x="382" y="122" width="216" height="156" rx="30" /><text x="490" y="181">ACTO MENTAL</text><text x="490" y="211" className="node-caption">«estoy viendo»</text><rect x="420" y="232" width="140" height="27" rx="13" fill="var(--surface)" stroke="var(--direct)" strokeOpacity="0.35" /><text x="490" y="250" className="edge-label direct-label">INTROSPECCIÓN</text></motion.g>
      <motion.g className="subject-node direct-node" initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.46)}><circle cx="795" cy="200" r="90" /><circle cx="795" cy="200" r="72" fill="none" stroke="var(--direct)" strokeOpacity="0.16" /><text x="795" y="181">DATO</text><text x="795" y="207">SENSORIAL</text><text x="795" y="237" className="node-caption">mancha luminosa</text></motion.g>
      <text x="328" y="179" className="edge-label">REALIZA</text><text x="652" y="179" className="edge-label">SE DIRIGE A</text><text x="795" y="313" className="edge-label direct-label">SENSACIÓN</text>
      <motion.path d="M185 304 C244 356 308 371 383 373" className="line-uncertain dashed" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.65, 0.7)} /><rect x="382" y="340" width="548" height="101" rx="24" fill="var(--surface)" stroke="var(--direct)" strokeOpacity="0.42" strokeDasharray="7 6" /><text x="656" y="375" className="uncertain-label">LO QUE LA RELACIÓN PERMITE AFIRMAR</text><text x="656" y="405" style={{ fontSize: 13 }}>hay un sujeto del acto</text><text x="656" y="429" className="node-caption">≠ conocemos un yo simple y permanente</text>
      {!compact && <text x="185" y="467" className="edge-label">LA INTERROGACIÓN MARCA EL LÍMITE DEL ARGUMENTO</text>}
    </svg>
  );
}

export function DescriptionGate({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('description');
  const narrow = useNarrowLayout(compact);
  if (narrow) return <MobileGate ids={ids} reduced={reduced} />;
  return (
    <svg className={`concept-visual description-gate mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 1000 540" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Prueba lógica de una descripción definida</title>
      <desc id={ids.description}>La expresión el F debe superar dos pruebas: existencia y unicidad. Si falla la existencia queda vacía; si falla la unicidad no identifica un referente único. Solo si supera ambas logra una referencia unívoca, expresada como existe exactamente un x tal que F de x.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--paper)" opacity="0.75" /></marker></defs>
      <text x="500" y="34" className="visual-kicker">UNA DESCRIPCIÓN NO NOMBRA: PROPONE CONDICIONES</text>
      <motion.g className="gate-node neutral-node" initial={reduced ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced)}><rect x="20" y="155" width="208" height="110" rx="22" /><text x="124" y="195">DESCRIPCIÓN</text><text x="124" y="228" className="reference-label">«EL F»</text><text x="124" y="250" className="node-caption">punto de partida</text></motion.g>
      <motion.path d="M228 210 H274" className="line-neutral" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.15)} />
      <motion.g className="gate-diamond" initial={reduced ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.22)} style={{ transformOrigin: '374px 210px' }}><path d="M374 132 L478 210 L374 288 L270 210 Z" /><text x="374" y="191">¿EXISTE</text><text x="374" y="215">ALGÚN F?</text><text x="374" y="240" className="node-caption">∃x F(x)</text></motion.g>
      <motion.path d="M478 210 H548" className="line-neutral" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.38)} /><text x="514" y="190" className="edge-label direct-label">SÍ</text>
      <motion.g className="gate-diamond" initial={reduced ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.45)} style={{ transformOrigin: '652px 210px' }}><path d="M652 132 L756 210 L652 288 L548 210 Z" /><text x="652" y="191">¿ES EL</text><text x="652" y="215">ÚNICO F?</text><text x="652" y="240" className="node-caption" style={{ fontSize: 8 }}>∀x∀y[(F(x)∧F(y))→x=y]</text></motion.g>
      <motion.path d="M756 210 H800" className="line-reference" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.6)} /><text x="778" y="190" className="edge-label direct-label">SÍ</text>
      <motion.g className="gate-node reference-node" initial={reduced ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.68)}><rect x="800" y="155" width="180" height="110" rx="22" /><text x="890" y="190">REFERENTE</text><text x="890" y="216">ÚNICO</text><text x="890" y="244" className="node-caption">∃!x F(x)</text></motion.g>
      <motion.path d="M374 288 V344" className="line-fail" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.43)} /><text x="394" y="321" className="edge-label fail-label">NO</text><motion.g className="gate-node fail-node" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.51)}><rect x="274" y="344" width="200" height="88" rx="20" /><text x="374" y="378">VACÍA</text><text x="374" y="406" className="node-caption">ningún F satisface</text></motion.g>
      <motion.path d="M652 288 V344" className="line-fail" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.65)} /><text x="672" y="321" className="edge-label fail-label">NO</text><motion.g className="gate-node fail-node" initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.73)}><rect x="552" y="344" width="200" height="88" rx="20" /><text x="652" y="378">NO UNÍVOCA</text><text x="652" y="406" className="node-caption">más de un F satisface</text></motion.g>
      {!compact && <g><rect x="168" y="470" width="664" height="45" rx="20" fill="var(--reference-soft)" stroke="var(--reference)" strokeOpacity="0.32" /><text x="500" y="498" className="edge-label reference-label">DESCRIBIR ES IDENTIFICAR MEDIANTE PROPIEDADES EXPRESADAS EN VERDADES</text></g>}
    </svg>
  );
}

export function CandidateParadox({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('candidate');
  const narrow = useNarrowLayout(compact);
  const people = [152, 306, 460, 614, 768];
  if (narrow) return <MobileCandidates ids={ids} reduced={reduced} />;
  return (
    <svg className={`concept-visual candidate-paradox mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 920 520" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Cinco candidatos conocidos y un ganador desconocido</title>
      <desc id={ids.description}>Podemos estar familiarizados con A, B, C, D y E mediante datos directamente presentados. Sabemos que exactamente una persona ganará, pero antes del resultado ignoramos cuál satisface la descripción el ganador. La familiaridad con cada candidato no equivale a identificar el referente.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.15" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.15" /></linearGradient></defs>
      <rect x="58" y="25" width="804" height="245" rx="30" fill="var(--direct-soft)" opacity="0.34" /><text x="460" y="58" className="visual-kicker direct-label">DATOS DIRECTOS ASOCIADOS A CINCO CANDIDATOS</text>
      {people.map((x, index) => <motion.g key={x} className="person-symbol" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.09)}><circle cx={x} cy="128" r="27" /><path d={`M${x - 43} 211 Q${x} 159 ${x + 43} 211`} /><circle cx={x} cy="230" r="20" fill="var(--direct-soft)" /><text x={x} y="236">{String.fromCharCode(65 + index)}</text></motion.g>)}
      {people.map((x, index) => <motion.path key={`candidate-line-${x}`} d={`M${x} 250 C${x} 302 ${390 + index * 35} 302 ${390 + index * 35} 346`} className="line-reference dashed" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.5 + index * 0.07, 0.7)} />)}
      <motion.g initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.75)}><rect x="286" y="346" width="348" height="94" rx="24" className="winner-box" /><path d="M433 374 L445 356 L460 374 L475 356 L487 374 L482 388 H438 Z" fill="none" stroke="var(--reference)" strokeWidth="2" /><text x="460" y="409" className="winner-text">«LA PERSONA GANADORA»</text><text x="460" y="431" className="node-caption">referente pendiente del resultado</text></motion.g>
      <rect x="66" y="355" width="188" height="76" rx="18" fill="var(--surface)" stroke="var(--line-strong)" /><text x="160" y="382" className="edge-label">VERDAD CONOCIDA</text><text x="160" y="408" style={{ fontSize: 12 }}>∃!x Ganará(x)</text><motion.path d="M254 393 H278" className="line-neutral" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.66)} />
      <rect x="666" y="355" width="188" height="76" rx="18" fill="var(--surface)" stroke="var(--reference)" strokeOpacity="0.58" /><text x="760" y="382" className="edge-label reference-label">IDENTIDAD IGNORADA</text><text x="760" y="408" style={{ fontSize: 12 }}>¿x = A, B, C, D o E?</text><motion.path d="M634 393 H658" className="line-reference" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.82)} />
      {!compact && <g><rect x="202" y="466" width="516" height="37" rx="18" fill={`url(#${ids.gradient})`} /><text x="460" y="490" className="reach-conclusion">CONOCER CADA x ≠ SABER CUÁL x SATISFACE F</text></g>}
    </svg>
  );
}

export function BismarckDistance({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('distance');
  const narrow = useNarrowLayout(compact);
  const stops = [
    { x: 100, label: ['BISMARCK', 'PARA SÍ'], note: '¿autoexperiencia?', level: 'near' },
    { x: 300, label: ['QUIEN', 'LO TRATÓ'], note: 'datos → él descrito', level: 'middle' },
    { x: 500, label: ['LECTOR DE', 'HISTORIA'], note: 'testimonios', level: 'middle' },
    { x: 700, label: ['MÁSCARA', 'DE HIERRO'], note: 'rasgos sin identidad', level: 'far' },
    { x: 900, label: ['MÁS', 'LONGEVO'], note: 'solo definición', level: 'far' },
  ];
  if (narrow) return <MobileFlow className="bismarck-distance" ids={ids} reduced={reduced} title="Continuo entre presentación y descripción" description="La escala va desde Bismarck para sí mismo hasta una persona conocida solo por definición. Aumenta la mediación mediante verdades." kicker="AUMENTA LA DISTANCIA EPISTÉMICA" steps={[
    { title: 'BISMARCK PARA SÍ', caption: 'autoexperiencia posible', kind: 'direct' },
    { title: 'QUIEN LO TRATÓ', caption: 'datos directos → Bismarck descrito', kind: 'truth' },
    { title: 'LECTOR DE HISTORIA', caption: 'testimonios', kind: 'truth' },
    { title: 'MÁSCARA DE HIERRO', caption: 'rasgos sin identidad', kind: 'reference' },
    { title: 'EL MÁS LONGEVO', caption: 'solo definición', kind: 'reference' },
  ]} conclusion="MENOS PRESENTACIÓN → MÁS DESCRIPCIÓN" />;
  return (
    <svg className={`concept-visual bismarck-distance mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 1000 480" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Continuo entre presentación y descripción</title>
      <desc id={ids.description}>Cinco posiciones muestran una distancia epistemológica creciente: la posible autoexperiencia de Bismarck; alguien que conoce directamente datos sensoriales, pero a Bismarck mediante ellos; el lector de historia; el hombre de la máscara de hierro; y el hombre más longevo. Hacia la derecha disminuye la presentación y aumenta la dependencia de verdades.</desc>
      <defs><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" /><stop offset="0.5" stopColor="var(--paper)" /><stop offset="1" stopColor="var(--reference)" /></linearGradient><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker></defs>
      <text x="78" y="48" className="distance-pole direct-label" textAnchor="start">MAYOR PRESENTACIÓN</text><text x="922" y="48" className="distance-pole reference-label" textAnchor="end">MAYOR DEPENDENCIA DE VERDADES</text><path d="M78 68 H922" stroke={`url(#${ids.gradient})`} strokeWidth="3" markerEnd={`url(#${ids.arrow})`} />
      <rect x="58" y="102" width="884" height="236" rx="34" fill="var(--surface)" stroke="var(--line-strong)" strokeOpacity="0.55" /><motion.path d="M100 210 H900" stroke={`url(#${ids.gradient})`} className="distance-spine" variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.08, 1.1)} />
      {stops.map((stop, index) => <motion.g key={stop.x} className={`distance-stop ${stop.level}-stop`} initial={reduced ? false : { opacity: 0, scale: 0.86 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.12 + index * 0.13)} style={{ transformOrigin: `${stop.x}px 210px` }}><circle cx={stop.x} cy="210" r={28 - index * 2} /><circle cx={stop.x} cy="210" r="11" fill={index === 0 ? 'var(--direct)' : index < 3 ? 'var(--paper)' : 'var(--reference)'} stroke="none" opacity="0.82" /><line x1={stop.x} y1="238" x2={stop.x} y2="268" />{stop.label.map((line, lineIndex) => <text key={line} x={stop.x} y={292 + lineIndex * 22}>{line}</text>)}<text x={stop.x} y="329" className="node-caption">{stop.note}</text><text x={stop.x} y="142" className="edge-label">0{index + 1}</text></motion.g>)}
      <text x="100" y="378" className="edge-label direct-label" textAnchor="start">DISMINUYE LA PRESENTACIÓN DEL PARTICULAR</text><motion.path d="M100 393 H900" className="line-reference dashed" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.75, 0.95)} /><text x="900" y="419" className="edge-label reference-label" textAnchor="end">AUMENTA LA MEDIACIÓN DESCRIPTIVA</text>
      {!compact && <text x="500" y="461" className="reach-conclusion">NO ES DISTANCIA FÍSICA: ES DISTANCIA RESPECTO DE LO PRESENTADO</text>}
    </svg>
  );
}

export function AnchorReach({ compact = false }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('reach');
  const narrow = useNarrowLayout(compact);
  const outerNodes = [[846, 88], [916, 128], [938, 212], [914, 298], [846, 340], [788, 296], [772, 136]];
  if (narrow) return <MobileFlow className="anchor-reach" ids={ids} reduced={reduced} title="Del anclaje directo al alcance de la referencia" description="El conocimiento directo aporta particulares y universales presentados; las verdades de enlace los relacionan y las descripciones amplían el alcance hacia un mundo no presentado." kicker="LA TESIS DEL CAPÍTULO EN TRES MOVIMIENTOS" steps={[
    { title: 'DIRECTO · TÉRMINOS', caption: 'particulares + universales presentados', kind: 'direct' },
    { title: 'VERDADES DE ENLACE', caption: 'relacionan los términos', kind: 'truth' },
    { title: 'REFERENCIA · ALCANCE', caption: 'mundo no presentado', kind: 'reference' },
  ]} conclusion="ANCLAJE + VERDADES + DESCRIPCIÓN = ALCANCE" />;
  return (
    <svg className={`concept-visual anchor-reach mobile-stack-ready${compact ? ' is-compact' : ''}`} data-layout="responsive-fit" style={responsiveStyle(compact)} viewBox="0 0 1000 500" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Del anclaje directo al alcance de la referencia</title>
      <desc id={ids.description}>El conocimiento directo aporta particulares y universales presentados. Las verdades de enlace relacionan esos términos. Las descripciones permiten referirse a objetos nunca presentados y amplían el conocimiento más allá de la experiencia privada.</desc>
      <defs><marker id={ids.arrow} markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L9 5 L0 10 Z" fill="var(--reference)" /></marker><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" /><stop offset="0.5" stopColor="var(--paper)" /><stop offset="1" stopColor="var(--reference)" /></linearGradient><radialGradient id={ids.glow}><stop offset="0" stopColor="var(--reference)" stopOpacity="0.18" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0" /></radialGradient></defs>
      <motion.path d="M188 242 C292 76 431 76 500 242 C569 408 708 408 812 242" fill="none" stroke={`url(#${ids.gradient})`} strokeWidth="5" strokeLinecap="round" markerEnd={`url(#${ids.arrow})`} variants={draw} initial={reduced ? false : 'hidden'} animate="visible" transition={reveal(reduced, 0.12, 1.25)} /><text x="310" y="111" className="edge-label direct-label">APORTA TÉRMINOS</text><text x="690" y="373" className="edge-label reference-label">COMPONE DESCRIPCIONES</text>
      <motion.g className="reach-pole direct-pole" initial={reduced ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.02, 0.7)} style={{ transformOrigin: '140px 242px' }}><circle cx="140" cy="242" r="92" /><circle cx="140" cy="242" r="73" fill="none" stroke="var(--direct)" strokeOpacity="0.2" /><path d="M140 178 V258 M114 222 H166 M112 258 C118 282 162 282 168 258" fill="none" stroke="var(--direct)" strokeWidth="3" strokeLinecap="round" /><text x="140" y="309">DIRECTO</text><text x="140" y="332" className="node-caption">particulares + universales</text></motion.g>
      <motion.g className="reach-center" initial={reduced ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.36, 0.7)}><circle cx="500" cy="242" r="82" /><circle cx="500" cy="242" r="65" fill="none" stroke="var(--paper)" strokeOpacity="0.12" /><text x="500" y="224">VERDADES</text><text x="500" y="251" className="node-caption">DE ENLACE</text><text x="500" y="279" className="node-caption">PUENTE</text></motion.g>
      <circle cx="860" cy="242" r="144" fill={`url(#${ids.glow})`} />{outerNodes.map(([x, y], index) => <motion.g key={`${x}-${y}`} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={reveal(reduced, 0.62 + index * 0.06)}><line x1="860" y1="242" x2={x} y2={y} stroke="var(--reference)" strokeOpacity="0.24" strokeWidth="1.5" /><circle cx={x} cy={y} r={index % 2 === 0 ? 7 : 5} fill="var(--reference)" opacity={0.52 + index * 0.04} /></motion.g>)}
      <motion.g className="reach-pole reference-pole" initial={reduced ? false : { opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.64, 0.72)} style={{ transformOrigin: '860px 242px' }}><circle cx="860" cy="242" r="92" /><circle cx="860" cy="242" r="73" fill="none" stroke="var(--reference)" strokeOpacity="0.23" /><text x="860" y="233">REFERENCIA</text><text x="860" y="262" className="node-caption">ALCANCE</text><text x="860" y="286" className="node-caption">mundo no presentado</text></motion.g>
      <rect x="180" y="419" width="640" height="48" rx="22" fill="var(--surface)" stroke="var(--line-strong)" /><text x="500" y="449" className="reach-conclusion">ANCLAJE + VERDADES + DESCRIPCIÓN = UN MUNDO MAYOR QUE LA EXPERIENCIA PRIVADA</text>{!compact && <text x="500" y="493" className="edge-label">SIN PRESENTACIÓN NO HAY TÉRMINOS; SIN DESCRIPCIÓN NO HAY ALCANCE</text>}
    </svg>
  );
}
