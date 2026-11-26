import Konva from 'konva';
import { add, distance, lerp, reflectAcross, sub, type Point } from '../lib/geometry';

export const sweepDelta = (change: number) => Math.atan2(Math.sin(change), Math.cos(change));
export const turnSteps = (travel: number, count: number) =>
  Math.sign(travel) * Math.round(Math.abs(travel) * count / (2 * Math.PI));

export function drawTurnDial(layer: Konva.Container, a: Point, count: number, steps: number) {
  const selected = ((steps % count) + count) % count;
    layer.add(new Konva.Circle({ ...a, radius: 52, fill: 'rgba(250,247,239,.92)', listening: false }));
    for (let i = 0; i < count; i++) {
      layer.add(new Konva.Wedge({
        ...a, radius: 52, angle: 360 / count, rotation: -(i + .5) * 360 / count,
        fill: i === selected ? 'rgba(118,99,175,.28)' : 'rgba(118,99,175,.06)',
        stroke: '#7663af', strokeWidth: 1, listening: false,
      }));
    }
    const angle = steps * 2 * Math.PI / count;
    layer.add(new Konva.Arrow({
      points: [a.x, a.y, a.x + 45 * Math.cos(angle), a.y - 45 * Math.sin(angle)],
      stroke: '#59428e', fill: '#59428e', strokeWidth: 2, pointerLength: 7, pointerWidth: 7, listening: false,
    }));
    layer.add(new Konva.Text({
      x: a.x - 30, y: a.y + 55, width: 60, align: 'center',
      text: `${steps > 0 ? '+' : ''}${steps * 360 / count}°`, fill: '#59428e', fontSize: 14, listening: false,
    }));
}

export function drawAxisDial(layer: Konva.Container, a: Point, directions: number[], selected?: number) {
  for (const angle of directions) {
    const active = selected !== undefined && Math.abs(Math.sin((angle - selected) / 2)) < .005;
    const width = Math.min(90, 360 / directions.length);
    layer.add(new Konva.Wedge({ ...a, radius: 51, angle: width, rotation: -angle * 180 / Math.PI - width/2,
      fill: active ? 'rgba(200,163,94,.25)' : 'rgba(110,127,174,.075)',
      stroke: '#b8b6bc', strokeWidth: .8, listening: false }));
  }
}

export const axisComponent = (p: Point, angle: number) => p.x*Math.cos(angle)+p.y*Math.sin(angle);
export function glideFrame(anchor: Point, angle: number, amount: number, progress: number) {
  const slide = amount*Math.max(0,progress*2-1);
  const direction = {x:slide*Math.cos(angle),y:slide*Math.sin(angle)};
  return (point: Point) => {
    const flipped = reflectAcross(point,anchor,angle);
    return progress < .5 ? lerp(point,flipped,progress*2) : add(flipped,direction);
  };
}

export function translationBetween(from: Point, to: Point) {
  return distance(from,to) > 1e-7 ? sub(to,from) : undefined;
}

export function drawTranslationPreview(layer: Konva.Container, start: Point, end?: Point) {
  layer.add(new Konva.Circle({ ...start,radius:15,stroke:'#bf9149',strokeWidth:2,dash:[5,3],listening:false }));
  if (end && distance(start,end) > 1) layer.add(new Konva.Arrow({
    points:[start.x,start.y,end.x,end.y],stroke:'#b58b4d',fill:'#b58b4d',strokeWidth:1.7,
    pointerLength:7,pointerWidth:7,dash:[5,5],listening:false,
  }));
}

import type { LatticeTool } from '../lib/geometry';
export type GestureAxis = { point: Point; angle: number; amounts?: number[] };
type Move = { tool: LatticeTool; point: Point; angle: number; amount: number };
type Policy = {
  unit: () => number;
  yUp: boolean;
  clickTranslation?: boolean;
  translationNode: (point: Point, endpoint: boolean) => Point | undefined;
  rotationCenter: (point: Point) => { point: Point; count: number } | undefined;
  axisAnchor: (point: Point, kind: 'reflect'|'glide') => { point: Point; angles: number[] } | undefined;
  chooseAxis: (point: Point, angle: number, kind: 'reflect'|'glide') => GestureAxis | undefined;
  glideAmount: (axis: GestureAxis, start: Point, end: Point) => number | undefined;
  cursorStep: (point: Point, dx: number, dy: number, fast: boolean, tool: LatticeTool) => Point;
  commit: (move: Move) => void;
  hint: (message: string) => void;
  changed: () => void;
};

