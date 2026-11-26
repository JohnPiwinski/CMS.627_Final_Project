import { axisComponent, createLatticeGestures, drawLatticeGesture, glideFrame } from './latticeGestures';
import Konva from 'konva';
import {
  add, distance, ease, latticePoint, lerp, matchesMotif, nearestLatticePoint, reflectAcross,
  rotateAbout, scale, snappedAxisAngle, startingMotif, sub, targetMotif,
  type LatticeTool, type LatticeType, type Point,
} from '../lib/geometry';

const COLORS = ['#e16b62', '#3f84bf', '#dfaa46'];

export class LatticeLab {
  readonly stage: Konva.Stage;
  private readonly gridLayer = new Konva.Layer({ listening: true });
  private readonly activeLayer = new Konva.Layer();
  private observer: ResizeObserver;
  private lattice: LatticeType = 'square';
  private tool: LatticeTool = 'translate';
  private unit = 42;
  private width = 700;
  private height = 460;
  private points: Point[] = startingMotif('square');
  private target = targetMotif('square');
  private ghost: Point[] | null = null;
  private gridMotion: ((point: Point) => Point) | null = null;
  private animationFrame: number | null = null;
  private generation = 0;
  onPerformed: (tool: LatticeTool, lattice: LatticeType) => void = () => {};
  onMatched: (lattice: LatticeType) => void = () => {};
  onHint: (hint: string) => void = () => {};

  constructor(private readonly host: HTMLDivElement) {
    this.stage = new Konva.Stage({ container: host, width: 700, height: 460 });
    this.stage.add(this.gridLayer, this.activeLayer);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(host);
    this.stage.on('pointerdown', () => this.pointer('down'));
    this.stage.on('pointermove', () => this.pointer('move'));
    this.stage.on('pointerup', () => this.pointer('up'));
    this.stage.on('pointerleave pointercancel', () => this.gestures.cancel());
    host.tabIndex = 0;
    host.setAttribute('aria-label','Lattice workspace. Use arrow keys to move, Enter to choose, and Escape to cancel.');
    host.addEventListener('keydown',this.key);
    host.addEventListener('blur',this.blur);
    this.resize();
  }

  setTool(tool: LatticeTool): void {
    this.tool = tool;
    this.gestures.select(tool);
    this.onHint(this.instructions());
  }

  getTool(): LatticeTool { return this.tool; }
  getLattice(): LatticeType { return this.lattice; }

  setLattice(lattice: LatticeType): void {
    this.lattice = lattice;
    this.reset();
    this.onHint(this.instructions());
  }

  reset(): void {
    this.generation++;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.gridMotion = null;
    this.drawGrid();
    this.points = startingMotif(this.lattice);
    this.target = targetMotif(this.lattice);
    this.ghost = null;
    this.gestures.reset();
    this.onHint(this.instructions());
  }

  destroy(): void {
    this.generation++;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.host.removeEventListener('keydown',this.key);
    this.host.removeEventListener('blur',this.blur);
    this.observer.disconnect();
    this.stage.destroy();
  }

  private instructions(): string {
    if (this.tool === 'translate') return 'Drag between lattice dots, or click two dots, to move the marked triangle.';
    if (this.tool === 'rotate') return 'Click a lattice dot to open the rotation dial. Drag around it in either direction, then release.';
    if (this.tool === 'glide') return 'Drag to set a mirror line, then drag along it to choose the slide.';
    return `Press a lattice point, drag to select one of ${this.lattice === 'square' ? 'two' : 'three'} mirror directions, then release.`;
  }

  private resize(): void {
    this.width = Math.max(this.host.clientWidth, 240);
    this.height = Math.max(this.host.clientHeight, 250);
    this.unit = Math.max(29, Math.min(47, Math.min(this.width / 14.6, this.height / 9.1)));
    this.stage.size({ width: this.width, height: this.height });
    this.drawGrid();
    this.renderActive();
  }

  private screen(p: Point): Point {
    return { x: this.width / 2 + p.x * this.unit, y: this.height / 2 - p.y * this.unit };
  }
  private world(p: Point): Point {
    return { x: (p.x - this.width / 2) / this.unit, y: (this.height / 2 - p.y) / this.unit };
  }
  private currentPointer(): Point | null {
    const p = this.stage.getPointerPosition();
    return p ? this.world(p) : null;
  }

