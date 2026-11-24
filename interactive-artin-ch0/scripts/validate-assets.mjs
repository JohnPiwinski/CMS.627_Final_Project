import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../src/content/wallpaper-assets.json', import.meta.url)));
const ids = new Set();
for (const asset of [...manifest.photos, ...manifest.diagrams]) {
  for (const field of ['id', 'group', 'source', 'originalFilename', 'author', 'license', 'licenseUrl', 'path', 'label', 'note']) {
    if (!asset[field]) throw new Error(`Missing ${field} for ${asset.id ?? '(unknown reference)'}`);
  }
  if (ids.has(asset.id)) throw new Error(`Duplicate asset id: ${asset.id}`);
  ids.add(asset.id);
  if (!/^\.\/wallpaper\/[A-Za-z0-9_-]+\.(jpg|svg)$/.test(asset.path)) throw new Error(`Invalid asset path: ${asset.path}`);
  const bytes = await readFile(new URL(asset.path.slice(2), new URL('../public/', import.meta.url)));
  if (asset.path.endsWith('.jpg')) {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || asset.crop?.length !== 4) throw new Error(`Invalid photograph: ${asset.id}`);
  } else {
    const xml = bytes.toString('utf8');
    if (!xml.includes('<svg') || /<(script|foreignObject|iframe|style)\b|\bon\w+=|\bhref=["'](?!#)|url\(\s*(?!#)[^)]+\)/i.test(xml)) {
      throw new Error(`Invalid or active SVG: ${asset.id}`);
    }
  }
}
console.log(`Validated ${ids.size} local references and their credits.`);
