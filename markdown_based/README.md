# Interactive Artin Algebra · Chapter Zero

The game opens in Emmy Noether’s Office. Choose the desk for the Chapter Zero lattice and solids tutorial, the grandfather clock for Introductory Group Theory, the windowsill dodecahedron for Orbit Stabilizer, or the fleur-de-lis shield for Wallpaper Groups. The bottom level list offers the same choices and highlights the corresponding object on hover or keyboard focus.

## Run

Use Node.js 22.18 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Slidev. Build the static game with `npm run build` and serve the output in `dist/`. The bundled lesson MP3s work with standard browser audio playback.

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
```

## Author a chapter

Edit [Chapter Zero](content/chapter-0.md) or the [Introductory Group Theory clock script](content/group-theory.md). Follow the [lesson script format](LESSON_FORMAT.md) and the [chapter design skill](.agents/skills/artin-chapter-design/SKILL.md). The root `slides.md` is a symlink to that document so Slidev discovers the layouts and global layer from the app root.

- Use one `#` chapter heading and `##` section headings. Each `###` subsection gets a navigation dot. End every heading with a unique `{#stable-id}`.
- Put `::scene[square]`, `::scene[triangular]`, or `::scene[solids]` immediately below each subsection heading. A jump starts the named lattice or the cube in its initial pose. The guided Group Theory clock uses `::scene[clock]`.
- Use `::enable[tool,tool]` to declare the tools used by the lesson checkpoints. This list carries into subsequent beats until replaced. The canvas dock keeps the scene’s transformation tools available throughout. Lattice tools are `translate`, `rotate`, and `reflect`. Solid tools are `orbit`, `face`, `edge`, `vertex`, `rotate`, `reflect`, and `choose-solid`.
- Use `::cue[translate]`, `::cue[rotate]`, or `::cue[reflect]` to highlight a dock icon for one beat. The player selects the tool. On the keyboard, focus the dock, use the arrow keys to browse, and press Enter to choose.
- Put contextual Markdown and LaTeX in a `:::display` block. Put the spoken text in `:::narration[stable-id]`. End each block with a line containing `:::`. In the group definition subsection, write each additional display line as `Law name — formula` to render it as a formula row.
- End a beat with `::pause` to wait for Continue or `::wait[event]` to wait for an enabled action. Lattice events are `translated`, `rotated`, `reflected`, and `matched`. Solids use `orbited`, `face-selected`, `edge-selected`, `vertex-selected`, `rotated`, and `reflected`. Use `:::narration[id,auto]` on a manual beat to advance when the student finishes playing its voiceover. The subsection boundary also ends the last beat.

## Narration assets

The preview and build generate missing clips automatically. The development server watches the chapter for edits. To generate directly, run `npm run narration`. Generation needs Bash, Git, [uv](https://docs.astral.sh/uv/), FFmpeg with libmp3lame, and network access on first setup. The included clips let an unchanged chapter run without these authoring dependencies.

The generator uses the [Tiny-voca inference CLI](https://github.com/n4ze3m/tiny-voca#usage) and the [Hugging Face checkpoint and phonemizer](https://huggingface.co/n4ze3m/tiny-voca) with the **M2** voice. It stores Python and model files in `.cache/`, and saves the encoded clips in `public/narration/`. Include the current manifest and referenced MP3s when sharing narration edits. Older content-addressed clips can be deleted after the development server has finished regenerating.

## Runtime

Slidev owns level and subsection navigation. The pre-parser builds the office route, one route per tutorial subsection, and the three chapter routes. A Vue global layer switches between the office and active workspace. Introductory Group Theory opens with a narrated Konva clock lesson. Explore more opens the established clock, square, and element board workspaces. The modular clock supports 2–24 positions, addition, multiplication, distributivity, and factorial remainders. The square has direct turn and mirror gestures, a reorderable move history, and draggable associative brackets. The element board supports subgroup experiments, colored coset tiles, animated conjugation, and the optional orientation quotient. The bottom controls provide keyboard alternatives to the canvas gestures. Orbit Stabilizer and Wallpaper Groups reuse the existing labs in the sibling project. The office is a single WebP illustration with a Konva overlay whose coordinates are defined in `src/office-art.ts`. Within a subsection, the beat index advances independently of the scene instance. Scene transitions dispose of Konva stages, animation frames, Three.js scene resources, and controls. The workspace owns the shared WebGL renderer, with an SVG fallback. Pinia tracks visits and interaction completions in browser storage.
