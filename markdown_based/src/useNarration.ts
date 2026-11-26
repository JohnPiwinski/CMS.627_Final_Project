import { onBeforeUnmount, ref, watch } from 'vue';

export function useNarration() {
  const audio = ref<HTMLAudioElement>();
  const playing = ref(false);
  const muted = ref(false);
  const failed = ref(false);

  async function play(replay = false) {
    const clip = audio.value;
    if (!clip || muted.value) return;
    failed.value = false;
    if (replay) clip.currentTime = 0;
    try {
      await clip.play();
    } catch (error) {
      if (audio.value !== clip) return;
      // A browser may require a click before it allows audible playback.
      // Keep Play available in that case.
      if (error instanceof DOMException && ['NotAllowedError', 'AbortError'].includes(error.name)) return;
      failed.value = true;
    }
  }

  function stop() {
    audio.value?.pause();
    if (audio.value) audio.value.currentTime = 0;
    playing.value = failed.value = false;
  }

  watch(audio, (_, previous) => {
    previous?.pause();
    void play();
  }, { flush: 'post' });
  watch(muted, value => {
    if (value) audio.value?.pause();
    else if (!audio.value?.ended) void play();
  });

  onBeforeUnmount(stop);
  return { audio, playing, muted, failed, play, stop };
}
