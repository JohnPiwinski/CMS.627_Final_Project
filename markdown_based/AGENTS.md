# Interactive Artin Algebra

Use the [Artin chapter design skill](.agents/skills/artin-chapter-design/SKILL.md) for new chapters and changes to chapter layout, interactions, or authoring. Chapter Zero is the reference for full-screen workspaces, section labels and subsection dots, Konva.js controls, and short prompts. In this project, interpret dictated “Canva” as Konva.js.

Every chapter's Markdown script should allow optional narration via Tiny-voca using its M2 voice. Author spoken text in stable `:::narration[clip-id]` blocks, keep the transcript identical to the script, and generate the M2 audio with `npm run narration`.

Keep each interactive lesson embed self-contained. Render its visible buttons, boxes, sliders, prompts, and tooltips inside the Konva stage or the Three.js component’s own viewport overlay. Keep that UI in the same coordinate and layering system as its scene so controls and tooltips stay readable. Expose scene actions and state through a small interface, and keep Markdown responsible for the lesson script and narration. Accessible DOM equivalents may invoke the same actions.
