# Collaborator and agent guide

Start here after cloning the repository or opening it in your coding agent. This guide and the linked project instructions live in Git, so they are available from any account.

## Run the game

Use Node.js 22.18 or newer. From the repository root:

```sh
cd markdown_based
npm ci
npm run dev
```

Open the local URL printed by Slidev. Start from the title screen and follow the menus to Emmy Noether’s Office to choose a lesson.

## Find the code

| Area | Entry point |
| --- | --- |
| Project conventions and design guidance | [Agent instructions](../markdown_based/AGENTS.md) and [Artin chapter design skill](../markdown_based/.agents/skills/artin-chapter-design/SKILL.md) |
| Lesson scripts and authoring format | [Content directory](../markdown_based/content/) and [lesson format](../markdown_based/LESSON_FORMAT.md) |
| Slidev routing and mounted workspace | [Preparser](../markdown_based/setup/preparser.ts) and [global layer](../markdown_based/global-top.vue) |
| Chapter Zero and shared controls | [Tutorial](../markdown_based/src/Tutorial.vue), [tool dock](../markdown_based/src/labs/ToolDock.ts), and [gesture controller](../markdown_based/src/labs/latticeGestures.ts) |
| Group theory | [Clock lesson](../markdown_based/src/ClockLesson.vue) and [group scenes](../markdown_based/src/group/) |
| Orbit Stabilizer | [Chapter workspace](../markdown_based/src/OrbitChapter.vue), [solid viewer](../markdown_based/src/labs/CubeLab.ts), and [symmetry math](../markdown_based/src/lib/symmetry.ts) |
| Wallpaper Groups | [Chapter workspace](../markdown_based/src/WallpaperChapter.vue), [wallpaper scenes](../markdown_based/src/wallpaper/), and [wallpaper math](../markdown_based/src/lib/wallpaper.ts) |

Vue owns lesson state and navigation. Konva draws the 2D activities and controls, and Three.js draws the solids. When editing a scene, trace it from its Markdown scene directive to the Vue workspace and then to the renderer. Reuse the shared controls and gesture logic so pointer, touch, and keyboard behavior stay consistent.

## Edit lessons and narration

Read the lesson format before changing a script. Keep heading and narration IDs stable because the runtime uses them for navigation and audio lookup. Keep spoken explanations short and conversational. For an intuition that fits in one sentence, let the activity carry the detail.

After editing a narration block, run `npm run narration` from `markdown_based/`. Include the updated `src/narration-assets.json` and the new MP3 under `public/narration/` with the script change. The generator uses Tiny-voca’s M2 voice and creates a new filename when the text changes. First-time synthesis needs Bash, Git, uv, FFmpeg with libmp3lame, and network access. The checked-in clips let collaborators run unchanged lessons without setting up synthesis.

## Check and share changes

Run commands from `markdown_based/`.

- `npm run typecheck` checks TypeScript and Vue.
- `npm test` runs the unit tests in `tests/`.
- `npx playwright install chromium` sets up the browser for `npm run test:browser`. Browser specs live in `browser/`.
- `npm run build` creates the static site in `dist/`. For interaction changes, open the affected lesson and try the relevant gesture plus its keyboard equivalent.

The [Pages workflow](../.github/workflows/pages.yml) builds the site under the repository URL with hash routing and publishes changes under `markdown_based/` on `main`. Keep generated build output, dependency directories, and synthesis caches out of Git. When handing off work, point collaborators to the commit or pull request and name the lesson and checks that matter.
