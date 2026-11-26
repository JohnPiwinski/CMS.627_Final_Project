<script setup lang="ts">
import { useNarration } from './useNarration';
import { computed, nextTick, ref, watch } from 'vue';
import WallpaperExplorer from './group/WallpaperExplorer.vue';
import { wallpapers } from '../../interactive-artin-ch0/src/lib/wallpaper';
import { sourceCell } from './lib/wallpaper-explorer';
import markdown from '../content/wallpaper.md?raw';
import { parseChapter } from './content';
import assets from './narration-assets.json';

defineEmits<{ office: [] }>();
const chapter = parseChapter(markdown, 'content/wallpaper.md');
const pages = chapter.sections.flatMap(s => s.subsections);
const index = ref(0);
const page = computed(() => pages[index.value]);
const visits = ref(new Set([pages[0].id]));
const { audio, playing, muted, failed, play, stop } = useNarration();
const transcript = ref(false);
const subtitles = ref(false);
const group = ref('pm');
const gallery = ref(false);
const reference = ref(false);
const photograph = ref<string>();
const selected = ref<string>();
const placements = ref<Record<string,string>>({});
const results = ref<Record<string,boolean>>();
const enlarged = ref<string>();
const ids = wallpapers.map(spec => spec.id);
const files: Record<string, { text: string; file: string }> = assets;
const beat = computed(() => page.value.beats[0]);
const narration = computed(() => beat.value.narration);
const clip = computed(() => {
  const voice = narration.value;
  const file = voice && files[voice.id];
  return file && file.text === voice.text ? import.meta.env.BASE_URL + 'narration/' + file.file : undefined;
});
const spec = computed(() => wallpapers.find(p => p.id === group.value) ?? wallpapers[0]);
const photoURL = (id: string) => import.meta.env.BASE_URL + 'wallpaper-crops/' + id + '.png';
const matching = computed(() => page.value.scene === 'wallpaper-matching');
const galleryPage = computed(() => page.value.scene === 'wallpaper-gallery');
const order = ref<string[]>([]);
function shuffle() {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i],next[j]] = [next[j],next[i]];
  }
  order.value = next;
}
shuffle();
function jump(next: number) {
  const previous = audio.value;
  stop();
  photograph.value = enlarged.value = undefined;
  index.value = next;
  visits.value.add(page.value.id);
  gallery.value = galleryPage.value;
  reference.value = false;
  group.value = ({ 'wallpaper-rotation-reflection': 'p4', 'wallpaper-glide-reflection': 'pg' } as Record<string,string>)[page.value.id] ?? 'pm';
  void nextTick(() => { if (audio.value === previous) void play(); });
}
function practiceRotation() {
  jump(pages.findIndex(item => item.id === 'wallpaper-rotation-reflection'));
}

function explore(id: string) {
  group.value = id;
  reference.value = matching.value;
  gallery.value = false;
}
function inspect(id: string) {
  photograph.value = id;
  enlarged.value = undefined;
}
function place(target: string, id = selected.value) {
  if (!id || !ids.includes(id)) return;
  const oldTarget = ids.find(key => placements.value[key] === id);
  const replaced = placements.value[target];
  if (oldTarget && oldTarget !== target) {
    if (replaced) placements.value[oldTarget] = replaced;
    else delete placements.value[oldTarget];
  }
  placements.value[target] = id;
  selected.value = undefined;
  results.value = undefined;
}
function drop(target: string, event: DragEvent) {
  place(target,event.dataTransfer?.getData('text/plain'));
}
function returnCrop(target: string) {
  delete placements.value[target];
  results.value = undefined;
}
function check() {
  results.value = Object.fromEntries(ids.filter(id => placements.value[id]).map(id => [id,placements.value[id] === id]));
}
const count = computed(() => Object.values(results.value ?? {}).filter(Boolean).length);
const tray = computed(() => order.value.filter(id => !Object.values(placements.value).includes(id)));
const thumbnails = Object.fromEntries(wallpapers.map(pattern => {
  const { basis, layers } = sourceCell(pattern.id);
  const paths = [];
  for (let i = -3; i <= 4; i++) for (let j = -3; j <= 4; j++) {
    const x = basis[0]*i + basis[1]*j;
    const y = basis[2]*i + basis[3]*j;
    for (const {fill,rings} of (layers.length === 1 ? layers : layers.slice(1))) {
      const d = rings.map(ring => 'M' + ring.map(p => (p.x+x) + ',' + (p.y+y)).join(' L') + ' Z').join(' ');
      paths.push({fill,d,stroke:layers.length === 1 ? '#527b9d' : undefined});
    }
  }
  return [pattern.id,{base:layers[0].fill,paths}];
}));

