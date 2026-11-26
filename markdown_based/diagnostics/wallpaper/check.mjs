import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { paintTiles, translatedCells } from './tiles.mjs';

const extractedCells = JSON.parse(readFileSync(new URL('cells.json', import.meta.url)));
const expected = {
  p4: {
    basis: [[96,0],[0,96]],
    green: [[648,168],[648,72],[744,72],[744,168]],
    blue: [[648,144],[672,72],[744,96],[720,168]],
  },
  p1: {
    basis: [[120,0],[-24,96]],
    green: [[48,168],[72,72],[192,72],[168,168]],
    blue: [[120,120],[72,72],[48,168]],
  },
  p6: {
    basis: [[124.70764,0],[62.35382,108]],
    green: [[950.35382,468],[888,432],[825.64618,468],[825.64618,540],[888,576],[950.35382,540]],
    blue: [[903.58845,441],[841.23465,459],[825.6462,522],[872.41155,567],[934.76535,549],[950.3538,486]],
  },
};

const cells = Object.fromEntries(Object.keys(expected).map(id => [id, extractedCells[id]]));

function record(tiles) {
  const layers = [];
  let rings, ring;
  paintTiles({
    beginPath() { rings = []; },
    moveTo(x,y) { ring = [[x,y]]; rings.push(ring); },
    lineTo(x,y) { ring.push([x,y]); },
    closePath() {},
    fill() { layers.push({ fill: this.fillStyle, rings }); },
  }, tiles);
  return layers;
}

const near = (a,b) => assert.ok(Math.abs(a-b) < 1e-8, `${a} != ${b}`);
const report = {};
for (const [id, cell] of Object.entries(cells)) {
  const reference = expected[id];
  assert.equal(cell.layers.length, 2);
  cell.basis.forEach((vector,i) => vector.forEach((n,k) => near(n, reference.basis[i][k])));
  report[id] = [];
  for (const count of [1,2,5]) {
    const scale = count === 1 ? 8 : count === 2 ? 4 : 2;
    const render = record(translatedCells(cell,count,count,scale));
    assert.equal(render.length, 2 * count ** 2);
    render.forEach((layer,index) => {
      const blue = index % 2;
      assert.equal(layer.fill, blue ? '#547fa6' : '#b7f0ce');
      const polygon = blue ? reference.blue : reference.green;
      const cellIndex = Math.floor(index / 2);
      const i = cellIndex % count, j = Math.floor(cellIndex / count);
      assert.equal(layer.rings.length, 1);
      assert.equal(layer.rings[0].length, polygon.length);
      layer.rings[0].forEach((point,k) => point.forEach((n,d) => {
        near(n, (polygon[k][d] + i * reference.basis[0][d] + j * reference.basis[1][d]) * scale);
      }));
    });
    report[id].push({ count, scale, basis: reference.basis, render });
  }
}
const check = new URL('check_coverage.py', import.meta.url);
process.stdout.write(execFileSync('python3', [decodeURIComponent(check.pathname)], { input: JSON.stringify({ report, extractedCells }), encoding: 'utf8' }));

const { chromium } = await import('playwright');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(readFileSync(new URL('source.svg', import.meta.url), 'utf8'));
  for (const [id, cell] of Object.entries(cells)) {
    const raster = await page.evaluate(async ({ id, outline, layers, painter }) => {
      const minX = Math.floor(Math.min(...outline.map(p => p[0]))) - 1;
      const minY = Math.floor(Math.min(...outline.map(p => p[1]))) - 1;
      const width = Math.ceil(Math.max(...outline.map(p => p[0]))) - minX + 1;
      const height = Math.ceil(Math.max(...outline.map(p => p[1]))) - minY + 1;
      const scale = 6;
      const canvas = () => Object.assign(document.createElement('canvas'), { width: width*scale, height: height*scale });
      const group = [...document.querySelectorAll('svg > g > text')].find(node => node.textContent.trim() === id).parentElement.cloneNode(true);
      group.querySelector('text').remove();
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width*scale + '" height="' + height*scale +
        '" viewBox="' + [minX,minY,width,height].join(' ') + '">' + new XMLSerializer().serializeToString(group) + '</svg>';
      const image = new Image();
      image.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      await image.decode();
      const source = canvas().getContext('2d');
      source.drawImage(image, 0, 0);
      const extracted = canvas().getContext('2d');
      extracted.scale(scale, scale);
      extracted.translate(-minX,-minY);
      new Function('return (' + painter + ')')()(extracted,[layers]);
      const a = source.getImageData(0,0,source.canvas.width,source.canvas.height).data;
      const b = extracted.getImageData(0,0,source.canvas.width,source.canvas.height).data;
      let sampled = 0, differences = 0;
      for (let i = 0; i < a.length; i += 4) {
        const color = a[i] === 183 && a[i+1] === 240 && a[i+2] === 206 ||
          a[i] === 84 && a[i+1] === 127 && a[i+2] === 166;
        if (!color || a[i+3] !== 255) continue;
        sampled++;
        if (a[i] !== b[i] || a[i+1] !== b[i+1] || a[i+2] !== b[i+2] || b[i+3] !== 255) differences++;
      }
      return { sampled, differences };
    }, { id, outline: cell.layers[0].rings[0], layers: cell.layers, painter: paintTiles.toString() });
    assert.ok(raster.sampled > 100_000);
    assert.ok(raster.differences / raster.sampled < .001, JSON.stringify(raster));
    console.log(`${id}: ${raster.sampled} source fill pixels compared, ${raster.differences} differed`);
  }
} finally {
  await browser.close();
}
