import Konva from "konva";
import type { Point, LatticeTool } from "../lib/geometry";
import type { Affine } from "../lib/wallpaper";
import { collectionPatterns, type Pattern, type Collection } from "./catalog";
type Feature = ReturnType<typeof describeIsometry> & {
  order?: number;
  amounts?: number[];
};
type Move = { tool: LatticeTool; point: Point; angle: number; amount: number };
import { ToolDock } from "../labs/ToolDock";
import {
  createLatticeGestures,
  drawLatticeGesture,
  glideFrame,
} from "../labs/latticeGestures";
import {
  apply,
  compose,
  inverseAffine,
  motion,
  identity,
  describeIsometry,
} from "../lib/wallpaper";

const COLOR_PERIOD = 4;
const colors = [
  "#8cafa2",
  "#eab295",
  "#ebcf86",
  "#a5b4d6",
  "#c7a7be",
  "#bdce90",
];
const wrap = (v: number, n: number) => ((v % n) + n) % n;
export function createWallpaperScene(
  viewport: HTMLDivElement,
  dockHost: HTMLDivElement,
  accessible: HTMLDivElement,
  onPattern?: (p: Pattern) => void,
  initialCollection: Collection = "artin",
  initialGroup = "p31m",
) {
  let patterns = collectionPatterns(initialCollection);
  let index = Math.max(
      0,
      patterns.findIndex((p) => p.group === initialGroup),
    ),
    lattice = true,
    compare = true,
    pan = false,
    status = "",
    animation = 0,
    progress = 1,
    focused = false;
  let tool: LatticeTool = "translate",
    featureList: Feature[] = [],
    trial: Move | undefined,
    dock: ToolDock | undefined,
    active: { id: number; last?: Point } | undefined;
  const overlay = new Konva.Layer();
  const stage = new Konva.Stage({ container: viewport, width: 1, height: 1 });
  const layer = new Konva.Layer({ listening: false });
  const fills = new Konva.Group();
  const outlines = new Konva.Group();
  layer.add(fills, outlines);
  stage.add(layer);

  let pattern: Pattern,
    toLattice: (x: number, y: number) => number[],
    scale: number,
    templates: Konva.Path[],
    seam: Konva.Path | undefined,
    extent: number[],
    renderedArea: number[] | undefined;
  const camera = { x: 0, y: 0 };

  function loadPattern() {
    pattern = patterns[index];
    const [[ax, ay], [bx, by]] = pattern.lattice;
    const determinant = ax * by - ay * bx;
    toLattice = (x, y) => [
      (by * x - bx * y) / determinant,
      (ax * y - ay * x) / determinant,
    ];
    scale = pattern.scale;
    templates?.forEach((template) => template.destroy());
    seam?.destroy();
    templates = pattern.cells.map(
      (cell) =>
        new Konva.Path({
          data: cell.path,
          listening: false,
          perfectDrawEnabled: false,
        }),
    );
    seam = pattern.seam
      ? new Konva.Path({
          data: pattern.seam,
          stroke: "#4b4037",
          strokeWidth: 1.05,
          strokeScaleEnabled: false,
          listening: false,
          perfectDrawEnabled: false,
          lineJoin: "round",
        })
      : undefined;
    extent = limits(
      pattern.cells.flatMap((cell) => {
        const [x0, y0, x1, y1] = cell.bounds;
        return [
          toLattice(x0, y0),
          toLattice(x1, y0),
          toLattice(x0, y1),
          toLattice(x1, y1),
        ];
      }),
    );
    camera.x = camera.y = 0;
    renderedArea = undefined;
    updateDock();
    onPattern?.(pattern);
    viewport.setAttribute(
      "aria-label",
      `${pattern.name}, wallpaper group ${pattern.group}`,
    );
    reset();
  }

  function limits(points: number[][]) {
    const i = points.map((point) => point[0]);
    const j = points.map((point) => point[1]);
    return [Math.min(...i), Math.min(...j), Math.max(...i), Math.max(...j)];
  }

  function draw() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (stage.width() !== width || stage.height() !== height)
      stage.size({ width, height });
    const [[ax, ay], [bx, by]] = pattern.lattice;
    const [u, v] = toLattice(camera.x / scale, camera.y / scale);
    const iOffset = wrap(u, COLOR_PERIOD);
    const jOffset = wrap(v, COLOR_PERIOD);
    const x = iOffset * ax + jOffset * bx;
    const y = iOffset * ay + jOffset * by;
    layer.position({ x: x * scale, y: y * scale });
    layer.scale({ x: scale, y: scale });

    const corners = [
      toLattice(-x, -y),
      toLattice(width / scale - x, -y),
      toLattice(-x, height / scale - y),
      toLattice(width / scale - x, height / scale - y),
    ];
    if (trial) {
      const center = trial.tool === "translate" ? { x: 0, y: 0 } : trial.point;
      const points = [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
      ].map(([x, y]) => world({ x, y }));
      const radius =
        Math.max(
          ...points.map((p) => Math.hypot(p.x - center.x, p.y - center.y)),
        ) +
        (trial.tool === "translate"
          ? Math.hypot(trial.point.x, trial.point.y)
          : Math.abs(trial.amount));
      for (const dx of [-radius, radius])
        for (const dy of [-radius, radius])
          corners.push(toLattice(center.x + dx, center.y + dy));
    }
    const [minI, minJ, maxI, maxJ] = limits(corners);
    const [cellMinI, cellMinJ, cellMaxI, cellMaxJ] = extent;

    // Keep a border of copies outside the viewport and reuse the nodes while
    // the camera stays inside it. Camera wrapping preserves the color period.
    const visible = [
      Math.floor(minI - cellMaxI),
      Math.floor(minJ - cellMaxJ),
      Math.ceil(maxI - cellMinI),
      Math.ceil(maxJ - cellMinJ),
    ];
    if (
      !renderedArea ||
      visible[0] < renderedArea[0] ||
      visible[1] < renderedArea[1] ||
      visible[2] > renderedArea[2] ||
      visible[3] > renderedArea[3]
    ) {
      const area = [
        visible[0] - 1,
        visible[1] - 1,
        visible[2] + 1,
        visible[3] + 1,
      ];
      fills.destroyChildren();
      outlines.destroyChildren();
      for (let j = area[1]; j <= area[3]; j++) {
        for (let i = area[0]; i <= area[2]; i++) {
          const pos = { x: i * ax + j * bx, y: i * ay + j * by };
          const colorIndex =
            wrap(j, COLOR_PERIOD) * COLOR_PERIOD + wrap(i, COLOR_PERIOD);
          for (const [index, cell] of pattern.cells.entries()) {
            const template = templates[index];
            const fill = cell.fill ?? colors[cell.colors[colorIndex]];
            fills.add(
              template.clone({
                ...pos,
                fill,
                stroke: fill,
                strokeWidth: 0.85,
                strokeScaleEnabled: false,
              }),
            );
            if (!seam && cell.outline !== false) {
              outlines.add(
                template.clone({
                  ...pos,
                  stroke: "#4b4037",
                  strokeWidth: 1.05,
                  strokeScaleEnabled: false,
                  lineJoin: "round",
                }),
              );
            }
          }
          if (seam) outlines.add(seam.clone(pos));
        }
      }
      renderedArea = area;
    }
    featureList = features();
    paintTransform();
    drawOverlay();
    layer.batchDraw();
  }

  stage.add(overlay);
  const basis = (): Affine => {
    const [a, b] = pattern.lattice;
    return [a[0], b[0], a[1], b[1], 0, 0];
  };
  const screen = (p: Point) => ({
    x: p.x * scale + layer.x(),
    y: p.y * scale + layer.y(),
  });
  const world = (p: Point) => ({
    x: (p.x - layer.x()) / scale,
    y: (p.y - layer.y()) / scale,
  });
  function snap(p: Point) {
    const [u, v] = toLattice(p.x, p.y);
    let best: Point = { x: 0, y: 0 },
      dist = Infinity;
    for (let i = Math.round(u) - 1; i <= Math.round(u) + 1; i++)
      for (let j = Math.round(v) - 1; j <= Math.round(v) + 1; j++) {
        const q = apply(basis(), { x: i, y: j }),
          d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < dist) {
          best = q;
          dist = d;
        }
      }
    return best;
  }
  const distance = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);
  const axisDistance = (p: Point, f: Feature) =>
    Math.abs(
      -(p.x - f.point.x) * Math.sin(f.angle) +
        (p.y - f.point.y) * Math.cos(f.angle),
    );
  function features() {
    const B = basis(),
      inv = inverseAffine(B),
      corners = [
        [0, 0],
        [stage.width(), 0],
        [0, stage.height()],
        [stage.width(), stage.height()],
      ].map(([x, y]) => world({ x, y }));
    const range = corners.map((p) => apply(inv, p));
    const loX = Math.floor(Math.min(...range.map((p) => p.x))) - 3,
      hiX = Math.ceil(Math.max(...range.map((p) => p.x))) + 3,
      loY = Math.floor(Math.min(...range.map((p) => p.y))) - 3,
      hiY = Math.ceil(Math.max(...range.map((p) => p.y))) + 3;
    const out: Feature[] = [];
    for (const rawRep of pattern.representatives) {
      const [a, b, c, d, x, y] = [
        rawRep[0],
        rawRep[1],
        rawRep[2],
        rawRep[3],
        rawRep[4],
        rawRep[5],
      ] as Affine;
      if (a === 1 && b === 0 && c === 0 && d === 1) continue;
      const center = apply(
          inv,
          world({ x: stage.width() / 2, y: stage.height() / 2 }),
        ),
        offset = apply([1 - a, -b, -c, 1 - d, 0, 0], center),
        extent = Math.max(hiX - loX, hiY - loY) + 2;
      for (
        let i = Math.floor(offset.x) - extent;
        i <= Math.ceil(offset.x) + extent;
        i++
      )
        for (
          let j = Math.floor(offset.y) - extent;
          j <= Math.ceil(offset.y) + extent;
          j++
        ) {
          const f: Feature = describeIsometry(
            compose(B, compose([a, b, c, d, x + i, y + j], inv)),
          );
          if (f.kind === "rotate") {
            const p = screen(f.point);
            if (
              p.x < -55 ||
              p.y < -55 ||
              p.x > stage.width() + 55 ||
              p.y > stage.height() + 55
            )
              continue;
            f.order =
              [2, 3, 4, 6].find(
                (n) =>
                  Math.abs(
                    (n * f.angle) / (2 * Math.PI) -
                      Math.round((n * f.angle) / (2 * Math.PI)),
                  ) < 1e-6,
              ) || 2;
            const old = out.find(
              (g) => g.kind === "rotate" && distance(g.point, f.point) < 1e-5,
            );
            if (old) {
              old.order = Math.max(old.order!, f.order!);
              continue;
            }
          } else if (f.kind === "glide") {
            const old = out.find(
              (g) =>
                g.kind === "glide" &&
                Math.abs(Math.sin(g.angle - f.angle)) < 1e-6 &&
                axisDistance(f.point, g) < 1e-5,
            );
            if (old) {
              if (!old.amounts!.some((n) => Math.abs(n - f.amount) < 1e-6))
                old.amounts!.push(f.amount);
              continue;
            }
            f.amounts = [f.amount];
          } else if (f.kind !== "reflect") continue;
          if (
            f.kind === "reflect" &&
            out.some(
              (g) =>
                g.kind === "reflect" &&
                Math.abs(Math.sin(g.angle - f.angle)) < 1e-6 &&
                axisDistance(f.point, g) < 1e-5,
            )
          )
            continue;
          out.push(f);
        }
    }
    return out;
  }
  function paintTransform() {
    let map: Affine;
    if (trial?.tool === "glide") {
      const frame = glideFrame(
        trial.point,
        trial.angle,
        trial.amount,
        progress === 0.25 ? 0.25001 : progress,
      );
      const o = frame({ x: 0, y: 0 }),
        u = frame({ x: 1, y: 0 }),
        v = frame({ x: 0, y: 1 });
      map = [u.x - o.x, v.x - o.x, u.y - o.y, v.y - o.y, o.x, o.y];
    } else
      map = trial
        ? motion(
            trial.tool,
            trial.point,
            trial.angle,
            0,
            trial.tool === "reflect" && progress === 0.5 ? 0.50001 : progress,
          )
        : identity;
    // Fill and outline groups share the same transformed frame. The lattice stays fixed.
    const [a, b, c, d, x, y] = map;
    const attrs = new Konva.Transform([a, c, b, d, x, y]).decompose();
    fills.setAttrs(attrs);
    outlines.setAttrs(attrs);
  }
  function hint(s: string) {
    status = s;
    drawOverlay();
  }
  const gestures = createLatticeGestures({
    yUp: false,
    unit: () => scale,
    translationNode: (p, end) =>
      end || distance(p, snap(p)) * scale < 14 ? snap(p) : undefined,
    rotationCenter: (p) => {
      const f = featureList
        .filter((f) => f.kind === "rotate" && distance(p, f.point) * scale < 15)
        .sort((a, b) => b.order! - a.order!)[0];
      return f && { point: f.point, count: f.order! };
    },
    axisAnchor: (p, kind) => {
      const fs = featureList.filter(
        (f) =>
          f.kind === (kind === "glide" ? "glide" : "reflect") &&
          axisDistance(p, f) * scale < 13,
      );
      return fs.length
        ? { point: p, angles: fs.flatMap((f) => [f.angle, f.angle + Math.PI]) }
        : undefined;
    },
    chooseAxis: (p, a, kind) => {
      const f = featureList
        .filter(
          (f) =>
            f.kind === (kind === "glide" ? "glide" : "reflect") &&
            axisDistance(p, f) * scale < 13 &&
            Math.abs(Math.sin(a - f.angle)) < 0.27,
        )
        .sort(
          (f, g) =>
            Math.abs(Math.sin(a - f.angle)) - Math.abs(Math.sin(a - g.angle)),
        )[0];
      if (f) {
        const t =
          (p.x - f.point.x) * Math.cos(f.angle) +
          (p.y - f.point.y) * Math.sin(f.angle);
        return {
          point: {
            x: f.point.x + t * Math.cos(f.angle),
            y: f.point.y + t * Math.sin(f.angle),
          },
          angle: f.angle,
          amounts: f.amounts,
        };
      }
    },
    glideAmount: (axis, start, end) => {
      if (
        axisDistance(start, { ...axis, kind: "glide", amount: 0 }) * scale >
          14 ||
        axisDistance(end, { ...axis, kind: "glide", amount: 0 }) * scale > 20
      )
        return;
      const slide =
        (end.x - axis.point.x) * Math.cos(axis.angle) +
        (end.y - axis.point.y) * Math.sin(axis.angle);
      const amount = [...(axis.amounts ?? [])].sort(
        (a, b) => Math.abs(a - slide) - Math.abs(b - slide),
      )[0];
      return amount !== undefined &&
        Math.sign(amount) === Math.sign(slide) &&
        Math.abs(amount - slide) * scale < 38
        ? amount
        : undefined;
    },
    cursorStep: (p, x, y, fast, t) =>
      t === "translate"
        ? apply(basis(), {
            x: Math.round(toLattice(p.x, p.y)[0]) + x,
            y: Math.round(toLattice(p.x, p.y)[1]) + y,
          })
        : {
            x: p.x + x * (fast ? 0.25 : 0.04),
            y: p.y + y * (fast ? 0.25 : 0.04),
          },
    commit: (move) => {
      trial = move;
      progress = 0;
      renderedArea = undefined;
      draw();
      cancelAnimationFrame(animation);
      const start = performance.now();
      const tick = (now: number) => {
        progress = matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 1
          : Math.min(1, (now - start) / 740);
        paintTransform();
        drawOverlay();
        layer.batchDraw();
        if (progress < 1) animation = requestAnimationFrame(tick);
      };
      animation = requestAnimationFrame(tick);
      hint("Outline symmetry applied. Colors may move.");
    },
    hint,
    changed: () => drawOverlay(),
  });
  function updateDock() {
    const tools: LatticeTool[] = ["translate", "rotate", "reflect"];
    if (pattern.representatives.some(([a, b, c, d]) => a * d - b * c < 0))
      tools.push("glide");
    if (!tools.includes(tool)) {
      tool = "translate";
      gestures.select(tool);
    }
    dock?.destroy();
    dock = new ToolDock(dockHost, tools, selectTool);
    dockHost.style.width = `${tools.length * 54 + 12}px`;
    const button = accessible.querySelector<HTMLButtonElement>(
      '[data-tool="glide"]',
    );
    if (button) button.hidden = !tools.includes("glide");
  }
  function selectTool(next: LatticeTool) {
    tool = next;
    pan = false;
    if (active && viewport.hasPointerCapture(active.id))
      viewport.releasePointerCapture(active.id);
    active = undefined;
    gestures.select(next);
    dock?.update(next);
    featureList = features();
    const available =
      next === "translate" ||
      featureList.some(
        (f) =>
          f.kind ===
          (next === "rotate"
            ? "rotate"
            : next === "glide"
              ? "glide"
              : "reflect"),
      );
    hint(
      available
        ? next === "translate"
          ? "Drag from a lattice node. The arrow snaps to lattice nodes."
          : next === "rotate"
            ? "Choose a purple center, then drag around the dial."
            : next === "glide"
              ? "Drag along a purple glide axis, then slide to a highlighted dot."
              : "Start on a dashed mirror and drag along it."
        : `${pattern.group} has no ${next === "rotate" ? "rotations" : "mirrors"}. Choose the example button.`,
    );
  }
  function reset() {
    cancelAnimationFrame(animation);
    if (active && viewport.hasPointerCapture(active.id))
      viewport.releasePointerCapture(active.id);
    active = undefined;
    trial = undefined;
    progress = 1;
    gestures?.reset();
    camera.x = camera.y = 0;
    renderedArea = undefined;
    draw();
    selectTool(tool);
  }
  function button(
    text: string,
    x: number,
    y: number,
    action: () => void,
    pressed = false,
  ) {
    const g = new Konva.Group({ x, y });
    const t = new Konva.Text({
      text,
      fontSize: 13,
      padding: 10,
      fill: "#f6eedb",
    });
    g.add(
      new Konva.Rect({
        width: t.width(),
        height: 34,
        fill: pressed ? "#427760" : "#203b34",
        cornerRadius: 5,
      }),
      t,
    );
    g.on("click tap", action);
    overlay.add(g);
    return t.width() + 6;
  }
  function drawOverlay() {
    if (!pattern) return;
    overlay.destroyChildren();
    const w = stage.width(),
      h = stage.height();
    if (compare && trial) {
      const ref = new Konva.Group({ opacity: 0.24, listening: false });
      for (const node of outlines.children) {
        const clone = node.clone();
        const [a, b] = pattern.lattice;
        ref.add(clone);
      }
      ref.position(layer.position());
      ref.scale({ x: scale, y: scale });
      overlay.add(ref);
    }
    if (lattice) {
      const [a, b] = pattern.lattice;
      const points = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([x, y]) => toLattice(world({ x, y }).x, world({ x, y }).y));
      const lim = limits(points);
      const gridLine = (a: Point, b: Point) => {
        const p = screen(a),
          q = screen(b);
        overlay.add(
          new Konva.Line({
            points: [p.x, p.y, q.x, q.y],
            stroke: "#243b3455",
            strokeWidth: 1,
            dash: [3, 6],
            listening: false,
          }),
        );
      };
      for (let i = Math.floor(lim[0]); i <= Math.ceil(lim[2]); i++)
        gridLine(
          apply(basis(), { x: i, y: lim[1] - 1 }),
          apply(basis(), { x: i, y: lim[3] + 1 }),
        );
      for (let j = Math.floor(lim[1]); j <= Math.ceil(lim[3]); j++)
        gridLine(
          apply(basis(), { x: lim[0] - 1, y: j }),
          apply(basis(), { x: lim[2] + 1, y: j }),
        );
      for (let i = Math.floor(lim[0]) - 1; i <= Math.ceil(lim[2]) + 1; i++)
        for (let j = Math.floor(lim[1]) - 1; j <= Math.ceil(lim[3]) + 1; j++) {
          const p = screen(apply(basis(), { x: i, y: j }));
          overlay.add(
            new Konva.Circle({
              ...p,
              radius: 3.5,
              fill: "#243b34",
              stroke: "#f6eedb",
              strokeWidth: 1,
              listening: false,
            }),
          );
        }
      const anchor = snap(
        world({ x: stage.width() / 2, y: stage.height() / 2 }),
      );
      const origin = screen(anchor);
      for (const [v, label] of [
        [a, "u"],
        [b, "v"],
      ] as [number[], string][]) {
        const p = screen({ x: anchor.x + v[0], y: anchor.y + v[1] });
        overlay.add(
          new Konva.Arrow({
            points: [origin.x, origin.y, p.x, p.y],
            stroke: "#243b34",
            fill: "#243b34",
            listening: false,
          }),
          new Konva.Text({
            ...p,
            text: label,
            fill: "#142820",
            fontSize: 18,
            listening: false,
          }),
        );
      }
    }
    for (const f of featureList) {
      if (tool === "rotate" && f.kind === "rotate")
        overlay.add(
          new Konva.Circle({
            ...screen(f.point),
            radius: 7,
            fill: "#f3eafa",
            stroke: "#674d91",
            strokeWidth: 2,
            listening: false,
          }),
        );
      if (
        (tool === "reflect" && f.kind === "reflect") ||
        (tool === "glide" && f.kind === "glide")
      ) {
        const p = screen(f.point),
          dx = Math.cos(f.angle) * 3000,
          dy = Math.sin(f.angle) * 3000;
        overlay.add(
          new Konva.Line({
            points: [p.x - dx, p.y - dy, p.x + dx, p.y + dy],
            stroke: tool === "glide" ? "#774a86" : "#345454",
            strokeWidth: 2,
            dash: [5, 8],
            listening: false,
          }),
        );
      }
    }
    const glide = gestures.state.glide;
    if (glide)
      for (const amount of glide.amounts ?? []) {
        const p = screen({
          x: glide.point.x + amount * Math.cos(glide.angle),
          y: glide.point.y + amount * Math.sin(glide.angle),
        });
        overlay.add(
          new Konva.Circle({
            ...p,
            radius: 6,
            fill: "#a7d6be",
            stroke: "#774a86",
            strokeWidth: 2,
            listening: false,
          }),
        );
      }
    drawLatticeGesture(overlay, gestures.state, screen, false);
    if (focused)
      overlay.add(
        new Konva.Circle({
          ...screen(gestures.state.cursor),
          radius: 6,
          stroke: "#fff",
          fill: "#b88736",
          listening: false,
        }),
      );
    let x = 8,
      y = 8;
    for (const [text, action, pressed] of [
      [
        "Lattice",
        () => {
          lattice = !lattice;
          drawOverlay();
        },
        lattice,
      ],
      [
        "Compare",
        () => {
          compare = !compare;
          drawOverlay();
        },
        compare,
      ],
      [
        "Pan",
        () => {
          pan = !pan;
          gestures.cancel();
          drawOverlay();
        },
        pan,
      ],
      ["Reset", reset, false],
    ] as [string, () => void, boolean][]) {
      if (x + 90 > w) {
        x = 8;
        y += 40;
      }
      x += button(text, x, y, action, pressed);
    }
    const missing =
      tool !== "translate" &&
      !featureList.some(
        (f) =>
          f.kind ===
          (tool === "rotate"
            ? "rotate"
            : tool === "glide"
              ? "glide"
              : "reflect"),
      );
    if (missing)
      button("Open example", 8, y + 40, () =>
        setPattern(
          patterns.findIndex(
            (p) => p.group === (tool === "rotate" ? "p4" : "pmm"),
          ),
        ),
      );
    overlay.add(
      new Konva.Rect({
        x: 8,
        y: h - 142,
        width: Math.max(0, w - 16),
        height: 48,
        fill: "#203b34",
        cornerRadius: 5,
        opacity: 0.94,
        listening: false,
      }),
      new Konva.Text({
        x: 16,
        y: h - 136,
        width: w - 32,
        text:
          status + "\nColors distinguish cells; symmetry refers to outlines.",
        fontSize: 12,
        lineHeight: 1.45,
        fill: "#fff",
        listening: false,
      }),
    );
    accessible.querySelector("[role=status]")!.textContent = status;
    overlay.batchDraw();
  }
  function location(e: PointerEvent) {
    const r = viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  const down = (e: PointerEvent) => {
    if (!e.isPrimary || e.button !== 0) return;
    const p = location(e);
    if (stage.getIntersection(p)) return;
    viewport.focus({ preventScroll: true });
    if (pan) active = { id: e.pointerId, last: p };
    else if (gestures.down(world(p))) active = { id: e.pointerId };
    if (active) viewport.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (active?.id !== e.pointerId) return;
    const p = location(e);
    if (active.last) {
      camera.x += p.x - active.last.x;
      camera.y += p.y - active.last.y;
      active.last = p;
      draw();
    } else gestures.move(world(p));
  };
  const up = (e: PointerEvent) => {
    if (active?.id !== e.pointerId) return;
    if (!active.last) gestures.up(world(location(e)));
    active = undefined;
    if (viewport.hasPointerCapture(e.pointerId))
      viewport.releasePointerCapture(e.pointerId);
  };
  const lostCapture = () => {
    if (active) cancel();
  };
  const cancel = () => {
    active = undefined;
    gestures.cancel();
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      cancel();
      return;
    }
    if (pan && e.key.startsWith("Arrow")) {
      const delta = {
        ArrowLeft: [48, 0],
        ArrowRight: [-48, 0],
        ArrowUp: [0, 48],
        ArrowDown: [0, -48],
      }[e.key]!;
      camera.x += delta[0];
      camera.y += delta[1];
      e.preventDefault();
      draw();
    } else gestures.key(e);
  };
  const focus = () => {
      focused = true;
      drawOverlay();
    },
    blur = () => {
      focused = false;
      drawOverlay();
    };
  for (const [name, fn] of Object.entries({
    pointerdown: down,
    pointermove: move,
    pointerup: up,
    pointercancel: cancel,
    lostpointercapture: lostCapture,
    keydown: key,
    focus,
    blur,
  }))
    viewport.addEventListener(name, fn as EventListener);
  const observer = new ResizeObserver(() => {
    draw();
  });
  observer.observe(viewport);
  function setPattern(next: number) {
    index = next;
    loadPattern();
  }
  accessible
    .querySelectorAll<HTMLButtonElement>("[data-tool]")
    .forEach(
      (b) => (b.onclick = () => selectTool(b.dataset.tool as LatticeTool)),
    );
  accessible.querySelectorAll<HTMLButtonElement>("[data-action]").forEach(
    (b) =>
      (b.onclick = () =>
        ({
          lattice: () => {
            lattice = !lattice;
            drawOverlay();
          },
          compare: () => {
            compare = !compare;
            drawOverlay();
          },
          pan: () => {
            pan = !pan;
            drawOverlay();
          },
          reset,
          example: () =>
            setPattern(
              patterns.findIndex(
                (p) => p.group === (tool === "rotate" ? "p4" : "pmm"),
              ),
            ),
        })[
          b.dataset.action as
            "lattice" | "compare" | "pan" | "reset" | "example"
        ]()),
  );
  setPattern(index);
  return {
    setPattern,
    setCollection(collection: Collection) {
      const group = pattern.group;
      patterns = collectionPatterns(collection);
      index = Math.max(
        0,
        patterns.findIndex((p) => p.group === group),
      );
      loadPattern();
    },
    setGroup(group: string) {
      const next = patterns.findIndex((p) => p.group === group);
      if (next >= 0) setPattern(next);
    },
    selectTool,
    reset,
    dispose() {
      cancelAnimationFrame(animation);
      observer.disconnect();
      templates?.forEach((template) => template.destroy());
      seam?.destroy();
      dock?.destroy();
      stage.destroy();
      for (const [name, fn] of Object.entries({
        pointerdown: down,
        pointermove: move,
        pointerup: up,
        pointercancel: cancel,
        lostpointercapture: lostCapture,
        keydown: key,
        focus,
        blur,
      }))
        viewport.removeEventListener(name, fn as EventListener);
    },
  };
}
