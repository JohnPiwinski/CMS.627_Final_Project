import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const directory = new URL('./', import.meta.url);
const source = await readFile(new URL('source.svg', directory), 'utf8');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(source);
  const ids = process.argv.slice(2);
  const geometry = await page.evaluate(ids => {
    function vertices(path) {
      const tokens = path.getAttribute('d').match(/[a-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi);
      const matrix = path.getCTM();
      if (!tokens || !matrix) throw new Error('Missing SVG path geometry');
      let x = 0, y = 0, startX = 0, startY = 0, command, ring;
      const rings = [];
      const number = () => {
        const value = Number(tokens.shift());
        if (!Number.isFinite(value)) throw new Error('Invalid SVG path coordinate');
        return value;
      };
      while (tokens.length) {
        if (/^[a-z]$/i.test(tokens[0])) command = tokens.shift();
        const op = command?.toUpperCase();
        const relative = command !== op;
        if (op === 'Z') { x = startX; y = startY; command = undefined; continue; }
        if (op === 'M' || op === 'L') {
          if (op === 'M') { ring = []; rings.push(ring); }
          const a = number(), b = number();
          x = relative ? x + a : a;
          y = relative ? y + b : b;
          if (op === 'M') { startX = x; startY = y; command = relative ? 'l' : 'L'; }
        } else if (op === 'H') {
          const a = number();
          x = relative ? x + a : a;
        } else if (op === 'V') {
          const b = number();
          y = relative ? y + b : b;
        } else throw new Error('Unsupported SVG path command: ' + command);
        const point = new DOMPoint(x, y).matrixTransform(matrix);
        ring.push([point.x, point.y]);
      }
      return rings;
    }
    return Object.fromEntries(ids.map(id => {
      const label = [...document.querySelectorAll('svg > g > text')].find(node => node.textContent.trim() === id);
      if (!label) throw new Error('Unknown source cell: ' + id);
      const layers = [...label.parentElement.querySelectorAll('path')].flatMap(path => {
        const fill = path.getAttribute('fill');
        return fill === 'none' ? [] : [{ fill, rings: vertices(path) }];
      });
      if (!layers.length || layers[0].rings.length !== 1) throw new Error('Unexpected source layers: ' + id);
      const outline = layers[0].rings[0];
      const subtract = (a,b) => [a[0]-b[0],a[1]-b[1]];
      const basis = outline.length === 4 ? [subtract(outline[2],outline[1]),subtract(outline[0],outline[1])] :
        [subtract(outline[0],outline[2]),subtract(outline[5],outline[1])];
      if (id === 'cm' || id === 'cmm') {
        return [id, { basis: [subtract(outline[2],outline[0]),subtract(outline[3],outline[0])], layers }];
      }
      return [id, { basis, layers }];
    }));
  }, ids.length ? ids : ['p1','p2','pm','pg','cm','pmm','pmg','pgg','cmm','p4','p4m','p4g','p3','p3m1','p31m','p6','p6m']);
  await writeFile(new URL('cells.json', directory), JSON.stringify(geometry, null, 2) + '\n');
} finally {
  await browser.close();
}
