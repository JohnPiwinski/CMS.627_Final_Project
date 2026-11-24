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
  expect(narrationEntries(chapter)).toHaveLength(13);
});

it('reports invalid content at its source location', () => {
  expect(() => parseChapter(source.replace('::scene[square]', '::scene[missing]'), 'tutorial.md'))
    .toThrow(/tutorial.md:\d+: Expected ::scene/);
  expect(() => parseChapter(source.replace('::enable[translate,rotate,reflect]', '::enable[orbit]'))).toThrow(/unsupported/);
  expect(() => parseChapter(source.replace('::enable[translate,rotate,reflect]', '::enable[translate]'))).toThrow(/disabled/);
  expect(() => parseChapter(source.replace('square-reflect]', 'square-intro]'))).toThrow(/Duplicate ID/);
});

it('loads both guided clock subsections and their exact narration from Markdown', () => {
  const clockFile = 'content/group-theory.md';
  const clock = parseChapter(readFileSync(new URL('../' + clockFile, import.meta.url), 'utf8'), clockFile);
  expect(clock.sections.map(section => section.title)).toEqual(['Groups', 'Modular arithmetic', 'Investigation']);
  expect(clock.sections[1].subsections.slice(3, 5).map(page => [page.title, page.scene])).toEqual([
    ['Around the clock', 'clock'], ['Two names for twelve', 'clock'],
  ]);
  expect(narrationEntries(clock).slice(4, 6)).toEqual([
    expect.objectContaining({ id: 'group-clock-around', text: expect.stringContaining('twelve and zero name the same position') }),
    expect.objectContaining({ id: 'group-clock-zero', text: expect.stringContaining('They name the same spot.') }),
  ]);
});
