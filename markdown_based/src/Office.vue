<script setup lang="ts">
import Konva from 'konva';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { levels, type LevelId } from './levels';
import { officeImage, officeOutlines, officeSize } from './office-art';

const emit = defineEmits<{ open: [LevelId]; hallway: [] }>();
const room = ref<HTMLDivElement>();
const canvas = ref<HTMLDivElement>();
const status = ref<'loading' | 'ready' | 'error'>('loading');
const hovered = ref<LevelId>();
const focused = ref<LevelId>();
const active = computed(() => hovered.value ?? focused.value);
const imageKey = ref(0);
let stage: Konva.Stage | undefined;
let observer: ResizeObserver | undefined;
let generation = 0;
const outlines = new Map<LevelId, Konva.Line>();

function select(id: LevelId) {
  if (status.value === 'ready') emit('open', id);
}

function clear(id: LevelId) {
  if (hovered.value === id) hovered.value = undefined;
}

function resize() {
  if (!stage || !room.value) return;
  const { clientWidth: width, clientHeight: height } = room.value;
  if (!width || !height) return;
  const scale = Math.min(width / officeSize.width, height / officeSize.height);
  const offsetX = (width - officeSize.width * scale) / 2;
  const offsetY = (height - officeSize.height * scale) / 2;
  stage.size({ width, height });
  stage.scale({ x: scale, y: scale });
  stage.position({ x: offsetX, y: offsetY });
  for (const outline of outlines.values()) outline.strokeWidth(2.5 / scale);
  stage.draw();
}

function dispose() {
  observer?.disconnect();
  stage?.destroy();
  stage = undefined;
  outlines.clear();
}

async function load() {
  const attempt = ++generation;
  status.value = 'loading';
  imageKey.value = attempt;
  dispose();
  try {
    await nextTick();
    const image = room.value?.querySelector('img');
    if (!image) return;
    await image.decode();
    if (generation !== attempt || !canvas.value || !room.value) return;
    stage = new Konva.Stage({ container: canvas.value, width: 1, height: 1 });
    const layer = new Konva.Layer();
    stage.add(layer);
    for (const level of levels) {
      const outline = new Konva.Line({
        points: officeOutlines[level.id], closed: true,
        fill: 'rgba(255, 255, 255, 0.004)', stroke: 'transparent',
        lineJoin: 'round', lineCap: 'round',
      });
      outlines.set(level.id, outline);
      outline.on('mouseenter', () => { hovered.value = level.id; });
      outline.on('mouseleave', () => clear(level.id));
      outline.on('click tap', () => select(level.id));
      layer.add(outline);
    }
    observer = new ResizeObserver(resize);
    observer.observe(room.value);
    resize();
    status.value = 'ready';
  } catch {
    if (generation === attempt) {
      dispose();
      status.value = 'error';
    }
  }
}

watch(active, id => {
  for (const [level, outline] of outlines) outline.stroke(level === id ? '#fff' : 'transparent');
  if (stage) stage.container().style.cursor = id ? 'pointer' : '';
});

onMounted(load);
onBeforeUnmount(() => { generation++; dispose(); });
</script>

<template>
  <Teleport to="body">
    <main class="adventure">
      <header class="adventure-header">
        <button class="adventure-back" type="button" @click="$emit('hallway')">← Hallway</button>
        <h1 class="adventure-heading">Emmy Noether’s Office</h1>
      </header>
      <div class="adventure-view">
        <div ref="room" class="adventure-room" :class="{ ready: status === 'ready' }">
          <img :key="imageKey" :src="officeImage" alt="" fetchpriority="high" draggable="false">
          <div ref="canvas" class="adventure-canvas" aria-hidden="true"></div>
        </div>
        <p v-if="status === 'loading'" class="adventure-status" role="status">Opening the office…</p>
        <div v-else-if="status === 'error'" class="adventure-status" role="alert">
          <p>The office couldn’t load.</p><button type="button" @click="load">Try again</button>
        </div>
      </div>
      <nav v-if="status === 'ready'" class="adventure-levels" aria-label="Select a level">
        <button v-for="(level, index) in levels" :key="level.id" type="button"
          :class="{ active: active === level.id }" :title="level.description"
          @pointerenter="hovered = level.id" @pointerleave="clear(level.id)"
          @focus="focused = level.id" @blur="focused = undefined" @click="select(level.id)">
          <span class="level-number">{{ index }}</span>
          <span><strong>{{ level.title }}</strong><small>{{ level.object }}</small></span>
        </button>
      </nav>
    </main>
  </Teleport>
</template>
