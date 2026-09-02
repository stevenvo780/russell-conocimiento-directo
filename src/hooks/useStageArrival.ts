import { useLayoutEffect, useRef } from 'react';
import { EASE, MOTION, cssEase, type MotionProfile } from '../motion';

/*
  Stage arrival for the diagrams.

  1. Roles. Every sequenced element of a `.slide-visual` is classified by its
     part in the current reveal step so CSS can address "what just arrived":

       .semantic-node[data-stage]      → data-stage-role = root | past | active | future
       .semantic-detail[data-stage]    → same (world fragments of the last slide)
       .edge-group                     → data-stage-role = past | active | future
                                          (an edge group without data-sequence
                                           leads into stage 1: sequence 0)

     Stage 0 is the root. Going forward, everything at or below the previous
     threshold is past, everything up to the new threshold is active. Going
     backward nothing arrives: the stage the cue now describes is active
     (bounded below by the highest threshold seen before it on this slide),
     and the rest is past. The root element carries data-arrival="scripted".

  2. Timeline (spatial and compact profiles only). The newly active stages are
     walked in order: the edge leading into a stage draws from its source
     (stroke-dashoffset), the nodes of that stage settle (8 px rise + 0.97 → 1),
     edges that start inside the stage draw afterwards, and dashed edges fade
     last because drawing them solid would misstate their uncertainty. Every
     animation is a Web Animation whose id starts with "arrival", uses
     fill: 'backwards' (so the element waits invisibly for its turn and hands
     control back to its inline/final styles when done) and is cancelled on
     the next threshold change or slide change, so a fast presenter never sees
     a stale settle. Durations, staggers and easings come from the MOTION
     table (the same values as the --m-* tokens).

     Under the reduced profile only the roles are assigned: opacity is then
     driven by the threshold CSS alone, instantly.
*/

export type StageRole = 'root' | 'past' | 'active' | 'future';

export type StageArrivalOptions = {
  slideId: string;
  threshold: number;
  /** Thresholds of the slide's stage plan, in order: bound the past when a stage is landed on backward. */
  stages?: readonly number[];
  profile: MotionProfile;
};

export const ARRIVAL_ANIMATION_PREFIX = 'arrival';

const NODE_SELECTOR = '.semantic-node[data-stage], .semantic-detail[data-stage]';
const GROUP_SELECTOR = '.edge-group';
const SHAPE_SELECTOR = '.semantic-edge';
/* Relation labels and pills that live inside an edge-group: they fade once the stroke has landed. */
const LABEL_SELECTOR = '.edge-label, .edge-pill';

function cancelArrivalAnimations(root: Element | null) {
  if (!root || typeof root.getAnimations !== 'function') return;
  for (const animation of root.getAnimations({ subtree: true })) {
    if (animation.id.startsWith(ARRIVAL_ANIMATION_PREFIX)) animation.cancel();
  }
}

function stageOf(element: Element) {
  const stage = Number(element.getAttribute('data-stage'));
  return Number.isFinite(stage) ? stage : null;
}

function sequenceOf(group: Element) {
  if (!group.hasAttribute('data-sequence')) return 0;
  const sequence = Number(group.getAttribute('data-sequence'));
  return Number.isFinite(sequence) ? sequence : 0;
}

export function assignStageRoles(root: Element, threshold: number, pastBoundary: number) {
  root.setAttribute('data-arrival', 'scripted');
  for (const node of root.querySelectorAll<Element>(NODE_SELECTOR)) {
    const stage = stageOf(node) ?? 0;
    const role: StageRole = stage === 0
      ? 'root'
      : stage <= pastBoundary
        ? 'past'
        : stage <= threshold
          ? 'active'
          : 'future';
    node.setAttribute('data-stage-role', role);
  }
  for (const group of root.querySelectorAll<Element>(GROUP_SELECTOR)) {
    const sequence = sequenceOf(group);
    const role: StageRole = sequence < pastBoundary ? 'past' : sequence < threshold ? 'active' : 'future';
    group.setAttribute('data-stage-role', role);
  }
}

type Shape = SVGGeometryElement;

function isShape(element: Element): element is Shape {
  return typeof (element as Shape).getTotalLength === 'function';
}

function shapesOf(container: Element, ownOnly: boolean) {
  const shapes: Shape[] = [];
  for (const candidate of container.querySelectorAll<Element>(SHAPE_SELECTOR)) {
    if (!isShape(candidate)) continue;
    if (ownOnly && candidate.closest(GROUP_SELECTOR)) continue;
    shapes.push(candidate);
  }
  return shapes;
}

