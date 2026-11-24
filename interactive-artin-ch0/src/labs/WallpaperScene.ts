import { add, distance, scale, type Point } from '../lib/geometry';
import { apply, basisVector, cellBounds, compose, dissection, features, fundamentalDomain, identity, inverseAffine, motifScale, motifSeed, placement, type Affine, type Wallpaper } from '../lib/wallpaper';

export type Display = { cell:boolean; domain:boolean; vectors:boolean; marks:boolean; centers:boolean; mirrors:boolean; glides:boolean; patch:boolean; diagram:boolean };
export const defaultDisplay = ():Display => ({cell:false,domain:false,vectors:false,marks:true,centers:false,mirrors:false,glides:false,patch:true,diagram:false});
const origin={x:0,y:0};
const corner=[origin,{x:1,y:0},{x:1,y:1},{x:0,y:1}];
type Variant = 'repeat'|'motif'|'lattice'|'restriction'|'domains'|'crystals'|'rose';
type Trial = { map:(t:number)=>Affine; matches:boolean; t:number; glyph:Affine };
export class WallpaperScene {
  readonly canvas = document.createElement('canvas');
  private readonly ctx = this.canvas.getContext('2d')!;
  private readonly resizeObserver: ResizeObserver;
  private w=640;
  private h=420;
  private zoom=135;
  private center:Point={x:.5,y:.35};
  private frame=0;
  private drag:{x:number;y:number;center:Point;moved:boolean}|null=null;
  private trial:Trial|null=null;
  private spec:Wallpaper;
  private markers=[{x:.22,y:.27},{x:.72,y:.48}];
  private annotations:ReturnType<typeof features>=[];
  private domain:Point[]=[];
  private glyphSize=.1;
  private seed:Point={x:.3,y:.4};
  variant:Variant='repeat';
  display=defaultDisplay();
  rank=2;
  range=6;
  layers=3;
  cut=.35;
  cutStep=0;
  prediction:Point|null=null;
  guide:{point:Point;angle:number;kind:string}|null=null;
  crystalAngle=.45;
  onPick:(p:Point)=>void=()=>{};
  onDrop:(start:Point,end:Point)=>void=()=>{};
  dragMode:'pan'|'vector'='pan';

