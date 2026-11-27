import type { Pattern } from "./catalog";

export const COLOR_PERIOD = 4;
const colors = ["#8cafa2", "#eab295", "#ebcf86", "#a5b4d6", "#c7a7be", "#bdce90"];
export const wrap = (v: number, n: number) => ((v % n) + n) % n;

export function wallpaperTexture(pattern: Pattern, outlines: boolean) {
  const [[ax, ay], [bx, by]] = pattern.lattice;
  const determinant = ax * by - ay * bx;
  const resolution = pattern.scale * Math.min(window.devicePixelRatio || 1, 2);
  const tile = document.createElement("canvas");
  tile.width = Math.max(1, Math.min(4096, Math.ceil(COLOR_PERIOD * Math.hypot(ax, ay) * resolution)));
  tile.height = Math.max(1, Math.min(4096, Math.ceil(COLOR_PERIOD * Math.hypot(bx, by) * resolution)));
  const context = tile.getContext("2d")!;
  const sx = tile.width / COLOR_PERIOD, sy = tile.height / COLOR_PERIOD;
  context.setTransform(sx * by / determinant, -sy * ay / determinant,
    -sx * bx / determinant, sy * ax / determinant, 0, 0);
  const seam = pattern.seam ? new Path2D(pattern.seam) : undefined;
  const cells = pattern.cells.map(cell => ({ ...cell, path: new Path2D(cell.path) }));
  // Include neighboring paths that cross a repeat boundary. The canvas clips
  // them at the tile edge, and repeating the tile puts both halves together.
  const bounds = cells.flatMap(({ bounds: [x0, y0, x1, y1] }) =>
    [x0, x1].flatMap(x => [y0, y1].map(y =>
      [(by * x - bx * y) / determinant, (ax * y - ay * x) / determinant])));
  const is = bounds.map(p => p[0]), js = bounds.map(p => p[1]);
  context.lineJoin = outlines ? "round" : "miter";
  context.lineWidth = (outlines ? 1.05 : 0.85) / pattern.scale;
  for (let j = Math.floor(-Math.max(...js)) - 1; j <= Math.ceil(COLOR_PERIOD - Math.min(...js)) + 1; j++) {
    for (let i = Math.floor(-Math.max(...is)) - 1; i <= Math.ceil(COLOR_PERIOD - Math.min(...is)) + 1; i++) {
      context.save();
      context.translate(i * ax + j * bx, i * ay + j * by);
      const colorIndex = wrap(j, COLOR_PERIOD) * COLOR_PERIOD + wrap(i, COLOR_PERIOD);
      if (outlines && seam) {
        context.strokeStyle = "#4b4037";
        context.stroke(seam);
      } else for (const cell of cells) {
        if (!outlines) {
          context.fillStyle = context.strokeStyle = cell.fill ?? colors[cell.colors[colorIndex]];
          context.fill(cell.path);
          context.stroke(cell.path);
        } else if (cell.outline !== false) {
          context.strokeStyle = "#4b4037";
          context.stroke(cell.path);
        }
      }
      context.restore();
    }
  }
  return tile;
}