function isDashed(shape: Element) {
  return shape.classList.contains('dashed');
}

function pathUnit(shape: Shape) {
  if (shape.getAttribute('pathLength') === '1') return 1;
  try {
    return shape.getTotalLength();
  } catch {
    return 0;
  }
}

type Timing = { duration: number; delay: number; easing: string };

function fadeShape(shape: Shape, timing: Timing) {
  shape.animate([{ opacity: 0 }, { opacity: 1 }], {
    ...timing,
    id: `${ARRIVAL_ANIMATION_PREFIX}-edge-fade`,
    fill: 'backwards',
  });
}

function drawShape(shape: Shape, timing: Timing) {
  const unit = pathUnit(shape);
  if (isDashed(shape) || !unit) {
    fadeShape(shape, timing);
    return;
  }
  const dash = `${unit} ${unit}`;
  shape.animate(
    [
      { strokeDasharray: dash, strokeDashoffset: unit },
      { strokeDasharray: dash, strokeDashoffset: 0 },
    ],
    { ...timing, id: `${ARRIVAL_ANIMATION_PREFIX}-edge`, fill: 'backwards' },
  );
  // The arrowhead lands with the stroke instead of waiting at the target.
  const marker = getComputedStyle(shape).markerEnd;
  if (marker && marker !== 'none') {
    try {
      shape.animate(
        [
          { markerEnd: 'none', offset: 0 },
          { markerEnd: 'none', offset: 0.82 },
          { markerEnd: marker, offset: 1 },
        ],
        { ...timing, id: `${ARRIVAL_ANIMATION_PREFIX}-marker`, fill: 'backwards' },
      );
    } catch {
      // A browser that cannot animate marker-end simply shows the arrowhead from the start.
    }
  }
}

function fadeLabels(group: Element, timing: Timing) {
  for (const label of group.querySelectorAll<Element>(LABEL_SELECTOR)) {
    label.animate([{ opacity: 0 }, { opacity: 1 }], {
      ...timing,
      id: `${ARRIVAL_ANIMATION_PREFIX}-edge-label`,
      fill: 'backwards',
    });
  }
}

