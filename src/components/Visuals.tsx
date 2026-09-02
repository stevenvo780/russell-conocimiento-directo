import { motion, useReducedMotion } from 'framer-motion';
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

/*
  Diagram vocabulary (binding, see the brief §1):

    hue = epistemic status     amber = presentado/directo · paper = verdad puente
                               teal = referido/descrito · rose = fallo/discutible
    stroke style = certainty   solid = firm · dashed (7 7) = probable/uncertain
    opacity = sequence only    future 0 · past dimmed · active 1
    type                       Cormorant for thing-words and sentences,
                               mono only for relation / zone labels and markers

  Every node is `.semantic-node[data-node][data-stage]`, every edge is
  `.semantic-edge[data-edge][data-from][data-to][data-relation]`. Edges that
  must wait for a stage live inside `.edge-group[data-sequence]` (visible when
  threshold > sequence), so no edge ever points at a node that is not on screen.

  arrival="self"     the diagram animates its own entrance (home page).
  arrival="scripted" no mount animation: useStageArrival owns the walk in the deck.
*/

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1 },
};

export type DiagramArrival = 'self' | 'scripted';

type VisualProps = { compact?: boolean; arrival?: DiagramArrival };

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

/** Framer mount value: none when the deck scripts the arrival or motion is reduced. */
function enter(scripted: boolean, reduced: boolean | null, value: Record<string, number>) {
  return scripted || reduced ? false : value;
}

function semanticKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function motionState(reduced: boolean | null) {
  return reduced ? 'reduced' : 'semantic';
}

function responsiveStyle(compact: boolean) {
  return compact ? { width: '100%', maxWidth: '100%', minWidth: 0 } : undefined;
}

/* Phones, and tablets held upright: the stacked variants fit a tall stage better than a wide drawing scaled down. */
const NARROW_LAYOUT_QUERY = '(max-width: 640px), (max-width: 900px) and (orientation: portrait)';

function useNarrowLayout(compact: boolean) {
  const [narrow, setNarrow] = useState(() => (
    compact && typeof window !== 'undefined' && window.matchMedia(NARROW_LAYOUT_QUERY).matches
  ));

  useEffect(() => {
    if (!compact) return undefined;
    const media = window.matchMedia(NARROW_LAYOUT_QUERY);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [compact]);

  return compact && narrow;
}

/* ---------- Relationship tracing (interaction-03) ---------- */

const RELATION_ES: Record<string, string> = {
  'divides-into': 'se divide en',
  'depends-on': 'se apoya en',
  presenta: 'presenta',
  formula: 'formula',
  describe: 'describe',
  'refiere a': 'refiere a',
  'decreasing-certainty': 'pierde certeza hacia',
  'acquainted-with': 'conoce directamente',
  performs: 'realiza',
  'directed-to': 'se dirige a',
  'does-not-entail': 'no demuestra',
  requires: 'exige',
  yes: 'sí',
  no: 'no',
  'could-satisfy': 'podría satisfacer',
  'asserts-existence-uniqueness': 'garantiza existencia y unicidad de',
  'identity-unresolved': 'deja sin resolver',
  continuum: 'se aleja hacia',
  'increasing-mediation': 'aumenta la mediación hacia',
  increases: 'aumenta hacia',
  'enables-reference': 'habilita la referencia a',
  'extends-to': 'alcanza',
  enables: 'habilita',
  connects: 'conecta',
};

const READOUT_MAX = 84;

function relationLabel(key: string) {
  return RELATION_ES[key] ?? key.replace(/-/g, ' ');
}

function nodeLabel(node: Element) {
  const explicit = node.getAttribute('data-label');
  if (explicit) return explicit;
  const parts: string[] = [];
  node.querySelectorAll('text').forEach((text) => {
    if (text.closest('.stage-marker')) return;
    if (text.matches('.node-caption, .zone-label, .edge-label, .uncertain-label, .core-note, .node-formula')) return;
    const content = text.textContent?.trim();
    if (content) parts.push(content);
  });
  return parts.join(' ');
}

function isFuture(element: Element | null) {
  return Boolean(element && element.closest('[data-stage-role="future"]'));
}

function pushUnique(map: Map<string, string[]>, relation: string, label: string) {
  const list = map.get(relation) ?? [];
  if (!list.includes(label)) list.push(label);
  map.set(relation, list);
}

function traceReadout(source: string, outgoing: Map<string, string[]>, incoming: Map<string, string[]>) {
  const lines: string[] = [];
  if (outgoing.size) {
    outgoing.forEach((targets, relation) => lines.push(`${relation} → ${targets.join(', ')}`));
    return `${source} — ${lines.join(' · ')}`;
  }
  if (incoming.size) {
    incoming.forEach((sources, relation) => lines.push(`${relation} ← ${sources.join(', ')}`));
    return `${source} ← ${lines.join(' · ')}`;
  }
  return source;
}

function applyTrace(svg: SVGSVGElement, node: Element | null) {
  svg.querySelectorAll('[data-trace]').forEach((element) => element.removeAttribute('data-trace'));
  const key = node?.getAttribute('data-node');
  if (!node || !key) {
    svg.removeAttribute('data-tracing');
    return '';
  }
  svg.setAttribute('data-tracing', 'true');
  node.setAttribute('data-trace', 'source');
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  const addNeighbor = (end: string, relation: string, bucket: Map<string, string[]>) => {
    const other = svg.querySelector(`[data-node="${end}"], [data-detail="${end}"]`);
    if (!other || other === node || isFuture(other)) return;
    other.setAttribute('data-trace', 'neighbor');
    pushUnique(bucket, relation, nodeLabel(other));
  };
  svg.querySelectorAll('[data-edge]').forEach((edge) => {
    if (isFuture(edge)) return;
    const from = edge.getAttribute('data-from') ?? '';
    const via = edge.getAttribute('data-via');
    const targets = (edge.getAttribute('data-to') ?? '').split(/\s+/).filter(Boolean);
    const ends = [from, ...(via ? [via] : []), ...targets];
    if (!ends.includes(key)) return;
    edge.setAttribute('data-trace', 'edge');
    edge.closest('.edge-group')?.setAttribute('data-trace', 'edge');
    const relation = relationLabel(edge.getAttribute('data-relation') ?? '');
    if (from === key) {
      for (const end of via ? [via] : targets) addNeighbor(end, relation, outgoing);
    } else if (via === key) {
      if (from) addNeighbor(from, relation, incoming);
      for (const target of targets) addNeighbor(target, relation, outgoing);
    } else if (targets.includes(key)) {
      const origin = via ?? from;
      if (origin) addNeighbor(origin, relation, incoming);
    }
  });
  const text = traceReadout(nodeLabel(node), outgoing, incoming).toUpperCase();
  return text.length > READOUT_MAX ? `${text.slice(0, READOUT_MAX - 1)}…` : text;
}

function useDiagramTracing() {
  const svgRef = useRef<SVGSVGElement>(null);
  const hovered = useRef<Element | null>(null);
  const pinned = useRef<Element | null>(null);
  const pointerType = useRef('mouse');
  const [readout, setReadout] = useState('');

  const show = useCallback((node: Element | null) => {
    const svg = svgRef.current;
    if (!svg) return;
    setReadout(applyTrace(svg, node));
    if (pinned.current && pinned.current !== node) pinned.current.removeAttribute('data-pinned');
    if (pinned.current === node && node) node.setAttribute('data-pinned', 'true');
  }, []);

  const nodeAt = (target: EventTarget | null) => (target as Element | null)?.closest?.('[data-node]') ?? null;
  // A resting cursor must not trace while a stage is still walking in.
  const arriving = () => {
    const svg = svgRef.current;
    if (!svg || typeof svg.getAnimations !== 'function') return false;
    return svg.getAnimations({ subtree: true }).some((animation) => animation.id.startsWith('arrival') && animation.playState === 'running');
  };

  const onPointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    pointerType.current = event.pointerType;
  }, []);

  const onPointerOver = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return;
    const node = nodeAt(event.target);
    if (!node || node === hovered.current || isFuture(node) || arriving()) return;
    hovered.current = node;
    if (!pinned.current) show(node);
  }, [show]);

  const onPointerOut = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.pointerType === 'touch') return;
    const node = nodeAt(event.target);
    if (!node) return;
    if (nodeAt(event.relatedTarget) === node) return;
    hovered.current = null;
    if (!pinned.current) show(null);
  }, [show]);

  const onClick = useCallback((event: ReactMouseEvent<SVGSVGElement>) => {
    const node = nodeAt(event.target);
    if (!node || isFuture(node)) return;
    if (pinned.current === node) {
      pinned.current = null;
      node.removeAttribute('data-pinned');
      show(pointerType.current === 'mouse' && hovered.current ? hovered.current : null);
      return;
    }
    pinned.current?.removeAttribute('data-pinned');
    pinned.current = node;
    node.setAttribute('data-pinned', 'true');
    show(node);
  }, [show]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !pinned.current) return;
      pinned.current.removeAttribute('data-pinned');
      pinned.current = null;
      show(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [show]);

  // A stage arriving changes which neighbours are visible: recompute a live trace.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || typeof MutationObserver === 'undefined') return undefined;
    let frame: number | null = null;
    const observer = new MutationObserver(() => {
      const current = pinned.current ?? hovered.current;
      if (!current || frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        if (isFuture(current)) {
          current.removeAttribute('data-pinned');
          if (pinned.current === current) pinned.current = null;
          if (hovered.current === current) hovered.current = null;
          show(null);
          return;
        }
        show(pinned.current ?? hovered.current);
      });
    });
    observer.observe(svg, { attributes: true, attributeFilter: ['data-stage-role'], subtree: true });
    return () => {
      observer.disconnect();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [show]);

  return { svgRef, readout, handlers: { onPointerDown, onPointerOver, onPointerOut, onClick } };
}

function TraceReadout({ x, y, text, anchor = 'middle' }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text className="trace-readout" x={x} y={y} textAnchor={anchor} aria-hidden="true" data-empty={text ? undefined : 'true'}>
      {text}
    </text>
  );
}

/* ---------- Shared building blocks ---------- */

type EdgeData = { edge: string; from: string; to: string; relation: string; state?: string; via?: string };

