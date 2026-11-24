import { expect, it } from 'vitest';
import { clockScale, clockShift, clockSize, factorialRemainders, isPrime, modularInverse, residue } from '../src/lib/clock';

it('visits every position and returns after twelve one-hour moves', () => {
  const visited = Array.from({ length: clockSize }, (_, hours) => clockShift(0, hours));
  expect(new Set(visited).size).toBe(clockSize);
  expect(clockShift(11, 1)).toBe(0);
});

it('composes shifts and wraps negative inverses', () => {
  expect(clockShift(clockShift(10, 3), 5)).toBe(clockShift(10, 8));
  expect(clockShift(4, -4)).toBe(clockShift(4, 8));
  expect(clockShift(1, -4)).toBe(9);
});

it('distinguishes reversible multiplication from a many-to-one map', () => {
  for (let modulus = 2; modulus <= 24; modulus++) {
    const values = Array.from({ length: modulus }, (_, value) => value);
    for (const factor of values) {
      const image = new Set(values.map(value => clockScale(value, factor, modulus)));
      const inverse = modularInverse(factor, modulus);
      expect(image.size === modulus).toBe(inverse !== undefined);
      if (inverse !== undefined) expect(clockScale(factor, inverse, modulus)).toBe(1);
    }
    expect(values.slice(1).every(value => modularInverse(value, modulus) !== undefined)).toBe(isPrime(modulus));
  }
});

it('matches exact factorial remainders and Wilson’s criterion over the clock range', () => {
  for (let modulus = 2; modulus <= 24; modulus++) {
    const remainders = factorialRemainders(modulus);
    let exact = 1n;
    for (let factor = 1; factor < modulus; factor++) {
      exact *= BigInt(factor);
      expect(remainders[factor]).toBe(Number(exact % BigInt(modulus)));
    }
    expect(remainders.at(-1) === modulus - 1).toBe(isPrime(modulus));
  }
  expect(residue(-13, 12)).toBe(11);
  expect(factorialRemainders(4)).toEqual([1, 1, 2, 2]);
});
