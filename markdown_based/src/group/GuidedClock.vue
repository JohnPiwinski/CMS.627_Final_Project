<script setup lang="ts">
import Konva from 'konva';
import ClockCanvas from './ClockCanvas.vue';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import markdown from '../../content/group-theory.md?raw';
import { parseChapter } from '../content';
import { residue } from '../lib/clock';
import assets from '../narration-assets.json';
import { angle, arrow, distance, polar, useCanvas, type Point } from './canvas';

const emit = defineEmits<{ office: []; explore: [] }>();
const chapter = parseChapter(markdown, 'content/group-theory.md');
const sections = chapter.sections;
const pages = sections.flatMap(section => section.subsections);
const index = ref(0);
const chapterPage = computed(() => pages[index.value]);
const isDefinition = computed(() => chapterPage.value.id === 'group-definition');
const firstClock = computed(() => chapterPage.value.id === 'around-the-clock');
const advanced = computed(() => chapterPage.value.id === 'clock-multiply' ? 'multiply' :
  chapterPage.value.id === 'clock-wilson' ? 'factorial' : undefined);
const lab = ref<InstanceType<typeof ClockCanvas>>();
const proof = ref(false);
const beat = computed(() => chapterPage.value.beats[0]);
const audio = ref<HTMLAudioElement>();
const playing = ref(false);
const transcript = ref(false);
const muted = ref(false);
const failed = ref(false);
const focused = ref('');
const hover = ref('');
const offset = ref(0);
const preview = ref(0);
const lastFrom = ref(0);
const lastShift = ref(0);
const completed = ref(false);
const startsAt = computed(() => chapterPage.value.id === 'clock-inverse' ? 5 : firstClock.value ? 11 : 0);
const position = computed(() => residue(startsAt.value + offset.value + preview.value, 12));
const audioFiles: Record<string, { file: string; text: string }> = assets;
const src = computed(() => {
  const narration = beat.value.narration;
  const file = narration && audioFiles[narration.id];
  return file && file.text === narration.text ? import.meta.env.BASE_URL + 'narration/' + file.file : undefined;
});
const tick = Math.PI / 6;
const accent = '#537663';
const light = '#f7f3ea';
const dark = '#121a1b';
const ink = '#e8f1ee';
const mutedInk = '#9db2ab';

type Control = {
  id: string; name: string; caption?: string; x: number; y: number; w: number; h: number;
  dot?: boolean; active?: boolean; hot?: boolean; action: () => void;
};

