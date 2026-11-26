<script setup lang="ts">
import { hallwayWithPortraits } from './menu-art';

defineEmits<{ office: []; title: [] }>();
</script>

<template>
  <Teleport to="body">
    <main class="hallway-screen">
      <div class="hallway-artboard">
        <img class="hallway-art" :src="hallwayWithPortraits"
          alt="A warmly lit university hallway with portraits beside three office doors" draggable="false">
        <span class="hallway-name noether-name">Emmy Noether</span>
        <span class="hallway-name grothendieck-name">Alexander Grothendieck</span>
        <span class="hallway-name hironaka-name">Heisuke Hironaka</span>
        <button class="noether-door-hitbox" type="button" aria-label="Enter Emmy Noether’s office"
          @click="$emit('office')"></button>
      </div>

      <header class="hallway-heading">
        <button class="hallway-back" type="button" @click="$emit('title')">← Title</button>
        <div><span>IAAA · MATHEMATICS FACULTY</span><h1>Choose an office</h1></div>
      </header>

      <nav class="hallway-mobile-list" aria-label="Office selection">
        <button type="button" @click="$emit('office')">
          <strong>Emmy Noether</strong><span>Enter her office →</span>
        </button>
        <div><strong>Alexander Grothendieck</strong><span>Office</span></div>
        <div><strong>Heisuke Hironaka</strong><span>Office</span></div>
      </nav>
      <p class="hallway-hint">Click Emmy Noether’s door to enter her office.</p>
    </main>
  </Teleport>
</template>
