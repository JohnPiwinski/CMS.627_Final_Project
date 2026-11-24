import content from '../content/wallpaper.md?raw';
import assetData from '../content/wallpaper-assets.json';
import { distance, sub, type Point } from '../lib/geometry';
import { apply, bases, basisVector, compose, describeIsometry, features, identity, inverseAffine, motion, placement, preserves, motifSeed, toWorld, wallpapers, type Affine, type Wallpaper } from '../lib/wallpaper';
import { Narrator, parseScenes, recall, refreshControls, remember, transcripts } from '../lib/chapterContent';
import { WallpaperScene, defaultDisplay, type Display } from './WallpaperScene';

type Asset = { changes?: string; id:string; group:string; path:string; source:string; author:string; license:string; licenseUrl:string; note:string; label:string };
const assets=assetData as {photos:Asset[];diagrams:Asset[]};
const scenes=parseScenes(content);
const exactCases=['p1','pm','pg','p2','pmm','pmg','pgg','cmm','cm','p4','p4m','p4g','p3','p3m1','p31m','p6','p6m'];
const basicOptions=['p1','p2','pm','pg'];
const regionalOptions=[['pmm','pmg','pgg','cmm','cm'],['p4','p4m','p4g'],['p3','p3m1','p31m'],['p6','p6m']];
const choices=(index:number)=>index<4?basicOptions:regionalOptions[index<9?0:index<12?1:index<15?2:3];
const storage='iaa-wallpaper-workshop';
const lookup=(id:string)=>wallpapers.find(spec=>spec.id===id)??wallpapers[0];
const origin={x:0,y:0};
const rad=(a:number)=>a*Math.PI/180;
const format=(n:number)=>String(Math.round(n*1000)/1000);
const displayOptions: [keyof Display,string][]=[['cell','Period cell'],['domain','Fundamental domain'],['vectors','Lattice vectors'],['marks','Orientation marks'],['centers','Turn centers'],['mirrors','Mirror axes'],['glides','Glide axes'],['patch','Compare moved pattern'],['diagram','Diagram colors']];
type Parameters={kind:string;x:number;y:number;angle:number;amount:number};
type MoveTest={map:(t:number)=>Affine;matches:boolean;note:string};
const initialParams=():Parameters=>({kind:'translate',x:1,y:0,angle:90,amount:.5});

function thumbnail(spec:Wallpaper):string {
  const shapes:string[]=[];
  const seed=motifSeed(spec);
  for(let i=-1;i<=3;i++)for(let j=-1;j<=3;j++)for(const rep of spec.reps) {
    const p=placement(spec,rep,i,j);
    const a=apply(p,seed),b=apply(p,{x:seed.x+.11,y:seed.y+.025}),c=apply(p,{x:seed.x+.02,y:seed.y+.085});
    shapes.push(`<path d="M ${a.x},${-a.y} L ${b.x},${-b.y} ${c.x},${-c.y} Z" fill="#537e6b" stroke="#9b723f" stroke-width=".013"/>`);
  }
  return `<svg viewBox="0 -1.3 2.5 1.3" aria-hidden="true"><rect y="-1.3" width="2.5" height="1.3" fill="#f0eadb"/>${shapes.join('')}</svg>`;
}
function credit(asset:Asset):string {
  return `<details class="orbit-details"><summary>Source and credit</summary><p>${asset.author}. <a href="${asset.source}" target="_blank" rel="noopener">Original file</a> · <a href="${asset.licenseUrl}" target="_blank" rel="noopener">${asset.license}</a>.</p><p>${asset.note} ${asset.changes??''}</p></details>`;
}

