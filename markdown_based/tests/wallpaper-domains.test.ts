import { readFileSync } from "node:fs";
import { parseChapter } from "../src/content";
import narration from "../src/narration-assets.json";
import { describe, it, expect } from "vitest";
import data from "../src/wallpaper/dissection.json";
import { collectionPatterns, basisOf } from "../src/wallpaper/catalog";
import {
  apply,
  compose,
  inverseAffine,
  type Affine,
} from "../src/lib/wallpaper";
function inside(points: number[][], x: number, y: number) {
  let result = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [a, b] = points[i],
      [c, d] = points[j];
    if (b > y !== d > y && x < ((c - a) * (y - b)) / (d - b) + a)
      result = !result;
  }
  return result;
}
function area(points: number[][]) {
  return Math.abs(
    points.reduce((sum, p, i) => {
      const q = points[(i + 1) % points.length];
      return sum + p[0] * q[1] - q[0] * p[1];
    }, 0) / 2,
  );
}
describe("wallpaper chapter data", () => {
  it("retains all seventeen groups in both collections with distinct identities", () => {
    const a = collectionPatterns("artin"),
      w = collectionPatterns("wikipedia");
    expect(a).toHaveLength(17);
    expect(w).toHaveLength(17);
    expect(new Set([...a, ...w].map((p) => p.id)).size).toBe(34);
    expect(new Set(a.map((p) => p.group))).toEqual(
      new Set(w.map((p) => p.group)),
    );
  });
  it("preserves area and moves exactly one bite by a registered group rotation", () => {
    expect(area(data.red.points)).toBeCloseTo(data.red.area, 7);
    expect(data.red.area).toBeCloseTo(data.blue.area, 6);
    expect(data.full.area).toBeCloseTo(data.red.area * 2, 6);
    expect(data.remainder.area + data.bite.area).toBeCloseTo(data.red.area, 6);
    expect(data.destination.area).toBeCloseTo(data.bite.area, 6);
    expect(data.move.angle).toBeCloseTo((2 * Math.PI) / 3, 10);
    const [a, b, c, d, x, y] = data.move.affine;
    for (const p of data.bite.points) {
      const q = apply([a, b, c, d, x, y], { x: p[0], y: p[1] });
      expect(
        data.destination.points.some(
          (r) => Math.hypot(q.x - r[0], q.y - r[1]) < 3e-6,
        ),
      ).toBe(true);
    }
  });
  it("covers the translation cell exactly once with images of either domain", () => {
    const p = collectionPatterns("artin").find((p) => p.group === "p31m")!,
      B = basisOf(p),
      inv = inverseAffine(B);
    const maps: Affine[] = [];
    for (const r of data.representatives)
      for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++)
          maps.push(
            inverseAffine(
              compose(
                B,
                compose([r[0], r[1], r[2], r[3], r[4] + i, r[5] + j], inv),
              ),
            ),
          );
    for (const domain of [data.red, data.blue])
      for (let i = 0; i < 19; i++)
        for (let j = 0; j < 17; j++) {
          const q = apply(B, { x: (i + 0.271) / 19, y: (j + 0.313) / 17 });
          const count = maps.filter((m) => {
            const t = apply(m, q);
            return inside(domain.points, t.x, t.y);
          }).length;
          expect(count).toBe(1);
        }
  });
});

it("authors five slides with generated narration and no matching scene", () => {
  const chapter = parseChapter(
    readFileSync(new URL("../content/wallpaper.md", import.meta.url), "utf8"),
  );
  const pages = chapter.sections.flatMap((s) => s.subsections);
  expect(pages.map((p) => p.scene)).toEqual([
    "wallpaper-overview",
    "wallpaper-playground",
    "wallpaper-domain",
    "wallpaper-dissection",
    "wallpaper-explanation",
  ]);
  const clips: Record<string, { text: string; file: string }> = narration;
  for (const page of pages) {
    const voice = page.beats[0].narration!;
    expect(clips[voice.id].text).toBe(voice.text);
  }
});
