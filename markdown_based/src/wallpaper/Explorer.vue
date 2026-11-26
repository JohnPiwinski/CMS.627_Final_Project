<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from "vue";
import { createWallpaperScene } from "./ArtinScene";
import { artinPatterns, type Collection } from "./catalog";
import Konva from "konva";
const surface = ref<HTMLDivElement>(),
  dock = ref<HTMLDivElement>(),
  accessible = ref<HTMLDivElement>(),
  selectors = ref<HTMLDivElement>();
const collection = ref<Collection>("artin"),
  group = ref("p31m");
let expanded = false;
let scene: ReturnType<typeof createWallpaperScene> | undefined,
  stage: Konva.Stage | undefined;
function chooseGroup(value: string) {
  expanded = false;
  group.value = value;
  scene?.setGroup(value);
  paint();
}
function chooseCollection(value: Collection) {
  collection.value = value;
  scene?.setCollection(value);
  paint();
}
function paint() {
  if (!stage) return;
  stage.destroyChildren();
  const layer = new Konva.Layer();
  stage.add(layer);
  const width = selectors.value!.clientWidth;
  const columns = width < 600 ? 2 : 3,
    rows = Math.ceil(17 / columns);
  stage.size({ width, height: expanded ? 90 + rows * 38 : 76 });
  const label = new Konva.Text({
    x: 10,
    y: 10,
    text: `${group.value} · ${collection.value === "artin" ? artinPatterns.find((p) => p.group === group.value)?.name : "Wikipedia pattern"} ▾`,
    fontSize: 14,
    padding: 10,
    fill: "#f6eedb",
  });
  layer.add(
    new Konva.Rect({
      x: 10,
      y: 10,
      width: Math.min(width - 20, 330),
      height: 34,
      fill: "#203b34",
      cornerRadius: 5,
    }),
    label,
  );
  label.on("click tap", () => {
    expanded = !expanded;
    paint();
  });
  let x = 10;
  for (const value of ["artin", "wikipedia"] as Collection[]) {
    const text = value === "artin" ? "Artin" : "Wikipedia";
    const b = new Konva.Group({ x, y: 49 });
    b.add(
      new Konva.Rect({
        width: 100,
        height: 25,
        fill: collection.value === value ? "#427760" : "#263d34",
        cornerRadius: 12,
      }),
      new Konva.Text({
        text,
        width: 100,
        align: "center",
        y: 5,
        fontSize: 13,
        fill: "#fff",
      }),
    );
    b.on("click tap", () => chooseCollection(value));
    layer.add(b);
    x += 104;
  }
  if (expanded) {
    const menu = new Konva.Group({ y: 84 });
    menu.add(new Konva.Rect({ width, height: rows * 38 + 4, fill: "#172824" }));
    artinPatterns.forEach((p, i) => {
      const item = new Konva.Group({
        x: ((i % columns) * width) / columns + 4,
        y: Math.floor(i / columns) * 38 + 2,
      });
      item.add(
        new Konva.Rect({
          width: width / columns - 8,
          height: 34,
          fill: p.group === group.value ? "#427760" : "#263d34",
          cornerRadius: 4,
        }),
        new Konva.Text({
          x: 7,
          y: 9,
          width: width / columns - 20,
          text: `${p.group} · ${p.name}`,
          fontSize: 12,
          fill: "#fff",
          ellipsis: true,
          wrap: "none",
        }),
      );
      item.on("click tap", () => chooseGroup(p.group));
      menu.add(item);
    });
    layer.add(menu);
  }
  layer.draw();
}
let observer: ResizeObserver;
onMounted(() => {
  scene = createWallpaperScene(
    surface.value!,
    dock.value!,
    accessible.value!,
    (p) => {
      group.value = p.group;
      paint();
    },
    collection.value,
    group.value,
  );
  stage = new Konva.Stage({
    container: selectors.value!,
    width: 1,
    height: 76,
  });
  observer = new ResizeObserver(paint);
  observer.observe(selectors.value!);
  paint();
});
onBeforeUnmount(() => {
  observer?.disconnect();
  stage?.destroy();
  scene?.dispose();
});
</script>
<template>
  <div class="chapter-explorer">
    <div ref="selectors" class="explorer-selectors" />
    <div
      ref="surface"
      class="chapter-wallpaper"
      tabindex="0"
      role="region"
      aria-label="Wallpaper transformation workspace"
    />
    <div ref="dock" class="wallpaper-tool-dock" />
    <div ref="accessible" class="canvas-accessible">
      <label
        >Wallpaper group<select
          :value="group"
          @change="chooseGroup(($event.target as HTMLSelectElement).value)"
        >
          <option v-for="p in artinPatterns" :key="p.id" :value="p.group">
            {{ p.group }} · {{ p.name }}
          </option>
        </select></label
      >
      <button
        @click="chooseCollection('artin')"
        :aria-pressed="collection === 'artin'"
      >
        Artin</button
      ><button
        @click="chooseCollection('wikipedia')"
        :aria-pressed="collection === 'wikipedia'"
      >
        Wikipedia
      </button>
      <div role="status" aria-live="polite" />
      <button
        v-for="tool in ['translate', 'rotate', 'reflect', 'glide']"
        :key="tool"
        :data-tool="tool"
      >
        {{ tool }}
      </button>
      <button
        v-for="action in ['lattice', 'compare', 'pan', 'reset', 'example']"
        :key="action"
        :data-action="action"
      >
        {{ action }}
      </button>
    </div>
  </div>
</template>
<style>
.chapter-explorer {
  height: 100%;
  position: relative;
  display: grid;
  grid-template-rows: 80px minmax(0, 1fr);
  background: #dce7db;
}
.explorer-selectors {
  position: relative;
  z-index: 2;
  background: #172824;
}
.chapter-wallpaper {
  min-height: 0;
  touch-action: none;
}
.wallpaper-tool-dock {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}
.canvas-accessible {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.canvas-accessible:focus-within {
  width: auto;
  max-width: 95%;
  height: auto;
  clip-path: none;
  z-index: 5;
  padding: 8px;
  background: #172824;
}
.chapter-explorer select {
  max-width: 100%;
}
</style>