export class WallpaperLab {
  private data=recall(storage,{scene:0,group:'p1',caseIndex:0,solved:[] as string[],visited:[0]});
  private readonly voice=new Narrator();
  private readonly viewer:WallpaperScene;
  private comparisonViews: WallpaperScene[] = [];
  private readonly controls:HTMLElement;
  private readonly stage:HTMLElement;
  private readonly status:HTMLElement;
  private params=initialParams();
  private tests:MoveTest[]=[];
  private display=defaultDisplay();
  private reveal=false;
  private comparison='';
  private filter='';
  private study=false;
  private rank=2;
  private lattice: keyof typeof bases='square';
  private skew=0;
  private height=1;
  private width=1;
  private range=4;
  private layers=3;
  private cut=.35;
  private cutStep=0;
  private frame=0;
  private photo=-1;
  private photoGuess='';
  private customPeriods=false;
  private rose=false;
  private point:Point={x:.22,y:.27};
  private secondPoint:Point={x:.72,y:.48};
  private selecting='pan';
  private prediction:Point|null=null;
  constructor(private root:HTMLElement) {
    root.innerHTML=`<nav class="orbit-steps chapter-scenes" aria-label="Wallpaper activities">${scenes.map((s,i)=>`<button class="secondary-button" data-action="scene" data-value="${i}">${s.title}</button>`).join('')}</nav>
      <div class="content-grid orbit-workspace wallpaper-layout"><section class="workspace"><div class="workspace-top"><b id="wall-title"></b><div class="orbit-buttons">
      <button class="secondary-button" data-action="zoom" data-value="-1" aria-label="Zoom out">−</button><button class="secondary-button" data-action="zoom" data-value="1" aria-label="Zoom in">+</button></div></div>
      <div class="visual-host" id="wall-stage"></div><div class="workspace-bottom"><span class="workspace-hint" id="wall-status" role="status"></span><button class="quiet-button" data-action="home">Reset view</button></div></section>
      <aside class="control-panel" id="wall-controls"></aside></div><section class="narration-panel wallpaper-notes" id="wall-notes"></section>`;
    this.stage=root.querySelector('#wall-stage')!;
    this.controls=root.querySelector('#wall-controls')!;
    this.status=root.querySelector('#wall-status')!;
    this.viewer=new WallpaperScene(this.stage,this.spec());
    this.viewer.onPick=p=>{
      if(this.selecting==='point') {this.point=p;this.viewer.testPoint(p);this.message('Point A moved to the selected location.');}
      else if(this.selecting==='second'){this.secondPoint=p;this.viewer.testPoint(p,1);this.message('Point B moved to the selected location.');}
      else if(this.selecting==='predict'){this.prediction=p;this.viewer.prediction=p;this.message('Prediction marked. Test a motion to compare.');}
      else if(this.selecting==='center'&&this.params.kind!=='translate'){
        const point=this.snapProposal(p);
        this.params.x=point.x;this.params.y=point.y;this.renderControls();this.guide();
      }
    };
    this.viewer.onDrop=(a,b)=>{
      const delta=sub(b,a);
      if (this.id==='lattice' && (this.selecting==='u'||this.selecting==='v')){
        if(this.selecting==='u') this.width=Math.min(3,Math.max(.25,Math.abs(delta.x)));
        else if(Math.abs(delta.y)<.25){this.message('Give the second vector a vertical component so the two directions stay independent.');return;}
        else {const sign=delta.y<0?-1:1;this.skew=Math.max(-2,Math.min(2,delta.x*sign));this.height=Math.min(3,Math.abs(delta.y));}
        this.lattice='oblique';this.viewer.load(this.spec());this.renderControls();this.guide();
        this.message('The grid now repeats along your adjusted vectors.');
        return;
      }
      if (this.params.kind==='translate'){const shift=this.snapProposal(delta);this.params.x=shift.x;this.params.y=shift.y;}
      else {const center=this.snapProposal(a);this.params.x=center.x;this.params.y=center.y;this.params.angle=Math.round(Math.atan2(delta.y,delta.x)*180/Math.PI);if(this.params.kind==='glide')this.params.amount=Number(format(distance(a,b)));}
      this.renderControls();this.guide();
    };
    root.addEventListener('click',this.click);
    root.addEventListener('change',this.change);
    root.addEventListener('input',this.updateMotionInput);
    this.enter();
  }
  private get id(){return scenes[this.data.scene].id;}
  private get challenge(){return this.id==='detective'&&this.photo<0;}
  private get repeating(){return ['infinite','gallery','detective'].includes(this.id)||this.id==='art'&&!this.rose;}
  private spec():Wallpaper {
    if(this.id==='detective')return lookup(this.photo>=0?assets.photos[this.photo]?.group??'p1':exactCases[this.data.caseIndex]);
    if(this.id==='art')return lookup(assets.photos[Math.max(0,this.photo)]?.group??'p4m');
    if(this.id==='lattice'||this.id==='restriction'||this.id==='infinite'&&this.customPeriods&&this.data.group==='p1'){
      const base=lookup('p1'), basis:Affine=[this.width,this.skew,0,this.height,0,0];
      return {...base,basis,lattice:this.lattice};
    }
    return lookup(this.data.group);
  }
  private snapProposal(point:Point):Point {
    if(!this.repeating)return {x:Number(format(point.x)),y:Number(format(point.y))};
    const basis=this.spec().basis;
    const fractional=apply(inverseAffine(basis),point);
    // Try common subdivisions of a period without selecting a known symmetry for the student.
    for(const divisor of [1,2,3,4,6,12]){
      const candidate=apply(basis,{x:Math.round(fractional.x*divisor)/divisor,
        y:Math.round(fractional.y*divisor)/divisor});
      if(distance(candidate,point)<.035)return candidate;
    }
    return {x:Number(format(point.x)),y:Number(format(point.y))};
  }
  private message(text:string){this.status.textContent=text;}
  private enter() {
    const scene=scenes[this.data.scene];
    const title=this.root.querySelector('#wall-title')!;
    title.textContent=scene.title;
    this.root.querySelectorAll<HTMLButtonElement>('button[data-action="scene"]').forEach(b=>{
      if(Number(b.dataset.value)===this.data.scene)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');
    });
    this.viewer.variant=this.id==='motions'||this.id==='fixed'?'motif':this.id==='art'&&this.rose?'rose':
      this.id==='lattice'?'lattice':this.id==='restriction'?'restriction':this.id==='domains'?'domains':
      this.id==='crystals'?'crystals':'repeat';
    this.viewer.load(this.spec());
    this.viewer.rank=this.rank;
    this.viewer.range=this.range;
    this.viewer.layers=this.layers;
    this.viewer.cut=this.cut;
    this.viewer.cutStep=this.cutStep;
    this.viewer.display={...this.display};
    if(this.id==='lattice')this.viewer.display={...this.viewer.display,cell:this.rank===2,vectors:this.rank===2};
    if(this.challenge&&!this.reveal)this.viewer.display={...defaultDisplay()};
    this.guide();
    this.renderControls();
    this.renderNotes();
    this.renderCompare();
    this.message(scene.slide);
    this.persist();
  }
  private persist(){remember(storage,this.data);}
  private button(action:string,label:string,value?:string|number) {
    return `<button type="button" class="secondary-button" data-action="${action}" ${value===undefined?'':`data-value="${value}"`}>${label}</button>`;
  }
  private select(label:string,field:string,items:[string,string][],current:string){
    return `<label>${label}<select class="solid-picker" data-field="${field}">${items.map(([value,name])=>`<option value="${value}" ${current===value?'selected':''}>${name}</option>`).join('')}</select></label>`;
  }
  private number(label:string,field:string,value:number,min=-20,max=20,step=.05){
    return `<label>${label}<input type="number" data-field="${field}" value="${value}" min="${min}" max="${max}" step="${step}"></label>`;
  }
  private renderControls(){
    const {kind,x,y,angle,amount}=this.params;
    const painter=this.id==='art'||this.id==='motions'||this.id==='fixed'||this.repeating;
    const spec=this.spec();
    const displays=this.id==='crystals'?displayOptions.slice(0,3).filter(([id])=>id!=='domain'):displayOptions;
    const candidateOptions=this.reveal&&this.repeating?features(spec).filter(f=>f.point.x>=-.01&&f.point.x<=1&&f.point.y>=-.01&&f.point.y<=1).slice(0,42):[];
    refreshControls(this.controls,`
      ${(this.id==='infinite'||this.id==='gallery'&&!this.study)?this.select('Pattern','group',wallpapers.map(w=>[w.id,w.id]),this.data.group):''}
      ${this.id==='infinite'?`<div class="orbit-buttons">${[['p1','Translations'],['pm','Mirrors'],['pg','Glides'],['p2','Half-turns'],['p4','Quarter-turns'],['p3','Third-turns'],['p6','Sixth-turns']].map(([value,label])=>this.button('group',label,value)).join('')}</div>
      ${this.data.group==='p1'?`<details class="orbit-details"><summary>Customize translation vectors</summary><label><input type="checkbox" data-field="custom-periods" ${this.customPeriods?'checked':''}> Use my own periods</label>
      ${this.customPeriods?`<div class="wall-fields">${this.number('u horizontal','width',this.width,.25,3)}${this.number('v horizontal','skew',this.skew,-2,2)}${this.number('v vertical','height',this.height,.25,3)}</div>`:''}</details>`:''}`:''}
      ${this.id==='art'?`<div class="orbit-buttons">${this.button('art-mode',this.rose?'Compare an ornament':'Try an eight-petal rose')}</div>`:''}
      ${this.id==='detective'?`<div class="orbit-buttons">${this.button('next-case','Next exact case')}${assets.photos.length?this.button('photo',this.photo<0?'Real-world examples':'Next real-world example'):''}</div><p>${this.photo<0?`Case ${this.data.caseIndex+1} of ${exactCases.length} · ${this.data.solved.length} solved`:'Photo study · approximate evidence'}</p>`:''}
      ${painter?`<div class="mini-label">TEST A MOTION</div>
        ${this.select('Motion','kind',[['translate','Translate'],['rotate','Rotate'],['reflect','Reflect'],['glide','Glide reflect']],kind)}
        <div class="wall-fields">${this.number(kind==='translate'?'Horizontal move':'Center / axis x','x',x)}
        ${this.number(kind==='translate'?'Vertical move':'Center / axis y','y',y)}
        ${kind!=='translate'?this.number(kind==='rotate'?'Turn (degrees)':'Axis (degrees)','angle',angle,-720,720,1):''}
        ${kind==='glide'?this.number('Slide along axis','amount',amount):''}</div>
        ${this.select('Canvas gesture','gesture',[['pan','Pan view'],['center','Pick center or point on axis'],['vector','Drag translation vector or axis'],...(this.viewer.variant==='motif'?[['point','Place point A'],['second','Place point B'],['predict','Mark a prediction']] as [string,string][]:[])],this.selecting)}
        ${this.repeating?`<div class="orbit-buttons">${this.button('basis','Use period u',0)}${this.button('basis','Use period v',1)}</div>`:''}
        <div class="orbit-buttons">${this.button('test','Test motion')}${this.button('repeat','Replay')}${this.button('undo','Undo')}</div>`:''}
      ${this.id==='lattice'||this.id==='restriction'?`
        ${this.select('Lattice','lattice',(this.id==='restriction'?['square','triangular']:Object.keys(bases)).map(name=>[name,name]),this.lattice)}
        ${this.id==='lattice'?`${this.select('Repeat directions','rank',[['0','None'],['1','One direction'],['2','Two directions']],String(this.rank))}
        <div class="wall-fields">${this.number('u horizontal','width',this.width,.25,3)}${this.number('v horizontal','skew',this.skew,-2,2)}
        ${this.number('v vertical','height',this.height,.25,3)}${this.number('Coefficient range ±','range',this.range,1,12,1)}</div>
        ${this.select('Canvas gesture','gesture',[['pan','Pan view'],['u','Drag first vector'],['v','Drag second vector']],this.selecting)}
        <p>Copies at m·u + n·v, for integers m and n in the chosen range.</p>`:
        `<div class="orbit-buttons">${[180,120,90,72,60].map(a=>this.button('angle',`${a}°`,a)).join('')}</div><div class="orbit-buttons">${this.button('repeat','Replay')}${this.button('undo','Undo')}</div>`}`:''}
      ${this.id==='domains'?`<div class="wall-fields">${this.number('Cut width','cut',this.cut,.1,.9,.05)}</div><div class="orbit-buttons">${this.button('cut','Slide the triangle')}${this.button('uncut','Restore cell')}</div>`:''}
      ${this.id==='crystals'?`<p>Ideal toy arrangement</p><div class="wall-fields">${this.number('Layers','layers',this.layers,1,6,1)}${this.number('View angle','crystal-angle',Math.round(this.viewer.crystalAngle*180/Math.PI),-180,180,1)}</div>`:''}
      ${this.repeating&&(!this.challenge||this.reveal)?`<details class="orbit-details" ${this.reveal?'open':''}><summary>Pattern overlays</summary>
        <div class="wall-toggles">${displays.map(([id,label])=>`<label><input type="checkbox" data-display="${id}" ${this.display[id]?'checked':''}>${label}</label>`).join('')}</div></details>`:''}
      ${this.id==='crystals'?`<div class="wall-toggles">${displays.map(([id,label])=>`<label><input type="checkbox" data-display="${id}" ${this.display[id]?'checked':''}>${label}</label>`).join('')}</div>`:''}
      ${this.repeating&&!this.challenge&&this.tests.length?`<div class="orbit-buttons">${this.button('reveal','Reveal symmetries')}</div>`:''}
      ${candidateOptions.length?`<details class="orbit-details"><summary>Try a marked symmetry</summary><div class="orbit-buttons">${candidateOptions.map((f,i)=>this.button('feature',`${f.kind==='turn'?`${f.order}-fold turn`:f.kind} at ${format(f.point.x)}, ${format(f.point.y)}`,i)).join('')}</div></details>`:''}
      ${this.challenge?`<p>Which group matches this exact pattern?</p><div class="orbit-buttons">${choices(this.data.caseIndex).map(name=>this.button('guess',name,name)).join('')}${this.button('insufficient','Need a hint')}</div>`:''}
      ${this.id==='gallery'?`${this.select('Compare with','compare',[['','Choose a pattern'],...wallpapers.map(w=>[w.id,w.id] as [string,string])],this.comparison)}`:''}`);
  }
  private renderNotes() {
    const spec=this.spec(),scene=scenes[this.data.scene],photo=assets.photos[Math.max(0,this.photo)];
    const asset=assets.diagrams.find(a=>a.group===spec.id);
    const matchFilter=(w:Wallpaper)=>!this.filter||w.lattice===this.filter;
    refreshControls(this.root.querySelector<HTMLElement>('#wall-notes')!,`
      ${this.id==='gallery'?`
        <div class="orbit-buttons"><label>Filter by lattice <select data-field="filter"><option value="">All 17</option>${Object.keys(bases).map(name=>`<option ${name===this.filter?'selected':''}>${name}</option>`).join('')}</select></label>
        <label><input type="checkbox" data-field="study" ${this.study?'checked':''}> Hide group names</label></div>
        <div class="gallery-grid">${wallpapers.filter(matchFilter).map(w=>`<button class="pattern-card" data-action="group" data-value="${w.id}" aria-pressed="${w.id===spec.id}">${thumbnail(w)}<b>${this.study?'Study pattern':w.id}</b></button>`).join('')}</div>
        ${!this.study?`<p><b>${spec.id}</b> · ${spec.note}</p>`:''}
        ${!this.study?(asset?`<details class="orbit-details"><summary>Annotated source diagram</summary><img class="reference-art" src="${asset.path}" alt="Annotated ${spec.id} diagram">${credit(asset)}</details>`:
          `<p><a href="https://commons.wikimedia.org/wiki/File:Wallpaper_group_diagram_${spec.id}.svg" target="_blank" rel="noopener">Open the annotated source diagram</a></p>`):''}
        <div id="wall-compare"></div>`:''}
      ${this.id==='art'?`<p>${this.rose?'Test this idealized eight-petal design for 45° turns and mirrors.':'The viewer generates an exact pattern of the proposed group for comparison. The shapes themselves are different from the source ornament.'}</p>`:''}
      ${(this.id==='art'||this.id==='detective'&&this.photo>=0)&&photo?`<div class="art-note"><img class="reference-art" src="${photo.path}" alt="${photo.label}" loading="lazy">
      <div><b>${photo.label}</b><p>Study the visible design. A finite crop can leave more than one possibility.</p>
      ${this.select('My tentative classification','photo-guess',[['','Choose if there is enough evidence'],...wallpapers.map(w=>[w.id,w.id] as [string,string])],this.photoGuess)}
      ${this.button('photo-answer','Compare with source classification')}${this.button('uncertain','Not enough information')}${this.button('photo','Next source example')}${credit(photo)}</div></div>`:''}
      ${this.id==='crystals'?'<p>Compare the flat repeating design with the stacked toy arrangement above.</p><div class="visual-host compare-wall" id="flat-example"></div>':''}
      ${this.id==='restriction'?`<details><summary>More mathematics</summary><p>In lattice coordinates a lattice-preserving rotation has an integer matrix. Its trace is 2 cos θ, an integer from −2 to 2. This restricts the orders to 1, 2, 3, 4, or 6. That restriction alone does not count the 17 wallpaper groups.</p></details>`:''}
      ${transcripts(scene.narration)}
      <div class="orbit-buttons">${this.data.scene>0?this.button('scene','Previous activity',this.data.scene-1):''}${this.data.scene<scenes.length-1?this.button('scene','Next activity',this.data.scene+1):''}</div>`);
  }
  private renderCompare(){
    this.comparisonViews.forEach(view=>view.destroy());
    this.comparisonViews = [];
    const flat=this.root.querySelector<HTMLElement>('#flat-example');
    if(flat){
      const view=new WallpaperScene(flat,lookup('p4m'));
      view.display.cell=true;view.display.vectors=true;view.draw();
      this.comparisonViews=[view];return;
    }
    const mount=this.root.querySelector('#wall-compare');
    if(!mount||!this.comparison)return;
    const pair=[this.spec(),lookup(this.comparison)];
    mount.innerHTML=`<div class="wall-compare-grid">${pair.map((spec,i)=>`<section><p><b>${this.study?`Pattern ${i+1}`:spec.id}</b> ${this.study?'':spec.note}</p><div class="visual-host compare-wall"></div></section>`).join('')}</div>`;
    this.comparisonViews = Array.from(mount.querySelectorAll<HTMLElement>('.compare-wall'),(host,index)=>{
      const view = new WallpaperScene(host,pair[index]);
      view.display={...this.display};
      view.draw();
      return view;
    });
  }
  private guide(){
    this.viewer.dragMode=['vector','u','v'].includes(this.selecting)?'vector':'pan';
    this.viewer.prediction=this.prediction;
    this.viewer.guide={point:{x:this.params.x,y:this.params.y},angle:rad(this.params.angle),kind:this.params.kind};
    this.viewer.draw();
  }
  private test(){
    const p=this.params,a=rad(p.angle),center={x:p.x,y:p.y};
    const to=(t:number)=>motion(p.kind,center,a,p.amount,t);
    const matrix=to(1),image=apply(matrix,this.point);
    let note='',matches=false;
    if(this.repeating){
      matches=preserves(this.spec(),matrix);
      note=matches?'Match. This motion preserves the whole pattern.':'Mismatch. Compare the moved motifs with the original pattern.';
    } else if(this.id==='art'){
      const atCenter=distance(apply(matrix,origin),origin)<1e-7;
      const angle=Math.atan2(matrix[2],matrix[0])*180/Math.PI;
      matches=atCenter&&Math.abs(angle/45-Math.round(angle/45))<1e-7;
      note=matches?'The whole rose design matches.':'The moved petals do not match the original rose.';
    } else {
      const b=this.secondPoint,d0=distance(this.point,b),d1=distance(image,apply(matrix,b));
      const spot=distance(image,this.point)<1e-7;
      const same=matrix.every((n,i)=>Math.abs(n-identity[i])<1e-7);
      const fixed=same?'Every point is fixed.':p.kind==='rotate'?'Only the center is fixed.':
        p.kind==='reflect'||p.kind==='glide'&&Math.abs(p.amount)<1e-9?'Exactly the points on the mirror are fixed.':'No points stay fixed.';
      note=`Distance A–B: ${format(d0)} → ${format(d1)}. ${fixed} ${spot?'Point A stayed put.':''}`;
      if(!same)note+=' The marked motif moved, so this is not a symmetry of that motif.';
      if(this.prediction)note+=distance(this.prediction,image)<.1?' Your prediction was close!':' Compare your prediction with the moved point A.';
    }
    const result={map:to,matches,note};
    this.tests.push(result);this.launch(result);
    this.renderControls();
  }
  private launch(result:MoveTest){this.viewer.play(result.map,result.matches);this.message(result.note);}
  private clear(){this.tests=[];this.viewer.clearTrial();this.reveal=false;this.display=defaultDisplay();}
  private latticePreset(name:keyof typeof bases){
    this.lattice=name;[this.width,this.skew,,this.height]=bases[name];
    if(this.id==='restriction')this.rank=2;
    this.enter();
  }
  private readonly click=(e:Event)=>{
    const button=(e.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if(!button)return;
    const {action,value}=button.dataset,v=Number(value);
    if(action==='scene'){
      this.voice.stop();this.clear();this.data.scene=v;
      if(!this.data.visited.includes(v))this.data.visited.push(v);
      this.photo=-1;this.rose=false;this.selecting='pan';this.prediction=null;this.params=initialParams();this.point={x:.22,y:.27};
      this.secondPoint={x:.72,y:.48};this.viewer.testPoint(this.point);this.viewer.testPoint(this.secondPoint,1);this.viewer.resetCamera();
      if(this.id==='lattice'||this.id==='restriction'){this.rank=this.id==='lattice'?0:2;this.latticePreset('square');}
      else this.enter();
    }
    else if(action==='speak')this.voice.toggle(scenes[this.data.scene].narration);
    else if(action==='stop')this.voice.stop();
    else if(action==='zoom')this.viewer.zoomBy(v>0?1.2:1/1.2);
    else if(action==='home')this.viewer.resetCamera();
    else if(action==='test')this.test();
    else if(action==='repeat'){const test=this.tests.at(-1);if(test)this.launch(test);}
    else if(action==='undo'){this.tests.pop();const test=this.tests.at(-1);if(test)this.launch(test);else{this.viewer.clearTrial();this.message('Motion cleared.');}}
    else if(action==='group'&&value){this.data.group=value;this.clear();this.enter();}
    else if(action==='basis'){
      const p=basisVector(this.spec(),v);this.params={...this.params,kind:'translate',x:p.x,y:p.y};
      this.renderControls();this.guide();
    }
    else if(action==='reveal'){
      this.reveal=true;this.display={...this.display,centers:true,mirrors:true,glides:true,vectors:true};
      this.viewer.display={...this.display};this.viewer.draw();this.renderControls();
      this.message(this.spec().note);
    }
    else if(action==='feature'){
      const f=features(this.spec()).filter(f=>f.point.x>=-.01&&f.point.x<=1&&f.point.y>=-.01&&f.point.y<=1).slice(0,42)[v];
      const a=Math.atan2(f.affine[2],f.affine[0]);
      const kind=f.kind==='turn'?'rotate':f.kind==='mirror'?'reflect':'glide';
      const slide=f.affine[4]*Math.cos(f.angle)+f.affine[5]*Math.sin(f.angle);
      this.params={kind,x:f.point.x,y:f.point.y,angle:(f.kind==='turn'?a:f.angle)*180/Math.PI,amount:slide};
      this.guide();this.test();
    }
    else if(action==='angle'){
      const map=(t:number)=>motion('rotate',origin,rad(v),0,t);
      const {basis}=this.spec(),[a,b,c,d]=compose(inverseAffine(basis),compose(map(1),basis));
      const matches=[a,b,c,d].every(n=>Math.abs(n-Math.round(n))<1e-7);
      const result={map,matches,note:matches?`${v}° fits this lattice.`:`${v}° sends lattice points between the original dots.`};
      this.tests.push(result);this.launch(result);
    }
    else if(action==='next-case'){this.clear();this.photo=-1;this.data.caseIndex=(this.data.caseIndex+1)%exactCases.length;this.enter();}
    else if(action==='guess'){
      if(!this.tests.length){this.message('Test a candidate motion before choosing a group.');return;}
      const spec=this.spec();
      if(value===spec.id){if(!this.data.solved.includes(spec.id))this.data.solved.push(spec.id);this.persist();this.message(`Correct: ${spec.id}. ${spec.note}`);this.reveal=true;this.display={...this.display,centers:true,mirrors:true,glides:true};this.viewer.display={...this.display};this.viewer.draw();this.renderControls();}
      else {
        const candidate=lookup(value??'p1');
        const probe=[...spec.generators.map(g=>[spec,g] as const),...candidate.generators.map(g=>[candidate,g] as const)]
          .map(([w,g])=>[w,g,toWorld(w,g)] as const)
          .find(([w,,g])=>!preserves(w===spec?candidate:spec,g));
        if(probe){
          const [, , affine]=probe,matches=preserves(spec,affine);
          const {kind,point,angle,amount}=describeIsometry(affine);
          this.launch({map:t=>motion(kind,point,angle,amount,t),matches,
            note:`Try the highlighted ${affine[0]*affine[3]-affine[1]*affine[2]<0?'flip or glide':'turn'}. ${matches?'It matches here but not your choice.':'Your choice admits it, but the moved copy does not match here.'}`});
        }else this.message(`Try a different group. Think about this clue: ${spec.note}`);
      }
    }
    else if(action==='insufficient')this.message(`Clue: ${this.spec().note}`);
    else if(action==='art-mode'){this.rose=!this.rose;this.clear();this.enter();}
    else if(action==='photo'&&assets.photos.length){this.photo=(this.photo+1)%assets.photos.length;this.photoGuess='';this.clear();this.enter();}
    else if(action==='photo-answer'){
      const asset=assets.photos[Math.max(0,this.photo)];
      if(asset)this.message(`${this.photoGuess?`You proposed ${this.photoGuess}. `:''}Source classification: approximately ${asset.group}. ${asset.note}`);
    }
    else if(action==='uncertain')this.message('That is a reasonable conclusion from a finite crop. Follow one repeating motif and look for a second, independent repeat direction.');
    else if(action==='cut'){
      cancelAnimationFrame(this.frame);
      const from=this.cutStep, start=performance.now();
      const tick=(now:number)=>{const t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/600);
        this.viewer.cutStep=this.cutStep=from+(1-from)*t;this.viewer.draw();if(t<1)this.frame=requestAnimationFrame(tick);};
      this.frame=requestAnimationFrame(tick);this.message('The cut piece moved by one period. The new tile has the same area.');
    }
    else if(action==='uncut'){cancelAnimationFrame(this.frame);this.viewer.cutStep=this.cutStep=0;this.viewer.draw();}
  };
  private readonly updateMotionInput=(event:Event)=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement))return;
    const field=input.dataset.field;
    if(field!=='x'&&field!=='y'&&field!=='angle'&&field!=='amount')return;
    const value=input.valueAsNumber;
    if(!Number.isFinite(value))return;
    this.params[field]=Math.min(Number(input.max),Math.max(Number(input.min),value));
    this.viewer.clearTrial();
    this.guide();
  };
  private readonly change=(e:Event)=>{
    const el=e.target;
    if(!(el instanceof HTMLInputElement||el instanceof HTMLSelectElement))return;
    const {field,display}=el.dataset;
    if(display&&el instanceof HTMLInputElement){this.display[display as keyof Display]=el.checked;this.viewer.display={...this.display};this.viewer.draw();return;}
    if(field==='group'){this.data.group=el.value;this.clear();this.enter();}
    else if(field==='photo-guess')this.photoGuess=el.value;
    else if(field==='custom-periods'&&el instanceof HTMLInputElement){this.customPeriods=el.checked;this.clear();this.enter();}
    else if(field==='compare'){this.comparison=el.value;this.renderCompare();}
    else if(field==='filter'){this.filter=el.value;this.renderNotes();this.renderCompare();}
    else if(field==='study'&&el instanceof HTMLInputElement){this.study=el.checked;this.renderControls();this.renderNotes();this.renderCompare();}
    else if(field==='lattice')this.latticePreset(el.value as keyof typeof bases);
    else if(field==='kind'){this.params.kind=el.value;this.renderControls();this.guide();}
    else if(field==='gesture'){this.selecting=el.value;this.guide();}
    else if(field==='rank'){this.rank=Number(el.value);this.viewer.rank=this.rank;this.viewer.display.cell=this.rank===2;this.viewer.display.vectors=this.rank===2;this.viewer.draw();}
    else if(el instanceof HTMLInputElement&&el.type==='number'){
      if(el.value===''){this.renderControls();return;}
      const n=Math.min(Number(el.max),Math.max(Number(el.min),el.valueAsNumber));
      if(!Number.isFinite(n))return;
      el.value=String(n);
      if(field==='x'||field==='y'||field==='angle'||field==='amount'){this.params[field]=n;this.guide();}
      else if(field==='width'||field==='skew'||field==='height'){this[field]=n;this.viewer.load(this.spec());this.guide();}
      else if(field==='range'){this.viewer.range=this.range=Math.round(n);this.viewer.draw();}
      else if(field==='layers'){this.viewer.layers=this.layers=Math.round(n);this.viewer.draw();}
      else if(field==='crystal-angle'){this.viewer.crystalAngle=rad(n);this.viewer.draw();}
      else if(field==='cut'){this.viewer.cut=this.cut=n;this.viewer.draw();}
    }
  };
  destroy(){this.voice.stop();cancelAnimationFrame(this.frame);this.viewer.destroy();this.comparisonViews.forEach(view=>view.destroy());this.root.removeEventListener('click',this.click);this.root.removeEventListener('change',this.change);this.root.removeEventListener('input',this.updateMotionInput);}
}
