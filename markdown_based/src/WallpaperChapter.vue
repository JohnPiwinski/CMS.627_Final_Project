<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import { useNarration } from "./useNarration";
import Explorer from "./wallpaper/Explorer.vue";
import DomainScene from "./wallpaper/DomainScene.vue";
import markdown from "../content/wallpaper.md?raw";
import { parseChapter } from "./content";
import assets from "./narration-assets.json";
defineEmits<{ office: [] }>();
const chapter = parseChapter(markdown, "content/wallpaper.md");
const pages = chapter.sections.flatMap((s) => s.subsections),
  index = ref(0),
  page = computed(() => pages[index.value]);
const visits = ref(new Set([pages[0].id]));
const { audio, playing, muted, failed, play, stop } = useNarration();
const transcript = ref(false),
  subtitles = ref(false);
const narration = computed(() => page.value.beats[0].narration);
const files: Record<string, { text: string; file: string }> = assets;
const clip = computed(() => {
  const voice = narration.value,
    file = voice && files[voice.id];
  return voice && file?.text === voice.text
    ? import.meta.env.BASE_URL + "narration/" + file.file
    : undefined;
});
const mode = computed(() =>
  page.value.scene === "wallpaper-overview"
    ? "overview"
    : page.value.scene === "wallpaper-domain"
      ? "definition"
      : page.value.scene === "wallpaper-explanation"
        ? "explanation"
        : "dissection",
);
function jump(next: number) {
  stop();
  index.value = next;
  visits.value.add(page.value.id);
}
watch(
  () => page.value.id,
  async () => {
    await nextTick();
    document
      .querySelector(".wallpaper-chapter .dot[aria-current]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  },
);
</script>
<template>
  <Teleport to="body">
    <main class="tutorial wallpaper-chapter" @keydown.stop>
      <header class="tutorial-header">
        <div class="tutorial-brand">
          <button @click="$emit('office')">← Office</button>
          <h1>{{ chapter.title }}</h1>
        </div>
        <nav aria-label="Wallpaper sections">
          <div
            v-for="section in chapter.sections"
            :key="section.id"
            class="section"
          >
            <button
              class="section-title"
              @click="jump(pages.indexOf(section.subsections[0]))"
            >
              {{ section.title }}
            </button>
            <div class="section-dots">
              <button
                v-for="sub in section.subsections"
                :key="sub.id"
                class="dot"
                :aria-label="sub.title"
                :title="sub.title"
                :aria-current="page.id === sub.id ? 'step' : undefined"
                :class="{ visited: visits.has(sub.id) }"
                @click="jump(pages.indexOf(sub))"
              >
                <span />
              </button>
            </div>
          </div>
        </nav>
      </header>
      <section class="lesson" :aria-label="page.title">
        <div class="lesson-title">
          <h2>{{ page.title }}</h2>
          <span class="wallpaper-page-number"
            >{{ index + 1 }} / {{ pages.length }}</span
          >
        </div>
        <div class="scene-frame wallpaper-scene-frame">
          <Explorer v-if="page.scene === 'wallpaper-playground'" />
          <DomainScene v-else :key="page.id" :mode="mode" />
        </div>
      </section>

      <footer class="guide">
        <p
          v-if="
            narration &&
            (transcript || (subtitles && playing) || failed || !clip)
          "
          class="transcript"
        >
          {{ narration.text }}
        </p>
        <div class="guide-actions">
          <div v-if="narration" class="audio-actions" aria-label="Narration">
            <audio
              v-if="clip"
              :key="clip"
              ref="audio"
              :src="clip"
              :muted="muted"
              preload="metadata"
              @playing="playing = true"
              @pause="playing = false"
              @ended="playing = false"
              @error="failed = true"
            />
            <button v-if="clip" @click="playing ? audio?.pause() : play()">
              {{ playing ? "Pause voiceover" : "Play voiceover" }}
            </button>
            <button v-if="clip" @click="play(true)">Replay voiceover</button>
            <button :aria-pressed="muted" @click="muted = !muted">
              {{ muted ? "Unmute" : "Mute" }}
            </button>
            <button :aria-pressed="subtitles" @click="subtitles = !subtitles">
              Subtitles
            </button>
            <button
              :aria-pressed="transcript"
              @click="transcript = !transcript"
            >
              Transcript
            </button>
          </div>
          <button v-if="index > 0" @click="jump(index - 1)">Back</button>
          <button
            class="continue"
            @click="
              index + 1 < pages.length ? jump(index + 1) : $emit('office')
            "
          >
            {{ index + 1 < pages.length ? "Continue" : "Finish chapter" }}
          </button>
        </div>
      </footer>
    </main>
  </Teleport>
</template>

<style>
.wallpaper-scene-frame {
  flex: 1;
  min-height: 0;
  position: relative;
  overflow: hidden;
}
.wallpaper-page-number {
  font-size: 0.85rem;
  color: #aebeb0;
}
.wallpaper-chapter .lesson-title h2 {
  white-space: normal;
}
</style>