watch(() => page.value.id, () => {
  requestAnimationFrame(() => document.querySelector('.wallpaper-chapter .dot[aria-current]')?.scrollIntoView({ block:'nearest', inline:'nearest' }));
});
</script>

<template>
  <Teleport to="body">
    <main class="tutorial wallpaper-chapter" @keydown.stop>
      <header class="tutorial-header">
        <div class="tutorial-brand"><button @click="$emit('office')">← Office</button><h1>{{ chapter.title }}</h1></div>
        <nav aria-label="Wallpaper sections">
          <div v-for="section in chapter.sections" :key="section.id" class="section">
            <button class="section-title" @click="jump(pages.indexOf(section.subsections[0]))">{{ section.title }}</button>
            <div class="section-dots">
              <button v-for="sub in section.subsections" :key="sub.id" class="dot"
                :aria-label="sub.title" :title="sub.title" :aria-current="page.id === sub.id ? 'step' : undefined"
                :class="{visited:visits.has(sub.id)}" @click="jump(pages.indexOf(sub))"><span /></button>
            </div>
          </div>
        </nav>
      </header>
      <section class="lesson" :aria-label="page.title">
        <div class="lesson-title"><h2>{{ photograph ? 'Inspect decorative wallpaper' : page.title }}</h2>
          <div class="tools">
            <button v-if="photograph" @click="photograph = undefined">Back to matches</button>
            <button v-else-if="galleryPage && !gallery" @click="gallery = true">Back to gallery</button>
            <button v-else-if="matching" @click="gallery = !gallery && !reference; reference = false">{{ gallery || reference ? 'Back to matches' : 'Reference gallery' }}</button>
            <template v-if="page.id === 'wallpaper-rotation-reflection' || page.id === 'wallpaper-glide-reflection'">
              <button v-for="id in (page.id === 'wallpaper-rotation-reflection' ? ['p4','p4m','p6','p6m'] : ['pg','pm'])"
                :key="id" :aria-pressed="group === id" @click="group = id">{{ id }}</button>
            </template>
          </div>
        </div>
        <div class="scene-frame">
          <WallpaperExplorer v-if="photograph" :key="photograph" :pattern="wallpapers[0]" :photo="photoURL(photograph)" />
          <div v-else-if="gallery" class="scene wallpaper-boards">
            <div class="wallpaper-gallery">
              <button v-for="item in wallpapers" :key="item.id" class="pattern-tile" @click="explore(item.id)">
                <svg viewBox="0 0 2 1.3" aria-hidden="true"><rect width="2" height="1.3" :fill="thumbnails[item.id].base" />
                  <path v-for="(path, i) in thumbnails[item.id].paths" :key="i" :d="path.d" :fill="path.fill" :stroke="path.stroke" stroke-width=".025" />
                </svg>
                <strong>{{ item.id }}</strong>
              </button>
            </div>
          </div>
          <div v-else-if="matching && !gallery && !reference" class="scene wallpaper-boards matching-board">
            <div class="match-targets">
              <article v-for="id in ids" :key="id" class="match-tile" @dragover.prevent @drop.prevent="drop(id,$event)">
                <button class="pattern-tile" :aria-label="'Match to ' + id" @click="selected ? place(id) : enlarged = id">
                  <svg viewBox="0 0 2 1.3" aria-hidden="true"><rect width="2" height="1.3" :fill="thumbnails[id].base" />
                  <path v-for="(path, i) in thumbnails[id].paths" :key="i" :d="path.d" :fill="path.fill" :stroke="path.stroke" stroke-width=".025" />
                  </svg>
                  {{ id }}
                </button>
                <template v-if="placements[id]">
                  <button class="placed-crop" draggable="true" @dragstart="$event.dataTransfer?.setData('text/plain',placements[id])"
                    :aria-label="'Select crop ' + (order.indexOf(placements[id])+1)" @click="selected = placements[id]" :aria-pressed="selected === placements[id]">
                    <img :src="photoURL(placements[id])" alt="" draggable="false">
                  </button>
                  <button @click="inspect(placements[id])">Inspect</button>
                  <button @click="returnCrop(id)">Return</button>
                </template>
                <span v-if="results && id in results" :class="{correct:results[id]}">{{ results[id] ? 'Correct' : 'Try again' }}</span>
              </article>
            </div>
            <div class="crop-tray" aria-label="Decorative wallpaper tray">
              <article v-for="id in tray" :key="id">
                <button draggable="true" :aria-pressed="selected === id" :aria-label="'Select crop ' + (order.indexOf(id)+1)"
                  @click="selected = selected === id ? undefined : id" @dragstart="$event.dataTransfer?.setData('text/plain',id)">
                  <img :src="photoURL(id)" alt="" draggable="false">
                </button>
                <button @click="inspect(id)" :aria-label="'Inspect crop ' + (order.indexOf(id)+1)">Inspect</button>
              </article>
            </div>
            <div class="match-actions"><button @click="check">Check matches</button>
              <button @click="placements = {}; results = undefined; selected = undefined; shuffle()">Reset matches</button>
              <span role="status">{{ results ? count + ' of 17 correct' : Object.keys(placements).length + ' of 17 placed' }}</span>
            </div>
          </div>
          <WallpaperExplorer v-else :key="page.id + group" :pattern="spec"
            :orbit="page.id === 'wallpaper-orbits' || galleryPage || reference"
            :initial-tool="page.id === 'wallpaper-rotation-reflection' ? 'rotate' : undefined"
            @practice-rotation="practiceRotation" />
          <div v-if="enlarged" class="match-preview" role="dialog" aria-label="Enlarged abstract pattern">
            <button @click="enlarged = undefined">Close</button>
            <svg viewBox="0 0 2 1.3" aria-hidden="true"><rect width="2" height="1.3" :fill="thumbnails[enlarged].base" />
                  <path v-for="(path, i) in thumbnails[enlarged].paths" :key="i" :d="path.d" :fill="path.fill" :stroke="path.stroke" stroke-width=".025" />
            </svg>
            <strong>{{ enlarged }}</strong>
          </div>
        </div>
      </section>
      <footer class="guide">
        <p v-if="narration && (transcript || subtitles && playing || failed || !clip)" class="transcript">{{ narration.text }}</p>
        <div class="guide-actions">
          <div v-if="narration" class="audio-actions" aria-label="Narration">
            <audio v-if="clip" :key="clip" ref="audio" :src="clip" :muted="muted" preload="metadata"
              @playing="playing = true" @pause="playing = false" @ended="playing = false" @error="failed = true" />
            <button v-if="clip" @click="playing ? audio?.pause() : play()">{{ playing ? 'Pause voiceover' : 'Play voiceover' }}</button>
            <button v-if="clip" @click="play(true)">Replay</button>
            <button v-if="clip" :aria-pressed="muted" @click="muted = !muted">{{ muted ? 'Unmute' : 'Mute' }}</button>
            <button :aria-pressed="subtitles" @click="subtitles = !subtitles">Subtitles</button>
            <button :aria-pressed="transcript" @click="transcript = !transcript">Transcript</button>
          </div>
          <button class="continue" @click="index + 1 < pages.length ? jump(index+1) : $emit('office')">{{ index + 1 < pages.length ? 'Continue' : 'Finish chapter' }}</button>
        </div>
      </footer>
    </main>
  </Teleport>
