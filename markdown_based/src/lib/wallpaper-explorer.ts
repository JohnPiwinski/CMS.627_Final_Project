import { apply, cellBounds, compose, describeIsometry, inverseAffine, type Affine,
  type Wallpaper } from '../../../interactive-artin-ch0/src/lib/wallpaper';
import data from '../../diagnostics/wallpaper/cells.json';
import type { Point } from './geometry';

export const corners = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
type SourceCell = { basis: number[][]; layers: { fill: string; rings: number[][][] }[] };
const source: Record<string, SourceCell> = data;
const cells = new Map<string, { basis: Affine; layers: { fill: string; rings: Point[][] }[] }>();

export function sourceCell(id: string) {
  const cached = cells.get(id);
  if (cached) return cached;
  const cell = source[id];
  const [u, v] = cell.basis;
  const outline = cell.layers[0].rings[0];
  const center = outline.reduce(([x,y],[a,b]) => [x + a / outline.length,y + b / outline.length], [0,0]);
  const scale = 1 / Math.hypot(u[0],u[1]);
  const basis: Affine = [u[0]*scale,v[0]*scale,u[1]*scale,v[1]*scale,0,0];
  const layers = cell.layers.map(({fill,rings}) => ({ fill, rings: rings.map(ring => ring.map(([x,y]) => ({
    x: (x-center[0])*scale, y: (y-center[1])*scale,
  }))) }));
  const result = { basis, layers };
  cells.set(id,result);
  return result;
}

export function sourceWallpaper(spec: Wallpaper): Wallpaper {
  return { ...spec, basis: sourceCell(spec.id).basis };
}

export function orbitPoints(spec: Wallpaper, seed: Point, viewport: Point[], full: boolean) {
  const seen = new Set<string>();
  const points: { point: Point; translation: boolean }[] = [];
  const basis = spec.basis;
  const inverse = inverseAffine(basis);
  const fractionalSeed = apply(inverse, seed);
  for (const [index, rep] of (full ? spec.reps : spec.reps.slice(0, 1)).entries()) {
    const base = apply(rep, fractionalSeed);
    const shifted = viewport.map(p => {
      const q = apply(inverse, p);
      return apply(basis, { x: q.x - base.x, y: q.y - base.y });
    });
    const bounds = cellBounds(spec, shifted);
    for (let i = bounds.minX; i <= bounds.maxX; i++) for (let j = bounds.minY; j <= bounds.maxY; j++) {
      const point = apply(basis, { x: base.x + i, y: base.y + j });
      const key = point.x.toFixed(7) + ',' + point.y.toFixed(7);
      if (!seen.has(key)) {
        seen.add(key);
        points.push({ point, translation: index === 0 });
      }
    }
  }
  return points;
}

const registered = new Map<string, Wallpaper>();
const fractional = (x: number) => x - Math.floor(x + 1e-8);

