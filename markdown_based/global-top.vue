<script setup lang="ts">
import { lockShortcuts, useNav } from '@slidev/client';
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import markdown from './content/chapter-0.md?raw';
import { parseChapter } from './src/content';
import { levelPage, officePage, pageLevel, type LevelId } from './src/levels';
import Office from './src/Office.vue';
import TitleScreen from './src/TitleScreen.vue';
import HallwayScreen from './src/HallwayScreen.vue';

const Tutorial = defineAsyncComponent(() => import('./src/Tutorial.vue'));
const ClockLesson = defineAsyncComponent(() => import('./src/ClockLesson.vue'));
const Wallpaper = defineAsyncComponent(() => import('./src/WallpaperChapter.vue'));
const Chapter = defineAsyncComponent(() => import('./src/OrbitChapter.vue'));
const tutorialCount = parseChapter(markdown).sections.reduce((count, section) => count + section.subsections.length, 0);
const { currentPage, go } = useNav();
const level = computed(() => pageLevel(currentPage.value, tutorialCount));
const screen = ref<'title' | 'hallway' | 'office'>('title');
let unlock: (() => void) | undefined;
onMounted(() => { unlock = lockShortcuts(); });
onBeforeUnmount(() => unlock?.());

function open(id: LevelId) { void go(levelPage(id, tutorialCount)); }
function returnToOffice() { screen.value = 'office'; void go(officePage); }
</script>

<template>
  <TitleScreen v-if="!level && screen === 'title'" @play="screen = 'hallway'" />
  <HallwayScreen v-else-if="!level && screen === 'hallway'"
    @office="screen = 'office'" @title="screen = 'title'" />
  <Office v-else-if="!level" @open="open" @hallway="screen = 'hallway'" />
  <Tutorial v-else-if="level === 'tutorial'" @office="returnToOffice" />
  <ClockLesson v-else-if="level === 'intro'" @office="returnToOffice" />
  <Wallpaper v-else-if="level === 'wallpaper'" @office="returnToOffice" />
  <Chapter v-else :key="level" @office="returnToOffice" />
</template>
