export const chapterScripts = ['content/chapter-0.md', 'content/group-theory.md', 'content/wallpaper.md', 'content/orbit-stabilizer.md'] as const;
export const scenes = ['square', 'triangular', 'solids', 'clock', 'wallpaper-playground', 'wallpaper-overview', 'wallpaper-domain', 'wallpaper-dissection', 'wallpaper-explanation'] as const;
export type SceneId = typeof scenes[number];
export const tools = ['translate', 'rotate', 'reflect', 'glide', 'orbit', 'face', 'edge', 'vertex', 'choose-solid'] as const;
export type Tool = typeof tools[number];
export const events = ['translated', 'rotated', 'reflected', 'glided', 'matched', 'orbited', 'face-selected', 'edge-selected', 'vertex-selected'] as const;
export type SceneEvent = typeof events[number];
export type Beat = {
  display?: string;
  narration?: { id: string; text: string; auto: boolean };
  tools: Tool[];
  wait?: SceneEvent;
  cue?: 'translate' | 'rotate' | 'reflect' | 'glide';
};
export type Subsection = { id: string; title: string; scene: SceneId; beats: Beat[] };
export type Chapter = { id: string; title: string; sections: { id: string; title: string; subsections: Subsection[] }[] };

const latticeTools: Tool[] = ['translate', 'rotate', 'reflect', 'glide'];
const solidTools: Tool[] = ['orbit', 'face', 'edge', 'vertex', 'rotate', 'reflect', 'choose-solid'];
const requiredTools: Partial<Record<SceneEvent, Tool>> = {
  translated: 'translate', rotated: 'rotate', reflected: 'reflect', glided: 'glide', orbited: 'orbit',
  'face-selected': 'face', 'edge-selected': 'edge', 'vertex-selected': 'vertex',
};

export function parseChapter(markdown: string, file = 'content/chapter-0.md'): Chapter {
  // Lesson comments use HTML comment syntax. Remove them before parsing so
  // planning notes never become visible lesson content or narration.
  const lines = markdown.replace(/\r\n?/g, '\n').replace(/<!--[\s\S]*?-->/g, '').split('\n');
  const ids = new Set<string>();
  let chapter: Chapter | undefined;
  let section: Chapter['sections'][number] | undefined;
  let subsection: Subsection | undefined;
  let beat: Beat = { tools: [] };
  let pending = false;
  let line = 0;
  const fail = (message: string): never => { throw new Error(`${file}:${line + 1}: ${message}`); };
  function reserve(id: string) {
    if (ids.has(id)) fail(`Duplicate ID "${id}"`);
    ids.add(id);
  }
  function finishBeat() {
    if (!subsection) return fail('Expected a subsection');
    if (!pending) fail('Empty beat');
    if (beat.narration?.auto && beat.wait) fail('A beat cannot wait for both narration and gameplay');
    subsection.beats.push(beat);
    beat = { tools: [...beat.tools] };
    pending = false;
  }
  function finishSubsection() {
    if (pending) finishBeat();
    if (subsection && !subsection.beats.length) fail(`Empty subsection "${subsection.id}"`);
    subsection = undefined;
    beat = { tools: [] };
  }
  const firstContentLine = lines.findIndex(value => value.trim());
  if (firstContentLine >= 0 && lines[firstContentLine].trim() === '---') {
    const end = lines.indexOf('---', firstContentLine + 1);
    if (end < 0) fail('Unclosed Slidev headmatter');
    line = end + 1;
  }
  for (; line < lines.length; line++) {
    const value = lines[line].trim();
    if (!value) continue;
    const heading = /^(#{1,3}) (.+?) \{#([a-z][a-z0-9-]*)\}$/.exec(value);
    if (heading) {
      finishSubsection();
      const [, depth, title, id] = heading;
      reserve(id);
      if (depth === '#') {
        if (chapter) fail('Expected exactly one chapter');
        chapter = { id, title, sections: [] };
      } else if (depth === '##') {
        if (!chapter) return fail('Section requires a chapter');
        if (section && !section.subsections.length) fail(`Empty section "${section.id}"`);
        section = { id, title, subsections: [] };
        chapter.sections.push(section);
      } else {
        if (!section) return fail('Subsection requires a section');
        const scene = /^::scene\[([^\]]+)\]$/.exec(lines[line + 1]?.trim() ?? '')?.[1] as SceneId;
        if (!scenes.includes(scene)) fail('Expected ::scene[square|triangular|solids|clock] immediately after subsection heading');
        subsection = { id, title, scene, beats: [] };
        section.subsections.push(subsection);
        line++;
      }
      continue;
    }
    if (!subsection) return fail('Expected a heading with a stable ID');
    const block = /^:::(display|narration\[([a-z][a-z0-9-]*)(,auto)?\])$/.exec(value);
    if (block) {
      const start = line;
      const body: string[] = [];
      while (++line < lines.length && lines[line].trim() !== ':::') body.push(lines[line]);
      const content = body.join('\n').trim();
      if (line === lines.length || !content) { line = start; fail('Expected a nonempty block closed by :::'); }
      if (block[1] === 'display') {
        if (beat.display) fail('Duplicate display block');
        beat.display = content;
      } else {
        if (beat.narration) fail('Duplicate narration block');
        reserve(block[2]);
        beat.narration = { id: block[2], text: content, auto: Boolean(block[3]) };
      }
      pending = true;
      continue;
    }
    const enable = /^::enable\[([^\]]+)\]$/.exec(value);
    if (enable) {
      const enabled = enable[1].split(',').map(tool => tool.trim() as Tool);
      const allowed = subsection.scene === 'clock' ? [] : subsection.scene === 'solids' ? solidTools : latticeTools;
      if (enabled.some(tool => !allowed.includes(tool))) fail('Tool is unsupported in this scene');
      beat.tools = [...new Set(enabled)];
      pending = true;
      continue;
    }
    const cue = /^::cue\[(translate|rotate|reflect|glide)\]$/.exec(value)?.[1] as Beat['cue'];
    if (cue) {
      if (subsection.scene === 'solids' && (cue === 'translate' || cue === 'glide')) fail('Tool is unsupported in this scene');
      beat.cue = cue;
      pending = true;
      continue;
    }
    const wait = /^::wait\[([^\]]+)\]$/.exec(value)?.[1] as SceneEvent | undefined;
    if (wait) {
      const tool = requiredTools[wait];
      if (!events.includes(wait) || (tool && !beat.tools.includes(tool)) ||
          (wait === 'matched' && (subsection.scene === 'solids' || !beat.tools.length))) {
        fail('Event is unsupported or its tool is disabled');
      }
      beat.wait = wait;
    }
    if (wait || value === '::pause') finishBeat();
    else fail(`Unknown directive: ${value}`);
  }
  finishSubsection();
  if (!chapter || !section?.subsections.length) return fail('Chapter requires a section with a subsection');
  return chapter;
}

export function narrationEntries(chapter: Chapter) {
  return chapter.sections.flatMap(section => section.subsections.flatMap(subsection =>
    subsection.beats.flatMap(beat => beat.narration ? [beat.narration] : [])));
}
