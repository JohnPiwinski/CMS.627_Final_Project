import { describe, expect, it } from 'vitest';
import { identify } from '../src/lib/symmetry';
import { solidCosets } from '../src/lib/solid-cosets';
import { solidGroups } from '../src/lib/solids';
import type { Feature } from '../src/lib/features';

const features: Feature[] = ['vertex','edge','face'];
describe('left multiplication on solid cosets', () => {
  for (const solid of solidGroups.flatMap(group=>[...group.solids])) {
    it('matches the geometric action on '+solid, () => {
      for (const feature of features) for (const rotationsOnly of [true,false]) {
        const origin=solidCosets(solid,feature,0,rotationsOnly);
        const reference=origin.blocks.length-1;
        const model=solidCosets(solid,feature,reference,rotationsOnly);
        const { group, blocks, names, moveBlocks }=model;
        expect(blocks.length).toBe(group.features[feature].length);
        expect(new Set(blocks.flatMap(block=>block.moves)).size).toBe(names.size);
        expect(blocks.every(block=>block.moves.length===blocks[0].moves.length)).toBe(true);
        expect(blocks.length*blocks[0].moves.length).toBe(names.size);
        for (const key of names.keys()) {
          const move=group.elements.get(key)!;
          const moved=moveBlocks(blocks,move);
          expect(new Set(moved.flatMap(block=>block.moves)).size).toBe(names.size);
          expect(new Set(moved.map(block=>block.destination)).size).toBe(blocks.length);
          for (const block of moved) {
            const valid=block.moves.every(k=> {
              const element=group.elements.get(k);
              return element && names.has(k) && group.image(feature,reference,element)===block.destination;
            });
            if (!valid) throw Error('Coset destination disagrees with the solid');
          }
          const inverse=identify(group.vertices,move.matrix.clone().invert())!;
          expect(moveBlocks(moved,inverse)).toEqual(blocks);
        }
      }
    });
  }

  it('permutes the three moves inside the fixed tetrahedron block',()=>{
    const {blocks,group,moveBlocks}=solidCosets('Tetrahedron','vertex',0,true);
    expect(blocks.map(block=>block.moves.length)).toEqual([3,3,3,3]);
    const fixed=blocks[0];
    const move=group.elements.get(fixed.moves[1])!;
    const moved=moveBlocks(blocks,move)[0];
    expect(moved.destination).toBe(0);
    expect(moved.moves).not.toEqual(fixed.moves);
    expect(new Set(moved.moves)).toEqual(new Set(fixed.moves));
  });
});
