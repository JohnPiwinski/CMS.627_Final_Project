# Lesson Script Format

This file defines the Markdown format used to plan and run lessons in `content/*.md`. A lesson script is both the learner-facing sequence and the source for scene cues and optional narration.

## Comments for authors

Use standard HTML comments for private planning notes:

```md
<!--
Planning note: let learners discover the inverse before naming it.
Open question: should the clock start at 5 or animate there?
-->
```

Comments are removed before the lesson parser runs. They are not shown to learners, spoken, or sent to narration generation. Comments can span multiple lines and can appear between directives or inside a content block. Avoid nesting HTML comments. Use comments for author discussion and unresolved decisions; move settled teaching copy into `:::display` or `:::narration`.

## Document structure

```md
---
title: My Lesson
theme: default
layout: workspace
---

# Chapter title {#chapter-id}

## Section title {#section-id}

### Subsection title {#subsection-id}
::scene[clock]

:::display
Short learner-facing prompt. Math can use KaTeX: $a + b \pmod n$.
:::

:::narration[stable-clip-id]
Optional narration text. This exact text is used for the transcript and M2 voice.
:::
::pause
```

- Use exactly one `#` chapter heading, followed by `##` sections and `###` subsections.
- Every heading needs a unique stable ID in `{#lowercase-words}` form. Subsection IDs drive navigation; narration IDs must also be unique across the lesson.
- Put exactly one `::scene[...]` immediately after every subsection heading. Supported scenes are `square`, `triangular`, `solids`, and `clock`.
- A subsection is made of one or more beats. Each beat can include a display block, narration block, tool declaration, cue, and a final wait directive.
- Keep display prompts short. Use narration for the longer spoken explanation, and retain the same meaning in both modalities.

## Beat directives

### Learner-facing and spoken content

```md
:::display
Text rendered for the learner. Supports Markdown and KaTeX.
:::

:::narration[clip-id]
Spoken text. The clip ID is stable and lowercase with hyphens.
:::
```

Use `:::narration[clip-id,auto]` when the beat should advance after narration finishes. Otherwise, the learner advances with a scene action or Continue. The narration pipeline uses Tiny-voca M2 and generates an MP3 asset; keep the authored narration stable so generated audio stays aligned.

For the group definition slide, write each law in `Law name — $formula$` form inside `:::display`; the slide renderer lays these out as separate formula rows.

### Scene tools and progression

```md
::enable[translate,rotate,reflect]
::cue[translate]
::wait[translated]
```

- `::enable[...]` sets the tools available for the beat and carries into following beats until changed. Lattice scenes support `translate`, `rotate`, and `reflect`. Solids support `orbit`, `face`, `edge`, `vertex`, `rotate`, `reflect`, and `choose-solid`. The guided clock supplies its own controls.
- `::cue[...]` highlights a tool affordance for the beat. Supported cues are `translate`, `rotate`, and `reflect`.
- `::wait[event]` ends the beat and waits for an interaction. Supported events: `translated`, `rotated`, `reflected`, `matched`, `orbited`, `face-selected`, `edge-selected`, and `vertex-selected`. The required tool must be enabled for the event.
- `::pause` ends the beat and waits for the learner to continue.
- A beat without a wait ends when the next beat or subsection begins. A beat cannot combine an automatic narration advance with a gameplay wait.

## Authoring workflow

1. Add an author comment with the learning goal, intended discovery, or open question when planning is still in progress.
2. Outline sections and subsections with stable IDs and choose a scene for each subsection.
3. Write one beat at a time: the learner's action, what changes on screen, and the idea that action should reveal.
4. Add concise display copy, then optional narration. Keep implementation choices out of the transcript unless they help the learner.
5. Use `::wait[...]` when progress depends on a learner action; use `::pause` for a deliberate stopping point.
6. Once the lesson design is settled, remove resolved planning comments. Keep only notes that still help future authors.

## Current limits

The parser supports comments (`<!-- ... -->`) and the directives listed above. It does not yet define syntax for inline design annotations, branches, variables, or arbitrary scene scripting. Build complex interaction behavior in the scene component and keep the Markdown script declarative.
