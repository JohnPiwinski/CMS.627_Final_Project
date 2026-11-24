import type { Feature } from './lesson';
import type { Solid } from './solids';
import { symmetryGroup, type Symmetry } from './symmetry';

export type Trial = {
  solid: Solid;
  type: Feature;
  feature: number;
  rotationsOnly: boolean;
  visited: number[];
  saved: string[];
  history: string[];
  orbit: string;
  stabilizer: string;
  checked: boolean;
};

export const trialKey = (solid: Solid, type: Feature, rotationsOnly: boolean) =>
  `${solid}/${type}/${rotationsOnly}`;

export function newTrial(solid: Solid, type: Feature, feature: number, rotationsOnly: boolean): Trial {
  const { identity } = symmetryGroup(solid);
  return { solid, type, feature, rotationsOnly, visited: [feature], saved: [identity.key],
    history: [identity.key], orbit: '', stabilizer: '', checked: false };
}

export function recordMove(trial: Trial, symmetry: Symmetry) {
  const group = symmetryGroup(trial.solid);
  const destination = group.image(trial.type, trial.feature, symmetry);
  const fixes = destination === trial.feature;
  const freshPosition = !trial.visited.includes(destination);
  const freshSymmetry = fixes && !trial.saved.includes(symmetry.key);
  if (freshPosition) trial.visited.push(destination);
  if (freshSymmetry) trial.saved.push(symmetry.key);
  if (trial.history.at(-1) !== symmetry.key) trial.history.push(symmetry.key);
  return { destination, fixes, freshPosition, freshSymmetry };
}
