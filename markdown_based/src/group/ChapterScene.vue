<script setup lang="ts">
import Konva from 'konva';
import { computed, ref, watch } from 'vue';
import { angle, arrow, distance, label, polar, useCanvas, useMotion, type Point } from './canvas';
import { sceneMath } from './sceneMath';
import { additiveHomomorphism, factorialRemainders, modularInverse, residue } from '../lib/clock';
import { allMoves, cornerImage, elements, inverse, mirrorSubgroup, partition, product, rotations, sameSet } from '../lib/square-group';

const props = defineProps<{ id: string; step: number; demo: boolean }>();
const green = '#376858';
const ink = '#283b37';
const colors = ['#b64b45', '#376fb0', '#a87910'];
const n = ref(props.id === 'clock-units' ? 8 : 12);
const values = ref([props.id === "clock-addition" && props.step === 0 ? 0 : 5, 8, 2]);
const arcs = ref([2, 3, 2]);
const turns = ref(0);
const identityHour = ref(0);
const selected = ref(props.id === 'clock-subgroup' ? 8 : props.id === 'clock-subgroup-diagram' ? 4 : 0);
const secondOperand = ref(1);
const selectedOutput = ref<number>();
const modulusOut = ref(6);
const multiplier = ref(props.id === 'clock-units' ? 3 : 1);
const hint = ref(0);
const emit = defineEmits<{ solution: [] }>();
const matrix = ref(false);
const row = ref(2);
const column = ref(0);
const squarePose = ref(0);
const squareFromPose = ref(0);
const selectedSquareMove = ref<number | undefined>(1);
const commuteA = ref(1);
const commuteB = ref(4);
const commuteSlot = ref<'A' | 'B'>('A');
const commuteFrom = ref<[number, number]>([product(1, 4), product(4, 1)]);
const commuteMoves = ref<[number, number]>([0, 0]);
const commuteAnimating = ref(false);
const collapsed = ref(false);
const denominator = ref(props.id === 'correspondence-square' ? 0 : 6);
const subgroup = ref(1);
const notice = ref('');
const focused = ref('');
const { progress, play, stop } = useMotion();
const animation = ref<'demo' | 'turn' | 'square' | 'collapse'>();
const demoCancelled = ref(false);
const starting = ref(0);
const mapSquare = computed(() => props.id.endsWith('-square'));
const correspondence = computed(() => props.id.startsWith('correspondence'));
const mapScene = computed(() => correspondence.value || props.id.startsWith('first-isomorphism') || props.id === 'homomorphisms-generators');
const prompt: Record<string, string> = {
  'clock-associativity': 'Drag a colored endpoint on either clock.',
  'clock-identity': 'Set the hour hand, then drag the dot below to add full turns.',
  'clock-inverses': 'Select a residue to highlight its additive inverse.',
  'clock-commutativity': 'Drag either colored endpoint. Compare the two orders.',
  'clock-units': 'Choose a multiplier. Do any arrows share a destination?',
  'clock-subgroup': 'Try adding 8, then 5. Count the hops until the first return to zero.',
  subgroups: 'Answer three questions to unlock Compose and Inverse.',
  cosets: 'Choose a subgroup to see how its cosets partition the eight moves.',
  'normal-subgroups': 'Compare both partitions on the same eight moves.',
  'quotient-groups': 'Each coset becomes one element of the quotient group.',
  'clock-subgroup-diagram': 'Choose a clock step or a subgroup. Change the modulus to redraw the diagram.',
  'correspondence-clock': 'Select a region to highlight its matching subgroup on both sides.',
  'correspondence-square': 'Select a region to highlight its matching subgroup on both sides.',
  'lagrange-theorem': 'Choose a subgroup and count the moves in each coset.',
};

