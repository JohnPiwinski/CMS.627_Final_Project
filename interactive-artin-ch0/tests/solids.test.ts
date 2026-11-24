import { expect, it } from 'vitest';
import { mirrorNormals, solidMesh, type Solid } from '../src/lib/solids';

const examples: [Solid, number, number, number, number, number, number][] = [
  ['Tetrahedron', 4, 6, 4, 3, 3, 6],
  ['Cube', 6, 12, 8, 4, 3, 9],
  ['Octahedron', 8, 12, 6, 3, 4, 9],
  ['Dodecahedron', 12, 30, 20, 5, 3, 15],
  ['Icosahedron', 20, 30, 12, 3, 5, 15],
];

it.each(examples)('%s has the expected topology and feature symmetries', (solid, f, e, v, sides, valence, mirrors) => {
  const { faces, edges, vertices } = solidMesh(solid);
  const planes = mirrorNormals(vertices);
  expect([faces.length, edges.length, vertices.length, planes.length]).toEqual([f, e, v, mirrors]);
  expect(faces.every(face => face.corners.size === sides)).toBe(true);
  expect(vertices.every((_, i) => edges.filter(edge => edge.includes(i)).length === valence)).toBe(true);
  const axes = [
    ...faces.map(face => ({ axis: face.axis, order: sides })),
    ...edges.map(([a, b]) => ({ axis: vertices[a].clone().add(vertices[b]).normalize(), order: 2 })),
    ...vertices.map(vertex => ({ axis: vertex.clone().normalize(), order: valence })),
  ];
  for (const { axis, order } of axes) {
    expect(planes.filter(normal => Math.abs(normal.dot(axis)) < 1e-6)).toHaveLength(order);
    for (const vertex of vertices) {
      const rotated = vertex.clone().applyAxisAngle(axis, 2 * Math.PI / order);
      expect(vertices.some(candidate => candidate.distanceToSquared(rotated) < 1e-10)).toBe(true);
    }
  }
});
