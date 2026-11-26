/** The render input keeps source geometry and painter order. No clip, outline, or symmetry operation is added. */
export function translatedCells(cell, columns, rows, scale = 1) {
  const [u, v] = cell.basis;
  return Array.from({ length: rows }, (_, j) => Array.from({ length: columns }, (_, i) => {
    const offset = [i * u[0] + j * v[0], i * u[1] + j * v[1]];
    return cell.layers.map(({ fill, rings }) => ({
      fill,
      rings: rings.map(ring => ring.map(([x, y]) => [(x + offset[0]) * scale, (y + offset[1]) * scale])),
    }));
  })).flat();
}

export function paintTiles(context, tiles) {
  for (const layers of tiles) for (const {fill, rings} of layers) {
    context.fillStyle = fill;
    context.beginPath();
    for (const [[x, y], ...rest] of rings) {
      context.moveTo(x, y);
      for (const [a, b] of rest) context.lineTo(a, b);
      context.closePath();
    }
    context.fill();
  }
}