type End = { move?: (p: Point) => void; end: (p: Point) => void; cancel?: () => void };
type Control = { name: string; x: number; y: number; w: number; h: number; run: () => void; pressed?: boolean; focusKey?: string };
const buttons = ref<Control[]>([]);
const live = ref('');
let controls: Control[] = [];
let interact: ((p: Point) => End | undefined) | undefined;
let readout = '';
function control(layer: Konva.Container, name: string, x: number, y: number, run: () => void, w = 120, h = 36) {
  controls.push({ name, x: x - w / 2, y: y - h / 2, w, h, run });
  layer.add(new Konva.Rect({ x: x - w / 2, y: y - h / 2, width: w, height: h, cornerRadius: 8,
    fill: '#20302f', stroke: focused.value === name ? '#f2c783' : '#638474', strokeWidth: 2 }));
  label(layer, { x, y }, name, { size: 14, width: w, fill: '#e8f1ee' });
}
function formula(layer: Konva.Container, value: string, x = 400, y = 395, size = 21) {
  sceneMath(layer, value, x, y, size);
  readout += value + '  ';
}
function dial(layer: Konva.Container, c: Point, r: number, modulus: number, value?: number, active = -1) {
  layer.add(new Konva.Circle({ ...c, radius: r, fill: '#f7faf4', stroke: green, strokeWidth: r > 40 ? 2 : 1 }));
  for (let i = 0; i < modulus; i++) {
    const p = tick(c, r * .82, modulus, i);
    if (r > 45) label(layer, p, String(i), { size: r > 100 ? 15 : 12, width: 25, fill: i === active ? '#a45a12' : ink });
    else layer.add(new Konva.Circle({ ...p, radius: 1.2, fill: green }));
  }
  if (value !== undefined) arrow(layer, c, tick(c, r * .65, modulus, value), green, 1);
}
const tick = (c: Point, r: number, m: number, i: number) => polar(c, r, i * Math.PI * 2 / m - Math.PI / 2);
const at = (p: Point, c: Point, m: number) => residue(Math.round((angle(p, c) + Math.PI / 2) * m / (2 * Math.PI)), m);
function arc(layer: Konva.Container, c: Point, r: number, start: number, length: number, color: string, handle = false) {
  const points = Array.from({ length: 49 }, (_, i) => tick(c, r, 12, start + length * i / 48));
  layer.add(new Konva.Line({ points: points.flatMap(p => [p.x, p.y]), stroke: color, strokeWidth: 5, lineCap: 'round' }));
  if (handle) layer.add(new Konva.Circle({ ...points[48], radius: 7, fill: color, stroke: '#fff', strokeWidth: 2 }));
}
function changeValue(i: number, value: number) {
  values.value[i] = residue(value, 12);
}
function animate(kind: NonNullable<typeof animation.value>) {
  animation.value = kind;
  play(kind === 'demo' ? 3600 : kind === 'turn' ? 1150 * Math.abs(turns.value - starting.value) : kind === 'square' ? 1850 : 740);
}
watch(() => props.demo, enabled => {
  demoCancelled.value = false;
  if (enabled && props.id === 'clock-addition') animate('demo');
  else if (animation.value === 'demo') { stop(); animation.value = undefined; }
});
function cancelDemo() {
  if (animation.value === 'demo') { stop(); animation.value = undefined; demoCancelled.value = true; }
}
function addition(layer: Konva.Container) {
  const single = props.id === 'clock-addition' && props.step === 0;
  const centers = single ? [{ x: 400, y: 240 }] : [145, 400, 655].map(x => ({ x, y: 220 }));
  const r = single ? 130 : 95;
  const active = props.demo && !demoCancelled.value && animation.value === 'demo' && progress.value < 1;
  const t = progress.value;
  const demoIndex = single || t < .5 ? 0 : 1;
  const phase = single ? t : (t * 2) % 1;
  const preview = (i: number) => active && i === demoIndex ?
    (single ? 10 : values.value[i]) + Math.max(0, Math.min(1, (phase - .2) / .6)) * (single ? 2 : 3) : values.value[i];
  if (single) {
    dial(layer, centers[0], r, 12, preview(0));
    const current = residue(Math.round(preview(0)), 12);
    formula(layer, '\\mathbb{Z}/12\\mathbb{Z}', 400, 70, 21);
    label(layer, { x: 400, y: 398 }, 'Current residue class', { width: 280, size: 16, fill: ink });
    formula(layer, '[' + current + ']_{12}', 400, 418, 28);
    readout = 'Clock position ' + current + '. Residue class [' + current + '] modulo 12.';
  }
  else {
    dial(layer, centers[0], r, 12, preview(0));
    dial(layer, centers[1], r, 12, preview(1));
    dial(layer, centers[2], r, 12, preview(0) + preview(1));
    label(layer, { x: 274, y: 220 }, '+', { size: 28, fill: ink });
    label(layer, { x: 527, y: 220 }, '=', { size: 28, fill: ink });
  }
  if (active) {
    const p = tick(centers[demoIndex], r * .65 + Math.max(0, .2 - phase) * 150, 12, preview(demoIndex));
    label(layer, p, phase > .2 && phase < .8 ? '●' : '↖', { size: 24, fill: '#a26026' });
  }
  const [a, b] = values.value;
  if (!single) formula(layer, a + '+' + b + '\\equiv ' + residue(a + b, 12) + '\\pmod{12}', 400, 355);
  interact = p => {
    const i = centers.findIndex(c => distance(p, c) < r + 10);
    if (i < 0 || i > 1) return;
    const move = (q: Point) => changeValue(i, at(q, centers[i], 12));
    return { move, end: move };
  };
  for (let i = 0; !single && i < 2; i++) {
    control(layer, 'Hand ' + (i + 1) + ' −', single ? 335 : 250 + i * 270, 475, () => changeValue(i, values.value[i] - 1), 110);
    control(layer, 'Hand ' + (i + 1) + ' +', single ? 465 : 370 + i * 270, 475, () => changeValue(i, values.value[i] + 1), 110);
  }
  if (single) {
    const moveHand = (delta: number) => changeValue(0, values.value[0] + delta);
    controls.push(
      { name: 'Hand back one tick', x: -10, y: -10, w: 0, h: 0, run: () => moveHand(-1) },
      { name: 'Hand forward one tick', x: -10, y: -10, w: 0, h: 0, run: () => moveHand(1) },
    );
  }
  if (active) control(layer, 'Skip demo', 705, 475, cancelDemo);
}
function commutative(layer: Konva.Container) {
  const centers = [{ x: 220, y: 205 }, { x: 580, y: 205 }];
  const [a, b] = values.value;
  const handles: { center: Point; point: Point; index: number; start: number }[] = [];
  centers.forEach((center, side) => {
    const order = side ? [1, 0] : [0, 1];
    let start = 0;
    dial(layer, center, 126, 12, a + b);
    order.forEach((index, position) => {
      const r = 85 - position * 19;
      arc(layer, center, r, start, values.value[index], colors[index], true);
      handles.push({ center, point: tick(center, r, 12, start + values.value[index]), index, start });
      start += values.value[index];
    });
    formula(layer, (side ? b + '+' + a : a + '+' + b) + '\\equiv ' + residue(a + b, 12) + '\\pmod{12}', center.x, 355);
  });
  interact = p => {
    const handle = handles.find(h => distance(p, h.point) < 17);
    if (!handle) return;
    const move = (q: Point) => changeValue(handle.index, at(q, handle.center, 12) - handle.start);
    return { move, end: move };
  };
  for (let i = 0; i < 2; i++) {
    for (const sign of [-1, 1]) control(layer, ['Red', 'Blue'][i] + (sign < 0 ? ' −' : ' +'),
      180 + i * 290 + (sign + 1) * 58, 475, () => changeValue(i, values.value[i] + sign), 98);
  }
}
function associative(layer: Konva.Container) {
  const centers = [{ x: 220, y: 250 }, { x: 580, y: 250 }];
  const dialRadius = 106;
  const radii = [73, 63, 53];
  const [a, b, c] = arcs.value;
  const starts = [0, a, a + b];
  const ends = [a, a + b, a + b + c];
  const [red, blue, yellow] = ['a', 'b', 'c'].map((letter, i) =>
    `\\textcolor{${colors[i]}}{${letter}}`);
  sceneMath(layer, `(${red}+${blue})+${yellow}=${red}+(${blue}+${yellow})`, 400, 56, 28);
  readout = 'Associativity: (a + b) + c equals a + (b + c). ';
  for (const [i, center] of centers.entries()) {
    dial(layer, center, dialRadius, 12, a + b + c);
    arcs.value.forEach((length, k) => arc(layer, center, radii[k], starts[k], length, colors[k], true));
    arc(layer, center, 44, i ? a : 0, i ? b + c : a + b, i ? '#368064' : '#8753a0');
    arc(layer, center, 34, 0, a + b + c, '#895d40');
    const [redValue, blueValue, yellowValue] = [a, b, c].map((value, k) =>
      `\\textcolor{${colors[k]}}{${value}}`);
    const total = residue(a + b + c, 12);
    sceneMath(layer, (i ? `${redValue}+(${blueValue}+${yellowValue})` : `(${redValue}+${blueValue})+${yellowValue}`) +
      '\\equiv ' + total, center.x, 360, 24);
    readout += (i ? `${a} + (${b} + ${c})` : `(${a} + ${b}) + ${c}`) + ' is congruent to ' + total + ' modulo 12. ';
  }
  interact = p => {
    const center = centers.find(c => distance(p, c) < 120);
    if (!center) return;
    const i = ends.findIndex((end, k) => distance(p, tick(center, radii[k], 12, end)) < 17);
    if (i === -1) return;
    const move = (q: Point) => { arcs.value[i] = residue(at(q, center, 12) - starts[i], 12); };
    return { move, end: move };
  };
  for (let i = 0; i < 3; i++) {
    for (const sign of [-1, 1]) control(layer, ['Red', 'Blue', 'Yellow'][i] + (sign < 0 ? ' −' : ' +'),
      140 + i * 205 + (sign + 1) * 46, 475, () => { arcs.value[i] = residue(arcs.value[i] + sign, 12); }, 86);
  }
}
function identity(layer: Konva.Container) {
  const c = { x: 400, y: 196 };
  const moved = animation.value === 'turn' ? starting.value + (turns.value - starting.value) * progress.value : turns.value;
  dial(layer, c, 125, 12, identityHour.value + moved * 12);
  label(layer, { x: 400, y: 342 }, 'Starting hour: ' + identityHour.value + '   ·   Added hours: ' + (turns.value * 12),
    { width: 500, size: 18, fill: ink });
  layer.add(new Konva.Line({ points: [130, 375, 670, 375], stroke: green, strokeWidth: 2 }));
  for (let i = -3; i <= 3; i++) {
    const x = 400 + i * 90;
    layer.add(new Konva.Circle({ x, y: 375, radius: i === turns.value ? 10 : 4, fill: green }));
    label(layer, { x, y: 403 }, String(i * 12), { fill: ink });
  }
  function wind(to: number) {
    if (turns.value === to || to < -3 || to > 3) return;
    starting.value = moved;
    turns.value = to;
    animate('turn');
  }
  function setHour(hour: number) {
    stop();
    animation.value = undefined;
    starting.value = turns.value = 0;
    identityHour.value = residue(hour, 12);
  }
  interact = p => {
    const distanceFromCenter = distance(p,c);
    if (distanceFromCenter >= 12 && distanceFromCenter <= 135) {
      const move = (q: Point) => { if (distance(q,c)>=12) setHour(at(q,c,12)); };
      return { move, end: move };
    }
    if (p.y > 350 && p.y < 420)
      return { end: q => wind(Math.max(-3, Math.min(3, Math.round((q.x - 400) / 90)))) };
  };
  control(layer, 'One turn left', 300, 472, () => wind(turns.value - 1), 145);
  control(layer, 'One turn right', 500, 472, () => wind(turns.value + 1), 145);
  controls.push(
    { name: 'Hand back one tick', x: -10, y: -10, w: 0, h: 0, run: () => setHour(identityHour.value - 1) },
    { name: 'Hand forward one tick', x: -10, y: -10, w: 0, h: 0, run: () => setHour(identityHour.value + 1) },
  );
  readout = 'Starting hour: ' + identityHour.value + '. Added hours: ' + (turns.value * 12) +
    '. After any whole number of turns, the hand reads ' + identityHour.value + '.';
}
function inverseOrSubgroup(layer: Konva.Container) {
  const m = n.value;
  const inverse = props.id === 'clock-inverses';
  const c = { x: 400, y: inverse ? 222 : 206 };
  const r = 143;
  dial(layer, c, r, m, undefined, selected.value);
  if (inverse) for (let i = 0; i < m; i++) {
    const j = residue(-i, m);
    if (i > j) continue;
    const p = tick(c, r * .67, m, i);
    const q = tick(c, r * .67, m, j);
    const color = i === selected.value || j === selected.value ? '#a26026' : '#86a699';
    layer.add(i === j ? new Konva.Circle({ ...p, radius: 7, stroke: color, strokeWidth: 2 }) :
      new Konva.Line({ points: [p.x, p.y, q.x, q.y], stroke: color, strokeWidth: 3 }));
  }
  const cycle: number[] = [];
  if (!inverse) {
    for (let a = 0; !cycle.includes(a); a = residue(a + selected.value, m)) cycle.push(a);
    if (cycle.length > 1) cycle.forEach((a, i) => arrow(layer, tick(c, r * .69, m, a), tick(c, r * .69, m, cycle[(i + 1) % cycle.length]), green));
  }
  formula(layer, inverse ? selected.value + '+' + residue(-selected.value, m) + '\\equiv 0\\pmod{' + m + '}' :
    '\\langle ' + selected.value + '\\rangle=\\{' + [...cycle].sort((a,b) => a-b).join(',') + '\\}', 400, 385);
  if (!inverse) {
    const order=cycle.length;
    const d=m/order;
    label(layer,{x:400,y:410},'After '+order+' hops: '+order+' × '+selected.value+' ticks = '+(order*selected.value/m)+' whole laps',{size:16,width:760});
    label(layer,{x:400,y:441},'Order = '+m+' ÷ gcd('+m+', '+selected.value+') = '+m+' ÷ '+d+' = '+order,{size:16,width:760});
    label(layer,{x:400,y:475},d===1?'The step and modulus are coprime. Every position is visited.':'The visited positions form the subgroup generated by '+selected.value+'.',{size:15,width:760});
    readout='Adding '+selected.value+' modulo '+m+' visits '+cycle.join(', ')+' and returns to zero after '+order+' hops.';
    for (let a=0;a<m;a++) {
      const p=tick(c,r*.82,m,a);
      if (target('Add '+a,p.x,p.y,29,29,()=>selected.value=a,a===selected.value))
        layer.add(new Konva.Circle({...p,radius:14,stroke:'#a87910',strokeWidth:2}));
    }
    return;
  }
  const setModulus = (value: number) => {
    n.value = Math.min(24, Math.max(2, value));
    selected.value %= n.value;
  };
  label(layer, { x: 400, y: 437 }, 'Modulus ' + m, { size: 14, fill: ink });
  layer.add(new Konva.Line({ points: [310, 465, 490, 465], stroke: green, strokeWidth: 2 }));
  layer.add(new Konva.Circle({ x: 310 + (m - 2) * 180 / 22, y: 465, radius: 8, fill: green }));
  interact = p => {
    if (p.y >= 449 && p.y <= 482 && p.x >= 295 && p.x <= 505) {
      const move = (q: Point) => setModulus(2 + Math.round((q.x - 310) * 22 / 180));
      return { move, end: move };
    }
    if (distance(p, c) < r + 12) return { end: q => { selected.value = at(q, c, m); } };
  };
  control(layer, 'Modulus −', 205, 477, () => { n.value = Math.max(2, m - 1); selected.value %= n.value; });
  controls.push({ name: 'Next residue', x: -10, y: -10, w: 0, h: 0, run: () => { selected.value = (selected.value + 1) % m; } });
  control(layer, 'Modulus +', 595, 477, () => { n.value = Math.min(24, m + 1); });
}
function mapping(layer: Konva.Container, c: Point, r: number, m: number, a: number) {
  dial(layer, c, r, m);
  for (let i = 0; i < m; i++) {
    const p = tick(c, r * .66, m, i);
    const target = residue(a * i, m);
    const q = tick(c, r * .66, m, target);
    if (target === i) layer.add(new Konva.Circle({ ...p, radius: r > 50 ? 6 : 2, stroke: '#a26026', strokeWidth: 1 }));
    else arrow(layer, p, q, green, .52);
  }
}
function units(layer: Konva.Container) {
  if (matrix.value) {
    for (let j = 0; j < 3 && row.value + j <= 20; j++) {
      const m = row.value + j;
      label(layer, { x: 48, y: 113 + j * 115 }, 'n = ' + m, { fill: ink, size: 14, width: 90 });
      for (let i = column.value; i < Math.min(m, column.value + 7); i++) {
        const x = 116 + (i - column.value) * 100;
        mapping(layer, { x, y: 110 + j * 115 }, 37, m, i);
        label(layer, { x, y: 155 + j * 115 }, '×' + i, { fill: ink, size: 13 });
      }
    }
    const move = (dy: number, dx: number) => {
      row.value = Math.max(2, Math.min(18, row.value + dy));
      column.value = Math.max(0, Math.min(13, column.value + dx));
    };
    control(layer, 'Rows ↑', 110, 440, () => move(-1, 0), 92);
    control(layer, 'Rows ↓', 210, 440, () => move(1, 0), 92);
    control(layer, 'Columns ←', 590, 440, () => move(0, -1), 100);
    control(layer, 'Columns →', 700, 440, () => move(0, 1), 100);
    interact = p => ({ end: q => { if (distance(p, q) > 20) move(Math.sign(p.y - q.y), Math.sign(p.x - q.x)); } });
  } else {
    mapping(layer, { x: 400, y: 215 }, 146, n.value, multiplier.value);
    const unit = modularInverse(multiplier.value, n.value);
    formula(layer, 'x\\mapsto ' + multiplier.value + 'x\\pmod{' + n.value + '}', 400, 370);
    label(layer, { x: 400, y: 415 }, unit === undefined ? 'Some destinations repeat' : 'One arrow arrives at each residue', { width: 500, fill: ink });
    control(layer, 'Modulus −', 95, 470, () => { n.value = Math.max(2, n.value - 1); multiplier.value %= n.value; });
    control(layer, 'Modulus +', 230, 470, () => { n.value = Math.min(20, n.value + 1); });
    control(layer, 'Multiplier −', 570, 470, () => { multiplier.value = residue(multiplier.value - 1, n.value); });
    control(layer, 'Multiplier +', 705, 470, () => { multiplier.value = residue(multiplier.value + 1, n.value); });
    if (props.step) formula(layer, '\\varphi(' + n.value + ')=' + Array.from({ length: n.value }, (_, i) => i).filter(i => modularInverse(i, n.value) !== undefined).length, 630, 55, 17);
  }
  control(layer, matrix.value ? 'Single clock' : 'View multiplication maps', 400, 470, () => { matrix.value = !matrix.value; }, 200);
}
function wilson(layer: Konva.Container) {
  formula(layer, '(p-1)!\\equiv -1\\pmod{p}', 400, 25, 34);
  label(layer, { x: 400, y: 86 }, 'For every prime p. Can you explain why?', { width: 650, size: 22, fill: ink });
  if (hint.value === 1) {
    label(layer, { x: 400, y: 136 }, 'Think about the small cases: p = 2, 3, and 5.', { width: 720, size: 20, fill: ink });
    [2, 3, 5].forEach((prime, i) => {
      const x = 170 + i * 230;
      const result = factorialRemainders(prime)[prime - 1];
      dial(layer, { x, y: 266 }, 77, prime, result);
      formula(layer, (prime - 1) + '!\\equiv ' + result + '\\pmod{' + prime + '}', x, 363);
    });
  } else if (hint.value === 2) {
    label(layer, { x: 400, y: 127 }, 'Modulo 7: connect each nonzero residue to its inverse.', { width: 740, size: 19, fill: ink });
    const c = { x: 400, y: 278 };
    const prime = 7;
    dial(layer, c, 105, prime);
    for (let a = 1; a < prime; a++) {
      const b = modularInverse(a, prime)!;
      if (a > b) continue;
      const p = tick(c, 68, prime, a);
      if (a === b) {
        layer.add(new Konva.Circle({ ...p, radius: 9, stroke: '#a26026', strokeWidth: 3 }));
        continue;
      }
      const q = tick(c, 68, prime, b);
      layer.add(new Konva.Line({ points: [p.x, p.y, q.x, q.y], stroke: green, strokeWidth: 3 }));
      for (const endpoint of [p,q]) layer.add(new Konva.Circle({ ...endpoint, radius: 4, fill: green }));
    }
    const minusOne = tick(c, 130, prime, 6);
    label(layer, minusOne, '−1', { size: 19, fill: '#a26026' });
    label(layer, { x: 400, y: 415 }, 'Pairs: 2 with 4 and 3 with 5. Why do 1 and −1 loop to themselves?',
      { width: 780, size: 17, fill: ink });
  }
  readout = 'Wilson’s theorem: p minus one factorial is congruent to minus one modulo p for every prime p. Can you explain why?' +
    (hint.value === 1 ? ' Think about primes 2, 3, and 5.' : hint.value === 2 ?
      ' Modulo 7 the pairs are 2 with 4 and 3 with 5. Both 1 and 6 pair with themselves. Six represents minus one.' : '');
  const text = ['Reveal a hint', 'Reveal the second hint', 'Reveal the solution'][hint.value];
  control(layer, text, 400, 475, () => { if (hint.value < 2) hint.value++; else emit('solution'); }, 195);
}
function squareTransform(point: Point, move: number, progress: number): Point {
  const t = Math.max(0, Math.min(1, progress));
  if (move < 4) {
    const turn = move * Math.PI / 2 * t;
    return { x: point.x * Math.cos(turn) - point.y * Math.sin(turn),
      y: point.x * Math.sin(turn) + point.y * Math.cos(turn) };
  }
  const axisAngle = Math.PI / 2 + (move % 4) * Math.PI / 4;
  const axis = { x: Math.cos(axisAngle), y: Math.sin(axisAngle) };
  const along = point.x * axis.x + point.y * axis.y;
  const depth = Math.cos(Math.PI * t);
  return { x: along * axis.x + (point.x - along * axis.x) * depth,
    y: along * axis.y + (point.y - along * axis.y) * depth };
}
function square(layer: Konva.Container, c: Point, r: number, pose: number,
  motion?: { move: number; progress: number }) {
  const locations = [[1,-1],[-1,-1],[-1,1],[1,1]];
  const pointAt = (corner: number) => {
    const [x,y] = locations[corner];
    const point = { x: x * r, y: y * r };
    return motion ? squareTransform(point, motion.move, motion.progress) : point;
  };
  const outline = locations.map((_, corner) => pointAt(corner));
  const reflecting = motion && motion.move >= 4;
  const turnPhase = motion ? Math.sin(Math.PI * motion.progress) : 0;
  const axisAngle = reflecting ? Math.PI / 2 + (motion.move % 4) * Math.PI / 4 : 0;
  const axis = { x: Math.cos(axisAngle), y: Math.sin(axisAngle) };
  const normal = { x: -axis.y, y: axis.x };
  layer.add(new Konva.Line({
    points: outline.flatMap(point => [c.x + point.x, c.y + point.y]), closed: true,
    fill: '#f7faf4', stroke: green, strokeWidth: 2, lineJoin: 'round',
    shadowColor: '#20302f', shadowBlur: reflecting ? 12 : 0, shadowOpacity: reflecting ? .24 : 0,
    shadowOffsetX: reflecting ? normal.x * turnPhase * 13 : 0,
    shadowOffsetY: reflecting ? normal.y * turnPhase * 13 : 0,
  }));
  if (reflecting) {
    const half = r * 1.42;
    layer.add(new Konva.Line({ points: [c.x - axis.x * half, c.y - axis.y * half,
      c.x + axis.x * half, c.y + axis.y * half], stroke: '#a87910', strokeWidth: 2,
      dash: [6, 5], opacity: .72 * turnPhase }));
  }
  const shades = [...colors, '#397d66'];
  for (let i = 0; i < 4; i++) {
    const point = pointAt(cornerImage(pose,i));
    layer.add(new Konva.Circle({ x: c.x + point.x * .72, y: c.y + point.y * .72,
      radius: Math.min(12, r / 5), fill: shades[i], stroke: '#fff', strokeWidth: r > 40 ? 1 : .5 }));
  }
}
function squareScenes(layer: Konva.Container) {
  if (props.id === 'square-noncommutativity') {
    const compact = layout.value.compact;
    const ab = product(commuteA.value, commuteB.value);
    const ba = product(commuteB.value, commuteA.value);
    const t = commuteAnimating.value ? progress.value : 1;
    const moving = commuteAnimating.value && t < 1;
    const centers = compact ? [{ x: 105, y: 126 }, { x: 285, y: 126 }] : [{ x: 130, y: 238 }, { x: 300, y: 238 }];
    const radius = compact ? 38 : 63;
    square(layer, centers[0], radius, moving ? commuteFrom.value[0] : ab,
      moving ? { move: commuteMoves.value[0], progress: t } : undefined);
    square(layer, centers[1], radius, moving ? commuteFrom.value[1] : ba,
      moving ? { move: commuteMoves.value[1], progress: t } : undefined);

    if (compact) {
      pairSlot(layer, 'A', 105, 34, commuteA.value, commuteSlot.value === 'A', 142, 30);
      pairSlot(layer, 'B', 285, 34, commuteB.value, commuteSlot.value === 'B', 142, 30);
      label(layer, { x: centers[0].x, y: 72 }, 'AB (B first)', { width: 166, size: 15, fill: ink });
      label(layer, { x: centers[1].x, y: 72 }, 'BA (A first)', { width: 166, size: 15, fill: ink });
      label(layer, { x: centers[0].x, y: 176 }, 'AB = ' + elements[ab], { width: 150, size: 17, fill: ink });
      label(layer, { x: centers[1].x, y: 176 }, 'BA = ' + elements[ba], { width: 150, size: 17, fill: ink });
      relationBadge(layer, ab === ba, 195, 210, compact);
      label(layer, { x: 195, y: 238 }, 'D₄ previews of identity', { width: 370, size: 17, fill: ink });
    } else {
      pairSlot(layer, 'A', 540, 96, commuteA.value, commuteSlot.value === 'A', 96, 32);
      pairSlot(layer, 'B', 674, 96, commuteB.value, commuteSlot.value === 'B', 96, 32);
      label(layer, { x: centers[0].x, y: 142 }, 'AB (apply B, then A)', { width: 188, size: 16, fill: ink });
      label(layer, { x: centers[1].x, y: 142 }, 'BA (apply A, then B)', { width: 188, size: 16, fill: ink });
      label(layer, { x: centers[0].x, y: 316 }, 'AB = ' + elements[ab], { width: 160, size: 18, fill: ink });
      label(layer, { x: centers[1].x, y: 316 }, 'BA = ' + elements[ba], { width: 160, size: 18, fill: ink });
      relationBadge(layer, ab === ba, 215, 365, compact);
      label(layer, { x: 600, y: 56 }, 'D₄ previews of identity', { width: 380, size: 20, fill: ink });
    }

    for (const move of allMoves) {
      const x = compact ? 48 + (move % 4) * 98 : 452 + (move % 4) * 94;
      const row = Math.floor(move / 4);
      const top = compact ? 260 + row * 94 : 130 + row * 154;
      const width = 84;
      const height = compact ? 86 : 110;
      const isA = commuteA.value === move;
      const isB = commuteB.value === move;
      const roles = [isA ? 'A' : '', isB ? 'B' : ''].filter(Boolean).join(' and ');
      const name = elements[move] + ' identity preview; ' + (roles ? 'assigned to ' + roles : 'assign to ' + commuteSlot.value);
      controls.push({ name, x: x - width / 2, y: top, w: width, h: height,
        run: () => chooseCommutativityElement(move), pressed: isA || isB, focusKey: 'commute-tile-' + move });
      const outline = isA && isB ? '#8753a0' : isA ? colors[0] : isB ? colors[1] : '#91aa99';
      layer.add(new Konva.Rect({ x: x - width / 2, y: top, width, height, cornerRadius: 10,
        fill: isA || isB ? '#f5ead2' : '#f7faf4', stroke: focused.value === 'commute-tile-' + move ? '#a87910' : outline,
        strokeWidth: isA || isB || focused.value === 'commute-tile-' + move ? 3 : 1.5 }));
      square(layer, { x, y: top + (compact ? 29 : 37) }, compact ? 18 : 23, move);
      label(layer, { x, y: top + (compact ? 69 : 86) }, elements[move],
        { width: width - 4, size: compact ? 14 : 17, fill: ink });
      if (isA) roleBadge(layer, x - 25, top + 12, 'A', colors[0]);
      if (isB) roleBadge(layer, x + 25, top + 12, 'B', colors[1]);
    }
    label(layer, { x: compact ? 195 : 400, y: compact ? 478 : 454 },
      compact ? 'Rotations commute; rotations and reflections\ngenerally do not.' :
        'Rotations commute; rotations and reflections generally do not.',
      { width: compact ? 370 : 780, size: compact ? 13 : 18, fill: ink });
    const relation = ab === ba ? 'A and B commute: AB equals BA.' : 'A and B do not commute: AB differs from BA.';
    readout = 'A is ' + elements[commuteA.value] + '; B is ' + elements[commuteB.value] + '. ' +
      'AB means apply B first, then A, giving ' + elements[ab] + '. ' +
      'BA means apply A first, then B, giving ' + elements[ba] + '. ' + relation + ' ' +
      'Rotations commute with one another; rotations and reflections generally do not. ' +
      'Choose an A or B selector, then select an identity preview.';
    return;
  }
  const compact = layout.value.compact;
  const c = compact ? { x: 195, y: 136 } : { x: 190, y: 270 };
  const replay = animation.value === 'square' ? progress.value : 1;
  const moving = replay < 1 && selectedSquareMove.value !== undefined;
  square(layer, c, compact ? 61 : 108, moving ? squareFromPose.value : squarePose.value,
    moving ? { move: selectedSquareMove.value!, progress: replay } : undefined);
  label(layer, { x: c.x, y: compact ? 42 : 106 }, 'Current: ' + elements[squarePose.value],
    { width: 300, size: compact ? 17 : 20, fill: ink });
  if (compact) {
    layer.add(new Konva.Line({ points: [16, 211, 374, 211], stroke: '#b4c6b8', strokeWidth: 1 }));
    label(layer, { x: 195, y: 226 }, 'D₄ transformations', { width: 370, size: 18, fill: ink });
  } else {
    layer.add(new Konva.Line({ points: [390, 118, 390, 421], stroke: '#b4c6b8', strokeWidth: 1 }));
    label(layer, { x: 590, y: 88 }, 'D₄ transformations', { width: 380, size: 20, fill: ink });
  }
  for (const move of allMoves) {
    const x = compact ? 48 + (move % 4) * 98 : 451 + (move % 4) * 94;
    const row = Math.floor(move / 4);
    const top = compact ? 236 + row * 116 : row === 0 ? 126 : 280;
    const preview = product(move, squarePose.value);
    const active = selectedSquareMove.value === move;
    const name = elements[move] + ' — apply; preview ' + elements[preview];
    const width = compact ? 88 : 84;
    const height = compact ? 106 : 112;
    controls.push({ name, x: x - width / 2, y: top, w: width, h: height,
      run: () => applySquareSymmetry(move), pressed: active, focusKey: 'square-move-' + move });
    layer.add(new Konva.Rect({ x: x - width / 2, y: top, width, height, cornerRadius: 10,
      fill: active ? '#f5ead2' : '#f7faf4', stroke: active ? '#a87910' : '#91aa99',
      strokeWidth: active ? 3 : focused.value === 'square-move-' + move ? 3 : 1.5 }));
    square(layer, { x, y: top + (compact ? 35 : 38) }, 23, preview);
    label(layer, { x, y: top + (compact ? 80 : 87) }, elements[move],
      { width: width - 4, size: compact ? 15 : 17, fill: ink });
  }
  const selected = selectedSquareMove.value;
  readout = 'Current square: ' + elements[squarePose.value] + '. ' +
    (selected === undefined ? '' : 'Selected action: ' + elements[selected] + '. Preview result: ' +
      elements[product(selected, squarePose.value)] + '.');
}
function applySquareSymmetry(move: number) {
  if (animation.value === 'square' && progress.value < 1) {
    stop();
    progress.value = 1;
  }
  squareFromPose.value = squarePose.value;
  squarePose.value = product(move, squarePose.value);
  selectedSquareMove.value = move;
  animation.value = 'square';
  play(1120);
}
function pairSlot(layer: Konva.Container, slot: 'A' | 'B', x: number, y: number, move: number,
  active: boolean, width: number, height: number) {
  const name = 'Choose ' + slot + '; current value ' + elements[move];
  controls.push({ name, x: x - width / 2, y: y - height / 2, w: width, h: height,
    run: () => { commuteSlot.value = slot; }, pressed: active, focusKey: 'commute-slot-' + slot });
  layer.add(new Konva.Rect({ x: x - width / 2, y: y - height / 2, width, height, cornerRadius: 8,
    fill: active ? '#f5ead2' : '#20302f', stroke: active ? '#a87910' : '#638474', strokeWidth: active ? 2.5 : 1.5 }));
  label(layer, { x, y }, slot + ' = ' + elements[move],
    { width: width - 4, size: 15, fill: active ? ink : '#e8f1ee' });
}
function roleBadge(layer: Konva.Container, x: number, y: number, role: 'A' | 'B', color: string) {
  layer.add(new Konva.Circle({ x, y, radius: 10, fill: color, stroke: '#fff', strokeWidth: 1.5 }));
  label(layer, { x, y }, role, { width: 20, size: 11, fill: '#fff' });
}
function relationBadge(layer: Konva.Container, commute: boolean, x: number, y: number, compact: boolean) {
  const width = compact ? 190 : 270;
  const height = compact ? 30 : 40;
  layer.add(new Konva.Rect({ x: x - width / 2, y: y - height / 2, width, height, cornerRadius: 10,
    fill: commute ? '#e7f0e8' : '#f5ead2', stroke: commute ? green : '#a87910', strokeWidth: 2 }));
  label(layer, { x, y }, commute ? 'AB = BA' : 'AB ≠ BA',
    { width: width - 8, size: compact ? 19 : 23, fill: commute ? green : '#704e09' });
}
function chooseCommutativityElement(move: number) {
  if (commuteAnimating.value && progress.value < 1) {
    stop();
    progress.value = 1;
  }
  const oldA = commuteA.value;
  const oldB = commuteB.value;
  const nextA = commuteSlot.value === 'A' ? move : oldA;
  const nextB = commuteSlot.value === 'B' ? move : oldB;
  if (nextA === oldA && nextB === oldB) return;

  const oldAB = product(oldA, oldB);
  const oldBA = product(oldB, oldA);
  const nextAB = product(nextA, nextB);
  const nextBA = product(nextB, nextA);
  commuteFrom.value = [oldAB, oldBA];
  commuteMoves.value = [product(nextAB, inverse(oldAB)), product(nextBA, inverse(oldBA))];
  commuteA.value = nextA;
  commuteB.value = nextB;
  animation.value = 'square';
  commuteAnimating.value = true;
  play(900);
}
function bead(layer: Konva.Container, x: number, y: number, text: string, color = green) {
  layer.add(new Konva.Circle({ x, y, radius: 17, stroke: color, fill: '#f7faf4', strokeWidth: 2 }));
  label(layer, { x,y }, text, { width: 36, size: 15, fill: ink });
}
function cyclicSubgroups(m: number) {
  return Array.from({ length: m }, (_,i) => i+1).filter(d => m%d === 0)
    .map(d => Array.from({ length: m/d }, (_, i) => i*d));
}
function correspondencePanels(layer: Konva.Container, blocks: number[][], groups: number[][],
  chosen: number[], normal: number[], square: boolean) {
  const cols = Math.min(4, blocks.length);
  const t = animation.value === 'collapse' ? (collapsed.value ? progress.value : 1 - progress.value) : Number(collapsed.value);
  for (const side of [0, 1]) {
    const left = 32 + side * 392;
    label(layer, { x: left + 172, y: 97 }, side ? 'Quotient group' : 'Original group', { width: 300, fill: ink });
    layer.add(new Konva.Rect({ x: left, y: 122, width: 344, height: 249, cornerRadius: 12, stroke: green }));
    blocks.forEach((block, i) => {
      const x = left + 43 + (i % cols) * 86;
      const y = 154 + Math.floor(i / cols) * 59;
      const included = block.every(g => chosen.includes(g));
      const alternate = groups.find(g => !sameSet(g, normal) && !g.every(a => chosen.includes(a)) &&
        !chosen.every(a => g.includes(a)));
      const amber = alternate && block.every(g => alternate.includes(g));
      const isNormal = sameSet(block, normal);
      layer.add(new Konva.Rect({ x:x-40, y:y-23, width:80, height:46, stroke:'#87a49a', dash:[4,3], cornerRadius:8 }));
      if (included) layer.add(new Konva.Rect({ x:x-39, y:y-23, width:78, height:46, stroke:'#376fb0', strokeWidth:2, cornerRadius:8 }));
      if (amber) layer.add(new Konva.Rect({ x:x-35, y:y-19, width:70, height:38, stroke:'#a26026', strokeWidth:2, cornerRadius:8 }));
      if (side && t >= .98) bead(layer, x,y,square ? (i ? elements[block[0]]+'N' : 'N') : String(i), isNormal ? green : '#668277');
      else block.forEach((g,j) => {
        const columns = Math.min(4, block.length);
        const rows = Math.ceil(block.length / columns);
        const shrink = side ? 1-t : 1;
        const middleColumn = (columns - 1) / 2;
        const middleRow = (rows - 1) / 2;
        const dx = j % columns - middleColumn;
        const dy = Math.floor(j / columns) - middleRow;
        const px = x + dx * 18 * shrink;
        const py = y + dy * 10 * shrink;
        label(layer,{x:px,y:py},square?elements[g]:String(g),{width:22,size:10,fill:isNormal?green:ink});
      });
      const previous = interact;
      interact = p => Math.abs(p.x-x)<40 && Math.abs(p.y-y)<23 ?
        { end: () => {
          const matches = groups.filter(g => block.every(a => g.includes(a)));
          const next = matches[(matches.findIndex(g => sameSet(g, chosen)) + 1) % matches.length];
          subgroup.value = groups.indexOf(next);
        } } : previous?.(p);
    });
  }
  formula(layer,'K\\longmapsto K/N,\\qquad L\\longmapsto \\pi^{-1}(L)',400,395);
  control(layer,collapsed.value?'Expand':'Collapse',400,477,() => { collapsed.value = !collapsed.value; animate('collapse'); });
  control(layer,'Next subgroup',700,477,() => subgroup.value++,132);
}
function maps(layer: Konva.Container) {
  const square = mapSquare.value;
  const source = square ? allMoves : Array.from({ length: n.value }, (_, i) => i);
  const options = square ? [[0,2],[0,1,2,3],[0],[0,2,4,6],[0,2,5,7],allMoves] : cyclicSubgroups(n.value);
  const normal = correspondence.value ? (square ? options[denominator.value % options.length] :
    options.find(list => list[1] === denominator.value) ?? options.at(-1)!) : undefined;
  const output = square ? 2 : modulusOut.value;
  const hom = additiveHomomorphism(n.value, output, multiplier.value);
  const map = (x: number) => square ? Number(x >= 4) : hom?.apply(x) ?? 0;
  const blocks = normal ? square ? partition(normal) : Array.from({ length: n.value / normal.length }, (_,a) => normal.map(x => x + a)) :
    !square && hom ? hom.fibers : Array.from({ length: output }, (_, y) => source.filter(x => map(x) === y));
  const allSubgroups = normal ? options.filter(candidate => normal.every(x => candidate.includes(x))) : [];
  const chosen = allSubgroups[subgroup.value % (allSubgroups.length || 1)];
  if (normal) {
    correspondencePanels(layer, blocks, allSubgroups, chosen, normal, square);
    control(layer, 'Denominator', 555, 477, () => {
      if (square) denominator.value++;
      else {
        const next = options[(options.findIndex(s => sameSet(s, normal)) + 1) % options.length];
        denominator.value = next[1] ?? n.value;
      }
      subgroup.value = 1;
      collapsed.value = false;
    });
    if (!square) control(layer, 'Modulus +', 102, 477, () => {
      n.value = n.value >= 16 ? 2 : n.value + 1;
      denominator.value = n.value;
      subgroup.value = 1;
      collapsed.value = false;
    });
    return;
  }
  const c1 = { x: 207, y: 157 }, c2 = { x: 590, y: 157 };
  if (!square) {
    dial(layer,c1,86,n.value,selected.value % n.value);
    dial(layer,c2,86,normal ? blocks.length : output,normal ? Math.max(0, blocks.findIndex(b=>b.includes(selected.value))) : selectedOutput.value ?? map(selected.value));
    arrow(layer, { x: 310,y:157 }, { x: 486,y:157 }, green);
    interact = p => distance(p,c1) < 91 ? { end: q => { selected.value = at(q,c1,n.value); selectedOutput.value = undefined; } } :
      distance(p,c2) < 91 ? { end: q => { const y = at(q,c2,blocks.length); selectedOutput.value = y; const list = blocks[y]; if (list?.length) selected.value = list[0]; } } : undefined;
  } else {
    formula(layer, normal ? 'D_4\\longrightarrow D_4/N' : 'D_4\\longrightarrow \\mathbb{Z}/2\\mathbb{Z}', 400, 114);
  }
  if (props.id === 'homomorphisms-generators') {
    formula(layer,'f(1)=' + multiplier.value + ',\\quad f(' + selected.value + ')=' + map(selected.value), 400, 286);
    const b = secondOperand.value % n.value;
    formula(layer,'f(' + selected.value + '+' + b + ')=' + map(residue(selected.value+b,n.value)) + '\\equiv ' + map(selected.value) + '+' + map(b) + '\\pmod{' + output + '}',400,348);
    control(layer, 'Second operand', 400, 477, () => secondOperand.value++ , 145);
  } else {
    const progressValue = animation.value === 'collapse' ? progress.value : 1;
    const t = collapsed.value ? progressValue : 1-progressValue;
    const columns = Math.min(6, blocks.length);
    for (const [i, block] of blocks.entries()) {
      const cx = 400 + ((i % columns) - (columns - 1) / 2) * (700 / columns);
      const cy = (square ? 194 : 263) + Math.floor(i / columns) * 62;
      const width = 700 / columns - 7;
      const active = selectedOutput.value === undefined ? block.includes(selected.value) : selectedOutput.value === i;
      const inside = chosen && block.length && block.every(x => chosen.includes(x));
      layer.add(new Konva.Rect({ x: cx-width/2, y: cy-23, width, height: 53, cornerRadius: 9,
        stroke: active ? '#a26026' : inside ? '#376fb0' : '#87a49a', strokeWidth: inside || active ? 3 : 1, dash: [4,3] }));
      if (!block.length) label(layer,{x:cx,y:cy+4},'∅',{fill:ink});
      else if (t >= .98) bead(layer,cx,cy+4,normal && square ? (i ? elements[block[0]]+'N' : 'N') : String(i));
      else block.forEach((g,j) => {
        const mid = (block.length - 1) / 2;
        const offset = j - mid;
        const dx = offset * Math.min(36, (width - 18) / block.length);
        const radius = Math.max(5, Math.min(14, (width - 14) / (2 * block.length)));
        const x = cx + dx * (1-t);
        layer.add(new Konva.Circle({ x, y:cy+4, radius, fill:'#f7faf4',stroke:active?'#a26026':green }));
        label(layer,{x,y:cy+4},square?elements[g]:String(g),{size:Math.min(12,radius),width:28,fill:ink});
      });
      if (block.length) {
        const previous = interact;
        interact = p => Math.abs(p.x-cx) < width/2 && Math.abs(p.y-cy) < 27 ?
          { end: () => { selected.value = block[0]; selectedOutput.value = i; } } : previous?.(p);
      }
    }
    formula(layer, normal ? 'K\\longmapsto K/N' : 'G/\\ker f\\cong \\operatorname{im} f',400,399);
    if (selectedOutput.value !== undefined && !blocks[selectedOutput.value]?.length) {
      label(layer, { x: 400, y: 440 }, 'Not in the image', { width: 220, fill: ink });
    }
    const names = (group: number[]) => group.map(x => square ? elements[x] : x).join(', ');
    readout += 'Kernel: ' + names(blocks[0]) + '. Image: ' +
      blocks.flatMap((fiber, y) => fiber.length ? [y] : []).join(', ') + '.';
    control(layer, collapsed.value ? 'Expand' : 'Collapse',400,477,() => { collapsed.value = !collapsed.value; animate('collapse'); });
  }
  control(layer,'Next element',100,477,() => { selected.value=(selected.value+1)%source.length; selectedOutput.value = undefined; });
  if (!square) {
    control(layer,'Change clock sizes',260,477,() => {
      const old = n.value;
      n.value = modulusOut.value;
      modulusOut.value = old;
      multiplier.value = n.value === 6 ? 2 : 1;
      selected.value %= n.value;
      selectedOutput.value = undefined;
      collapsed.value = false;
    },150);
    control(layer,'Generator image',675,477,() => {
      for (let delta=1;delta<=output;delta++) {
        const candidate=residue(multiplier.value+delta,output);
        if (residue(n.value*candidate,output)===0) { multiplier.value=candidate; break; }
      }
      selectedOutput.value = undefined;
      collapsed.value=false;
    },145);
  }
}
// Keep the row start separate from the item offset through the Vue build.
function centeredItem(center: number, index: number, count: number, spacing: number) {
  const start = center - spacing * (count - 1) / 2;
  return start + index * spacing;
}

