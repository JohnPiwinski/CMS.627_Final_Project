import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { narrationEntries, parseChapter } from '../src/content';

const source = readFileSync(new URL('../content/chapter-0.md', import.meta.url), 'utf8');

it('derives tutorial sections, beats, and narration from one document', () => {
  const chapter = parseChapter(source);
  expect(chapter.sections.map(section => section.subsections.length)).toEqual([2, 3]);
  const square = chapter.sections.flatMap(section => section.subsections).find(item => item.id === 'square-lattice');
  expect(square?.beats.some(beat => beat.narration?.id === 'square-intro' && beat.narration.auto)).toBe(true);
  expect(square?.beats).toContainEqual(expect.objectContaining({ wait: 'translated', cue: 'translate' }));
  expect(narrationEntries(chapter)).toHaveLength(14);
});

it('reports invalid content at its source location', () => {
  expect(() => parseChapter(source.replace('::scene[square]', '::scene[missing]'), 'tutorial.md'))
    .toThrow(/tutorial.md:\d+: Expected ::scene/);
  expect(() => parseChapter(source.replace('::enable[translate,rotate,reflect,glide]', '::enable[orbit]'))).toThrow(/unsupported/);
  expect(() => parseChapter(source.replace('::enable[translate,rotate,reflect,glide]', '::enable[translate]'))).toThrow(/disabled/);
  expect(() => parseChapter(source.replace('square-reflect]', 'square-intro]'))).toThrow(/Duplicate ID/);
});


it('uses the outline order and exact narration for all guided subsections', () => {
  const load = (name: string) => parseChapter(readFileSync(new URL('../' + name, import.meta.url), 'utf8'), name);
  const chapter = load('content/group-theory.md');
  const outline = load('outlines/chapter-1-outline.md');
  const ids = (value: typeof chapter) => value.sections.flatMap(section => section.subsections.map(page => page.id));
  const activeOutline = { ...outline, sections: outline.sections.filter(section => section.id !== 'homomorphisms-bonus') };
  expect(ids(chapter)).toEqual(ids(activeOutline));
  expect(chapter.sections.map(section => section.subsections.length)).toEqual([6, 2, 2, 7]);
  expect(narrationEntries(chapter)).toEqual(narrationEntries(activeOutline));
});
