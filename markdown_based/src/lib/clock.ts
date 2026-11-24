export const clockSize = 12;

export function residue(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function clockShift(position: number, hours: number, modulus = clockSize): number {
  return residue(position + hours, modulus);
}

export function clockScale(position: number, factor: number, modulus: number): number {
  return residue(position * factor, modulus);
}

export function modularInverse(value: number, modulus: number): number | undefined {
  for (let candidate = 1; candidate < modulus; candidate++) {
    if (clockScale(value, candidate, modulus) === 1) return candidate;
  }
}

export function factorialRemainders(modulus: number): number[] {
  const values = [1];
  for (let factor = 1; factor < modulus; factor++) values.push(clockScale(values[factor - 1], factor, modulus));
  return values;
}

export function isPrime(value: number): boolean {
  if (value < 2) return false;
  for (let factor = 2; factor * factor <= value; factor++) {
    if (value % factor === 0) return false;
  }
  return true;
}
