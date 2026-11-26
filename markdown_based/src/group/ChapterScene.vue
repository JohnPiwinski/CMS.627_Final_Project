<script setup lang="ts">
import Konva from 'konva';
import { computed, ref, watch } from 'vue';
import { angle, arrow, distance, label, polar, useCanvas, useMotion, type Point } from './canvas';
import { sceneMath } from './sceneMath';
import { additiveHomomorphism, factorialRemainders, modularInverse, residue } from '../lib/clock';
import { allMoves, cornerImage, elements, partition, product, sameSet } from '../lib/square-group';
import ElementBoard from './ElementBoard.vue';

const props = defineProps<{ id: string; step: number; demo: boolean }>();
const green = '#376858';
const ink = '#283b37';
const colors = ['#b64b45', '#376fb0', '#a87910'];
const n = ref(props.id === 'wilson-theorem' ? 7 : props.id === 'clock-units' ? 8 : 12);
const values = ref([props.id === "clock-addition" && props.step === 0 ? 0 : 5, 8, 2]);
const arcs = ref([2, 3, 2]);
const turns = ref(0);
const selected = ref(0);
const secondOperand = ref(1);
const selectedOutput = ref<number>();
const modulusOut = ref(6);
const multiplier = ref(props.id === 'clock-units' ? 3 : 1);
const hint = ref(props.id === 'wilson-theorem' && props.step ? 3 : 0);
const matrix = ref(false);
const row = ref(2);
const column = ref(0);
const squarePose = ref(0);
const discovered = ref([0]);
const rotation = ref(1);
const mirror = ref(4);
const collapsed = ref(false);
const denominator = ref(props.id === 'correspondence-square' ? 0 : 6);
const subgroup = ref(1);
const factor = ref(props.id === 'wilson-theorem' && props.step ? 6 : 0);
const notice = ref('');
const focused = ref('');
const board = ref<InstanceType<typeof ElementBoard>>();
const { progress, play, stop } = useMotion();
const animation = ref<'demo' | 'turn' | 'square' | 'collapse'>();
const demoCancelled = ref(false);
const starting = ref(0);
const mapSquare = computed(() => props.id.endsWith('-square'));
const correspondence = computed(() => props.id.startsWith('correspondence'));
const mapScene = computed(() => correspondence.value || props.id.startsWith('first-isomorphism') || props.id === 'homomorphisms-generators');
const boardMode = computed(() => ({
  subgroups: 'subgroups', cosets: 'cosets', 'normal-subgroups': 'normality', 'quotient-groups': 'quotient',
} as const)[props.id as 'subgroups']);
const prompt: Record<string, string> = {
  'clock-associativity': 'Drag a colored endpoint on either clock.',
  'clock-identity': 'Drag the marker along the number line to wind the clock.',
  'clock-inverses': 'Select a residue to highlight its additive inverse.',
  'clock-commutativity': 'Drag either colored endpoint. Compare the two orders.',
  'clock-units': 'Choose a multiplier. Do any arrows share a destination?',
  'wilson-theorem': 'Explore factorial remainders, then investigate the prime case.',
  'square-symmetries': 'Use the dock or drag across the square to discover symmetries.',
  'square-noncommutativity': 'Compare the same moves in reverse order.',
  'clock-subgroup': 'Choose a step and follow the residues it generates.',
  subgroups: 'Drag beads into the candidate, then test products and inverses.',
  cosets: 'Drag a representative onto the subgroup tray.',
  'normal-subgroups': 'Choose a representative and step through conjugation.',
  'quotient-groups': 'Collapse each coset, then compose the resulting tokens.',
  'correspondence-clock': 'Select a region to highlight its matching subgroup on both sides.',
  'correspondence-square': 'Select a region to highlight its matching subgroup on both sides.',
  'lagrange-theorem': 'Count the trays and count the beads in each tray.',
};

