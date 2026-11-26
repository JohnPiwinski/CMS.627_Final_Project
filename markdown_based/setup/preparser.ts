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
    const pageIds = [...subsections.map(({ id }) => id), ...levels.slice(1).map(({ id }) => id), 'wilson-solution'];
    const groupFile = resolve(dirname(filepath), 'content/group-theory.md');
    const group = parseChapter(readFileSync(groupFile, 'utf8'), groupFile);
    const definition = group.sections.flatMap(section => section.subsections)
      .find(page => page.id === 'group-definition')?.beats[0].display ?? '';
    const body = ['<div class="group-definition-slide">', '',
      ...definition.split('\n').flatMap(line => {
        const [law, formula] = line.split(' — ');
        return formula ? ['<div class="group-law">', '', '**' + law + '**', '', formula, '', '</div>', ''] : [line];
      }),
      '', '</div>',
    ];
    const solution = group.sections.flatMap(section => section.subsections)
      .find(page => page.id === 'wilson-theorem')?.beats[1].display ?? '';
    const solutionBody = ['<div class="group-definition-slide">', '', '## Wilson’s theorem',
      '', '$$(p-1)!\\equiv -1\\pmod{p}$$', '', solution, '', '</div>'];
    const slides = pageIds.flatMap(id => ['---', 'layout: workspace', '---',
      ...(id === 'intro' ? body : id === 'wilson-solution' ? solutionBody : [`<!-- ${id} -->`]), '']);
    lines.splice(end, lines.length - end, '', '<!-- Emmy Noether’s office -->', '', ...slides);
  },
}]);
