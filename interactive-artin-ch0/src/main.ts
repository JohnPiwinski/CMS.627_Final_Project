import { GroupLab } from './labs/GroupLab';
import { WallpaperLab } from './labs/WallpaperLab';
import { OrbitLab } from './labs/OrbitLab';
import { solidGroups, type Solid } from './lib/solids';
import './styles.css';
import { LatticeLab } from './labs/LatticeLab';
import { CubeLab } from './labs/CubeLab';
import { SquareLab } from './labs/SquareLab';
import { emptyProgress, hasDone, lessonInfo, markLattice, type Feature, type LessonId, type LessonProgress } from './lib/lesson';
import type { LatticeTool, LatticeType } from './lib/geometry';

const chapters = [
  { id: 'intro', title: 'Introductory Group Theory', number: '01' },
  { id: 'orbit', title: 'Orbit Stabilizer', number: '02' },
  { id: 'wallpaper', title: 'Wallpaper Groups', number: '03' },
] as const;
type PageId = LessonId | typeof chapters[number]['id'];
type ActiveLab = GroupLab | WallpaperLab | OrbitLab | LatticeLab | CubeLab | SquareLab;
const STORAGE_KEY='interactive-artin:chapter-zero:v1';
const tools: {value:LatticeTool;symbol:string;label:string;detail:string}[] = [
  {value:'translate',symbol:'↗',label:'Translate',detail:'Drag between dots'},
  {value:'rotate',symbol:'↻',label:'Rotate',detail:'Choose a center and drag'},
  {value:'reflect',symbol:'◇',label:'Reflect',detail:'Drag an axis'},
];
const features: Feature[]=['face','edge','vertex'];

function loadProgress():LessonProgress {
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as Partial<LessonProgress>|null;
    if(!data) return emptyProgress();
    const validTools=['translate','rotate','reflect','match'];
    return {
      squareLattice:(data.squareLattice ?? []).filter(tool=>validTools.includes(tool)),
      triangularLattice:(data.triangularLattice ?? []).filter(tool=>validTools.includes(tool)),
      solidSymmetries:(data.solidSymmetries ?? []).filter(feature=>features.includes(feature)),
      rotated:!!data.rotated,undone:!!data.undone,
    };
  } catch {return emptyProgress();}
}
const root=document.getElementById('app');
if(!root) throw new Error('Missing #app root element');

class ChapterZero {
  private progress=loadProgress();
  private current:PageId='lattice';
  private active:ActiveLab|null=null;
  private isSpeaking=false;
  private isPaused=false;
  private readonly app:HTMLElement;

  constructor(app:HTMLElement) {
    this.app=app;
    this.render();
    window.addEventListener('keydown',this.onKeyDown);
  }

