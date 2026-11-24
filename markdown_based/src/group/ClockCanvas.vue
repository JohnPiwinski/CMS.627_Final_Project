<script setup lang="ts">
import Konva from 'konva';
import { computed, ref } from 'vue';
import { clockScale, factorialRemainders, isPrime, modularInverse, residue } from '../lib/clock';
import { angle, arrow, chip as drawChip, distance, label, palette as darkPalette, polar, useCanvas, type Point } from './canvas';

const props = defineProps<{ guided?: 'multiply' | 'factorial' }>();
const palette = props.guided ? {
  ...darkPalette, gold: '#a26026', ink: '#30493c', soft: '#536f5e', panel: '#fffcf2',
  line: '#6d8c7a', green: '#3a785f',
} : darkPalette;
function chip(layer: Konva.Container, point: Point, value: string, options: Parameters<typeof drawChip>[3] = {}) {
  drawChip(layer, point, value, { color: palette.ink, fill: palette.panel, stroke: palette.line, ...options });
}
const modulus = ref(props.guided === 'multiply' ? 8 : props.guided === 'factorial' ? 7 : 12);
const mode = ref<'add' | 'multiply' | 'factorial'>(props.guided ?? 'add');
const origin = ref(11);
const moves = ref<number[]>([]);
const preview = ref<number>();
const multiplier = ref(1);
const dragged = ref<{ value: number; point: Point }>();
const pinned = ref<number>();
const partner = ref(1);
const distribute = ref(false);
const factorial = ref(0);
const pairs = ref<[number, number][]>([]);
const paired = computed(() => pairs.value.flat());
const picked = ref<number>();
const hint = ref(false);
const explanation = ref(false);
const notice = ref('');
const center = { x: 400, y: 235 };
const radius = 164;
const stepAngle = computed(() => Math.PI * 2 / modulus.value);
const residues = computed(() => Array.from({ length: modulus.value }, (_, value) => value));
const unitMoves = computed(() => residues.value.filter(value => modularInverse(value, modulus.value) !== undefined));
const total = computed(() => origin.value + moves.value.reduce((sum, move) => sum + move, 0));
const addAt = computed(() => residue(total.value + (preview.value ?? 0), modulus.value));
const remainders = computed(() => factorialRemainders(modulus.value));
const remaining = computed(() => residues.value.slice(1).filter(value => !paired.value.includes(value)));
const prime = computed(() => isPrime(modulus.value));
const displayAt = computed(() => mode.value === 'add' ? addAt.value :
  mode.value === 'factorial' ? remainders.value[factorial.value] : clockScale(partner.value, multiplier.value, modulus.value));
const inverse = computed(() => modularInverse(partner.value, modulus.value));
const scopeLabel = computed(() => mode.value === 'add' ? 'Add on the clock' :
  mode.value === 'multiply' ? 'Multiply on the clock' : 'Investigate factorials');
const wrapAngle = (value: number) => Math.atan2(Math.sin(value), Math.cos(value));
const tickAngle = (value: number) => value * stepAngle.value - Math.PI / 2;
const tickPoint = (value: number, r = radius) => polar(center, r, tickAngle(value));
const chipPoint = (value: number) => ({ x: 400 + (value - (modulus.value - 1) / 2) * 32, y: 471 });
const factorPoint = (value: number) => ({ x: 400 + (value - modulus.value / 2) * 31, y: 469 });

function reset() {
  cancel();
  origin.value = modulus.value - 1;
  moves.value = [];
  multiplier.value = 1;
  partner.value = 1;
  pinned.value = undefined;
  factorial.value = 0;
  pairs.value = [];
  picked.value = undefined;
  hint.value = false;
  explanation.value = false;
  notice.value = '';
}

function switchMode(next: typeof mode.value) {
  cancel();
  mode.value = next;
  notice.value = '';
}

function shift(value: number) {
  if (value) moves.value = [...moves.value, value];
}

