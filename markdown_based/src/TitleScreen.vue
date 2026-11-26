<script setup lang="ts">
import { iaaaLogo, libraryTitleBackground } from './menu-art';

defineEmits<{ play: [] }>();
</script>

<template>
  <Teleport to="body">
    <main class="title-screen">
      <img class="title-screen-art" :src="libraryTitleBackground" alt="" draggable="false">
      <div class="title-screen-wash">
        <div class="title-card">
          <img class="title-logo" :src="iaaaLogo" alt="IAAA" draggable="false">
          <h1><span>Interactive Accompaniment</span><span>to Art and Algebra</span></h1>
          <div class="title-play-target">
            <button class="title-play-hitbox" type="button" aria-label="Play" @click="$emit('play')"></button>
            <span class="title-play-visual" aria-hidden="true">Play <span>→</span></span>
          </div>
        </div>
      </div>
    </main>
  </Teleport>
</template>
