<script setup lang="ts">
import Konva from 'konva';
import { computed, ref, watch } from 'vue';
import { allMoves, cornerImage, elements, inverse, product } from '../lib/square-group';
import { angle, arrow, chip, distance, label, palette, polar, useCanvas, type Point } from './canvas';

const props = defineProps<{ rules: boolean }>();
const mode = ref<'turn' | 'mirror'>('turn');
const history = ref<number[]>([]);
const cursor = ref(0);
const preview = ref<{ turn?: number; mirror?: number; move: number }>();
const held = ref<{ move: number; point: Point }>();
const compare = ref(false);
watch(() => props.rules, () => { compare.value = false; });
const bracketsRight = ref(false);
const selected = ref(1);
const notice = ref('');
const center = { x: 400, y: 197 };
const colors = ['#db755f', '#70a7d1', '#dab46a', '#74b291'];
const names = ['A', 'B', 'C', 'D'];
const poseOf = (sequence: readonly number[]) => sequence.reduce((pose, value) => product(value, pose), 0);
const pose = computed(() => poseOf(history.value.slice(0, cursor.value)));
const finalPose = computed(() => poseOf(history.value));
const pair = computed(() => history.value.length >= 2 ? history.value.slice(0, 2) : [1, 4]);
const intermediate = computed(() => {
  const [a, b, c] = history.value;
  if (history.value.length !== 3) return undefined;
  return bracketsRight.value ? product(c, b) : product(b, a);
});
const corners = (at: Point, side: number) => [
  { x: at.x - side, y: at.y - side }, { x: at.x + side, y: at.y - side },
  { x: at.x + side, y: at.y + side }, { x: at.x - side, y: at.y + side },
];
const slot = (index: number) => ({ x: 142 + 56 * index, y: 393 });
const bank = (move: number) => ({ x: 196 + move * 55, y: 477 });
const invertPoint = { x: 676, y: 477 };

function setSequence(sequence: number[]) {
  history.value = sequence;
  cursor.value = sequence.length;
}
function append(move: number, index = cursor.value) {
  const sequence = history.value.slice(0, cursor.value);
  if (sequence.length >= 9) { notice.value = 'The move strip is full. Undo or reset to make room.'; return; }
  sequence.splice(Math.max(0, index), 0, move);
  setSequence(sequence);
  notice.value = '';
}
function undo() {
  if (cursor.value > 0) setSequence(history.value.filter((_, index) => index !== cursor.value - 1));
}
function reset() {
  cancel();
  setSequence([]);
  compare.value = false;
  bracketsRight.value = false;
  notice.value = '';
}

function drawSquare(layer: Konva.Layer, at: Point, side: number, move: number, interaction?: typeof preview.value) {
  const vertices = corners(at, side);
  function movePoint(point: Point): Point {
    if (interaction?.turn !== undefined) return polar(at, distance(point, at), angle(point, at) + interaction.turn);
    if (interaction?.mirror !== undefined) return polar(at, distance(point, at), 2 * interaction.mirror - angle(point, at));
    return point;
  }
  const outline = interaction?.turn === undefined ? vertices : vertices.map(movePoint);
  layer.add(new Konva.Line({ points: outline.flatMap(point => [point.x, point.y]), closed: true,
    fill: '#e3c88d', stroke: '#b98d54', strokeWidth: 3, lineJoin: 'round' }));
  if (interaction?.mirror !== undefined) {
    const from = polar(at, 145, interaction.mirror);
    const to = polar(at, 145, interaction.mirror + Math.PI);
    layer.add(new Konva.Line({ points: [from.x, from.y, to.x, to.y], stroke: '#754b38', strokeWidth: 3, dash: [7, 6] }));
  }
  names.forEach((name, index) => chip(layer, movePoint(vertices[cornerImage(move, index)]), name,
    { radius: side < 70 ? 13 : 18, fill: colors[index], stroke: '#f7e9cc' }));
}

