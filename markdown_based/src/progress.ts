import { defineStore } from 'pinia';

type Progress = { visited: string[]; completed: string[] };
const key = 'markdown-based:chapter-zero:v1';
function load(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<Progress>;
    return {
      visited: Array.isArray(value.visited) ? value.visited.filter(id => typeof id === 'string') : [],
      completed: Array.isArray(value.completed) ? value.completed.filter(id => typeof id === 'string') : [],
    };
  } catch { return { visited: [], completed: [] }; }
}
export const useProgress = defineStore('tutorial-progress', {
  state: load,
  actions: {
    mark(kind: keyof Progress, id: string) {
      if (this[kind].includes(id)) return;
      this[kind].push(id);
      try { localStorage.setItem(key, JSON.stringify(this.$state)); } catch { /* Storage can be disabled. */ }
    },
  },
});