const box = computed(() => {
  const { width, height } = size.value;
  const narrow = width < 640;
  const header = narrow ? 105 : 66;
  const bottom = height - (narrow ? 124 : 104) - (transcript.value ? (narrow ? 144 : 102) : 0);
  const center = { x: width / 2, y: (header + bottom - 48) / 2 };
  const radius = Math.max(44, Math.min(width * .34, (bottom - header - 106) * .46, 185));
  return { width, height, narrow, header, bottom, center, radius };
});
const experiment = computed(() => {
  const { width, header, bottom } = box.value;
  const scale = Math.max(.01, Math.min(width / 550, (bottom - header - 105) / 447));
  return { x: width / 2 - 400 * scale, y: (header + 42 + bottom - 60) / 2 - 271 * scale, scale };
});
const definition = computed(() => (beat.value.display ?? '').split('\n'));
const controls = computed<Control[]>(() => {
  const { width, height, narrow, bottom } = box.value;
  const list: Control[] = [{ id: 'office', name: 'Office', caption: '← Office', x: 12, y: 14, w: 70, h: 34,
    action: () => emit('office') }];
  const span = narrow ? (width - 12) / sections.length : Math.min(150, (width - 355) / sections.length);
  let navX = narrow ? 6 : width - span * sections.length - 12;
  for (const section of sections) {

    list.push({ id: section.id, name: section.title, x: navX, y: narrow ? 54 : 7, w: span, h: 24,
      action: () => jump(pages.indexOf(section.subsections[0])) });
    section.subsections.forEach((page, i) => {
      const destination = pages.indexOf(page);
      list.push({ id: page.id, name: page.title, x: navX + span / 2 - section.subsections.length * 17 + i * 34,
        y: narrow ? 79 : 32, w: 34, h: 24, dot: true, active: destination === index.value,
        action: () => jump(destination) });
    });
    navX += span;
  }
  if (advanced.value) {
    const entries = advanced.value === 'multiply' ? [
      { id: 'times-three', name: 'Multiply by 3', caption: '×3', action: () => lab.value?.factor(3) },
      { id: 'times-two', name: 'Multiply by 2', caption: '×2', action: () => lab.value?.factor(2) },
      { id: 'pin', name: 'Pin mapping', caption: 'Pin', action: () => lab.value?.pin() },
    ] : [
      { id: 'previous-factor', name: 'Previous factorial', caption: '−1', action: () => lab.value?.scrub(-1) },
      { id: 'next-factor', name: 'Next factorial', caption: '+1', action: () => lab.value?.scrub(1) },
      { id: 'pair', name: 'Pair inverse factors', caption: 'Pair', action: () => lab.value?.pairNext() },
      { id: 'proof', name: 'Show proof', caption: 'Why?', action: () => { proof.value = !proof.value; } },
    ];
    entries.forEach((entry, i) => list.push({ ...entry, x: width / 2 - entries.length * 33 + i * 66,
      y: bottom - 48, w: 60, h: 38 }));
  } else if (!isDefinition.value) {
  list.push({ id: 'back', name: 'Move back one tick', caption: '↶', x: width / 2 - 72, y: bottom - 48, w: 44, h: 38,
    action: () => shift(-1) });
  list.push({ id: 'reset', name: 'Reset clock', caption: '↺', x: width / 2 - 22, y: bottom - 48, w: 44, h: 38,
    action: reset });
  list.push({ id: 'forward', name: 'Move forward one tick', caption: '↷', x: width / 2 + 28, y: bottom - 48, w: 44, h: 38,
    hot: !completed.value, action: () => shift(1) });
  }
  const audioButtons = [
    { id: 'play', name: playing.value ? 'Pause voiceover' : 'Play voiceover', caption: playing.value ? 'Pause' : '▶ Play',
      action: () => playing.value ? audio.value?.pause() : void play() },
    { id: 'replay', name: 'Replay voiceover', caption: 'Replay', action: () => void play(true) },
    { id: 'mute', name: muted.value ? 'Unmute voiceover' : 'Mute voiceover', caption: muted.value ? 'Unmute' : 'Mute',
      action: () => { muted.value = !muted.value; } },
    { id: 'transcript', name: 'Transcript', caption: 'Transcript', action: () => { transcript.value = !transcript.value; } },
  ];
  audioButtons.filter(button => !!src.value || button.id === 'transcript').forEach((button, i) => list.push({
    ...button, x: 12 + i * 79, y: height - (narrow ? 78 : 50), w: 74, h: 33,
    active: button.id === 'transcript' ? transcript.value : button.id === 'mute' && muted.value,
  }));
  list.push({ id: 'continue', name: index.value + 1 < pages.length ? 'Continue' : 'Explore more',
    x: width - 119, y: height - 40, w: 107, h: 32, hot: completed.value,
    action: () => index.value + 1 < pages.length ? jump(index.value + 1) : emit('explore') });
  return list;
});

