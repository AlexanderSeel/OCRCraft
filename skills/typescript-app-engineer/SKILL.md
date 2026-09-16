---
name: typescript-app-engineer
description: Senior TypeScript application engineering for OCRCraft with clean architecture, separation of concerns, reusable components, modular design, testing and DuckDB integration.
version: 1.0.0
---

# TypeScript App Engineer

## Mission

Develop OCRCraft as a maintainable professional TypeScript application. Favor clarity, explicit boundaries and evolvability over clever abstractions.

## Core principles

### Separation of concerns

Keep these responsibilities distinct:

- `domain/`: business concepts and rules; no React, HTTP or DuckDB imports.
- `components/`: presentational and interaction components.
- `app/`: routes, composition and framework boundaries.
- `server/services/`: use-case orchestration.
- `server/repositories/`: persistence interfaces and DuckDB implementations.
- `server/search/`: indexing, FTS and autocomplete.
- `server/ai/`: provider adapters and structured generation.
- `schemas/`: runtime boundary validation.

Dependencies should point inward toward stable domain concepts.

### Clean code

- Prefer precise names over comments explaining vague names.
- Keep functions small enough to have one obvious responsibility.
- Avoid boolean-parameter APIs when an enum/object makes intent clearer.
- Avoid `any`; use `unknown` at untrusted boundaries and validate it.
- Model domain states explicitly with unions/enums instead of unrelated booleans.
- Avoid premature generic abstractions. Extract only when duplication represents the same concept.
- Prefer pure functions for calculations and validation.
- Return useful typed results rather than throwing for normal validation outcomes.

### TypeScript

- Enable strict mode.
- Prefer discriminated unions for variants such as training block formats.
- Derive types from Zod schemas at external boundaries when practical.
- Use readonly data where mutation is not required.
- Exhaustively handle unions with `never` checks when the domain warrants it.
- Use branded/domain IDs only when they materially prevent category mistakes.

## React / Next.js

- Default to Server Components where no client interaction is required.
- Add `"use client"` only at the smallest interactive boundary.
- Keep page files thin; compose reusable feature components.
- Do not combine data loading, business validation and complex visual rendering in one component.
- Avoid global state unless state genuinely crosses feature boundaries.
- Favor URL/search params for shareable filter state.
- Use server-side authorization for every mutation; UI permission checks are only presentation.

## Components

A reusable component should have:

- one clear visual/interaction responsibility;
- typed props;
- sensible variants rather than copied markup;
- keyboard and screen-reader behavior where interactive;
- loading/disabled/error states if applicable;
- no hidden domain fetches unless it is explicitly a feature container.

Prefer composition over giant option-rich components.

## DuckDB

- Use `@duckdb/node-api` only on the server.
- Centralize instance/connection creation.
- Do not open competing writers to the same database file.
- Serialize application writes through a dedicated write service/queue when write concurrency is introduced.
- Use parameterized SQL for values.
- Keep schema changes in versioned migrations.
- Put SQL/data mapping in repository/search infrastructure, never in UI components.
- Treat FTS rebuild as explicit state because DuckDB FTS does not automatically track table changes.

## Search architecture

Use two layers:

1. structured filters for age, risk, phase, equipment, body regions, format, capacity and similar exact constraints;
2. FTS/BM25 for names, aliases, descriptions, tags and instructions.

Search ranking must never bypass hard eligibility/safety filters.

## AI architecture

- AI providers implement an application-owned interface.
- Retrieve approved exercises/templates before generation.
- Require structured JSON and validate it at runtime.
- Run deterministic training validation after AI output.
- Never write generated master data automatically; generated exercises remain drafts until approved.
- Store generation provenance where useful for audit/debugging.

## Testing

Prioritize tests for:

- duration arithmetic;
- circuit capacity;
- equipment collisions;
- progression/regression selection;
- age/risk restrictions;
- training format calculations;
- search filtering/ranking rules;
- schema validation of AI output.

Use unit tests for pure domain logic, integration tests for DuckDB/search and E2E tests for critical trainer workflows.

## Refactoring test

Before adding a new dependency or abstraction, ask:

- Does this reduce conceptual duplication?
- Does it make the feature easier to test?
- Does it isolate a volatile dependency?
- Would a new developer know where this code belongs?

If not, keep the simpler design.