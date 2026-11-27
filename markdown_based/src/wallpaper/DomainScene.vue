<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import Konva from "konva";
import data from "./dissection.json";
import { useCanvas, useMotion } from "../group/canvas";
import { ToolDock } from "../labs/ToolDock";
import {
  createLatticeGestures,
  drawLatticeGesture,
} from "../labs/latticeGestures";
import {
  apply,
  compose,
  inverseAffine,
  motion,
  identity,
  type Affine,
} from "../lib/wallpaper";
import type { Point, LatticeTool } from "../lib/geometry";
const props = defineProps<{
  mode: "overview" | "definition" | "dissection" | "explanation";
}>();
const dockHost = ref<HTMLDivElement>();
const step = ref(props.mode === "explanation" ? 3 : 0),
  revealed = ref(props.mode === "explanation"),
  selected = ref(false),
  solved = ref(props.mode === "explanation"),
  hint = ref(""),
  tool = ref<LatticeTool>("rotate"),
  revision = ref(0),
  attempt = ref<{ tool: LatticeTool; point: Point; angle: number }>();
const { progress, play, stop } = useMotion();
const B: Affine = [
  data.lattice[0][0],
  data.lattice[1][0],
  data.lattice[0][1],
  data.lattice[1][1],
  0,
  0,
];
const inverse = inverseAffine(B),
  center = data.move.point;