function reset() {
  offset.value = preview.value = lastShift.value = 0;
  completed.value = false;
}
function shift(value: number) {
  if (!value) return;
  lastFrom.value = startsAt.value + offset.value;
  lastShift.value = value;
  offset.value += value;
  if (chapterPage.value.id === 'clock-inverse' && residue(startsAt.value + offset.value, 12) === 0) completed.value = true;
  else if (chapterPage.value.id === 'clock-identity' && residue(offset.value, 12) === 0 && offset.value !== 0) completed.value = true;
  else if ((firstClock.value && offset.value === 2) || (chapterPage.value.id === 'two-names-for-twelve' && offset.value === 1)) completed.value = true;
}
function jump(next: number) {
  if (next === index.value) return;
  cancel();
  audio.value?.pause();
  playing.value = false;
  failed.value = false;
  index.value = next;
  reset();
  proof.value = false;
}
async function play(replay = false) {
  const clip = audio.value;
  if (!clip) return;
  if (replay) clip.currentTime = 0;
  try { await clip.play(); }
  catch { if (audio.value === clip) failed.value = true; }
}
watch(failed, value => { if (value) transcript.value = true; });
watch(isDefinition, value => document.body.classList.toggle('show-group-slide', value), { immediate: true });
onBeforeUnmount(() => {
  document.body.classList.remove('show-group-slide');
  audio.value?.pause();
});

function text(layer: Konva.Layer, value: string, x: number, y: number, width: number,
  options: { size?: number; fill?: string; align?: string; bold?: boolean } = {}) {
  layer.add(new Konva.Text({ text: value, x, y, width, fontSize: options.size ?? 15,
    fill: options.fill ?? ink, align: options.align ?? 'left', fontStyle: options.bold ? 'bold' : 'normal',
    fontFamily: 'system-ui, sans-serif', lineHeight: 1.2 }));
}

const feedback = computed(() => completed.value && chapterPage.value.id === 'clock-inverse'
  ? 'Correct. Moving backward five hours undoes the shift.'
  : completed.value && chapterPage.value.id === 'clock-identity'
  ? 'A complete turn returns the hand to the same position. That is the identity.'
  : completed.value ? firstClock.value ?
  'You passed 12 and landed on 1.' : 'Starting at 12 or 0 gives the same result: 1.' : beat.value.display ?? '');

