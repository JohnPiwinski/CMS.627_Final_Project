import { Matrix4, Vector3 } from 'three';
import { expect, it } from 'vitest';
import { featureCounts, identify, symmetryGroup } from '../src/lib/symmetry';
import { newTrial, recordMove, trialKey } from '../src/lib/discovery';
import type { Solid } from '../src/lib/solids';

const cases: [Solid, number, number[], number[]][] = [
  ['Tetrahedron', 24, [4, 6, 4], [6, 4, 6]],
  ['Cube', 48, [6, 12, 8], [8, 4, 6]],
  ['Octahedron', 48, [8, 12, 6], [6, 4, 8]],
  ['Dodecahedron', 120, [12, 30, 20], [10, 4, 6]],
  ['Icosahedron', 120, [20, 30, 12], [6, 4, 10]],
];
it.each(cases)('%s has the correct finite group and setwise feature actions', (solid, order, orbits, fixes) => {
  const group = symmetryGroup(solid);
  const elements = [...group.elements.values()];
  expect(elements).toHaveLength(order);
  expect(elements.filter(g => g.matrix.determinant() > 0)).toHaveLength(order / 2);
  expect(elements.filter(g => g.kind === 'identity')).toEqual([group.identity]);
  for (const g of elements) {
    expect(new Set(g.permutation).size).toBe(group.vertices.length);
    const product = identify(group.vertices, g.matrix.clone().multiply(g.matrix));
    expect(group.elements.has(product!.key)).toBe(true);
  }
  for (const [i, type] of (['face', 'edge', 'vertex'] as const).entries()) {
    for (const rotationsOnly of [false, true]) {
      const counts = featureCounts(solid, type, rotationsOnly);
      expect(counts.orbit).toBe(orbits[i]);
      expect(counts.stabilizer).toBe(fixes[i] / (rotationsOnly ? 2 : 1));
      expect(counts.orbit * counts.stabilizer).toBe(counts.group);
    }
    for (const [index] of group.features[type].entries()) {
      const stable = elements.filter(g => group.image(type, index, g) === index);
      expect(stable.filter(g => g.kind === 'reflection')).toHaveLength(fixes[i] / 2);
      expect(stable.filter(g => g.kind === 'other')).toHaveLength(0);
    }
  }
  const [a, b] = group.features.edge[0];
  expect(elements.some(g => g.kind === 'rotation' && g.permutation[a] === b && g.permutation[b] === a)).toBe(true);
});

it('canonicalizes turns, rejects invalid rotations, and deduplicates destinations and stabilizers', () => {
  const group = symmetryGroup('Cube');
  const axis = new Vector3(0, 0, 1);
  const turn = (radians: number) => identify(group.vertices, new Matrix4().makeRotationAxis(axis, radians));
  expect(turn(2 * Math.PI)?.key).toBe(group.identity.key);
  expect(turn(Math.PI / 2)?.key).toBe(turn(5 * Math.PI / 2)?.key);
  expect(turn(37 * Math.PI / 180)).toBeUndefined();
  const trial = newTrial('Cube', 'face', 0, false);
  const same = [...group.elements.values()].filter(g => g.kind !== 'identity' && group.image('face', 0, g) === 0);
  expect(recordMove(trial, same[0]).freshSymmetry).toBe(true);
  expect(recordMove(trial, same[0]).freshSymmetry).toBe(false);
  expect(recordMove(trial, same[1]).freshSymmetry).toBe(true);
  expect(trial.visited).toEqual([0]);
  const moved = [...group.elements.values()].filter(g => group.image('face', 0, g) === 1);
  expect(recordMove(trial, moved[0]).freshPosition).toBe(true);
  expect(recordMove(trial, moved[1]).freshPosition).toBe(false);
  const count = trial.saved.length;
  trial.history.pop();
  trial.history = [group.identity.key];
  expect(trial.visited).toEqual([0, 1]);
  expect(trial.saved).toHaveLength(count);
  expect(trialKey('Cube', 'face', false)).not.toBe(trialKey('Tetrahedron', 'face', false));
});
