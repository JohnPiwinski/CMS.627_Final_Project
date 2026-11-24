---
name: artin-chapter-design
description: Design and update Interactive Artin Algebra chapters using Chapter Zero’s full-screen layout, Konva interaction controls, Markdown scripts, and Tiny-voca M2 narration.
---

Use Chapter Zero as the design reference when creating or restyling chapters in this project. Inspect its actual workspace in `src/Tutorial.vue`, `src/workspace.css`, and `src/labs/ToolDock.ts` before choosing a layout.

- Keep the mathematical scene central. Use a full-screen workspace with named sections and subsection dots across the top, contextual controls near the scene, and a centered bottom tool dock. Match Chapter Zero’s dark chrome, light workspace, and restrained highlight colors.
- Render new visible lesson controls in Konva.js. Keep Three.js for 3D scenes. Build toolbars, prompts, and tooltips inside the self-contained scene viewport. Draw Konva overlays last so they stay above the scene. Provide keyboard and assistive technology equivalents mapped to the same actions as pointer input.
- Put short instructional beats and optional narration in the chapter’s Markdown script. Use stable heading IDs for section and dot navigation, and stable IDs in `:::narration[clip-id]` blocks. A cue can highlight an affordance without flashing.
- Generate narration with the project’s Tiny-voca M2 pipeline. Use the authored block verbatim for both transcript and synthesis. Run `npm run narration` and verify playback, replay, and cancellation when navigating.
- Lead with direct manipulation and immediate feedback. Let actions reveal the next idea. Keep written prompts brief and use narration or a transcript for longer explanations.
- Compare the finished workspace to Chapter Zero at wide and narrow sizes. Verify dot navigation, pointer and keyboard interaction, and the behavior when the learner returns to the office.
