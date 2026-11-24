import content from '../content/groups.md?raw';
import { act, conjugate, coset, cyclesOf, equalSet, inverse, moveName, moves, normal, partition, permutationParity, product, sign, subgroupIssue } from '../lib/group';
import { Narrator, parseScenes, recall, refreshControls, remember, transcripts } from '../lib/chapterContent';

const scenes = parseScenes(content);
const key = 'iaa-group-playground';
const subgroups = [[0,1,2,3],[0,4],[0,2],[0,2,4,6],[0,2,5,7]];
const subgroupNames = ['All four turns','Identity and one mirror','Identity and half-turn','Half-turn and two mirrors','Half-turn and the other mirrors'];
const colors = ['#ad473e','#376f93','#895e26','#38735e'];
const cabinet = [
  ['Rings and fields','Compare one operation in groups with addition and multiplication in rings. Integers form a ring; rationals form a field, where division by any nonzero number stays in the field.'],
  ['Benzene','Preview the ideal molecule’s three-dimensional D₆h symmetry, including reflection in the molecular plane.'],
  ['Group gallery','Cₙ, Dₙ, Sₙ, Aₙ, V₄, integer and real addition, nonzero real multiplication, Platonic rotations and Q₈. C₄ has an element of order four; V₄ does not.'],
  ['Permutation workbench','Cycle notation, parity, the tetrahedron’s A₄ action, and Cayley’s permutation representation.'],
  ['Finite matrix groups','Over F₂, a first column has three nonzero choices and a second independent column has two, giving six invertible matrices.'],
  ['A common fixed point','Average every image of a point under a finite group, counting repetitions. The symmetries permute those images, so their average stays fixed.'],
  ['Normality and correspondence','Compare normal-subgroup families in D₄, S₃, A₄, and S₄; explore the subgroup correspondence for ℤ/12 and {0,6}.'],
  ['Dual solids','Join neighboring face centers to make the dual. The cube and octahedron are dual, as are the dodecahedron and icosahedron.'],
  ['Winding around a circle','Preview how loops on a circle are classified up to based homotopy by an integer winding number.'],
  ['Quaternion cube','Research preview. A face-pairing quotient is a space; the group Q₈ would describe its loops, if the specific identifications are verified.'],
];

function diagram(n:number, arrangement:number[], title:string, track=-1):string {
  const points = arrangement.map((_,i)=>({x:90+62*Math.cos(2*Math.PI*i/n+Math.PI/4),y:90-62*Math.sin(2*Math.PI*i/n+Math.PI/4)}));
  return `<svg class="group-diagram" viewBox="0 0 180 180" role="img" aria-label="${title}: ${arrangement.map(x=>x+1).join(', ')}">
    <polygon points="${points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="#dde8dc" stroke="#527061" stroke-width="2"/>
    ${points.map((p,i)=>`<g><circle cx="${p.x}" cy="${p.y}" r="12" fill="${colors[arrangement[i]%4]}" stroke="${arrangement[i]===track?'#242c28':'white'}" stroke-width="${arrangement[i]===track?4:2}"/><text x="${p.x}" y="${p.y+4}" fill="white" text-anchor="middle" font-size="12">${arrangement[i]+1}</text></g>`).join('')}</svg>`;
}