  constructor(private readonly host:HTMLElement,spec:Wallpaper) {
    this.spec=spec;
    this.canvas.className='wallpaper-canvas';
    this.canvas.tabIndex=0;
    this.canvas.setAttribute('role','img');
    this.canvas.setAttribute('aria-label','Interactive pattern. Pan with arrow keys. Zoom with plus and minus. Controls provide numeric transformation parameters.');
    host.appendChild(this.canvas);
    this.load(spec);
    this.canvas.addEventListener('pointerdown',this.down);
    this.canvas.addEventListener('pointermove',this.move);
    this.canvas.addEventListener('pointerup',this.up);
    this.canvas.addEventListener('pointercancel',this.cancel);
    this.canvas.addEventListener('wheel',this.wheel,{passive:false});
    this.canvas.addEventListener('keydown',this.key);
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }
  load(spec:Wallpaper) {
    this.spec=spec;
    this.annotations=features(spec);
    this.domain=fundamentalDomain(spec);
    this.glyphSize=motifScale(spec);
    this.seed=motifSeed(spec);
    this.clearTrial();
  }
  private resize() {
    this.w=Math.max(this.host.clientWidth,120);
    this.h=Math.max(this.host.clientHeight,260);
    const ratio=Math.min(devicePixelRatio||1,2);
    this.canvas.width=Math.round(this.w*ratio);this.canvas.height=Math.round(this.h*ratio);
    this.ctx.setTransform(ratio,0,0,ratio,0,0);this.draw();
  }
  private screen(p:Point):Point {return {x:(p.x-this.center.x)*this.zoom+this.w/2,y:(this.center.y-p.y)*this.zoom+this.h/2};}
  private world(x:number,y:number):Point {return {x:this.center.x+(x-this.w/2)/this.zoom,y:this.center.y-(y-this.h/2)/this.zoom};}
  private local(e:PointerEvent|WheelEvent) {const r=this.canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  private readonly down=(e:PointerEvent)=>{if(e.button!==0)return;const p=this.local(e);this.drag={...p,center:this.center,moved:false};this.canvas.setPointerCapture(e.pointerId);};
  private readonly move=(e:PointerEvent)=>{
    if(!this.drag)return;const p=this.local(e),dx=p.x-this.drag.x,dy=p.y-this.drag.y;
    if(Math.hypot(dx,dy)>5)this.drag.moved=true;
    if(this.dragMode==='pan') {this.center=add(this.drag.center,{x:-dx/this.zoom,y:dy/this.zoom});this.rebase();}
    this.draw();
    if(this.dragMode==='vector'&&this.drag.moved)this.line([this.world(this.drag.x,this.drag.y),this.world(p.x,p.y)],'#86683c',2,[4,3]);
  };
  private readonly up=(e:PointerEvent)=>{
    if(!this.drag)return;const p=this.local(e), d=this.drag;this.drag=null;
    if(this.dragMode==='pan')this.rebase();
    if(!d.moved)this.onPick(this.world(p.x,p.y));
    else if(this.dragMode==='vector')this.onDrop(this.world(d.x,d.y),this.world(p.x,p.y));
    this.draw();
  };
  private readonly cancel=()=>{this.drag=null;this.draw();};
  private readonly wheel=(e:WheelEvent)=>{e.preventDefault();const p=this.local(e);this.zoomBy(Math.exp(-e.deltaY*.0012),p.x,p.y);};
  private readonly key=(e:KeyboardEvent)=>{
    const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
    if(e.key==='+'||e.key==='='){e.preventDefault();this.zoomBy(1.15);}
    else if(e.key==='-'){e.preventDefault();this.zoomBy(1/1.15);}
    else if(delta[e.key]){e.preventDefault();const [x,y]=delta[e.key];this.center=add(this.center,{x:x*.35,y:y*.35});this.rebase();this.draw();}
  };
  // Keep very long pans numerically stable by rebasing at a period far offscreen.
  private rebase() {
    if(this.variant!=='repeat'||this.drag||Math.hypot(this.center.x,this.center.y)<10000)return;
    const p=apply(inverseAffine(this.spec.basis),this.center);
    this.center=apply(this.spec.basis,{x:p.x%1,y:p.y%1});
  }
  zoomBy(factor:number,x=this.w/2,y=this.h/2) {
    const before=this.world(x,y);
    this.zoom=Math.max(55,Math.min(400,this.zoom*factor));
    const after=this.world(x,y);
    this.center=add(this.center,{x:before.x-after.x,y:before.y-after.y});this.draw();
  }
  resetCamera(){this.center={x:.5,y:.35};this.zoom=135;this.draw();}
  testPoint(point:Point,index=0){this.markers[index]=point;this.draw();}
  clearTrial(){cancelAnimationFrame(this.frame);this.frame=0;this.trial=null;this.draw();}
  play(map:(t:number)=>Affine,matches:boolean) {
    this.clearTrial();
    this.trial={map,matches,t:0,glyph:this.nearestGlyph()};
    const start=performance.now(),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tick=(now:number)=>{
      if(!this.trial)return;
      const t=reduced?1:Math.min(1,(now-start)/700);
      this.trial.t=t*t*(3-2*t);this.draw();
      if(t<1)this.frame=requestAnimationFrame(tick);
    };
    this.frame=requestAnimationFrame(tick);
  }
  private polygon(points:Point[],fill:string,stroke?:string,width=1) {
    if(!points.length)return;
    const c=this.ctx;
    c.beginPath();
    points.map(p=>this.screen(p)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.closePath();c.fillStyle=fill;c.fill();
    if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}
  }
  private line(points:Point[],color:string,width=1,dash:number[]=[]){
    const c=this.ctx;c.beginPath();points.map(p=>this.screen(p)).forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));
    c.lineWidth=width;c.strokeStyle=color;c.setLineDash(dash);c.stroke();c.setLineDash([]);
  }
  private disk(point:Point,r:number,color:string){
    const p=this.screen(point),c=this.ctx;c.beginPath();c.arc(p.x,p.y,r,0,2*Math.PI);c.fillStyle=color;c.fill();
  }
  private label(point:Point,text:string,color='#324e45'){
    const p=this.screen(point);this.ctx.font='bold 12px system-ui';this.ctx.fillStyle=color;this.ctx.fillText(text,p.x+5,p.y-6);
  }
  private glyph(g:Affine,highlight=false) {
    const p=apply(g,origin),s=this.screen(p),r=this.glyphSize*this.zoom;
    if(s.x<-2*r||s.y<-2*r||s.x>this.w+2*r||s.y>this.h+2*r)return;
    const point=(x:number,y:number)=>apply(g,{x,y});
    const body=[point(-.79,-.32),point(-.43,.65),point(.23,.24),point(.84,.29),point(.46,-.64),point(-.07,-.38)];
    this.polygon(body,highlight?'#d5a353':this.display.diagram?'#b3c6bc':'#4b7768',highlight?'#67472e':'#355b4d',highlight?2:1);
    this.disk(point(-.37,.16),Math.max(1.1,r*.12),'#f6d19c');
    this.disk(point(.37,-.23),Math.max(1.1,r*.09),'#e38c76');
    if(this.display.marks)this.line([point(-.03,.06),point(.50,.10),point(.35,.22)],'#fff2d5',1);
  }
  private placed(rep:Affine,i:number,j:number):Affine {
    const p=placement(this.spec,rep,i,j);
    // Vector artwork is Euclidean, even on a skew lattice. Only its anchor uses fractional coordinates.
    const {x,y}=apply(p,this.seed);
    const [a,b,c,d]=compose(p,inverseAffine(this.spec.basis));
    return [a*this.glyphSize,b*this.glyphSize,c*this.glyphSize,d*this.glyphSize,x,y];
  }
  private nearestGlyph():Affine {
    const fractional=apply(inverseAffine(this.spec.basis),this.center);
    const x=Math.floor(fractional.x),y=Math.floor(fractional.y);
    let closest=this.placed(identity,x,y), best=Infinity;
    for(let i=x-1;i<=x+1;i++)for(let j=y-1;j<=y+1;j++)for(const rep of this.spec.reps){
      const glyph=this.placed(rep,i,j),d=distance(apply(glyph,origin),this.center);
      if(d<best){closest=glyph;best=d;}
    }
    return closest;
  }
  private repeat(patch?:Affine) {
    const inverse=patch?inverseAffine(patch):identity;
    const screenCorners=[this.world(0,0),this.world(this.w,0),this.world(this.w,this.h),this.world(0,this.h)];
    const bounds=cellBounds(this.spec,screenCorners.map(p=>apply(inverse,p)));
    for(let i=bounds.minX;i<=bounds.maxX;i++)for(let j=bounds.minY;j<=bounds.maxY;j++)for(const rep of this.spec.reps) {
      const g=this.placed(rep,i,j);
      this.glyph(patch?compose(patch,g):g);
    }
  }
  private basisOverlay() {
    const u=basisVector(this.spec,0),v=basisVector(this.spec,1);
    if(this.display.cell)this.polygon(corner.map(p=>apply(this.spec.basis,p)),'#c2a76b33','#9c7243',2);
    if(this.display.domain)this.polygon(this.domain,'#e3bd5266','#8c6e32',2);
    if(this.display.vectors){
      this.line([origin,u],'#a5484c',3);this.label(u,'u','#8b3337');
      this.line([origin,v],'#383d85',3);this.label(v,'v','#383d85');
    }
  }
  private axis(point:Point,angle:number,label:string,color:string,dashed=false){
    const unit={x:Math.cos(angle),y:Math.sin(angle)};
    const span=Math.hypot(this.w,this.h)/this.zoom+distance(point,this.center);
    this.line([add(point,scale(unit,-span)),add(point,scale(unit,span))],color,1.5,dashed?[5,5]:[]);
    if(label)this.label(point,label,color);
  }
  private drawGuide() {
    if(!this.guide)return;
    const {kind,point,angle}=this.guide;
    if(kind==='reflect'||kind==='glide')this.axis(point,angle,'Proposed axis','#517c99',true);
    if(kind==='rotate'){this.disk(point,4,'#517c99');this.label(point,'Turn center');}
  }
  private drawAnnotations() {
    if (!this.display.centers && !this.display.mirrors && !this.display.glides) return;
    const lower=this.world(0,this.h), upper=this.world(this.w,0);
    const {minX,maxX,minY,maxY}=cellBounds(this.spec,[lower,{x:lower.x,y:upper.y},upper,{x:upper.x,y:lower.y}]);
    const inverse=inverseAffine(this.spec.basis);
    const turns=new Map<string,{point:Point;order:number}>();
    for(const item of this.annotations) if(item.kind==='turn'){
      const p=apply(inverse,item.point);
      if(p.x < -1e-7 || p.x >= 1-1e-7 || p.y < -1e-7 || p.y >= 1-1e-7)continue;
      const key=`${p.x.toFixed(6)},${p.y.toFixed(6)}`;
      if(item.order>(turns.get(key)?.order??0))turns.set(key,item);
    }
    if(this.display.centers)for(const {point,order} of turns.values()) {
      for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){
        const at=add(point,apply(this.spec.basis,{x:i,y:j}));
        if(at.x<lower.x||at.x>upper.x||at.y<lower.y||at.y>upper.y)continue;
        this.disk(at,4,'#8b4d2d');this.label(at,String(order),'#7e4129');
      }
    }
    if(this.display.mirrors||this.display.glides){
      const lines=new Set<string>();
      // Transport mirror and glide axes by the lattice. Parallel duplicates share a height.
      for(const item of this.annotations) {
        if(item.kind==='turn'||(item.kind==='mirror'?!this.display.mirrors:!this.display.glides)) continue;
        const n={x:-Math.sin(item.angle),y:Math.cos(item.angle)};
        const dot=(p:Point)=>p.x*n.x+p.y*n.y;
        const heights=[lower,upper,{x:lower.x,y:upper.y},{x:upper.x,y:lower.y}].map(dot);
        for(let i=minX;i<=maxX;i++)for(let j=minY;j<=maxY;j++){
          const h=dot(add(item.point,apply(this.spec.basis,{x:i,y:j})));
          if(h<Math.min(...heights)||h>Math.max(...heights))continue;
          const key=`${item.kind}/${item.angle.toFixed(5)}/${h.toFixed(5)}`;
          if(lines.has(key))continue;
          lines.add(key);
          this.axis(scale(n,h),item.angle,'',item.kind==='mirror'?'#517c99':'#956c9e',item.kind==='glide');
        }
      }
    }
  }
  private drawLattice(map=identity,color='#638575'){
    const n=this.range;
    for(let i=this.rank>=1?-n:0;i<=(this.rank>=1?n:0);i++)for(let j=this.rank===2?-n:0;j<=(this.rank===2?n:0);j++)
      this.disk(apply(map,apply(this.spec.basis,{x:i,y:j})),3,color);
  }
  draw(){
    const c=this.ctx;c.clearRect(0,0,this.w,this.h);c.fillStyle='#faf7ef';c.fillRect(0,0,this.w,this.h);
    const transform=this.trial?.map(this.trial.t)??identity;
    if(this.variant==='repeat'){
      this.repeat();
      if(this.trial&&this.display.patch&&this.trial.t>.08){
        // Only draw the complete image at an invertible final pose.
        if(this.trial.t===1){c.globalAlpha=.31;this.repeat(transform);c.globalAlpha=1;}
      }
      if(this.trial)this.glyph(compose(transform,this.trial.glyph),true);
      this.basisOverlay();
      this.drawAnnotations();
      if(!this.trial)this.drawGuide();
    } else if(this.variant==='motif'){
      c.globalAlpha=.28;
      this.glyph([.47,0,0,.47,.55,.35]);
      c.globalAlpha=1;
      this.glyph(compose(transform,[.47,0,0,.47,.55,.35]),true);
      const points=this.markers.map(p=>apply(transform,p));
      this.line(points,'#876b3b',2);
      points.forEach((p,i)=>{this.disk(p,5,i?'#407d96':'#9e5049');this.label(p,i?'B':'A');});
      if(this.prediction){this.disk(this.prediction,5,'#8865a1');this.label(this.prediction,'Prediction');}
      if(this.guide){
        this.drawGuide();
      }
    } else if(this.variant==='rose'){
      const n=8;
      for(let i=0;i<n;i++){
        const a=i*2*Math.PI/n,cos=Math.cos(a),sin=Math.sin(a);
        const petal:Affine=[cos,-sin,sin,cos,0,0];
        const points=[{x:.15,y:0},{x:.73,y:.19},{x:1.03,y:0},{x:.73,y:-.19}].map(p=>apply(petal,p));
        this.polygon(points,'#477c73','#315c55',2);
        this.polygon(points.map(p=>apply(transform,p)),'#d5a35350','#926438',1);
      }
      this.disk(origin,8,'#b98449');
    } else if(this.variant==='lattice'||this.variant==='restriction'){
      this.drawLattice();
      if(this.trial)this.drawLattice(transform,'#b15f56');
      this.basisOverlay();
    } else if(this.variant==='domains'){
      const {left,remainder,shift}=dissection(this.cut);
      const t=this.cutStep;
      for(let i=-5;i<=5;i++)for(let j=-4;j<=4;j++){
        const offset={x:i,y:j};
        this.polygon(remainder.map(p=>add(p,offset)),i===0&&j===0?'#acd2ba':'#bbd7c7','#688b78');
        this.polygon(left.map(p=>add(add(p,offset),scale(shift,t))),i===0&&j===0?'#e4b67d':'#e9c899','#b08757');
      }
      this.polygon(corner,'#0000','#856344',2);
    } else {
      const cos=Math.cos(this.crystalAngle),sin=Math.sin(this.crystalAngle);
      const flatten=(x:number,y:number,z:number)=>({x:.43*((x-2)*cos-(y-1.5)*sin)+.5,
        y:.22*((x-2)*sin+(y-1.5)*cos)+.36*(z-(this.layers-1)/2)+.35});
      for(let z=0;z<this.layers;z++)for(let x=0;x<5;x++)for(let y=0;y<4;y++){
        const p=flatten(x,y,z);this.disk(p,7,z%2?'#779d95':'#b98449');this.disk(add(p,{x:.12,y:.07}),3,'#a35c61');
      }
      if(this.display.cell){
        for(let z=0;z<=1;z++){
          const face=corner.map(p=>flatten(p.x,p.y,z));
          this.line([...face,face[0]],'#526e80',2);
          if(z===0)for(const p of corner)this.line([flatten(p.x,p.y,0),flatten(p.x,p.y,1)],'#526e80',2);
        }
      }
      if(this.display.vectors)for(const [i,[x,y,z]] of [[1,0,0],[0,1,0],[0,0,1]].entries()){
        const p=flatten(x,y,z);this.line([flatten(0,0,0),p],'#8b4d2d',2);this.label(p,['u','v','w'][i]);
      }
    }
  }
  destroy() {cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.canvas.remove();}
}