function draw(layer: Konva.Layer) {
  if (compare.value) {
    const forward = poseOf(pair.value);
    const backward = poseOf([...pair.value].reverse());
    drawSquare(layer, { x: 250, y: 193 }, 66, forward);
    drawSquare(layer, { x: 550, y: 193 }, 66, backward);
    label(layer, { x: 250, y: 302 }, pair.value.map(move => elements[move]).join(' → ') + ' gives ' + elements[forward], { width: 280 });
    label(layer, { x: 550, y: 302 }, [...pair.value].reverse().map(move => elements[move]).join(' → ') + ' gives ' + elements[backward], { width: 280 });
  } else {
    drawSquare(layer, center, 99, pose.value, preview.value);
    if (!preview.value) {
      label(layer, { x: 400, y: 335 }, mode.value === 'turn' ? 'Grab a corner and turn' : 'Drag across the center to set a mirror line', { width: 430, fill: palette.soft });
    }
  }
  layer.add(new Konva.Rect({ x: 109, y: 367, width: 545, height: 52, cornerRadius: 13, fill: '#20342c', stroke: palette.line }));
  if (!history.value.length) label(layer, { x: 380, y: 393 }, 'Drop move circles here', { width: 220, fill: palette.soft });
  history.value.forEach((move, index) => chip(layer, slot(index), elements[move],
    { radius: 19, opacity: index < cursor.value ? 1 : .48 }));
  if (props.rules && history.value.length === 3) {
    const start = slot(bracketsRight.value ? 1 : 0).x - 23;
    layer.add(new Konva.Line({ points: [start, 377, start, 371, start + 102, 371, start + 102, 377],
      stroke: palette.gold, strokeWidth: 4, lineJoin: 'round' }));
  }
  arrow(layer, { x: 114 + 56 * cursor.value, y: 443 }, { x: 114 + 56 * cursor.value, y: 421 }, palette.gold);
  for (const move of allMoves) chip(layer, bank(move), elements[move], {
    stroke: move === selected.value ? palette.gold : palette.line, fill: move === finalPose.value ? '#436445' : palette.panel,
  });
  chip(layer, invertPoint, '⁻¹', { stroke: palette.gold });
  if (held.value) chip(layer, held.value.point, elements[held.value.move], { stroke: palette.gold });
}

function begin(point: Point) {
  if (props.rules && history.value.length === 3 && point.y >= 353 && point.y <= 380 && point.x >= 104 && point.x <= 322) {
    const old = bracketsRight.value;
    function move(next: Point) { bracketsRight.value = next.x > 197; }
    return { move, end: move, cancel() { bracketsRight.value = old; } };
  }
  if (point.y >= 420 && point.y <= 452 && point.x >= 106 && point.x <= 648) {
    const previous = cursor.value;
    function move(next: Point) { cursor.value = Math.min(history.value.length, Math.max(0, Math.round((next.x - 114) / 56))); }
    move(point);
    return { move, end: move, cancel() { cursor.value = previous; } };
  }
  const fromBank = allMoves.find(move => distance(point, bank(move)) <= 24);
  const fromStrip = history.value.findIndex((_, index) => distance(point, slot(index)) <= 22);
  if (fromBank !== undefined || fromStrip >= 0) {
    const move = fromBank ?? history.value[fromStrip];
    held.value = { move, point };
    return {
      move(next: Point) { held.value = { move, point: next }; },
      end(next: Point) {
        held.value = undefined;
        selected.value = move;
        if (distance(next, invertPoint) <= 30) {
          selected.value = inverse(move);
          notice.value = 'The inverse of ' + elements[move] + ' is ' + elements[selected.value] + '.';
          if (fromStrip >= 0) append(selected.value);
        } else if (next.y > 365 && next.y < 421 && next.x > 93 && next.x < 661) {
          const to = Math.max(0, Math.round((next.x - slot(0).x) / 56));
          if (fromStrip >= 0) {
            const changed = history.value.filter((_, index) => index !== fromStrip);
            changed.splice(to, 0, move);
            setSequence(changed);
          } else append(move, to);
        } else if (fromStrip >= 0 && distance(next, point) < 7) cursor.value = fromStrip + 1;
      },
      cancel() { held.value = undefined; },
    };
  }
  if (compare.value || distance(point, center) > 181 || point.y < 54) return;
  if (mode.value === 'turn' && !corners(center, 99).some(corner => distance(corner, point) <= 36)) return;
  let previous = angle(point, center);
  let swept = 0;
  function move(next: Point) {
    if (distance(next, center) < 14) return;
    const nextAngle = angle(next, center);
    swept += Math.atan2(Math.sin(nextAngle - previous), Math.cos(nextAngle - previous));
    previous = nextAngle;
    if (mode.value === 'turn') {
      const turns = Math.round(-swept / (Math.PI / 2));
      preview.value = { turn: swept, move: (turns % 4 + 4) % 4 };
    } else {
      const quarters = Math.round((Math.PI / 2 - nextAngle) / (Math.PI / 4));
      preview.value = { mirror: Math.PI / 2 - quarters * Math.PI / 4, move: 4 + (quarters % 4 + 4) % 4 };
    }
  }
  if (mode.value === 'mirror') move(point);
  return {
    move,
    end(next: Point) { move(next); if (preview.value?.move) append(preview.value.move); preview.value = undefined; },
    cancel() { preview.value = undefined; },
  };
}

