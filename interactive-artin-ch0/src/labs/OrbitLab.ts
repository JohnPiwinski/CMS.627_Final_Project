import { CubeLab } from './CubeLab';
import { solidGroups, type Solid } from '../lib/solids';
import { featureCounts, identify, symmetryGroup } from '../lib/symmetry';
import { newTrial, recordMove, trialKey, type Trial } from '../lib/discovery';
import { observationHints, orbitScenes, patternHints } from '../lib/orbitLesson';
import type { Feature } from '../lib/lesson';

const STORAGE = 'artin-orbit-lab-v1';
const solids = solidGroups.flatMap(group => [...group.solids]);
const types: Feature[] = ['face', 'edge', 'vertex'];
const terms = ['Orbit', 'Stabilizer', 'Group size'];
type State = { scene: number; solid: Solid; type: Feature | null; rotationsOnly: boolean; discovered: boolean; trials: Record<string, Trial> };
const initial = (): State => ({ scene: 0, solid: 'Tetrahedron', type: null, rotationsOnly: false, discovered: false, trials: {} });

export class OrbitLab {
  private readonly viewer: CubeLab;
  private state = initial();
  private tool: 'rotate' | 'reflect' = 'rotate';
  private hints = 0;
  private patternHint = 0;
  private speech = false;
  private readonly panel: HTMLElement;
  private readonly notes: HTMLElement;
  private readonly hint: HTMLElement;

  constructor(private readonly root: HTMLElement) {
    try {
      const saved = localStorage.getItem(STORAGE);
      if (saved) this.state = JSON.parse(saved) as State;
    } catch { /* Storage may be unavailable. */ }
    this.panel = root.querySelector('#orbit-controls')!;
    this.notes = root.querySelector('#orbit-notes')!;
    this.hint = root.querySelector('#orbit-hint')!;
    this.viewer = new CubeLab(root.querySelector('#orbit-view')!);
    this.viewer.enableInvestigation();
    this.viewer.onHint = message => this.say(message);
    this.viewer.onTrack = (type, feature) => this.track(type, feature);
    this.viewer.onTransform = matrix => {
      const trial = this.trial;
      if (!trial) return;
      const group = symmetryGroup(trial.solid);
      const match = identify(group.vertices, matrix);
      const symmetry = match && group.elements.get(match.key);
      if (!symmetry || (trial.rotationsOnly && !['identity', 'rotation'].includes(symmetry.kind))) {
        this.restorePose();
        this.say('That move did not land on a symmetry in this trial.');
        return;
      }
      const result = recordMove(trial, symmetry);
      this.restorePose();
      this.render();
      this.say(result.fixes ? result.freshSymmetry ? 'Your feature stayed in place. New symmetry recorded!'
        : 'Your feature stayed in place. You already recorded this symmetry.'
        : result.freshPosition ? 'New position visited!' : 'Your feature returned to a visited position.');
    };
    this.viewer.setSolid(this.state.solid);
    this.restorePose();
    this.render();
    root.addEventListener('click', this.click);
    root.addEventListener('change', this.change);
    root.addEventListener('input', this.input);
  }

  private get trial(): Trial | undefined {
    const { solid, type, rotationsOnly, trials } = this.state;
    return type ? trials[trialKey(solid, type, rotationsOnly)] : undefined;
  }

  private save(): void {
    try { localStorage.setItem(STORAGE, JSON.stringify(this.state)); } catch { /* Optional persistence. */ }
  }
  private say(message: string): void { this.hint.textContent = message; }
  private restorePose(): void {
    const trial = this.trial;
    const group = symmetryGroup(this.state.solid);
    const pose = trial ? group.elements.get(trial.history.at(-1)!) ?? group.identity : group.identity;
    this.viewer.setTrialPose(pose.matrix);
    if (trial) {
      const visited = group.features[trial.type].flatMap((_, index) =>
        trial.visited.includes(group.image(trial.type, index, pose)) ? [index] : []);
      this.viewer.showTracking({ type: trial.type, index: trial.feature }, visited);
    } else this.viewer.showTracking(null, []);
  }

