<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { CosetBlock } from '../lib/solid-cosets';

const props = defineProps<{
  blocks: CosetBlock[]; next?: CosetBlock[]; progress: number; names: Map<string,string>;
  positionName: (position: number) => string; color: (position: number) => string; reference: number;
}>();
const emit = defineEmits<{ highlight: [block: number | undefined] }>();
const slots = new Map<number,HTMLElement>();
const opened = ref<number>();
const hovered = ref<number>();
const focused = ref<number>();
const closeButton = ref<HTMLButtonElement>();
let opener: HTMLElement | undefined;
const positions = computed(() => props.blocks.map(block => block.id));
const compact = computed(() => props.blocks.length > 8 || (props.blocks[0]?.moves.length ?? 0) > 3);
const details = computed(() => props.blocks.find(block => block.id === opened.value));
const nextById = computed(() => new Map(props.next?.map(block => [block.id,block])));
function slot(index: number, element: unknown) {
  if (element instanceof HTMLElement) slots.set(index,element);
  else slots.delete(index);
}
function blockStyle(block: CosetBlock) {
  const next = nextById.value.get(block.id);
  const from = slots.get(block.destination), to = next && slots.get(next.destination);
  const style = {
    gridArea: 'slot-' + block.destination,
    '--position-color': props.color(block.destination),
    transform: '',
    zIndex: 1,
  };
  if (!from || !to || from === to) return style;
  const t = props.progress;
  const dx = to.offsetLeft-from.offsetLeft, dy = to.offsetTop-from.offsetTop;
  const length = Math.hypot(dx,dy) || 1;
  const bend = Math.sin(t*Math.PI) * Math.min(40,length*.24);
  style.transform = `translate(${dx*t-dy/length*bend}px, ${dy*t+dx/length*bend}px)`;
  style.zIndex = 2 + block.id;
  return style;
}
function updateHighlight() { emit('highlight',opened.value ?? hovered.value ?? focused.value); }
function open(block: CosetBlock, event: MouseEvent) {
  opener = event.currentTarget as HTMLElement;
  opened.value = block.id;
  updateHighlight();
  void nextTick(()=>closeButton.value?.focus());
}
function close() {
  opened.value = undefined;
  updateHighlight();
  opener?.focus();
}
const areas = computed(() => positions.value.map(i => 'slot-'+i));
const gridStyle = computed(() => ({
  '--areas-wide': Array.from({length:Math.ceil(areas.value.length/2)},(_,i) => {
    const start = i*2;
    return '"' + [areas.value[start],areas.value[start+1]??'.'].join(' ') + '"';
  }).join(' '),
  '--areas-narrow': areas.value.map(area => '"' + area + '"').join(' '),
}));
</script>

<template>
  <aside class="orbit-notebook coset-board" aria-label="Coset blocks" @keydown.esc.stop="close">
    <h3>Coset blocks</h3>
    <div class="coset-grid" :style="gridStyle">
      <div v-for="position in positions" :key="'slot'+position" :ref="el=>slot(position,el)"
        class="coset-slot" :style="{gridArea:'slot-'+position}" aria-hidden="true">
        Position {{ positionName(position) }}
      </div>
      <button v-for="block in blocks" :key="block.id" type="button" class="coset-block"
        :class="{ compact, reference: block.id===reference }" :style="blockStyle(block)"
        :aria-label="'Coset at position '+positionName(block.destination)+', '+block.moves.length+' moves'"
        @pointerenter="hovered=block.id;updateHighlight()" @pointerleave="hovered=undefined;updateHighlight()"
        @focus="focused=block.id;updateHighlight()" @blur="focused=undefined;updateHighlight()" @click="open(block,$event)">
        <span class="coset-badge">{{ positionName(block.destination) }}</span>
        <span v-if="compact">{{ block.moves.length }} moves</span>
        <span v-else class="coset-tokens">
          <span v-for="(move,i) in (progress===1 ? nextById.get(block.id)?.moves ?? block.moves : block.moves)" :key="i">{{ names.get(move) }}</span>
        </span>
      </button>
    </div>
    <div v-if="details" class="coset-moves" role="dialog" :aria-label="'Moves at position '+positionName(details.destination)">
      <header>
        <strong>Moves at position {{ positionName(details.destination) }}</strong>
        <button ref="closeButton" @click="close">Close</button>
      </header>
      <ul><li v-for="move in details.moves" :key="move">{{ names.get(move) }}</li></ul>
    </div>
  </aside>
</template>

<style>
.coset-board { position:relative; }
.coset-grid { display:grid; position:relative; grid-template-areas:var(--areas-wide); grid-template-columns:repeat(2,minmax(0,1fr)); gap:.55rem; }
.coset-slot { background:#cddbd1; border:1px dashed #8da39a; border-radius:.5rem; padding:.25rem .45rem; min-height:4.9rem; font-size:.8rem; }
.tutorial .coset-block { align-self:end; min-height:2.4rem; margin:.25rem; padding:.3rem; display:flex; align-items:center; gap:.3rem; cursor:pointer; border-left:4px solid var(--position-color); color:#e8f1ee; text-align:left; }
.coset-block.reference { box-shadow:0 0 0 1px #a8873d; }
.coset-badge { padding:.15rem .35rem; border:1px solid var(--position-color); border-radius:1rem; flex:none; }
.coset-tokens { display:flex; flex-wrap:wrap; gap:.2rem; font-size:.7rem; }
.coset-tokens span { border-radius:.2rem; background:#39534d; padding:.18rem .28rem; }
.coset-moves { position:sticky; bottom:0; z-index:250; margin-top:.55rem; background:#f4f7ef; border:1px solid #8da39a; border-radius:.5rem; padding:.65rem; }
.coset-moves header { display:flex; align-items:center; justify-content:space-between; gap:.4rem; }
.coset-moves ul { display:flex; flex-wrap:wrap; gap:.35rem 1rem; margin:.5rem 0 0; padding:0; list-style:none; }
@media(max-width:360px) { .coset-grid { grid-template-areas:var(--areas-narrow); grid-template-columns:1fr; } }
</style>
