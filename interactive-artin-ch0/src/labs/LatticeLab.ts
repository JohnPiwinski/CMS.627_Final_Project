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
  private translationFrom: Point | null = null;
  private rotationCenter: Point | null = null;
  private rotationDrag: { previous: number; travel: number } | null = null;
  private reflectionAnchor: Point | null = null;
  private dragging = false;
  private previewAngle = 0;
  private cursor: Point | null = null;
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
    this.stage.on('pointerdown', () => this.pointerDown());
    this.stage.on('pointermove', () => this.pointerMove());
    this.stage.on('pointerup', () => this.pointerUp());
    const cancelGesture = () => {
      this.rotationDrag = null;
      this.cancelReflection();
    };
    this.stage.on('pointerleave pointercancel', cancelGesture);
    this.resize();
  }

  setTool(tool: LatticeTool): void {
    this.tool = tool;
    this.translationFrom = null;
    this.rotationCenter = null;
    this.rotationDrag = null;
    this.cancelReflection();
    this.renderActive();
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
    this.translationFrom = null;
    this.rotationCenter = null;
    this.rotationDrag = null;
    this.reflectionAnchor = null;
    this.dragging = false;
    this.previewAngle = 0;
    this.cursor = null;
    this.renderActive();
    this.onHint(this.instructions());
  }

  destroy(): void {
    this.generation++;
    if (this.animationFrame !== null) cancelAnimationFrame(this.animationFrame);
    this.observer.disconnect();
    this.stage.destroy();
  }

  private instructions(): string {
    if (this.tool === 'translate') return 'Drag between lattice dots, or click two dots, to move the marked triangle.';
    if (this.tool === 'rotate') return 'Click a lattice dot to open the rotation dial. Drag around it in either direction, then release.';
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

  private get rotationSegments(): number {
    return this.lattice === 'square' ? 4 : 6;
  }

  private get rotationSteps(): number {
    return Math.sign(this.rotationDrag?.travel ?? 0) *
      Math.round(Math.abs(this.rotationDrag?.travel ?? 0) * this.rotationSegments / (2 * Math.PI));
  }

  private drawRotationDial(center: Point): void {
    const a = this.screen(center);
    const count = this.rotationSegments;
    const steps = this.rotationSteps;
    const selected = ((steps % count) + count) % count;
    this.activeLayer.add(new Konva.Circle({ ...a, radius: 52, fill: 'rgba(250,247,239,.92)', listening: false }));
    for (let i = 0; i < count; i++) {
      this.activeLayer.add(new Konva.Wedge({
        ...a, radius: 52, angle: 360 / count, rotation: -(i + .5) * 360 / count,
        fill: i === selected ? 'rgba(118,99,175,.28)' : 'rgba(118,99,175,.06)',
        stroke: '#7663af', strokeWidth: 1, listening: false,
      }));
    }
    const angle = steps * 2 * Math.PI / count;
    this.activeLayer.add(new Konva.Arrow({
      points: [a.x, a.y, a.x + 45 * Math.cos(angle), a.y - 45 * Math.sin(angle)],
      stroke: '#59428e', fill: '#59428e', strokeWidth: 2, pointerLength: 7, pointerWidth: 7, listening: false,
    }));
    this.activeLayer.add(new Konva.Text({
      x: a.x - 30, y: a.y + 55, width: 60, align: 'center',
      text: `${steps > 0 ? '+' : ''}${steps * 360 / count}°`, fill: '#59428e', fontSize: 14, listening: false,
    }));
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
    if (this.translationFrom) {
      const a=this.screen(this.translationFrom);
      this.activeLayer.add(new Konva.Circle({x:a.x,y:a.y,radius:15,stroke:'#bf9149',strokeWidth:2,dash:[5,3],listening:false}));
      if(this.cursor) {
        const c=this.screen(this.cursor);
        this.activeLayer.add(new Konva.Arrow({points:[a.x,a.y,c.x,c.y],stroke:'#b58b4d',fill:'#b58b4d',strokeWidth:1.7,pointerLength:7,pointerWidth:7,dash:[5,5],listening:false}));
      }
    }
    if (this.rotationCenter) this.drawRotationDial(this.rotationCenter);
    if (this.reflectionAnchor && this.dragging) {
      const a=this.screen(this.reflectionAnchor);
      const count=this.lattice==='square'?4:6;
      for(let i=0;i<count;i++) {
        const centerAngle=i*2*Math.PI/count;
        this.activeLayer.add(new Konva.Wedge({x:a.x,y:a.y,radius:51,
          angle:360/count,rotation:-centerAngle*180/Math.PI-180/count,
          fill: Math.abs(Math.sin((centerAngle-this.previewAngle)/2))<.005?'rgba(200,163,94,.25)':'rgba(110,127,174,.075)',
          stroke:'#b8b6bc',strokeWidth:.8,listening:false}));
      }
      const e=scale({x:Math.cos(this.previewAngle),y:Math.sin(this.previewAngle)},1200);
      const p=this.screen(add(this.reflectionAnchor,e));
      const q=this.screen(sub(this.reflectionAnchor,e));
      this.activeLayer.add(new Konva.Line({points:[p.x,p.y,q.x,q.y],stroke:'#ad7b36',strokeWidth:2.5,dash:[10,7],listening:false}));
      this.activeLayer.add(new Konva.Circle({x:a.x,y:a.y,radius:5.5,fill:'#a46d32',listening:false}));
    }
    this.activeLayer.batchDraw();
  }

  private pointerDown(): void {
    if (this.animationFrame !== null) return;
    const p=this.currentPointer(); if(!p) return;
    if (this.tool === 'rotate' && this.rotationCenter) {
      const delta = sub(p, this.rotationCenter);
      const radius = distance(p, this.rotationCenter) * this.unit;
      if (radius >= 8 && radius <= 62) {
        this.rotationDrag = { previous: Math.atan2(delta.y, delta.x), travel: 0 };
        return;
      }
    }
    const anchor=nearestLatticePoint(p,this.lattice);
    if(distance(p,anchor) > 0.46) {
      this.onHint('Start close to one of the lattice dots.'); return;
    }
    if(this.tool==='translate') {
      this.cursor = anchor;
      if (this.translationFrom) this.finishTranslation(anchor);
      else {
        this.translationFrom = anchor;
        this.onHint('Drag to a destination dot, or click it.');
      }
    } else if(this.tool==='rotate') {
      this.rotationCenter = anchor;
      this.rotationDrag = { previous: 0, travel: 0 };
      this.onHint('Drag around the dial. Positive angles turn counterclockwise.');
    } else {
      this.reflectionAnchor=anchor;
      this.dragging=true;
      this.previewAngle=0;
      this.onHint('Drag outward to select a mirror line. Opposite directions count as the same line.');
    }
    this.renderActive();
  }

  private pointerMove(): void {
    const p=this.currentPointer(); if(!p) return;
    this.cursor = nearestLatticePoint(p, this.lattice);
    if (this.rotationCenter && this.rotationDrag && distance(p, this.rotationCenter) * this.unit >= 8) {
      const delta = sub(p, this.rotationCenter);
      const angle = Math.atan2(delta.y, delta.x);
      const change = angle - this.rotationDrag.previous;
      this.rotationDrag.travel += Math.atan2(Math.sin(change), Math.cos(change));
      this.rotationDrag.previous = angle;
      this.renderActive();
    }
    if(this.dragging && this.reflectionAnchor) {
      const delta=sub(p,this.reflectionAnchor);
      if(distance(delta,{x:0,y:0}) > .15) this.previewAngle=snappedAxisAngle(Math.atan2(delta.y,delta.x),this.lattice);
    }
    if(this.dragging || this.translationFrom) this.renderActive();
  }

  private finishTranslation(target: Point): void {
    if (!this.translationFrom) return;
    const delta = sub(target, this.translationFrom);
    if (distance(delta, { x: 0, y: 0 }) < .01) return;
    this.translationFrom = null;
    this.animate(p => add(p, delta));
    this.onPerformed('translate', this.lattice);
    this.onHint('Translation complete. Every point moved by the same vector.');
  }

  private pointerUp(): void {
    const pointer = this.currentPointer();
    if (this.translationFrom && pointer) {
      this.finishTranslation(nearestLatticePoint(pointer, this.lattice));
    }
    if (this.rotationCenter && this.rotationDrag) {
      this.pointerMove();
      const steps = this.rotationSteps;
      const center = this.rotationCenter;
      this.rotationDrag = null;
      if (steps !== 0) {
        const degrees = steps * 360 / this.rotationSegments;
        const angle = degrees * Math.PI / 180;
        this.rotationCenter = null;
        this.animate((point, progress) => rotateAbout(point, center, angle * progress), true);
        this.onPerformed('rotate', this.lattice);
        this.onHint(`Rotated ${Math.abs(degrees)}° ${degrees > 0 ? 'counterclockwise' : 'clockwise'} around your chosen center.`);
      }
      this.renderActive();
    }
    if(!this.dragging || !this.reflectionAnchor) return;
    const p=this.currentPointer();
    if(!p || distance(p,this.reflectionAnchor)<.48) {
      this.cancelReflection();
      this.onHint('Reflection cancelled. Drag farther out from the selected dot.');
      return;
    }
    const anchor=this.reflectionAnchor;
    const angle=this.previewAngle;
    this.reflectionAnchor=null;
    this.dragging=false;
    this.animate(point=>reflectAcross(point,anchor,angle));
    this.onPerformed('reflect',this.lattice);
    this.onHint('Reflected. The grid and the triangle flipped across the same mirror line.');
  }

  private cancelReflection(): void {
    this.reflectionAnchor=null;
    this.dragging=false;
    this.renderActive();
  }

  private animate(transform: (point: Point, progress: number) => Point, followArc = false): void {
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
        if (matchesMotif(this.points, this.target)) {
          this.onMatched(this.lattice);
          this.onHint('Target matched! A, B, and C line up with their matching corners.');
        }
      }
    };
    this.animationFrame=requestAnimationFrame(tick);
  }
}