  private track(type: Feature, index: number): void {
    this.state.type = type;
    const key = trialKey(this.state.solid, type, this.state.rotationsOnly);
    this.state.trials[key] ??= newTrial(this.state.solid, type, index, this.state.rotationsOnly);
    this.restorePose();
    this.render();
    const trial = this.trial!;
    this.say(trial.feature === index ? `Following ${type} ${index + 1}. Pick an axis or mirror to move the solid.`
      : `Reopened your saved investigation of ${type} ${trial.feature + 1}.`);
  }

  private render(): void {
    this.save();
    const { scene, solid, rotationsOnly, discovered } = this.state;
    const trial = this.trial;
    const current = orbitScenes[scene];
    this.viewer.setInspectionOnly(scene === 0, scene > 0 && !trial);
    const toggle = (value: boolean) => value ? ' aria-pressed="true" class="selected"' : ' aria-pressed="false"';
    this.panel.innerHTML = `
      <label class="mini-label" for="orbit-solid">PLATONIC SOLID</label>
      <select id="orbit-solid" class="solid-picker">${solidGroups.map(group => `<optgroup label="${group.label}">${group.solids.map(s => `<option ${s === solid ? 'selected' : ''}>${s}</option>`).join('')}</optgroup>`).join('')}</select>
      ${scene ? `<label class="mini-label" for="orbit-mode">SYMMETRIES TO EXPLORE</label>
      <select id="orbit-mode" class="solid-picker"><option value="all">All symmetries</option><option value="rotations" ${rotationsOnly ? 'selected' : ''}>Rotations only</option></select>
      <div class="orbit-buttons"><button data-orbit="track" class="secondary-button">Pick feature in scene</button></div>
      <details class="orbit-details"><summary>Choose by feature type</summary><div class="orbit-buttons">${types.map(type => `<button class="secondary-button" data-orbit="track-type" data-value="${type}">${type}</button>`).join('')}</div></details>
      ${trial ? `<p><b>Following ${trial.type} ${trial.feature + 1}</b></p>
      <div class="segmented"><button data-orbit="rotate"${toggle(this.tool === 'rotate')}>Rotate</button>
      <button data-orbit="reflect"${toggle(this.tool === 'reflect')} ${rotationsOnly ? 'disabled' : ''}>Reflect</button></div>
      <details class="orbit-details"><summary>Choose an axis without a mouse</summary><div class="orbit-buttons">${types.map(type => `<button class="secondary-button" data-orbit="axis" data-value="${type}">${type}</button>`).join('')}</div></details>
      <div class="orbit-buttons"><button class="secondary-button" data-orbit="undo" ${trial.history.length <= 1 ? 'disabled' : ''}>Undo</button>
      <button class="secondary-button" data-orbit="reset">Reset trial</button></div>
      <div class="orbit-collection"><b>Visited positions</b><div class="orbit-chips">${trial.visited.map(index => `<span>${trial.type} ${index + 1}</span>`).join('')}</div></div>
      ${scene >= 2 ? this.collection(trial) : ''}` : ''}` : ''}
      <button class="quiet-button orbit-reset-view" data-orbit="view">Reset camera</button>`;
    this.notes.innerHTML = `
      <nav class="orbit-steps" aria-label="Investigation scenes">${orbitScenes.map((item, index) =>
        `<button class="secondary-button" data-orbit="scene" data-value="${index}" ${index === scene ? 'aria-current="step"' : ''}>${item.title}</button>`).join('')}</nav>
      <h2>${current.title}</h2><p>${current.prompt}</p>
      ${scene === 0 ? this.reference() : ''}
      ${scene >= 3 ? this.table() : ''}
      ${scene === 4 && !discovered ? this.conjecture() : ''}
      ${discovered && scene >= 4 ? `<div class="success-card orbit-reveal"><b>You discovered the orbit–stabilizer theorem!</b><p>Orbit size × stabilizer size = group size.</p><details><summary>Mathematical statement</summary><p>For a finite group G acting on a set, the orbit Orb(x) contains all images of x and the stabilizer Gₓ contains all elements that fix x. Then |Orb(x)| × |Gₓ| = |G|.</p></details></div>` : ''}
      ${scene === 5 && trial ? this.compare(trial) : ''}
      ${scene === 5 ? `<details class="orbit-details"><summary>Compare the two categories</summary><p>Include the identity with rotations. For the stabilizer of a vertex, edge, or face here, the number of rotations equals the number of plane reflections. In the full group, some orientation-reversing elements are compositions rather than single plane reflections.</p><p>A fixed reflection in the stabilizer pairs its orientation-preserving elements with its orientation-reversing elements. The rotation subgroup has index two in the full symmetry group.</p></details>` : ''}
      <details class="orbit-details"><summary>Listen or read</summary><p>${current.narration}</p><button class="secondary-button" data-orbit="speak">Play narration</button><button class="quiet-button" data-orbit="stop">Stop</button></details>
      <div class="orbit-buttons"><button class="secondary-button" data-orbit="scene" data-value="${scene - 1}" ${scene === 0 ? 'disabled' : ''}>Previous</button><button class="primary-button" data-orbit="scene" data-value="${scene + 1}" ${scene === 5 ? 'disabled' : ''}>Continue</button></div>
      <details class="orbit-details"><summary>Lesson settings</summary><button class="secondary-button" data-orbit="restart">Restart investigation</button></details>`;
    this.say(current.prompt);
  }

