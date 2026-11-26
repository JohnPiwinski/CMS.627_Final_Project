import Konva from 'konva';
import { onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

export type Point = { x: number; y: number };
export const width = 800;
export const height = 520;
export const palette = {
  gold: '#e8bd75', ink: '#f6eedb', soft: '#aebeb0', panel: '#1e302b',
  line: '#638474', green: '#93d0b3', red: '#efa398',
};
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
export const angle = (p: Point, center: Point) => Math.atan2(p.y - center.y, p.x - center.x);
export const polar = (center: Point, radius: number, radians: number): Point => ({
  x: center.x + radius * Math.cos(radians), y: center.y + radius * Math.sin(radians),
});
export const lerp = (from: Point, to: Point, progress: number): Point => ({
  x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress,
});

export function label(layer: Konva.Container, point: Point, value: string, options: {
  size?: number; fill?: string; width?: number;
} = {}) {
  const { size = 18, fill = palette.ink, width = 120 } = options;
  layer.add(new Konva.Text({ x: point.x - width / 2, y: point.y - size / 2, width, align: 'center',
    text: value, fontFamily: 'system-ui, sans-serif', fontSize: size, fill, listening: false }));
}

export function chip(layer: Konva.Container, point: Point, value: string, options: {
  radius?: number; fill?: string; stroke?: string; opacity?: number; color?: string;
} = {}) {
  const { radius = 21, fill = palette.panel, stroke = palette.line, opacity = 1, color = palette.ink } = options;
  const group = new Konva.Group({ opacity, listening: false });
  group.add(new Konva.Circle({ ...point, radius, fill, stroke, strokeWidth: 2 }));
  label(group, point, value, { size: radius < 18 ? 14 : 18, width: radius * 2 + 4, fill: color });
  layer.add(group);
}

export function arrow(layer: Konva.Container, from: Point, to: Point, color = palette.green, opacity = .8) {
  if (distance(from, to) < 3) return;
  layer.add(new Konva.Arrow({ points: [from.x, from.y, to.x, to.y], stroke: color, fill: color,
    strokeWidth: 2, pointerLength: 6, pointerWidth: 6, opacity, listening: false }));
}

type Gesture = { move?: (point: Point) => void; end: (point: Point) => void; cancel?: () => void };

export function useCanvas(draw: (layer: Konva.Layer) => void, begin: (point: Point) => Gesture | undefined, responsive = false) {
  const host = ref<HTMLDivElement>();
  let stage: Konva.Stage | undefined;
  let layer: Konva.Layer | undefined;
  let observer: ResizeObserver | undefined;
  let active: { id: number; gesture: Gesture } | undefined;
  const ready = ref(false);
  const size = ref({ width, height });

  function location(event: PointerEvent): Point {
    const box = host.value!.getBoundingClientRect();
    return { x: (event.clientX - box.left) * size.value.width / box.width, y: (event.clientY - box.top) * size.value.height / box.height };
  }

  function cancel() {
    if (!active) return;
    const { id, gesture } = active;
    active = undefined;
    gesture.cancel?.();
    if (host.value?.hasPointerCapture(id)) host.value.releasePointerCapture(id);
  }

  function pointerdown(event: PointerEvent) {
    if (!event.isPrimary || event.button !== 0 || active) return;
    const gesture = begin(location(event));
    if (!gesture) return;
    active = { id: event.pointerId, gesture };
    host.value!.setPointerCapture(event.pointerId);
  }
  function pointermove(event: PointerEvent) {
    if (active?.id === event.pointerId) active.gesture.move?.(location(event));
  }
  function pointerup(event: PointerEvent) {
    if (active?.id !== event.pointerId) return;
    const { id, gesture } = active;
    active = undefined;
    gesture.end(location(event));
    if (host.value?.hasPointerCapture(id)) host.value.releasePointerCapture(id);
  }
  function pointercancel(event: PointerEvent) {
    if (active?.id === event.pointerId) cancel();
  }

  function escape(event: KeyboardEvent) {
    if (active && event.key === 'Escape') cancel();
  }
  onMounted(() => {
    if (!host.value) return;
    window.addEventListener('keydown', escape, true);
    stage = new Konva.Stage({ container: host.value!, width, height, listening: false });
    layer = new Konva.Layer({ listening: false });
    stage.add(layer);
    observer = new ResizeObserver(() => {
      const box = host.value?.getBoundingClientRect();
      if (!box?.width || !box.height) return;
      if (responsive) {
        size.value = { width: box.width, height: box.height };
      }
      stage?.size({ width: box.width, height: box.height });
      stage?.scale({ x: box.width / size.value.width, y: box.height / size.value.height });
      layer?.batchDraw();
    });
    observer.observe(host.value!);
    ready.value = true;
  });
  watchEffect(() => {
    if (!ready.value || !layer) return;
    layer.destroyChildren();
    draw(layer);
    layer.batchDraw();
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', escape, true);
    cancel();
    observer?.disconnect();
    stage?.destroy();
  });
  return { host, size, pointerdown, pointermove, pointerup, pointercancel, cancel };
}

export function useMotion() {
  const progress = ref(1);
  let frame = 0;
  function stop() { cancelAnimationFrame(frame); }
  function play(duration = 740) {
    stop();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      progress.value = 1;
      return;
    }
    progress.value = 0;
    const start = performance.now();
    function tick(now: number) {
      const time = Math.min(1, (now - start) / duration);
      progress.value = 1 - (1 - time) ** 3;
      if (time < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  }
  onBeforeUnmount(stop);
  return { progress, play, stop };
}
