export type Move = number;
export const moves = (n = 4): Move[] => Array.from({length: 2*n}, (_, i) => i);
const mod = (i:number,n:number) => ((i%n)+n)%n;
// Encoding r^k s^b: 0…n−1 are turns, n…2n−1 are reflections.
export function product(g: Move, h: Move, n = 4): Move {
  const flip = g >= n;
  return mod(g % n + (flip ? -1 : 1) * (h % n), n) + (flip !== (h >= n) ? n : 0);
}
export const inverse = (g: Move, n = 4): Move => g >= n ? g : mod(-g,n);
export const act = (g: Move, x: number, n = 4) => mod(g % n + (g >= n ? -x : x), n);
export const moveName = (g: Move, n = 4) => {
  const k = g % n;
  return (k ? k === 1 ? 'r' : `r${['','','²','³','⁴','⁵','⁶','⁷','⁸','⁹'][k] ?? k}` : '') + (g >= n ? 's' : '') || 'e';
};
export const coset = (h: Move[], g: Move, side: 'left'|'right' = 'left') =>
  h.map(x => side === 'left' ? product(g,x) : product(x,g)).sort((a,b)=>a-b);
export const equalSet = (a: Move[], b: Move[]) => a.length === b.length && a.every(x => b.includes(x));
export function partition(h: Move[]): Move[][] {
  const groups: Move[][] = [];
  for (const g of moves()) if (!groups.some(pile=>pile.includes(g))) groups.push(coset(h,g));
  return groups;
}
export const conjugate = (h: Move[], g: Move) => h.map(x=>product(product(g,x),inverse(g))).sort((a,b)=>a-b);
export const normal = (h: Move[]) => moves().every(g=>equalSet(h,conjugate(h,g)));
export const sign = (g: Move) => g < 4 ? 1 : -1;
export function subgroupIssue(h: Move[]): string | undefined {
  if (!h.includes(0)) return 'Try adding e, the move that leaves every corner in place.';
  for (const g of h) if (!h.includes(inverse(g))) return `${moveName(g)} needs its undo move, ${moveName(inverse(g))}.`;
  for (const g of h) for (const k of h) if (!h.includes(product(g,k))) {
    return `${moveName(g)} ∘ ${moveName(k)} gives ${moveName(product(g,k))}. Is that move in your club?`;
  }
}

export function cyclesOf(permutation:number[]): number[][] {
  const seen=new Set<number>();
  const cycles:number[][]=[];
  for(let start=0;start<permutation.length;start++) {
    if(seen.has(start))continue;
    const cycle:number[]=[];
    let index=start;
    while(!seen.has(index)){
      seen.add(index);cycle.push(index);index=permutation[index];
    }
    cycles.push(cycle);
  }
  return cycles;
}
export function permutationParity(permutation:number[]): 'even'|'odd' {
  return (permutation.length-cyclesOf(permutation).length)%2===0?'even':'odd';
}
