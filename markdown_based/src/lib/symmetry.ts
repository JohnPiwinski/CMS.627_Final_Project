import { Matrix4, Vector3 } from 'three';
import type { Feature } from './features';
import { mirrorNormals, solidMesh, type Solid } from './solids';

export type Symmetry = {
  key: string;
  permutation: number[];
  matrix: Matrix4;
  kind: 'identity' | 'rotation' | 'reflection' | 'other';
};

export function identify(vertices: Vector3[], matrix: Matrix4): Symmetry | undefined {
  const permutation = vertices.map(vertex => {
    const image = vertex.clone().applyMatrix4(matrix);
    return vertices.findIndex(candidate => candidate.distanceToSquared(image) < 1e-9);
  });
  if (permutation.includes(-1) || new Set(permutation).size !== vertices.length) return;
  const det = matrix.determinant();
  if (Math.abs(Math.abs(det) - 1) > 1e-6) return;
  const e = matrix.elements;
  const trace = e[0] + e[5] + e[10];
  const involution = permutation.every((j, i) => permutation[j] === i);
  const kind = permutation.every((j, i) => j === i) ? 'identity'
    : det > 0 ? 'rotation' : involution && Math.abs(trace - 1) < 1e-6 ? 'reflection' : 'other';
  return { key: permutation.join(','), permutation, matrix: matrix.clone(), kind };
}

export function reflectionMatrix(normal: Vector3, amount = 1): Matrix4 {
  const { x, y, z } = normal;
  const k = 2 * amount;
  return new Matrix4().set(1-k*x*x,-k*x*y,-k*x*z,0,-k*y*x,1-k*y*y,-k*y*z,0,
    -k*z*x,-k*z*y,1-k*z*z,0,0,0,0,1);
}

const sortedKey = (indices: number[]) => indices.sort((a, b) => a - b).join(',');
const cache = new Map<Solid, ReturnType<typeof buildGroup>>();
function buildGroup(solid: Solid) {
  const { vertices, edges, faces } = solidMesh(solid);
  const features: Record<Feature, number[][]> = {
    vertex: vertices.map((_, i) => [i]), edge: edges, face: faces.map(face => [...face.corners]),
  };
  const keys = Object.fromEntries(Object.entries(features).map(([type, sets]) =>
    [type, new Map(sets.map((set, index) => [sortedKey([...set]), index]))])) as Record<Feature, Map<string, number>>;
  const image = (type: Feature, index: number, by: Symmetry): number =>
    keys[type].get(sortedKey(features[type][index].map(i => by.permutation[i])))!;
  const identity = identify(vertices, new Matrix4())!;
  const elements = new Map([[identity.key, identity]]);
  const pending = [identity];
  const generators = [
    ...faces.map(face => new Matrix4().makeRotationAxis(face.axis, 2 * Math.PI / face.corners.size)),
    ...mirrorNormals(vertices).map(normal => reflectionMatrix(normal)),
  ];
  for (const element of pending) {
    for (const generator of generators) {
      const next = identify(vertices, generator.clone().multiply(element.matrix));
      if (next && !elements.has(next.key)) {
        elements.set(next.key, next);
        pending.push(next);
      }
    }
  }
  return { vertices, features, elements, identity, image };
}

export function symmetryGroup(solid: Solid) {
  let group = cache.get(solid);
  if (!group) {
    group = buildGroup(solid);
    cache.set(solid, group);
  }
  return group;
}

export function featureCounts(solid: Solid, type: Feature, rotationsOnly: boolean) {
  const group = symmetryGroup(solid);
  const elements = [...group.elements.values()].filter(g =>
    !rotationsOnly || g.kind === 'identity' || g.kind === 'rotation');
  const images = new Set(elements.map(g => group.image(type, 0, g)));
  const fixes = elements.filter(g => group.image(type, 0, g) === 0);
  return { orbit: images.size, stabilizer: fixes.length, group: elements.length };
}
