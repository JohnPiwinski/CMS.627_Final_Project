<script setup lang="ts">
import { useNarration } from './useNarration';
import { useNav } from '@slidev/client';
import MarkdownIt from 'markdown-it';
import { katex } from '@mdit/plugin-katex';
import 'katex/dist/katex.min.css';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import markdown from '../content/chapter-0.md?raw';
import { parseChapter, type SceneEvent } from './content';
import { type LatticeTool } from './lib/geometry';
import { solidGroups, type Solid } from './lib/solids';
import { features, latticeTools, SceneHost, type SceneControls } from './scenes';
import { ToolDock } from './labs/ToolDock';
import { useProgress } from './progress';
import { tutorialStart } from './levels';
import assets from './narration-assets.json';

defineEmits<{ office: [] }>();

const chapter = parseChapter(markdown);
const renderMarkdown = new MarkdownIt({ html: false }).use(katex);
const { currentPage, go } = useNav();
const pages = chapter.sections.flatMap(section => section.subsections);
const progress = useProgress();
const lastPage = tutorialStart + pages.length - 1;
const page = computed(() => pages[currentPage.value - tutorialStart] ?? pages[0]);
const step = ref(0);
const beat = computed(() => page.value.beats[step.value] ?? page.value.beats[0]);
const isSolid = computed(() => page.value.scene === 'solids');
const squareIndex = pages.findIndex(item => item.id === 'square-lattice');
const squarePage = tutorialStart + squareIndex;
const matchKey = 'square-lattice:matched';
const matched = computed(() => progress.completed.includes(matchKey));
const dockHost = ref<HTMLDivElement>();
const audioFiles: Record<string, { file: string; text: string }> = assets;
const audioUrl = computed(() => {
  const narration = beat.value.narration;
  const clip = narration && audioFiles[narration.id];
  return clip && clip.text === narration.text ? `${import.meta.env.BASE_URL}narration/${clip.file}` : undefined;
});
const panel = ref<HTMLDivElement>();
const { audio, playing, muted, failed: audioFailed, play, stop: stopAudio } = useNarration();
const tool = ref<LatticeTool>();
const solid = ref<Solid>('Cube');
const hint = ref('');
const subtitles = ref(false);
const transcript = ref(false);
let host: SceneHost | undefined;
let controls: SceneControls | undefined;
let generation = 0;
let dock: ToolDock | undefined;

function chooseTool(value: LatticeTool) {
  tool.value = value;
  controls?.use(value);
  if (panel.value) panel.value.inert = false;
  dock?.update(value, beat.value.cue);
}

function locked(destination: number) {
  return squareIndex >= 0 && destination > squarePage && destination <= lastPage && !matched.value;
}

function syncBeat() {
  dock?.update(tool.value, beat.value.cue);
  if (beat.value.wait === 'matched' && page.value.id === 'square-lattice' && matched.value) {
    advance();
    return;
  }
}

function loadPage() {
  if (locked(currentPage.value)) {
    void go(squarePage);
    return;
  }
  const activeGeneration = ++generation;
  stopAudio();
  step.value = 0;
  hint.value = '';
  tool.value = undefined;
  dock?.destroy();
  progress.mark('visited', page.value.id);
  controls = host?.mount(page.value.scene, event => {
    if (activeGeneration === generation) onSceneEvent(event);
  }, value => {
    if (activeGeneration === generation) hint.value = value;
  });
  controls?.configure(beat.value.tools);
  if (isSolid.value && solid.value !== 'Cube') controls?.choose(solid.value);
  if (panel.value) panel.value.inert = !isSolid.value;
  if (dockHost.value) {
    dock = new ToolDock(dockHost.value, isSolid.value ? ['rotate', 'reflect'] : latticeTools, chooseTool);
    dock.update(tool.value, beat.value.cue);
  }
}

function onSceneEvent(event: SceneEvent) {
  if (event === 'matched' && page.value.id === 'square-lattice') progress.mark('completed', matchKey);
  if (beat.value.wait !== event) return;
  progress.mark('completed', `${page.value.id}:${event}`);
  advance();
}

function advance() {
  if (step.value + 1 < page.value.beats.length) {
    stopAudio();
    step.value++;
    hint.value = '';
    // Renderer callbacks may still be unwinding their current interaction.
    void nextTick(syncBeat);
  } else if (currentPage.value < lastPage) {
    go(currentPage.value + 1);
  }
}

function ended(event: Event) {
  if (event.target !== audio.value) return;
  playing.value = false;
  if (beat.value.narration?.auto && !muted.value) advance();
}

