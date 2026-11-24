<script setup lang="ts">
import { lockShortcuts, useNav } from '@slidev/client';
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted } from 'vue';
import markdown from './content/chapter-0.md?raw';
import { parseChapter } from './src/content';
import { levelPage, officePage, pageLevel, type LevelId } from './src/levels';
import Office from './src/Office.vue';

const Tutorial = defineAsyncComponent(() => import('./src/Tutorial.vue'));
const ClockLesson = defineAsyncComponent(() => import('./src/ClockLesson.vue'));
const Chapter = defineAsyncComponent(() => import('./src/OfficeChapter.vue'));
const tutorialCount = parseChapter(markdown).sections.reduce((count, section) => count + section.subsections.length, 0);
const { currentPage, go } = useNav();
const level = computed(() => pageLevel(currentPage.value, tutorialCount));
let unlock: (() => void) | undefined;
onMounted(() => { unlock = lockShortcuts(); });
onBeforeUnmount(() => unlock?.());

function open(id: LevelId) { void go(levelPage(id, tutorialCount)); }
function returnToOffice() { void go(officePage); }
</script>

<template>
  <Office v-if="!level" @open="open" />
  <Tutorial v-else-if="level === 'tutorial'" @office="returnToOffice" />
  <ClockLesson v-else-if="level === 'intro'" @office="returnToOffice" />
  <Chapter v-else :key="level" :chapter="level" @office="returnToOffice" />
</template>