export class GroupLab {
  private data = recall(key,{ scene:0, found:[0], visited:[0] });
  private readonly voice = new Narrator();
  private history:number[]=[];
  private comparison:number[]=[];
  private club=[0];
  private h=0;
  private a=1;
  private b=4;
  private c=2;
  private n=5;
  private example='turn';
  private cursor=0;
  private tokens=this.order(5,0);
  private follow=0;
  private arithmetic='integers';
  private cycleVariant='cyclic';
  private cycleStep=0;
  private firstColumn=0;
  private secondColumn=0;
  private cabinetMessage='';
  private tokenSwap=[0,1];
  private note='';
  private resultVisible=false;
  private animation:Animation|null=null;
  private timer:number|null=null;
  constructor(private root:HTMLElement) {
    this.render();
    root.addEventListener('click',this.click);
    root.addEventListener('change',this.change);
  }
  private order(n:number,g:number) { return Array.from({length:n},(_,i)=>act(inverse(g,n),i,n)); }
  private current(seq=this.history) { return seq.reduce((g,h)=>product(h,g),0); }
  private cards(elements:number[]) { return `<span class="orbit-chips">${elements.map(g=>`<span>${moveName(g)}</span>`).join('')}</span>`; }
  private picks(name:string,value:number) { return `<label>${name} <select data-field="${name}">${moves().map(g=>`<option value="${g}" ${g===value?'selected':''}>${moveName(g)}</option>`).join('')}</select></label>`; }
  private action(action:string, label:string,value?:number) { return `<button type="button" class="secondary-button" data-action="${action}" ${value===undefined?'':`data-value="${value}"`}>${label}</button>`; }
  private render() {
    const scene=scenes[this.data.scene]??scenes[0];
    refreshControls(this.root,`<nav class="orbit-steps chapter-scenes" aria-label="Group theory activities">${scenes.map((s,i)=>`<button class="secondary-button" data-action="scene" data-value="${i}" ${s.id===scene.id?'aria-current="step"':''}>${s.title}</button>`).join('')}</nav>
    <section class="workspace chapter-activity"><div class="workspace-top"><h2>${scene.title}</h2></div><div class="lesson-pad">
    <p>${scene.slide}</p>${this.activity(scene.id)}<p class="lesson-message" role="status">${this.note}</p>
    ${transcripts(scene.narration)}
    <div class="orbit-buttons">${this.data.scene>0?this.action('scene','Previous activity',this.data.scene-1):''}${this.data.scene<scenes.length-1?this.action('scene','Next activity',this.data.scene+1):''}</div>
    </div></section>
    <details class="narration-panel curiosity"><summary>Curiosity cabinet</summary><div class="cabinet-grid">${cabinet.map(([title,body],i)=>`<details><summary>${title}${[0,2,3,4].includes(i)?'':' · Preview'}</summary><p>${body}</p>${this.curiosity(i)}</details>`).join('')}</div></details>`);
  }
  private curiosity(index:number):string {
    if(index===0) return `<label>Number system <select data-field="arithmetic">${['integers','rationals','reals'].map(name=>`<option ${this.arithmetic===name?'selected':''}>${name}</option>`).join('')}</select></label>
      <div class="orbit-buttons">${this.action('arithmetic','Try 1 ÷ 2',2)}${this.action('arithmetic','Try 1 ÷ 0',0)}</div>
      <p role="status">${this.cabinetMessage}</p>`;
    if(index===2) return `<label>Try an element <select data-field="cycleVariant"><option value="cyclic">Quarter-turn in C₄</option>
      <option value="klein" ${this.cycleVariant==='klein'?'selected':''}>Half-turn in V₄</option></select></label>
      <div class="orbit-buttons">${this.action('cycle','Apply again')}${this.action('cycle-reset','Reset')}</div>
      <p>${this.cycleStep} applications. ${this.cycleStep>0&&this.cycleStep%(this.cycleVariant==='klein'?2:4)===0?'Back at the identity.':'Try repeating to reach the identity.'}</p>`;
    if(index===3){
      const image=this.order(this.n,0).map(token=>this.tokens.indexOf(token));
      const cycles=cyclesOf(image).filter(cycle=>cycle.length>1).map(cycle=>`(${cycle.map(n=>n+1).join(' ')})`).join('');
      return `<p>Use the bead board in “Clocks and polygons” to compose more shuffles.</p>
      <div class="orbit-buttons">${this.action('example','Rotate beads',0)}${this.action('example','Swap two beads',2)}</div>
      <p>Current cycles: ${cycles||'identity'}. The permutation is ${permutationParity(image)}.</p>`;
    }
    if(index===4){
      const vectors=['(0,0)','(1,0)','(0,1)','(1,1)'];
      const pick=(label:string,field:string,selected:number)=>`<label>${label} <select data-field="${field}">${vectors.map((v,j)=>`<option value="${j}" ${j===selected?'selected':''}>${v}</option>`).join('')}</select></label>`;
      return `<div class="orbit-buttons">${pick('Column 1','firstColumn',this.firstColumn)}${pick('Column 2','secondColumn',this.secondColumn)}</div>
        <p>${this.firstColumn===0?'First choose a nonzero column.':this.secondColumn===0||this.firstColumn===this.secondColumn?'The second column lies in the span of the first. Try a different vector.':'These columns are independent over F₂, so this matrix is invertible.'}</p>
        <details><summary>Generalize</summary><p>For a field of prime-power size q, |GLₙ(Fq)| = (qⁿ − 1)(qⁿ − q) ⋯ (qⁿ − qⁿ⁻¹).</p></details>`;
    }
    return '';
  }
  private activity(id:string):string {
    const group=this.current(), h=subgroups[this.h], g=this.a;
    const subPick=`<label>Subgroup <select data-field="subgroup">${subgroupNames.map((title,i)=>`<option value="${i}" ${i===this.h?'selected':''}>${title}</option>`).join('')}</select></label>`;
    if(id==='square'||id==='action') return `<div class="group-workbench"><div class="group-stage">${diagram(4,this.order(4,group),'Current corner order',id==='action'?this.follow:-1)}</div>
      <div class="group-side"><div class="orbit-buttons">${['Quarter-turn','Mirror','Undo','Reset','Replay'].map((label,i)=>this.action(['move','move','undo','reset','replay'][i],label,[1,4,0,0,0][i])).join('')}</div>
      <p>History, first to last</p>${this.cards(this.history.length?this.history:[0])}
      ${id==='square'?`<p>Distinct moves found: ${this.data.found.length}${this.data.found.length===8?' · All eight!':''}</p>${this.cards(this.data.found)}
      <div class="orbit-buttons">${this.action('save','Pin result for comparison')}${this.action('order','Compare turn then mirror vs. mirror then turn')}</div>`:
      `<label>Follow corner <select data-field="follow">${moves(2).map(i=>`<option value="${i}" ${this.follow===i?'selected':''}>${i+1}</option>`).join('')}</select></label>
      <p>Image labels, starting at corners 1–4: ${[0,1,2,3].map(i=>act(group,i)+1).join(' → ')}</p><p>Your corner lands at position ${act(group,this.follow)+1}.</p>
      <details><summary>Action rules</summary><p>e·x = x and (gh)·x = g·(h·x). This action is faithful. In contrast, every square move can act trivially on a one-point set.</p></details>
      <button class="primary-button" data-lesson="orbit">Explore Orbit Stabilizer →</button>`}</div></div>
      ${id==='square'&&this.comparison.length?`<div class="group-comparison">${diagram(4,this.order(4,this.current(this.comparison)),'Pinned arrangement')}<p>${group===this.current(this.comparison)?'Same transformation':'Different transformations'}</p>${diagram(4,this.order(4,group),'Current arrangement')}</div>`:''}`;
    if(id==='laws') {
      const left=product(product(g,this.b),this.c),right=product(g,product(this.b,this.c));
      return `<div class="orbit-buttons">${this.picks('a',g)}${this.picks('b',this.b)}${this.picks('c',this.c)}${this.action('test','Try the products')}</div>
      <p>Read a ∘ b as “do b first, then a.”</p>
      ${this.resultVisible?`<div class="group-comparison">${diagram(4,this.order(4,product(g,this.b)),'a after b')}${diagram(4,this.order(4,product(this.b,g)),'b after a')}</div>
        <p>a ∘ b = ${moveName(product(g,this.b))}; b ∘ a = ${moveName(product(this.b,g))}. ${product(g,this.b)===product(this.b,g)?'This pair agrees. Try r and s.':'This pair differs, so the group is nonabelian.'}</p>
        <div class="group-comparison"><div><b>(${moveName(g)} ∘ ${moveName(this.b)})</b> ∘ ${moveName(this.c)} = ${moveName(left)}</div>
        <div>${moveName(g)} ∘ <b>(${moveName(this.b)} ∘ ${moveName(this.c)})</b> = ${moveName(right)}</div></div>
        <p>Both groupings use the same three moves in the same order.</p>
        <p>a ∘ a⁻¹ = ${moveName(product(g,inverse(g)))}; a ∘ e = ${moveName(g)}.</p>`:''}
      <details><summary>More mathematics</summary><p>A group has a binary operation G × G → G, an identity, inverses, and associativity. If all pairs commute, the group is abelian.</p></details>`;
    }
    if(id==='examples') return `<div class="group-workbench">${diagram(this.n,this.tokens,'Bead arrangement')}
      <div><label>Size <select data-field="n">${[3,4,5,6,7,8].map(n=>`<option ${n===this.n?'selected':''}>${n}</option>`).join('')}</select></label>
      <div class="orbit-buttons">${this.action('example','Turn',0)}${this.action('example','Flip',1)}${this.action('example','Swap selected tokens',2)}${this.action('example','Advance clock',3)}</div>
      <div class="orbit-buttons">${this.tokenSwap.map((token,i)=>`<label>Swap token ${i===0?'A':'B'} <select data-field="swap${i}">${this.order(this.n,0).map(j=>`<option value="${j}" ${token===j?'selected':''}>${j+1}</option>`).join('')}</select></label>`).join('')}</div>
      <p>${this.example==='swap'?`Token swaps are bijections. The image of each token in order is ${this.order(this.n,0).map(i=>this.tokens.indexOf(i)+1).join(', ')}.`:`Clock: ${this.cursor} modulo ${this.n}. C${this.n} has ${this.n} turns; D${this.n} has ${2*this.n} moves.`}</p></div></div>`;
    if(id==='clubs') return `<div class="orbit-buttons">${moves().map(g=>`<button class="secondary-button" aria-pressed="${this.club.includes(g)}" data-action="member" data-value="${g}">${moveName(g)}</button>`).join('')}</div>
    <div class="orbit-buttons">${this.action('club','Check my club')}${this.action('clock','Add 2 on a six-hour clock')}</div>
    <details><summary>Try a starting idea</summary><ul>${subgroups.map((_,i)=>`<li>${this.action('preset',subgroupNames[i],i)}</li>`).join('')}</ul></details>`;
    if(id==='cosets'||id==='normal') {
      const left=coset(h,g),right=coset(h,g,'right'), conj=conjugate(h,g);
      return `<div class="orbit-buttons">${subPick}${this.picks('a',g)}${this.action('test',id==='cosets'?'Sort the piles':'Compare the sets')}</div>
      ${this.resultVisible?`<div class="group-comparison"><div><b>H</b>${this.cards(h)}</div><div><b>aH</b>${this.cards(left)}</div>${id==='normal'?`<div><b>Ha</b>${this.cards(right)}</div><div><b>aHa⁻¹</b>${this.cards(conj)}</div>`:''}</div>
      ${id==='cosets'?`<p>Watch left multiplication pair the cards:</p><div class="orbit-chips">${h.map(k=>`<span>${moveName(k)} → ${moveName(product(g,k))}</span>`).join('')}</div><div class="group-piles">${partition(h).map(pile=>`<div>${this.cards(pile)}</div>`).join('')}</div><details><summary>Name the pattern</summary><p>These are cosets. Lagrange’s theorem counts ${partition(h).length} piles of size ${h.length}. A subgroup order must divide the group order, but divisibility alone does not guarantee a subgroup exists.</p></details>`:
      `<p>${equalSet(left,right)?'The two cosets agree here.':'These left and right cosets differ.'} ${normal(h)?'This club is normal: the conjugate agrees for every move.':'Try r to see a witness for the single-mirror club.'}</p>`}`:''}`;
    }
    if(id==='quotient') {
      const witness=coset(h,g).flatMap(a=>coset(h,this.b).map(b=>product(a,b)));
      const results=partition(h).filter(pile=>witness.some(p=>pile.includes(p)));
      const counterexample=moves().flatMap(a=>moves().map(b=>[a,b])).find(([a,b])=>
        new Set(coset(h,a).flatMap(x=>coset(h,b).map(y=>partition(h).findIndex(p=>p.includes(product(x,y)))))).size>1);
      return `<div class="orbit-buttons">${subPick}${this.picks('a',g)}${this.picks('b',this.b)}${this.action('test','Compose representatives')}</div>
      <div class="group-piles">${partition(h).map((pile,i)=>`<details><summary>Token ${i+1}${pile.includes(0)?' · identity coset':''}</summary>${this.cards(pile)}</details>`).join('')}</div>
      ${this.resultVisible?`<p>${moveName(g)} ∘ ${moveName(this.b)} = <b>${moveName(product(g,this.b))}</b>. Try different representatives from the same tokens.</p><p>Result piles across all representative choices:</p><div class="group-piles">${results.map(pile=>`<div>${this.cards(pile)}</div>`).join('')}</div>
      <p>${normal(h)?'The product stays in one pile. This is (aH)(bH) = (ab)H.':results.length>1?'Different representatives land in different piles, so this product is ambiguous.':`These particular representatives agree. Try ${moveName(counterexample?.[0]??0)} and ${moveName(counterexample?.[1]??0)} to see a failure.`}</p>`:''}`;
    }
    return `<div class="orbit-buttons">${this.picks('a',g)}${this.picks('b',this.b)}${this.action('test','Send the moves through')}${this.action('kernel','Find the kernel')}${this.action('bad-map','Try a broken translator')}</div>
      ${this.resultVisible?`<div class="group-comparison"><div><b>Compose, then translate</b><p>${moveName(g)} ∘ ${moveName(this.b)} = ${moveName(product(g,this.b))} → ${sign(product(g,this.b))}</p></div>
      <div><b>Translate, then compose</b><p>${sign(g)} × ${sign(this.b)} = ${sign(g)*sign(this.b)}</p></div></div><p>The image is {+1, −1}. Both routes give the same answer.</p>`:''}`;
  }
  private move(g:number) {
    const before=this.current();
    this.history.push(g);
    const after=this.current();
    if(!this.data.found.includes(after)) this.data.found.push(after);
    this.render();
    this.animateMove(before,g);
  }
  private animateMove(before:number,g:number) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const final=this.root.querySelector('.group-stage svg');
    if(!final) return;
    const stage=final.parentElement!;
    stage.innerHTML=diagram(4,this.order(4,before),'Corner order during move');
    const el=stage.firstElementChild!;
    this.animation=el.animate([{transform:'none'},{transform:g<4?`rotate(${-90*g}deg)`:`rotate(${-45-90*(g%4)}deg) scaleY(-1) rotate(45deg)`}],{duration:350});
    this.animation.onfinish=()=>{if(stage.isConnected) stage.replaceChildren(final);};
  }
  private readonly change=(event:Event)=>{
    const el=event.target;
    if(!(el instanceof HTMLSelectElement)) return;
    const v=Number(el.value);
    switch(el.dataset.field) {
      case 'arithmetic':this.arithmetic=el.value;this.cabinetMessage='';break;
      case 'cycleVariant':this.cycleVariant=el.value;this.cycleStep=0;break;
      case 'firstColumn':this.firstColumn=v;break;case 'secondColumn':this.secondColumn=v;break;
      case 'a':this.a=v;break;case 'b':this.b=v;break;case 'c':this.c=v;break;
      case 'subgroup':this.h=v;break;case 'follow':this.follow=v;break;
      case 'n':this.n=v;this.tokens=this.order(v,0);this.tokenSwap=[0,1];this.cursor=0;break;
      case 'swap0':case 'swap1':this.tokenSwap[el.dataset.field==='swap0'?0:1]=v;break;
      default:return;
    }
    this.note='';this.render();
  };
  private readonly click=(event:Event)=>{
    const el=(event.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if(!el) return;
    const {action,value}=el.dataset,v=Number(value);
    if(action==='speak'){this.voice.toggle(scenes[this.data.scene].narration);return;}
    if(action==='stop'){this.voice.stop();return;}
    if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}
    this.note='';
    if(action==='scene'){this.voice.stop();this.data.scene=v;this.resultVisible=false;}
    else if(action==='move') {this.move(v);remember(key,this.data);return;}
    else if(action==='undo') this.history.pop();
    else if(action==='reset') this.history=[];
    else if(action==='save'){this.comparison=this.history.length?[...this.history]:[0];this.note='Pinned the current arrangement.';}
    else if(action==='order'){this.comparison=[1,4];this.history=[4,1];for(const seq of [this.history,this.comparison]) {const x=this.current(seq);if(!this.data.found.includes(x))this.data.found.push(x);}}
    else if(action==='replay'){
      const sequence=[...this.history];this.history=[];this.render();
      let i=0;
      const next=()=>{if(i>=sequence.length){this.timer=null;return;}this.move(sequence[i++]);this.timer=window.setTimeout(next,430);};
      next();return;
    }
    else if(action==='example'){
      if(v===3){this.cursor=(this.cursor+1)%this.n;this.tokens=this.order(this.n,this.cursor);this.example='turn';}
      else if(v===2){const a=this.tokens.indexOf(this.tokenSwap[0]),b=this.tokens.indexOf(this.tokenSwap[1]);[this.tokens[a],this.tokens[b]]=[this.tokens[b],this.tokens[a]];this.example='swap';}
      else {const before=this.tokens;this.tokens=this.order(this.n,v===0?1:this.n).map(i=>before[i]);this.example='turn';}
    }
    else if(action==='member') this.club=this.club.includes(v)?this.club.filter(g=>g!==v):[...this.club,v];
    else if(action==='preset')this.club=[...subgroups[v]];
    else if(action==='club')this.note=subgroupIssue(this.club)??'This club is a subgroup. Every product and undo stays in the club.';
    else if(action==='clock'){this.cursor=(this.cursor+2)%6;this.note=`Clock reading: ${this.cursor}. Keep adding two to find the club {0, 2, 4}.`;}
    else if(action==='arithmetic')this.cabinetMessage=v===0?'Division by zero is undefined in all three examples.':
      this.arithmetic==='integers'?'1/2 is not an integer. Integer arithmetic is a ring, but it is not a field.':'1/2 belongs to this field and multiplying by 2 returns 1.';
    else if(action==='cycle')this.cycleStep++;
    else if(action==='cycle-reset')this.cycleStep=0;
    else if(action==='test')this.resultVisible=true;
    else if(action==='kernel')this.note=`Kernel (moves sent to +1): ${moves().filter(g=>sign(g)===1).map(g=>moveName(g)).join(', ')}. Its two cosets map to +1 and −1.`;
    else if(action==='bad-map')this.note='Send only r to −1 and every other move to +1. Then r² ∘ r maps to +1, but the two separate signs multiply to −1.';
    if(!this.data.visited.includes(this.data.scene))this.data.visited.push(this.data.scene);
    remember(key,this.data);this.render();
    if(action==='test'&&!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.root.querySelectorAll('.group-piles .orbit-chips span').forEach((card,index)=>
        card.animate([{transform:'translateY(-8px)',opacity:.45},{transform:'translateY(0)',opacity:1}],
          {duration:220,delay:index*22,fill:'backwards'}));
    }
  };
  destroy(){this.voice.stop();this.animation?.cancel();if(this.timer!==null)clearTimeout(this.timer);this.root.removeEventListener('click',this.click);this.root.removeEventListener('change',this.change);}
}