function diagramLabel(layer: Konva.Container, point: Point, value: string, options: Parameters<typeof label>[3] = {}) {
  label(layer, point, value, { fill: '#000', ...options });
}

const moveName = (move: number) => move === 7 ? 'sr' : elements[move];
const squareSubgroups = [
  [{ name: 'All square symmetries', moves: allMoves }],
  [
    { name: 'Rotations', moves: rotations },
    { name: 'Axial mirrors · Klein four', moves: [0, 2, 4, 6] },
    { name: 'Diagonal mirrors · Klein four', moves: [0, 2, 5, 7] },
  ],
  [
    { name: 'Half-turn', moves: [0, 2] },
    { name: 'Horizontal mirror', moves: [0, 6] },
    { name: 'Vertical mirror', moves: mirrorSubgroup },
    { name: 'Diagonal ↘', moves: [0, 7] },
    { name: 'Diagonal ↗', moves: [0, 5] },
  ],
  [{ name: 'Identity', moves: [0] }],
];
const questions = [
  { card: 'Rotations', moves: [1, 1], answer: 2 },
  { card: 'Rotations', moves: [1], answer: 3 },
  { card: 'Vertical mirror', moves: [4, 4], answer: 0 },
];
const questionIndex = ref(0);
const questionSolved = ref(false);
const activeCard = ref('Rotations');
const squareTool = ref<'compose' | 'inverse'>('compose');
const operands = ref<number[]>([]);
const resultMove = ref<number>();
const replayMoves = ref<number[]>([]);
const subgroupMessage = ref('');
const mirrorExample = ref(false);
const representatives = ref<[number, number]>([4, 4]);
const representativeSlot = ref<0 | 1>(0);
const priorProduct = ref<number>();
const quotientTokens = ref<number[]>([]);
const { progress: lessonMotion, play: playLessonMotion, stop: stopLessonMotion } = useMotion();