  private collection(trial: Trial): string {
    const { elements } = symmetryGroup(trial.solid);
    const categories = [['identity', 'Identity'], ['rotation', 'Turns'], ['reflection', 'Mirrors']] as const;
    return `<div class="orbit-collection"><b>Symmetries that fix the starting feature</b>${categories.map(([kind, title]) => {
      const found = trial.saved.filter(key => elements.get(key)?.kind === kind);
      return `<div class="orbit-category"><small>${title}</small><div class="orbit-chips">${found.map((key, index) =>
        `<button class="secondary-button" data-orbit="replay" data-value="${key}">${kind === 'identity' ? 'Do nothing' : `${title === 'Turns' ? 'Turn' : 'Mirror'} ${index + 1}`}</button>`).join('') || '<span>None recorded</span>'}</div></div>`;
    }).join('')}</div>`;
  }

  private compare(trial: Trial): string {
    const { elements } = symmetryGroup(trial.solid);
    const kinds = trial.saved.map(key => elements.get(key)?.kind);
    const rotations = kinds.filter(kind => kind === 'identity' || kind === 'rotation').length;
    const mirrors = kinds.filter(kind => kind === 'reflection').length;
    return `<div class="orbit-collection"><b>Your recorded symmetries</b><div class="orbit-chips">
      <span>Rotations, including identity: ${rotations}</span>
      ${trial.rotationsOnly ? '<span>Switch to All symmetries to investigate mirrors.</span>' : `<span>Plane reflections: ${mirrors}</span>`}
    </div></div>`;
  }

  private reference(): string {
    return `<div class="orbit-table"><table><thead><tr><th>Solid</th><th>Rotations</th><th>All symmetries</th></tr></thead><tbody>${solids.map(s =>
      `<tr><th>${s}</th><td>${featureCounts(s, 'face', true).group}</td><td>${featureCounts(s, 'face', false).group}</td></tr>`).join('')}</tbody></table></div>`;
  }

  private table(): string {
    const { trials, discovered } = this.state;
    const rows = Object.entries(trials);
    return `<p class="control-intro">Try about four cases across three solids and two feature types. Entries save as you type.</p>
      <div class="orbit-table"><table><thead><tr><th>Solid / feature</th><th>Mode</th><th>Orbit</th><th>Stabilizer</th><th>Group size</th>${discovered ? '<th>Compare</th>' : ''}<th>Status</th></tr></thead>
      <tbody>${rows.map(([key, row]) => {
        const group = featureCounts(row.solid, row.type, row.rotationsOnly).group;
        return `<tr><th><button class="quiet-button" data-orbit="revisit" data-value="${key}">${row.solid} / ${row.type}</button></th>
          <td>${row.rotationsOnly ? 'Rotations' : 'All'}</td>${(['orbit', 'stabilizer'] as const).map(field =>
            `<td><input type="number" min="1" max="120" step="1" aria-label="${row.solid} ${row.type} ${field} (${row.rotationsOnly ? 'rotations' : 'all symmetries'})" data-row="${key}" data-field="${field}" value="${row[field] === '' ? '' : Number(row[field])}"></td>`).join('')}
          <td>${group}</td>${discovered ? `<td>${row.orbit && row.stabilizer ? Number(row.orbit) * Number(row.stabilizer) : '—'}</td>` : ''}
          <td data-status="${key}">${row.checked ? 'Checked' : 'Draft'}</td></tr>`;
      }).join('')}</tbody></table></div>
      ${rows.length ? '<div class="orbit-buttons"><button class="secondary-button" data-orbit="check">Check observations</button><button class="quiet-button" data-orbit="hint">Hint</button><button class="quiet-button" data-orbit="reveal" hidden>Reveal current counts</button></div>' : '<p>Pick a feature to start your first row.</p>'}
      <p id="orbit-feedback" role="status"></p>`;
  }

