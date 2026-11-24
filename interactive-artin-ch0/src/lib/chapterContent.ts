export function parseScenes(markdown: string) {
  const sections = markdown.trim().split(/^## /m).slice(1);
  const seen = new Set<string>();
  return sections.map(section => {
    const match = /^([a-z]+) \| ([^\n]+)\n### Slide\n([\s\S]+?)\n### Narration\n([\s\S]+)$/.exec(section.trim());
    if (!match || seen.has(match[1])) throw new Error('Missing, malformed, or duplicate lesson section');
    const [, id, title, slide, narration] = match;
    seen.add(id);
    for (const text of [title, slide, narration]) {
      if (/[<>]/.test(text)) throw new Error(`Unsupported markup in ${id}`);
    }
    return { id, title, slide: slide.trim(), narration: narration.trim() };
  });
}
export function recall<T>(key:string,fallback:T):T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') as T ?? fallback; }
  catch { return fallback; }
}
export function remember(key:string,state:unknown):void {
  try { localStorage.setItem(key,JSON.stringify(state)); } catch { /* Browser storage is optional. */ }
}
export function transcripts(text:string):string {
  return `<details class="orbit-details"><summary>Listen or read</summary><p>${text}</p>
    <button class="secondary-button" data-action="speak">Play / pause</button>
    <button class="quiet-button" data-action="stop">Stop</button></details>`;
}
export class Narrator {
  private utterance: SpeechSynthesisUtterance|null = null;
  toggle(text:string) {
    if (!('speechSynthesis' in window)) return;
    if (this.utterance) {
      if (speechSynthesis.paused) speechSynthesis.resume(); else speechSynthesis.pause();
      return;
    }
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.onend = this.utterance.onerror = () => { this.utterance = null; };
    speechSynthesis.speak(this.utterance);
  }
  stop() { if (this.utterance) speechSynthesis.cancel(); this.utterance = null; }
}

/** Keep focus on the equivalent control when an activity updates its output. */
export function refreshControls(host:HTMLElement,html:string):void {
  const active = document.activeElement;
  const control = active instanceof HTMLElement && host.contains(active) ? active : null;
  const opens = [...host.querySelectorAll('details[open]')].map(el=>el.querySelector('summary')?.textContent);
  host.innerHTML=html;
  host.querySelectorAll('details').forEach(el=>{
    if(opens.includes(el.querySelector('summary')?.textContent))el.open=true;
  });
  if (!control) return;
  const next=[...host.querySelectorAll<HTMLElement>('button, input, select, summary')].find(el=>
    el.tagName===control.tagName && el.dataset.action===control.dataset.action &&
    el.dataset.field===control.dataset.field && el.dataset.value===control.dataset.value &&
    el.dataset.display===control.dataset.display &&
    (el.tagName!=='SUMMARY'||el.textContent===control.textContent));
  next?.focus({preventScroll:true});
}