function target(name: string, x: number, y: number, w: number, h: number, run: () => void, pressed?: boolean) {
  const focusKey = name;
  controls.push({ name, x: x-w/2, y: y-h/2, w, h, run, focusKey, pressed });
  return focused.value === focusKey;
}
function panel(layer: Konva.Container, x: number, y: number, w: number, h: number, stroke = '#91aa9e', fill = '#f7faf4', dash?: number[]) {
  layer.add(new Konva.Rect({ x:x-w/2, y:y-h/2, width:w, height:h, cornerRadius:9, stroke, fill, strokeWidth:2, dash }));
}
function clockSubgroupDiagram(layer: Konva.Container) {
  const m = n.value;
  const c = { x:191, y:245 };
  const cycle: number[] = [];
  for (let a = 0; !cycle.includes(a); a = residue(a+selected.value,m)) cycle.push(a);
  dial(layer,c,140,m,undefined,selected.value);
  cycle.forEach((a,i) => {
    const start = tick(c,92,m,a);
    const end = tick(c,92,m,cycle[(i+1)%cycle.length]);
    if (cycle.length > 1) arrow(layer,start,end,green);
    layer.add(new Konva.Circle({ ...start, radius:4, fill:green }));
  });
  for (let a=0; a<m; a++) {
    const p = tick(c,119,m,a);
    if (target('Add '+a,p.x,p.y,23,23,()=>selected.value=a,a===selected.value))
      layer.add(new Konva.Circle({ ...p,radius:12,stroke:'#a87910',strokeWidth:2 }));
  }
  const groups = cyclicSubgroups(m);
  const depth = groups.map(() => 0);
  const edges: [number,number][] = [];
  groups.forEach((parent,i) => groups.forEach((child,j) => {
    if (i>=j || parent.length%child.length || groups.some(mid =>
      parent.length>mid.length && mid.length>child.length && parent.length%mid.length===0 && mid.length%child.length===0)) return;
    edges.push([i,j]); depth[j]=Math.max(depth[j],depth[i]+1);
  }));
  const points = groups.map((_,i) => {
    const row=depth.flatMap((d,j)=>d===depth[i]?[j]:[]);
    return {x: 572+(row.indexOf(i)-(row.length-1)/2)*132,y:104+depth[i]* (266/Math.max(...depth,1))};
  });
  edges.forEach(([i,j])=>layer.add(new Konva.Line({points:[points[i].x,points[i].y+21,points[j].x,points[j].y-21],stroke:green,strokeWidth:2})));
  groups.forEach((group,i)=>{
    const {x,y}=points[i];
    const active=group.length===cycle.length;
    const name=group.length===m?'All '+m+' positions':'{'+group.join(', ')+'}';
    const focusedCard=target('Show subgroup '+name,x,y,128,42,()=>selected.value=group[1]??0,active);
    panel(layer,x,y,128,42,active||focusedCard?green:'#91aa9e',active?'#d5ead7':'#f7faf4');
    if (name.length>23) {
      diagramLabel(layer,{x,y:y-7},group.length+' positions',{size:12,width:124});
      diagramLabel(layer,{x,y:y+8},'Multiples of '+group[1],{size:11,width:124});
    } else diagramLabel(layer,{x,y},name,{size:name.length>17?11:14,width:124});
  });
  diagramLabel(layer,{x:191,y:415},'Add '+selected.value+' · order '+cycle.length,{width:300});
  control(layer,'Modulus −',92,474,()=>{n.value=Math.max(2,m-1);selected.value%=n.value;},108);
  diagramLabel(layer,{x:191,y:474},String(m),{width:50});
  control(layer,'Modulus +',290,474,()=>n.value=Math.min(24,m+1),108);
  readout='Modulo '+m+', adding '+selected.value+' visits '+cycle.join(', ')+' before returning to zero.';
}