  private conjecture(): string {
    const options = '<option value="">Choose…</option>' + terms.map(t => `<option>${t}</option>`).join('');
    return `<div class="orbit-buttons orbit-equation"><select id="orbit-left" aria-label="First quantity">${options}</select>
      <select id="orbit-operator" aria-label="Operation"><option value="">Operation…</option><option>+</option><option>−</option><option>×</option><option>÷</option></select>
      <select id="orbit-right" aria-label="Second quantity">${options}</select><span>=</span><select id="orbit-result" aria-label="Result">${options}</select></div>
      <div class="orbit-buttons"><button class="primary-button" data-orbit="conjecture">Test my conjecture</button><button class="quiet-button" data-orbit="pattern-hint">Pattern hint</button></div>`;
  }

  private feedback(message: string): void {
    const feedback = this.notes.querySelector('#orbit-feedback');
    if (feedback) feedback.textContent = message;
  }

  private readonly input = (event: Event): void => {
    const element = event.target;
    if (!(element instanceof HTMLInputElement)) return;
    const row = this.state.trials[element.dataset.row ?? ''];
    const field = element.dataset.field;
    if (!row || (field !== 'orbit' && field !== 'stabilizer')) return;
    row[field] = element.value;
    row.checked = false;
    const status = element.closest('tr')?.querySelector('[data-status]');
    if (status) status.textContent = 'Draft';
    this.save();
  };

  private readonly change = (event: Event): void => {
    const element = event.target;
    if (!(element instanceof HTMLSelectElement)) return;
    if (element.id === 'orbit-solid') {
      this.state.solid = element.value as Solid;
      this.viewer.setSolid(this.state.solid);
    } else if (element.id === 'orbit-mode') {
      this.state.rotationsOnly = element.value === 'rotations';
      if (this.state.rotationsOnly) this.tool = 'rotate';
      this.viewer.setMode(this.tool);
    } else return;
    this.restorePose();
    this.render();
  };

