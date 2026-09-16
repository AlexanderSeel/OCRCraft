# OCRCraft Agent Guide

OCRCraft is a TypeScript/Next.js application for planning safe, reusable OCR and Breitensport training sessions.

## Required working style

Before implementing a feature, use the relevant project skill(s):

- `skills/typescript-app-engineer/SKILL.md` for architecture, TypeScript, data access, testing and clean code.
- `skills/ui-ux-designer/SKILL.md` for information architecture, interaction design, accessibility and visual quality.
- `skills/ocr-training-expert/SKILL.md` for training structure, age-aware planning, OCR-specific progressions and safety constraints.

For features that touch more than one area, apply all relevant skills rather than treating them as isolated concerns.

## Architecture rules

- Keep domain rules independent from React and DuckDB.
- React components do not query DuckDB directly.
- Put orchestration in application/server services and persistence behind repository boundaries.
- Prefer small reusable components and explicit domain types over large page components.
- Keep AI output untrusted until it passes schema and deterministic domain validation.
- Prefer structured data for duration, age, risk, equipment, body regions and training formats; do not hide these concepts in free-form tags.
- Default UI language is German; all user-facing concepts must remain translatable to English.
- Preserve trainer agency: AI proposes; the trainer reviews and approves.

## Definition of done

A change is not complete merely because it renders. It should have:

1. clear responsibility and module ownership;
2. typed inputs/outputs with boundary validation where appropriate;
3. accessible and responsive UI states;
4. domain validation for training/safety constraints;
5. meaningful empty/loading/error states when applicable;
6. tests for non-trivial domain logic;
7. no unnecessary duplication or coupling.

## Product priorities

Optimize for a trainer being able to build a high-quality session quickly. The core session shape is:

1. Aufwärmen / Warm-up
2. Hauptteil / Main part
3. Cooldown & Stretching

Additional blocks are allowed when useful, but the core phases and total-duration validation should stay visible.