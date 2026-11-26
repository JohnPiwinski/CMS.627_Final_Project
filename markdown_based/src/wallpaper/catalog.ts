import artin from "./artin-patterns.json";
import {
  wallpapers,
  type Affine,
} from "../../../interactive-artin-ch0/src/lib/wallpaper";
import { registeredWallpaper, sourceCell } from "../lib/wallpaper-explorer";
export type Collection = "artin" | "wikipedia";
export type Pattern = {
  id: string;
  collection: Collection;
  name: string;
  group: string;
  lattice: number[][];
  scale: number;
  representatives: number[][];
  cells: {
    path: string;
    bounds: number[];
    colors: number[];
    fill?: string;
    outline?: boolean;
  }[];
  seam?: string;
};
export const artinPatterns: Pattern[] = artin.map((p) => ({
  ...p,
  id: `artin:${p.group}`,
  collection: "artin",
}));
export function collectionPatterns(collection: Collection): Pattern[] {
  if (collection === "artin") return artinPatterns;
  return wallpapers.map((spec) => {
    const registered = registeredWallpaper(spec),
      cell = sourceCell(spec.id);
    const B = registered.basis;
    return {
      id: `wikipedia:${spec.id}`,
      collection,
      name: spec.id,
      group: spec.id,
      lattice: [
        [B[0], B[2]],
        [B[1], B[3]],
      ],
      scale: 150,
      representatives: registered.reps.map((r) => [...r]),
      cells: cell.layers.map((layer, i) => {
        const points = layer.rings.flat();
        return {
          path: layer.rings
            .map((r) => "M" + r.map((p) => `${p.x} ${p.y}`).join("L") + "Z")
            .join(""),
          bounds: [
            Math.min(...points.map((p) => p.x)),
            Math.min(...points.map((p) => p.y)),
            Math.max(...points.map((p) => p.x)),
            Math.max(...points.map((p) => p.y)),
          ],
          colors: Array(16).fill(0),
          fill: layer.fill,
          outline: cell.layers.length === 1 || i > 0,
        };
      }),
    };
  });
}
export function basisOf(p: Pattern): Affine {
  return [
    p.lattice[0][0],
    p.lattice[1][0],
    p.lattice[0][1],
    p.lattice[1][1],
    0,
    0,
  ];
}