function selectSquareOperand(card: string, move: number) {
  const question=questions[questionIndex.value];
  if (question) {
    if (card!==question.card || questionSolved.value) return;
    if (move!==question.answer) {
      subgroupMessage.value=moveName(move)+' is not the result. Try another picture in '+card+'.';
      return;
    }
    questionSolved.value=true;
    resultMove.value=move;
    replayMoves.value=question.moves.length===2?[...question.moves].reverse():[move];
  } else {
    if (activeCard.value!==card || operands.value.length===2 || resultMove.value!==undefined) operands.value=[];
    activeCard.value=card;
    operands.value=[...operands.value,move];
    if (squareTool.value==='compose' && operands.value.length===1) {
      resultMove.value=undefined;
      subgroupMessage.value='Choose the second factor in '+card+'.';
      return;
    }
    const [a,b]=operands.value;
    resultMove.value=squareTool.value==='inverse'?inverse(a):product(a,b);
    replayMoves.value=squareTool.value==='inverse'?[resultMove.value]:[b,a];
  }
  subgroupMessage.value='Result: '+moveName(resultMove.value!)+' · inside '+card+'.';
  playLessonMotion(1400);
}

function squareLattice(layer: Konva.Container, explorer: boolean) {
  const id = props.id;
  const counting = id==='lagrange-theorem';
  const question=explorer?undefined:questions[questionIndex.value];
  const center=explorer?221:510;
  const cardWidths=[274,173,106,106].map(w=>w*(explorer ? .77 : 1));
  const positions=squareSubgroups.map((row,rank)=>row.map((card,i)=>({
    ...card,x:centeredItem(center,i,row.length,cardWidths[rank]+6),y:91+rank*99,w:cardWidths[rank],
  })));
  positions.slice(0,-1).forEach((row,rank)=>row.forEach(parent=>positions[rank+1].forEach(child=>{
    if (child.moves.every(move=>parent.moves.includes(move)))
      layer.add(new Konva.Line({points:[parent.x,parent.y+34,child.x,child.y-34],stroke:'#6d9584',strokeWidth:1.5}));
  })));
  positions.flat().forEach(card=>{
    const current=card.name===(question?.card??activeCard.value);
    const select=()=>{
      activeCard.value=card.name;
      operands.value=[];
      resultMove.value=undefined;
      subgroupMessage.value='';
      hint.value=0;
    };
    const cardName='Select '+card.name;
    const focus=(explorer||!question) && focused.value===cardName;
    panel(layer,card.x,card.y,card.w,68,current||focus?green:'#91aa9e',current?'#d9eddc':'#f7faf4');
    diagramLabel(layer,{x:card.x,y:card.y-21},card.name,{size:explorer?9:11,width:card.w-2});
    const spacing=Math.min(explorer?25:32,(card.w-7)/card.moves.length);
    card.moves.forEach((move,i)=>{
      const x=centeredItem(card.x,i,card.moves.length,spacing);
      const y=card.y+3;
      const marked=current && (question?.moves??operands.value).includes(move);
      const answer=current && resultMove.value===move;
      const tileFocused=!explorer && (!question||current) && target(card.name+': '+moveName(move),x,y+7,spacing,38,()=>selectSquareOperand(card.name,move),marked||answer);
      if (marked||answer||tileFocused) panel(layer,x,y+7,spacing-2,39,answer?green:'#a87910',answer?'#acd8ae':'#fff2c9');
      square(layer,{x,y},Math.min(10,spacing*.37),move);
      diagramLabel(layer,{x,y:y+17},moveName(move),{size:11,width:spacing});
    });
    // Preview targets take precedence over the surrounding card.
    if (explorer || !question) target(cardName,card.x,card.y,card.w,68,select,current);
  });
  if (explorer) {
    const group=positions.flat().find(card=>card.name===activeCard.value)!;
    const blocks=partition(group.moves);
    diagramLabel(layer,{x:612,y:73},'Left cosets of '+group.name,{size:16,width:350});
    const columns=blocks.length===1?1:2;
    const rows=Math.ceil(blocks.length/columns);
    const height=Math.min(122,315/rows);
    blocks.forEach((block,i)=>{
      const width=columns===1?340:165;
      const x=columns===1?612:526+(i%2)*172;
      const y=107+height/2+Math.floor(i/columns)*height;
      panel(layer,x,y,width,height-7,colors[i%colors.length]);
      const gap=Math.min(44,(width-12)/block.length);
      block.forEach((move,j)=>{
        const p={x:centeredItem(x,j,block.length,gap),y:y+3};
        square(layer,p,Math.min(15,gap*.33),move);
        diagramLabel(layer,{x:p.x,y:p.y+21},moveName(move),{size:13,width:gap});
      });
      diagramLabel(layer,{x,y:y-height/2+13},i===0?'H':moveName(block[0])+'H',{size:12,width});
    });
    const count=blocks.length+' cosets × '+group.moves.length+' moves per coset = 8';
    if (counting && !hint.value) control(layer,'Reveal count',612,468,()=>hint.value=1);
    diagramLabel(layer,{x:612,y:counting?425:462},counting&&!hint.value?'Count the boxes, then count the moves in each.':count,{size:14,width:370});
    readout=group.name+'. '+blocks.map(block=>block.map(moveName).join(', ')).join(' | ')+'. '+count;
    return;
  }
  const moves=replayMoves.value;
  const t=lessonMotion.value*moves.length;
  const step=Math.min(Math.floor(t),moves.length-1);
  const pose=moves.slice(0,Math.max(0,step)).reduce((p,move)=>product(move,p),0);
  square(layer,{x:103,y:172},56,pose,step<0?undefined:{move:moves[step],progress:t-step});
  const promptText=question
    ? question.moves.length===1?'Find the inverse of '+moveName(question.moves[0])+'.':'Find '+question.moves.map(moveName).join(' × ')+'.'
    : squareTool.value==='compose'?'Choose a first and second factor.':'Choose a move to invert.';
  if (question) diagramLabel(layer,{x:103,y:240},'Question '+(questionIndex.value+1)+' of '+questions.length,{width:200,size:13});
  diagramLabel(layer,{x:103,y:260},promptText,{width:200,size:13});
  const instruction=question
    ? 'Click the answer in the '+question.card+' card. Gold marks the given move.'
    : 'Click a card to highlight it, or click a move to use the tool.';
  const feedback=subgroupMessage.value||instruction;
  diagramLabel(layer,{x:400,y:435},feedback,{width:780,size:15});
  if (questionSolved.value) control(layer,questionIndex.value===questions.length-1?'Free exploration':'Next question',400,479,()=>{
    questionIndex.value++;questionSolved.value=false;resultMove.value=undefined;replayMoves.value=[];subgroupMessage.value='';
  },156);
  if (!question) {
    const chooseTool=(tool:typeof squareTool.value)=>{squareTool.value=tool;operands.value=[];resultMove.value=undefined;subgroupMessage.value='';};
    control(layer,squareTool.value==='compose'?'✓ Compose':'Compose',330,479,()=>chooseTool('compose'));
    control(layer,squareTool.value==='inverse'?'✓ Inverse':'Inverse',470,479,()=>chooseTool('inverse'));
  }
  readout=promptText+' '+feedback;
}

