import * as THREE from 'three';

const radius = Math.sqrt(3);
export const solidGroups = [
  { label: 'Self-dual', solids: ['Tetrahedron'] },
  { label: 'Dual pair', solids: ['Cube', 'Octahedron'] },
  { label: 'Dual pair', solids: ['Dodecahedron', 'Icosahedron'] },
] as const;
export type Solid = typeof solidGroups[number]['solids'][number];

export function solidMesh(solid: Solid) {
  const geometries = {
    Tetrahedron: () => new THREE.TetrahedronGeometry(radius),
    Cube: () => new THREE.BoxGeometry(2, 2, 2),
    Octahedron: () => new THREE.OctahedronGeometry(radius),
    Dodecahedron: () => new THREE.DodecahedronGeometry(radius),
    Icosahedron: () => new THREE.IcosahedronGeometry(radius),
  };
  const geometry = geometries[solid]();
  const positions = geometry.getAttribute('position');
  const vertices: THREE.Vector3[] = [];
  const faces: { axis: THREE.Vector3; triangles: number[]; corners: Set<number> }[] = [];
  for (let i = 0; i < (geometry.index?.count ?? positions.count); i += 3) {
    const points = [0, 1, 2].map(j =>
      new THREE.Vector3().fromBufferAttribute(positions, geometry.index?.getX(i + j) ?? i + j));
    const [a, b, c] = points;
    const axis = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    let face = faces.find(candidate => candidate.axis.dot(axis) > 1 - 1e-6);
    if (!face) {
      face = { axis, triangles: [], corners: new Set() };
      faces.push(face);
    }
    for (const point of points) {
      let index = vertices.findIndex(vertex => vertex.distanceToSquared(point) < 1e-10);
      if (index < 0) index = vertices.push(point) - 1;
      face.corners.add(index);
      face.triangles.push(point.x, point.y, point.z);
    }
  }
  geometry.dispose();
  const edges: [number, number][] = [];
  vertices.forEach((_, a) => {
    for (let b = a + 1; b < vertices.length; b++) {
      if (faces.filter(face => face.corners.has(a) && face.corners.has(b)).length === 2) edges.push([a, b]);
    }
  });
  return { vertices, faces, edges };
}

export function mirrorNormals(vertices: THREE.Vector3[]): THREE.Vector3[] {
  const normals: THREE.Vector3[] = [];
  vertices.forEach((a, i) => {
    for (const b of vertices.slice(i + 1)) {
      const normal = a.clone().sub(b).normalize();
      if (normals.some(n => Math.abs(n.dot(normal)) > 1 - 1e-6)) continue;
      // A plane through the origin that swaps a and b must have normal a − b.
      if (vertices.every(vertex => {
        const reflected = vertex.clone().reflect(normal);
        return vertices.some(candidate => candidate.distanceToSquared(reflected) < 1e-10);
      })) normals.push(normal);
    }
  });
  return normals;
}
