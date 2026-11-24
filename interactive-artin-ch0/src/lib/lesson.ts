import type { LatticeTool, LatticeType } from './geometry';

export type LessonId = 'lattice' | 'cube' | 'square';
export type Feature = 'face' | 'edge' | 'vertex';
export type LatticeGoal = LatticeTool | 'match';
export type LessonProgress = {
  squareLattice: LatticeGoal[];
  triangularLattice: LatticeGoal[];
  solidSymmetries: Feature[];
  rotated: boolean;
  undone: boolean;
};
export const emptyProgress = (): LessonProgress => ({
  squareLattice: [], triangularLattice: [], solidSymmetries: [], rotated: false, undone: false,
});
export const lessonInfo = [
  { id:'lattice' as const, number:'01', name:'Transform the plane', short:'Lattice tools', tag:'2D · KONVA', title:'Make the plane move.', subtitle:'Three simple tools. Two different lattices. Learn by changing what you see.', prompt:'Try each tool, then line up A, B, and C with the dashed target triangle.', narration:'Welcome to the workshop. A mathematical transformation changes where points go. Use Translate to move the marked triangle between lattice points. Click a lattice dot to open the rotation dial, then drag clockwise or counterclockwise. Reflect across an axis that you draw. First try the square lattice; then discover what changes on the triangular lattice.' },
  { id:'cube' as const, number:'02', name:'Explore in three dimensions', short:'Platonic solids', tag:'3D · THREE.JS', title:'Turn and reflect a solid.', subtitle:'Explore the five Platonic solids and compare their symmetries.', prompt:'Choose a solid and a transformation. Click a feature, then drag the rotation dial or click a mirror plane.', narration:'Drag the scene to orbit. Choose Rotate or Reflect, then click a face, edge, or vertex. The camera pauses while you use the rotation dial. For a rotation, drag around the dial to choose a whole number of steps. For a reflection, orbit to see the colored planes from different angles, then click one. The colored features show what moved. The cube and octahedron are duals, as are the dodecahedron and icosahedron. The tetrahedron is its own dual.' },
  { id:'square' as const, number:'03', name:'Move an object', short:'Rotate & undo', tag:'2D · KONVA', title:'Now move the object.', subtitle:'The viewpoint stays fixed. Watch what a transformation does to the corner markers.', prompt:'Rotate the marked square one quarter-turn, then undo it.', narration:'This time you will move the object itself. The positive x-axis points right, and the positive y-axis points up. By convention, a positive angle turns counterclockwise from the positive x-axis toward the positive y-axis. Rotate the square through ninety degrees in either direction, then undo it. Although the outline matches its old position, its colored corners have changed places.' },
];
export function hasDone(progress: LessonProgress, lesson: LessonId): boolean {
  if (lesson === 'lattice') return progress.squareLattice.length === 4 && progress.triangularLattice.length === 4;
  if (lesson === 'cube') return progress.solidSymmetries.length === 3;
  return progress.rotated && progress.undone;
}
export function markLattice(progress: LessonProgress, lattice: LatticeType, tool: LatticeGoal): LessonProgress {
  const key = lattice === 'square' ? 'squareLattice' : 'triangularLattice';
  return { ...progress, [key]: Array.from(new Set([...progress[key], tool])) };
}