function cosetComparison(layer: Konva.Container, quotient: boolean) {
  const mirror=mirrorExample.value;
  const subset=mirror?mirrorSubgroup:rotations;
  const left=partition(subset);
  const right=partition(subset,'right');
  const normal=left.every(block=>right.some(other=>sameSet(block,other)));
  const points=(mirror?[0,4,1,5,2,6,7,3]:allMoves).reduce<Point[]>((poses,move,index)=>{
    const column=index%4;
    poses[move]={x:176+column*147+(mirror&&column>=2?8:0),y:177+Math.floor(index/4)*106};
    return poses;
  },[]);
  const amount=quotient&&normal?(collapsed.value?lessonMotion.value:1-lessonMotion.value):0;
  const shift=Math.max(0,(amount-.24)/.76);
  const names=['Rotation','Reflection'];
  const productMove=product(...representatives.value);
  const blockIndex=(move:number)=>left.findIndex(block=>block.includes(move));
  const centerOf=(block:number[])=>({
    x:block.reduce((sum,move)=>sum+points[move].x,0)/block.length,
    y:block.reduce((sum,move)=>sum+points[move].y,0)/block.length,
  });
  function outlines(blocks:number[][], color:string, dash?: number[]) {
    if (shift>=1) return;
    const group=new Konva.Group({opacity:1-shift});
    blocks.forEach(block=>{
      const xs=block.map(move=>points[move].x);
      const ys=block.map(move=>points[move].y);
      const {x,y}=centerOf(block);
      const inset=dash?-9:0;
      const w=Math.max(...xs)-Math.min(...xs)+108+inset*2;
      const h=Math.max(...ys)-Math.min(...ys)+85+inset*2;
      panel(group,x,y+7,w,h,color,'transparent',dash);
    });
    layer.add(group);
  }
  control(layer,mirror?'Rotations':'✓ Rotations',280,78,()=>chooseExample(false),140);
  control(layer,mirror?'✓ Identity and a reflection':'Identity and a reflection',474,78,()=>chooseExample(true),226);
  function chooseExample(next:boolean) {
    stopLessonMotion();
    lessonMotion.value=1;
    mirrorExample.value=next;
    representatives.value=next?[0,1]:[4,4];
    representativeSlot.value=0;
    priorProduct.value=undefined;
    quotientTokens.value=[];
    collapsed.value=false;
  }
  outlines(left,'#087e78');
  if (!quotient) outlines(right,'#ad6d08',[7,5]);
  points.forEach((p,move)=>{
    const group=new Konva.Group({opacity:1-shift});
    const slot=representativeSlot.value;
    if (quotient && amount===0) {
      const active=representatives.value[slot];
      const eligible=blockIndex(move)===blockIndex(active);
      const focus=eligible&&target('Use '+moveName(move)+' for factor '+(slot+1),p.x,p.y+7,75,73,()=>{
        priorProduct.value=productMove;
        const pair:[number,number]=[...representatives.value];
        pair[slot]=move;
        representatives.value=pair;
      });
      if (eligible || move===productMove)
        panel(group,p.x,p.y+7,77,72,focus?'#ad6d08':move===productMove?green:'#9dbdaf',move===productMove?'#d3ead2':'#eef5e8');
    }
    const center=centerOf(left[blockIndex(move)]);
    const x=p.x+(center.x-p.x)*shift;
    const y=p.y+(center.y-p.y)*shift;
    if (shift<1) square(group,{x,y},22*(1-shift),move);
    const labels=new Konva.Group({opacity:Math.max(0,1-amount/.24)});
    diagramLabel(labels,{x,y:y+31},moveName(move),{width:70,size:17});
    group.add(labels);
    layer.add(group);
  });
  if (!quotient) {
    diagramLabel(layer,{x:400,y:377},'Solid teal: left cosets     ·     Dashed amber: right cosets',{width:690,size:17});
    diagramLabel(layer,{x:400,y:412},normal?'Same partition · H is normal':'Different partitions · H is not normal',{width:740,size:21});
    diagramLabel(layer,{x:400,y:456},'A subgroup is normal when the two partitions agree.',{width:740,size:16});
    readout='Left: '+left.map(b=>[...b].sort((a,b)=>a-b).map(moveName).join(', ')).join(' | ')+'. Right: '+right.map(b=>[...b].sort((a,b)=>a-b).map(moveName).join(', ')).join(' | ')+'.';
    return;
  }
  if (shift>0) left.forEach((block,i)=>{
    const p=centerOf(block);
    const ready=shift===1;
    const focus=ready&&target('Compose '+names[i],p.x,p.y+8,120,76,()=>{
      quotientTokens.value=quotientTokens.value.length===2?[i]:[...quotientTokens.value,i];
    });
    const token=new Konva.Group({opacity:shift});
    token.add(new Konva.Circle({...p,radius:16,fill:i===0?'#087e78':'#ad6d08',stroke:focus?'#151e19':undefined,strokeWidth:3}));
    diagramLabel(token,{x:p.x,y:p.y+34},names[i],{width:140});
    layer.add(token);
  });
  if (normal && lessonMotion.value===1) control(layer,collapsed.value?'Expand cosets':'Collapse cosets',400,477,()=>{
    collapsed.value=!collapsed.value;
    quotientTokens.value=[];
    playLessonMotion(1500);
  },160);
  if (collapsed.value) {
    const pair=quotientTokens.value;
    const text=pair.length===2?names[pair[0]]+' × '+names[pair[1]]+' = '+names[(pair[0]+pair[1])%2]:
      pair.length===1?names[pair[0]]+' × …':'Click two dots to compose their cosets.';
    diagramLabel(layer,{x:400,y:402},text,{width:750});
    readout=text;
    return;
  }
  [0,1].forEach(i=>control(layer,(representativeSlot.value===i?'✓ ':'')+'Factor '+(i+1)+': '+moveName(representatives.value[i]),190+i*145,373,
    ()=>representativeSlot.value=i as 0|1,135));
  const swap=()=>{
    priorProduct.value=productMove;
    const i=mirror?0:1;
    representatives.value=mirror?(representatives.value[0]===0?[4,1]:[0,1]):[4,representatives.value[1]===4?5:4];
    representativeSlot.value=i;
  };
  control(layer,'Swap a representative',553,373,swap,210);
  const description=(move:number)=>normal?names[blockIndex(move)]:left[blockIndex(move)].map(moveName).join(', ');
  const comparison=priorProduct.value===undefined?'Choose a factor, then click another tile in its coset.':
    moveName(priorProduct.value)+' → '+moveName(productMove)+' · '+(blockIndex(priorProduct.value)===blockIndex(productMove)?'same result coset':'different result coset');
  const equation=representatives.value.map(moveName).join(' × ')+' = '+moveName(productMove)+' · '+description(productMove);
  diagramLabel(layer,{x:400,y:413},equation,{width:760,size:18});
  diagramLabel(layer,{x:400,y:442},comparison,{width:760,size:15});
  if (!normal) diagramLabel(layer,{x:400,y:477},'Different representatives can give different cosets. No quotient group.',{width:760,size:15});
  readout=equation+'. '+comparison;
}

