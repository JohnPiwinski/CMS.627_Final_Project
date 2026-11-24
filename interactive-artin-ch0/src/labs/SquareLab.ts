import Konva from 'konva';
import { ease, rotateAbout, type Point } from '../lib/geometry';

const colors=['#e16b62','#3f84bf','#dfa949','#4da28f'];
const vertices:Point[]=[{x:-1,y:1},{x:1,y:1},{x:1,y:-1},{x:-1,y:-1}];

export class SquareLab {
  readonly stage:Konva.Stage;
  private readonly layer=new Konva.Layer({listening:false});
  private readonly observer:ResizeObserver;
  private width=700;
  private height=460;
  private radius=94;
  private angle=0;
  private previousAngle:number|null=null;
  private history:number[]=[];
  private raf:number|null=null;
  private generation=0;
  onRotate:()=>void=()=>{};
  onUndo:()=>void=()=>{};
  onHint:(message:string)=>void=()=>{};

  constructor(private readonly host:HTMLDivElement) {
    this.stage=new Konva.Stage({container:host,width:700,height:460});
    this.stage.add(this.layer);
    this.observer=new ResizeObserver(()=>this.resize());
    this.observer.observe(host);
    this.resize();
  }

  getTurnCount():number {return this.history.length;}
  canUndo():boolean {return this.history.length>0;}

  rotate(direction: 1 | -1 = 1):void {
    if(this.raf!==null) return;
    this.history.push(direction);
    this.animateTo(this.angle+direction*Math.PI/2);
    this.onRotate();
    this.onHint(`The square turned 90° ${direction === 1 ? 'counterclockwise' : 'clockwise'}. Its corners now occupy new positions.`);
  }

  undo():void {
    if(this.raf!==null) return;
    const direction = this.history.pop();
    if(direction === undefined) {this.onHint('Nothing to undo yet. Rotate first.');return;}
    this.animateTo(this.angle-direction*Math.PI/2);
    this.onUndo();
    this.onHint('Undo reversed the last transformation. Watch the corners return.');
  }

  reset():void {
    this.generation++;
    if(this.raf!==null) cancelAnimationFrame(this.raf);
    this.raf=null;
    this.angle=0;
    this.previousAngle=null;
    this.history=[];
    this.draw();
    this.onHint('Square reset. Make one quarter-turn, then undo it.');
  }
  destroy():void {
    this.generation++;
    if(this.raf!==null) cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.stage.destroy();
  }
  private resize():void {
    this.width=Math.max(this.host.clientWidth,240);
    this.height=Math.max(this.host.clientHeight,250);
    this.radius=Math.min(110, Math.max(64,Math.min(this.width,this.height)*.25));
    this.stage.size({width:this.width,height:this.height});
    this.draw();
  }
  private map(p:Point):Point {return {x:this.width/2+p.x*this.radius,y:this.height/2-p.y*this.radius};}
  private markerPoint(index:number,angle:number):Point {
    return this.map(rotateAbout(vertices[index],{x:0,y:0},angle));
  }
  private draw():void {
    this.layer.destroyChildren();
    const w=this.width,h=this.height,cx=w/2,cy=h/2;
    this.layer.add(new Konva.Rect({x:0,y:0,width:w,height:h,fill:'#faf7ef',listening:false}));
    for(let i=-12;i<=12;i++) {
      const offset=i*38;
      this.layer.add(new Konva.Line({points:[cx+offset,0,cx+offset,h],stroke:'#ebe5da',strokeWidth:1,listening:false}));
      this.layer.add(new Konva.Line({points:[0,cy+offset,w,cy+offset],stroke:'#ebe5da',strokeWidth:1,listening:false}));
    }
    this.layer.add(new Konva.Arrow({points:[16,cy,w-16,cy],stroke:'#a6a39f',fill:'#a6a39f',strokeWidth:1.2,pointerLength:7,pointerWidth:7,listening:false}));
    this.layer.add(new Konva.Arrow({points:[cx,h-15,cx,15],stroke:'#a6a39f',fill:'#a6a39f',strokeWidth:1.2,pointerLength:7,pointerWidth:7,listening:false}));
    this.layer.add(new Konva.Text({x:w-28,y:cy-26,text:'x',fontSize:16,fontStyle:'italic',fontFamily:'Georgia',fill:'#827b76',listening:false}));
    this.layer.add(new Konva.Text({x:cx+11,y:14,text:'y',fontSize:16,fontStyle:'italic',fontFamily:'Georgia',fill:'#827b76',listening:false}));
    if(this.previousAngle!==null) {
      for(let i=0;i<4;i++) {
        const p=this.markerPoint(i,this.previousAngle);
        this.layer.add(new Konva.Circle({x:p.x,y:p.y,radius:12,stroke:colors[i],strokeWidth:1.8,dash:[3,3],opacity:.34,listening:false}));
      }
    }
    const square=vertices.map((_, i)=>this.markerPoint(i,this.angle)).flatMap(p=>[p.x,p.y]);
    this.layer.add(new Konva.Line({points:square,closed:true,fill:'rgba(122,107,178,.16)',stroke:'#615c79',strokeWidth:2.8,listening:false}));
    vertices.forEach((_,i)=>{
      const p=this.markerPoint(i,this.angle);
      this.layer.add(new Konva.Circle({x:p.x,y:p.y,radius:13,fill:colors[i],stroke:'#fffbf3',strokeWidth:3,shadowColor:'#333',shadowBlur:4,shadowOpacity:.17,listening:false}));
      this.layer.add(new Konva.Text({x:p.x-6,y:p.y-7,text:['A','B','C','D'][i],fontFamily:'Arial',fontSize:12,fontStyle:'bold',fill:'#fff',listening:false}));
    });
    this.layer.batchDraw();
  }
  private animateTo(target:number):void {
    const from=this.angle,start=performance.now(),generation=++this.generation;
    this.previousAngle=from;
    const tick=(now:number):void=>{
      if(generation!==this.generation) return;
      const t=Math.min(1,(now-start)/750);
      this.angle=from+(target-from)*ease(t);
      this.draw();
      if(t<1) this.raf=requestAnimationFrame(tick);
      else {this.angle=target;this.previousAngle=null;this.raf=null;this.draw();}
    };
    this.raf=requestAnimationFrame(tick);
  }
}
