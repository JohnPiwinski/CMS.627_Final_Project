<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Matrix4, WebGLRenderer } from 'three';
import MarkdownIt from 'markdown-it';
import { katex } from '@mdit/plugin-katex';
import 'katex/dist/katex.min.css';
import manuscript from '../content/orbit-stabilizer.md?raw';
import { parseChapter } from './content';
import { CubeLab } from './labs/CubeLab';
import { ToolDock } from './labs/ToolDock';
import { createRenderer, features } from './scenes';
import { solidGroups, type Solid } from './lib/solids';
import type { Feature } from './lib/features';
import { identify, symmetryGroup, type Symmetry } from './lib/symmetry';
import { useNarration } from './useNarration';
import assets from './narration-assets.json';

const emit = defineEmits<{ office: [] }>();
const chapter = parseChapter(manuscript, 'content/orbit-stabilizer.md');
const pages = chapter.sections.flatMap(s=>s.subsections);
const index = ref(0);
const page = computed(()=>pages[index.value]);
const visitedPages = ref(new Set([pages[0].id]));
const fileMap: Record<string,{file:string;text:string}> = assets;
const voice = computed(()=>page.value.beats[0].narration);
const clip = computed(()=>{
  const recording = voice.value && fileMap[voice.value.id];
  return recording?.text === voice.value?.text && recording ? import.meta.env.BASE_URL+'narration/'+recording.file : undefined;
});
const {audio,playing,muted,failed,play,stop} = useNarration();
const transcript = ref(false);
const subtitles = ref(false);
const surface = ref<HTMLDivElement>();
const dockHost = ref<HTMLDivElement>();
const solid = ref<Solid>('Cube');
const hint = ref('');
const tool = ref<'rotate'|'reflect'>('rotate');
const marking = ref(false);
const mode = computed(()=>page.value.id);
const rotationsOnly = computed(()=>['discover-orbits','discover-stabilizers','rotation-counting','cube-s3','multiple-feature-stabilizer'].includes(mode.value));
const counting = computed(()=>['rotation-counting','full-symmetry-counting'].includes(mode.value));
const discovery = computed(()=>mode.value==='orbit-stabilizer-discovery');
const bonus = computed(()=>mode.value==='cube-s3'||mode.value==='multiple-feature-stabilizer');
const fullTable = ref(false);
const hints = ref(0);
const revealed = ref(false);
const guess = ref('');
const feedback = ref('');
const markdown = new MarkdownIt().use(katex);
const formula = (tex:string)=>markdown.renderInline('$'+tex+'$');
let lab: CubeLab | undefined;
let dock: ToolDock | undefined;
let renderer: ReturnType<typeof createRenderer> | undefined;
let pose = new Matrix4();
const group = computed(()=>symmetryGroup(solid.value));
type Mark = { type: Feature; index: number };
const tracked = ref<Mark>();
const extraMark = ref<Mark>();
const diagonal = ref<number[]>();
const showDiagonals = ref(false);
const showTriangles = ref(false);
const positions = ref(new Set<number>());
const fixing = ref(new Set<string>());
const moves = ref(new Set<string>());
const fixedBy = (sym: Symmetry, mark: Mark)=>group.value.image(mark.type,mark.index,sym)===mark.index;
const solids = solidGroups.flatMap(set=>[...set.solids]);
const notes = reactive(Object.fromEntries(['rotate','full'].map(kind=>[kind,solids.flatMap(name=>
  (['vertex','edge','face'] as const).map(type=>({name,type,orbit:'',stabilizer:'',order:''}))) ])));
const rows = computed(()=>notes[(!rotationsOnly.value && fullTable.value)?'full':'rotate']);
const activeRows = computed(()=>discovery.value?rows.value:rows.value.filter(row=>row.name===solid.value));

