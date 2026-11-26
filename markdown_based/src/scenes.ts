import { ACESFilmicToneMapping, SRGBColorSpace, WebGLRenderer } from 'three';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { CubeLab } from './labs/CubeLab';
import { LatticeLab } from './labs/LatticeLab';
import type { Feature } from './lib/features';
import type { LatticeTool } from './lib/geometry';
import type { Solid } from './lib/solids';
import type { SceneEvent, SceneId, Tool } from './content';

const latticeEvents = { translate: 'translated', rotate: 'rotated', reflect: 'reflected', glide: 'glided' } as const;
const featureEvents = { face: 'face-selected', edge: 'edge-selected', vertex: 'vertex-selected' } as const;
export const features = ['face', 'edge', 'vertex'] as const;
export const latticeTools = ['translate', 'rotate', 'reflect', 'glide'] as const;

export type SceneControls = {
  configure(tools: Tool[]): void;
  use(tool: LatticeTool): void;
  pick(feature: Feature): void;
  choose(solid: Solid): void;
  reset(): void;
  resetView(): void;
};

export function createRenderer() {
  try {
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    return renderer;
  } catch {
    const renderer = new SVGRenderer();
    renderer.setPrecision(1);
    return renderer;
  }
}

export class SceneHost {
  private active?: LatticeLab | CubeLab;
  private renderer?: WebGLRenderer | SVGRenderer;

  constructor(private readonly element: HTMLDivElement) {}

  mount(id: SceneId, emit: (event: SceneEvent) => void, hint: (text: string) => void): SceneControls {
    this.active?.destroy();
    this.active = undefined;
    this.element.inert = false;
    if (id === 'solids') {
      this.renderer ??= createRenderer();
      const lab = new CubeLab(this.element, this.renderer);
      this.active = lab;
      let solid: Solid = 'Cube';
      let transformChosen = false;
      lab.setSolid(solid);
      lab.onHint = hint;
      lab.onOrbit = () => emit('orbited');
      lab.onPick = feature => emit(featureEvents[feature]);
      lab.onSymmetry = mode => emit(latticeEvents[mode]);
      return {
        configure: () => {
          lab.configure([...features], true, false);
        },
        use: tool => {
          if (tool === 'translate' || tool === 'glide') return;
          if (!transformChosen) {
            transformChosen = true;
            lab.configure([...features], true, true);
          }
          lab.setMode(tool);
        },
        pick: feature => lab.selectFeatureByType(feature, false),
        choose: name => { solid = name; lab.setSolid(solid); },
        reset: () => lab.setSolid(solid),
        resetView: () => lab.resetView(),
      };
    }
    if (id !== 'square' && id !== 'triangular') throw new Error('Scene requires its own workspace: ' + id);
    const lab = new LatticeLab(this.element);
    lab.setLattice(id);
    lab.onHint = hint;
    lab.onPerformed = tool => emit(latticeEvents[tool]);
    lab.onMatched = () => emit('matched');
    this.active = lab;
    return {
      configure: () => {},
      use: tool => lab.setTool(tool),
      pick: () => {},
      choose: () => {},
      reset: () => lab.reset(),
      resetView: () => {},
    };
  }

  dispose() {
    this.active?.destroy();
    this.active = undefined;
    if (this.renderer instanceof WebGLRenderer) this.renderer.dispose();
    this.renderer = undefined;
  }
}