function jump(id: string) {
  const destination = pages.findIndex(item => item.id === id) + tutorialStart;
  if (locked(destination)) return;
  if (destination === currentPage.value) {
    const previous = audio.value;
    loadPage();
    void nextTick(() => { if (audio.value === previous) void play(); });
  } else go(destination);
}

function changeSolid(event: Event) {
  solid.value = (event.target as HTMLSelectElement).value as Solid;
  controls?.choose(solid.value);
}

onMounted(() => {
  if (!panel.value) return;
  host = new SceneHost(panel.value);
  loadPage();
});
watch(currentPage, loadPage, { flush: 'sync' });
onBeforeUnmount(() => {
  generation++;
  dock?.destroy();
  host?.dispose();
});
</script>

<template>
  <Teleport to="body">
  <main class="tutorial" @keydown.stop>
    <header class="tutorial-header">
      <div class="tutorial-brand">
        <button type="button" @click="$emit('office')">← Office</button>
        <h1>{{ chapter.title }}</h1>
      </div>
      <nav aria-label="Tutorial sections">
        <div v-for="section in chapter.sections" :key="section.id" class="section">
          <button class="section-title" :disabled="locked(pages.indexOf(section.subsections[0]) + tutorialStart)" @click="jump(section.subsections[0].id)">{{ section.title }}</button>
          <div class="section-dots">
            <button v-for="item in section.subsections" :key="item.id" class="dot"
              :aria-label="item.title" :title="item.title" :aria-current="page.id === item.id ? 'step' : undefined"
              :disabled="locked(pages.indexOf(item) + tutorialStart)" :class="{ visited: progress.visited.includes(item.id) }" @click="jump(item.id)"><span /></button>
          </div>
        </div>
      </nav>
    </header>

    <section class="lesson" :aria-label="page.title">
      <div class="lesson-title">
        <h2>{{ page.title }}</h2>
        <div class="tools" aria-label="Scene tools">
          <template v-if="isSolid">
            <template v-for="feature in features" :key="feature">
              <button v-if="beat.tools.includes(feature)" @click="controls?.pick(feature)">Select {{ feature }}</button>
            </template>
            <label>
              Solid
              <select :value="solid" @change="changeSolid">
                <optgroup v-for="group in solidGroups" :key="group.solids[0]" :label="group.label">
                  <option v-for="name in group.solids" :key="name">{{ name }}</option>
                </optgroup>
              </select>
            </label>
            <button @click="controls?.resetView()">Reset view</button>
          </template>
          <button @click="controls?.reset()">Reset scene</button>
        </div>
      </div>
      <div class="scene-frame">
        <div ref="panel" class="scene" :data-scene="page.scene"></div>
        <div ref="dockHost" class="transform-dock"></div>
        <p v-if="hint" class="scene-hint" role="status">{{ hint }}</p>
      </div>
    </section>

    <footer class="guide">
      <div v-if="beat.display" class="prompt" v-html="renderMarkdown.render(beat.display)"></div>
      <p v-if="beat.narration && (transcript || subtitles && playing || audioFailed || !audioUrl)" class="transcript">
        {{ beat.narration.text }}
      </p>
      <div class="guide-actions">
        <div v-if="beat.narration" class="audio-actions" aria-label="Narration">
          <audio v-if="audioUrl" :key="audioUrl" ref="audio" :src="audioUrl" :muted="muted" preload="metadata"
            @playing="playing = true" @pause="playing = false" @ended="ended" @error="audioFailed = true"></audio>
          <button v-if="audioUrl" @click="playing ? audio?.pause() : play()">{{ playing ? 'Pause voiceover' : 'Play voiceover' }}</button>
          <button v-if="audioUrl" @click="play(true)">Replay</button>
          <button v-if="audioUrl" :aria-pressed="muted" @click="muted = !muted">{{ muted ? 'Unmute' : 'Mute' }}</button>
          <button :aria-pressed="subtitles" @click="subtitles = !subtitles">Subtitles</button>
          <button :aria-pressed="transcript" @click="transcript = !transcript">Transcript</button>
          <span v-if="audioFailed || !audioUrl" role="status">Voiceover unavailable</span>
        </div>
        <button class="continue" :disabled="!!beat.wait || currentPage === lastPage && step + 1 === page.beats.length"
          @click="advance">{{ currentPage === lastPage && step + 1 === page.beats.length ? 'Tutorial complete' : 'Continue' }}</button>
      </div>
    </footer>
  </main>
  </Teleport>
</template>
