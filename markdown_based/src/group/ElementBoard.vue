<script setup lang="ts">
import Konva from 'konva';
import { computed, ref, watch } from 'vue';
import { allMoves, conjugate, cornerImage, coset, elements, inverse, mirrorSubgroup, partition,
  product, rotations, sameSet } from '../lib/square-group';
import { angle, arrow, chip, distance, label, lerp, palette, useCanvas, useMotion, type Point } from './canvas';

const props = defineProps<{ embedded?: boolean; mode: 'subgroups' | 'cosets' | 'normality' | 'quotient' }>();
const subset = ref<number[]>([...(props.mode === 'normality' ? mirrorSubgroup : rotations)]);
const representative = ref(0);
const chosen = ref(1);
const sequence = ref<number[]>([]);
const outcome = ref<number>();
const message = ref('');
const held = ref<{ kind: 'move' | 'boundary' | 'token'; value: number; point: Point }>();
const revealed = ref<number[]>([]);
const tested = ref<number[]>([]);
const phase = ref(0);
const probe = ref(0);
const collapsed = ref<number[]>([]);
const movingTiles = ref<number[]>([]);
const comparing = ref<[number, number]>([1, 4]);
const representativeProduct = computed(() => product(comparing.value[1], comparing.value[0]));
const orientation = (move: number) => move < 4 ? 'Keep' : 'Flip';
const quotientMoves = ref<number[]>([]);
const { progress, play, stop } = useMotion();
const hues = ['#e7b86f', '#83c6af', '#9cb6e7', '#e89d97', '#c1a8dd', '#a9cb83', '#e4a5bf', '#e1d09a'];
const frame = { x: 540, y: 139 };
const slotOrigin = { x: 205, y: 446 };
const inversePoint = { x: 586, y: 446 };
const tray = { x: 115, y: 86, width: 275, height: 104 };
const qPoints = [{ x: 280, y: 330 }, { x: 520, y: 330 }];
const blocks = computed(() => partition(subset.value));
const currentCoset = computed(() => coset(representative.value, subset.value));
const marked = computed(() => props.mode === 'cosets' ? currentCoset.value :
  props.mode === 'normality' ? phaseImages.value : outcome.value === undefined ? [] : [outcome.value]);
const phaseImages = computed(() => subset.value.map(h => {
  if (phase.value === 1) return inverse(representative.value);
  if (phase.value === 2) return product(h, inverse(representative.value));
  if (phase.value === 3) return product(representative.value, product(h, inverse(representative.value)));
  return h;
}));
const currentDestinations = computed(() => props.mode === 'cosets' ? currentCoset.value : phaseImages.value);
const left = computed(() => coset(representative.value, subset.value));
const right = computed(() => coset(representative.value, subset.value, 'right'));
const preserved = computed(() => sameSet(subset.value, conjugate(representative.value, subset.value)));
const quotientResult = computed(() => quotientMoves.value.reduce((total, value) => (total + value) % 2, 0));

function basePoint(move: number): Point {
  return { x: 183 + move % 4 * 145, y: 260 + Math.floor(move / 4) * 80 };
}
function homePoint(index: number): Point {
  return { x: tray.x + 29 + index % 4 * 64, y: tray.y + (subset.value.length > 4 ? 24 + Math.floor(index / 4) * 52 : 52) };
}
function tile(index: number) {
  const columns = Math.min(2, blocks.value.length);
  const row = Math.floor(index / columns);
  const column = index % columns;
  return { x: 104 + column * 306, y: 230 + row * 79, width: 286, height: 66 };
}
function pointFor(move: number): Point {
  if (props.mode !== 'cosets' && props.mode !== 'quotient') return basePoint(move);
  const index = blocks.value.findIndex(block => block.includes(move));
  const block = blocks.value[index];
  const rect = tile(index);
  return { x: rect.x + rect.width / (block.length + 1) * (block.indexOf(move) + 1), y: rect.y + rect.height / 2 };
}
const list = (moves: readonly number[]) => moves.map(move => elements[move]).join(', ');
const inTray = (point: Point) => point.x >= tray.x && point.x <= tray.x + tray.width &&
  point.y >= tray.y && point.y <= tray.y + tray.height;