/** Register the group's linear parts to the original colored cell. */
export function registeredWallpaper(spec: Wallpaper): Wallpaper {
  const cached = registered.get(spec.id);
  if (cached) return cached;
  const pattern = sourceWallpaper(spec);
  const layers = sourceCell(spec.id).layers.slice(1);
  if (!layers.length) return pattern;
  const inverse = inverseAffine(pattern.basis);
  const patches = layers.flatMap(layer => layer.rings.map(ring => ring.map(p => apply(inverse,p))));
  const vertices = patches.flat();
  const winding = (p: Point, ring: Point[]) => {
    let value = 0;
    for (let i=0;i<ring.length;i++) {
      const a = ring[i], b = ring[(i+1)%ring.length];
      const side = (b.x-a.x)*(p.y-a.y) - (b.y-a.y)*(p.x-a.x);
      if (a.y <= p.y && b.y > p.y && side > 0) value++;
      if (b.y <= p.y && a.y > p.y && side < 0) value--;
    }
    return value;
  };
  const color = (point: Point) => {
    const x = fractional(point.x), y = fractional(point.y);
    for (let i=-1;i<=1;i++) for (let j=-1;j<=1;j++) {
      const p = {x:x+i,y:y+j};
      if (patches.reduce((sum, ring) => sum+winding(p,ring),0)) return true;
    }
    return false;
  };
  const sample: [Point,boolean][] = [];
  for (let i=0;i<47;i++) for (let j=0;j<43;j++) {
    const p={x:(i+.271)/47,y:(j+.313)/43};
    sample.push([p,color(p)]);
  }
  // Probe both sides of every artwork edge as well as the cell interior.
  for (const ring of patches) ring.forEach((a,i) => {
    const b = ring[(i+1)%ring.length];
    for (const t of [.23,.51,.79]) for (const side of [-1,1]) {
      const p = {x:a.x+(b.x-a.x)*t+(b.y-a.y)*side*.0002,
        y:a.y+(b.y-a.y)*t-(b.x-a.x)*side*.0002};
      sample.push([p,color(p)]);
    }
  });
  const reps: Affine[] = [];
  for (const [a,b,c,d,x,y] of pattern.reps) {
    const linear: Affine = [a,b,c,d,0,0];
    const transformed = vertices.map(p => apply(linear,p));
    const candidates = [[x,y], ...vertices.flatMap(p => transformed.map(q => [p.x-q.x,p.y-q.y]))];
    const seen = new Set<string>();
    for (const [u,v] of candidates) {
      const s = fractional(u), t = fractional(v);
      const key = s.toFixed(6)+','+t.toFixed(6);
      if (seen.has(key)) continue;
      seen.add(key);
      const map: Affine = [a,b,c,d,s,t];
      const worldMap = compose(pattern.basis,compose(map,inverse));
      const [e,f,g,h] = worldMap;
      if (Math.abs(e*e+g*g-1)+Math.abs(f*f+h*h-1)+Math.abs(e*f+g*h) > 5e-6) continue;
      if (sample.every(([p,blue]) => color(apply(map,p)) === blue)) { reps.push(map); break; }
    }
  }
  const result = { ...pattern, reps };
  registered.set(spec.id,result);
  return result;
}

export function wallpaperFeatures(spec: Wallpaper, viewport: Point[]) {
  const inverse = inverseAffine(spec.basis);
  const bounds = cellBounds(spec,viewport);
  const result: {kind:'turn'|'mirror'|'glide'; point:Point; angle:number; order:number; amount:number}[] = [];
  for (const [a,b,c,d,x,y] of spec.reps) {
    if (a === 1 && b === 0 && c === 0 && d === 1) continue;
    // A viewport-sized range of translates of each coset representative.
    const extent = Math.max(bounds.maxX-bounds.minX,bounds.maxY-bounds.minY)+3;
    const center = apply(inverse,{x:(viewport[0].x+viewport[2].x)/2,y:(viewport[0].y+viewport[2].y)/2});
    const offset = apply([1-a,-b,-c,1-d,0,0],center);
    for (let i=Math.floor(offset.x)-extent;i<=Math.ceil(offset.x)+extent;i++)
      for (let j=Math.floor(offset.y)-extent;j<=Math.ceil(offset.y)+extent;j++) {
        const affine = compose(spec.basis,compose([a,b,c,d,x+i,y+j],inverse));
        const feature = describeIsometry(affine);
        const order = feature.kind === 'rotate' ?
          [2,3,4,6].find(n => Math.abs(n*feature.angle/(2*Math.PI)-Math.round(n*feature.angle/(2*Math.PI))) < 1e-6) ?? 2 : 0;
        const kind = feature.kind === 'rotate' ? 'turn' : feature.kind === 'reflect' ? 'mirror' : 'glide';
        result.push({ ...feature,kind,order });
      }
  }
  return result;
}

/** SVG hexagon coordinates are rounded to five decimals. */
export function verifiedMove(spec: Wallpaper, world: Affine) {
  const [a,b,c,d,x,y] = compose(inverseAffine(spec.basis),compose(world,spec.basis));
  const wrap = (n: number) => Math.abs(n-Math.round(n));
  const tolerance = 5e-6;
  return spec.reps.some(([e,f,g,h,u,v]) => Math.abs(a-e)+Math.abs(b-f)+Math.abs(c-g)+Math.abs(d-h) < tolerance &&
    wrap(x-u) < tolerance*Math.max(1,Math.abs(x)) && wrap(y-v) < tolerance*Math.max(1,Math.abs(y)));
}
