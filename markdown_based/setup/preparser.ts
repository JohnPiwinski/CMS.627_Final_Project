import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { definePreparserSetup } from '@slidev/types';
import { parseChapter } from '../src/content';
import { levels } from '../src/levels';

export default definePreparserSetup(({ filepath }) => [{
  transformRawLines(lines) {
    const chapter = parseChapter(lines.join('\n'), filepath);
    const end = lines[0] === '---' ? lines.indexOf('---', 1) + 1 : 0;
    const subsections = chapter.sections.flatMap(section => section.subsections);
    const pageIds = [...subsections.map(({ id }) => id), ...levels.slice(1).map(({ id }) => id)];
    const groupFile = resolve(dirname(filepath), 'content/group-theory.md');
    const group = parseChapter(readFileSync(groupFile, 'utf8'), groupFile);
    const definition = group.sections.flatMap(section => section.subsections)
      .find(page => page.id === 'group-definition')?.beats[0].display ?? '';
    const [summary, ...laws] = definition.split('\n');
    const body = [
      '<div class="group-definition-slide">',
      '', '# $RS$', '', 'Apply $S$ first, then $R$.', '',
      ...laws.flatMap(line => {
        const [name, formula] = line.split(' — ');
        return [`<div class="group-law">`, '', `**${name}**`, '', formula, '', '</div>', ''];
      }),
      `<p class="group-summary">${summary}</p>`,
      '</div>',
    ];
    const slides = pageIds.flatMap(id => ['---', 'layout: workspace', '---',
      ...(id === 'intro' ? body : [`<!-- ${id} -->`]), '']);
    lines.splice(end, lines.length - end, '', '<!-- Emmy Noether’s office -->', '', ...slides);
  },
}]);