function pair(value: number) {
  if (paired.value.includes(value)) return;
  if (picked.value === undefined) { picked.value = value; return; }
  const first = picked.value;
  picked.value = undefined;
  if (value === first) return;
  if (clockScale(first, value, modulus.value) === 1) {
    pairs.value = [...pairs.value, [first, value]];
    notice.value = first + ' and ' + value + ' multiply to 1.';
  } else {
    notice.value = first + ' × ' + value + ' leaves remainder ' + clockScale(first, value, modulus.value) + '.';
  }
}

function traceArc(layer: Konva.Container, from: number, amount: number, r: number, color: string) {
  if (!amount) return;
  const segments = Math.min(144, Math.max(6, Math.abs(amount) * 7));
  const points = Array.from({ length: segments + 1 }, (_, i) => tickPoint(from + amount * i / segments, r));
  layer.add(new Konva.Line({ points: points.flatMap(point => [point.x, point.y]), stroke: color, strokeWidth: 5, lineCap: 'round' }));
  arrow(layer, points[segments - 1], points[segments], color, 1);
}

function draw(layer: Konva.Container) {
  layer.add(new Konva.Circle({ ...center, radius: radius + 18, fill: props.guided ? '#fffcf2' : '#1d322b', stroke: props.guided ? '#537663' : '#5a7968', strokeWidth: props.guided ? 3 : 2 }));
  layer.add(new Konva.Circle({ ...center, radius: radius - 34, stroke: props.guided ? '#d6ded3' : '#416154', strokeWidth: 1 }));
  if (mode.value === 'multiply') {
    const factor = dragged.value?.value ?? multiplier.value;
    function paths(by: number, color: string, opacity: number) {
      for (const value of residues.value) {
        const from = tickPoint(value, 128);
        const to = tickPoint(clockScale(value, by, modulus.value), 126);
        if (distance(from, to) < 5) continue;
        layer.add(new Konva.Arrow({ points: [from.x, from.y, center.x + (from.x + to.x - center.x * 2) * .16,
          center.y + (from.y + to.y - center.y * 2) * .16, to.x, to.y], tension: .45,
          stroke: color, fill: color, opacity, pointerLength: 5, pointerWidth: 5, strokeWidth: 1.4 }));
      }
    }
    if (pinned.value !== undefined) paths(pinned.value, palette.gold, .35);
    paths(factor, palette.green, .45);
  }
  for (const value of residues.value) {
    const highlighted = value === displayAt.value;
    if (props.guided) {
      const unit = mode.value === 'multiply' && unitMoves.value.includes(value);
      layer.add(new Konva.Circle({ ...tickPoint(value, radius * 1.035), radius: value === 0 ? 3.5 : 2,
        fill: highlighted ? palette.gold : palette.line }));
      label(layer, tickPoint(value, radius * .91), String(value),
        { size: 18, fill: highlighted ? palette.gold : unit ? palette.green : palette.ink });
    } else {
      chip(layer, tickPoint(value), String(value), { radius: modulus.value > 18 ? 12 : 16,
        stroke: highlighted ? palette.gold : palette.line,
        fill: highlighted ? props.guided ? '#f2dfbc' : '#795b32' :
          mode.value === 'multiply' && unitMoves.value.includes(value) ? props.guided ? '#e2ece1' : '#365b4a' : palette.panel });
    }
  }
  if (mode.value === 'multiply' && distribute.value) {
    const mini = [{ x: 111, y: 235 }, { x: 689, y: 235 }];
    const shades = [palette.gold, palette.green];
    const arc = (at: Point, start: number, amount: number, band: number, fill: string) => {
      const points = Array.from({ length: 41 }, (_, i) => polar(at, band, tickAngle(start + amount * i / 40)));
      layer.add(new Konva.Line({ points: points.flatMap(point => [point.x, point.y]), stroke: fill, strokeWidth: 5, lineCap: 'round' }));
    };
    mini.forEach(at => layer.add(new Konva.Circle({ ...at, radius: 53, fill: '#20372d', stroke: palette.line })));
    const first = clockScale(a.value, multiplier.value, modulus.value);
    const second = clockScale(b.value, multiplier.value, modulus.value);
    arc(mini[0], 0, distributed.value, 43, shades[0]);
    arc(mini[1], 0, first, 43, shades[0]);
    arc(mini[1], first, second, 36, shades[1]);
    mini.forEach((at, index) => {
      label(layer, { x: at.x, y: at.y }, String(distributed.value), { fill: palette.gold, size: 24 });
      label(layer, { x: at.x, y: at.y + 76 }, index ? 'Scale separately' : 'Scale the sum', { size: 14, width: 147 });
    });
  }
  if (mode.value === 'add') {
    const offsets = moves.value.slice(-2);
    let start = total.value - offsets.reduce((sum, amount) => sum + amount, 0);
    offsets.forEach((amount, index) => { traceArc(layer, start, amount, 107 + index * 12, palette.green); start += amount; });
    if (preview.value !== undefined) traceArc(layer, total.value, preview.value, 136, palette.gold);
  }
  const hand = props.guided ? '#537663' : palette.gold;
  arrow(layer, center, tickPoint(displayAt.value, 86), hand, 1);
  layer.add(new Konva.Circle({ ...center, radius: props.guided ? 5 : 7, fill: hand }));
  if (mode.value === 'add') label(layer, { x: 400, y: 469 }, 'Grab the hand or an outer tick and sweep', { width: 390, fill: palette.soft });
  if (mode.value === 'multiply') {
    label(layer, { x: 400, y: 433 }, 'Drag a multiplier onto the dial', { width: 390, fill: palette.soft });
    for (const value of residues.value) chip(layer, chipPoint(value), String(value), {
      radius: 14, stroke: multiplier.value === value ? palette.gold : palette.line,
    });
  }
  if (mode.value === 'factorial') {
    const y = 420;
    const x = 205 + factorial.value * 390 / (modulus.value - 1);
    layer.add(new Konva.Line({ points: [205, y, 595, y], stroke: palette.line, strokeWidth: 4 }));
    chip(layer, { x, y }, String(factorial.value), { radius: 16, stroke: palette.gold });
    pairs.value.forEach(([first, second], index) => {
      const x = 100 + index % 3 * 63 + (index > 5 ? 450 : 0);
      const y = 66 + Math.floor(index % 6 / 3) * 39;
      label(layer, { x, y }, first + '·' + second, { width: 61, fill: palette.green, size: 14 });
    });
    for (const value of residues.value.slice(1)) chip(layer, factorPoint(value), String(value), {
      radius: 14, opacity: paired.value.includes(value) ? .2 : 1,
      stroke: picked.value === value || hint.value && inverseHint.value.includes(value) ? palette.gold : palette.line,
    });
  }
  if (dragged.value) chip(layer, dragged.value.point, String(dragged.value.value), { stroke: palette.gold });
}