  private drawGrid(): void {
    this.gridLayer.destroyChildren();
    const surface = new Konva.Rect({x:0,y:0,width:this.width,height:this.height,fill:'#faf7ef',listening:true});
    this.gridLayer.add(surface);
    const a = latticePoint(1, 0, this.lattice);
    const b = latticePoint(0, 1, this.lattice);
    const directions = this.lattice === 'square' ? [a, b] : [a, b, sub(b, a)];
    const starts = this.lattice === 'square' ? [b, a] : [b, a, a];
    // Cover the viewport even when a corner pivot swings distant grid points into view.
    const extent = Math.ceil(3 * Math.hypot(this.width, this.height) / this.unit) + 2;
    const dotRows = Array.from({ length: 2 * extent + 1 }, (_, i) =>
      latticePoint(i - extent, 0, this.lattice));
    const dotColumns = Array.from({ length: 2 * extent + 1 }, (_, j) =>
      latticePoint(0, j - extent, this.lattice));
    this.gridLayer.add(new Konva.Shape({
      listening: false,
      sceneFunc: context => {
        const map = (point: Point) => this.screen(this.gridMotion?.(point) ?? point);
        context.strokeStyle = '#e6e1d5';
        context.lineWidth = .95;
        context.beginPath();
        directions.forEach((direction, k) => {
          for (let n = -extent; n <= extent; n++) {
            const offset = scale(starts[k], n);
            const from = map(add(offset, scale(direction, -2 * extent)));
            const to = map(add(offset, scale(direction, 2 * extent)));
            context.moveTo(from.x, from.y);
            context.lineTo(to.x, to.y);
          }
        });
        context.stroke();
        context.fillStyle = '#b6b8ae';
        context.beginPath();
        // Derive the projected basis once per frame and use it to position all dots.
        const origin = map({ x: 0, y: 0 });
        const xBasis = sub(map({ x: 1, y: 0 }), origin);
        const yBasis = sub(map({ x: 0, y: 1 }), origin);
        for (const row of dotRows) for (const column of dotColumns) {
          const x = row.x + column.x;
          const y = column.y;
          const px = origin.x + x * xBasis.x + y * yBasis.x;
          const py = origin.y + x * xBasis.y + y * yBasis.y;
          if (px < -2 || px > this.width + 2 || py < -2 || py > this.height + 2) continue;
          context.moveTo(px + 2, py);
          context.arc(px, py, 2, 0, 2 * Math.PI);
        }
        context.fill();
      },
    }));
    const o=this.screen({x:0,y:0});
    this.gridLayer.add(new Konva.Line({points:[12,o.y,this.width-12,o.y],stroke:'#c6c2b9',strokeWidth:1.2,listening:false}));
    this.gridLayer.add(new Konva.Line({points:[o.x,12,o.x,this.height-12],stroke:'#c6c2b9',strokeWidth:1.2,listening:false}));
    this.gridLayer.add(new Konva.Text({x:this.width-25,y:o.y-19,text:'x',fontSize:15,fontStyle:'italic',fontFamily:'Georgia',fill:'#8e8b84',listening:false}));
    this.gridLayer.add(new Konva.Text({x:o.x+11,y:13,text:'y',fontSize:15,fontStyle:'italic',fontFamily:'Georgia',fill:'#8e8b84',listening:false}));
    this.gridLayer.draw();
  }

  private addPolygon(points: Point[], ghost=false): void {
    const flat = points.flatMap(p => { const s=this.screen(p);return [s.x,s.y]; });
    this.activeLayer.add(new Konva.Line({
      points: flat,closed:true,fill:ghost?'rgba(133,111,182,0.035)':'rgba(132,106,195,0.15)',
      stroke:ghost?'#c9bedf':'#7663af',strokeWidth:ghost?2:2.7,
      dash:ghost?[6,6]:undefined,listening:false,
    }));
    points.forEach((p,index)=>{
      const s=this.screen(p);
      this.activeLayer.add(new Konva.Circle({x:s.x,y:s.y,radius:ghost?7.5:11.5,
        fill:ghost?'#e7e0dd':COLORS[index],stroke:ghost?'#c9c4bc':'#fffaf0',strokeWidth:ghost?1.5:3,
        shadowColor:'#513e42',shadowBlur:ghost?0:6,shadowOpacity:.13,listening:false}));
      if(!ghost) this.activeLayer.add(new Konva.Text({
        x:s.x-5.5,y:s.y-7.5,text:['A','B','C'][index],fontSize:12,fontStyle:'bold',
        fontFamily:'Arial',fill:'#ffffff',listening:false,
      }));
    });
  }

