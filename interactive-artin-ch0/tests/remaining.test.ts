import { describe, expect, it } from 'vitest';
import { act, coset, cyclesOf, inverse, moves, normal, partition, permutationParity, product, sign, subgroupIssue } from '../src/lib/group';
import { area, apply, basisVector, cellBounds, clipHalfPlane, compose, describeIsometry, det, dissection, features, fundamentalDomain, identity, motion, motifScale, preserves, motifSeed, toWorld, translate, wallpapers } from '../src/lib/wallpaper';
import { add, distance } from '../src/lib/geometry';
import { parseScenes } from '../src/lib/chapterContent';
import groupContent from '../src/content/groups.md?raw';
import wallpaperContent from '../src/content/wallpaper.md?raw';
import media from '../src/content/wallpaper-assets.json';

describe('square move algebra',()=>{
  it('reads permutations in cycle notation and detects parity',()=>{
    expect(cyclesOf([1,2,0,3])).toEqual([[0,1,2],[3]]);
    expect(permutationParity([1,2,0,3])).toBe('even');
    expect(permutationParity([1,0,2,3])).toBe('odd');
    expect(permutationParity([1,0,3,2])).toBe('even');
  });
  it('is an associative faithful action with identity and inverses',()=>{
    for(const g of moves()){
      expect(product(g,inverse(g))).toBe(0);
      expect(product(0,g)).toBe(g);
      expect(new Set([0,1,2,3].map(x=>act(g,x))).size).toBe(4);
      for(const h of moves()){
        const gh=product(g,h);
        expect(sign(gh)).toBe(sign(g)*sign(h));
        expect([0,1,2,3].every(x=>act(gh,x)===act(g,act(h,x)))).toBe(true);
        for(const k of moves())expect(product(gh,k)).toBe(product(g,product(h,k)));
      }
    }
    expect(product(1,4)).not.toBe(product(4,1));
  });
  it('classifies all normal subgroups and finds the ambiguous product of non-normal cosets',()=>{
    const sets=Array.from({length:256},(_,mask)=>moves().filter(g=>mask&(1<<g))).filter(h=>!subgroupIssue(h));
    expect(sets).toHaveLength(10);
    expect(sets.filter(normal).map(h=>h.join())).toEqual(['0','0,2','0,1,2,3','0,2,4,6','0,2,5,7','0,1,2,3,4,5,6,7']);
    for(const h of sets){
      const piles=partition(h);
      expect(piles.flat().sort((a,b)=>a-b)).toEqual(moves());
      for(const g of moves()) for(const k of moves()){
        const outputs=new Set(coset(h,g).flatMap(a=>coset(h,k).map(b=>piles.findIndex(p=>p.includes(product(a,b))))));
        if(normal(h))expect(outputs.size).toBe(1);
        else if(g===1&&k===1)expect(outputs.size).toBeGreaterThan(1);
      }
    }
  });
});
const orders=[1,2,2,2,2,4,4,4,4,4,8,8,3,6,6,6,12];
describe('periodic groups',()=>{
  it.each(wallpapers.map((w,i)=>[w,orders[i]] as const))('validates the complete generated pattern for $id',(spec,count)=>{
    const seed=motifSeed(spec);
    expect(spec.reps).toHaveLength(count);
    expect(new Set(spec.reps.map(g=>g.slice(0,4).join())).size).toBe(count);
    expect(Math.abs(det(spec.basis))/count).toBeCloseTo(area(fundamentalDomain(spec)),7);
    expect(motifScale(spec)).toBeGreaterThan(.06);
    for(const g of spec.reps){
      const f=toWorld(spec,g);
      const {kind,point,angle,amount}=describeIsometry(f);
      const replay=motion(kind,point,angle,amount);
      replay.forEach((coordinate,i)=>expect(coordinate).toBeCloseTo(f[i],9));
      const a=apply(f,seed),b=apply(f,{x:1.2,y:-.7});
      expect(distance(a,b)).toBeCloseTo(distance(seed,{x:1.2,y:-.7}),10);
      for(const h of spec.reps)expect(preserves(spec,toWorld(spec,compose(g,h)))).toBe(true);
    }
    for(const i of [0,1])expect(preserves(spec,translate(basisVector(spec,i)))).toBe(true);
    expect(preserves(spec,translate({x:.137,y:.123}))).toBe(false);
    expect(preserves(spec,motion('rotate',{x:0,y:0},Math.PI*2/5,0))).toBe(false);
    expect(preserves(spec,identity)).toBe(true);
    for(const feature of features(spec))expect(preserves(spec,feature.affine)).toBe(true);
    const viewport=cellBounds(spec,[{x:30,y:-50},{x:38,y:-57}]);
    expect(viewport.minX).toBeGreaterThan(20);
    expect(preserves(spec,translate(basisVector(spec,0)))).toBe(true);
  });
  it('distinguishes glides, rotations, and the placement of mirror axes',()=>{
    const spec=(id:string)=>wallpapers.find(w=>w.id===id)!;
    const mirror=motion('reflect',{x:0,y:0},0,0),glide=motion('glide',{x:0,y:0},0,.5);
    expect(preserves(spec('pm'),mirror)).toBe(true);
    expect(preserves(spec('pm'),glide)).toBe(false);
    expect(preserves(spec('pg'),mirror)).toBe(false);
    expect(preserves(spec('pg'),glide)).toBe(true);
    expect(preserves(spec('p4m'),mirror)).toBe(true);
    expect(preserves(spec('p4g'),mirror)).toBe(false);
    const offCenter=apply(spec('p3m1').basis,{x:1/3,y:1/3});
    const mirrorAtCenter=(id:string)=>features(spec(id)).some(f=>f.kind==='mirror'&&distance(apply(f.affine,offCenter),offCenter)<1e-7);
    expect(mirrorAtCenter('p3m1')).toBe(true);
    expect(mirrorAtCenter('p31m')).toBe(false);
    expect(features(spec('pgg')).some(f=>f.kind==='mirror')).toBe(false);
  });
  it('dissects an area-one tile without interior overlap',()=>{
    for(const cut of [.1,.4,.9]){
      const {left,remainder,shift}=dissection(cut);
      expect(area(left)+area(remainder)).toBeCloseTo(1);
      const shifted=left.map(p=>add(p,shift));
      expect(area(clipHalfPlane(shifted,{x:1,y:0},1))).toBeCloseTo(0);
      const neighbor=remainder.map(p=>add(p,shift));
      expect(area(clipHalfPlane(neighbor,{x:1,y:cut},1+cut))).toBeCloseTo(0);
    }
  });
});
it('loads distinct editable scenes and licenses each bundled reference',()=>{
  expect(parseScenes(groupContent)).toHaveLength(9);
  expect(parseScenes(wallpaperContent)).toHaveLength(10);
  expect(()=>parseScenes(groupContent+'\n'+groupContent.slice(groupContent.indexOf('## ')))).toThrow();
  const assets: { author:string; source:string; licenseUrl:string; group:string; path:string }[] = [...media.photos,...media.diagrams];
  for(const asset of assets){
    expect(asset.author).toBeTruthy();
    expect(asset.source).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    expect(asset.licenseUrl).toMatch(/^https:/);
    expect(wallpapers.some(w=>w.id===asset.group)).toBe(true);
    expect(asset.path).toMatch(/^\.\/wallpaper\/.+\.(svg|jpg)$/);
  }
});