function draw(layer: Konva.Layer) {
  const { width, height, narrow, header, bottom, center, radius } = box.value;
  if (isDefinition.value) {
    layer.add(new Konva.Rect({ width, height: header, fill: dark }));
    layer.add(new Konva.Rect({ y: bottom, width, height: height - bottom, fill: dark }));
  } else {
    layer.add(new Konva.Rect({ width, height, fill: dark }));
  }
  if (!isDefinition.value) layer.add(new Konva.Rect({ y: header, width, height: Math.max(0, bottom - header), fill: light }));
  text(layer, chapter.title, 94, 23, width - 100, { size: narrow ? 15 : 20, bold: true });
  text(layer, chapterPage.value.title, 16, header + 12, width - 32, { fill: '#31483d', size: 16, bold: true });
  if (chapterPage.value.id === 'clock-associativity') {
    const cy = center.y;
    for (const cx of [width * .29, width * .71]) {
      const r = Math.min(radius * .58, width * .19);
      layer.add(new Konva.Circle({ x: cx, y: cy, radius: r, stroke: accent, fill: '#fffcf2', strokeWidth: 3 }));
      const colors = ['#c35b50', '#568cc0', '#c49332'];
      for (let k = 0; k < 3; k++) {
        const pts = Array.from({ length: 17 }, (_, j) => polar({ x: cx, y: cy }, r * .78, -Math.PI / 2 + (k + j / 16) * Math.PI / 3));
        layer.add(new Konva.Line({ points: pts.flatMap(p => [p.x, p.y]), stroke: colors[k], strokeWidth: 6 }));
      }
      arrow(layer, { x: cx, y: cy }, polar({ x: cx, y: cy }, r * .65, Math.PI / 2), accent, 1);
    }
    text(layer, '(a + b) + c', width * .05, cy + radius * .7, width * .48, { fill: '#315748', align: 'center', size: 18 });
    text(layer, 'a + (b + c)', width * .48, cy + radius * .7, width * .48, { fill: '#315748', align: 'center', size: 18 });
  } else if (isDefinition.value) {
    // The definition is rendered by Slidev from the chapter Markdown.
  } else if (advanced.value) {
    const { x, y, scale } = experiment.value;
    const group = new Konva.Group({ x, y, scaleX: scale, scaleY: scale });
    lab.value?.draw(group);
    layer.add(group);
  } else if (!advanced.value) {
  layer.add(new Konva.Circle({ ...center, radius, fill: '#fffcf2', stroke: accent, strokeWidth: 3 }));
  const at = (value: number, r: number) => polar(center, r, (value - 3) * tick);
  for (let i = 0; i < 12; i++) {
    const point = at(i, radius * .8);
    const mark = at(i, radius * .94);
    layer.add(new Konva.Circle({ ...mark, radius: i === 0 ? 3.5 : 2, fill: accent }));
    const value = i === 0 ? firstClock.value ? '12' : '12 / 0' : String(i);
    const font = Math.max(10, Math.min(18, radius * .14));
    text(layer, value, point.x - 28, point.y - font * .6, 56, { size: font,
      fill: i === position.value ? '#86480b' : '#374c41', align: 'center', bold: i === position.value || i === 0 });
  }
  const amount = preview.value || lastShift.value;
  const start = preview.value ? startsAt.value + offset.value : lastFrom.value;
  if (amount) {
    const dots = Math.min(120, Math.max(8, Math.abs(amount) * 8));
    const points = Array.from({ length: dots + 1 }, (_, i) => at(start + amount * i / dots, radius * .62));
    layer.add(new Konva.Line({ points: points.flatMap(point => [point.x, point.y]), stroke: '#be8546', strokeWidth: 4, lineCap: 'round' }));
  }
  arrow(layer, center, at(position.value, radius * .58), accent, 1);
  layer.add(new Konva.Circle({ ...center, radius: 5, fill: accent }));
  }
  text(layer, advanced.value ? lab.value?.readout ?? '' : isDefinition.value ? definition.value[0] : feedback.value,
    14, bottom + 10, width - 28, { size: 14, bold: true });
  if (advanced.value && !transcript.value) {
    const explanation = 'For prime p, (a−1)(a+1) ≡ 0 forces a = ±1. Every other factor pairs with an inverse. So (p−1)! ≡ −1 (mod p). A composite modulus has a proper divisor in the factorial, so its remainder cannot be −1.';
    text(layer, proof.value ? explanation : feedback.value, 14, bottom + 29, width - 28,
      { size: narrow ? 11 : 13, fill: mutedInk });
  }
  if (transcript.value && beat.value.narration) {
    text(layer, beat.value.narration.text, 14, bottom + 51, width - 28, { size: narrow ? 12 : 14, fill: mutedInk });
  }
  if (!isDefinition.value) {
    const dockWidth = advanced.value === 'factorial' ? 276 : advanced.value ? 210 : 158;
    layer.add(new Konva.Rect({ x: (width - dockWidth) / 2, y: bottom - 54, width: dockWidth, height: 50,
      cornerRadius: 14, fill: '#172824' }));
  }
  for (const control of controls.value) {
    const [x, y, w, h] = [control.x, control.y, control.w, control.h];
    const emphasis = focused.value === control.id || hover.value === control.id;
    if (control.dot) {
      layer.add(new Konva.Circle({ x: x + w / 2, y: y + h / 2, radius: emphasis ? 5 : 3.8,
        fill: control.active ? '#e7c07a' : '#263a36', stroke: '#9db2ab', strokeWidth: 1 }));
      continue;
    }
    const isSection = sections.some(section => section.id === control.id);
    if (!isSection || emphasis) layer.add(new Konva.Rect({ x, y, width: w, height: h, cornerRadius: 7,
      fill: control.hot ? '#366354' : control.active ? '#35534b' : '#20302f',
      stroke: emphasis ? '#f3ce8b' : '#41605a', strokeWidth: emphasis ? 2 : 1 }));
    const font = control.y === bottom - 48 ? 23 : 13;
    text(layer, control.caption ?? control.name, x + 1, y + (h - font) / 2 - 1, w - 2, { align: 'center', size: font });
  }
  const hovered = controls.value.find(control => control.id === (hover.value || focused.value));
  if (hovered && (hovered.dot || hovered.y === bottom - 48)) {
    const w = Math.min(165, width - 12);
    const x = Math.max(6, Math.min(hovered.x + hovered.w / 2 - w / 2, width - w - 6));
    const y = hovered.dot ? header + 33 : bottom - 78;
    layer.add(new Konva.Rect({ x, y, width: w, height: 25, fill: '#20302f', cornerRadius: 5 }));
    text(layer, hovered.name, x, y + 5, w, { size: 12, align: 'center' });
  }
}

