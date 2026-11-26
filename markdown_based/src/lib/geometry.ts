/** Pure mathematical operations. The renderer never owns the underlying geometry. */
export type Point = Readonly<{ x: number; y: number }>;
export type LatticeType = 'square' | 'triangular';
export type LatticeTool = 'translate' | 'rotate' | 'reflect' | 'glide';

export const SQRT3 = Math.sqrt(3);
export const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (p: Point, k: number): Point => ({ x: p.x * k, y: p.y * k });
export const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Point, b: Point, t: number): Point => add(scale(a, 1 - t), scale(b, t));
export const ease = (t: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

export function latticePoint(i: number, j: number, type: LatticeType): Point {
  return type === 'square' ? { x: i, y: j } : { x: i + j / 2, y: j * SQRT3 / 2 };
}

export function nearestLatticePoint(point: Point, type: LatticeType): Point {
  const guessJ = type === 'square' ? point.y : (2 * point.y) / SQRT3;
  const guessI = type === 'square' ? point.x : point.x - guessJ / 2;
  let closest = latticePoint(Math.round(guessI), Math.round(guessJ), type);
  let best = distance(point, closest);
  for (let di = -2; di <= 2; di++) {
    for (let dj = -2; dj <= 2; dj++) {
      const candidate = latticePoint(Math.round(guessI) + di, Math.round(guessJ) + dj, type);
      const d = distance(point, candidate);
      if (d < best) { closest = candidate; best = d; }
    }
  }
  return closest;
}

export function rotateAbout(point: Point, center: Point, radians: number): Point {
  const p = sub(point, center);
  const c = Math.cos(radians), s = Math.sin(radians);
  return add({ x: c * p.x - s * p.y, y: s * p.x + c * p.y }, center);
}

/** Reflection across the infinite line through center making `angle` with +x. */
export function reflectAcross(point: Point, center: Point, angle: number): Point {
  const p = sub(point, center);
  const c = Math.cos(2 * angle), s = Math.sin(2 * angle);
  return add({ x: c * p.x + s * p.y, y: s * p.x - c * p.y }, center);
}

/** The nearest allowed directed ray; opposing rays define the same reflection line. */
export function snappedAxisAngle(direction: number, type: LatticeType): number {
  const sectors = type === 'square' ? 4 : 6;
  return (Math.round(direction / (2 * Math.PI / sectors)) * 2 * Math.PI) / sectors;
}

export function startingMotif(type: LatticeType): Point[] {
  // One asymmetric, labeled triangle. The lattice itself is invariant under the tutorial motions.
  return [[-2, -1], [0, -1], [-2, 0]].map(([i, j]) => latticePoint(i, j, type));
}

export function targetMotif(type: LatticeType): Point[] {
  const origin = latticePoint(0, 0, type);
  const offset = latticePoint(2, 0, type);
  const turn = type === 'square' ? Math.PI / 2 : Math.PI / 3;
  return startingMotif(type).map(point =>
    add(reflectAcross(rotateAbout(point, origin, turn), origin, 0), offset));
}

export function matchesMotif(points: readonly Point[], target: readonly Point[]): boolean {
  return points.length === target.length &&
    points.every((point, index) => distance(point, target[index]) < 1e-6);
}
