import { expect, it } from 'vitest';
import { allMoves, conjugate, cornerImage, coset, inverse, mirrorSubgroup, partition, product, rotations, sameSet } from '../src/lib/square-group';

it('computes the square action and defines a group on eight distinct moves', () => {
  const corners = [0, 1, 2, 3];
  expect(corners.map(corner => cornerImage(1, corner))).toEqual([3, 0, 1, 2]);
  expect(new Set(allMoves.map(move => corners.map(corner => cornerImage(move, corner)).join())).size).toBe(8);
  for (const a of allMoves) {
    expect(product(a, inverse(a))).toBe(0);
    expect(product(0, a)).toBe(a);
    for (const b of allMoves) {
      expect(allMoves).toContain(product(a, b));
      expect(corners.map(corner => cornerImage(product(a, b), corner))).toEqual(
        corners.map(corner => cornerImage(a, cornerImage(b, corner))));
      for (const c of allMoves) expect(product(a, product(b, c))).toBe(product(product(a, b), c));
    }
  }
  expect(product(1, 4)).not.toBe(product(4, 1));
});

it('partitions the group into cosets and distinguishes normality', () => {
  expect(partition(rotations)).toHaveLength(2);
  expect(partition(mirrorSubgroup)).toHaveLength(4);
  expect(sameSet(coset(4, rotations), coset(5, rotations))).toBe(true);
  expect(conjugate(1, mirrorSubgroup)).toEqual([0, 6]);
  expect(sameSet(coset(1, mirrorSubgroup), coset(1, mirrorSubgroup, 'right'))).toBe(false);
  expect(allMoves.every(g => sameSet(rotations, conjugate(g, rotations)))).toBe(true);
});

it('orientation composes and is independent of the representatives used for its quotient', () => {
  for (const a of allMoves) {
    for (const b of allMoves) {
      const orientation = (move: number) => Math.floor(move / 4);
      expect(orientation(product(b, a))).toBe((orientation(a) + orientation(b)) % 2);
      expect(orientation(product(b, a))).toBe(
        orientation(product(coset(b, rotations)[2], coset(a, rotations)[1])),
      );
    }
  }
});