  private drawTarget(): void {
    const corners = this.target.map(point => this.screen(point));
    this.activeLayer.add(new Konva.Line({
      points: corners.flatMap(({ x, y }) => [x, y]),
      closed: true, stroke: '#537568', strokeWidth: 2, dash: [5, 4],
      fill: 'rgba(83,117,104,.09)', listening: false,
    }));
    corners.forEach(({ x, y }, index) => {
      this.activeLayer.add(new Konva.Circle({
        x, y, radius: 13, stroke: COLORS[index], strokeWidth: 2, listening: false,
      }));
      this.activeLayer.add(new Konva.Text({
        x: x - 13, y: y - 6, width: 26, align: 'center', text: ['A', 'B', 'C'][index],
        fontSize: 12, fontStyle: 'bold', fill: '#415c52', listening: false,
      }));
    });
  }

  private renderActive(): void {
    this.activeLayer.destroyChildren();
    if (this.ghost) this.addPolygon(this.ghost,true);
    this.drawTarget();
    this.addPolygon(this.points);
    drawLatticeGesture(this.activeLayer,this.gestures.state,p=>this.screen(p),true);
    if (document.activeElement === this.host) this.activeLayer.add(new Konva.Circle({
      ...this.screen(this.gestures.state.cursor),radius:7,stroke:'#a46d32',strokeWidth:2,listening:false,
    }));
    this.activeLayer.batchDraw();
  }

  private readonly gestures = createLatticeGestures({
    yUp:true,
    clickTranslation:true,
    unit:()=>this.unit,
    translationNode:(p,end) => {
      const node=nearestLatticePoint(p,this.lattice);
      return end || distance(p,node)<=.46 ? node : undefined;
    },
    rotationCenter:p => {
      const point=nearestLatticePoint(p,this.lattice);
      return distance(p,point)<=.46 ? {point,count:this.lattice==='square'?4:6} : undefined;
    },
    axisAnchor:p => {
      const point = nearestLatticePoint(p,this.lattice);
      if (distance(p,point)>.46) return;
      const count=this.lattice==='square'?4:6;
      return {point,angles:Array.from({length:count},(_,i)=>i*2*Math.PI/count)};
    },
    chooseAxis:(point,angle)=>({point,angle:snappedAxisAngle(angle,this.lattice)}),
    glideAmount:(axis,_,end)=>{
      const d={x:Math.cos(axis.angle),y:Math.sin(axis.angle)};
      const step=distance(axis.point,nearestLatticePoint(add(axis.point,d),this.lattice)) || 1;
      return Math.round(axisComponent(sub(end,axis.point),axis.angle)/step)*step;
    },
    cursorStep:(p,x,y)=>add(p,latticePoint(x,-y,this.lattice)),
    commit:({tool,point,angle,amount})=>{
      if (tool==='translate') this.animate(tool,p=>add(p,point));
      else if (tool==='rotate') this.animate(tool,(p,t)=>rotateAbout(p,point,angle*t),true);
      else if (tool==='reflect') this.animate(tool,p=>reflectAcross(p,point,angle));
      else this.animate(tool,(p,t)=>glideFrame(point,angle,amount,t)(p),true);
      this.onHint(tool==='glide' ? 'Glided. The triangle flipped, then slid along the line.' : 'Move complete.');
    },
    hint:message=>this.onHint(message),
    changed:()=>this.renderActive(),
  });

  private pointer(phase: 'down'|'move'|'up') {
    const point=this.currentPointer();
    if (point && this.animationFrame===null) this.gestures[phase](point);
  }

  private readonly blur = () => this.renderActive();
  private readonly key = (event: KeyboardEvent) => {
    if (this.animationFrame===null) this.gestures.key(event);
  };

  private animate(tool: LatticeTool, transform: (point: Point, progress: number) => Point, followArc = false): void {
    this.generation++;
    if(this.animationFrame!==null) cancelAnimationFrame(this.animationFrame);
    const generation=this.generation;
    const source=this.points.map(p=>({...p}));
    const target=source.map(point => transform(point, 1));
    this.ghost=source;
    const start=performance.now();
    const tick=(now:number):void=>{
      if(generation!==this.generation) return;
      const t=Math.min(1,(now-start)/650);
      const progress = ease(t);
      this.gridMotion = t < 1
        ? point => followArc ? transform(point, progress) : lerp(point, transform(point, 1), progress)
        : null;
      this.points = source.map((point, i) => followArc ? transform(point, progress) : lerp(point, target[i], progress));
      this.gridLayer.batchDraw();
      this.renderActive();
      if(t<1) this.animationFrame=requestAnimationFrame(tick);
      else {
        this.animationFrame = null;
        this.points = target;
        this.renderActive();
        this.onPerformed(tool, this.lattice);
        if (matchesMotif(this.points, this.target)) {
          this.onMatched(this.lattice);
          this.onHint('Target matched! A, B, and C line up with their matching corners.');
        }
      }
    };
    this.animationFrame=requestAnimationFrame(tick);
  }
}
