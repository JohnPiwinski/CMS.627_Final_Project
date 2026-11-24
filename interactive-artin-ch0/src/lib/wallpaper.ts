import { add, scale, sub, type Point } from './geometry';
export type Affine = readonly [number,number,number,number,number,number];
export const identity: Affine = [1,0,0,1,0,0];
export const det = ([a,b,c,d]: Affine) => a*d-b*c;
export const apply = ([a,b,c,d,x,y]: Affine, p: Point): Point => ({x:a*p.x+b*p.y+x,y:c*p.x+d*p.y+y});
export const compose = ([a,b,c,d,x,y]: Affine,[e,f,g,h,u,v]: Affine): Affine =>
  [a*e+b*g,a*f+b*h,c*e+d*g,c*f+d*h,a*u+b*v+x,c*u+d*v+y];
export const translate = (p: Point): Affine => [1,0,0,1,p.x,p.y];
export function inverseAffine([a,b,c,d,x,y]: Affine): Affine {
  const k=a*d-b*c;
  return [d/k,-b/k,-c/k,a/k,(b*y-d*x)/k,(c*x-a*y)/k];
}
const m = (a:number,b:number,c:number,d:number,x=0,y=0): Affine => [a,b,c,d,x,y];
const half = m(-1,0,0,-1), mirror = m(1,0,0,-1), quarter=m(0,-1,1,0);
const sixty=m(0,-1,1,1), third=compose(sixty,sixty), centeredMirror=m(1,1,0,-1);
export const bases = {
  oblique:m(1,.28,0,.79), rectangular:m(1,0,0,.73), centered:m(1,.5,0,.63),
  square:identity, triangular:m(1,.5,0,Math.sqrt(3)/2),
} as const;
type Basis = keyof typeof bases;
function define(id:string,basis:Basis,note:string,...generators:Affine[]) {
  const wrap = (n:number) => ((n%1)+1)%1;
  const canonical = ([a,b,c,d,x,y]:Affine): Affine => [a,b,c,d,wrap(x),wrap(y)];
  const reps = [identity];
  const keys = new Set([identity.join()]);
  for (const rep of reps) for (const g of generators) {
    const next=canonical(compose(g,rep)), key=next.join();
    if (!keys.has(key)) { keys.add(key); reps.push(next); }
    if (reps.length > 12) throw new Error(`Invalid wallpaper generators: ${id}`);
  }
  return { id,basis:bases[basis], lattice:basis, note,generators,reps };
}
export const wallpapers = [
  define('p1','oblique','Translations only.'),
  define('p2','oblique','Half-turns, with no mirrors.',half),
  define('pm','rectangular','Parallel mirror lines, with no turns.',mirror),
  define('pg','rectangular','Flip and slide by half a period. There are no mirrors.',m(1,0,0,-1,.5)),
  define('cm','centered','Parallel mirrors in staggered rows.',centeredMirror),
  define('pmm','rectangular','Two perpendicular families of mirrors.',mirror,half),
  define('pmg','rectangular','Mirrors one way, glides perpendicular to them.',mirror,m(-1,0,0,1,0,.5)),
  define('pgg','rectangular','Perpendicular glides and half-turns, with no mirrors.',m(1,0,0,-1,.5),m(-1,0,0,1,0,.5)),
  define('cmm','centered','A centered lattice with perpendicular mirrors.',centeredMirror,half),
  define('p4','square','Quarter-turns, with no mirrors.',quarter),
  define('p4m','square','Quarter-turn centers lie on mirrors.',quarter,mirror),
  define('p4g','square','Quarter-turn centers lie off the diagonal mirrors.',quarter,m(1,0,0,-1,.5,.5)),
  define('p3','triangular','Third-turns, with no mirrors.',third),
  define('p3m1','triangular','Every third-turn center lies on a mirror.',third,m(0,1,1,0)),
  define('p31m','triangular','Some third-turn centers lie off the mirrors.',third,centeredMirror),
  define('p6','triangular','Sixth-turns, with no mirrors.',sixty),
  define('p6m','triangular','Sixth-turn centers lie on mirrors.',sixty,centeredMirror),
];
export type Wallpaper = typeof wallpapers[number];
export function preserves(spec:Wallpaper, world:Affine):boolean {
  const [a,b,c,d,x,y]=compose(inverseAffine(spec.basis),compose(world,spec.basis));
  const near = (n:number) => Math.abs(n) < 1e-7;
  const integer = (n:number) => near(n-Math.round(n));
  return spec.reps.some(([e,f,g,h,u,v])=>near(a-e)&&near(b-f)&&near(c-g)&&near(d-h)&&integer(x-u)&&integer(y-v));
}
export function motion(kind:string, center:Point, angle:number, amount:number, t=1):Affine {
  const around = (f:Affine) => compose(translate(center),compose(f,translate(scale(center,-1))));
  if (kind==='translate') return translate(scale(center,t));
  if (kind==='rotate') {
    const c=Math.cos(angle*t),s=Math.sin(angle*t);
    return around(m(c,-s,s,c));
  }
  const c=Math.cos(angle),s=Math.sin(angle);
  const k=2*t;
  return around(m(1-k*s*s,k*s*c,k*s*c,1-k*c*c,
    kind==='glide'?amount*t*c:0,kind==='glide'?amount*t*s:0));
}
export function features(spec: Wallpaper) {
  const result: {kind:'turn'|'mirror'|'glide'; point:Point; angle:number; order:number; affine:Affine}[]=[];
  const inv=inverseAffine(spec.basis);
  for (const [a,b,c,d,x,y] of spec.reps) for (let i=-1;i<=2;i++) for (let j=-1;j<=2;j++) {
    const f=compose(spec.basis,compose(m(a,b,c,d,x+i,y+j),inv));
    const [e,g,h,k,u,v]=f;
    if (det(f)>0) {
      if (a===1&&d===1&&b===0&&c===0) continue;
      const point=apply(inverseAffine(m(1-e,-g,-h,1-k)),{x:u,y:v});
      const angle=Math.atan2(h,e),order=Math.round(2*Math.PI/Math.abs(angle));
      const actual=order===3||order===4||order===6?order:2;
      if (!result.some(q=>q.kind==='turn'&&Math.hypot(q.point.x-point.x,q.point.y-point.y)<1e-7&&q.order===actual))
        result.push({kind:'turn',point,angle,order:actual,affine:f});
    } else {
      const angle=Math.atan2(h,e)/2, t={x:Math.cos(angle),y:Math.sin(angle)},n={x:-t.y,y:t.x};
      const height=(u*n.x+v*n.y)/2, slide=u*t.x+v*t.y;
      const point=scale(n,height), kind=Math.abs(slide)<1e-7?'mirror':'glide';
      if (!result.some(q=>q.kind===kind&&Math.abs(q.angle-angle)<1e-7&&Math.hypot(q.point.x-point.x,q.point.y-point.y)<1e-7))
        result.push({kind,point,angle,order:0,affine:f});
    }
  }
  return result;
}
export function cellBounds(spec:Wallpaper, corners:Point[]) {
  const points=corners.map(p=>apply(inverseAffine(spec.basis),p));
  return { minX:Math.floor(Math.min(...points.map(p=>p.x)))-2,maxX:Math.ceil(Math.max(...points.map(p=>p.x)))+2,
    minY:Math.floor(Math.min(...points.map(p=>p.y)))-2,maxY:Math.ceil(Math.max(...points.map(p=>p.y)))+2 };
}
export const basisVector = (spec:Wallpaper,i:number) => sub(apply(spec.basis,{x:i===0?1:0,y:i===1?1:0}),apply(spec.basis,{x:0,y:0}));
export const toWorld = (spec:Wallpaper,g:Affine) => compose(spec.basis,compose(g,inverseAffine(spec.basis)));

