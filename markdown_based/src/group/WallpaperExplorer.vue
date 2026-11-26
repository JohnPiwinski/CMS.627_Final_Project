<script setup lang="ts">
import Konva from 'konva';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { axisComponent as along, createLatticeGestures, drawLatticeGesture, glideFrame } from '../labs/latticeGestures';
import { ToolDock } from '../labs/ToolDock';
import { add, distance, sub, type Point, type LatticeTool } from '../lib/geometry';
import { apply, basisVector, cellBounds, compose, identity, inverseAffine, motion, translate,
  type Affine, type Wallpaper } from '../../../interactive-artin-ch0/src/lib/wallpaper';
import { corners, sourceCell, registeredWallpaper, verifiedMove, wallpaperFeatures, orbitPoints } from '../lib/wallpaper-explorer';
import { arrow, useCanvas, useMotion } from './canvas';

const props = defineProps<{ pattern: Wallpaper; photo?: string; orbit?: boolean; initialTool?: LatticeTool }>();
const dockHost = ref<HTMLDivElement>();
const tools = ['translate', 'rotate', 'reflect', 'glide'] as const;
const emit = defineEmits<{ practiceRotation: [] }>();
const tool = ref<LatticeTool>(props.initialTool ?? 'translate');
const spec = computed(() => registeredWallpaper(props.pattern));
const plainCell = computed(() => sourceCell(props.pattern.id).layers.length === 1);
const hints = ref(false);
const zoom = ref(1);
const pan = ref<Point>({ x: 0, y: 0 });
const photo = ref<HTMLImageElement>();
const calibration = ref<Point[]>();
const photoBasis = ref<Affine>();
const overlay = ref(true);
const full = ref(false);
const choosing = ref<'seed' | 'target' | 'lattice'>();
const seed = ref<Point>();
const target = ref<Point>();
const reached = ref(false);
const gestureRevision = ref(0);
const trial = ref<{ map: (t: number) => Affine; final: Affine; marker?: Point }>();
const status = ref('Choose a tool and try a move.');
const cursor = ref<Point>({ x: 0, y: 0 });
const { progress, play, stop } = useMotion();

let dock: ToolDock | undefined;
function select(next: LatticeTool) {
  cancel();
  gestures.select(next);
  choosing.value = undefined;
  panning.value = false;
  tool.value = next;
  dock?.update(next);
  status.value = next === 'translate' ? 'Drag between two lattice nodes.' :
    next === 'rotate' ? allowsRotation.value ?
      (props.photo ? 'Click a point, then drag around the dial.' : 'Click a purple rotation center, then drag around the dial.') :
      props.pattern.id + ' has no rotation centers. Try the rotation example.' :
    'Drag to set a mirror line' + (next === 'glide' ? ', then drag along the line to slide.' : '.');
}
onMounted(() => {
  dock = new ToolDock(dockHost.value!, tools, select);
  select(tool.value);
});
onBeforeUnmount(() => dock?.destroy());
watch(() => props.photo, (url, _, cleanup) => {
  photo.value = undefined;
  if (!url) return;
  const image = new Image();
  image.onload = () => photo.value = image;
  image.onerror = () => { status.value = 'This photograph could not load.'; };
  image.src = url;
  cleanup(() => { image.onload = image.onerror = null; });
}, { immediate: true });
watch(() => props.pattern, reset);
function reset() {
  cancel();
  stop();
  gestures.reset();
  trial.value = seed.value = target.value = undefined;
  calibration.value = photoBasis.value = choosing.value = undefined;
  reached.value = full.value = hints.value = false;
  zoom.value = 1;
  pan.value = { x: 0, y: 0 };
  cursor.value = { x: 0, y: 0 };
  select(tool.value);
}
const scale = computed(() => Math.max(65, Math.min(size.value.width, size.value.height) / (props.photo ? 4 : 3.2)) * zoom.value);
function screen(point: Point): Point {
  return { x: size.value.width / 2 + (point.x - pan.value.x) * scale.value,
    y: size.value.height / 2 + (point.y - pan.value.y) * scale.value };
}
function world(point: Point): Point {
  const dx = point.x - size.value.width / 2;
  const dy = point.y - size.value.height / 2;
  return { x: dx / scale.value + pan.value.x, y: dy / scale.value + pan.value.y };
}
function viewport() {
  return corners.map(p => world({ x: p.x * size.value.width, y: p.y * size.value.height }));
}
const overlap = (a: Point, b: Point) => distance(a,b) < .00001;
const visibleFeatures = computed(() => props.photo ? [] : wallpaperFeatures(spec.value,viewport()));
const allowsRotation = computed(() => Boolean(props.photo) || spec.value.reps.some(([a,b,c,d]) =>
  a*d-b*c > 0 && (a !== 1 || b !== 0 || c !== 0 || d !== 1)));