/** Shared pointer, touch and keyboard state machine. A scene supplies only geometry and move policy. */
export function createLatticeGestures(policy: Policy) {
  const state: {
    tool: LatticeTool;
    cursor: Point;
    translation?: Point;
    dial?: {point: Point; count: number; steps: number};
    aim?: {point: Point; angles: number[]; selected?: GestureAxis};
    glide?: GestureAxis;
    preview?: [Point,Point];
  } = {tool:'translate',cursor:{x:0,y:0}};
  const sign = policy.yUp ? 1 : -1;
  const pixels = (a: Point,b: Point) => distance(a,b)*policy.unit();
  function clear() {
    state.translation = state.dial = state.aim = state.glide = state.preview = undefined;
    policy.changed();
  }
  function finish(tool: LatticeTool,point: Point,angle = 0,amount = 0) {
    clear();
    policy.commit({tool,point,angle,amount});
  }
  function translateTo(p: Point) {
    const target = policy.translationNode(p,true);
    if (!target) {
      clear();
      policy.hint('Start and end on translation lattice nodes.');
      return;
    }
    const delta = state.translation && translationBetween(state.translation,target);
    if (delta) finish('translate',delta);
  }
  function openDial(p: Point) {
    const center = policy.rotationCenter(p);
    if (!center) { policy.hint('Choose a highlighted rotation center.'); return false; }
    state.dial = { ...center, steps:0 };
    policy.hint('Drag around the dial. With a keyboard, use Left and Right, then Enter.');
    policy.changed();
    return true;
  }
  function commitTurn() {
    const dial = state.dial;
    if (dial?.steps) finish('rotate',dial.point,sign*dial.steps*2*Math.PI/dial.count);
  }
  function startAim(p: Point) {
    const tool = state.tool === 'reflect' ? 'reflect' : 'glide';
    const anchor = policy.axisAnchor(p,tool);
    if (!anchor?.angles.length) { policy.hint('Start on a highlighted line and drag along it.'); return false; }
    state.aim = { ...anchor, selected: policy.chooseAxis(anchor.point,anchor.angles[0],tool) };
    policy.changed();
    return true;
  }
  function aimAt(p: Point, commit = false) {
    const aim = state.aim;
    if (!aim) return;
    const kind = state.tool === 'reflect' ? 'reflect' : 'glide';
    const delta = sub(p,aim.point);
    const choice = policy.chooseAxis(aim.point,Math.atan2(delta.y,delta.x),kind);
    if (pixels(p,aim.point) >= 1) aim.selected = choice;
    if (commit) {
      state.aim = undefined;
      if (!choice || pixels(p,aim.point) < 7) policy.hint('Start on a highlighted line and drag along it.');
      else if (kind === 'reflect') finish(kind,choice.point,choice.angle);
      else {
        state.glide = choice;
        policy.hint('Now drag along the line to choose the slide.');
      }
    }
    policy.changed();
  }
  function slideFrom(start: Point,end: Point) {
    const axis = state.glide!;
    const amount = policy.glideAmount(axis,start,end);
    state.preview = undefined;
    if (amount) finish('glide',axis.point,axis.angle,amount);
    else {
      policy.hint('Slide to a highlighted displacement on the line.');
      policy.changed();
    }
  }
  let gesture: { move: (p: Point) => void; end: (p: Point) => void } | undefined;
  function down(p: Point) {
    gesture = undefined;
    if (state.tool === 'translate') {
      const from = policy.translationNode(p,false);
      if (!from) { policy.hint('Start on a translation lattice node.'); return false; }
      state.translation = state.translation ?? from;
      state.preview = [state.translation,from];
      gesture = {
        move(q) { state.preview = [state.translation!,policy.translationNode(q,true) ?? state.translation!]; },
        end(q) {
          state.preview = undefined;
          translateTo(q);
          if (!policy.clickTranslation) state.translation = undefined;
        },
      };
    } else if (state.tool === 'rotate') {
      const radius = state.dial ? pixels(p,state.dial.point) : 0;
      const angleFrom = (q: Point,center: Point) => Math.atan2(sign*(q.y-center.y),q.x-center.x);
      let last = 0;
      if (state.dial && radius >= 8 && radius <= 65) last = angleFrom(p,state.dial.point);
      else if (!openDial(p)) return false;
      const dial = state.dial!;
      let travel = 0;
      function rotate(q: Point) {
        if (pixels(q,dial.point) < 8) return;
        const angle = angleFrom(q,dial.point);
        travel += sweepDelta(angle-last);
        last = angle;
        dial.steps = turnSteps(travel,dial.count);
      }
      gesture = {move:rotate,end(q) { rotate(q); commitTurn(); }};
    } else if (state.glide) {
      gesture = {move(q) { state.preview = [state.glide!.point,q]; },end(q) { slideFrom(p,q); }};
    } else {
      if (!startAim(p)) return false;
      gesture = {move:q=>aimAt(q),end:q=>aimAt(q,true)};
    }
    policy.changed();
    return true;
  }
  return {
    state,
    select(tool: LatticeTool) { state.tool = tool; gesture = undefined; clear(); },
    reset() { gesture = undefined; state.cursor = {x:0,y:0}; clear(); },
    cancel() { gesture = undefined; clear(); },
    down,
    move(p: Point) { gesture?.move(p); policy.changed(); },
    up(p: Point) {
      const pending = gesture;
      gesture = undefined;
      pending?.end(p);
      policy.changed();
    },
    key(event: KeyboardEvent) {
      const arrows: Record<string,[number,number]> = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      const direction = arrows[event.key];
      if (!direction && !['Escape','Enter',' '].includes(event.key)) return false;
      event.preventDefault();
      const p = state.cursor;
      if (event.key === 'Escape') { gesture = undefined; clear(); }
      else if (direction) {
        if (state.dial) state.dial.steps += direction[0] < 0 || direction[1] < 0 ? 1 : -1;
        else {
          state.cursor = policy.cursorStep(p,...direction,event.shiftKey,state.tool);
          if (state.aim) aimAt(state.cursor);
          if (state.glide) state.preview = [state.glide.point,state.cursor];
        }
      } else if (state.tool === 'translate') {
        if (state.translation) translateTo(p);
        else state.translation = policy.translationNode(p,false);
      } else if (state.tool === 'rotate') {
        if (state.dial) commitTurn();
        else openDial(p);
      } else if (state.glide) slideFrom(state.glide.point,p);
      else if (state.aim) aimAt(p,true);
      else startAim(p);
      policy.changed();
      return true;
    },
  };
}

