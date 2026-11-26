import { expect, it } from 'vitest';
import { additiveHomomorphism, residue } from '../src/lib/clock';
import { partition, product } from '../src/lib/square-group';

it('computes the kernel and all fibers for reduction modulo six', () => {
  const map = additiveHomomorphism(12, 6, 1)!;
  expect(map.kernel).toEqual([0, 6]);
  expect(map.fibers).toEqual([[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]]);
  expect(map.image).toEqual([0,1,2,3,4,5]);
});

it('keeps empty fibers visible and rejects an invalid generator image', () => {
  const map = additiveHomomorphism(6, 12, 2)!;
  expect(map.kernel).toEqual([0]);
  expect(map.fibers[1]).toEqual([]);
  expect(map.image).toEqual([0,2,4,6,8,10]);
  expect(additiveHomomorphism(6, 12, 1)).toBeUndefined();
});

it('illustrates both clock groupings, square composition order, and quotient products', () => {
  expect(residue(residue(2 + 3, 12) + 2, 12)).toBe(residue(2 + residue(3 + 2, 12), 12));
  expect(product(1, 4)).toBe(5);
  expect(product(4, 1)).toBe(7);
  const [keep, flip] = partition([0,1,2,3]);
  expect(flip.flatMap(a => flip.map(b => product(a,b))).every(x => keep.includes(x))).toBe(true);
});