function clear() {
  stop();
  progress.value = 1;
  sequence.value = [];
  outcome.value = undefined;
  revealed.value = [];
  tested.value = [];
  phase.value = 0;
  message.value = '';
  quotientMoves.value = [];
  collapsed.value = [];
  movingTiles.value = [];
  probe.value = 0;
}
function choosePreset(value: string) {
  cancel();
  subset.value = value === 'mirror' ? [...mirrorSubgroup] : value === 'candidate' ? [0, 1] : [...rotations];
  clear();
}
watch(() => props.mode, (next) => choosePreset(next === 'normality' ? 'mirror' : 'rotations'));

function toggle(move: number) {
  subset.value = subset.value.includes(move) ? subset.value.filter(h => h !== move) : [...subset.value, move].sort((a, b) => a - b);
  outcome.value = undefined;
  sequence.value = [];
  if (!subset.value.includes(0)) message.value = 'The identity is outside this subset.';
  else {
    const missingInverse = subset.value.find(h => !subset.value.includes(inverse(h)));
    const badProduct = subset.value.flatMap(a => subset.value.map(b => product(a, b))).find(result => !subset.value.includes(result));
    message.value = missingInverse !== undefined || badProduct !== undefined
      ? 'Try a product or an inverse to see where the subset breaks.' : 'This subset contains e and stays closed under products and inverses.';
  }
}
function tryMove(move: number) {
  chosen.value = move;
  if (!subset.value.includes(move)) { message.value = 'Choose a circle inside the candidate boundary.'; return; }
  if (sequence.value.length === 1) {
    const first = sequence.value[0];
    sequence.value = [first, move];
    outcome.value = product(move, first);
    message.value = elements[first] + ' then ' + elements[move] + ' gives ' + elements[outcome.value] +
      (subset.value.includes(outcome.value) ? ' inside the boundary.' : ' outside the boundary.');
    play();
  } else {
    sequence.value = [move];
    outcome.value = undefined;
    message.value = 'Add a second member, or move this one to the inverse slot.';
  }
}
function tryInverse(move: number) {
  if (!subset.value.includes(move)) { message.value = 'Choose a circle inside the candidate boundary.'; return; }
  sequence.value = [move];
  outcome.value = inverse(move);
  message.value = elements[move] + ' has inverse ' + elements[outcome.value] +
    (subset.value.includes(outcome.value) ? ' inside the boundary.' : ' outside the boundary.');
  play();
}
function build(move: number) {
  representative.value = move;
  const index = blocks.value.findIndex(block => block.includes(move));
  if (!revealed.value.includes(index)) revealed.value = [...revealed.value, index];
  message.value = elements[move] + 'H = { ' + list(currentCoset.value) + ' }. Try another representative from that tile.';
  play();
}
function setPhase(value: number) {
  phase.value = value;
  if (value === 3 && !tested.value.includes(representative.value)) {
    tested.value = [...tested.value, representative.value];
  }
  if (value === 0) { stop(); progress.value = 1; }
  else play();
}
function changeFrame(move: number) {
  representative.value = move;
  setPhase(0);
}
function collapseTiles(next: number[]) {
  movingTiles.value = next.filter(value => !collapsed.value.includes(value));
  collapsed.value = next;
  quotientMoves.value = [];
  if (movingTiles.value.length) play();
}
function composeToken(value: number) {
  if (quotientMoves.value.length === 2) quotientMoves.value = [value];
  else quotientMoves.value = [...quotientMoves.value, value];
}

function drawFrame(layer: Konva.Container) {
  const side = 41;
  const corners = [
    { x: frame.x - side, y: frame.y - side }, { x: frame.x + side, y: frame.y - side },
    { x: frame.x + side, y: frame.y + side }, { x: frame.x - side, y: frame.y + side },
  ];
  const g = representative.value;
  const h = subset.value[probe.value] ?? 0;
  const moves = [0, inverse(g), product(h, inverse(g)), product(g, product(h, inverse(g)))];
  const fromPhase = phase.value ? phase.value - 1 : 0;
  const moved = corners.map((_, i) => lerp(corners[cornerImage(moves[fromPhase], i)],
    corners[cornerImage(moves[phase.value], i)], progress.value));
  layer.add(new Konva.Rect({ ...frame, offsetX: 55, offsetY: 55, width: 110, height: 110, rotation: -(g % 4) * 90,
    stroke: palette.gold, fill: '#233c32', strokeWidth: 2, dash: [6, 5], cornerRadius: 10 }));
  if (h >= 4 && phase.value === 3 && moves[3] >= 4) {
    const axis = Math.PI / 2 - (moves[3] % 4) * Math.PI / 4;
    const dx = Math.cos(axis) * 65;
    const dy = Math.sin(axis) * 65;
    layer.add(new Konva.Line({ points: [frame.x - dx, frame.y - dy, frame.x + dx, frame.y + dy],
      stroke: palette.gold, strokeWidth: 2 }));
  }
  moved.forEach((point, index) => chip(layer, point, 'ABCD'[index], {
    radius: 13, fill: ['#a64940', '#3b718c', '#805d25', '#4a705a'][index],
  }));
  label(layer, { x: frame.x, y: 211 }, 'Drag the frame · g = ' + elements[g], { width: 220, size: 15, fill: palette.soft });
}