function hit(point: Point) {
  return controls.value.find(({ x, y, w, h }) => point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h);
}
function begin(point: Point) {
  const control = hit(point);
  if (control) return { end(next: Point) { if (hit(next)?.id === control.id) control.action(); } };
  if (isDefinition.value || chapterPage.value.id === 'clock-associativity') return;
  if (advanced.value) {
    const { x, y, scale } = experiment.value;
    const local = (next: Point) => ({ x: (next.x - x) / scale, y: (next.y - y) / scale });
    const gesture = lab.value?.begin(local(point));
    if (gesture) return {
      move(next: Point) { gesture.move?.(local(next)); },
      end(next: Point) { gesture.end(local(next)); },
      cancel: gesture.cancel,
    };
    return;
  }
  const { center, radius } = box.value;
  const length = distance(point, center);
  if (length < 10 || length > radius + 15) return;
  let previous = angle(point, center);
  let sweep = 0;
  function move(next: Point) {
    if (distance(next, center) < 10) return;
    const now = angle(next, center);
    sweep += Math.atan2(Math.sin(now - previous), Math.cos(now - previous));
    previous = now;
    preview.value = Math.round(sweep / tick);
  }
  return { move, end(next: Point) { move(next); shift(preview.value); preview.value = 0; },
    cancel() { preview.value = 0; } };
}
const { host, size, pointerdown, pointermove, pointerup, pointercancel, cancel } = useCanvas(draw, begin, true);
function movePointer(event: PointerEvent) {
  const area = host.value!.getBoundingClientRect();
  hover.value = hit({ x: event.clientX - area.left, y: event.clientY - area.top })?.id ?? '';
  pointermove(event);
}
</script>

<template>
  <Teleport to="body">
    <main class="guided-clock" :aria-label="chapter.title">
      <div ref="host" class="guided-clock-canvas" aria-hidden="true" @pointerdown="pointerdown"
        @pointermove="movePointer" @pointerup="pointerup" @pointercancel="pointercancel"
        @lostpointercapture="pointercancel" @pointerleave="hover = ''"></div>
      <ClockCanvas v-if="advanced" :key="advanced" ref="lab" :guided="advanced" />
      <div class="guided-clock-access">
        <h1>{{ chapter.title }}</h1>
        <h2>{{ chapterPage.title }}</h2>
        <button v-for="control in controls" :key="control.id" type="button"
          :aria-current="control.dot && control.active ? 'step' : undefined"
          @focus="focused = control.id" @blur="focused = ''" @click="control.action">{{ control.name }}</button>
        <p role="status">{{ advanced ? lab?.readout : isDefinition ? 'Apply S first, then R.' :
          'Clock position ' + (position || (firstClock ? 12 : '12 / 0')) + '.' }} {{ feedback }}</p>
        <p v-if="proof">For prime p, (a−1)(a+1) ≡ 0 forces a = ±1. Pairing the other factors leaves −1.</p>
        <p v-if="transcript">{{ beat.narration?.text }}</p>
      </div>
      <audio v-if="src" :key="src" ref="audio" :src="src" :muted="muted" preload="metadata"
        @playing="playing = true" @pause="playing = false" @ended="playing = false" @error="failed = true"></audio>
    </main>
  </Teleport>
</template>

<style>
.guided-clock { position: fixed; inset: 0; overflow: hidden; z-index: 100; background: #121a1b; }
.guided-clock-canvas { position: absolute; inset: 0; overflow: hidden; touch-action: none; }
.guided-clock-access { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
body:has(> .guided-clock):not(.show-group-slide) #page-root { visibility: hidden; }
body:has(> .guided-clock) { overflow: hidden; }
</style>