const inverseHint = computed(() => {
  const value = remaining.value.find(value => {
    const other = modularInverse(value, modulus.value);
    return other !== undefined && other !== value && remaining.value.includes(other);
  });
  return value === undefined ? [] : [value, modularInverse(value, modulus.value)!];
});

function begin(point: Point) {
  const fromCenter = distance(point, center);
  if (mode.value === 'add' && fromCenter >= 14 && fromCenter <= 190) {
    let previous = angle(point, center);
    let swept = 0;
    preview.value = 0;
    function move(next: Point) {
      if (distance(next, center) < 12) return;
      const current = angle(next, center);
      swept += wrapAngle(current - previous);
      previous = current;
      preview.value = Math.round(swept / stepAngle.value);
    }
    return { move, end(next: Point) { move(next); shift(preview.value ?? 0); preview.value = undefined; },
      cancel() { preview.value = undefined; } };
  }
  if (mode.value === 'multiply') {
    const value = residues.value.find(value => distance(point, chipPoint(value)) < 16);
    if (value !== undefined) {
      dragged.value = { value, point };
      return { move(next: Point) { dragged.value = { value, point: next }; },
        end(next: Point) {
          const radial = distance(next, center);
          if (radial <= 185 || distance(next, point) < 8) multiplier.value = value;
          if (Math.abs(radial - radius) < 24) {
            partner.value = residue(Math.round((angle(next, center) + Math.PI / 2) / stepAngle.value), modulus.value);
          }
          dragged.value = undefined;
        }, cancel() { dragged.value = undefined; } };
    }
    if (Math.abs(fromCenter - radius) < 25) {
      const value = residue(Math.round((angle(point, center) + Math.PI / 2) / stepAngle.value), modulus.value);
      return { end(next: Point) { if (distance(point, next) < 24) partner.value = value; } };
    }
  }
  if (mode.value === 'factorial') {
    if (Math.abs(point.y - 420) < 20 && point.x >= 183 && point.x <= 617) {
      const old = factorial.value;
      function move(next: Point) {
        factorial.value = Math.min(modulus.value - 1, Math.max(0, Math.round((next.x - 205) / 390 * (modulus.value - 1))));
      }
      move(point);
      return { move, end: move, cancel() { factorial.value = old; } };
    }
    const value = remaining.value.find(value => distance(point, factorPoint(value)) < 15);
    if (value !== undefined) {
      dragged.value = { value, point };
      return { move(next: Point) { dragged.value = { value, point: next }; },
        end(next: Point) {
          const other = remaining.value.find(candidate => distance(next, factorPoint(candidate)) <= 17);
          if (other !== undefined && other !== value) { picked.value = value; pair(other); }
          else if (distance(point, next) < 8) pair(value);
          dragged.value = undefined;
        }, cancel() { dragged.value = undefined; } };
    }
  }
}

