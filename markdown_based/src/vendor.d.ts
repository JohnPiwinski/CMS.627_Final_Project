// Type-check the public surface used here without checking Slidev's published
// TypeScript internals, which rely on globals injected by its Vite plugins.
import type { ComputedRef } from 'vue';

export function useNav(): {
  currentPage: ComputedRef<number>;
  go(page: number): Promise<void>;
};
export function lockShortcuts(): () => void;
