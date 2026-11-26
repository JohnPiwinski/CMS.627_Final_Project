import type { Feature } from './features';
import type { Solid } from './solids';
import { symmetryGroup, type Symmetry } from './symmetry';

export type CosetBlock = { id: number; destination: number; moves: string[] };

export function solidCosets(solid: Solid, feature: Feature, reference: number, rotationsOnly: boolean) {
  const group = symmetryGroup(solid);
  const elements = [...group.elements.values()].filter(move => !rotationsOnly || move.matrix.determinant() > 0);
  const names = new Map(elements.map((move, index) => [move.key, index === 0 ? 'Identity' : 'Move ' + index]));
  const byDestination = new Map<number, string[]>();
  for (const move of elements) {
    const position = group.image(feature, reference, move);
    if (!byDestination.has(position)) byDestination.set(position, []);
    byDestination.get(position)!.push(move.key);
  }
  const blocks: CosetBlock[] = [...byDestination].sort(([a],[b]) => a-b)
    .map(([destination,moves]) => ({ id:destination,destination,moves }));

  function moveBlocks(previous: CosetBlock[], symmetry: Symmetry): CosetBlock[] {
    return previous.map(block => ({
      id:block.id,
      destination:group.image(feature,block.destination,symmetry),
      moves:block.moves.map(key => group.elements.get(key)!.permutation.map(index => symmetry.permutation[index]).join(',')),
    }));
  }
  const positionName = (index: number) => blocks.length <= 8 ? String.fromCharCode(65+index) : String(index+1);
  return { group, blocks, names, moveBlocks, positionName };
}
