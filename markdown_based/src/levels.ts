export const levels = [
  { id: 'tutorial', title: 'Tutorial', object: 'Writing desk', description: 'Learn the lattice and solid controls.' },
  { id: 'intro', title: 'Introductory Group Theory', object: 'Grandfather clock', description: 'Use clock steps to discover cyclic groups.' },
  { id: 'orbit', title: 'Orbit Stabilizer', object: 'Dodecahedron', description: 'Track where a solid’s symmetries take a feature.' },
  { id: 'wallpaper', title: 'Wallpaper Groups', object: 'Fleur-de-lis', description: 'Explore mirror symmetry and repeating patterns.' },
] as const;

export type LevelId = typeof levels[number]['id'];
export type ChapterId = Exclude<LevelId, 'tutorial'>;
export const officePage = 1;
export const tutorialStart = officePage + 1;

export function levelPage(level: LevelId, tutorialCount: number): number {
  return level === 'tutorial'
    ? tutorialStart
    : officePage + tutorialCount + levels.findIndex(item => item.id === level);
}

export function pageLevel(page: number, tutorialCount: number): LevelId | undefined {
  if (page >= tutorialStart && page < tutorialStart + tutorialCount) return 'tutorial';
  return levels.slice(1).find(level => levelPage(level.id, tutorialCount) === page)?.id;
}