const m = data.move.affine;
const solution: Affine = [m[0], m[1], m[2], m[3], m[4], m[5]];
const scale = computed(() =>
  Math.max(
    60,
    Math.min(size.value.width / 1.8, (size.value.height - 185) / 1.25),
  ),
);
const screen = (p: Point) => ({
  x: size.value.width / 2 + (p.x - 0.15) * scale.value,
  y: (size.value.height - 70) / 2 + (p.y - 0.5) * scale.value,
});
const world = (p: Point) => ({
  x: (p.x - size.value.width / 2) / scale.value + 0.15,
  y: (p.y - (size.value.height - 70) / 2) / scale.value + 0.5,
});
let dock: ToolDock | undefined;
function selectTool(next: LatticeTool) {
  cancel();
  gestures.select(next);
  tool.value = next;
  dock?.update(next);
  hint.value = selected.value
    ? "Choose a group symmetry to move the bite."
    : "Select the curved red bite first.";
}
function reset() {
  cancel();
  stop();
  gestures.reset();
  attempt.value = undefined;
  step.value = props.mode === "explanation" ? 3 : 0;
  revealed.value = props.mode === "explanation";
  selected.value = false;
  solved.value = props.mode === "explanation";
  hint.value = "";
}
function showAnswer() {
  revealed.value = true;
  hint.value = "Select the curved red bite, then rotate it to the blue gap.";
}
function showMove() {
  showAnswer();
  selected.value = true;
  attempt.value = { tool: "rotate", point: center, angle: data.move.angle };
  solved.value = true;
  play(1200);
  hint.value =
    "A 120° rotation about the highlighted center moves the bite into the blue gap.";
}
function isGroupMove(map: Affine) {
  const f = compose(inverse, compose(map, B));
  return data.representatives.some(
    (r) =>
      r.slice(0, 4).every((n, i) => Math.abs(n - f[i]) < 1e-5) &&
      [4, 5].every(
        (i) => Math.abs(f[i] - r[i] - Math.round(f[i] - r[i])) < 1e-5,
      ),
  );
}
function contains(points: number[][], p: Point) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [x, y] = points[i],
      [u, v] = points[j];
    if (y > p.y !== v > p.y && p.x < ((u - x) * (p.y - y)) / (v - y) + x)
      inside = !inside;
  }
  return inside;
}
const gestures = createLatticeGestures({
  yUp: false,
  unit: () => scale.value,
  translationNode: (p, end) => {
    const f = apply(inverse, p),
      q = apply(B, { x: Math.round(f.x), y: Math.round(f.y) });
    return end || Math.hypot(q.x - p.x, q.y - p.y) * scale.value < 16
      ? q
      : undefined;
  },
  rotationCenter: (p) =>
    Math.hypot(p.x - center.x, p.y - center.y) * scale.value < 18
      ? { point: center, count: 3 }
      : undefined,
  axisAnchor: (p) =>
    Math.abs(p.x) * scale.value < 16
      ? { point: { x: 0, y: p.y }, angles: [Math.PI / 2, -Math.PI / 2] }
      : undefined,
  chooseAxis: (p, a) =>
    Math.abs(Math.cos(a)) < 0.27
      ? { point: { x: 0, y: p.y }, angle: Math.PI / 2 }
      : undefined,
  glideAmount: () => undefined,
  cursorStep: (p, x, y, fast, t) =>
    t === "translate"
      ? apply(B, {
          x: Math.round(apply(inverse, p).x) + x,
          y: Math.round(apply(inverse, p).y) + y,
        })
      : {
          x: p.x + x * (fast ? 0.15 : 0.025),
          y: p.y + y * (fast ? 0.15 : 0.025),
        },
  commit: (move) => {
    if (!selected.value || solved.value) return;
    const map = motion(move.tool, move.point, move.angle, 0);
    if (!isGroupMove(map)) {
      hint.value = "That move is not a symmetry of this wallpaper.";
      return;
    }
    const correct = data.bite.points.every(([x, y]) => {
      const a = apply(map, { x, y }),
        b = apply(solution, { x, y });
      return Math.hypot(a.x - b.x, a.y - b.y) < 1e-5;
    });
    if (!correct) {
      hint.value =
        "That is a group symmetry, but it does not place the bite in the blue gap. Try another move.";
      return;
    }
    attempt.value = move;
    solved.value = true;
    play(1200);
    hint.value =
      "The same piece now completes the blue domain. No area was added or lost.";
  },
  hint: (message) => (hint.value = message),
  changed: () => revision.value++,
});
function shape(
  layer: Konva.Container,
  path: string,
  color: string,
  fill?: string,
  map: Affine = identity,
  opacity = 1,
) {
  const o = screen({ x: 0, y: 0 }),
    [a, b, c, d, x, y] = map;
  const group = new Konva.Group({
    ...new Konva.Transform([
      a,
      c,
      b,
      d,
      o.x + x * scale.value,
      o.y + y * scale.value,
    ]).decompose(),
    opacity,
    listening: false,
  });
  // Affine transformation in world coordinates, followed by screen scaling.
  group.setAttrs(
    new Konva.Transform([
      a * scale.value,
      c * scale.value,
      b * scale.value,
      d * scale.value,
      o.x + x * scale.value,
      o.y + y * scale.value,
    ]).decompose(),
  );
  group.add(
    new Konva.Path({
      data: path,
      stroke: color,
      fill,
      strokeWidth: 1.8,
      strokeScaleEnabled: false,
      lineJoin: "round",
      listening: false,
    }),
  );
  layer.add(group);
}
function copies(
  layer: Konva.Layer,
  path: string,
  color: string,
  fill?: string,
  opacity = 0.2,
) {
  for (const r of data.representatives)
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const map = compose(
          B,
          compose([r[0], r[1], r[2], r[3], r[4] + i, r[5] + j], inverse),
        );
        shape(layer, path, color, fill, map, opacity);
      }
}
function button(
  layer: Konva.Layer,
  text: string,
  x: number,
  y: number,
  action: () => void,
) {
  const g = new Konva.Group({ x, y });
  const t = new Konva.Text({ text, padding: 10, fontSize: 13, fill: "#fff" });
  g.add(
    new Konva.Rect({
      width: t.width(),
      height: 34,
      fill: "#203b34",
      cornerRadius: 5,
    }),
    t,
  );
  g.on("click tap", action);
  layer.add(g);
  return t.width() + 7;
}
const message = computed(
  () =>
    (props.mode === "explanation"
      ? "Use the same group acting on the same plane. For bounded domains, only finitely many copies meet. Other pairs may need more pieces; shared boundaries are allowed."
      : "") ||
    hint.value ||
    (props.mode === "overview"
      ? "Two independent translations repeat the pattern. Its symmetry group contains every motion that preserves its outlines."
      : props.mode === "definition"
        ? [
            "One complete fleur-de-lis tile. Is it the smallest region we need?",
            "The tile has a mirror. Its two halves contain the same information.",
            "One half is a fundamental domain for the full p31m group.",
            "Group images cover the plane without overlapping interiors. Shared edges are allowed.",
          ][step.value]
        : props.mode === "explanation"
          ? "Every cut piece has a destination under a group symmetry. Coverage leaves no gaps; non-overlap prevents duplicate interiors."
          : revealed.value
            ? "Select the curved red bite and move it to the blue gap."
            : "Why should two fundamental domains for the same symmetry group be cut-and-reassembled versions of each other?"),
);
function draw(layer: Konva.Layer) {
  revision.value;
  const w = size.value.width,
    h = size.value.height;
  layer.add(
    new Konva.Rect({ width: w, height: h, fill: "#f5f1e6", listening: false }),
  );
  if (props.mode === "overview") {
    copies(layer, data.full.path, "#527e71", "#a7c7b8", 0.35);
    const lines = [
      "A pattern repeats in two independent directions.",
      "Translations, rotations, reflections, and glides can preserve it.",
      "There are 17 types of wallpaper symmetry groups.",
    ];
    const card = new Konva.Group({ x: 20, y: Math.max(25, h / 2 - 95) });
    card.add(
      new Konva.Rect({
        width: w - 40,
        height: 190,
        fill: "#172824",
        opacity: 0.96,
        cornerRadius: 12,
      }),
    );
    lines.forEach((text, i) =>
      card.add(
        new Konva.Text({
          x: 18,
          y: 20 + i * 54,
          width: w - 76,
          text,
          fontSize: w < 500 ? 16 : 21,
          fill: "#f6eedb",
        }),
      ),
    );
    layer.add(card);
    return;
  }
  if (props.mode === "definition") {
    if (step.value === 3)
      copies(layer, data.red.path, "#ad4245", "#eaa2a2", progress.value * 0.55);
    else copies(layer, data.full.path, "#8a9d91", undefined, 0.13);
    shape(
      layer,
      data.full.path,
      "#56796a",
      step.value < 2 ? "#c6dfc9" : undefined,
    );
    if (step.value >= 1) {
      const a = screen({ x: 0, y: -0.08 }),
        b = screen({ x: 0, y: 1.08 });
      layer.add(
        new Konva.Line({
          points: [a.x, a.y, b.x, b.y],
          stroke: "#674d91",
          dash: [6, 5],
          strokeWidth: 2,
          listening: false,
        }),
      );
    }
    if (step.value >= 2) shape(layer, data.red.path, "#b3353c", "#eaa2a2");
    button(
      layer,
      step.value < 3
        ? ["Reveal mirror", "Choose one half", "Tile the wall"][step.value]
        : "Replay",
      10,
      10,
      () => {
        step.value = (step.value + 1) % 4;
        play(700);
      },
    );
    if (step.value === 3) {
      const map = motion(
        "reflect",
        { x: 0, y: 0 },
        Math.PI / 2,
        0,
        progress.value,
      );
      shape(layer, data.red.path, "#b3353c", "#eaa2a2", map, 0.75);
    }
  } else {
    copies(layer, data.red.path, "#bf454c", undefined, 0.22);
    copies(layer, data.blue.path, "#396cbc", undefined, 0.22);
    shape(
      layer,
      data.red.path,
      "#bd4149",
      revealed.value ? "#f4cccc" : undefined,
    );
    shape(layer, data.blue.path, "#3467b4");
    if (revealed.value) {
      shape(layer, data.remainder.path, "#bd4149", "#f4cccc");
      shape(
        layer,
        data.destination.path,
        "#3467b4",
        solved.value ? "#c7d9f5" : undefined,
      );
      const map = attempt.value
        ? motion(
            attempt.value.tool,
            attempt.value.point,
            attempt.value.angle,
            0,
            progress.value,
          )
        : identity;
      shape(
        layer,
        data.bite.path,
        selected.value ? "#8e1d28" : "#bd4149",
        "#db737d",
        map,
      );
      const p = screen(center);
      layer.add(
        new Konva.Circle({
          ...p,
          radius: 8,
          fill: "#f2e4ff",
          stroke: "#674d91",
          strokeWidth: 2,
          listening: false,
        }),
      );
      if (tool.value === "reflect") {
        const a = screen({ x: 0, y: -0.1 }),
          b = screen({ x: 0, y: 1.1 });
        layer.add(
          new Konva.Line({
            points: [a.x, a.y, b.x, b.y],
            stroke: "#674d91",
            dash: [5, 6],
            strokeWidth: 2,
            listening: false,
          }),
        );
      }
      if (solved.value && progress.value === 1)
        copies(layer, data.blue.path, "#3467b4", "#cadbf4", 0.22);
    }
    let x = 10,
      y = 10;
    const actions: [string, () => void][] =
      props.mode === "explanation"
        ? [["Replay the one-bite example", showMove]]
        : revealed.value
          ? [
              [
                "Select bite",
                () => {
                  selected.value = true;
                  gestures.state.cursor = { ...center };
                  hint.value =
                    "Bite selected. Choose the purple rotation center.";
                },
              ],
              [
                "Hint",
                () =>
                  (hint.value =
                    "Rotate the bite 120° clockwise on screen about the purple center."),
              ],
              ["Show move", showMove],
              ["Reset", reset],
              ["Replay", showMove],
            ]
          : [["Show answer", showAnswer]];
    for (const [text, action] of actions) {
      if (x + 100 > w) {
        x = 10;
        y += 40;
      }
      x += button(layer, text, x, y, action);
    }

    drawLatticeGesture(layer, gestures.state, screen, false);
  }
  const statusText = new Konva.Text({
    x: 20,
    width: w - 40,
    text: message.value,
    fontSize: w < 500 ? 13 : 15,
    lineHeight: 1.4,
    fill: "#fff",
    listening: false,
  });
  const statusHeight = statusText.height() + 18;
  statusText.y(h - 63 - statusHeight + 9);
  layer.add(
    new Konva.Rect({
      x: 10,
      y: h - 63 - statusHeight,
      width: w - 20,
      height: statusHeight,
      fill: "#203b34",
      cornerRadius: 6,
      opacity: 0.96,
      listening: false,
    }),
    statusText,
  );
  if (props.mode === "explanation") {
    const explanation = new Konva.Text({
      x: 20,
      y: 62,
      width: w - 40,
      text: "Overlay the boundaries. Each red piece lies in a blue copy. A group symmetry takes it to the chosen blue domain. Coverage leaves no gaps; non-overlap prevents duplicates.",
      fontSize: w < 500 ? 13 : 16,
      lineHeight: 1.4,
      fill: "#f6eedb",
      listening: false,
    });
    layer.add(
      new Konva.Rect({
        x: 10,
        y: 53,
        width: w - 20,
        height: explanation.height() + 18,
        fill: "#203b34",
        opacity: 0.95,
        cornerRadius: 6,
        listening: false,
      }),
      explanation,
    );
  }
}
const {
  host,
  size,
  pointerdown,
  pointermove,
  pointerup,
  pointercancel,
  cancel,
} = useCanvas(
  draw,
  (p) => {
    if (
      !revealed.value ||
      props.mode === "definition" ||
      props.mode === "overview"
    )
      return;
    const q = world(p);
    if (!selected.value && contains(data.bite.points, q)) {
      selected.value = true;
      gestures.state.cursor = { ...center };
      hint.value = "Bite selected. Choose the purple rotation center.";
      return;
    }
    if (!selected.value) {
      hint.value = "Select the curved red bite first.";
      return;
    }
    if (solved.value) return;
    if (!gestures.down(q)) return;
    return {
      move: (p) => gestures.move(world(p)),
      end: (p) => gestures.up(world(p)),
      cancel: () => gestures.cancel(),
    };
  },
  true,
  true,
);
function key(e: KeyboardEvent) {
  if (e.key === "Escape") {
    cancel();
    gestures.cancel();
    return;
  }
  if (!revealed.value || !selected.value) return;
  gestures.key(e);
}
onMounted(() => {
  if (props.mode === "dissection") {
    dock = new ToolDock(
      dockHost.value!,
      ["translate", "rotate", "reflect"],
      selectTool,
    );
    selectTool("rotate");
    hint.value = "";
  }
  if (props.mode === "explanation") showMove();
});
onBeforeUnmount(() => dock?.destroy());
</script>
<template>
  <div class="domain-scene">
    <div
      ref="host"
      class="domain-surface"
      tabindex="0"
      role="region"
      :aria-label="
        mode === 'overview'
          ? 'Wallpaper group overview'
          : mode === 'definition'
            ? 'Fundamental domain demonstration'
            : 'Fundamental domain dissection workspace'
      "
      @pointerdown="pointerdown"
      @pointermove="pointermove"
      @pointerup="pointerup"
      @pointercancel="pointercancel"
      @keydown="key"
    />
    <div
      v-if="mode === 'dissection'"
      v-show="revealed"
      ref="dockHost"
      class="wallpaper-tool-dock"
    />
    <div class="canvas-accessible">
      <p role="status" aria-live="polite">{{ message }}</p>
      <template v-if="mode === 'definition'"
        ><button
          @click="
            step = (step + 1) % 4;
            play(700);
          "
        >
          Next demonstration step
        </button></template
      ><template v-else-if="mode !== 'overview'"
        ><button @click="showAnswer">Show answer</button
        ><button
          @click="
            selected = true;
            gestures.state.cursor = { ...center };
          "
        >
          Select bite</button
        ><button
          @click="
            hint =
              'Rotate the bite 120° clockwise on screen about the purple center.'
          "
        >
          Hint</button
        ><button @click="showMove">Show move</button
        ><button @click="reset">Reset</button
        ><button @click="showMove">Replay</button></template
      >
    </div>
  </div>
</template>
<style>
.domain-scene {
  position: relative;
  height: 100%;
  background: #f5f1e6;
}
.domain-surface {
  height: 100%;
  touch-action: none;
  outline-offset: -3px;
}
.domain-scene .canvas-accessible:focus-within {
  max-height: 30%;
  overflow: auto;
}
</style>