function draw(layer: Konva.Container) {
  layer.add(new Konva.Rect({ ...tray, cornerRadius: 19, stroke: palette.gold, strokeWidth: 2, fill: '#28382c' }));
  label(layer, { x: 251, y: 64 }, props.mode === 'subgroups' ? 'Candidate subset' : 'Subgroup H', { width: 220 });
  if (!subset.value.length) label(layer, { x: 250, y: 139 }, 'Drop elements here', { width: 225, fill: palette.soft });
  subset.value.forEach((move, index) => chip(layer, homePoint(index), elements[move], { radius: 19, stroke: palette.gold }));
  if (props.mode === 'normality') drawFrame(layer);

  if (props.mode === 'cosets' || props.mode === 'quotient') {
    blocks.value.forEach((block, index) => {
      const discovered = revealed.value.includes(index) || props.mode === 'quotient';
      if (!discovered || props.mode === 'quotient' && collapsed.value.includes(index)) return;
      const highlighted = block.includes(representative.value);
      const rect = tile(index);
      layer.add(new Konva.Rect({ ...rect, cornerRadius: 16, fill: hues[index], opacity: highlighted ? .19 : .10 }));
      layer.add(new Konva.Rect({ ...rect, cornerRadius: 16, stroke: hues[index], strokeWidth: highlighted ? 3 : 1.5 }));
    });
  }
  for (const move of allMoves) {
    const point = pointFor(move);
    const index = Math.floor(move / 4);
    if (props.mode === 'quotient' && collapsed.value.includes(index)) {
      const fraction = movingTiles.value.includes(index) ? progress.value : 1;
      if (fraction < 1) chip(layer, lerp(point, qPoints[index], fraction), elements[move], { opacity: 1 - fraction });
    } else {
      chip(layer, point, elements[move], { fill: marked.value.includes(move) ? '#435f48' : palette.panel,
        stroke: (props.mode === 'subgroups' && move === chosen.value) || (props.mode !== 'subgroups' && move === representative.value)
          ? palette.gold : palette.line });
    }
  }
  if (props.mode === 'quotient') {
    collapsed.value.forEach(index => chip(layer, qPoints[index], index ? 'Flip' : 'Keep',
      { radius: 37, stroke: hues[index], opacity: movingTiles.value.includes(index) ? progress.value : 1 }));
    label(layer, { x: 400, y: 430 }, collapsed.value.length < 2 ? 'Drag each tile down to collapse it' :
      'Drag a token onto another to compose', { width: 440, fill: palette.soft });
    quotientMoves.value.forEach((value, index) => chip(layer, { x: 355 + index * 90, y: 480 }, value ? 'Flip' : 'Keep',
      { radius: 27, stroke: hues[value] }));
  }
  if (props.mode === 'cosets' && revealed.value.length || props.mode === 'normality' && phase.value > 0) {
    const destinations = currentDestinations.value;
    subset.value.forEach((move, index) => {
      const from = props.mode === 'normality' && phase.value > 1 ? pointFor(
        phase.value === 2 ? inverse(representative.value) : product(move, inverse(representative.value))) : homePoint(index);
      const to = pointFor(destinations[index]);
      arrow(layer, from, to, palette.green, .42);
      if (progress.value < 1) chip(layer, lerp(from, to, progress.value), elements[destinations[index]], { radius: 17, stroke: palette.gold });
    });
  }
  if (props.mode === 'subgroups') {
    for (let i = 0; i < 2; i++) chip(layer, { x: slotOrigin.x + i * 61, y: slotOrigin.y },
      sequence.value[i] === undefined ? '·' : elements[sequence.value[i]], { stroke: palette.gold });
    label(layer, { x: 247, y: 491 }, 'Compose', { fill: palette.soft });
    chip(layer, inversePoint, '⁻¹', { stroke: palette.gold });
    label(layer, { x: inversePoint.x, y: 491 }, 'Inverse', { fill: palette.soft });
    if (outcome.value !== undefined) {
      const from = sequence.value.length === 2 ? { x: slotOrigin.x + 61, y: slotOrigin.y } : inversePoint;
      const to = pointFor(outcome.value);
      const color = subset.value.includes(outcome.value) ? palette.green : palette.red;
      arrow(layer, from, to, color);
      if (progress.value < 1) chip(layer, lerp(from, to, progress.value), elements[outcome.value], { stroke: color });
    }
  }
  if (props.mode === 'normality') {
    if (phase.value === 3) {
      layer.add(new Konva.Rect({ x: 308, y: 365, width: 328, height: 53, cornerRadius: 15,
        stroke: preserved.value ? palette.green : palette.red, fill: '#25382f', strokeWidth: 2 }));
      label(layer, { x: 261, y: 393 }, 'gHg⁻¹', { width: 90 });
      phaseImages.value.forEach((move, index) => chip(layer,
        lerp(pointFor(move), { x: 350 + index * 70, y: 392 }, progress.value), elements[move],
        { radius: 17, stroke: preserved.value ? palette.green : palette.red }));
    }
    const phases = ['Start', 'Apply g⁻¹', 'Apply h', 'Apply g'];
    layer.add(new Konva.Line({ points: [190, 442, 610, 442], stroke: palette.line, strokeWidth: 3 }));
    phases.forEach((name, index) => {
      const x = 190 + index * 140;
      chip(layer, { x, y: 442 }, String(index), { radius: 16, stroke: phase.value === index ? palette.gold : palette.line });
      label(layer, { x, y: 480 }, name, { fill: palette.soft, size: 15 });
    });
  }
  if (props.mode === 'cosets') label(layer, { x: 400, y: 452 }, 'Drag the H boundary onto a representative', { width: 440, fill: palette.soft });
  if (held.value) {
    const hold = held.value;
    if (hold.kind === 'boundary') {
      layer.add(new Konva.Rect({ x: hold.point.x - 53, y: hold.point.y - 27, width: 106, height: 54,
        cornerRadius: 13, fill: palette.panel, stroke: palette.gold }));
      label(layer, hold.point, 'H');
    } else chip(layer, hold.point, hold.kind === 'token' ? hold.value ? 'Flip' : 'Keep' : elements[hold.value], { stroke: palette.gold });
  }
}