type EdgeProps = {
  d: string;
  className: string;
  data: EdgeData;
  scripted: boolean;
  reduced: boolean | null;
  delay?: number;
  duration?: number;
  /** Render the `.edge-pulse` twin (motion-6). Only for arrows, never for axes. */
  pulse?: boolean;
  markerEnd?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'butt' | 'square';
};

function pulseTone(className: string) {
  if (className.includes('line-direct')) return 'direct';
  if (className.includes('line-reference')) return 'reference';
  if (className.includes('line-fail')) return 'fail';
  return 'neutral';
}

/**
 * One edge. In scripted (deck) mode it is a plain path with pathLength=1 so the
 * arrival hook can draw it in path fractions; dashed edges keep their real
 * dash pattern (pathLength would turn `7 7` into whole paths — the bug that
 * made the dashed edges look solid before). In self mode framer draws it.
 */
function Edge({ d, className, data, scripted, reduced, delay = 0, duration = 0.55, pulse = false, markerEnd, stroke, strokeWidth, strokeLinecap }: EdgeProps) {
  const dashed = /\bdashed\b/.test(className);
  const attributes = {
    'data-edge': data.edge,
    'data-from': data.from,
    'data-to': data.to,
    'data-relation': data.relation,
    'data-state': data.state,
    'data-via': data.via,
  };
  const twin = pulse ? <path className={`edge-pulse tone-${pulseTone(className)}`} d={d} pathLength={1} aria-hidden="true" /> : null;
  if (scripted || reduced) {
    return (
      <>
        <path d={d} className={className} pathLength={dashed ? undefined : 1} markerEnd={markerEnd} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} {...attributes} />
        {twin}
      </>
    );
  }
  if (dashed) {
    return (
      <>
        <motion.path d={d} className={className} markerEnd={markerEnd} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} {...attributes} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={reveal(reduced, delay, duration)} />
        {twin}
      </>
    );
  }
  return (
    <>
      <motion.path d={d} className={className} markerEnd={markerEnd} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} {...attributes} variants={draw} initial="hidden" animate="visible" transition={reveal(reduced, delay, duration)} />
      {twin}
    </>
  );
}

/** A spoke from a hub to a satellite, trimmed to both rims so it never runs under a label. */
function spoke(cx: number, cy: number, x: number, y: number, hubRadius: number, itemRadius: number) {
  const dx = x - cx;
  const dy = y - cy;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const round = (value: number) => Math.round(value * 10) / 10;
  return `M${round(cx + ux * hubRadius)} ${round(cy + uy * hubRadius)} L${round(x - ux * itemRadius)} ${round(y - uy * itemRadius)}`;
}

/** Numbered stage marker: the walk survives without motion (brief §1c). */
function StageMarker({ x, y, stage, r = 10 }: { x: number; y: number; stage: number; r?: number }) {
  return (
    <g className="stage-marker" aria-hidden="true">
      <circle cx={x} cy={y} r={r} />
      <text x={x} y={y + r * 0.36}>{String(stage).padStart(2, '0')}</text>
    </g>
  );
}

/** Short rule under the label of a truth / bridge node. */
function TruthRule({ x, y, width = 40 }: { x: number; y: number; width?: number }) {
  return <path className="node-rule" d={`M${x - width / 2} ${y} H${x + width / 2}`} />;
}

type MobileStep = {
  title: string;
  caption: string;
  kind?: 'neutral' | 'direct' | 'bridge' | 'reference' | 'truth' | 'fail';
  state?: string;
};

type MobileVisualProps = {
  className: string;
  ids: ReturnType<typeof useDiagramIds>;
  title: string;
  description: string;
  kicker: string;
  steps: MobileStep[];
  conclusion?: string;
  conclusionStage?: number;
  reduced: boolean | null;
  scripted: boolean;
};

type MobileProps = Pick<MobileVisualProps, 'ids' | 'reduced' | 'scripted'>;

function MobileFlow({ className, ids, title, description, kicker, steps, conclusion, conclusionStage, reduced, scripted }: MobileVisualProps) {
  const tracing = useDiagramTracing();
  const top = 38;
  const row = conclusion ? 56 : 60;
  const bodyHeight = steps.length <= 3 ? 270 : 360;
  const viewHeight = bodyHeight + 22;
  const conclusionY = bodyHeight - 16;
  const keys = steps.map((step) => semanticKey(step.title));
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram ${className} is-compact is-mobile-layout`} data-diagram={className} data-layout="mobile-stack" data-density={steps.length <= 3 ? 'compact' : 'regular'} data-flow="sequential" data-motion={motionState(reduced)} data-arrival={scripted ? 'scripted' : 'self'} style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox={`0 0 360 ${viewHeight}`} role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>{title}</title>
      <desc id={ids.description}>{description}</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L6 3.5 L0 7 Z" fill="var(--paper)" opacity="0.72" /></marker>
      </defs>
      <text x="180" y="18" className="visual-kicker semantic-label" data-role="diagram-kicker">{kicker}</text>
      {steps.map((step, index) => {
        const y = top + index * row;
        const nodeClass = step.kind === 'direct' ? 'direct-node' : step.kind === 'reference' ? 'reference-node' : step.kind === 'truth' || step.kind === 'bridge' ? 'truth-node' : step.kind === 'fail' ? 'fail-node' : 'neutral-node';
        const truth = step.kind === 'truth' || step.kind === 'bridge';
        return (
          <motion.g key={`${step.title}-${index}`} className={`visual-node semantic-node can-highlight ${nodeClass}`} data-node={keys[index]} data-kind={step.kind ?? 'neutral'} data-stage={index + 1} data-state={step.state ?? 'resolved'} data-interaction="trace-flow" initial={enter(scripted, reduced, { opacity: 0, y: 6 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.1, 0.42)}>
            <rect className="node-surface" x="25" y={y} width="310" height="45" rx="14" />
            <StageMarker x={48} y={y + 22.5} stage={index + 1} r={10} />
            <text x="68" y={y + 20} style={{ textAnchor: 'start', fontSize: 15 }}>{step.title}</text>
            {truth && <path className="node-rule" d={`M68 ${y + 24.5} H96`} />}
            <text x="68" y={y + 36} className="node-caption" style={{ textAnchor: 'start', fontSize: 11 }}>{step.caption}</text>
          </motion.g>
        );
      })}
      {steps.slice(0, -1).map((step, index) => {
        const y = top + index * row;
        const tone = step.kind === 'direct' ? 'line-direct' : step.kind === 'reference' ? 'line-reference' : 'line-neutral';
        return (
          <g className="edge-group" data-sequence={index + 1} key={`edge-${keys[index]}`}>
            <Edge d={`M180 ${y + 45} V${y + row - 5}`} className={`semantic-edge flow-edge ${tone}`} data={{ edge: `${keys[index]}-to-${keys[index + 1]}`, from: keys[index], to: keys[index + 1], relation: 'enables' }} scripted={scripted} reduced={reduced} delay={0.14 + index * 0.1} duration={0.36} markerEnd={`url(#${ids.arrow})`} pulse />
          </g>
        );
      })}
      {conclusion && (
        <text
          x="180"
          y={conclusionY}
          className="semantic-node conclusion-node reach-conclusion"
          data-node="mobile-conclusion"
          data-kind="conclusion"
          data-stage={conclusionStage ?? steps.length}
          data-state="resolved"
          data-role="conclusion"
          style={{ fontSize: 13 }}
        >
          {conclusion}
        </text>
      )}
      <TraceReadout x={180} y={viewHeight - 6} text={tracing.readout} />
    </svg>
  );
}

