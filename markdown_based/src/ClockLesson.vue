<script setup lang="ts">
import { ref } from 'vue';
import GuidedClock from './group/GuidedClock.vue';
import ClockCanvas from './group/ClockCanvas.vue';
import SquareCanvas from './group/SquareCanvas.vue';
import ElementBoard from './group/ElementBoard.vue';

defineEmits<{ office: [] }>();
const guided = ref(true);

const stations = [
  { id: 'start', title: 'Start' },
  { id: 'clock', title: 'Clock' },
  { id: 'square', title: 'Square' },
  { id: 'rules', title: 'Group rules' },
  { id: 'subgroups', title: 'Subgroups' },
  { id: 'cosets', title: 'Cosets' },
  { id: 'normality', title: 'Normality' },
  { id: 'quotient', title: 'Bonus · Quotient' },
] as const;
const active = ref<typeof stations[number]['id']>('start');
</script>

<template>
  <GuidedClock v-if="guided" @office="$emit('office')" @explore="guided = false" />
  <Teleport v-else to="body">
    <main class="clock-lesson" @keydown.stop>
      <header class="group-header">
        <button type="button" @click="$emit('office')">← Office</button>
        <h1>Introductory Group Theory</h1>
        <nav aria-label="Group theory activities">
          <button v-for="station in stations" :key="station.id" type="button"
            :aria-current="active === station.id ? 'step' : undefined" @click="active = station.id">{{ station.title }}</button>
        </nav>
      </header>

      <div v-if="active === 'start'" class="group-opening">
        <h2>What is a group?</h2>
        <p>A group is a set with an operation that combines two elements to make another element of the set. The operation is associative, there is an identity, and every element has an inverse.</p>
        <button type="button" @click="active = 'clock'">Open the clock</button>
      </div>
      <ClockCanvas v-else-if="active === 'clock'" />
      <SquareCanvas v-else-if="active === 'square' || active === 'rules'" :rules="active === 'rules'" />
      <ElementBoard v-else :key="active" :mode="active" />
    </main>
  </Teleport>
</template>

<style>
.clock-lesson {
  position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; overflow: auto;
  background: #15211d; color: #f6eedb; font-family: system-ui, sans-serif;
}
.clock-lesson .group-header, .clock-lesson .group-topline, .clock-lesson .group-dock {
  display: flex; align-items: center; flex-wrap: wrap; gap: .45rem .65rem;
}
.clock-lesson .group-header { padding: .5rem clamp(.65rem, 2vw, 1.75rem); background: #1d2c26; border-bottom: 1px solid #466356; }
.clock-lesson .group-header h1 { margin: 0; font: 600 clamp(1rem, 2.1vw, 1.6rem) Georgia, serif; }
.clock-lesson nav { display: flex; gap: .25rem; overflow-x: auto; max-width: 100%; margin-left: auto; padding: .2rem; }
.clock-lesson nav button { flex: 0 0 auto; white-space: nowrap; }
.clock-lesson button, .clock-lesson select {
  font: inherit; font-size: .875rem; color: inherit; background: #293f34; border: 1px solid #638474;
  border-radius: .45rem; padding: .38rem .62rem; cursor: pointer;
}
.clock-lesson button[aria-current], .clock-lesson button[aria-pressed="true"], .group-opening button {
  color: #1b261e; background: #e8bd75; border-color: #e8bd75;
}
.clock-lesson button:focus-visible, .clock-lesson input:focus-visible, .clock-lesson select:focus-visible {
  outline: 2px solid #e8bd75; outline-offset: 2px;
}
.clock-lesson button:disabled { opacity: .5; cursor: default; }
.clock-lesson label { color: #e0e9db; display: inline-flex; align-items: center; gap: .35rem; font-size: .86rem; }
.clock-lesson input[type=range] { width: clamp(3.25rem, 11vw, 8rem); accent-color: #e8bd75; }
.clock-lesson .group-opening { margin: auto; padding: 1.4rem; max-width: 34rem; }
.clock-lesson h2 { font: 600 clamp(1.2rem, 3vw, 1.9rem) Georgia, serif; margin: 0; }
.clock-lesson .group-opening p { line-height: 1.55; }
.clock-lesson .group-workbench {
  flex: 1; display: grid; grid-template-rows: auto minmax(min(16rem, 47vw), 1fr) auto auto; justify-items: center;
  padding: .65rem clamp(.4rem, 2vw, 1.35rem) .8rem;
}
.clock-lesson .group-topline { justify-content: space-between; width: min(100%, 66rem); }
.clock-lesson .group-viewport { width: 100%; min-height: 0; display: grid; place-items: center; container-type: size; }
.clock-lesson .group-canvas {
  width: min(100cqw, 77rem, calc(100cqh * 800 / 520));
  height: min(calc(100cqw * 520 / 800), calc(77rem * 520 / 800), 100cqh);
  min-height: 0; overflow: hidden; touch-action: none; cursor: grab;
  background: radial-gradient(ellipse at 50% 46%, #21382e 0, #17261f 58%, transparent 77%);
}
.clock-lesson .group-canvas:active { cursor: grabbing; }
.clock-lesson .group-dock { justify-content: center; margin: 0 auto; padding: .45rem .65rem; background: #1d3027;
  border: 1px solid #455e52; border-radius: 1rem; max-width: 100%; }
.clock-lesson .group-caption { width: min(100%, 64rem); min-height: 3.8rem; text-align: center; padding-top: .55rem; font-size: .94rem; }
.clock-lesson .group-caption strong { color: #f0cb91; }
.clock-lesson .group-caption p { margin: .25rem auto 0; max-width: 55rem; line-height: 1.37; }
@media (max-width: 740px) {
  .clock-lesson nav { width: 100%; margin-left: 0; }
}
</style>