</template>

<style>
.wallpaper-chapter .lesson-title h2 { white-space: normal; }
.wallpaper-boards { overflow:auto; padding:.75rem; }
.wallpaper-gallery,.match-targets { display:grid; grid-template-columns:repeat(auto-fit,minmax(105px,1fr)); gap:.55rem; }
.wallpaper-chapter .pattern-tile { width:100%; display:grid; gap:.3rem; text-align:center; background:#20302f; color:#e8f1ee; }
.pattern-tile svg,.match-preview svg { width:100%; display:block; border-radius:.3rem; }
.matching-board { display:flex; flex-direction:column; gap:.55rem; }
.match-targets { overflow:auto; flex:1; }
.match-tile,.crop-tray article { min-width:0; display:grid; align-content:start; gap:.24rem; }
.match-tile button,.crop-tray button { font-size:.82rem; }
.match-tile span { color:#802526; }
.match-tile span.correct { color:#245747; }
.crop-tray { display:flex; gap:.4rem; overflow:auto; }
.crop-tray article { flex:0 0 5.1rem; }
.crop-tray img,.placed-crop img { width:100%; height:3.6rem; object-fit:contain; display:block; }
.match-actions { display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
.match-preview { position:absolute; z-index:3; inset:.5rem; display:grid; grid-template-rows:auto minmax(0,1fr) auto; justify-items:center; gap:.4rem; padding:.5rem; background:#20302f; }
.match-preview svg { height:100%; }
</style>