const showRotationPractice = computed(() => tool.value === 'rotate' && !allowsRotation.value);
const basis = computed<Affine>(() => photoBasis.value ?? (props.photo ? [.5,0,0,.5,0,0] : spec.value.basis));
const nearNode = (p: Point) => distance(p,snap(p))*scale.value <= 12;
const axisDistance = (p: Point, angle: number) => Math.abs(along(p,angle+Math.PI/2));
const axisDifference = (a: number,b: number) => Math.abs(Math.sin(a-b));
function nearestTurn(p: Point) {
  const candidates = visibleFeatures.value.filter(f => f.kind === 'turn' && distance(p,f.point)*scale.value <= 13);
  const closest = candidates.sort((a,b) => distance(p,a.point)-distance(p,b.point))[0];
  return closest && candidates.filter(f => distance(f.point,closest.point) < 1e-6)
    .sort((a,b) => b.order-a.order)[0];
}
function axesAt(p: Point, kind: 'mirror'|'glide') {
  return visibleFeatures.value.filter(f => f.kind === kind && axisDistance(sub(p,f.point),f.angle)*scale.value <= 12);
}
function axisChoice(p: Point, angle: number, kind: 'mirror'|'glide') {
  return axesAt(p,kind).filter(f => axisDifference(f.angle,angle) <= .27)
    .sort((a,b) => axisDifference(a.angle,angle)-axisDifference(b.angle,angle) ||
      axisDistance(sub(p,a.point),a.angle)-axisDistance(sub(p,b.point),b.angle))[0];
}
function snap(point: Point) {
  const grid = basis.value;
  const f = apply(inverseAffine(grid),point);
  const x = Math.round(f.x), y = Math.round(f.y);
  let best = apply(grid,{x,y});
  for (let i=-1;i<=1;i++) for (let j=-1;j<=1;j++) {
    const candidate = apply(grid,{x:x+i,y:y+j});
    if (distance(candidate,point)<distance(best,point)) best = candidate;
  }
  return best;
}
function pointsFor(map: Affine, points: Point[]) {
  return points.flatMap(p => { const q = screen(apply(map, p)); return [q.x,q.y]; });
}
function polygon(layer: Konva.Layer, points: Point[], fill: string, stroke?: string) {
  layer.add(new Konva.Line({ points: pointsFor(identity, points), closed: true, fill, stroke, strokeWidth: 1.5 }));
}
function periodic(layer: Konva.Layer, frame: Affine, boundsMap: Affine, opacity: number) {
  const pattern = spec.value;
  const viewed = viewport();
  const bounds = cellBounds(pattern, [...viewed, ...viewed.map(p => apply(inverseAffine(boundsMap), p))]);
  const { layers } = sourceCell(pattern.id);
  const base = layers[0].fill;
  const patches: { fill: string; rings: number[][] }[] = [];
  for (let i = bounds.minX; i <= bounds.maxX; i++) for (let j = bounds.minY; j <= bounds.maxY; j++) {
    const offset = translate(apply(pattern.basis, { x: i, y: j }));
    const map = compose(frame, offset);
    for (const paint of layers.slice(1)) patches.push({ fill: paint.fill, rings: paint.rings.map(ring => pointsFor(map, ring)) });
  }
  const group = new Konva.Group({ opacity });
  // The green translation cells cover the plane. Painting their common color
  // once avoids hairline antialiasing seams along shared edges.
  group.add(new Konva.Rect({ width: size.value.width, height: size.value.height, fill: base }));
  group.add(new Konva.Shape({ sceneFunc(context) {
    for (const { fill, rings } of patches) {
      context.fillStyle = fill;
      context.beginPath();
      for (const path of rings) {
        context.moveTo(path[0], path[1]);
        for (let i = 2; i < path.length; i += 2) context.lineTo(path[i], path[i+1]);
        context.closePath();
      }
      context.fill();
    }
  }}));
  layer.add(group);
}

