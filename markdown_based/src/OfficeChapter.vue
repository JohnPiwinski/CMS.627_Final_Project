<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import legacyStyles from '../../interactive-artin-ch0/src/styles.css?raw';
import { levels, type ChapterId } from './levels';
import { officeImage, officeSize, shieldCrop } from './office-art';

const props = defineProps<{ chapter: Exclude<ChapterId, 'intro'> }>();
defineEmits<{ office: [] }>();
const title = levels.find(level => level.id === props.chapter)?.title;
const mount = ref<HTMLElement>();
const phase = ref<'loading' | 'ready' | 'failed'>('loading');
const styles = '@scope (.office-chapter) {' + legacyStyles.replace(':root', ':scope') + '}';
let lab: { destroy(): void } | undefined;
let generation = 0;

async function start() {
  const id = ++generation;
  phase.value = 'loading';
  try {
    if (props.chapter === 'orbit') {
      const { OrbitLab } = await import('../../interactive-artin-ch0/src/labs/OrbitLab');
      if (id === generation && mount.value) lab = new OrbitLab(mount.value);
    } else {
      const { WallpaperLab } = await import('../../interactive-artin-ch0/src/labs/WallpaperLab');
      if (id === generation && mount.value) lab = new WallpaperLab(mount.value);
    }
    if (id === generation) phase.value = 'ready';
  } catch {
    if (id === generation) phase.value = 'failed';
  }
}

onMounted(start);
onBeforeUnmount(() => { generation++; lab?.destroy(); });

</script>

<template>
  <Teleport to="body">
    <main class="office-chapter">
      <component :is="'style'" v-text="styles" />
      <div class="office-chapter-inner">
        <header class="office-chapter-header">
          <button type="button" class="secondary-button" @click="$emit('office')">← Office</button>
          <h1>{{ title }}</h1>
        </header>
        <section v-if="chapter === 'wallpaper'" class="object-lesson" aria-label="Fleur-de-lis and mirror symmetry">
          <figure class="shield-closeup" :style="{ aspectRatio: shieldCrop.width + ' / ' + shieldCrop.height }">
            <img :src="officeImage" alt="Gold fleur-de-lis on a dark heraldic shield"
              :style="{ width: officeSize.width / shieldCrop.width * 100 + '%',
                left: -shieldCrop.x / shieldCrop.width * 100 + '%',
                top: -shieldCrop.y / shieldCrop.height * 100 + '%' }">
          </figure>
          <div>
            <h2>From one motif to a repeating pattern</h2>
            <p>Imagine a vertical mirror through the center of the fleur-de-lis. Its left and right sides nearly match. Repeat a motif across a plane and you can look for symmetries of the entire pattern, including translations, rotations, reflections, and glide reflections.</p>
          </div>
        </section>
        <p v-if="phase === 'loading'" role="status">Opening chapter…</p>
        <div v-else-if="phase === 'failed'" role="alert">
          <p>This chapter couldn’t open.</p><button type="button" class="secondary-button" @click="start">Try again</button>
        </div>
        <div ref="mount">
          <template v-if="chapter === 'orbit'">
            <div class="content-grid orbit-workspace">
              <section class="workspace" aria-label="Interactive solid">
                <div id="orbit-view" class="visual-host is-three"></div>
                <div class="workspace-bottom"><span id="orbit-hint" class="workspace-hint" aria-live="polite"></span></div>
              </section>
              <aside id="orbit-controls" class="control-panel" aria-label="Investigation controls"></aside>
            </div>
            <section id="orbit-notes" class="narration-panel orbit-notes" aria-label="Investigation notebook"></section>
          </template>
        </div>
      </div>
    </main>
  </Teleport>
</template>