type End = { move?: (p: Point) => void; end: (p: Point) => void; cancel?: () => void };
type Control = { name: string; x: number; y: number; w: number; h: number; run: () => void };
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
  const centers = single ? [{ x: 400, y: 230 }] : [145, 400, 655].map(x => ({ x, y: 220 }));
  const r = single ? 138 : 95;
  const active = props.demo && !demoCancelled.value && animation.value === 'demo' && progress.value < 1;
  const t = progress.value;
  const demoIndex = single || t < .5 ? 0 : 1;
  const phase = single ? t : (t * 2) % 1;
  const preview = (i: number) => active && i === demoIndex ?
    (single ? 10 : values.value[i]) + Math.max(0, Math.min(1, (phase - .2) / .6)) * (single ? 2 : 3) : values.value[i];
  if (single) {
    dial(layer, centers[0], r, 12, preview(0));
    readout = "Clock position " + values.value[0] + ". ";
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
  formula(layer, single ? '\\mathbb{Z}/12\\mathbb{Z}' :
    a + '+' + b + '\\equiv ' + residue(a + b, 12) + '\\pmod{12}', 400, 355);
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
  const centers = [{ x: 220, y: 205 }, { x: 580, y: 205 }];
  const [a, b, c] = arcs.value;
  const starts = [0, a, a + b];
  const ends = [a, a + b, a + b + c];
  for (const [i, center] of centers.entries()) {
    dial(layer, center, 126, 12, a + b + c);
    arcs.value.forEach((length, k) => arc(layer, center, 85 - k * 11, starts[k], length, colors[k], true));
    arc(layer, center, 49, i ? a : 0, i ? b + c : a + b, i ? '#368064' : '#8753a0');
    arc(layer, center, 38, 0, a + b + c, '#895d40');
    formula(layer, (i ? a + '+(' + b + '+' + c + ')' : '(' + a + '+' + b + ')+' + c) +
      '\\equiv ' + residue(a + b + c, 12), center.x, 350);
  }
  interact = p => {
    const center = centers.find(c => distance(p, c) < 120);
    if (!center) return;
    const i = ends.findIndex((end, k) => distance(p, tick(center, 85 - k * 11, 12, end)) < 17);
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
  dial(layer, c, 125, 12, moved * 12);
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
  interact = p => p.y > 344 && p.y < 420 ? { end: q => wind(Math.max(-3, Math.min(3, Math.round((q.x - 400) / 90)))) } : undefined;
  control(layer, 'One turn left', 300, 472, () => wind(turns.value - 1), 145);
  control(layer, 'One turn right', 500, 472, () => wind(turns.value + 1), 145);
  readout = turns.value * 12 + ' hours. The hand returns to zero.';
}
function inverseOrSubgroup(layer: Konva.Container) {
  const m = n.value;
  const c = { x: 400, y: 222 };
  const r = 143;
  const inverse = props.id === 'clock-inverses';
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
    cycle.forEach((a, i) => arrow(layer, tick(c, r * .69, m, a), tick(c, r * .69, m, cycle[(i + 1) % cycle.length]), green));
  }
  formula(layer, inverse ? selected.value + '+' + residue(-selected.value, m) + '\\equiv 0\\pmod{' + m + '}' :
    '\\langle ' + selected.value + '\\rangle=\\{' + [...cycle].sort((a,b) => a-b).join(',') + '\\}', 400, 385);
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
  const m = n.value;
  const result = factorialRemainders(m)[factor.value];
  dial(layer, { x: 400, y: 194 }, 122, m, result);
  formula(layer, factor.value + '!\\equiv ' + result + '\\pmod{' + m + '}', 400, 325);
  const text = hint.value === 1 ? 'Pair each value with its inverse. Which values pair with themselves?' :
    hint.value === 2 ? 'Only 1 and −1 are self-inverse modulo a prime. All other pairs multiply to 1.' :
    hint.value === 3 ? 'Modulo 7, pair 2 with 4 and 3 with 5. The leftover factors are 1 and 6.' : notice.value;
  label(layer, { x: 400, y: 388 }, text, { width: 740, fill: ink, size: 15 });
  if (hint.value === 3) {
    const c = { x: 400, y: 194 };
    for (const [a, b] of [[2,4],[3,5]]) arrow(layer, tick(c, 83, 7, a), tick(c, 83, 7, b), '#a26026', 1);
  }
  layer.add(new Konva.Line({ points: [278, 415, 522, 415], stroke: green, strokeWidth: 2 }));
  layer.add(new Konva.Circle({ x: 278 + factor.value * 244 / (m - 1), y: 415, radius: 8, fill: green }));
  interact = p => {
    if (Math.abs(p.y - 415) > 15 || p.x < 263 || p.x > 537) return;
    const move = (q: Point) => { factor.value = Math.max(0, Math.min(m - 1, Math.round((q.x - 278) * (m - 1) / 244))); };
    return { move, end: move };
  };
  control(layer, 'Factor −', 85, 438, () => { factor.value = Math.max(0, factor.value - 1); });
  control(layer, 'Factor +', 220, 438, () => { factor.value = Math.min(m - 1, factor.value + 1); });
  control(layer, 'Modulus −', 580, 438, () => { n.value = Math.max(2, m - 1); factor.value = 0; hint.value = 0; });
  control(layer, 'Modulus +', 715, 438, () => { n.value = Math.min(20, m + 1); factor.value = 0; hint.value = 0; });
  if (hint.value < 2) control(layer, hint.value ? 'Reveal the solution' : 'Reveal a hint', 400, 478, () => hint.value++, 165);
  else {
    control(layer, 'I got it', 310, 478, () => { hint.value = 0; notice.value = 'You found the inverse pairing.';
      const Audio = window.AudioContext;
      if (Audio) {
        const context = new Audio();
        const note = context.createOscillator();
        const volume = context.createGain();
        note.connect(volume).connect(context.destination);
        note.frequency.setValueAtTime(523, context.currentTime);
        note.frequency.setValueAtTime(659, context.currentTime + .12);
        volume.gain.setValueAtTime(.065, context.currentTime);
        volume.gain.exponentialRampToValueAtTime(.001, context.currentTime + .28);
        note.onended = () => { void context.close(); };
        note.start();
        note.stop(context.currentTime + .3);
      } });
    control(layer, 'Please explain it to me', 490, 478, () => { n.value = 7; factor.value = 6; hint.value = 3; }, 178);
  }
}
function square(layer: Konva.Container, c: Point, r: number, pose: number) {
  layer.add(new Konva.Rect({ x: c.x - r, y: c.y - r, width: r * 2, height: r * 2, cornerRadius: 5,
    fill: '#f7faf4', stroke: green, strokeWidth: 2 }));
  const locations = [[1,-1],[-1,-1],[-1,1],[1,1]];
  const shades = [...colors, '#397d66'];
  for (let i = 0; i < 4; i++) {
    const [x,y] = locations[cornerImage(pose,i)];
    layer.add(new Konva.Circle({ x: c.x + x * r * .72, y: c.y + y * r * .72, radius: Math.min(12, r / 5), fill: shades[i] }));
  }
}
function discover(move: number, absolute = false) {
  squarePose.value = absolute ? move : product(move, squarePose.value);
  if (!discovered.value.includes(squarePose.value)) discovered.value.push(squarePose.value);
  if (absolute) animate('square');
}
function squareScenes(layer: Konva.Container) {
  if (props.id === 'square-noncommutativity') {
    const t = animation.value === 'square' ? progress.value : 1;
    const [r,s] = [rotation.value,mirror.value];
    square(layer, { x: 217, y: 213 }, 110, t < .35 ? 0 : t < .72 ? s : product(r,s));
    square(layer, { x: 583, y: 213 }, 110, t < .35 ? 0 : t < .72 ? r : product(s,r));
    const notation = (i: number) => ['e','r','r^2','r^3','s','rs','r^2s','r^3s'][i];
    formula(layer, notation(r) + '\\cdot ' + notation(s) + '=' + notation(product(r,s)), 217, 351);
    formula(layer, notation(s) + '\\cdot ' + notation(r) + '=' + notation(product(s,r)), 583, 351);
    control(layer, 'Change turn', 200, 474, () => { rotation.value = rotation.value % 3 + 1; animate('square'); });
    control(layer, 'Replay both', 400, 474, () => animate('square'));
    control(layer, 'Change mirror', 600, 474, () => { mirror.value = 4 + (mirror.value - 3) % 4; animate('square'); });
    return;
  }
  const c = { x: 220, y: 250 };
  const replay = animation.value === 'square' ? progress.value : 1;
  const pose = replay < .35 ? 0 : replay < .72 && squarePose.value >= 4 ? 4 : squarePose.value;
  square(layer, c, 120, pose);
  for (const move of allMoves) {
    const x = 451 + (move % 4) * 83;
    const y = 177 + Math.floor(move / 4) * 132;
    if (discovered.value.includes(move)) square(layer, { x, y }, 28, move);
    control(layer, discovered.value.includes(move) ? elements[move] : '·', x, y + 54,
      () => { if (discovered.value.includes(move)) discover(move, true); }, 58, 29);
  }
  label(layer, { x: 575, y: 395 }, discovered.value.length + ' / 8 discovered', { width: 255, fill: ink });
  interact = p => distance(p,c) < 150 ? { end: q => {
    const delta = Math.atan2(Math.sin(angle(q,c)-angle(p,c)), Math.cos(angle(q,c)-angle(p,c)));
    if (distance(p,q) > 15) discover(Math.abs(delta) > .45 ? (delta > 0 ? 1 : 3) : 4);
  }} : undefined;
  control(layer, 'Turn ↻', 280, 474, () => discover(1));
  control(layer, 'Mirror ↔', 420, 474, () => discover(4));
  control(layer, 'Next hint', 560, 474, () => { notice.value = 'Try successive turns, then mirror and turn again.'; });
}
function lagrange(layer: Konva.Container) {
  const blocks = partition(subgroup.value === 2 ? [0,1,2,3] : [0,4]);
  blocks.forEach((block, i) => {
    const x = 400 + (i - (blocks.length - 1) / 2) * 160;
    layer.add(new Konva.Rect({ x: x - 66, y: 125, width: 132, height: 47 + block.length * 54,
      stroke: colors[i % 3], cornerRadius: 13, strokeWidth: 2, fill: '#f7faf4' }));
    block.forEach((g,j) => bead(layer, x, 165 + j * 54, elements[g], colors[i % 3]));
  });
  if (hint.value) formula(layer, '|G|=[G:H]|H|=' + blocks.length + '\\times ' + blocks[0].length + '=8', 400, 405);
  control(layer, 'Switch subgroup', 280, 476, () => { subgroup.value = subgroup.value === 2 ? 1 : 2; hint.value = 0; }, 145);
  control(layer, 'Reveal count', 520, 476, () => hint.value = 1);
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
const layout = computed(() => {
  const scale = Math.max(.01, Math.min(size.value.width / 800, size.value.height / 520));
  return { scale, x: (size.value.width - 800*scale)/2, y: (size.value.height-520*scale)/2 };
});
function draw(layer: Konva.Layer) {
  const { scale,x,y } = layout.value;
  const stage = new Konva.Group({ x,y,scaleX:scale,scaleY:scale });
  controls = [];
  interact = undefined;
  readout = '';
  const id = props.id;
  const instruction = notice.value || prompt[id] || (id === 'clock-addition' ?
    props.step ? 'Drag either input hand and watch the result.' : 'Drag the hand across zero.' : '');
  if (instruction) label(stage,{ x:400,y:30 },instruction,{ width:780,size:18,fill:ink });
  if (boardMode.value && board.value) {
    const group = new Konva.Group({ y: 48, scaleX: .84, scaleY: .72, x: 64 });
    group.add(new Konva.Rect({ width:800,height:520,fill:'#263c35',cornerRadius:12 }));
    board.value.draw(group);
    stage.add(group);
    const local = (p: Point) => {
      const dx = p.x - 64;
      const dy = p.y - 48;
      return { x: dx / .84, y: dy / .72 };
    };
    interact = p => {
      const gesture=board.value?.begin(local(p));
      if (gesture) return { move:q=>gesture.move?.(local(q)),end:q=>gesture.end(local(q)),cancel:gesture.cancel };
    };
    const current = board.value;
    current.actions.forEach(({name,run},i)=>control(stage,name,82+i*91,449,run,68,29));
    if (boardMode.value === 'subgroups') {
      control(stage,'Test product',310,489,current.testProduct);
      control(stage,'Test inverse',490,489,current.testInverse);
    } else if (boardMode.value === 'quotient') control(stage,'Collapse / expand',400,489,current.toggleCollapse,155);
    else {
      control(stage,'Rotations',235,489,() => current.choosePreset('rotations'));
      control(stage,'Mirror subgroup',400,489,() => current.choosePreset('mirror'),145);
      const normality = boardMode.value === 'normality';
      control(stage,normality?'Next phase':'Clear tiles',565,489,normality?current.nextPhase:current.clear);
    }
    readout = current.message || instruction;
  } else if (id === 'clock-addition') addition(stage);
  else if (id === 'clock-commutativity') commutative(stage);
  else if (id === 'clock-associativity') associative(stage);
  else if (id === 'clock-identity') identity(stage);
  else if (id === 'clock-inverses' || id === 'clock-subgroup') inverseOrSubgroup(stage);
  else if (id === 'clock-units') units(stage);
  else if (id === 'wilson-theorem') wilson(stage);
  else if (id.startsWith('square-')) squareScenes(stage);
  else if (id === 'lagrange-theorem') lagrange(stage);
  else if (mapScene.value) maps(stage);
  const dockItems = controls.filter(c => c.y >= 420);
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
  if (button) return { end:q=>{ if (hit(local(q))?.name===button.name) button.run(); } };
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
    <ElementBoard v-if="boardMode" ref="board" :mode="boardMode" embedded />
    <div class="chapter-access">
      <button v-for="(button,i) in buttons" :key="i" @focus="focused = button.name" @blur="focused = ''"
        @click="button.run">{{ button.name }}</button>
      <p role="status">{{ live }}</p>
    </div>
  </div>
</template>

<style>
.chapter-canvas { position:absolute; inset:0; touch-action:none; }
.chapter-access { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
</style>