const { host, pointerdown, pointermove, pointerup, pointercancel, cancel } = useCanvas(draw, begin);
</script>

<template>
  <section class="group-workbench" aria-label="Square symmetries">
    <div class="group-topline"><h2>{{ rules ? 'What makes a group?' : 'Move the marked square' }}</h2></div>
    <div class="group-viewport">
      <div ref="host" class="group-canvas" data-canvas="square" aria-hidden="true" @pointerdown="pointerdown"
      @pointermove="pointermove" @pointerup="pointerup" @pointercancel="pointercancel" @lostpointercapture="pointercancel"></div>
    </div>
    <div class="group-dock">
      <button type="button" :aria-pressed="mode === 'turn'" @click="cancel(); mode = 'turn'">Turn</button>
      <button type="button" :aria-pressed="mode === 'mirror'" @click="cancel(); mode = 'mirror'">Mirror</button>
      <label>Move <select v-model="selected"><option v-for="move in allMoves" :key="move" :value="move">{{ elements[move] }}</option></select></label>
      <button type="button" @click="append(selected)">Add move</button>
      <button type="button" @click="append(inverse(selected))">Add inverse</button>
      <button type="button" :disabled="!cursor" @click="undo">Undo</button>
      <button type="button" @click="reset">Reset square</button>
      <button type="button" :aria-pressed="compare" @click="compare = !compare">Compare orders</button>
      <button v-if="rules" type="button" :disabled="history.length !== 3" @click="bracketsRight = !bracketsRight">Move brackets</button>
      <label v-if="history.length">Replay <input type="range" min="0" :max="history.length" v-model.number="cursor"></label>
      <template v-if="history.length > 1">
        <button type="button" :disabled="cursor < 2" @click="setSequence(history.map((move, index) =>
          index === cursor - 2 ? history[cursor - 1] : index === cursor - 1 ? history[cursor - 2] : move))">Swap last two replayed moves</button>
      </template>
    </div>
    <div class="group-caption" aria-live="polite">
      <strong>{{ history.map(move => elements[move]).join(' → ') || 'Start at e' }} · Current move {{ elements[pose] }} · Result {{ elements[finalPose] }}</strong>
      <p v-if="notice">{{ notice }}</p>
      <p v-else-if="compare">The order can change the result. Four turns and four reflections form the dihedral group D₄.</p>
      <p v-else-if="rules && intermediate !== undefined">{{ bracketsRight ? 'Last two' : 'First two' }} first gives {{ elements[intermediate] }}. Both groupings give the same final move.</p>
      <p v-else-if="rules">Every composition lands on a move circle. Add e or a move and its inverse to see what stays put.</p>
      <p v-else>Try a turn and a reflection, then swap their circles in the move strip.</p>
    </div>
  </section>
</template>