function MobileKnowledge({ ids, reduced, scripted }: MobileProps) {
  const tracing = useDiagramTracing();
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className="concept-visual semantic-diagram knowledge-tree is-compact is-mobile-layout" data-diagram="knowledge-tree" data-layout="mobile-branch" data-flow="taxonomy-with-dependency" data-motion={motionState(reduced)} data-arrival={scripted ? 'scripted' : 'self'} style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 382" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Mapa del conocimiento según el capítulo cinco</title>
      <desc id={ids.description}>El conocimiento se divide en verdades y cosas. El conocimiento de cosas se divide en directo y por descripción. La descripción se apoya en verdades.</desc>
      <defs><marker id={ids.arrow} markerWidth="7" markerHeight="7" refX="5.5" refY="3.5" orient="auto"><path d="M0 0 L6 3.5 L0 7 Z" fill="var(--reference)" /></marker></defs>
      <text x="180" y="18" className="visual-kicker semantic-label" data-role="diagram-kicker">LA ARQUITECTURA DE «CONOCER»</text>
      <g className="edge-group">
        <Edge d="M180 80 V100 M180 100 H91 V119 M180 100 H269 V119" className="semantic-edge branch-edge line-neutral" data={{ edge: 'knowledge-to-primary-types', from: 'knowledge', to: 'truths things', relation: 'divides-into' }} scripted={scripted} reduced={reduced} delay={0.1} />
      </g>
      <g className="visual-node semantic-node can-highlight neutral-node" data-node="knowledge" data-kind="root" data-stage="0"><rect className="node-surface" x="94" y="34" width="172" height="46" rx="14" /><text x="180" y="63" style={{ fontSize: 16 }}>Conocimiento</text></g>
      <motion.g className="visual-node semantic-node can-highlight truth-node" data-node="truths" data-kind="truth" data-stage="1" data-interaction="trace-dependencies" initial={enter(scripted, reduced, { opacity: 0, x: -8 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}><rect className="node-surface" x="12" y="119" width="158" height="62" rx="14" /><StageMarker x={30} y={137} stage={1} r={9} /><text x="98" y="146" style={{ fontSize: 15 }}>De verdades</text><TruthRule x={98} y={152} width={30} /><text x="98" y="168" className="node-caption" style={{ fontSize: 11 }}>saber que p</text></motion.g>
      <motion.g className="visual-node semantic-node can-highlight neutral-node" data-node="things" data-kind="things" data-stage="1" data-interaction="trace-branches" initial={enter(scripted, reduced, { opacity: 0, x: 8 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}><rect className="node-surface" x="190" y="119" width="158" height="62" rx="14" /><text x="276" y="146" style={{ fontSize: 15 }}>De cosas</text><text x="276" y="168" className="node-caption" style={{ fontSize: 11 }}>conocer x</text></motion.g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M269 181 V207 M269 207 H91 V229 M269 207 V229" className="semantic-edge branch-edge line-neutral" data={{ edge: 'things-to-access-modes', from: 'things', to: 'direct description', relation: 'divides-into' }} scripted={scripted} reduced={reduced} delay={0.34} pulse />
      </g>
      <motion.g className="visual-node semantic-node can-highlight direct-node" data-node="direct" data-kind="direct" data-stage="2" data-state="presented" data-interaction="trace-origin" initial={enter(scripted, reduced, { opacity: 0, y: 7 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.45)}><text x="91" y="220" className="zone-label direct-label">INMEDIATO</text><rect className="node-surface" x="12" y="229" width="158" height="70" rx="14" /><StageMarker x={30} y={247} stage={2} r={9} /><text x="98" y="259" style={{ fontSize: 15 }}>Directo</text><text x="98" y="281" className="node-caption" style={{ fontSize: 11 }}>presencia · sin inferir</text></motion.g>
      <motion.g className="visual-node semantic-node can-highlight reference-node" data-node="description" data-kind="reference" data-stage="2" data-state="mediated" data-interaction="trace-dependencies" initial={enter(scripted, reduced, { opacity: 0, y: 7 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.54)}><text x="269" y="220" className="zone-label reference-label">MEDIADO</text><rect className="node-surface" x="190" y="229" width="158" height="70" rx="14" /><text x="276" y="259" style={{ fontSize: 15 }}>Por descripción</text><text x="276" y="281" className="node-caption" style={{ fontSize: 11 }}>«el F» · verdades</text></motion.g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M190 272 C172 272 182 214 142 184" className="semantic-edge dependency-edge line-reference dashed" data={{ edge: 'description-depends-on-truths', from: 'description', to: 'truths', relation: 'depends-on', state: 'mediated' }} scripted={scripted} reduced={reduced} delay={0.68} duration={0.8} markerEnd={`url(#${ids.arrow})`} />
        <rect className="edge-pill" x="111" y="316" width="150" height="26" rx="13" fill="var(--surface)" stroke="var(--reference)" strokeOpacity="0.4" /><text x="186" y="333" className="edge-label reference-label" style={{ fontSize: 9 }}>SE APOYA EN VERDADES</text>
      </g>
      <TraceReadout x={180} y={374} text={tracing.readout} />
    </svg>
  );
}

function MobileDirect({ ids, reduced, scripted }: MobileProps) {
  const tracing = useDiagramTracing();
  const items = [
    { x: 180, y: 58, label: 'Sensación' }, { x: 298, y: 124, label: 'Memoria' },
    { x: 280, y: 270, label: 'Introspección' }, { x: 80, y: 270, label: 'Universales' },
    { x: 62, y: 124, label: '¿Yo?', uncertain: true },
  ];
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className="concept-visual semantic-diagram direct-constellation is-compact is-mobile-layout" data-diagram="direct-constellation" data-layout="mobile-radial" data-flow="radial-acquaintance" data-motion={motionState(reduced)} data-arrival={scripted ? 'scripted' : 'self'} style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 382" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Campo del conocimiento directo</title><desc id={ids.description}>Sensación, memoria, introspección y universales rodean la presencia directa. El yo aparece como una tesis probable.</desc>
      <circle cx="180" cy="176" r="104" className="diagram-layer orbit-ring" data-layer="field" /><circle cx="180" cy="176" r="64" className="semantic-node orbit-core" data-node="direct-core" data-label="Directo" data-kind="direct" data-state="presented" />
      {items.map((item, index) => {
        const key = semanticKey(item.label);
        return (
          <motion.g key={item.label} className={`semantic-node can-highlight ${item.uncertain ? 'orbit-item uncertain-item' : 'orbit-item'}`} data-node={key} data-kind="object-of-acquaintance" data-stage={index + 1} data-state={item.uncertain ? 'probable' : 'presented'} data-interaction="highlight-relation" initial={enter(scripted, reduced, { opacity: 0 })} animate={{ opacity: 1 }} transition={reveal(reduced, index * 0.1)}>
            <Edge d={spoke(180, 176, item.x, item.y, 64, 40)} className={`semantic-edge acquaintance-edge ${item.uncertain ? 'line-uncertain dashed' : 'line-direct'}`} data={{ edge: `direct-to-${key}`, from: 'direct-core', to: key, relation: 'acquainted-with', state: item.uncertain ? 'probable' : 'asserted' }} scripted={scripted} reduced={reduced} delay={index * 0.1} duration={0.5} />
            <circle className="node-surface" cx={item.x} cy={item.y} r="40" />
            <StageMarker x={item.x - 28} y={item.y - 28} stage={index + 1} r={8} />
            <text x={item.x} y={item.y + 5} style={{ fontSize: item.label.length > 10 ? 12 : 14 }}>{item.label}</text>
          </motion.g>
        );
      })}
      <text x="180" y="172" className="core-title" style={{ fontSize: 17 }}>Directo</text><text x="180" y="191" className="core-note" style={{ fontSize: 11 }}>sin inferencia</text>
      <text x="180" y="336" className="edge-label" style={{ fontSize: 9 }}>DISCONTINUA = «YO» PROBABLE, NO CIERTO</text>
      <TraceReadout x={180} y={374} text={tracing.readout} />
    </svg>
  );
}

function MobileSubject({ ids, reduced, scripted }: MobileProps) {
  return <MobileFlow className="subject-relation" ids={ids} reduced={reduced} scripted={scripted} title="Anatomía relacional de una experiencia" description="Un sujeto incierto realiza el acto mental de ver, dirigido a un dato sensorial. La relación no demuestra un yo permanente." kicker="UNA EXPERIENCIA · TRES POSICIONES" steps={[
    { title: '¿Sujeto?', caption: 'portador del acto · no presentado', kind: 'neutral', state: 'probable' },
    { title: 'Acto mental', caption: '«estoy viendo» · introspección', kind: 'direct', state: 'presented' },
    { title: 'Dato sensorial', caption: 'objeto del acto · sensación', kind: 'direct', state: 'presented' },
  ]} conclusion="Hay sujeto del acto ≠ conozco un yo permanente" conclusionStage={4} />;
}

function MobileGate({ ids, reduced, scripted }: MobileProps) {
  return <MobileFlow className="description-gate" ids={ids} reduced={reduced} scripted={scripted} title="Prueba lógica de una descripción definida" description="El F debe existir y ser único. Si no existe, la descripción queda vacía; si hay varios, no identifica un referente único. Solo ambas condiciones producen una referencia unívoca." kicker="LA DESCRIPCIÓN «EL F» PASA DOS PRUEBAS" steps={[
    { title: 'Existencia', caption: '∃x F(x) · si no: descripción vacía', kind: 'truth', state: 'test' },
    { title: 'Unicidad', caption: 'a lo sumo un F · si no: no unívoca', kind: 'truth', state: 'test' },
    { title: 'Referente único', caption: '∃!x F(x) · referencia lograda', kind: 'reference', state: 'resolved' },
  ]} conclusion="Describir = identificar mediante verdades" conclusionStage={3} />;
}

function MobileCandidates({ ids, reduced, scripted }: MobileProps) {
  const tracing = useDiagramTracing();
  const people = [44, 112, 180, 248, 316];
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className="concept-visual semantic-diagram candidate-paradox is-compact is-mobile-layout" data-diagram="candidate-paradox" data-layout="mobile-convergence" data-flow="many-to-unknown-one" data-motion={motionState(reduced)} data-arrival={scripted ? 'scripted' : 'self'} style={{ width: '100%', maxWidth: 360, minWidth: 0 }} viewBox="0 0 360 382" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Cinco candidatos conocidos y un ganador desconocido</title><desc id={ids.description}>Conocemos a A, B, C, D y E, y sabemos que uno ganará, pero aún ignoramos quién satisface la descripción el ganador.</desc>
      <text x="180" y="18" className="visual-kicker semantic-label direct-label" data-role="diagram-kicker">CINCO CANDIDATOS FAMILIARES</text>
      {people.map((x, index) => { const candidate = String.fromCharCode(65 + index); return <motion.g key={x} className="semantic-node can-highlight person-symbol" data-node={`candidate-${candidate.toLowerCase()}`} data-label={`candidato ${candidate}`} data-kind="familiar-person" data-stage="1" data-state="presented-data" data-interaction="trace-candidate" initial={enter(scripted, reduced, { opacity: 0, y: 5 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.08)}><circle className="node-surface" cx={x} cy="65" r="18" />{index === 0 && <StageMarker x={x - 16} y={45} stage={1} r={8} />}<text x={x} y="71" style={{ fontSize: 15 }}>{candidate}</text></motion.g>; })}
      {people.map((x, index) => { const candidate = String.fromCharCode(65 + index).toLowerCase(); return <g className="edge-group" data-sequence={1} key={`edge-${x}`}><Edge d={`M${x} 84 C${x} 120 180 122 180 152`} className="semantic-edge candidate-edge line-reference dashed" data={{ edge: `candidate-${candidate}-to-winner`, from: `candidate-${candidate}`, to: 'winner-description', relation: 'could-satisfy', state: 'unresolved' }} scripted={scripted} reduced={reduced} delay={0.4 + index * 0.06} /></g>; })}
      <motion.g className="semantic-node can-highlight reference-node" data-node="winner-description" data-kind="description" data-stage="2" data-state="unresolved" data-interaction="highlight-candidates" initial={enter(scripted, reduced, { opacity: 0, y: 6 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.6)}><rect x="62" y="151" width="236" height="66" rx="17" className="node-surface winner-box" /><StageMarker x={80} y={169} stage={2} r={8} /><text x="180" y="180" className="winner-text" style={{ fontSize: 15 }}>«La persona ganadora»</text><text x="180" y="200" className="node-caption" style={{ fontSize: 10.5 }}>sé que exactamente una persona ganará</text></motion.g>
      <g className="edge-group" data-sequence={2}><Edge d="M180 217 V236" className="semantic-edge question-edge line-reference" data={{ edge: 'winner-to-identity-question', from: 'winner-description', to: 'identity-question', relation: 'identity-unresolved', state: 'unresolved' }} scripted={scripted} reduced={reduced} delay={0.7} pulse /></g>
      <motion.g className="visual-node semantic-node can-highlight reference-node" data-node="identity-question" data-label="identidad ignorada" data-kind="unknown-identity" data-stage="3" data-state="unresolved" initial={enter(scripted, reduced, { opacity: 0, y: 6 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.8)}><rect className="node-surface" x="25" y="242" width="310" height="48" rx="14" /><StageMarker x={43} y={260} stage={3} r={8} /><text x="188" y="262" className="edge-label reference-label" style={{ fontSize: 9 }}>IDENTIDAD IGNORADA</text><text x="188" y="281" style={{ fontSize: 14 }}>¿x = A, B, C, D o E?</text></motion.g>
      <text x="180" y="327" className="semantic-node conclusion-node reach-conclusion" data-node="mobile-conclusion" data-label="conocer cada candidato no identifica al ganador" data-kind="conclusion" data-stage="3" data-state="resolved" data-role="conclusion" style={{ fontSize: 12.5 }}>Conocer cada x ≠ saber cuál x satisface F</text>
      <TraceReadout x={180} y={374} text={tracing.readout} />
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
    <div className="epistemic-field" data-motion={motionState(reduced)} aria-hidden="true">
      <svg className="semantic-diagram decorative-network" data-diagram="epistemic-field" data-flow="ambient-network" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
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
        {links.map(([from, to], index) => {
          const pulses = index % 4 === 0;
          return <motion.line
            key={`${from}-${to}`}
            className={`semantic-edge field-edge${pulses ? ' is-pulsing' : ' is-static'}`}
            data-edge={`field-${from}-to-${to}`}
            data-from={`field-node-${from}`}
            data-to={`field-node-${to}`}
            data-relation="connects"
            data-state={pulses ? 'live' : 'ambient'}
            x1={nodes[from][0]}
            y1={nodes[from][1]}
            x2={nodes[to][0]}
            y2={nodes[to][1]}
            stroke={`url(#${ids.gradient})`}
            strokeWidth="0.14"
            vectorEffect="non-scaling-stroke"
            initial={{ opacity: pulses ? 0 : 0.14 }}
            animate={!reduced && pulses ? { opacity: [0.08, 0.28, 0.08] } : { opacity: 0.14 }}
            transition={!reduced && pulses ? { duration: 5.2 + index * 0.11, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          />;
        })}
        {nodes.map((node, index) => {
          const anchor = index === 5 || index === 6;
          const pulses = anchor;
          const restingOpacity = anchor ? 0.7 : 0.42;
          return <motion.circle
            key={`${node[0]}-${node[1]}`}
            className={`semantic-node field-node${pulses ? ' is-pulsing' : ' is-static'}`}
            data-node={`field-node-${index}`}
            data-kind={index < 6 ? 'direct' : 'reference'}
            data-state={anchor ? 'anchor' : pulses ? 'live' : 'ambient'}
            cx={node[0]}
            cy={node[1]}
            r={anchor ? 0.82 : 0.44}
            fill={index < 6 ? 'var(--direct)' : 'var(--reference)'}
            initial={{ opacity: pulses ? 0 : restingOpacity }}
            animate={!reduced && pulses ? { opacity: [0.28, 0.82, 0.28] } : { opacity: restingOpacity }}
            transition={!reduced && pulses ? { duration: 3.4 + index * 0.13, repeat: Infinity, ease: 'easeInOut' } : { duration: 0 }}
          />;
        })}
      </svg>
    </div>
  );
}

/* ---------- The eight diagrams ---------- */

export function KnowledgeTree({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('knowledge');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  if (narrow) return <MobileKnowledge ids={ids} reduced={reduced} scripted={scripted} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram knowledge-tree mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="knowledge-tree" data-layout="responsive-fit" data-flow="taxonomy-with-dependency" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 920 530" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Mapa del conocimiento según el capítulo cinco</title>
      <desc id={ids.description}>El conocimiento se divide en conocimiento de verdades y de cosas. El conocimiento de cosas se divide en directo, que presenta algo sin inferencia, y por descripción, que identifica algo mediante propiedades y depende de verdades.</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker>
        <linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.16" /><stop offset="0.5" stopColor="var(--line-strong)" stopOpacity="0.04" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.16" /></linearGradient>
      </defs>
      <rect className="diagram-layer layer-context" data-layer="context" x="28" y="18" width="864" height="478" rx="32" fill={`url(#${ids.gradient})`} opacity="0.45" />
      <text x="460" y="46" className="edge-label semantic-label" data-role="diagram-kicker">DOS PREGUNTAS: ¿QUÉ SÉ? · ¿CON QUÉ TIPO DE ACCESO?</text>
      <g className="edge-group">
        <Edge d="M460 126 V158 M460 158 H235 V194 M460 158 H685 V194" className="semantic-edge branch-edge line-neutral" data={{ edge: 'knowledge-to-primary-types', from: 'knowledge', to: 'truths things', relation: 'divides-into' }} scripted={scripted} reduced={reduced} delay={0.05} duration={0.8} />
      </g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M685 278 V320 M685 320 H565 V366 M685 320 H805 V366" className="semantic-edge branch-edge line-neutral" data={{ edge: 'things-to-access-modes', from: 'things', to: 'direct description', relation: 'divides-into' }} scripted={scripted} reduced={reduced} delay={0.3} duration={0.75} pulse />
      </g>
      <motion.g className="visual-node semantic-node can-highlight neutral-node" data-node="knowledge" data-kind="root" data-stage="0" data-interaction="trace-branches" initial={enter(scripted, reduced, { opacity: 0, y: -8 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced)}>
        <rect className="node-surface" x="340" y="66" width="240" height="60" rx="18" /><text x="460" y="103">Conocimiento</text>
      </motion.g>
      <motion.g className="visual-node semantic-node can-highlight truth-node" data-node="truths" data-kind="truth" data-stage="1" data-interaction="trace-dependencies" initial={enter(scripted, reduced, { opacity: 0, x: -18 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}>
        <rect className="node-surface" x="95" y="194" width="280" height="84" rx="20" /><StageMarker x={119} y={218} stage={1} /><text x="235" y="230">De verdades</text><TruthRule x={235} y={238} /><text x="235" y="258" className="node-caption">saber que p · proposiciones</text>
      </motion.g>
      <motion.g className="visual-node semantic-node can-highlight neutral-node" data-node="things" data-kind="things" data-stage="1" data-interaction="trace-branches" initial={enter(scripted, reduced, { opacity: 0, x: 18 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.2)}>
        <rect className="node-surface" x="545" y="194" width="280" height="84" rx="20" /><text x="685" y="230">De cosas</text><text x="685" y="258" className="node-caption">particulares · universales</text>
      </motion.g>
      <motion.g className="visual-node semantic-node can-highlight direct-node" data-node="direct" data-kind="direct" data-stage="2" data-state="presented" data-interaction="trace-origin" initial={enter(scripted, reduced, { opacity: 0, y: 14 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.45)}>
        <text x="565" y="349" className="zone-label direct-label">INMEDIATO</text><rect className="node-surface" x="450" y="366" width="230" height="96" rx="22" /><StageMarker x={474} y={390} stage={2} /><text x="565" y="409">Directo</text><text x="565" y="437" className="node-caption">presencia · sin inferencia</text>
      </motion.g>
      <motion.g className="visual-node semantic-node can-highlight reference-node" data-node="description" data-kind="reference" data-stage="2" data-state="mediated" data-interaction="trace-dependencies" initial={enter(scripted, reduced, { opacity: 0, y: 14 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.57)}>
        <text x="805" y="349" className="zone-label reference-label">MEDIADO</text><rect className="node-surface" x="690" y="366" width="230" height="96" rx="22" /><text x="805" y="409">Por descripción</text><text x="805" y="437" className="node-caption">«el F» · mediante verdades</text>
      </motion.g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M782 366 C740 308 602 300 448 309 C330 316 275 302 258 278" className="semantic-edge dependency-edge line-reference dashed" data={{ edge: 'description-depends-on-truths', from: 'description', to: 'truths', relation: 'depends-on', state: 'mediated' }} scripted={scripted} reduced={reduced} delay={0.72} duration={0.95} markerEnd={`url(#${ids.arrow})`} />
        <rect className="edge-pill" x="382" y="294" width="196" height="29" rx="14" fill="var(--surface)" stroke="var(--reference)" strokeOpacity="0.35" /><text x="480" y="313" className="edge-label reference-label">SE APOYA EN VERDADES</text>
      </g>
      <TraceReadout x={460} y={519} text={tracing.readout} />
    </svg>
  );
}

export function TableBridge({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('table');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  const steps = [
    { x: 20, title: 'Percibir', lines: ['ver · tocar'], kind: 'neutral', relation: 'presenta' },
    { x: 222, title: 'Datos', lines: ['color · forma', 'dureza'], kind: 'direct', relation: 'formula' },
    { x: 424, title: 'Verdad', lines: ['«un objeto físico', 'causa estos datos»'], kind: 'bridge', relation: 'describe' },
    { x: 626, title: '«El objeto»', lines: ['que causa', 'estos datos'], kind: 'reference', relation: 'refiere a' },
    { x: 828, title: 'Mesa', lines: ['objeto físico'], kind: 'reference', relation: '' },
  ];
  const keys = steps.map((step) => semanticKey(step.title));
  if (narrow) return <MobileFlow className="table-bridge" ids={ids} reduced={reduced} scripted={scripted} title="Del dato sensorial a la mesa física" description="Percibir presenta datos sensoriales. Una verdad causal permite describir el objeto que causa esos datos y referirse a la mesa física." kicker="DEL DATO PRESENTE AL OBJETO DESCRITO" steps={[
    { title: 'Percibir', caption: 'ver · tocar', kind: 'neutral', state: 'datum' },
    { title: 'Datos sensoriales', caption: 'color · forma · dureza', kind: 'direct', state: 'datum' },
    { title: 'Verdad puente', caption: '«un objeto físico causa estos datos»', kind: 'bridge', state: 'inference' },
    { title: 'Descripción', caption: '«el objeto que causa estos datos»', kind: 'reference', state: 'object' },
    { title: 'Mesa física', caption: 'objeto conocido por referencia', kind: 'reference', state: 'object' },
  ]} conclusion="Lo dado → inferencia → lo descrito" conclusionStage={5} />;
  const axisSegments = [
    { d: 'M106 292 H406', sequence: undefined, edge: 'certainty-axis-presented' },
    { d: 'M404 292 H608', sequence: 2, edge: 'certainty-axis-bridge' },
    { d: 'M606 292 H914', sequence: 4, edge: 'certainty-axis-described' },
  ];
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram table-bridge mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="table-bridge" data-layout="responsive-fit" data-flow="causal-sequence" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 1020 410" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Del dato sensorial a la mesa física</title>
      <desc id={ids.description}>Cinco pasos muestran la inferencia. Percibir presenta datos sensoriales. Una verdad causal permite describir el objeto que causa esos datos y referirse a la mesa física. Solo los datos están presentados directamente.</desc>
      <defs>
        <marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--paper)" opacity="0.72" /></marker>
        <linearGradient id={ids.gradient} gradientUnits="userSpaceOnUse" x1="106" y1="0" x2="914" y2="0"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.9" /><stop offset="0.47" stopColor="var(--direct)" stopOpacity="0.35" /><stop offset="0.53" stopColor="var(--reference)" stopOpacity="0.35" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.9" /></linearGradient>
      </defs>
      <rect className="diagram-layer layer-direct" data-layer="presented" x="10" y="36" width="394" height="290" rx="28" fill="var(--direct-soft)" opacity="0.42" /><rect className="diagram-layer layer-bridge" data-layer="inference" x="414" y="36" width="192" height="290" rx="28" fill="var(--surface-2)" opacity="0.62" /><rect className="diagram-layer layer-reference" data-layer="described" x="616" y="36" width="394" height="290" rx="28" fill="var(--reference-soft)" opacity="0.48" />
      <text x="207" y="24" className="zone-label direct-label">PRESENTACIÓN · LO DADO</text><text x="510" y="24" className="zone-label">VERDAD PUENTE</text><text x="813" y="24" className="zone-label reference-label">DESCRIPCIÓN · LO INFERIDO</text>
      {steps.slice(0, -1).map((step, index) => <g className="edge-group" data-sequence={index + 1} key={`arrow-${keys[index]}`}>
        <Edge d={`M${step.x + 172} 179 H${steps[index + 1].x - 9}`} className={`semantic-edge flow-edge ${index < 1 ? 'line-direct' : index > 1 ? 'line-reference' : 'line-neutral'}`} data={{ edge: `${keys[index]}-to-${keys[index + 1]}`, from: keys[index], to: keys[index + 1], relation: step.relation }} scripted={scripted} reduced={reduced} delay={0.22 + index * 0.15} duration={0.5} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x={(step.x + 172 + steps[index + 1].x - 9) / 2} y="104" className="edge-label" style={{ fontSize: 8 }}>{step.relation.toUpperCase()}</text>
      </g>)}
      {steps.map((step, index) => <motion.g key={step.title} className={`bridge-step semantic-node can-highlight ${step.kind}-step`} data-node={keys[index]} data-kind={step.kind} data-stage={index + 1} data-state={index < 2 ? 'datum' : index === 2 ? 'inference' : 'object'} data-interaction="trace-flow" initial={enter(scripted, reduced, { opacity: 0, y: 12 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.13, 0.5)}>
        <rect className="node-surface" x={step.x} y="116" width="172" height="126" rx="20" /><StageMarker x={step.x + 24} y={140} stage={index + 1} r={11} /><text x={step.x + 86} y="178">{step.title}</text>
        {step.kind === 'bridge' && <TruthRule x={step.x + 86} y={186} />}
        {step.lines.map((line, lineIndex) => <text key={line} x={step.x + 86} y={205 + lineIndex * 20} className="node-caption">{line}</text>)}
      </motion.g>)}
      {axisSegments.map((segment) => (
        <g className="edge-group" data-sequence={segment.sequence} key={segment.edge}>
          <Edge d={segment.d} className="semantic-edge certainty-axis" data={{ edge: segment.edge, from: keys[1], to: keys[4], relation: 'decreasing-certainty' }} scripted={scripted} reduced={reduced} delay={0.72} duration={0.9} stroke={`url(#${ids.gradient})`} strokeWidth={3} strokeLinecap="round" />
        </g>
      ))}
      <text x="106" y="318" className="edge-label direct-label" textAnchor="start">CERTEZA DE LOS DATOS</text><text x="914" y="318" className="edge-label reference-label" textAnchor="end">HIPÓTESIS SOBRE LA CAUSA</text>
      <TraceReadout x={510} y={392} text={tracing.readout} />
    </svg>
  );
}

export function DirectConstellation({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('direct');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  const items = [
    { x: 460, y: 76, label: 'Sensación', note: 'dato presente', uncertain: false },
    { x: 748, y: 190, label: 'Memoria', note: 'dato pasado', uncertain: false },
    { x: 672, y: 432, label: 'Introspección', note: 'acto mental', uncertain: false },
    { x: 248, y: 432, label: 'Universales', note: 'cualidad · relación', uncertain: false },
    { x: 172, y: 190, label: '¿Yo?', note: 'tesis probable', uncertain: true },
  ];
  if (narrow) return <MobileDirect ids={ids} reduced={reduced} scripted={scripted} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram direct-constellation mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="direct-constellation" data-layout="responsive-fit" data-flow="radial-acquaintance" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 920 540" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Campo del conocimiento directo</title>
      <desc id={ids.description}>En el centro está la presencia sin inferencia. De ella parten sensación de datos presentes, memoria de datos pasados, introspección de actos mentales, universales y, como tesis probable marcada por una línea discontinua, el yo.</desc>
      <defs><radialGradient id={ids.gradient}><stop offset="0" stopColor="var(--direct)" stopOpacity="0.25" /><stop offset="0.52" stopColor="var(--direct)" stopOpacity="0.07" /><stop offset="1" stopColor="var(--direct)" stopOpacity="0" /></radialGradient></defs>
      <circle cx="460" cy="274" r="178" className="diagram-layer layer-field" data-layer="acquaintance-field" fill={`url(#${ids.gradient})`} /><circle cx="460" cy="274" r="178" className="diagram-layer orbit-ring" data-layer="outer-orbit" /><circle cx="460" cy="274" r="112" className="diagram-layer orbit-ring" data-layer="inner-orbit" opacity="0.7" />
      {items.map((item, index) => { const itemKey = semanticKey(item.label); return <motion.g key={item.note} className={`semantic-node can-highlight ${item.uncertain ? 'orbit-item uncertain-item' : 'orbit-item'}`} data-node={itemKey} data-kind="object-of-acquaintance" data-stage={index + 1} data-state={item.uncertain ? 'probable' : 'presented'} data-interaction="highlight-relation" initial={enter(scripted, reduced, { opacity: 0 })} animate={{ opacity: 1 }} transition={reveal(reduced, 0.08 + index * 0.12)}>
        <Edge d={spoke(460, 274, item.x, item.y, 82, 64)} className={`semantic-edge acquaintance-edge ${item.uncertain ? 'line-uncertain dashed' : 'line-direct'}`} data={{ edge: `direct-to-${itemKey}`, from: 'direct-core', to: itemKey, relation: 'acquainted-with', state: item.uncertain ? 'probable' : 'asserted' }} scripted={scripted} reduced={reduced} delay={0.12 + index * 0.12} duration={0.65} />
        <circle className="node-surface" cx={item.x} cy={item.y} r="64" /><circle className="node-detail" cx={item.x} cy={item.y} r="50" fill="none" stroke="var(--direct)" strokeOpacity="0.14" />
        <StageMarker x={item.x - 46} y={item.y - 46} stage={index + 1} />
        <text x={item.x} y={item.y + 2} style={{ fontSize: item.label.length > 10 ? 17 : 20 }}>{item.label}</text><text x={item.x} y={item.y + 27} className="node-caption" style={{ fontSize: 13.5 }}>{item.note}</text>
      </motion.g>; })}
      <motion.g className="semantic-node can-highlight" data-node="direct-core" data-kind="direct" data-stage="0" data-state="presented" data-interaction="highlight-all-relations" initial={enter(scripted, reduced, { opacity: 0, scale: 0.92 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.18, 0.65)} style={scripted ? undefined : { transformOrigin: '460px 274px' }}><circle cx="460" cy="274" r="82" className="node-surface orbit-core" /><circle cx="460" cy="274" r="66" className="node-detail" fill="none" stroke="var(--direct)" strokeOpacity="0.26" /><text x="460" y="266" className="core-title">Directo</text><text x="460" y="292" className="core-note">presencia sin inferencia</text></motion.g>
      <rect x="72" y="505" width="18" height="2" fill="var(--direct)" /><text x="100" y="509" className="edge-label" textAnchor="start">CONTINUA: TESIS FIRME</text><path d="M330 506 h18" className="line-uncertain dashed" /><text x="358" y="509" className="edge-label" textAnchor="start">DISCONTINUA: TESIS PROBABLE</text>
      <TraceReadout x={460} y={534} text={tracing.readout} />
    </svg>
  );
}

export function SubjectRelation({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('subject');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  if (narrow) return <MobileSubject ids={ids} reduced={reduced} scripted={scripted} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram subject-relation mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="subject-relation" data-layout="responsive-fit" data-flow="relational-analysis" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 980 500" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Anatomía relacional de una experiencia visual</title>
      <desc id={ids.description}>Un sujeto incierto realiza un acto mental de ver, y ese acto se dirige a un dato sensorial. El acto se conoce por introspección y el dato por sensación. La estructura exige un sujeto, pero no demuestra un yo permanente conocido directamente.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--direct)" /></marker><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0" /><stop offset="0.5" stopColor="var(--direct)" stopOpacity="0.16" /><stop offset="1" stopColor="var(--direct)" stopOpacity="0" /></linearGradient></defs>
      <text x="490" y="34" className="visual-kicker semantic-label" data-role="diagram-kicker">UNA EXPERIENCIA · DOS TÉRMINOS CONOCIDOS · UNA INCÓGNITA</text><rect className="diagram-layer layer-relation" data-layer="experience" x="50" y="70" width="880" height="260" rx="32" fill={`url(#${ids.gradient})`} />
      <g className="edge-group" data-sequence={1}>
        <Edge d="M275 200 H382" className="semantic-edge relation-edge line-direct" data={{ edge: 'subject-performs-act', from: 'subject', to: 'mental-act', relation: 'performs', state: 'subject-uncertain' }} scripted={scripted} reduced={reduced} delay={0.2} duration={0.65} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="328" y="179" className="edge-label">REALIZA</text>
      </g>
      <g className="edge-group" data-sequence={2}>
        <Edge d="M598 200 H705" className="semantic-edge relation-edge line-direct" data={{ edge: 'act-directed-to-datum', from: 'mental-act', to: 'sense-datum', relation: 'directed-to', state: 'asserted' }} scripted={scripted} reduced={reduced} delay={0.42} duration={0.65} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="652" y="179" className="edge-label">SE DIRIGE A</text>
      </g>
      <motion.g className="subject-node semantic-node can-highlight uncertain-node" data-node="subject" data-kind="subject" data-stage="1" data-state="probable" data-interaction="highlight-limit" initial={enter(scripted, reduced, { opacity: 0, x: -12 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.05)}><circle className="node-surface" cx="185" cy="200" r="90" /><circle className="node-detail" cx="185" cy="200" r="72" fill="none" stroke="var(--direct)" strokeOpacity="0.14" /><StageMarker x={121} y={136} stage={1} /><text x="185" y="190">¿Sujeto?</text><text x="185" y="216" className="node-caption">portador del acto</text><text x="185" y="238" className="node-caption" style={{ fontSize: 13.5 }}>no presentado con certeza</text></motion.g>
      <motion.g className="subject-node semantic-node can-highlight direct-node" data-node="mental-act" data-kind="direct" data-stage="2" data-state="presented" data-interaction="highlight-relation" initial={enter(scripted, reduced, { opacity: 0, y: 10 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.24)}><rect className="node-surface" x="382" y="122" width="216" height="156" rx="30" /><StageMarker x={406} y={146} stage={2} /><text x="490" y="184">Acto mental</text><text x="490" y="211" className="node-caption">«estoy viendo»</text><rect className="node-detail" x="420" y="232" width="140" height="27" rx="13" fill="var(--surface)" stroke="var(--direct)" strokeOpacity="0.35" /><text x="490" y="250" className="edge-label direct-label">INTROSPECCIÓN</text></motion.g>
      <motion.g className="subject-node semantic-node can-highlight direct-node" data-node="sense-datum" data-kind="direct" data-stage="3" data-state="presented" data-interaction="highlight-relation" initial={enter(scripted, reduced, { opacity: 0, x: 12 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.46)}><circle className="node-surface" cx="795" cy="200" r="90" /><circle className="node-detail" cx="795" cy="200" r="72" fill="none" stroke="var(--direct)" strokeOpacity="0.16" /><StageMarker x={731} y={136} stage={3} /><text x="795" y="196">Dato sensorial</text><text x="795" y="222" className="node-caption">mancha luminosa</text><text x="795" y="313" className="edge-label direct-label">SENSACIÓN</text></motion.g>
      <g className="edge-group" data-sequence={3}>
        <Edge d="M185 304 C244 356 308 371 383 373" className="semantic-edge limit-edge line-uncertain dashed" data={{ edge: 'subject-to-epistemic-limit', from: 'subject', to: 'epistemic-limit', relation: 'does-not-entail', state: 'uncertain' }} scripted={scripted} reduced={reduced} delay={0.65} duration={0.7} />
      </g>
      <g className="semantic-node conclusion-node limit-node" data-node="epistemic-limit" data-label="límite del argumento" data-kind="conclusion" data-stage="4" data-state="limit"><rect className="node-surface" x="382" y="340" width="548" height="101" rx="24" /><StageMarker x={406} y={364} stage={4} /><text x="656" y="372" className="uncertain-label">LO QUE LA RELACIÓN PERMITE AFIRMAR</text><text x="656" y="403">hay un sujeto del acto</text><text x="656" y="428" className="node-caption">≠ conocemos un yo simple y permanente</text></g>
      <TraceReadout x={490} y={488} text={tracing.readout} />
    </svg>
  );
}

export function DescriptionGate({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('description');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  if (narrow) return <MobileGate ids={ids} reduced={reduced} scripted={scripted} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram description-gate mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="description-gate" data-layout="responsive-fit" data-flow="conditional-logic" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 1000 540" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Prueba lógica de una descripción definida</title>
      <desc id={ids.description}>La expresión el F debe superar dos pruebas: existencia y unicidad. Si falla la existencia queda vacía; si falla la unicidad no identifica un referente único. Solo si supera ambas logra una referencia unívoca, expresada como existe exactamente un x tal que F de x.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--paper)" opacity="0.75" /></marker></defs>
      <text x="500" y="34" className="visual-kicker semantic-label" data-role="diagram-kicker">UNA DESCRIPCIÓN NO NOMBRA: PROPONE CONDICIONES</text>
      <motion.g className="gate-node semantic-node can-highlight neutral-node" data-node="description-input" data-label="descripción «el F»" data-kind="description" data-stage="0" data-state="pending" data-interaction="trace-outcomes" initial={enter(scripted, reduced, { opacity: 0, x: -12 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced)}><rect className="node-surface" x="20" y="155" width="208" height="110" rx="22" /><text x="124" y="197">Descripción</text><text x="124" y="226" className="node-caption reference-label" style={{ fontSize: 17 }}>«el F»</text><text x="124" y="250" className="node-caption">punto de partida</text></motion.g>
      <g className="edge-group">
        <Edge d="M228 210 H274" className="semantic-edge flow-edge line-neutral" data={{ edge: 'description-to-existence', from: 'description-input', to: 'existence-test', relation: 'requires' }} scripted={scripted} reduced={reduced} delay={0.15} markerEnd={`url(#${ids.arrow})`} pulse />
      </g>
      <motion.g className="gate-diamond semantic-node can-highlight" data-node="existence-test" data-kind="condition" data-stage="1" data-state="test" data-interaction="highlight-branches" initial={enter(scripted, reduced, { opacity: 0, scale: 0.94 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.22)} style={scripted ? undefined : { transformOrigin: '374px 210px' }}><path className="node-surface" d="M374 132 L478 210 L374 288 L270 210 Z" /><StageMarker x={374} y={116} stage={1} /><text x="374" y="198">¿Existe</text><text x="374" y="222">algún F?</text><text x="374" y="246" className="node-formula">∃x F(x)</text></motion.g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M478 210 H548" className="semantic-edge success-edge line-neutral" data={{ edge: 'existence-to-uniqueness', from: 'existence-test', to: 'uniqueness-test', relation: 'yes', state: 'pass' }} scripted={scripted} reduced={reduced} delay={0.38} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="514" y="190" className="edge-label semantic-label direct-label" data-role="branch-label">SÍ</text>
      </g>
      <motion.g className="gate-diamond semantic-node can-highlight" data-node="uniqueness-test" data-kind="condition" data-stage="2" data-state="test" data-interaction="highlight-branches" initial={enter(scripted, reduced, { opacity: 0, scale: 0.94 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.45)} style={scripted ? undefined : { transformOrigin: '652px 210px' }}><path className="node-surface" d="M652 132 L756 210 L652 288 L548 210 Z" /><StageMarker x={652} y={116} stage={2} /><text x="652" y="198">¿Es el</text><text x="652" y="222">único F?</text><text x="652" y="246" className="node-formula" style={{ fontSize: 8.5 }}>∀x∀y[(F(x)∧F(y))→x=y]</text></motion.g>
      <g className="edge-group" data-sequence={2}>
        <Edge d="M756 210 H800" className="semantic-edge success-edge line-reference" data={{ edge: 'uniqueness-to-referent', from: 'uniqueness-test', to: 'unique-referent', relation: 'yes', state: 'pass' }} scripted={scripted} reduced={reduced} delay={0.6} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="778" y="190" className="edge-label semantic-label direct-label" data-role="branch-label">SÍ</text>
      </g>
      <motion.g className="gate-node semantic-node can-highlight reference-node" data-node="unique-referent" data-kind="reference" data-stage="3" data-state="resolved" data-interaction="trace-conditions" initial={enter(scripted, reduced, { opacity: 0, x: 12 })} animate={{ opacity: 1, x: 0 }} transition={reveal(reduced, 0.68)}><rect className="node-surface" x="800" y="155" width="180" height="110" rx="22" /><StageMarker x={822} y={177} stage={3} /><text x="890" y="197">Referente</text><text x="890" y="221">único</text><text x="890" y="247" className="node-formula">∃!x F(x)</text></motion.g>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M374 288 V344" className="semantic-edge failure-edge line-fail" data={{ edge: 'existence-to-empty', from: 'existence-test', to: 'empty-description', relation: 'no', state: 'fail' }} scripted={scripted} reduced={reduced} delay={0.43} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="394" y="321" className="edge-label semantic-label fail-label" data-role="branch-label">NO</text>
      </g>
      <motion.g className="gate-node semantic-node can-highlight fail-node" data-node="empty-description" data-kind="failure" data-stage="2" data-state="fail" initial={enter(scripted, reduced, { opacity: 0, y: 8 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.51)}><rect className="node-surface" x="274" y="344" width="200" height="88" rx="20" /><text x="374" y="382">Vacía</text><text x="374" y="410" className="node-caption">ningún F satisface</text></motion.g>
      <g className="edge-group" data-sequence={2}>
        <Edge d="M652 288 V344" className="semantic-edge failure-edge line-fail" data={{ edge: 'uniqueness-to-non-univocal', from: 'uniqueness-test', to: 'non-univocal-description', relation: 'no', state: 'fail' }} scripted={scripted} reduced={reduced} delay={0.65} markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="672" y="321" className="edge-label semantic-label fail-label" data-role="branch-label">NO</text>
      </g>
      <motion.g className="gate-node semantic-node can-highlight fail-node" data-node="non-univocal-description" data-kind="failure" data-stage="3" data-state="fail" initial={enter(scripted, reduced, { opacity: 0, y: 8 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.73)}><rect className="node-surface" x="552" y="344" width="200" height="88" rx="20" /><text x="652" y="382">No unívoca</text><text x="652" y="410" className="node-caption">más de un F satisface</text></motion.g>
      <TraceReadout x={500} y={508} text={tracing.readout} />
    </svg>
  );
}

export function CandidateParadox({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('candidate');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  const people = [152, 306, 460, 614, 768];
  if (narrow) return <MobileCandidates ids={ids} reduced={reduced} scripted={scripted} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram candidate-paradox mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="candidate-paradox" data-layout="responsive-fit" data-flow="many-to-unknown-one" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 920 520" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Cinco candidatos conocidos y un ganador desconocido</title>
      <desc id={ids.description}>Podemos estar familiarizados con A, B, C, D y E mediante datos directamente presentados. Sabemos que exactamente una persona ganará, pero antes del resultado ignoramos cuál satisface la descripción el ganador. La familiaridad con cada candidato no equivale a identificar el referente.</desc>
      <defs><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker><linearGradient id={ids.gradient} x1="0" x2="1"><stop offset="0" stopColor="var(--direct)" stopOpacity="0.15" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0.15" /></linearGradient></defs>
      <rect className="diagram-layer layer-candidates" data-layer="familiar-candidates" x="58" y="25" width="804" height="245" rx="30" fill="var(--direct-soft)" opacity="0.34" /><text x="460" y="58" className="visual-kicker semantic-label direct-label" data-role="diagram-kicker">DATOS DIRECTOS ASOCIADOS A CINCO CANDIDATOS</text>
      {people.map((x, index) => { const candidate = String.fromCharCode(65 + index); return <motion.g key={x} className="semantic-node can-highlight person-symbol" data-node={`candidate-${candidate.toLowerCase()}`} data-label={`candidato ${candidate}`} data-kind="familiar-person" data-stage="1" data-state="presented-data" data-interaction="trace-candidate" initial={enter(scripted, reduced, { opacity: 0, y: 10 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, index * 0.09)}><circle className="node-surface" cx={x} cy="128" r="27" /><path className="node-detail" d={`M${x - 43} 211 Q${x} 159 ${x + 43} 211`} />{index === 0 && <StageMarker x={x - 48} y={100} stage={1} />}<circle className="node-index" cx={x} cy="230" r="20" fill="var(--direct-soft)" /><text x={x} y="237" className="candidate-letter">{candidate}</text></motion.g>; })}
      {people.map((x, index) => { const candidate = String.fromCharCode(65 + index).toLowerCase(); return <g className="edge-group" data-sequence={1} key={`candidate-line-${x}`}><Edge d={`M${x} 250 C${x} 302 ${390 + index * 35} 302 ${390 + index * 35} 346`} className="semantic-edge candidate-edge line-reference dashed" data={{ edge: `candidate-${candidate}-to-winner`, from: `candidate-${candidate}`, to: 'winner-description', relation: 'could-satisfy', state: 'unresolved' }} scripted={scripted} reduced={reduced} delay={0.5 + index * 0.07} duration={0.7} /></g>; })}
      <motion.g className="semantic-node can-highlight reference-node" data-node="winner-description" data-kind="description" data-stage="2" data-state="unresolved" data-interaction="highlight-candidates" initial={enter(scripted, reduced, { opacity: 0, y: 12 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.75)}><rect x="286" y="346" width="348" height="94" rx="24" className="node-surface winner-box" /><StageMarker x={310} y={370} stage={2} /><path className="node-detail" d="M433 374 L445 356 L460 374 L475 356 L487 374 L482 388 H438 Z" fill="none" stroke="var(--reference)" strokeWidth="2" /><text x="460" y="412" className="winner-text">«La persona ganadora»</text><text x="460" y="432" className="node-caption">referente pendiente del resultado</text></motion.g>
      <g className="semantic-node truth-node" data-node="unique-winner-truth" data-label="verdad conocida" data-kind="truth" data-stage="2" data-state="known"><rect className="node-surface" x="66" y="355" width="188" height="76" rx="18" /><text x="166" y="381" className="edge-label">VERDAD CONOCIDA</text><TruthRule x={166} y={389} width={30} /><text x="166" y="411" className="node-formula" style={{ fontSize: 12 }}>∃!x Ganará(x)</text></g>
      <g className="edge-group" data-sequence={1}><Edge d="M254 393 H278" className="semantic-edge support-edge line-neutral" data={{ edge: 'winner-truth-to-description', from: 'unique-winner-truth', to: 'winner-description', relation: 'asserts-existence-uniqueness' }} scripted={scripted} reduced={reduced} delay={0.66} markerEnd={`url(#${ids.arrow})`} pulse /></g>
      <g className="semantic-node reference-node" data-node="identity-question" data-label="identidad ignorada" data-kind="unknown-identity" data-stage="3" data-state="unresolved"><rect className="node-surface" x="666" y="355" width="188" height="76" rx="18" /><StageMarker x={684} y={373} stage={3} r={9} /><text x="768" y="381" className="edge-label reference-label">IDENTIDAD IGNORADA</text><text x="768" y="411" style={{ fontSize: 17 }}>¿x = A, B, C, D o E?</text></g>
      <g className="edge-group" data-sequence={2}><Edge d="M634 393 H658" className="semantic-edge question-edge line-reference" data={{ edge: 'winner-to-identity-question', from: 'winner-description', to: 'identity-question', relation: 'identity-unresolved', state: 'unresolved' }} scripted={scripted} reduced={reduced} delay={0.82} markerEnd={`url(#${ids.arrow})`} pulse /></g>
      <g className="semantic-node conclusion-node" data-label="conocer cada candidato no identifica al ganador" data-kind="conclusion" data-stage="3" data-state="resolved"><rect x="202" y="466" width="516" height="37" rx="18" fill={`url(#${ids.gradient})`} /><text x="460" y="491" className="reach-conclusion">Conocer cada x ≠ saber cuál x satisface F</text></g>
      <TraceReadout x={460} y={517} text={tracing.readout} />
    </svg>
  );
}

export function BismarckDistance({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('distance');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  const stops = [
    { x: 100, key: 'bismarck-para-si', label: 'Bismarck para sí', note: '¿autoexperiencia?', level: 'near' },
    { x: 300, key: 'quien-lo-trato', label: 'Quien lo trató', note: 'datos → él descrito', level: 'middle' },
    { x: 500, key: 'lector-de-historia', label: 'Lector de historia', note: 'testimonios', level: 'middle' },
    { x: 700, key: 'mascara-de-hierro', label: 'Máscara de hierro', note: 'rasgos sin identidad', level: 'far' },
    { x: 900, key: 'el-mas-longevo', label: 'El más longevo', note: 'solo definición', level: 'far' },
  ];
  if (narrow) return <MobileFlow className="bismarck-distance" ids={ids} reduced={reduced} scripted={scripted} title="Continuo entre presentación y descripción" description="La escala va desde Bismarck para sí mismo hasta una persona conocida solo por definición. Aumenta la mediación mediante verdades." kicker="AUMENTA LA DISTANCIA EPISTÉMICA" steps={[
    { title: 'Bismarck para sí', caption: 'autoexperiencia posible', kind: 'direct', state: 'near' },
    { title: 'Quien lo trató', caption: 'datos directos → Bismarck descrito', kind: 'truth', state: 'middle' },
    { title: 'Lector de historia', caption: 'testimonios', kind: 'truth', state: 'middle' },
    { title: 'Máscara de hierro', caption: 'rasgos sin identidad', kind: 'reference', state: 'far' },
    { title: 'El más longevo', caption: 'solo definición', kind: 'reference', state: 'far' },
  ]} conclusion="Menos presentación → más descripción" conclusionStage={5} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram bismarck-distance mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="bismarck-distance" data-layout="responsive-fit" data-flow="epistemic-continuum" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 1000 480" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Continuo entre presentación y descripción</title>
      <desc id={ids.description}>Cinco posiciones muestran una distancia epistemológica creciente: la posible autoexperiencia de Bismarck; alguien que conoce directamente datos sensoriales, pero a Bismarck mediante ellos; el lector de historia; el hombre de la máscara de hierro; y el hombre más longevo. Hacia la derecha disminuye la presentación y aumenta la dependencia de verdades.</desc>
      <defs><linearGradient id={ids.gradient} gradientUnits="userSpaceOnUse" x1="78" y1="0" x2="922" y2="0"><stop offset="0" stopColor="var(--direct)" /><stop offset="0.5" stopColor="var(--paper)" /><stop offset="1" stopColor="var(--reference)" /></linearGradient><marker id={ids.arrow} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="var(--reference)" /></marker></defs>
      <text x="78" y="48" className="distance-pole semantic-label direct-label" data-role="axis-start" textAnchor="start">MAYOR PRESENTACIÓN</text><text x="922" y="48" className="distance-pole semantic-label reference-label" data-role="axis-end" textAnchor="end">MAYOR DEPENDENCIA DE VERDADES</text><path d="M78 68 H922" className="semantic-edge continuum-axis" data-edge="presentation-to-description-axis" data-from="presentation" data-to="description" data-relation="increasing-mediation" stroke={`url(#${ids.gradient})`} strokeWidth="3" markerEnd={`url(#${ids.arrow})`} />
      <rect className="diagram-layer layer-continuum" data-layer="epistemic-distance" x="58" y="102" width="884" height="236" rx="34" fill="var(--surface)" stroke="var(--line-strong)" strokeOpacity="0.55" />
      {stops.slice(0, -1).map((stop, index) => (
        <g className="edge-group" data-sequence={index + 1} key={`spine-${stop.key}`}>
          <Edge d={`M${stop.x} 210 H${stops[index + 1].x}`} className="semantic-edge distance-spine" data={{ edge: `spine-${stop.key}-to-${stops[index + 1].key}`, from: stop.key, to: stops[index + 1].key, relation: 'continuum' }} scripted={scripted} reduced={reduced} delay={0.08 + index * 0.2} duration={0.5} stroke={`url(#${ids.gradient})`} strokeWidth={3} strokeLinecap="round" pulse />
        </g>
      ))}
      {stops.map((stop, index) => <motion.g key={stop.x} className={`distance-stop semantic-node can-highlight ${stop.level}-stop`} data-node={stop.key} data-kind="epistemic-position" data-stage={index + 1} data-state={stop.level} data-interaction="highlight-position" initial={enter(scripted, reduced, { opacity: 0, scale: 0.86 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.12 + index * 0.13)} style={scripted ? undefined : { transformOrigin: `${stop.x}px 210px` }}><circle className="node-surface" cx={stop.x} cy="210" r={28 - index * 2} /><circle className="node-core" cx={stop.x} cy="210" r="11" fill={index === 0 ? 'var(--direct)' : index < 3 ? 'var(--paper)' : 'var(--reference)'} stroke="none" opacity="0.82" /><line className="node-tick" x1={stop.x} y1="238" x2={stop.x} y2="268" /><text x={stop.x} y="296" style={{ fontSize: 17 }}>{stop.label}</text><text x={stop.x} y="320" className="node-caption" style={{ fontSize: 13.5 }}>{stop.note}</text><StageMarker x={stop.x} y={150} stage={index + 1} /></motion.g>)}
      <text x="100" y="378" className="edge-label semantic-label direct-label" textAnchor="start">DISMINUYE LA PRESENTACIÓN DEL PARTICULAR</text>
      <g className="edge-group" data-sequence={4}>
        <Edge d="M100 393 H900" className="semantic-edge mediation-axis line-reference dashed" data={{ edge: 'mediation-increases', from: 'presentation', to: 'description', relation: 'increases' }} scripted={scripted} reduced={reduced} delay={0.75} duration={0.95} markerEnd={`url(#${ids.arrow})`} />
      </g>
      <text x="900" y="378" className="edge-label semantic-label reference-label" textAnchor="end">AUMENTA LA MEDIACIÓN DESCRIPTIVA</text>
      <TraceReadout x={500} y={461} text={tracing.readout} />
    </svg>
  );
}

export function AnchorReach({ compact = false, arrival = 'self' }: VisualProps) {
  const reduced = useReducedMotion();
  const ids = useDiagramIds('reach');
  const narrow = useNarrowLayout(compact);
  const tracing = useDiagramTracing();
  const scripted = arrival === 'scripted';
  const outerNodes = [[846, 88], [916, 128], [938, 212], [914, 298], [846, 340], [788, 296], [772, 136]];
  if (narrow) return <MobileFlow className="anchor-reach" ids={ids} reduced={reduced} scripted={scripted} title="Del anclaje directo al alcance de la referencia" description="El conocimiento directo aporta particulares y algunos universales directamente aprehendidos; las verdades de enlace los relacionan y las descripciones amplían el alcance hacia un mundo no presentado." kicker="LA TESIS DEL CAPÍTULO EN TRES MOVIMIENTOS" steps={[
    { title: 'Directo · términos', caption: 'particulares + universales aprehendidos', kind: 'direct', state: 'presented' },
    { title: 'Verdades de enlace', caption: 'relacionan los términos', kind: 'truth', state: 'relational' },
    { title: 'Referencia · alcance', caption: 'mundo no presentado', kind: 'reference', state: 'mediated' },
  ]} conclusion="Anclaje + verdades + descripción = alcance" conclusionStage={4} />;
  return (
    <svg ref={tracing.svgRef} {...tracing.handlers} className={`concept-visual semantic-diagram anchor-reach mobile-stack-ready${compact ? ' is-compact' : ''}`} data-diagram="anchor-reach" data-layout="responsive-fit" data-flow="anchored-expansion" data-motion={motionState(reduced)} data-arrival={arrival} style={responsiveStyle(compact)} viewBox="0 0 1000 500" role="img" aria-labelledby={`${ids.title} ${ids.description}`} focusable="false">
      <title id={ids.title}>Del anclaje directo al alcance de la referencia</title>
      <desc id={ids.description}>El conocimiento directo aporta particulares y algunos universales directamente aprehendidos. Las verdades de enlace relacionan esos términos. Las descripciones permiten referirse a objetos nunca presentados y amplían el conocimiento más allá de la experiencia privada.</desc>
      <defs><marker id={ids.arrow} markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" refX="14" refY="8" orient="auto"><path d="M0 0 L14 8 L0 16 Z" fill="var(--reference)" /></marker><linearGradient id={ids.gradient} gradientUnits="userSpaceOnUse" x1="188" y1="0" x2="812" y2="0"><stop offset="0" stopColor="var(--direct)" /><stop offset="0.5" stopColor="var(--paper)" /><stop offset="1" stopColor="var(--reference)" /></linearGradient><radialGradient id={ids.glow}><stop offset="0" stopColor="var(--reference)" stopOpacity="0.18" /><stop offset="1" stopColor="var(--reference)" stopOpacity="0" /></radialGradient></defs>
      <g className="edge-group" data-sequence={1}>
        <Edge d="M188 242 C292 76 431 76 500 242" className="semantic-edge expansion-edge" data={{ edge: 'direct-to-truths', from: 'direct-terms', to: 'linking-truths', relation: 'enables-reference' }} scripted={scripted} reduced={reduced} delay={0.12} duration={0.7} stroke={`url(#${ids.gradient})`} strokeWidth={3} strokeLinecap="round" pulse />
        <text x="310" y="111" className="edge-label semantic-label direct-label" data-role="edge-label">APORTA TÉRMINOS</text>
      </g>
      <g className="edge-group" data-sequence={2}>
        <Edge d="M500 242 C562 391 681 406 780 287" className="semantic-edge expansion-edge" data={{ edge: 'truths-to-reference', from: 'linking-truths', to: 'reference-reach', relation: 'enables-reference' }} scripted={scripted} reduced={reduced} delay={0.7} duration={0.7} stroke={`url(#${ids.gradient})`} strokeWidth={3} strokeLinecap="round" markerEnd={`url(#${ids.arrow})`} pulse />
        <text x="690" y="373" className="edge-label semantic-label reference-label" data-role="edge-label">COMPONE DESCRIPCIONES</text>
      </g>
      <motion.g className="reach-pole semantic-node can-highlight direct-pole" data-node="direct-terms" data-kind="direct" data-stage="1" data-state="presented" data-contains="particulars some-universals" data-interaction="trace-expansion" initial={enter(scripted, reduced, { opacity: 0, scale: 0.9 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.02, 0.7)} style={scripted ? undefined : { transformOrigin: '140px 242px' }}><circle className="node-surface" cx="140" cy="242" r="92" /><circle className="node-detail" cx="140" cy="242" r="73" fill="none" stroke="var(--direct)" strokeOpacity="0.2" /><StageMarker x={74} y={176} stage={1} /><path className="node-glyph" d="M140 178 V258 M114 222 H166 M112 258 C118 282 162 282 168 258" fill="none" stroke="var(--direct)" strokeWidth="3" strokeLinecap="round" /><text x="140" y="310">Directo</text><text x="140" y="356" className="node-caption" style={{ fontSize: 13 }}>particulares + algunos</text><text x="140" y="373" className="node-caption" style={{ fontSize: 13 }}>universales aprehendidos</text></motion.g>
      <motion.g className="reach-center semantic-node can-highlight" data-node="linking-truths" data-kind="truth" data-stage="2" data-state="relational" data-interaction="trace-input-output" initial={enter(scripted, reduced, { opacity: 0, y: -10 })} animate={{ opacity: 1, y: 0 }} transition={reveal(reduced, 0.36, 0.7)}><circle className="node-surface" cx="500" cy="242" r="82" /><circle className="node-detail" cx="500" cy="242" r="65" fill="none" stroke="var(--paper)" strokeOpacity="0.12" /><StageMarker x={442} y={184} stage={2} /><text x="500" y="236">Verdades</text><TruthRule x={500} y={244} /><text x="500" y="264" className="node-caption">de enlace · puente</text></motion.g>
      <circle className="diagram-layer layer-reference-field" data-layer="reference-world" cx="860" cy="242" r="144" fill={`url(#${ids.glow})`} />{outerNodes.map(([x, y], index) => <motion.g key={`${x}-${y}`} className="semantic-detail world-fragment" data-detail={`world-fragment-${index + 1}`} data-label="mundo no presentado" data-kind="unpresented-object" data-state="reached-by-description" data-stage="4" style={{ '--i': index } as CSSProperties} initial={enter(scripted, reduced, { opacity: 0 })} animate={{ opacity: 1 }} transition={reveal(reduced, 0.62 + index * 0.06)}><Edge d={`M860 242 L${x} ${y}`} className="semantic-edge radial-edge" data={{ edge: `reference-to-world-${index + 1}`, from: 'reference-reach', to: `world-fragment-${index + 1}`, relation: 'extends-to' }} scripted={scripted} reduced={reduced} delay={0.62 + index * 0.06} duration={0.4} stroke="var(--reference)" strokeWidth={1.5} /><circle className="detail-point" cx={x} cy={y} r={index % 2 === 0 ? 7 : 5} fill="var(--reference)" opacity={0.52 + index * 0.04} /></motion.g>)}
      <motion.g className="reach-pole semantic-node can-highlight reference-pole" data-node="reference-reach" data-kind="reference" data-stage="3" data-state="mediated" data-interaction="highlight-world" initial={enter(scripted, reduced, { opacity: 0, scale: 0.9 })} animate={{ opacity: 1, scale: 1 }} transition={reveal(reduced, 0.64, 0.72)} style={scripted ? undefined : { transformOrigin: '860px 242px' }}><circle className="node-surface" cx="860" cy="242" r="92" /><circle className="node-detail" cx="860" cy="242" r="73" fill="none" stroke="var(--reference)" strokeOpacity="0.23" /><StageMarker x={794} y={176} stage={3} /><text x="860" y="236">Referencia</text><text x="860" y="262" className="node-caption">alcance</text><text x="860" y="284" className="node-caption" style={{ fontSize: 13 }}>mundo no presentado</text></motion.g>
      <g className="semantic-node conclusion-node" data-node="expanded-world" data-label="un mundo mayor que la experiencia privada" data-kind="conclusion" data-stage="4" data-state="resolved"><rect className="node-surface" x="180" y="419" width="640" height="48" rx="22" /><StageMarker x={200} y={443} stage={4} r={9} /><text x="510" y="450" className="reach-conclusion" data-role="conclusion">Anclaje + verdades + descripción = un mundo mayor que la experiencia privada</text></g>
      <TraceReadout x={500} y={493} text={tracing.readout} />
    </svg>
  );
}
