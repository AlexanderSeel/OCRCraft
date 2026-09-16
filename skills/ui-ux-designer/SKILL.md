---
name: ui-ux-designer
description: Professional product and UI/UX design for OCRCraft, focused on fast trainer workflows, responsive layouts, accessibility, information hierarchy and reusable design patterns.
version: 1.0.0
---

# OCRCraft UI/UX Designer

## Mission

Design OCRCraft so a trainer can assemble, adapt and understand a complete training session quickly, including on a tablet in a sports hall. Professional UX means reducing decisions and friction without hiding important safety or training information.

## Primary workflow

The dominant workflow is:

`Choose group -> define goal/context -> generate or assemble -> review warnings -> adjust -> save/use`

Do not optimize Admin screens at the expense of training creation.

## Information hierarchy

Always make these immediately scannable on a training screen:

- group and age range;
- total planned duration;
- warm-up / main part / cooldown;
- block duration or workload;
- training focus;
- equipment/obstacle needs;
- levels or alternatives;
- safety/restriction warnings.

Use progressive disclosure for advanced configuration.

## Interaction principles

- Common tasks should take few interactions.
- Search/add must work by keyboard and touch.
- Replacing an exercise should be easier than deleting and rebuilding a block.
- Preserve context when opening details; avoid unnecessary full-page navigation.
- Provide Undo for destructive editor actions where practical.
- Autosave drafts, but make saved/unsaved state legible.
- Never hide warnings behind color alone.
- Distinguish hard restrictions from recommendations visually and semantically.

## Layout system

For desktop/tablet training editing prefer a three-zone pattern when space permits:

1. library/search;
2. training timeline/canvas;
3. selected-item inspector.

Collapse gracefully on smaller screens rather than shrinking all three columns.

Use consistent spacing and density. OCRCraft is a work application, so avoid oversized marketing UI inside the editor.

## Visual language

Target a modern, robust, athletic feel without looking aggressive or game-like.

- Neutral surfaces and clear hierarchy.
- One strong accent for primary action/focus.
- Restrained status colors.
- Rounded corners should support grouping, not turn every element into a pill.
- Use strong typography and whitespace for phase boundaries.
- Avoid decorative clutter and excessive gradients.

## Components to standardize

Create reusable primitives/patterns for:

- buttons and icon buttons;
- field labels/help/error text;
- chips/tags;
- segmented controls;
- search result rows;
- training phase cards;
- block headers;
- duration controls;
- level/progression selectors;
- empty states;
- warning panels;
- confirmation dialogs;
- body-region selector;
- exercise preview card;
- media tile;
- command/search palette.

## Body map UX

The body selector represents broad training regions, not medical diagnosis.

- front/back view;
- touch-sized hit areas;
- primary/secondary/avoid states;
- textual selected-region list for accessibility;
- keyboard-selectable equivalent control;
- never rely on body graphic color alone.

## Quick Create Wizard

Keep the wizard short by default. Recommended sequence:

1. group/age;
2. duration/location/equipment;
3. goal/body regions;
4. training format/group split;
5. intensity/difficulty;
6. review/generate.

Use smart defaults from the selected club group. Advanced options stay collapsed.

## Accessibility

- Meet WCAG 2.2 AA intent for application UI.
- Visible keyboard focus.
- Semantic headings and landmarks.
- Interactive elements use real buttons/inputs.
- Labels are explicit.
- Minimum touch target approximately 44x44 CSS px where practical.
- Respect reduced motion.
- Keep contrast sufficient in disabled and secondary text states.
- Provide non-visual alternatives for diagrams and drag/drop.

## Responsive behavior

Prioritize:

1. desktop planning;
2. landscape/portrait tablet in the hall;
3. mobile viewing and light editing.

Do not force desktop drag/drop as the only way to construct a session. Every drag action should have a click/tap equivalent.

## Copywriting

Default language is German. Use concise trainer vocabulary:

- `Aufwärmen`
- `Hauptteil`
- `Cooldown`
- `Übung ersetzen`
- `Leichter`
- `Schwerer`
- `Alternative`
- `Ausrüstung`
- `Sicherheitshinweis`

Avoid technical database/AI terminology in normal trainer workflows.

## Review checklist

Before accepting a screen ask:

- Can a trainer identify the next action immediately?
- Is duration visible without mental arithmetic?
- Are destructive actions separated from common actions?
- Is the screen usable by touch and keyboard?
- Does it still work without color perception?
- Are empty/loading/error states intentional?
- Are AI suggestions visibly suggestions, not facts?
- Is the amount of information appropriate for the current task?