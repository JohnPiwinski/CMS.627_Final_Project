<script setup lang="ts">
import { useNav } from '@slidev/client';
import { levelPage, wilsonSolutionPage } from '../levels';
import tutorialSource from '../../content/chapter-0.md?raw';
import { useNarration } from '../useNarration';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import markdown from '../../content/group-theory.md?raw';
import { parseChapter } from '../content';
import assets from '../narration-assets.json';
import ChapterScene from './ChapterScene.vue';

const emit = defineEmits<{ office: []; explore: [] }>();
const chapter = parseChapter(markdown, 'content/group-theory.md');
const pages = chapter.sections.flatMap(section => section.subsections);
const { currentPage, go } = useNav();
const tutorialCount = parseChapter(tutorialSource).sections.flatMap(section => section.subsections).length;
const solutionRoute = wilsonSolutionPage(tutorialCount);
const challengeIndex = pages.findIndex(page => page.id === 'wilson-theorem');
const onSolutionRoute = currentPage.value === solutionRoute;
const index = ref(onSolutionRoute ? challengeIndex : 0);
const step = ref(onSolutionRoute ? 1 : 0);
const page = computed(() => pages[index.value]);
const beat = computed(() => page.value.beats[step.value]);
const solution = computed(() => index.value === challengeIndex && step.value === 1);
const challenge = computed(() => index.value === challengeIndex && step.value === 0);
const definition = computed(() => page.value.id === 'group-definition' || solution.value);
const visited = ref(new Set([pages[0].id]));
const { audio, playing, muted, failed, play, stop } = useNarration();
const transcript = ref(false);
const subtitles = ref(false);
const resetKey = ref(0);
const files: Record<string, { file: string; text: string }> = assets;
const src = computed(() => {
  const narration = beat.value.narration;
  const clip = narration && files[narration.id];
  return clip && clip.text === narration.text ? import.meta.env.BASE_URL + 'narration/' + clip.file : undefined;
});
function jump(destination: number, nextStep = 0) {
  const previous = audio.value;
  stop();
  index.value = destination;
  step.value = nextStep;
  visited.value.add(page.value.id);
  if (solution.value && currentPage.value !== solutionRoute) void go(solutionRoute);
  else if (!solution.value && currentPage.value === solutionRoute) void go(levelPage('intro', tutorialCount));
  void nextTick(() => { if (audio.value === previous) void play(); });
  void nextTick(() => document.querySelector('.chapter-one .dot[aria-current]')?.scrollIntoView({ inline: 'nearest', block: 'nearest' }));
}
const endOfPage = computed(() => step.value + 1 === page.value.beats.length);
const complete = computed(() => endOfPage.value && page.value.id === 'quotient-groups');
const last = computed(() => endOfPage.value && index.value === pages.length - 1);
function advance() {
  if (!endOfPage.value) jump(index.value, step.value + 1);
  else if (!last.value) jump(index.value + 1);
  else emit('office');
}

watch(currentPage, (route, previous) => {
  if (route === solutionRoute && !solution.value) jump(challengeIndex, 1);
  else if (previous === solutionRoute && solution.value && route === levelPage('intro', tutorialCount)) jump(challengeIndex);
});
watch(definition, value => document.body.classList.toggle('show-group-slide', value), { immediate: true });
onBeforeUnmount(() => {
  document.body.classList.remove('show-group-slide');
});
</script>

<template>
  <Teleport to="body">
    <main class="tutorial chapter-one" :class="{ 'chapter-definition': definition }" @keydown.stop>
      <header class="tutorial-header">
        <div class="tutorial-brand"><button @click="emit('office')">← Office</button><h1>{{ chapter.title }}</h1></div>
        <nav aria-label="Chapter sections">
          <div v-for="section in chapter.sections" :key="section.id" class="section">
            <button class="section-title" @click="jump(pages.indexOf(section.subsections[0]))">{{ section.title }}</button>
            <div class="section-dots">
              <button v-for="item in section.subsections" :key="item.id" class="dot" :title="item.title"
                :aria-label="item.title" :aria-current="page.id === item.id ? 'step' : undefined"
                :class="{ visited: visited.has(item.id) }" @click="jump(pages.indexOf(item))"><span /></button>
            </div>
          </div>
        </nav>
      </header>
      <section class="lesson" :aria-label="page.title">
        <div class="lesson-title">
          <h2>{{ solution ? "Wilson’s theorem solution" : page.title }}</h2>
          <div class="tools"><button v-if="!definition" @click="resetKey++">Reset scene</button></div>
        </div>
        <div class="scene-frame">
          <ChapterScene v-if="!definition" :key="page.id + ':' + step + ':' + resetKey"
            :id="page.id" :step="step" :demo="playing && !muted" @solution="jump(challengeIndex, 1)" />
        </div>
      </section>
      <footer class="guide">
        <p v-if="beat.narration && (transcript || subtitles && playing || failed)" class="transcript">{{ beat.narration.text }}</p>
        <div class="guide-actions">
          <div v-if="beat.narration" class="audio-actions" aria-label="Narration">
            <audio v-if="src" :key="src" ref="audio" :src="src" :muted="muted" preload="metadata"
              @playing="playing = true" @pause="playing = false" @ended="playing = false" @error="failed = true"></audio>
            <button v-if="src" @click="playing ? audio?.pause() : play()">{{ playing ? 'Pause voiceover' : 'Play voiceover' }}</button>
            <button v-if="src" @click="play(true)">Replay</button>
            <button v-if="src" :aria-pressed="muted" @click="muted = !muted">{{ muted ? 'Unmute' : 'Mute' }}</button>
            <button :aria-pressed="subtitles" @click="subtitles = !subtitles">Subtitles</button>
            <button :aria-pressed="transcript" @click="transcript = !transcript">Transcript</button>
          </div>
          <button v-if="complete" @click="emit('explore')">Explore more</button>
          <button v-if="complete" @click="emit('office')">Finish chapter</button>
          <button v-if="!challenge" class="continue" @click="advance">{{ complete ? 'Bonus lessons' : last ? 'Finish chapter' : 'Continue' }}</button>
        </div>
      </footer>
    </main>
  </Teleport>
</template>

<style>
.chapter-one .lesson-title { background: #121a1b; }
.chapter-one .lesson-title h2 { white-space: normal; }
.chapter-one .guide { background: #121a1b; }
.chapter-one.chapter-definition { background: transparent; }
.chapter-one.chapter-definition .tutorial-header { background: #121a1b; }
</style>