function hitMove(point: Point) { return allMoves.find(move => distance(point, pointFor(move)) <= 26); }
function begin(point: Point) {
  if (props.mode === 'normality' && point.y >= 413 && point.y <= 474 && point.x >= 158 && point.x <= 647) {
    const old = phase.value;
    const oldTested = [...tested.value];
    function move(next: Point) {
      const value = Math.max(0, Math.min(3, Math.round((next.x - 190) / 140)));
      if (phase.value !== value) setPhase(value);
    }
    move(point);
    return { move, end: move, cancel() { setPhase(old); tested.value = oldTested; } };
  }
  if (props.mode === 'normality' && distance(point, frame) < 85) {
    const start = angle(point, frame);
    const old = representative.value;
    const oldPhase = phase.value;
    function move(next: Point) {
      const delta = angle(next, frame) - start;
      const quarter = Math.round(-delta / (Math.PI / 2));
      const g = (quarter % 4 + 4) % 4;
      if (representative.value !== g) changeFrame(g);
    }
    return { move, end: move, cancel() { representative.value = old; setPhase(oldPhase); } };
  }
  if (props.mode === 'quotient') {
    const index = blocks.value.findIndex((_, index) => {
      const rect = tile(index);
      return !collapsed.value.includes(index) && point.x >= rect.x && point.x <= rect.x + rect.width &&
        point.y >= rect.y && point.y <= rect.y + rect.height;
    });
    if (index >= 0) {
      held.value = { kind: 'token', value: index, point };
      return { move(next: Point) { held.value = { kind: 'token', value: index, point: next }; },
        end(next: Point) {
          if (next.y >= 302) collapseTiles([...collapsed.value, index]);
          held.value = undefined;
        }, cancel() { held.value = undefined; } };
    }
    const value = qPoints.findIndex((chip, index) => collapsed.value.includes(index) && distance(point, chip) <= 45);
    if (value < 0) return;
    held.value = { kind: 'token', value, point };
    return { move(next: Point) { held.value = { kind: 'token', value, point: next }; },
      end(next: Point) {
        const other = qPoints.findIndex((chip, index) => collapsed.value.includes(index) && distance(next, chip) <= 47);
        if (other >= 0 && distance(point, next) >= 9) {
          quotientMoves.value = [other, value];
        } else if (distance(point, next) < 9) composeToken(value);
        held.value = undefined;
      }, cancel() { held.value = undefined; } };
  }
  if (props.mode === 'cosets' && inTray(point)) {
    held.value = { kind: 'boundary', value: 0, point };
    return { move(next: Point) { held.value = { kind: 'boundary', value: 0, point: next }; },
      end(next: Point) { const move = hitMove(next); if (move !== undefined) build(move); held.value = undefined; },
      cancel() { held.value = undefined; } };
  }
  const home = subset.value.findIndex((_, index) => distance(point, homePoint(index)) <= 22);
  const move = hitMove(point) ?? (home < 0 ? undefined : subset.value[home]);
  if (move === undefined) return;
  if (props.mode !== 'subgroups') return { end(next: Point) {
    if (distance(point, next) > 20) return;
    if (props.mode === 'normality') {
      if (home >= 0) probe.value = home;
      else changeFrame(move);
    } else if (props.mode === 'cosets') build(move);
  } };
  held.value = { kind: 'move', value: move, point };
  return { move(next: Point) { held.value = { kind: 'move', value: move, point: next }; },
    end(next: Point) {
      held.value = undefined;
      chosen.value = move;
      if (distance(next, inversePoint) < 37) tryInverse(move);
      else if (next.y > 413 && next.y < 478 && next.x > 168 && next.x < 307) tryMove(move);
      else if (home < 0 && inTray(next) && !subset.value.includes(move)) toggle(move);
      else if (home >= 0 && hitMove(next) !== undefined) toggle(move);
    }, cancel() { held.value = undefined; } };
}