function clearObservations() {
  const identity = group.value.identity.key;
  pose = new Matrix4();
  lab?.setTrialPose(pose);
  positions.value = new Set(tracked.value?[tracked.value.index]:[]);
  fixing.value = new Set([identity]);
  moves.value = new Set([identity]);
}
function paint(sym=group.value.identity) {
  const item = tracked.value;
  const marks: {type:Feature;index:number;color:number}[] = [];
  if (item) {
    marks.push({...item,color:0xd79520});
    if (mode.value !== 'geometric-actions') group.value.features[item.type].forEach((_,local)=>{
      if (local!==item.index && positions.value.has(group.value.image(item.type,local,sym))) {
        marks.push({type:item.type,index:local,color:0x357bbd});
      }
    });
  }
  if (extraMark.value) marks.push({...extraMark.value,color:0xa45cca});
  lab?.setInvestigationMarks(marks);
}
function mark(item: Mark) {
  tracked.value = item;
  diagonal.value = undefined;
  marking.value = false;
  lab?.setInspectionOnly(false);
  clearObservations();
  paint();
  drawOverlays();
  hint.value = 'Gold is the feature you’re following. Select a separate feature to set the axis or mirror.';
}
function record(matrix: Matrix4) {
  const sym = identify(group.value.vertices,matrix);
  if (!sym || (rotationsOnly.value && matrix.determinant()<0)) { lab?.setTrialPose(pose); return; }
  pose = matrix;
  moves.value.add(sym.key);
  const item = tracked.value;
  if (item) positions.value.add(group.value.image(item.type,item.index,sym));
  const endpoints = diagonal.value;
  const fixes = endpoints ? endpoints.every(i=>endpoints.includes(sym.permutation[i])) :
    item && fixedBy(sym,item) && (!extraMark.value || fixedBy(sym,extraMark.value));
  if (fixes) fixing.value.add(sym.key);
  paint(sym);
  hint.value = item || endpoints ? fixes ? 'This transformation preserves the chosen feature set.' :
    'The chosen feature moved to a different position.' : 'Mark a feature to follow it through a move.';
}
function setTool(next: 'rotate'|'reflect') {
  if (next==='reflect' && rotationsOnly.value) return;
  tool.value=next;
  marking.value=false;
  lab?.setInspectionOnly(false);
  lab?.setMode(next);
  dock?.update(next);
}
function mountDock() {
  if (!dockHost.value) return;
  dock?.destroy();
  dock = new ToolDock(dockHost.value, rotationsOnly.value?['rotate']:['rotate','reflect'],next=>{
    if (next==='rotate'||next==='reflect') setTool(next);
  });
  dock.update(tool.value);
}
function chooseMark() {
  marking.value = true;
  lab?.chooseTrackedFeature();
}
function vertexIndex(x:number,y:number,z:number) {
  return group.value.vertices.findIndex(v=>Math.abs(v.x-x)+Math.abs(v.y-y)+Math.abs(v.z-z)<1e-8);
}
function cubeDiagonals() {
  return group.value.vertices.flatMap((v,i)=>{
    const j=vertexIndex(-v.x,-v.y,-v.z);
    return i<j?[[i,j]]:[];
  });
}
function drawOverlays() {
  if (!lab) return;
  const vertices=group.value.vertices;
  const lines: Parameters<CubeLab['setInvestigationLines']>[0]=[];
  if (solid.value==='Cube' && showDiagonals.value) for (const pair of cubeDiagonals()) {
    lines.push({points:pair.map(i=>vertices[i]),color:diagonal.value?.[0]===pair[0]?0xd79520:0x709bb4});
  }
  if (solid.value==='Cube' && showTriangles.value) {
    const v=vertices[diagonal.value?.[0]??0];
    for (const sign of [-1,1]) {
      const triangle=vertices.filter(p=>Math.abs(v.dot(p)-sign)<1e-8);
      lines.push({points:[...triangle,triangle[0]],color:0x9361ac});
    }
  }
  lab.setInvestigationLines(lines);
}
function markDiagonal(pair: number[]) {
  tracked.value=undefined;
  diagonal.value=pair;
  showDiagonals.value=true;
  clearObservations();
  paint();
  drawOverlays();
  hint.value='The gold diagonal is an unoriented line. Its endpoints may swap.';
}
function changeSolid(value: Solid) {
  solid.value=value;
  lab?.setSolid(value);
  tracked.value=extraMark.value=diagonal.value=undefined;
  showDiagonals.value=showTriangles.value=false;
  clearObservations();
  chooseMark();
}
function setExample() {
  if (mode.value==='multiple-feature-stabilizer') {
    const a=vertexIndex(1,1,1), b=vertexIndex(-1,1,1), c=vertexIndex(1,-1,-1);
    const edge=group.value.features.edge.findIndex(set=>set.includes(a)&&set.includes(b));
    tracked.value={type:'edge',index:edge};
    extraMark.value={type:'vertex',index:c};
    clearObservations();
    paint();
    hint.value='Gold marks the edge. Purple marks the separate vertex.';
  }
}
async function jump(next: number) {
  if (next<0||next>=pages.length) return;
  stop();
  const previous=index.value;
  index.value=next;
  fullTable.value=next===4;
  visitedPages.value.add(page.value.id);
  hints.value=0; revealed.value=false; feedback.value=''; guess.value='';
  if (![3,4].includes(next)||![3,4].includes(previous)) changeSolid('Cube');
  else if (previous===4 && next===3) { clearObservations(); paint(); }
  tool.value='rotate';
  lab?.setInspectionOnly(false, !tracked.value && !discovery.value);
  lab?.setMode('rotate');
  setExample();
  if (mode.value==='multiple-feature-stabilizer') {
    marking.value=false;
    lab?.setInspectionOnly(false);
    hint.value='Gold marks the edge. Purple marks the separate vertex.';
  }
  await nextTick();
  mountDock();
  if (previous===next) void play();
}
function checkGuess() {
  if (!guess.value) {feedback.value='Choose a relationship to try.';return;}
  if (guess.value!=='product') {feedback.value='Try grouping the transformations by the position they reach.';return;}
  feedback.value='That’s the orbit–stabilizer theorem.';
  revealed.value=true;
  if (!muted.value && typeof AudioContext!=='undefined') {
    const context=new AudioContext();
    const note=context.createOscillator(), volume=context.createGain();
    note.connect(volume).connect(context.destination);
    volume.gain.setValueAtTime(.07,context.currentTime);
    volume.gain.exponentialRampToValueAtTime(.001,context.currentTime+.3);
    note.frequency.setValueAtTime(523,context.currentTime);
    note.frequency.setValueAtTime(659,context.currentTime+.12);
    note.onended=()=>{void context.close();};
    note.start();note.stop(context.currentTime+.32);
  }
}
onMounted(()=>{
  renderer=createRenderer();
  lab=new CubeLab(surface.value!,renderer);
  lab.setSolid('Cube');
  lab.configure([...features],true,true);
  lab.enableInvestigation();
  lab.onTrack=(type,index)=>mark({type,index});
  lab.onTransform=record;
  lab.onHint=text=>hint.value=text;
  mountDock();
  clearObservations();
  chooseMark();
});
onBeforeUnmount(()=>{dock?.destroy();lab?.destroy();if(renderer instanceof WebGLRenderer)renderer.dispose();});
</script>