const { host, pointerdown, pointermove, pointerup, pointercancel, cancel } = useCanvas(draw, begin);
const pairsText = computed(() => !remaining.value.length ? 'All factors paired.' :
  'Unpaired factors: ' + remaining.value.join(', ') + '.');
const a = computed(() => moves.value.at(-2) ?? 3);
const b = computed(() => moves.value.at(-1) ?? 2);
const distributed = computed(() => clockScale(a.value + b.value, multiplier.value, modulus.value));

const readout = computed(() => mode.value === 'multiply'
  ? partner.value + ' × ' + multiplier.value + ' ≡ ' + displayAt.value + ' (mod ' + modulus.value + ')'
  : factorial.value + '! ≡ ' + remainders.value[factorial.value] + ' (mod ' + modulus.value + ')' +
    (notice.value ? ' · ' + notice.value : ''));
defineExpose({
  readout, draw, begin,
  factor(value: number) { multiplier.value = value; },
  scrub(value: number) { factorial.value = Math.max(0, Math.min(modulus.value - 1, factorial.value + value)); },
  pairNext() {
    if (inverseHint.value.length === 2) {
      picked.value = inverseHint.value[0];
      pair(inverseHint.value[1]);
    } else notice.value = 'Only 1 and 6 remain. Their product is 6 modulo 7.';
  },
  pin() { pinned.value = pinned.value === undefined ? multiplier.value : undefined; },
  reset,
});
</script>