  private writeProgress():void {
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(this.progress));} catch {/* storage may be disabled */}
    this.updateProgress();
  }
  private totalDone():number {
    return this.progress.squareLattice.length+this.progress.triangularLattice.length+this.progress.solidSymmetries.length+
      Number(this.progress.rotated)+Number(this.progress.undone);
  }
  private updateHint(message:string):void {
    const text=document.getElementById('live-hint');
    if(text) text.textContent=message;
  }

  private stopNarration():void {
    if('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.isSpeaking=false;
    this.isPaused=false;
    this.refreshNarrationButton();
  }
  private refreshNarrationButton():void {
    const button=document.getElementById('narration-button');
    if(button) button.textContent=this.isSpeaking?(this.isPaused?'▶  Resume voiceover':'Ⅱ  Pause voiceover'):'▶  Play voiceover';
  }
  private toggleNarration():void {
    if(this.isSpeaking) {
      if(this.isPaused) window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
      this.isPaused=!this.isPaused;
      this.refreshNarrationButton();
      return;
    }
    if(!('speechSynthesis' in window)) {this.updateHint('Voice playback is unavailable in this browser; the full transcript is shown below.');return;}
    const lesson=lessonInfo.find(l=>l.id===this.current)!;
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(lesson.narration);
    utterance.rate=.95;
    utterance.pitch=.98;
    utterance.onend=()=>{this.isSpeaking=false;this.isPaused=false;this.refreshNarrationButton();};
    utterance.onerror=()=>{this.isSpeaking=false;this.isPaused=false;this.refreshNarrationButton();};
    this.isSpeaking=true;
    this.isPaused=false;
    this.refreshNarrationButton();
    window.speechSynthesis.speak(utterance);
  }

  private navigate(to:PageId):void {
    if(this.current===to) return;
    this.stopNarration();
    this.active?.destroy();
    this.active=null;
    this.current=to;
    this.render();
    window.scrollTo(0, 0);
  }

  private getTemplate():string {
    const chapter = chapters.find(item => item.id === this.current);
    const lesson=lessonInfo.find(l=>l.id===this.current) ?? lessonInfo[0];
    const number=lesson.number;
    return `
      <div class="app-shell">
        <aside class="sidebar" aria-label="Chapter navigation">
          <div class="brand"><div class="brand-mark">A<span>·</span></div>
            <div><div class="brand-name">ARTIN</div><div class="brand-sub">INTERACTIVE ALGEBRA</div></div>
          </div>
          <div class="sidebar-rule"></div>
          <div class="sidebar-overline">YOUR WORKBENCH</div>
          <div class="book-card"><div class="book-symbol">✳</div><div><b>Chapter Zero</b><small>Learning the controls</small></div></div>
          <div class="sidebar-overline nav-label">THE THREE EXERCISES</div>
          <nav class="lesson-nav">
            ${lessonInfo.map((l,i)=>`
              <button class="nav-item ${this.current===l.id?'active':''} ${hasDone(this.progress,l.id)?'done':''}"
                data-lesson="${l.id}" ${this.current===l.id?'aria-current="step"':''}>
                <span class="nav-number">${hasDone(this.progress,l.id)?'✓':`0${i+1}`}</span>
                <span><b>${l.short}</b><small>${l.name}</small></span>
                <span class="nav-arrow">›</span>
              </button>`).join('')}
          </nav>
          <div class="sidebar-overline nav-label chapter-nav-heading">CHAPTERS</div>
          <nav class="lesson-nav" aria-label="New chapters">
            ${chapters.map(item => `<button class="nav-item ${this.current === item.id ? 'active' : ''}" data-lesson="${item.id}" ${this.current === item.id ? 'aria-current="page"' : ''}><span class="nav-number">${item.number}</span><span><b>${item.title}</b></span><span class="nav-arrow">›</span></button>`).join('')}
          </nav>
          <div class="sidebar-grow"></div>
          <div class="chapter-progress"><div class="chapter-progress-top"><span>CHAPTER ZERO PROGRESS</span><strong id="overall-ratio">0 / 13</strong></div>
            <div class="progress-track"><div class="progress-fill" id="overall-bar"></div></div>
            <p>Experiment at your own pace. Your completed exercises are saved in this browser.</p>
          </div>
          <div class="sidebar-footer">IAA <span>·</span> THE MATHEMATICS WORKSHOP</div>
        </aside>
        <main class="main-content">
          ${chapter ? `
          <div class="topbar"><span class="breadcrumb">THE WORKSHOP <span>/</span> CHAPTER ${chapter.number}</span></div>
          <header class="lesson-heading"><h1>${chapter.id === 'orbit' ? 'The Symmetry Laboratory' : chapter.title}</h1>
            ${chapter.id === 'orbit' ? '<p>How many ways can a shape move?</p>' : ''}</header>
          ${chapter.id === 'orbit' ? `<div class="content-grid orbit-workspace">
            <section class="workspace" aria-label="Interactive solid">
              <div id="orbit-view" class="visual-host is-three"></div>
              <div class="workspace-bottom"><span class="workspace-hint" id="orbit-hint" aria-live="polite"></span></div>
            </section>
            <aside class="control-panel" id="orbit-controls" aria-label="Investigation controls"></aside>
          </div>
          <section class="narration-panel orbit-notes" id="orbit-notes" aria-label="Investigation notebook"></section>` : '<div id="chapter-activity"></div>'}
          <div class="bottom-navigation"><div class="bottom-nav-actions">
            <button id="back-button" type="button" class="secondary-button">← Previous chapter</button>
            ${chapter.id !== 'wallpaper' ? '<button id="next-button" type="button" class="primary-button">Next chapter →</button>' : ''}
          </div></div>` : `
          <div class="topbar"><span class="breadcrumb">THE WORKSHOP <span>/</span> CHAPTER 00 <span>/</span> EXERCISE ${number}</span>
            <div class="topbar-actions"><span class="draft-tag"><span></span> INTERACTIVE PROTOTYPE</span><button class="text-button" id="help-button" type="button">? <span>How to use</span></button></div>
          </div>
          <header class="lesson-heading"><div class="eyebrow">${lesson.tag} <span class="eyebrow-divider"></span> EXERCISE ${number} OF 03</div>
            <h1>${lesson.title}</h1><p>${lesson.subtitle}</p>
          </header>
          <div class="step-track" aria-label="Exercise progress">${lessonInfo.map(l=>`<div class="step-segment ${l.id===this.current?'current':''} ${hasDone(this.progress,l.id)?'finished':''}"></div>`).join('')}</div>
          <div class="content-grid">
            <section class="workspace" aria-label="Interactive mathematical workspace">
              <div class="workspace-top"><div class="workspace-title"><span class="workspace-icon">✥</span><span>${this.current==='cube'?'3D EXPLORER':this.current==='square'?'ROTATION STUDIO':'LATTICE PLAYGROUND'}</span></div>
                <span class="workspace-note">${this.current==='cube'?'DRAG TO ORBIT · CLICK TO SELECT':this.current==='square'?'POSITIVE ANGLES ARE COUNTERCLOCKWISE':'CLICK OR DRAG ON THE GRID'}</span>
              </div>
              <div id="visual-host" class="visual-host ${this.current==='cube'?'is-three':''}">
                <div class="canvas-pill"><span class="canvas-pill-dot"></span>${this.current==='cube'?'LIVE 3D SCENE':'LIVE 2D CANVAS'}</div>
              </div>
              <div class="workspace-bottom"><div class="workspace-hint"><span class="hint-spark">✦</span><span id="live-hint">${lesson.prompt}</span></div>
                <button class="quiet-button" id="reset-button" type="button">↺ &nbsp; ${this.current==='cube'?'Reset view':'Reset scene'}</button></div>
            </section>
            <aside class="control-panel" aria-label="Activity controls"><div id="control-content"></div></aside>
          </div>
          <div class="lower-grid"><section class="narration-panel"><div class="narration-heading"><div class="narration-heading-left"><span class="sound-icon">♫</span><div><span class="section-overline">GUIDED NARRATION</span><b>Listen & learn</b></div></div>
              <div class="narration-controls"><button id="narration-button" type="button" class="outline-button">▶  Play voiceover</button><button id="stop-narration" type="button" class="outline-button" aria-label="Stop narration">■</button></div></div>
              <p>${lesson.narration}</p><div class="transcript-note">TEXT TRANSCRIPT · BROWSER SPEECH PLAYBACK</div>
              </section>
              <section class="idea-panel"><div class="section-overline">THE BIG IDEA</div><div class="idea-symbol">${this.current==='lattice'?'↗':this.current==='cube'?'⬡':'↺'}</div>
                <h3>${this.current==='lattice'?'Same grid, different motion.':this.current==='cube'?'What stays fixed?':'An outline can hide motion.'}</h3>
                <p>${this.current==='lattice'?'Watch the grid and the triangle move together. The lattice points line up again when the motion ends.':this.current==='cube'?'A symmetry moves the colored features while preserving the shape of the solid. Try a turn that leaves one face in place while its corners move.':'A quarter-turn preserves a square’s outline, but it sends each colored corner somewhere new.'}</p>
              </section></div>
          <div class="bottom-navigation"><span>CHAPTER 00 <span class="bottom-dot">·</span> GETTING ORIENTED</span><div class="bottom-nav-actions">
            <button id="back-button" type="button" class="secondary-button" ${this.current==='lattice'?'disabled':''}>← Previous</button>
            <button id="next-button" type="button" class="primary-button">${this.current==='square'?'Next chapter':'Next exercise'} &nbsp; →</button>
          </div></div>
          `}
        </main>
      </div>
      <dialog id="help-dialog"><div class="dialog-inner"><div class="section-overline">WORKSHOP HELP</div><h2>How this tutorial works</h2>
        <p>Follow the exercise instructions, then experiment freely. Your progress is saved in your browser. Resetting a scene restores its drawing, not your earned progress.</p>
        <ul><li><b>Lattice:</b> pick a tool and click points; for reflections, press a dot and drag outward.</li>
        <li><b>Platonic solids:</b> drag to orbit, then click a feature and drag its dial to turn or click a mirror plane to reflect. The alternative selection button lets you use the rotation dial or the numbered plane buttons.</li>
        <li><b>Marked square:</b> rotate and undo using the buttons or keyboard shortcuts.</li></ul>
        <p><b>Keyboard:</b> keys 1, 2, 3 select lattice tools; R and Shift+R turn the square in opposite directions; Z undoes. Navigation and selection alternatives are accessible with Tab and Enter.</p>
        <button class="primary-button" id="close-help" type="button">Back to the workshop</button></div></dialog>
    `;
  }

  private render():void {
    this.app.innerHTML=this.getTemplate();
    if (chapters.some(chapter => chapter.id === this.current)) {
      if (this.current === 'orbit') this.active = new OrbitLab(this.app.querySelector('main')!);
      else {
        const mount = this.app.querySelector<HTMLElement>('#chapter-activity')!;
        this.active = this.current === 'intro' ? new GroupLab(mount) : new WallpaperLab(mount);
      }
      this.attachListeners();
      this.updateProgress();
      return;
    }
    const host=document.getElementById('visual-host');
    if (!(host instanceof HTMLDivElement)) throw new Error('Expected a div for the lesson canvas.');
    if(this.current==='lattice') {
      const lab=new LatticeLab(host);
      lab.onHint=message=>this.updateHint(message);
      lab.onPerformed=(tool,lattice)=>{
        this.progress=markLattice(this.progress,lattice,tool);
        this.writeProgress();
      };
      lab.onMatched = lattice => {
        this.progress = markLattice(this.progress, lattice, 'match');
        this.writeProgress();
      };
      this.active=lab;
    } else if(this.current==='cube') {
      const lab=new CubeLab(host,this.progress.solidSymmetries);
      lab.onHint=message=>this.updateHint(message);
      lab.onSelected=(feature)=>{
        this.progress={...this.progress,solidSymmetries:Array.from(new Set([...this.progress.solidSymmetries,feature]))};
        this.writeProgress();
      };
      this.active=lab;
    } else {
      const lab=new SquareLab(host);
      lab.onHint=message=>this.updateHint(message);
      lab.onRotate=()=>{this.progress={...this.progress,rotated:true};this.writeProgress();};
      lab.onUndo=()=>{this.progress={...this.progress,undone:true};this.writeProgress();};
      this.active=lab;
    }
    this.renderControls();
    document.getElementById('control-content')?.addEventListener('click',this.onControlClick);
    this.updateProgress();
    this.attachListeners();
  }

  private renderControls():void {
    const panel=document.getElementById('control-content')!;
    if(this.current==='lattice') {
      const lab=this.active as LatticeLab;
      panel.innerHTML=`<div class="control-topline"><span>YOUR TOOLS</span><span class="control-index">01 / 03</span></div>
        <h2>Move the markers.</h2><p class="control-intro">Pick an operation, then interact with the lattice. Your colored triangle makes each motion visible.</p>
        <div class="control-divider"></div><div class="mini-label">1. CHOOSE YOUR LATTICE</div>
        <div class="segmented"><button data-action="lattice" data-value="square" type="button" class="${lab.getLattice()==='square'?'selected':''}">Square</button>
          <button data-action="lattice" data-value="triangular" type="button" class="${lab.getLattice()==='triangular'?'selected':''}">Triangular</button></div>
        <div class="mini-label tool-label">2. CHOOSE A TRANSFORMATION</div>
        <div class="tool-list">${tools.map(tool=>`<button type="button" class="tool-button ${lab.getTool()===tool.value?'selected':''}" data-action="tool" data-value="${tool.value}">
          <span class="tool-symbol">${tool.symbol}</span><span class="tool-copy"><b>${tool.label}</b><small>${tool.detail}</small></span>
          <span class="tool-key">${tools.indexOf(tool)+1}</span></button>`).join('')}</div>
        <div class="control-divider"></div><div class="mini-label">YOUR EXPERIMENTS <span id="current-lattice-name">SQUARE</span></div>
        <div class="checklist" id="task-list"></div><div id="completion-box"></div>`;
    } else if(this.current==='cube') {
      panel.innerHTML=`<div class="control-topline"><span>FIELD NOTES</span><span class="control-index">02 / 03</span></div>
        <h2>Symmetries of solids.</h2>
        <label class="mini-label" for="solid-picker">PLATONIC SOLID</label>
        <select id="solid-picker" class="solid-picker">${solidGroups.map(group =>
          `<optgroup label="${group.label}">${group.solids.map(solid => `<option>${solid}</option>`).join('')}</optgroup>`).join('')}</select>
        <div class="segmented" aria-label="Solid transformation">
          <button type="button" class="selected" aria-pressed="true" data-action="solid-rotate">Rotate</button>
          <button type="button" aria-pressed="false" data-action="solid-reflect">Reflect</button>
        </div>
        <p class="control-intro solid-instructions">Drag the scene to orbit. Click a face, edge, or vertex to open the controls. Drag the rotation dial, or orbit to inspect the mirror planes and click one.</p>
        <div class="control-divider"></div><div class="mini-label">APPLY A SYMMETRY THROUGH EACH FEATURE</div><div class="feature-steps" id="task-list"></div>
        
        <button type="button" class="alt-select" data-action="keyboard-pick">Select current feature without mouse <span>↗</span></button>
        <div id="completion-box"></div>`;
      const lab = this.active as CubeLab;
      const picker = panel.querySelector<HTMLSelectElement>('#solid-picker')!;
      picker.onchange = () => lab.setSolid(picker.value as Solid);
    } else {
      panel.innerHTML=`<div class="control-topline"><span>MOTION STUDY</span><span class="control-index">03 / 03</span></div>
        <h2>A quarter-turn.</h2><p class="control-intro">The square turns in the plane. Pay attention to its four colored corners.</p>
        <div class="control-divider"></div><div class="mini-label">YOUR CONTROLS</div>
        <button type="button" class="big-action" data-action="rotate"><span class="action-symbol">↺</span><span><b>Rotate +90°</b><small>Counterclockwise · R</small></span><span class="action-arrow">↗</span></button>
        <button type="button" class="big-action" data-action="rotate-clockwise"><span class="action-symbol">↻</span><span><b>Rotate −90°</b><small>Clockwise · Shift+R</small></span><span class="action-arrow">↗</span></button>
        <button type="button" class="undo-action" data-action="undo"><span>↶</span> Undo last turn <span class="key-label">Z</span></button>
        <div class="angle-panel"><span>NET ROTATION</span><b id="angle-value">0°</b><small>relative to the starting square</small></div>
        <div class="control-divider"></div><div class="mini-label">YOUR OBJECTIVES</div><div class="checklist" id="task-list"></div>
        <div id="completion-box"></div>`;
    }
  }

  private readonly onControlClick = (event:Event):void => {
    const target=event.target as HTMLElement;
    const button=target.closest<HTMLButtonElement>('[data-action]');
    if(!button) return;
    const action=button.dataset.action;
    if(action==='tool' && this.active instanceof LatticeLab) {
      this.active.setTool(button.dataset.value as LatticeTool);
      this.renderControls();this.updateProgress();
    } else if(action==='lattice' && this.active instanceof LatticeLab) {
      this.active.setLattice(button.dataset.value as LatticeType);
      this.renderControls();this.updateProgress();
    } else if ((action === 'solid-rotate' || action === 'solid-reflect') && this.active instanceof CubeLab) {
      this.active.setMode(action === 'solid-rotate' ? 'rotate' : 'reflect');
      button.parentElement?.querySelectorAll('button').forEach(choice => {
        choice.classList.toggle('selected', choice === button);
        choice.setAttribute('aria-pressed', String(choice === button));
      });
    } else if(action==='keyboard-pick' && this.active instanceof CubeLab) {
      this.active.selectKeyboardFeature();
    } else if((action==='rotate' || action==='rotate-clockwise') && this.active instanceof SquareLab) {
      this.active.rotate(action === 'rotate-clockwise' ? -1 : 1);this.updateProgress();
    } else if(action==='undo' && this.active instanceof SquareLab) {
      this.active.undo();this.updateProgress();
    }
  };

  private updateProgress():void {
    const done=this.totalDone();
    const overall=document.getElementById('overall-ratio');if(overall) overall.textContent=`${done} / 13`;
    const bar=document.getElementById('overall-bar');if(bar) bar.style.width=`${Math.round(done/13*100)}%`;
    for(const lesson of lessonInfo) {
      const nav=this.app.querySelector(`[data-lesson="${lesson.id}"]`);
      const completed=hasDone(this.progress,lesson.id);
      nav?.classList.toggle('done',completed);
      const marker=nav?.querySelector('.nav-number');
      if(marker) marker.textContent=completed?'✓':`0${lessonInfo.indexOf(lesson)+1}`;
    }
    this.app.querySelectorAll('.step-segment').forEach((seg,i)=>{
      seg.classList.toggle('finished',hasDone(this.progress,lessonInfo[i].id));
    });
    const list=document.getElementById('task-list');
    if(!list) return;
    if(this.current==='lattice') {
      const lab=this.active as LatticeLab;
      const lattice=lab.getLattice();
      const key=lattice==='square'?'squareLattice':'triangularLattice';
      const earned=this.progress[key];
      list.innerHTML=tools.map(tool=>`<div class="check-row ${earned.includes(tool.value)?'achieved':''}"><span class="check-icon">${earned.includes(tool.value)?'✓':'○'}</span><span>${tool.label} a shape</span></div>`).join('');
      const matched = earned.includes('match');
      list.innerHTML += `<div class="check-row ${matched ? 'achieved' : ''}"><span class="check-icon">${matched ? '✓' : '○'}</span><span>Match A, B, and C to the target</span></div>`;
      const curr=document.getElementById('current-lattice-name');if(curr) curr.textContent=lattice.toUpperCase();
      const panel=document.getElementById('completion-box')!;
      panel.innerHTML=hasDone(this.progress,'lattice')?'<div class="success-card"><b>✦ Both lattices explored!</b><p>You tried all three transformations and matched both targets.</p></div>':
        earned.length===4&&lattice==='square'?'<div class="next-tip">✦ Excellent. Now switch to the <b>triangular lattice</b> and match its target.</div>':
        earned.length===4&&lattice==='triangular'?'<div class="next-tip">✦ Triangular lattice complete. Check the goals on the square lattice, too.</div>':'';
    } else if(this.current==='cube') {
      list.innerHTML=features.map((feature,i)=>{
        const achieved=this.progress.solidSymmetries.includes(feature);
        const next=features.find(f=>!this.progress.solidSymmetries.includes(f));
        return `<div class="feature-step ${achieved?'achieved':''} ${next===feature?'current':''}"><span class="feature-step-number">${achieved?'✓':`0${i+1}`}</span><div><b>${feature[0].toUpperCase()+feature.slice(1)}</b><small>${feature==='face'?'A flat surface':feature==='edge'?'Where two faces meet':'Where edges meet'}</small></div></div>`;
      }).join('');
      const completion=document.getElementById('completion-box')!;
      completion.innerHTML=hasDone(this.progress,'cube')?'<div class="success-card"><b>✦ Three symmetry axes explored!</b><p>You applied symmetries through a face, an edge, and a vertex. Try another solid to compare.</p></div>':'';
    } else {
      const lab=this.active as SquareLab;
      list.innerHTML=`<div class="check-row ${this.progress.rotated?'achieved':''}"><span class="check-icon">${this.progress.rotated?'✓':'○'}</span><span>Make one quarter-turn</span></div>
        <div class="check-row ${this.progress.undone?'achieved':''}"><span class="check-icon">${this.progress.undone?'✓':'○'}</span><span>Undo a rotation</span></div>`;
      const value=document.getElementById('angle-value'); if(value) value.textContent=`${((lab.getTurnCount()%4)+4)%4*90}°`;
      const undo=this.app.querySelector<HTMLButtonElement>('[data-action="undo"]');
      if(undo) undo.disabled=!lab.canUndo();
      const completion=document.getElementById('completion-box')!;
      completion.innerHTML=hasDone(this.progress,'square')?'<div class="success-card"><b>✦ Chapter Zero complete!</b><p>You can revisit any exercise or keep experimenting.</p></div>':'';
    }
  }

  private attachListeners():void {
    this.app.firstElementChild?.addEventListener('click', event => {
      const button = (event.target as Element).closest<HTMLButtonElement>('[data-lesson]');
      if (button) this.navigate(button.dataset.lesson as PageId);
    });
    document.getElementById('reset-button')?.addEventListener('click',()=>{
      if(this.active instanceof LatticeLab || this.active instanceof SquareLab) this.active.reset();
      else if(this.active instanceof CubeLab) this.active.resetView();
      this.updateProgress();
    });
    document.getElementById('narration-button')?.addEventListener('click',()=>this.toggleNarration());
    document.getElementById('stop-narration')?.addEventListener('click',()=>this.stopNarration());
    document.getElementById('back-button')?.addEventListener('click',()=>{
      const pages = [...lessonInfo, ...chapters];
      const idx = pages.findIndex(page => page.id === this.current);
      if (idx > 0) this.navigate(pages[idx - 1].id);
    });
    document.getElementById('next-button')?.addEventListener('click',()=>{
      const pages = [...lessonInfo, ...chapters];
      const idx = pages.findIndex(page => page.id === this.current);
      if (idx < pages.length - 1) this.navigate(pages[idx + 1].id);
    });
    document.getElementById('help-button')?.addEventListener('click',()=>{
      document.querySelector<HTMLDialogElement>('#help-dialog')?.showModal();
    });
    document.getElementById('close-help')?.addEventListener('click',()=>{
      document.querySelector<HTMLDialogElement>('#help-dialog')?.close();
    });
    document.getElementById('help-dialog')?.addEventListener('click',(event)=>{
      if(event.target instanceof HTMLDialogElement) event.target.close();
    });
  }

  private readonly onKeyDown=(event:KeyboardEvent):void=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target instanceof HTMLInputElement) return;
    const dialog=document.getElementById('help-dialog') as HTMLDialogElement|null;
    if(dialog?.open) return;
    if(this.active instanceof LatticeLab && ['1','2','3'].includes(event.key)) {
      this.active.setTool(tools[Number(event.key)-1].value);
      this.renderControls();this.updateProgress();
    }
    if(this.active instanceof SquareLab) {
      if(event.key.toLowerCase()==='r') {event.preventDefault();this.active.rotate(event.shiftKey ? -1 : 1);this.updateProgress();}
      if(event.key.toLowerCase()==='z') {event.preventDefault();this.active.undo();this.updateProgress();}
    }
  };
}

new ChapterZero(root);