<template>
  <Teleport to="body">
    <main class="tutorial orbit-lesson" @keydown.stop>
      <header class="tutorial-header">
        <div class="tutorial-brand"><button @click="emit('office')">← Office</button><h1>{{ chapter.title }}</h1></div>
        <nav aria-label="Orbit and stabilizer sections">
          <div v-for="section in chapter.sections" :key="section.id" class="section">
            <button class="section-title" @click="jump(pages.indexOf(section.subsections[0]))">{{ section.title }}</button>
            <div class="section-dots">
              <button v-for="item in section.subsections" :key="item.id" class="dot" :aria-label="item.title"
                :title="item.title" :aria-current="page.id===item.id?'step':undefined"
                :class="{visited:visitedPages.has(item.id)}" @click="jump(pages.indexOf(item))"><span /></button>
            </div>
          </div>
        </nav>
      </header>
      <section class="lesson" :aria-label="page.title">
        <div class="lesson-title">
          <h2>{{ page.title }}</h2>
          <div v-if="!discovery" class="tools">
            <label v-if="counting">Solid
              <select :value="solid" @change="changeSolid(($event.target as HTMLSelectElement).value as Solid)">
                <option v-for="name in solids" :key="name">{{ name }}</option>
              </select>
            </label>
            <button v-if="mode!=='multiple-feature-stabilizer'" :aria-pressed="marking" @click="chooseMark">Mark a feature</button>
            <button v-for="type in features" :key="type" @click="lab?.selectFeatureByType(type,marking)">
              {{ marking ? 'Mark' : 'Select' }} {{ type }}
            </button>
            <button @click="lab?.resetView()">Reset view</button>
            <button @click="clearObservations();paint()">Reset experiment</button>
          </div>
        </div>
        <div class="orbit-workspace-new" :class="{split:counting||bonus}">
          <div v-show="!discovery" class="scene-frame">
            <div id="orbit-view" ref="surface" class="scene" data-scene="solids"></div>
            <div v-show="!discovery" ref="dockHost" class="transform-dock"></div>
            <p v-if="hint" class="scene-hint" role="status">{{ hint }}</p>
            <div v-if="mode!=='geometric-actions'" class="orbit-counts" aria-live="polite">
              <span v-if="tracked && mode!=='cube-s3' && mode!=='multiple-feature-stabilizer'">{{ positions.size }} positions reached</span>
              <span v-if="(tracked||diagonal) && mode!=='discover-orbits'">{{ fixing.size }} fixing moves found</span>
              <span v-if="counting">{{ moves.size }} distinct moves tried</span>
            </div>
          </div>
          <aside v-if="counting || discovery" class="orbit-notebook" aria-label="Experiment notebook">
            <div class="orbit-notebook-heading">
              <h3>{{ discovery ? 'Compare your observations' : 'Experiment notebook' }}</h3>
              <div v-if="discovery || mode==='full-symmetry-counting'" class="tools">
                <button :aria-pressed="!fullTable" @click="fullTable=false">Rotations</button>
                <button :aria-pressed="fullTable" @click="fullTable=true">Full group</button>
              </div>
            </div>
            <p v-if="counting && !rotationsOnly">Rotations and plane reflections can be composed. Some orientation-reversing moves take more than one step.</p>
            <div class="orbit-table-scroll"><table>
              <thead><tr><th v-if="discovery">Solid</th><th>Feature</th><th>Orbit</th><th>Stabilizer</th><th>Group</th></tr></thead>
              <tbody><tr v-for="row in activeRows" :key="row.name+row.type">
                <th v-if="discovery">{{ row.name }}</th><th>{{ row.type }}</th>
                <td v-for="field in ['orbit','stabilizer','order'] as const" :key="field">
                  <input v-if="counting" v-model="row[field]" inputmode="numeric" :aria-label="row.name+' '+row.type+' '+field">
                  <span v-else>{{ row[field] || '—' }}</span>
                </td>
              </tr></tbody>
            </table></div>
            <div v-if="discovery" class="orbit-investigate">
              <label>Group size equals
                <select v-model="guess"><option value="">Choose a relationship</option>
                  <option value="sum">Orbit size plus stabilizer size</option>
                  <option value="product">Orbit size times stabilizer size</option>
                  <option value="difference">Orbit size minus stabilizer size</option>
                </select>
              </label>
              <button @click="checkGuess">Check conjecture</button>
              <button @click="hints=Math.min(2,hints+1)">Hint</button>
              <button @click="revealed=true">Reveal solution</button>
              <p v-if="hints">Group the transformations by the position they send your chosen feature to.</p>
              <p v-if="hints>1">Each destination can be reached by the same number of moves as the starting position.</p>
              <p v-if="feedback" role="status">{{ feedback }}</p>
              <div v-if="revealed">
                <p v-html="formula('|G|=|G\\cdot x|\\,|G_x|')"></p>
                <p>Choose one move to each destination. Following any stabilizer move by that chosen move reaches the same destination. So each destination accounts for one copy of the stabilizer.</p>
              </div>
            </div>
          </aside>
          <aside v-if="bonus" class="orbit-notebook" aria-label="Challenge">
            <template v-if="mode==='cube-s3'">
              <h3>Find a six-move stabilizer</h3>
              <div class="tools"><button :aria-pressed="showDiagonals" @click="showDiagonals=!showDiagonals;drawOverlays()">Body diagonals</button>
                <button :aria-pressed="showTriangles" @click="showTriangles=!showTriangles;drawOverlays()">Equilateral triangles</button></div>
              <button @click="hints=Math.min(2,hints+1)">Hint</button>
              <p v-if="hints">Try preserving a line through two opposite vertices. The endpoints can swap.</p>
              <p v-if="hints>1">Mark a body diagonal, then try rotations that fix it or reverse it.</p>
              <div v-if="showDiagonals || hints>1" class="tools">
                <button v-for="(pair,i) in cubeDiagonals()" :key="i" :aria-pressed="diagonal?.[0]===pair[0]"
                  @click="markDiagonal(pair)">Mark diagonal {{ i+1 }}</button>
              </div>
              <button @click="revealed=true">Reveal solution</button>
              <p v-if="revealed">The unoriented body diagonal has six stabilizing rotations. These permute the three other body diagonals in all six ways, giving <span v-html="formula('S_3')"></span>.</p>
            </template>
            <template v-else>
              <h3>Preserve both marked features</h3>
              <p>Gold edge <span v-html="formula('(1,1,1)\\text{ to }(-1,1,1)')"></span>. Purple vertex <span v-html="formula('(1,-1,-1)')"></span>.</p>
              <button @click="hints=Math.min(2,hints+1)">Hint</button>
              <p v-if="hints">A move may swap the ends of the edge. The purple vertex must stay fixed.</p>
              <p v-if="hints>1">Try the two nonidentity rotations about the purple vertex’s body diagonal.</p>
              <button @click="revealed=true">Reveal solution</button>
              <p v-if="revealed">Only the identity fixes the purple vertex and preserves the gold edge as a set.</p>
            </template>
          </aside>
        </div>
      </section>
      <footer class="guide">
        <p v-if="voice && (transcript || subtitles && playing || failed || !clip)" class="transcript">{{ voice.text }}</p>
        <div class="guide-actions">
          <div v-if="voice" class="audio-actions" aria-label="Narration">
            <audio v-if="clip" :key="clip" ref="audio" :src="clip" :muted="muted" preload="metadata"
              @playing="playing=true" @pause="playing=false" @ended="playing=false" @error="failed=true"></audio>
            <button v-if="clip" @click="playing ? audio?.pause() : play()">{{ playing ? 'Pause voiceover' : 'Play voiceover' }}</button>
            <button v-if="clip" @click="play(true)">Replay</button>
            <button v-if="clip" :aria-pressed="muted" @click="muted=!muted">{{ muted?'Unmute':'Mute' }}</button>
            <button :aria-pressed="subtitles" @click="subtitles=!subtitles">Subtitles</button>
            <button :aria-pressed="transcript" @click="transcript=!transcript">Transcript</button>
          </div>
          <button v-if="discovery" @click="emit('office')">Finish chapter</button>
          <button class="continue" @click="index===pages.length-1 ? emit('office') : jump(index+1)">
            {{ index===pages.length-1 ? 'Finish chapter' : discovery ? 'Bonus challenges' : 'Continue' }}
          </button>
        </div>
      </footer>
    </main>
  </Teleport>