function photograph(layer: Konva.Layer, map: Affine, opacity: number) {
  const image = photo.value;
  if (!image) return;
  const ratio = Math.min(3.25 / image.width, 2.65 / image.height);
  const w = image.width * ratio;
  const h = image.height * ratio;
  const origin = screen({ x: 0, y: 0 });
  const transform = new Konva.Transform([map[0], map[2], map[1], map[3],
    origin.x + map[4]*scale.value, origin.y + map[5]*scale.value]);
  const group = new Konva.Group({ ...transform.decompose(), opacity });
  group.add(new Konva.Image({ image, x: -w*scale.value/2, y: -h*scale.value/2, width: w*scale.value, height: h*scale.value }));
  layer.add(group);
}
function line(layer: Konva.Layer, points: Point[], color: string, dash: number[] = []) {
  layer.add(new Konva.Line({ points: pointsFor(identity, points), stroke: color, strokeWidth: 2, dash }));
}
function latticeOverlay(layer: Konva.Layer) {
  const grid = basis.value;
  const inv = inverseAffine(grid);
  const points = viewport().map(p => apply(inv,p));
  const minX = Math.floor(Math.min(...points.map(p=>p.x)));
  const maxX = Math.ceil(Math.max(...points.map(p=>p.x)));
  const minY = Math.floor(Math.min(...points.map(p=>p.y)));
  const maxY = Math.ceil(Math.max(...points.map(p=>p.y)));
  for (let i=minX;i<=maxX;i++) line(layer,[apply(grid,{x:i,y:minY}),apply(grid,{x:i,y:maxY})],'#243b3a77',[3,5]);
  for (let j=minY;j<=maxY;j++) line(layer,[apply(grid,{x:minX,y:j}),apply(grid,{x:maxX,y:j})],'#243b3a77',[3,5]);
  for (let i=minX;i<=maxX;i++) for (let j=minY;j<=maxY;j++) {
    layer.add(new Konva.Circle({ ...screen(apply(grid,{x:i,y:j})),radius:3.8,fill:'#244340',stroke:'#e9f4ec',strokeWidth:1 }));
  }
  polygon(layer,corners.map(p=>apply(grid,p)),'#ffffff10','#243b3a');
  const origin = screen(apply(grid,{x:0,y:0}));
  for (const [i, name] of ['u','v'].entries()) {
    const tip = screen(apply(grid,{x:Number(i===0),y:Number(i===1)}));
    arrow(layer,origin,tip,'#263b3a',1);
    layer.add(new Konva.Text({ ...tip, text:name, fill:'#172824', fontSize:15 }));
  }
}
const shownOrbit = computed(() => seed.value ? orbitPoints(spec.value, seed.value, viewport(), full.value) : []);
function draw(layer: Konva.Layer) {
  gestureRevision.value;
  const transformation = trial.value;
  const map = transformation?.map(progress.value) ?? identity;
  if (props.photo) {
    photograph(layer, identity, transformation && overlay.value ? .4 : transformation ? 0 : 1);
    if (transformation) photograph(layer, map, overlay.value ? .7 : 1);
  } else {
    periodic(layer, identity, identity, 1);
    if (transformation) periodic(layer, map, transformation.final, overlay.value ? .53 : 1);
  }
  latticeOverlay(layer);
  const mark = (point: Point, fill: string, radius: number, stroke = '#182a27') =>
    layer.add(new Konva.Circle({ ...screen(point), radius, fill, stroke, strokeWidth: 2 }));
  for (const {point,translation} of shownOrbit.value) {
    if (seed.value && overlap(point,seed.value)) continue;
    mark(point,translation?'#f2c783':'#ffffff55',translation?4:5);
  }
  const marker = seed.value ?? transformation?.marker;
  if (marker) {
    mark(marker,'#fae092',8);
    if (transformation) {
      const moved = apply(map,marker);
      line(layer,[marker,moved],'#6b4427',[4,4]);
      mark(moved,'#e58945',7);
    }
  }
  if (target.value) mark(target.value,reached.value?'#a7d6be':'#ffffff33',11,'#723761');
  const seen = new Set<string>();
  for (const f of visibleFeatures.value) {
    if (f.kind === 'turn' && (tool.value === 'rotate' || hints.value)) {
      const name = f.point.x.toFixed(5) + ':' + f.point.y.toFixed(5);
      const p = screen(f.point);
      if (seen.has(name) || p.x < 0 || p.y < 0 || p.x > size.value.width || p.y > size.value.height) continue;
      seen.add(name);
      mark(f.point,'#f7efff',7,'#59428e');
    } else if (f.kind === 'mirror' && (tool.value === 'reflect' || hints.value) || f.kind === 'glide' && tool.value === 'glide') {
      const height = along(f.point,f.angle+Math.PI/2);
      const name = f.kind + ':' + Math.sin(f.angle*2).toFixed(5) + ':' + Math.cos(f.angle*2).toFixed(5) + ':' + height.toFixed(5);
      if (seen.has(name)) continue;
      seen.add(name);
      const length = Math.hypot(size.value.width,size.value.height)/scale.value;
      const projection = along(sub(pan.value,f.point),f.angle);
      const center = add(f.point,{x:Math.cos(f.angle)*projection,y:Math.sin(f.angle)*projection});
      const d = { x:Math.cos(f.angle)*length,y:Math.sin(f.angle)*length };
      line(layer,[sub(center,d),add(center,d)],f.kind === 'glide' ? '#68417a' : '#345454',[4,7]);
      for (let n=-Math.ceil(length);n<=Math.ceil(length);n++) {
        const p = add(center,{x:n*Math.cos(f.angle),y:n*Math.sin(f.angle)});
        mark(p,'#a7d6be',4);
      }
    }
  }
  const glide = gestures.state.glide;
  if (glide) for (const amount of glide.amounts ?? []) {
    const point = add(glide.point,{x:Math.cos(glide.angle)*amount,y:Math.sin(glide.angle)*amount});
    const p = screen(point);
    if (p.x >= 0 && p.x <= size.value.width && p.y >= 0 && p.y <= size.value.height) mark(point,'#a7d6be',5);
  }
  drawLatticeGesture(layer,gestures.state,screen,false);
  for (const p of calibration.value ?? []) mark(p,'#edaa65',6);
  if (keyboardFocus.value) mark(choosing.value ? cursor.value : gestures.state.cursor,'#f2c783',5);
}
function setTrial(kind: LatticeTool, point: Point, angle = 0, amount = 0) {
  const map = (t: number): Affine => {
    if (kind === 'translate') return translate({ x:point.x*t,y:point.y*t });
    if (kind === 'glide') {
      const frame = glideFrame(point,angle,amount,t);
      const origin = frame({x:0,y:0});
      const x = sub(frame({x:1,y:0}),origin);
      const y = sub(frame({x:0,y:1}),origin);
      return [x.x,y.x,x.y,y.y,origin.x,origin.y];
    }
    return motion(kind,point,angle,amount,t);
  };
  const final = map(1);
  if (!props.photo && !verifiedMove(spec.value,final)) {
    status.value = 'Choose a highlighted symmetry.';
    return;
  }
  const marker = kind === 'rotate' && !props.photo ? add(point,{x:38/scale.value,y:0}) : undefined;
  trial.value = { map, final, marker };
  reached.value = false;
  play(kind === 'glide' ? 1300 : 740);
  if (props.photo) status.value = 'Compare the overlapping parts of the crop. Ignore its edges.';
  else {
    const valid = verifiedMove(spec.value,final);
    const hit = seed.value && target.value && overlap(apply(final,seed.value),target.value);
    reached.value = Boolean(valid && hit);
    status.value = reached.value ? 'Target reached! The move also preserves the wallpaper.' :
      valid ? 'This move belongs to the selected group.' : 'This move is outside the selected group.';
  }
}
function startPick(mode: typeof choosing.value) {
  cancel();
  gestures.cancel();
  choosing.value = mode;
  if (mode === 'lattice') calibration.value = [];
  status.value = mode === 'seed' ? 'Choose any point on the wallpaper.' :
    mode === 'target' ? 'Choose a dot to reach with the dock tools.' :
    'Pick an origin, then the matching point one repeat away in each of two directions.';
}
function selectedPoint(p: Point) {
  if (choosing.value === 'seed') {
    seed.value = p; target.value = undefined; trial.value = undefined;
    status.value = 'Solid dots are translation copies. Turn on Full orbit to find more.';
  } else if (choosing.value === 'target') {
    const nearest = shownOrbit.value.filter(({point})=>seed.value && !overlap(point,seed.value))
      .sort((a,b)=>distance(a.point,p)-distance(b.point,p))[0];
    if (!nearest || distance(nearest.point,p)*scale.value > 17) return;
    target.value = nearest.point;
    reached.value = false;
    status.value = 'Use the dock tools to reach the ringed point.';
  } else if (choosing.value === 'lattice') {
    const next = [...(calibration.value ?? []),p];
    calibration.value = next;
    if (next.length < 3) {
      status.value = next.length === 1 ? 'Pick the same detail one repeat away.' : 'Pick the same detail one repeat away in another direction.';
      return;
    }
    const a = sub(next[1],next[0]), b = sub(next[2],next[0]);
    if (Math.abs(a.x*b.y-a.y*b.x) < .028 || Math.min(distance(next[0],next[1]),distance(next[0],next[2])) < .18) {
      calibration.value = next.slice(0,2);
      status.value = 'Choose a repeat in a different direction.';
      return;
    }
    photoBasis.value = [a.x,b.x,a.y,b.y,next[0].x,next[0].y];
    calibration.value = undefined;
    status.value = 'Lattice set. Try a move and compare the overlapping image.';
  }
  choosing.value = undefined;
}
const gestures = createLatticeGestures({
  yUp:false,
  clickTranslation:Boolean(props.photo),
  unit:()=>scale.value,
  translationNode:(p,endpoint)=>props.photo ? p : endpoint || nearNode(p) ? snap(p) : undefined,
  rotationCenter:p=>{
    if (props.photo) return {point:p,count:24};
    const center = nearestTurn(p);
    return center && {point:center.point,count:center.order};
  },
  axisAnchor:(point,kind)=>{
    if (props.photo) return {point,angles:Array.from({length:8},(_,i)=>i*Math.PI/4)};
    const choices=axesAt(point,kind==='reflect'?'mirror':'glide').flatMap(f=>[f.angle,f.angle+Math.PI]);
    const angles=[...new Map(choices.map(a=>[Math.atan2(Math.sin(a),Math.cos(a)).toFixed(5),a])).values()];
    return angles.length ? {point,angles} : undefined;
  },
  chooseAxis:(p,angle,kind)=>{
    if (props.photo) return {point:p,angle};
    const feature=axisChoice(p,angle,kind==='reflect'?'mirror':'glide');
    if (!feature) return;
    const radians=feature.angle;
    const offset=along(sub(p,feature.point),radians);
    const point=add(feature.point,{x:offset*Math.cos(radians),y:offset*Math.sin(radians)});
    const amounts=kind==='glide' ? axesAt(point,'glide').filter(f=>
      axisDifference(f.angle,radians)<1e-7 && axisDistance(sub(point,f.point),radians)<1e-7,
    ).map(f=>Math.cos(f.angle-radians)*f.amount) : undefined;
    return {point,angle:radians,amounts};
  },
  glideAmount:(axis,start,end)=>{
    const {point,angle,amounts}=axis;
    if (!props.photo && axisDistance(sub(start,point),angle)*scale.value>12) return;
    const vector=sub(end,point);
    const slide=along(vector,angle);
    if (Math.abs(slide)*scale.value<7 || !props.photo && axisDistance(vector,angle)*scale.value>18) return;
    if (props.photo) return slide;
    const amount=[...(amounts ?? [])].sort((a,b)=>Math.abs(a-slide)-Math.abs(b-slide))[0];
    if (amount!==undefined && Math.sign(amount)===Math.sign(slide) && Math.abs(amount-slide)*scale.value<=38) return amount;
  },
  cursorStep:(p,x,y,fast,tool)=>{
    if (!props.photo && tool==='translate') return add(snap(p),apply(spec.value.basis,{x,y}));
    const step=fast?.25:.025;
    return add(p,{x:x*step,y:y*step});
  },
  commit:({tool,point,angle,amount})=>setTrial(tool,point,angle,amount),
  hint:message=>{status.value=message;},
  changed:()=>{gestureRevision.value++;},
});
const keyboardFocus = ref(false);
function key(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    cancel();
    choosing.value = undefined;
  }
  if (!choosing.value) { if (!showRotationPractice.value) gestures.key(event); return; }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    selectedPoint(cursor.value);
    return;
  }
  const delta = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if (delta) {
    event.preventDefault();
    const step=event.shiftKey?.25:.025;
    cursor.value=add(cursor.value,{x:delta[0]*step,y:delta[1]*step});
  }
}
function begin(p: Point) {
  const origin=world(p);
  const before=pan.value;
  if (panning.value) return { move(q: Point) {
    const dx=p.x-q.x,dy=p.y-q.y;
    pan.value=add(before,{x:dx/scale.value,y:dy/scale.value});
  },end() {} };
  if (choosing.value) return {end(q:Point){selectedPoint(world(q));}};
  if (showRotationPractice.value) return;
  if (!gestures.down(origin)) return;
  return {move(q:Point){gestures.move(world(q));},end(q:Point){gestures.up(world(q));},cancel(){gestures.cancel();}};
}
const panning = ref(false);
const { host,size,pointerdown,pointermove,pointerup,pointercancel,cancel } = useCanvas(draw,begin,true);
const changeZoom = (value: number) => { zoom.value = Math.max(.65,Math.min(3,zoom.value*value)); };
</script>