const { host, pointerdown, pointermove, pointerup, pointercancel, cancel } = useCanvas(draw, begin);
defineExpose({ draw, begin, choosePreset, message, actions: computed(() => allMoves.map(move => ({
  name: elements[move],
  run: () => {
    if (props.mode === 'subgroups') { chosen.value = move; toggle(move); }
    else if (props.mode === 'quotient') {
      const tile = Number(move >= 4);
      if (!collapsed.value.includes(tile)) collapseTiles([...collapsed.value, tile]);
      else composeToken(tile);
    } else if (props.mode === 'cosets') build(move);
    else { changeFrame(move); setPhase(3); }
  },
}))), testProduct: () => tryMove(chosen.value), testInverse: () => tryInverse(chosen.value),
  nextPhase: () => setPhase((phase.value + 1) % 4), clear,
  toggleCollapse: () => collapseTiles(collapsed.value.length === 2 ? [] : [0, 1]),
});
</script>

<template>
  <section v-if="!embedded" class="group-workbench" aria-label="Square group element board">
    <div class="group-topline">
      <h2>{{ mode === 'subgroups' ? 'Build a subgroup' : mode === 'cosets' ? 'Collect the cosets' :
        mode === 'normality' ? 'Change the frame' : 'Collapse the cosets' }}</h2>
      <label v-if="mode !== 'quotient'">Example <select @change="choosePreset(($event.target as HTMLSelectElement).value)" :value="
        sameSet(subset, rotations) ? 'rotations' : sameSet(subset, mirrorSubgroup) ? 'mirror' : sameSet(subset, [0, 1]) ? 'candidate' : 'custom'">
        <option value="rotations">Four rotations</option><option value="mirror">Identity and a mirror</option>
        <option v-if="mode === 'subgroups'" value="candidate">Identity and a quarter-turn</option>
        <option v-if="mode === 'subgroups'" value="custom" disabled>Custom subset</option>
      </select></label>
    </div>
    <div class="group-viewport">
      <div ref="host" class="group-canvas" data-canvas="board" aria-hidden="true" @pointerdown="pointerdown"
      @pointermove="pointermove" @pointerup="pointerup" @pointercancel="pointercancel" @lostpointercapture="pointercancel"></div>
    </div>
    <div class="group-dock">
      <template v-if="mode === 'subgroups'">
        <label>Move <select v-model="chosen"><option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
        <button type="button" @click="toggle(chosen)">{{ subset.includes(chosen) ? 'Remove from subset' : 'Add to subset' }}</button>
        <button type="button" @click="tryMove(chosen)">Add to composition</button>
        <button type="button" @click="tryInverse(chosen)">Show inverse</button>
      </template>
      <template v-else-if="mode === 'cosets'">
        <label>Representative <select v-model="chosen"><option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
        <button type="button" @click="build(chosen)">Place H</button>
        <button type="button" :disabled="!revealed.length" @click="clear">Clear tiles</button>
      </template>
      <template v-else-if="mode === 'normality'">
        <label>Conjugating move <select :value="representative" @change="changeFrame(Number(($event.target as HTMLSelectElement).value))">
          <option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
        <label>Follow member <select v-model="probe"><option v-for="(move, index) in subset" :key="move" :value="index">{{ elements[move] }}</option></select></label>
        <label>Scrub conjugation <input type="range" min="0" max="3" :value="phase" @input="setPhase(Number(($event.target as HTMLInputElement).value))"></label>
        <button type="button" @click="changeFrame((representative + 1) % 8)">Next frame</button>
      </template>
      <template v-else>
        <button type="button" :aria-pressed="collapsed.length === 2" @click="collapseTiles(collapsed.length === 2 ? [] : [0, 1])">{{ collapsed.length === 2 ? 'Expand tiles' : 'Collapse tiles' }}</button>
        <template v-if="collapsed.length">
          <button type="button" :disabled="!collapsed.includes(0)" @click="composeToken(0)">Add Keep token</button>
          <button type="button" :disabled="!collapsed.includes(1)" @click="composeToken(1)">Add Flip token</button>
          <button type="button" @click="quotientMoves = []">Clear tokens</button>
        </template>
        <label>First representative <select v-model="comparing[0]"><option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
        <label>Second representative <select v-model="comparing[1]"><option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
      </template>
    </div>
    <div class="group-caption" aria-live="polite">
      <template v-if="mode === 'subgroups'">
        <strong>H = { {{ list(subset) }} }</strong>
        <p>{{ message || 'Drag circles into or out of the boundary. A subgroup contains e and stays closed when you compose or invert its members.' }}</p>
      </template>
      <template v-else-if="mode === 'cosets'">
        <strong v-if="revealed.length === blocks.length">{{ blocks.length }} cosets × {{ subset.length }} moves = 8 moves</strong>
        <strong v-else>{{ revealed.length }} of {{ blocks.length }} coset tiles discovered</strong>
        <p>{{ message || 'A left coset is what you get by multiplying every member of H on the left by one move.' }}</p>
        <p v-if="revealed.length === blocks.length">Lagrange’s theorem counts the group as equal-sized tiles. Belonging to the same tile is the equivalence relation.</p>
      </template>
      <template v-else-if="mode === 'normality'">
        <strong v-if="phase === 3">gHg⁻¹ = { {{ list(phaseImages) }} } · {{ preserved ? 'Same set' : 'Different set' }}</strong>
        <strong v-else>{{ ['Choose a frame, then scrub', 'First apply g⁻¹', 'Then apply h', 'Finally apply g'][phase] }}</strong>
        <p v-if="phase === 3">gH = { {{ list(left) }} } · Hg = { {{ list(right) }} }. {{ !preserved ? 'This subgroup is not normal.' : 'A normal subgroup keeps the same set for every frame.' }} {{ tested.length }}/8 frames checked.</p>
        <p v-else>Conjugation changes the frame: apply g⁻¹, do the original move, then apply g.</p>
      </template>
      <template v-else>
        <strong v-if="quotientMoves.length === 2">{{ quotientMoves.map(move => move ? 'Flip' : 'Keep').join(' then ') }} → {{ quotientResult ? 'Flip' : 'Keep' }}</strong>
        <strong v-else>Orientation · Keep or Flip</strong>
        <p>{{ elements[comparing[0]] }} then {{ elements[comparing[1]] }} gives {{ elements[representativeProduct] }}.
          Their orientations also compose: {{ orientation(comparing[0]) }} then {{ orientation(comparing[1]) }} gives {{ orientation(representativeProduct) }}.</p>
        <p>The orientation map preserves composition. Its kernel is the rotations. The first isomorphism theorem identifies the quotient by that kernel with the two-element image.</p>
      </template>
    </div>
  </section>
</template>
