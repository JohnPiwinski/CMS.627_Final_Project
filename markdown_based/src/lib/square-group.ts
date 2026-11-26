// Elements 0–3 are rᵏ, and 4–7 are rᵏs. The vertical mirror s acts first.
export const elements = ['e', 'r', 'r²', 'r³', 's', 'rs', 'r²s', 'r³s'] as const;
export const rotations = [0, 1, 2, 3];
export const mirrorSubgroup = [0, 4];
export const allMoves = elements.map((_, index) => index);

function mod4(value: number): number {
  return (value % 4 + 4) % 4;
}

export function product(left: number, right: number): number {
  const reflected = left >= 4;
  const turn = mod4(left % 4 + (reflected ? -1 : 1) * (right % 4));
  return turn + (reflected !== (right >= 4) ? 4 : 0);
}

export function inverse(move: number): number {
  return move >= 4 ? move : mod4(-move);
}

export function cornerImage(move: number, corner: number): number {
  return mod4((move >= 4 ? 1 - corner : corner) - move % 4);
}

export function coset(g: number, subgroup: readonly number[], side: 'left' | 'right' = 'left'): number[] {
  return subgroup.map(h => side === 'left' ? product(g, h) : product(h, g));
}

export function conjugate(g: number, subgroup: readonly number[]): number[] {
  return subgroup.map(h => product(product(g, h), inverse(g)));
}

export function sameSet(left: readonly number[], right: readonly number[]): boolean {
  return new Set(left).size === new Set(right).size && left.every(move => right.includes(move));
}

export function partition(subgroup: readonly number[], side: 'left' | 'right' = 'left'): number[][] {
  const blocks: number[][] = [];
  for (const g of allMoves) {
    if (!blocks.some(block => block.includes(g))) blocks.push(coset(g, subgroup, side));
  }
  return blocks;
}