const seeds = new Map<string, Point>();
export function motifSeed(spec:Wallpaper):Point {
  const key = spec.id + ':' + spec.basis.join(',');
  const cached = seeds.get(key);
  if (cached) return cached;
  if (spec.reps.length===1) return {x:.38,y:.42};
  const shifts = [-2,-1,0,1,2];
  const nearby = spec.reps.flatMap((rep,index)=>shifts.flatMap(i=>
    shifts.filter(j=>index!==0 || i!==0 || j!==0).map(j=>placement(spec,rep,i,j))));
  let best: Point = {x:.17,y:.31}, score = -1;
  for(let i=0;i<15;i++) for(let j=0;j<15;j++) {
    const point = {x:(i+.357)/15,y:(j+.713)/15};
    const center = apply(spec.basis,point);
    let separation=Infinity;
    nearby.forEach(f=>{
      const d=sub(apply(f,point),center);
      separation=Math.min(separation,d.x*d.x+d.y*d.y);
    });
    if(separation>score) { best=point; score=separation; }
  }
  seeds.set(key,best);
  return best;
}
export const placement = (spec:Wallpaper,rep:Affine,i:number,j:number) =>
  compose(spec.basis,compose(translate({x:i,y:j}),rep));
export function clipHalfPlane(polygon:Point[],normal:Point,limit:number):Point[] {
  const signed = (p:Point) => p.x*normal.x+p.y*normal.y-limit;
  const result:Point[]=[];
  polygon.forEach((a,i)=>{
    const b=polygon[(i+1)%polygon.length],u=signed(a),v=signed(b);
    if(u<=0) result.push(a);
    if((u<0&&v>0)||(u>0&&v<0)) result.push(add(a,scale(sub(b,a),u/(u-v))));
  });
  return result;
}
export function fundamentalDomain(spec:Wallpaper):Point[] {
  const seed=motifSeed(spec),center=apply(spec.basis,seed);
  const span=3;
  let result:Point[]=[{x:-span,y:-span},{x:span,y:-span},{x:span,y:span},{x:-span,y:span}];
  for(const rep of spec.reps) for(let i=-3;i<=3;i++) for(let j=-3;j<=3;j++) {
    const neighbor=apply(placement(spec,rep,i,j),seed);
    const delta=sub(neighbor,center);
    if(Math.hypot(delta.x,delta.y)<1e-8) continue;
    result=clipHalfPlane(result,delta,(neighbor.x**2+neighbor.y**2-center.x**2-center.y**2)/2);
  }
  return result;
}
export const area=(polygon:Point[])=>Math.abs(polygon.reduce((s,p,i)=>{
  const q=polygon[(i+1)%polygon.length];return s+p.x*q.y-q.x*p.y;
},0))/2;
export function motifScale(spec:Wallpaper):number {
  const seed=motifSeed(spec),center=apply(spec.basis,seed);
  let separation=1;
  for(const rep of spec.reps) for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++) {
    const d=sub(apply(placement(spec,rep,i,j),seed),center);
    const len=Math.hypot(d.x,d.y);
    if(len>1e-8) separation=Math.min(separation,len);
  }
  return Math.min(.24,separation*.46);
}
export function dissection(cut:number) {
  const left=[{x:0,y:0},{x:cut,y:0},{x:0,y:1}];
  const remainder=[{x:cut,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
  return {left,remainder,shift:{x:1,y:0}};
}

/** Decode a Euclidean affine map for the same geometric animation as a hand-picked move. */
export function describeIsometry(map:Affine) {
  const [a,b,c,d,x,y]=map;
  const displacement={x,y};
  if(det(map)>0) {
    if(Math.abs(a-1)+Math.abs(b)+Math.abs(c)+Math.abs(d-1)<1e-9)
      return {kind:'translate',point:displacement,angle:0,amount:0};
    const point=apply(inverseAffine(m(1-a,-b,-c,1-d)),displacement);
    return {kind:'rotate',point,angle:Math.atan2(c,a),amount:0};
  }
  const angle=Math.atan2(c,a)/2;
  const direction={x:Math.cos(angle),y:Math.sin(angle)};
  const normal={x:-direction.y,y:direction.x};
  const point=scale(normal,(x*normal.x+y*normal.y)/2);
  const amount=x*direction.x+y*direction.y;
  return {kind:Math.abs(amount)<1e-8?'reflect':'glide',point,angle,amount};
}
