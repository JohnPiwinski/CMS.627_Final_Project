import Konva from 'konva';
import type { LatticeTool } from '../lib/geometry';

const labels: Record<LatticeTool, string> = { translate: 'Translate', rotate: 'Rotate', reflect: 'Reflect' };
const icons: Record<LatticeTool, string> = {
  translate: 'M12 3 L12 21 M3 12 L21 12 M8 7 L12 3 L16 7 M8 17 L12 21 L16 17 M7 8 L3 12 L7 16 M17 8 L21 12 L17 16',
  rotate: 'M20 9 A8 8 0 1 0 20 16 M20 3 L20 9 L14 9',
  reflect: 'M12 2 L12 22 M8 5 L2 18 L8 18 Z M16 5 L22 18 L16 18 Z',
};
const stride = 54;
const inset = 6;

export class ToolDock {
  private readonly stage: Konva.Stage;
  private readonly layer = new Konva.Layer();
  private readonly buttons = new Map<LatticeTool, Konva.Rect>();
  private readonly caption: Konva.Label;
  private selected?: LatticeTool;
  private cue?: LatticeTool;
  private hovered?: LatticeTool;
  private index = 0;

  constructor(private readonly host: HTMLDivElement, private readonly tools: readonly LatticeTool[],
    private readonly select: (tool: LatticeTool) => void) {
    const width = tools.length * stride + inset * 2;
    this.stage = new Konva.Stage({ container: host, width, height: 91 });
    this.stage.add(this.layer);
    this.layer.add(new Konva.Rect({ y: 34, width, height: 57, cornerRadius: 17, fill: '#172824', opacity: .97 }));
    tools.forEach((tool, index) => {
      const button = new Konva.Group({ x: inset + stride * index, y: 40 });
      const box = new Konva.Rect({ width: 50, height: 45, cornerRadius: 12, strokeWidth: 2 });
      this.buttons.set(tool, box);
      button.add(box, new Konva.Path({ x: 13, y: 10, data: icons[tool], stroke: '#f3f7f2',
        strokeWidth: 1.6, lineJoin: 'round', lineCap: 'round', listening: false }));
      button.on('click tap', () => this.activate(index));
      button.on('mouseenter', () => { this.hovered = tool; this.paint(); });
      button.on('mouseleave', () => { this.hovered = undefined; this.paint(); });
      this.layer.add(button);
    });
    this.caption = new Konva.Label({ y: 2, listening: false });
    this.caption.add(new Konva.Tag({ fill: '#172824', cornerRadius: 5 }),
      new Konva.Text({ fontSize: 13, fill: '#fff', padding: 6 }));
    this.layer.add(this.caption);
    host.tabIndex = 0;
    host.setAttribute('role', 'toolbar');
    host.addEventListener('keydown', this.key);
    host.addEventListener('focus', this.paint);
    host.addEventListener('blur', this.paint);
    this.update();
  }

  update(selected?: LatticeTool, cue?: LatticeTool) {
    this.selected = selected;
    this.cue = cue;
    this.paint();
  }

  private activate(index: number) {
    this.index = index;
    this.select(this.tools[index]);
  }

  private readonly key = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      this.index = (this.index + delta + this.tools.length) % this.tools.length;
      this.paint();
    } else if (event.key === 'Enter' || event.key === ' ') {
      this.activate(this.index);
    } else return;
    event.preventDefault();
  };

  private readonly paint = () => {
    const focused = document.activeElement === this.host ? this.tools[this.index] : undefined;
    const named = this.hovered ?? focused;
    for (const [tool, box] of this.buttons) {
      box.fill(tool === this.selected ? '#427760' : tool === named ? '#42534b' : '#263d34');
      box.stroke(tool === this.cue ? '#f6c674' : tool === named ? '#d4e6da' : 'transparent');
    }
    this.caption.visible(Boolean(named));
    if (named) {
      this.caption.getText().text(labels[named]);
      const width = this.caption.getText().width();
      const center = inset + this.tools.indexOf(named) * stride + 25;
      this.caption.x(Math.max(0, Math.min(this.stage.width() - width, center - width / 2)));
    }
    this.host.setAttribute('aria-label', `Transformation tools. ${this.tools.map(tool => labels[tool]).join(', ')}. ` +
      `${focused ? labels[focused] + ' focused. ' : ''}${this.selected ? labels[this.selected] + ' selected. ' : ''}` +
      'Use Left and Right arrows to browse and Enter to select.');
    this.stage.container().style.cursor = this.hovered ? 'pointer' : '';
    this.layer.batchDraw();
  };

  destroy() {
    this.host.removeEventListener('keydown', this.key);
    this.host.removeEventListener('focus', this.paint);
    this.host.removeEventListener('blur', this.paint);
    this.stage.destroy();
  }
}