export function drawLatticeGesture(layer: Konva.Container, state: ReturnType<typeof createLatticeGestures>['state'],
  screen: (point: Point) => Point, yUp: boolean) {
  const sign = yUp ? 1 : -1;
  if (state.translation) drawTranslationPreview(layer,screen(state.translation),screen(state.preview?.[1] ?? state.cursor));
  if (state.dial) drawTurnDial(layer,screen(state.dial.point),state.dial.count,state.dial.steps);
  const axis = state.glide ?? state.aim?.selected;
  if (state.aim) drawAxisDial(layer,screen(axis?.point ?? state.aim.point),state.aim.angles.map(a=>a*sign),
    axis === undefined ? undefined : axis.angle*sign);
  if (axis) {
    const p = screen(axis.point);
    const dx = 3000*Math.cos(axis.angle);
    const dy = -3000*sign*Math.sin(axis.angle);
    layer.add(new Konva.Line({points:[p.x-dx,p.y-dy,p.x+dx,p.y+dy],
      stroke:'#ad7b36',strokeWidth:2.5,dash:[10,7],listening:false}));
    layer.add(new Konva.Circle({...p,radius:5.5,fill:'#a46d32',listening:false}));
  }
  if (state.glide && state.preview) {
    const a = screen(state.preview[0]), b = screen(state.preview[1]);
    layer.add(new Konva.Arrow({points:[a.x,a.y,b.x,b.y],stroke:'#ad7b36',fill:'#ad7b36',listening:false}));
  }
}