</template>

<style>
.orbit-workspace-new { position:relative; flex:1; min-height:0; display:grid; grid-template-columns:minmax(0,1fr); }
.orbit-workspace-new.split { grid-template-columns:minmax(0,1fr) minmax(17rem,30%); }
.orbit-notebook { min-height:0; overflow:auto; padding:1rem; background:#e7eee6; color:#283b37; }
.orbit-notebook h3 { margin:0 0 .6rem; font-size:1rem; }
.orbit-notebook button,.orbit-notebook select { color:#edf5ef; }
.orbit-notebook p { margin:.6rem 0; }
.orbit-table-scroll { overflow:auto; }
.orbit-notebook table { border-collapse:collapse; width:100%; text-align:left; }
.orbit-notebook th,.orbit-notebook td { padding:.35rem; border-bottom:1px solid #b2c4bc; font-weight:400; }
.orbit-notebook thead th { font-weight:600; }
.orbit-notebook input { width:100%; min-width:2.4rem; max-width:5rem; padding:.25rem; border:1px solid #8fa79d; border-radius:.3rem; background:#fafcf9; color:#283b37; }
.orbit-investigate { margin-top:.8rem; }
.orbit-investigate button { margin:.2rem; }
.orbit-counts { position:absolute; z-index:2; bottom:6.25rem; left:.6rem; display:flex; flex-wrap:wrap; gap:.35rem; pointer-events:none; }
.orbit-counts span { border-radius:.35rem; padding:.3rem .5rem; background:#243a37; color:#e8f1ee; font-size:.8rem; }
@media(max-width:690px) {
  .orbit-workspace-new.split { grid-template-columns:minmax(0,1fr); grid-template-rows:minmax(0,1.6fr) minmax(0,1fr); }
  .orbit-notebook { padding:.6rem; }
  .orbit-lesson .lesson-title h2 { white-space:normal; }
}
</style>