const layout = computed(() => {
  const compact = (props.id === 'square-symmetries' || props.id === 'square-noncommutativity') && size.value.width < 650;
  const width = compact ? 390 : 800;
  const scale = Math.max(.01, Math.min(size.value.width / width, size.value.height / 520));
  return { compact, scale, x: (size.value.width - width*scale)/2, y: (size.value.height-520*scale)/2 };
});
function draw(layer: Konva.Layer) {
  const { scale,x,y } = layout.value;
  const stage = new Konva.Group({ x,y,scaleX:scale,scaleY:scale });
  controls = [];
  interact = undefined;
  readout = '';
  const id = props.id;
  const instruction = notice.value || prompt[id] || (id === 'clock-addition' ?
    props.step ? 'Drag either input hand and watch the result.' : 'Drag the hour hand to see the residue class change. After a full turn, it wraps around.' : '');
  if (instruction) label(stage,{ x:400,y:30 },instruction,{ width:780,size:18,fill:ink });
  if (id === 'clock-subgroup-diagram') clockSubgroupDiagram(stage);
  else if (id === 'subgroups') squareLattice(stage,false);
  else if (id === 'cosets' || id === 'lagrange-theorem') squareLattice(stage,true);
  else if (id === 'normal-subgroups' || id === 'quotient-groups') cosetComparison(stage,id === 'quotient-groups');
  else if (id === 'clock-addition') addition(stage);
  else if (id === 'clock-commutativity') commutative(stage);
  else if (id === 'clock-associativity') associative(stage);
  else if (id === 'clock-identity') identity(stage);
  else if (id === 'clock-inverses' || id === 'clock-subgroup') inverseOrSubgroup(stage);
  else if (id === 'clock-units') units(stage);
  else if (id === 'wilson-theorem') wilson(stage);
  else if (id.startsWith('square-')) squareScenes(stage);
  else if (mapScene.value) maps(stage);
  const dockItems = controls.filter(c => c.y >= 420 && !c.focusKey);
  if (dockItems.length) {
    const left = Math.min(...dockItems.map(c => c.x)) - 7;
    const top = Math.min(...dockItems.map(c => c.y)) - 6;
    const right = Math.max(...dockItems.map(c => c.x + c.w)) + 7;
    const bottom = Math.max(...dockItems.map(c => c.y + c.h)) + 5;
    const dock = new Konva.Rect({ x: left, y: top, width: right - left, height: bottom - top,
      cornerRadius: 14, fill: '#172824' });
    stage.add(dock);
    const index = stage.getChildren().findIndex(node => node instanceof Konva.Rect && node.x() === dockItems[0].x && node.y() === dockItems[0].y);
    if (index >= 0) dock.zIndex(index);
  }
  layer.add(stage);
  buttons.value = controls;
  live.value = readout || instruction;
}
function scrollMatrix(event: WheelEvent) {
  if (!matrix.value) return;
  event.preventDefault();
  if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
    column.value = Math.max(0, Math.min(13, column.value + Math.sign(event.deltaX || event.deltaY)));
  } else row.value = Math.max(2, Math.min(18, row.value + Math.sign(event.deltaY)));
}
function begin(p: Point): End | undefined {
  const { scale,x,y } = layout.value;
  const local = (q: Point) => {
    const dx = q.x - x;
    const dy = q.y - y;
    return { x: dx / scale, y: dy / scale };
  };
  const hit = (q:Point) => controls.find(c=>q.x>=c.x && q.x<=c.x+c.w && q.y>=c.y && q.y<=c.y+c.h);
  const point = local(p);
  const button = hit(point);
  if (button) return { end:q=>{ const next=hit(local(q)); if (next?.name===button.name && next.x===button.x && next.y===button.y) button.run(); } };
  cancelDemo();
  const gesture = interact?.(point);
  if (gesture) return { move:q=>gesture.move?.(local(q)),end:q=>gesture.end(local(q)),cancel:gesture.cancel };
}
const { host,size,pointerdown,pointermove,pointerup,pointercancel } = useCanvas(draw,begin,true);
</script>

<template>
  <div class="scene chapter-interactive">
    <div ref="host" class="chapter-canvas" aria-hidden="true" @pointerdown.capture="pointerdown" @pointermove.capture="pointermove"
      @wheel="scrollMatrix" @pointerup.capture="pointerup" @pointercancel="pointercancel" @lostpointercapture="pointercancel"></div>
    <div class="chapter-access">
      <button v-for="(button,i) in buttons" :key="button.focusKey || i" :aria-pressed="button.pressed"
        @focus="focused = button.focusKey || button.name" @blur="focused = ''" @click="button.run">{{ button.name }}</button>
      <p role="status">{{ live }}</p>
    </div>
  </div>
</template>

<style>
.chapter-canvas { position:absolute; inset:0; touch-action:none; }
.chapter-access { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
</style>