<template>
  <section v-if="!guided" class="group-workbench" aria-label="Modular clock">
    <div class="group-topline">
      <h2>{{ scopeLabel }}</h2>
      <label>Clock size <select v-model="modulus" @change="reset">
        <option v-for="n in 23" :key="n" :value="n + 1">{{ n + 1 }}</option>
      </select></label>
    </div>
    <div class="group-viewport">
      <div ref="host" class="group-canvas" data-canvas="clock" aria-hidden="true" @pointerdown="pointerdown"
      @pointermove="pointermove" @pointerup="pointerup" @pointercancel="pointercancel" @lostpointercapture="pointercancel"></div>
    </div>
    <div class="group-dock">
      <button type="button" :aria-pressed="mode === 'add'" @click="switchMode('add')">Add</button>
      <button type="button" :aria-pressed="mode === 'multiply'" @click="switchMode('multiply')">Multiply</button>
      <button type="button" :aria-pressed="mode === 'factorial'" @click="switchMode('factorial')">Factorials</button>
      <template v-if="mode === 'add'">
        <button type="button" @click="shift(-1)">−1 tick</button>
        <button type="button" @click="shift(1)">+1 tick</button>
        <button type="button" :disabled="!moves.length" @click="moves = moves.slice(0, -1)">Undo</button>
      </template>
      <template v-else-if="mode === 'multiply'">
        <label>Multiplier <select v-model="multiplier"><option v-for="value in residues" :key="value" :value="value">{{ value }}</option></select></label>
        <label>Starting residue <select v-model="partner"><option v-for="value in residues" :key="value" :value="value">{{ value }}</option></select></label>
        <button type="button" :aria-pressed="pinned !== undefined" @click="pinned = pinned === undefined ? multiplier : undefined">Pin paths</button>
        <button type="button" :aria-pressed="distribute" @click="distribute = !distribute">Distribute</button>
      </template>
      <template v-else>
        <label>Factorial <input v-model.number="factorial" type="range" min="0" :max="modulus - 1"></label>
        <label>Pair factors <select value="" @change="pair(Number(($event.target as HTMLSelectElement).value)); ($event.target as HTMLSelectElement).value = ''">
          <option value="" disabled>Choose factor</option>
          <option v-for="factor in remaining" :key="factor" :value="factor">{{ factor }}</option>
        </select></label>
        <button type="button" :aria-pressed="hint" @click="hint = !hint">Hint</button>
        <button type="button" :aria-pressed="explanation" @click="explanation = !explanation">Why?</button>
      </template>
      <button type="button" @click="reset">Reset clock</button>
    </div>
    <div class="group-caption" aria-live="polite">
      <template v-if="mode === 'add'">
        <strong>{{ preview ?? moves.at(-1) ?? 0 }}-tick shift · position {{ addAt }}</strong>
        <p>{{ moves.length || preview ? 'Addition modulo ' + modulus + ' is a group. Zero leaves the hand put, and the opposite shift undoes a move.' : 'Start one tick before zero. Sweep forward two ticks to see where you land.' }}</p>
      </template>
      <template v-else-if="mode === 'multiply'">
        <strong>{{ partner }} × {{ multiplier }} ≡ {{ displayAt }} (mod {{ modulus }})</strong>
        <p v-if="distribute">{{ multiplier }} × ({{ a }} + {{ b }}) ≡ {{ distributed }}.
          Scaling separately gives {{ residue(a * multiplier, modulus) }} + {{ residue(b * multiplier, modulus) }} ≡ {{ distributed }}. Distributivity links the two operations of a ring.</p>
        <p v-else-if="prime">Every nonzero residue has an inverse. {{ inverse === undefined ? 'Zero has none.' : partner + ' pairs with ' + inverse + '.' }} This ring is a field.</p>
        <p v-else>{{ inverse === undefined ? partner + ' has no multiplicative inverse.' : partner + ' pairs with ' + inverse + ' to make 1.' }} Green ticks are units and form a group under multiplication. The two operations together give a ring.</p>
      </template>
      <template v-else>
        <strong>{{ factorial }}! ≡ {{ remainders[factorial] }} (mod {{ modulus }})</strong>
        <p v-if="explanation">{{ modulus === 2 ? 'Modulo 2, 1 and −1 are the same residue. The only factor is 1.' : prime ?
          'For an odd prime, every factor pairs with its inverse except 1 and −1. Their product is −1. Wilson’s theorem says (n−1)! ≡ −1 modulo n exactly when n is prime.' :
          'For a composite modulus, some factors have no inverse, so the prime pairing argument breaks. Wilson’s theorem says the final remainder is −1 exactly for prime moduli.' }}</p>
        <p v-else-if="hint">{{ inverseHint.length ? 'Look at ' + inverseHint.join(' and ') + '. ' :
          prime ? 'Only self-inverse factors remain. ' : 'Look for a factor that has no inverse. ' }}{{ pairsText }}</p>
        <p v-else>{{ notice || (prime ? 'Scrub to the final product. Why does it land one tick before zero?' :
          'Scrub to the final product. How does the remainder compare with a prime clock size?') }}</p>
      </template>
    </div>
  </section>
</template>

