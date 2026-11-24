export const orbitScenes = [
  { title: 'Welcome', prompt: 'Choose a solid and drag to look around.',
    narration: 'These five solids have remarkable symmetries. The reference table gives the total number for each solid. The full group includes rotations, reflections, and combinations of them.' },
  { title: 'Follow a feature', prompt: 'Choose something to follow. Where can you send it?',
    narration: 'Pick a face, edge, or vertex. Then use the rotation and reflection tools to send it to new locations. The collection of places it can go is called its orbit.' },
  { title: 'Keep it in place', prompt: 'Can you move the solid while your feature stays in its starting place?',
    narration: 'Try turns or flips that keep your feature in place. A face can stay in the same location while its corners move. The symmetries that do this form the stabilizer. Doing nothing is a symmetry, too.' },
  { title: 'Record observations', prompt: 'Enter your counts and check them when you are ready.',
    narration: 'Compare about four examples using at least three solids and two feature types. You can revise your counts and return to any saved case.' },
  { title: 'Find the pattern', prompt: 'What relationship works across the rows?',
    narration: 'Compare the three numbers in each row. Build an equation that describes the pattern you see.' },
  { title: 'Compare turns and mirrors', prompt: 'What do you notice when you count the two kinds separately?',
    narration: 'Look at the symmetries that fix your selection. Count the rotations, including doing nothing, and the plane reflections separately.' },
] as const;

export const observationHints = [
  'Try exploring the other side of the solid. How many different places have you reached?',
  'Reset the trial and try a turn or mirror through your tracked feature. Distinct moves can reach the same place.',
  'Doing nothing belongs in the collection. A turn through 360° has the same effect.',
];

export const patternHints = [
  'Compare the three numbers in more than one row.',
  'Try an operation that combines your two counts into the given total.',
  'Try multiplying the two counts.',
];
