import { describe, expect, it } from 'vitest';
import { add, latticePoint, nearestLatticePoint, reflectAcross, rotateAbout, startingMotif, matchesMotif, targetMotif, snappedAxisAngle, sub } from '../src/lib/geometry';

const close = (p: {x:number;y:number}, q: {x:number;y:number}) => {
  expect(p.x).toBeCloseTo(q.x, 9);
  expect(p.y).toBeCloseTo(q.y, 9);
};

describe('Chapter 0 mathematical invariants', () => {
  it('a quarter turn of the square lattice has order four', () => {
    let p = { x: 3, y: -2 };
    for (let i = 0; i < 4; i++) p = rotateAbout(p, {x:0,y:0}, Math.PI / 2);
    close(p, { x:3, y:-2 });
  });
  it('a sixth turn of the Eisenstein lattice has order six', () => {
    let p = latticePoint(2, -1, 'triangular');
    const start = p;
    for (let i = 0; i < 6; i++) p = rotateAbout(p, {x:0,y:0}, Math.PI / 3);
    close(p, start);
  });
  it('reflection squares to the identity', () => {
    const p = { x:2, y:3 }, center = {x:-1,y:2};
    close(reflectAcross(reflectAcross(p, center, Math.PI / 3), center, Math.PI / 3), p);
  });
  it('a translation can be undone', () => {
    const p = {x:0.3,y:-4}, move={x:3,y:1};
    close(sub(add(p,move), move), p);
  });
  it('snaps triangular reflection axes to multiples of 60 degrees', () => {
    expect(snappedAxisAngle(1.1, 'triangular')).toBeCloseTo(Math.PI / 3);
    expect(snappedAxisAngle(0.4, 'square')).toBeCloseTo(0);
  });
  it('finds an exact lattice point near a click', () => {
    close(nearestLatticePoint({x:1.47,y:0.92}, 'triangular'), latticePoint(1,1,'triangular'));
  });
});

describe('Lattice symmetries are genuine lattice symmetries', () => {
  for (const lattice of ['square', 'triangular'] as const) {
    it(`preserves every sampled ${lattice} lattice point under the tutorial rotation and reflections`, () => {
      const theta = lattice === 'square' ? Math.PI/2 : Math.PI/3;
      const directions = lattice === 'square' ? [0, Math.PI/2] : [0, Math.PI/3, 2*Math.PI/3];
      const origin = latticePoint(1,1,lattice);
      for(let i=-3;i<=3;i++) for(let j=-3;j<=3;j++) {
        const p=latticePoint(i,j,lattice);
        const r=rotateAbout(p,origin,theta);
        close(nearestLatticePoint(r,lattice),r);
        for(const angle of directions) {
          const f=reflectAcross(p,origin,angle);
          close(nearestLatticePoint(f,lattice),f);
        }
      }
    });
  }
});

it('starts every triangle vertex on a lattice point in both lattices', () => {
  for (const lattice of ['square', 'triangular'] as const) {
    for (const vertex of startingMotif(lattice)) {
      expect(nearestLatticePoint(vertex, lattice)).toEqual(vertex);
    }
  }
});

it('has a distinct lattice target that can be reached with a turn, a flip, and a move', () => {
  for (const lattice of ['square', 'triangular'] as const) {
    const start = startingMotif(lattice);
    const target = targetMotif(lattice);
    const origin = latticePoint(0, 0, lattice);
    const angle = lattice === 'square' ? Math.PI / 2 : Math.PI / 3;
    const turned = start.map(point => rotateAbout(point, origin, angle));
    const flipped = turned.map(point => reflectAcross(point, origin, 0));
    expect(matchesMotif(start, target)).toBe(false);
    expect(matchesMotif(flipped, target)).toBe(false);
    expect(matchesMotif(flipped.map(point => add(point, latticePoint(2, 0, lattice))), target)).toBe(true);
    expect(matchesMotif([target[1], target[0], target[2]], target)).toBe(false);
    expect(matchesMotif(target.map(point => nearestLatticePoint(point, lattice)), target)).toBe(true);
  }
});