function settleNode(node: Element, timing: Timing, edgeTiming: Timing) {
  node.animate(
    [
      { opacity: 0, transform: 'translateY(8px) scale(0.97)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ],
    { ...timing, id: `${ARRIVAL_ANIMATION_PREFIX}-node`, fill: 'backwards' },
  );
  // Edges that live inside the node (a spoke from a hub) draw with it.
  for (const shape of shapesOf(node, true)) drawShape(shape, edgeTiming);
}

function sourceStageOf(root: Element, group: Element, stages: Map<string, number>) {
  const from = group.getAttribute('data-from') ?? group.querySelector('[data-from]')?.getAttribute('data-from');
  if (!from) return null;
  const stage = stages.get(from);
  if (stage !== undefined) return stage;
  const source = root.querySelector(`[data-node="${from}"], [data-detail="${from}"]`);
  return source ? stageOf(source) : null;
}

export function buildArrivalTimeline(root: Element, threshold: number, pastBoundary: number, profile: MotionProfile) {
  const tokens = MOTION[profile];
  const settleEase = cssEase(EASE.settle);
  const drawEase = cssEase(EASE.out);

  const stages = new Map<string, number>();
  const nodes: { element: Element; stage: number }[] = [];
  for (const element of root.querySelectorAll<Element>(NODE_SELECTOR)) {
    const stage = stageOf(element);
    if (stage === null) continue;
    nodes.push({ element, stage });
    const key = element.getAttribute('data-node') ?? element.getAttribute('data-detail');
    if (key) stages.set(key, stage);
  }
  const groups = Array.from(root.querySelectorAll<Element>(GROUP_SELECTOR)).map((element) => ({
    element,
    sequence: sequenceOf(element),
    sourceStage: sourceStageOf(root, element, stages),
    dashed: Array.from(element.querySelectorAll(SHAPE_SELECTOR)).some(isDashed),
  }));

  // When one keypress unlocks several stages the walk overlaps them (each advance
  // is shortened), so the last node is in place at presenter cadence.
  const firstStage = pastBoundary === 0 ? 0 : pastBoundary + 1;
  const pace = threshold - Math.max(firstStage, 1) >= 1 ? 0.55 : 1;
  const advance = (ms: number) => Math.round(ms * pace);
  let clock = 0;
  const drawGroup = (group: Element, delay: number) => {
    for (const shape of shapesOf(group, false)) drawShape(shape, { duration: tokens.edgeDraw, delay, easing: drawEase });
    fadeLabels(group, { duration: tokens.dS, delay: delay + Math.round(tokens.edgeDraw * 0.6), easing: drawEase });
  };
  const fadeGroup = (group: Element, delay: number) => {
    for (const shape of shapesOf(group, false)) fadeShape(shape, { duration: tokens.dS, delay, easing: drawEase });
    fadeLabels(group, { duration: tokens.dS, delay, easing: drawEase });
  };

  for (let stage = firstStage; stage <= threshold; stage += 1) {
    const stageNodes = nodes.filter((node) => node.stage === stage);
    const incoming = stage === 0 ? [] : groups.filter((group) => group.sequence === stage - 1);
    const before = incoming.filter((group) => !group.dashed && group.sourceStage !== null && group.sourceStage < stage);
    const after = incoming.filter((group) => !group.dashed && (group.sourceStage === null || group.sourceStage >= stage));
    const dashed = incoming.filter((group) => group.dashed);

    if (before.length) {
      before.forEach((group) => drawGroup(group.element, clock));
      // The node starts settling while the stroke is still landing.
      clock += advance(tokens.edgeDraw * 0.5);
    }
    stageNodes.forEach((node, order) => {
      const delay = clock + advance(order * tokens.nodeStagger);
      settleNode(
        node.element,
        { duration: tokens.dM, delay, easing: settleEase },
        { duration: tokens.edgeDraw, delay: delay + Math.round(tokens.dXs / 2), easing: drawEase },
      );
    });
    if (stageNodes.length) clock += advance((stageNodes.length - 1) * tokens.nodeStagger + tokens.dM * 0.4);
    if (after.length) {
      after.forEach((group) => drawGroup(group.element, clock));
      clock += advance(tokens.edgeDraw * 0.7);
    }
    if (dashed.length) {
      dashed.forEach((group) => fadeGroup(group.element, clock));
      clock += advance(tokens.dS * 0.6);
    }
  }
  return clock;
}

function arrivedBackward(root: Element) {
  return root.closest('.deck-shell')?.getAttribute('data-deck-travel') === 'backward';
}

/** The highest plan threshold strictly below `threshold` — the past boundary of that stage. */
function highestBelow(stages: readonly number[], threshold: number) {
  return stages.reduce((highest, stage) => (stage < threshold && stage > highest ? stage : highest), 0);
}

export function useStageArrival(element: HTMLElement | null, { slideId, threshold, stages = [], profile }: StageArrivalOptions) {
  const previousThreshold = useRef(0);
  const lastSlideId = useRef<string | null>(null);
  const lastElement = useRef<HTMLElement | null>(null);
  const stageList = stages.join(',');

  // The visual is handed over as state (callback ref), so this effect runs on the
  // very commit that mounts it — also when it mounts after the outgoing slide has
  // finished exiting, when nothing else re-renders the deck.
  useLayoutEffect(() => {
    if (slideId !== lastSlideId.current) {
      cancelArrivalAnimations(lastElement.current);
      previousThreshold.current = 0;
      lastSlideId.current = slideId;
    }
    if (element !== lastElement.current) {
      cancelArrivalAnimations(lastElement.current);
      previousThreshold.current = 0;
      lastElement.current = element;
    }
    if (!element) return;
    // The ref may still hold the outgoing slide's visual while the next slide renders: leave it be.
    const owner = element.getAttribute('data-slide');
    if (owner && owner !== slideId) return;

    const previous = previousThreshold.current;
    const forward = threshold > previous;
    // A slide re-entered from the one after it mounts complete: the stage the cue
    // describes is active, everything before it is past, and there is no ceremony.
    const landing = previous === 0 && threshold > 0 && arrivedBackward(element);
    const planStages = stageList ? stageList.split(',').map(Number) : [];
    const pastBoundary = forward && !landing ? previous : highestBelow(planStages, threshold);
    cancelArrivalAnimations(element);
    assignStageRoles(element, threshold, pastBoundary);
    previousThreshold.current = threshold;

    if (profile === 'reduced' || !forward || landing) return;
    if (typeof element.animate !== 'function') return;
    buildArrivalTimeline(element, threshold, pastBoundary, profile);
  }, [element, slideId, threshold, profile, stageList]);
}