<template>
  <div class="scene wallpaper-explorer">
    <div ref="host" class="wallpaper-konva" tabindex="0" aria-label="Wallpaper workspace. Move the crosshair with arrow keys and press Enter to choose a point."
      @focus="keyboardFocus = true" @blur="keyboardFocus = false" @keydown="key"
      @pointerdown.capture="pointerdown" @pointermove.capture="pointermove" @pointerup.capture="pointerup"
      @pointercancel="pointercancel" @lostpointercapture="pointercancel"></div>
    <div class="wallpaper-controls">
      <button v-if="showRotationPractice" @click="emit('practiceRotation')">Try rotation on p4</button>
      <button v-if="photo" @click="startPick('lattice')">{{ photoBasis ? 'Set lattice' : 'Align guide grid' }}</button>
      <button v-if="orbit" @click="startPick('seed')">Pick a point</button>
      <button v-if="orbit && seed" :aria-pressed="full" @click="full = !full">Full orbit</button>
      <button v-if="orbit && seed" @click="startPick('target')">Choose target</button>
      <button v-if="orbit" :aria-pressed="hints" @click="hints = !hints">Centers and mirrors</button>
      <button :aria-pressed="overlay" @click="overlay = !overlay">Compare</button>
      <button :aria-pressed="panning" @click="panning = !panning">Pan</button>
      <button aria-label="Zoom out" @click="changeZoom(.83)">−</button>
      <button aria-label="Zoom in" @click="changeZoom(1.2)">+</button>
      <button @click="reset">Reset scene</button>
    </div>
    <p class="wallpaper-status" role="status">{{ status }} <span v-if="!photo && plainCell">The source provides a plain cell for this group.</span></p>
    <p v-if="orbit && seed" class="wallpaper-legend">● Translation copies <template v-if="full"> · ○ Additional orbit points</template></p>
    <div ref="dockHost" class="transform-dock"></div>
  </div>
</template>

<style>
.wallpaper-konva { position:absolute; inset:0; touch-action:none; }
.wallpaper-controls { position:absolute; inset:.5rem .5rem auto; display:flex; flex-wrap:wrap; gap:.25rem; pointer-events:none; }
.tutorial .wallpaper-controls > *, .tutorial .wallpaper-controls select { pointer-events:auto; color:#e8f1ee; font-size:.8rem; }
.wallpaper-controls label { background:#20302f; padding-left:.3rem; border-radius:.45rem; }
.wallpaper-status, .wallpaper-legend { position:absolute; margin:0; left:.55rem; bottom:6.4rem; color:#e8f1ee; background:#243a37; padding:.3rem .5rem; border-radius:.35rem; font-size:.8rem; pointer-events:none; max-width:calc(100% - 1.1rem); }
.wallpaper-legend { bottom:4.5rem; }
</style>