  private readonly click = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-orbit]');
    if (!button) return;
    const value = button.dataset.value ?? '';
    const trial = this.trial;
    const action = button.dataset.orbit;
    if (action === 'scene') {
      const index = Number(value);
      if (!orbitScenes[index]) return;
      this.stop();
      this.state.scene = index;
      this.restorePose();
      this.render();
    } else if (action === 'track') this.viewer.chooseTrackedFeature();
    else if (action === 'track-type' || action === 'axis') this.viewer.selectFeatureByType(value as Feature, action === 'track-type');
    else if (action === 'rotate' || action === 'reflect') {
      this.tool = action;
      this.viewer.setMode(action);
      this.panel.querySelectorAll<HTMLElement>('.segmented button').forEach(choice => {
        const active = choice.dataset.orbit === action;
        choice.classList.toggle('selected', active);
        choice.setAttribute('aria-pressed', String(active));
      });
    } else if (action === 'replay') {
      if (!trial || !trial.saved.includes(value)) return;
      const group = symmetryGroup(trial.solid);
      const target = group.elements.get(value);
      if (!target) return;
      if (target.kind === 'identity') {
        recordMove(trial, target);
        this.restorePose();
        this.render();
        this.say('The identity leaves the solid in its starting pose.');
      } else if (this.viewer.playSavedSymmetry(target.matrix)) {
        this.say('Replaying the saved symmetry from the starting pose.');
      }
    } else if (action === 'undo' || action === 'reset') {
      if (!trial) return;
      if (action === 'undo' && trial.history.length > 1) trial.history.pop();
      if (action === 'reset') trial.history = [symmetryGroup(trial.solid).identity.key];
      this.restorePose();
      this.render();
      this.say(action === 'undo' ? 'Undid the last move. Your observations are still saved.'
        : 'Starting pose restored. Your observations are still saved.');
    } else if (action === 'view') this.viewer.resetView();
    else if (action === 'revisit') {
      const row = this.state.trials[value];
      if (!row) return;
      this.state.solid = row.solid;
      this.state.type = row.type;
      this.state.rotationsOnly = row.rotationsOnly;
      if (row.rotationsOnly) this.tool = 'rotate';
      this.viewer.setSolid(row.solid);
      this.viewer.setMode(this.tool);
      this.restorePose();
      this.render();
      this.say(`Reopened your ${row.solid.toLowerCase()} ${row.type} investigation.`);
    } else if (action === 'check') {
      const filled = Object.values(this.state.trials).filter(row => row.orbit && row.stabilizer);
      for (const row of filled) {
        const expected = featureCounts(row.solid, row.type, row.rotationsOnly);
        row.checked = Number(row.orbit) === expected.orbit && Number(row.stabilizer) === expected.stabilizer;
      }
      this.render();
      const correct = filled.filter(row => row.checked).length;
      this.feedback(!filled.length ? 'Enter both counts in a row first.' : correct === filled.length
        ? `${correct} checked ${correct === 1 ? 'row agrees' : 'rows agree'} with the symmetries.`
        : `${correct} of ${filled.length} rows agree. Check your distinct positions and look for repeated symmetries.`);
    } else if (action === 'hint') {
      this.feedback(observationHints[Math.min(this.hints++, observationHints.length - 1)]);
      const reveal = this.notes.querySelector<HTMLButtonElement>('[data-orbit="reveal"]');
      if (reveal && this.hints >= observationHints.length && trial) reveal.hidden = false;
    } else if (action === 'reveal' && trial) {
      const expected = featureCounts(trial.solid, trial.type, trial.rotationsOnly);
      this.feedback(`For this selection, there are ${expected.orbit} positions and ${expected.stabilizer} symmetries that fix it.`);
    } else if (action === 'pattern-hint') {
      this.feedback(patternHints[Math.min(this.patternHint++, patternHints.length - 1)]);
    } else if (action === 'conjecture') this.testConjecture();
    else if (action === 'speak' && 'speechSynthesis' in window) {
      this.stop();
      this.speech = true;
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(orbitScenes[this.state.scene].narration));
    } else if (action === 'stop') this.stop();
    else if (action === 'restart' && window.confirm('Clear the saved observations in this investigation?')) {
      this.stop();
      this.state = initial();
      this.hints = this.patternHint = 0;
      this.tool = 'rotate';
      this.viewer.setSolid(this.state.solid);
      this.viewer.setMode('rotate');
      this.restorePose();
      this.render();
    }
  };

  private testConjecture(): void {
    const get = (id: string) => this.notes.querySelector<HTMLSelectElement>(id)?.value;
    const left = get('#orbit-left'), right = get('#orbit-right'), result = get('#orbit-result'), op = get('#orbit-operator');
    if (!left || !right || !result || !op) { this.feedback('Choose three quantities and an operation.'); return; }
    const checked = Object.values(this.state.trials).filter(row => row.checked);
    if (checked.length < 2) { this.feedback('Check at least two rows before testing a relationship.'); return; }
    const multiply = (a: string, b: string) => new Set([a, b]).size === 2 && [a, b].includes('Orbit') && [a, b].includes('Stabilizer');
    const valid = (op === '×' && result === 'Group size' && multiply(left, right))
      || (op === '÷' && left === 'Group size' && multiply(right, result));
    if (!valid) { this.feedback('Try a relationship that holds across your different cases.'); return; }
    this.state.discovered = true;
    this.render();
    this.feedback('Your relationship works across the checked rows.');
  }

  private stop(): void {
    if (this.speech) window.speechSynthesis.cancel();
    this.speech = false;
  }
  destroy(): void {
    this.stop();
    this.root.removeEventListener('click', this.click);
    this.root.removeEventListener('change', this.change);
    this.root.removeEventListener('input', this.input);
    this.viewer.destroy();
  }
}
