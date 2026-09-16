# OCRCraft — Implementation Plan

> **Primary language:** German (`de-DE`) · **Secondary:** English (`en`)  
> **Stack:** TypeScript · Next.js/React · Tailwind CSS · DuckDB · DuckDB FTS  
> **Training framework:** LSB/DOSB-oriented Breitensport principles + OCR-specific and configurable club rules

## Legend

- [x] implemented on `main`
- [ ] open
- Partial features are split into smaller checkable tasks instead of using an ambiguous status.

---

## 1. Foundation & architecture

- [x] Next.js App Router + React + TypeScript
- [x] Tailwind CSS design foundation
- [x] strict separation: UI → services → repositories → DuckDB
- [x] framework-independent training domain
- [x] DuckDB Node integration
- [x] versioned migration runner
- [x] CI: lint, typecheck, tests, production build
- [x] Clean-Code / modular TypeScript project skill
- [x] professional UI/UX project skill
- [x] OCR + LSB Breitensport training project skill
- [x] `AGENTS.md` project rules
- [ ] authentication
- [ ] RBAC authorization
- [ ] production deployment setup

## 2. Training domain & deterministic rules

- [x] typed training sessions
- [x] required phases: Warm-up → Main Part → Cooldown
- [x] duration validation
- [x] basic audience/risk validation
- [x] domain unit tests
- [ ] station-capacity validation
- [ ] simultaneous equipment-conflict validation
- [ ] transition/setup-time validation
- [ ] age-specific club-rule engine
- [ ] progression/regression validation
- [ ] recent-use/load rules

## 3. DuckDB data model

- [x] exercises
- [x] DE/EN translations
- [x] aliases
- [x] body regions
- [x] movement patterns
- [x] tags
- [x] equipment mappings
- [x] club-group foundation
- [x] training sessions/phases/items
- [x] DE/EN search documents
- [x] FTS index state (`healthy/dirty/rebuilding/failed`)
- [x] DB bootstrap on first server use
- [x] real In-Memory-DuckDB migration test
- [ ] training version snapshots
- [ ] favorites/recent use
- [ ] templates
- [ ] users/roles
- [ ] media metadata
- [ ] audit log
- [ ] AI generation/source history

## 4. Initial database / exercise pool

A fresh OCRCraft DB must be useful immediately and must not start empty.

### Validated coverage

- [x] **140+ initial exercises** — enforced by CI
- [x] **25+ running exercises** — enforced by CI
- [x] 11+ functional/OCR categories
- [x] German + English content
- [x] stable unique `seed_key`
- [x] common aliases
- [x] equipment catalogue
- [x] body-region catalogue
- [x] movement patterns
- [x] tags
- [x] DE/EN search documents
- [x] duplicate seed protection

### Exercise areas

- [x] Warm-up
- [x] Mobility / Movement Preparation
- [x] Functional Strength
- [x] Core
- [x] Running
- [x] Grip & Rig
- [x] Carries & Lifts
- [x] OCR Skills / Obstacles
- [x] Balance & Agility
- [x] Throwing
- [x] Cooldown / Stretching

### Running pool

- [x] Easy / continuous run
- [x] Run-Walk
- [x] Tempo run
- [x] Fartlek / Fahrtspiel
- [x] short + long intervals
- [x] hill repeats
- [x] shuttle runs
- [x] strides / Steigerungsläufe
- [x] acceleration/deceleration drills
- [x] A-Skip / B-Skip
- [x] Ankling
- [x] Lauf-ABC high knees / butt kicks
- [x] bounding / Sprunglauf
- [x] cadence run
- [x] cone slalom / lateral running
- [x] relay
- [x] trail running
- [x] stair running
- [x] `every 100 m -> exercise`
- [x] run-to-obstacle transitions
- [ ] pace/HR-zone prescription
- [ ] GPS/route-aware sessions

### OCR pool

- [x] dead/active/towel/ring hangs
- [x] monkey bars / traverse
- [x] rope grip + rope climb
- [x] rig transitions
- [x] farmer + suitcase carry
- [x] sandbag variants
- [x] bucket + atlas carry
- [x] sled/tire drag + tire flip
- [x] crawls
- [x] walls / wall transitions
- [x] cargo net
- [x] rope traverse
- [x] Rig & Run
- [x] balance obstacles
- [x] medicine-ball/sandbag throws
- [x] spear target drill
- [ ] richer obstacle prerequisites
- [ ] obstacle dimensions/setup/capacity

### Seed enrichment

- [ ] detailed coaching cues for all exercises
- [ ] common mistakes for all exercises
- [ ] explicit Level 1/2/3 variants
- [ ] finer per-exercise body-region mapping
- [ ] richer movement-pattern mapping
- [ ] child-specific variants/restrictions
- [ ] media/demo placeholders

## 5. Exercise library & CRUD

- [x] `/exercises` database-backed library
- [x] text search
- [x] category filter
- [x] active/archive filter
- [x] aliases in search
- [x] equipment/risk/min-age display
- [x] active/running/category counts
- [x] create exercise
- [x] edit exercise
- [x] archive exercise
- [x] restore exercise
- [x] edit DE/EN names and summaries
- [x] edit DE/EN aliases
- [x] server-side Zod validation
- [x] mutations refresh DE/EN search documents
- [x] mutations mark FTS indexes `dirty`
- [ ] hard delete with reference protection
- [ ] edit body regions
- [ ] edit movement patterns
- [ ] edit equipment requirements
- [ ] edit tags
- [ ] progressions/regressions
- [ ] duplicate detection
- [ ] bulk editing
- [ ] CSV/JSON import/export

## 6. Search & autocomplete

- [x] normalized + denormalized searchable data
- [x] German/English search docs
- [x] DuckDB FTS rebuild service
- [x] German/English stemmer configuration
- [x] explicit dirty/rebuild state
- [x] fallback structured search + aliases
- [ ] BM25 FTS live search
- [ ] autocomplete service/table
- [ ] name autocomplete
- [ ] alias autocomplete
- [ ] tag/equipment/body-region autocomplete
- [ ] existing-training/block autocomplete
- [ ] configurable search profiles
- [ ] configurable field weights
- [ ] favorite/recent boosts
- [ ] admin FTS status + rebuild UI

## 7. UI/UX

- [x] reusable App Shell
- [x] responsive dashboard
- [x] reusable phase cards
- [x] touch-friendly Quick Create
- [x] visual front/back body selector
- [x] Exercise create/edit forms
- [ ] route-aware active navigation
- [ ] mobile navigation
- [ ] shared advanced form field kit
- [ ] toast/feedback system
- [ ] undo/redo
- [ ] full-screen trainer mode
- [ ] print view
- [ ] accessibility audit

## 8. Quick Create Wizard

- [x] kids/youth/adults/mixed
- [x] age
- [x] participant count
- [x] duration
- [x] training goals
- [x] body-region selection
- [x] intensity orientation
- [x] Circuit
- [x] Rig & Run
- [x] AMRAP
- [x] EMOM
- [x] Tabata Style
- [x] Run + Exercise
- [x] Technique
- [x] Team/Relay
- [ ] location selection
- [ ] equipment/obstacle availability
- [ ] group split / station capacity
- [ ] avoid-region selection
- [ ] retrieve exercises from real pool
- [ ] deterministic `TrainingDraft` composer
- [ ] save generated draft

## 9. Training formats

- [x] format taxonomy
- [x] Circuit / Stations concept
- [x] Tabata / AMRAP / EMOM concepts
- [x] Rig & Run concept
- [x] Run + Exercise concept
- [x] Technique + Team/Relay concepts
- [ ] generic interval-block model
- [ ] rounds for time / quality
- [ ] ladder / reverse ladder / pyramid
- [ ] chipper
- [ ] partner workout
- [ ] configurable `every X metres/minutes/checkpoint`
- [ ] format-specific work/rest validation

## 10. Training editor

- [x] typed session example on dashboard
- [x] phase visualization
- [ ] create/persist session
- [ ] edit metadata
- [ ] search-and-add exercises
- [ ] add/remove/reorder items
- [ ] drag & drop
- [ ] replace with similar
- [ ] easier/harder
- [ ] equipment alternative
- [ ] Level 1/2/3 editor
- [ ] duration calculations
- [ ] duplicate/archive/restore
- [ ] combine sessions
- [ ] recreate with changed constraints
- [ ] version history + restore
- [ ] save as template

## 11. AI Training Builder

Principle: **retrieve approved data → compose → deterministic validation → trainer approval**.

- [ ] provider-neutral AI interface
- [ ] Zod structured AI schema
- [ ] RAG/retrieval from approved exercise pool
- [ ] complete session generation
- [ ] phase-only regeneration
- [ ] replace/easier/harder selected item
- [ ] adapt duration/participants/equipment
- [ ] adult ↔ kids/youth adaptation
- [ ] running-focus adaptation
- [ ] combine previous sessions
- [ ] avoid recent repetition
- [ ] Level 1/2/3 generation
- [ ] AI-created exercise drafts
- [ ] explicit approval before master-pool inclusion

## 12. Kids / Youth / Safeguarding

- [x] audience + age model foundation
- [x] risk validation foundation
- [x] safeguarding principles in training skill
- [ ] saved Kids/Youth profiles
- [ ] restricted obstacle rules
- [ ] supervision rules
- [ ] max-risk-by-age rules
- [ ] trainer qualification rules
- [ ] media consent
- [ ] UI explanation for blocked items
- [ ] club rules always override AI suggestions

## 13. Groups

- [x] DB foundation
- [ ] Group CRUD UI
- [ ] age/default participant/duration settings
- [ ] locations/equipment defaults
- [ ] skill distribution
- [ ] preferred formats
- [ ] club-rule profile
- [ ] presets: Kids, Youth, Beginner, Advanced, Competition, Running, Open

## 14. Admin

- [ ] Admin dashboard
- [ ] Users + roles
- [ ] Groups
- [ ] Exercises advanced management
- [ ] Obstacles
- [ ] Media
- [ ] Templates
- [ ] Club rules
- [ ] Search profiles
- [ ] AI settings
- [ ] DuckDB/schema status
- [ ] FTS status + DE/EN rebuild
- [ ] backup/restore/import/export
- [ ] read-only diagnostic SQL console for Super Admin

## 15. Media

- [ ] image/video metadata schema
- [ ] exercise image/gallery
- [ ] demo video/external video
- [ ] thumbnails
- [ ] copyright/source
- [ ] consent metadata
- [ ] orphan detection
- [ ] S3-compatible storage abstraction

Large media should not be stored in DuckDB by default.

## 16. Internationalization

- [x] DB supports `de` + `en`
- [x] initial pool bilingual
- [x] DE/EN search docs
- [ ] UI dictionaries
- [ ] localized routes/UI
- [ ] language selector
- [ ] translation-completeness Admin view

## 17. Tests & quality gates

- [x] CI
- [x] lint
- [x] typecheck
- [x] domain unit tests
- [x] production build
- [x] real DuckDB migration test
- [x] 140+ seed-size assertion
- [x] 25+ running assertion
- [x] DE/EN translation assertion
- [x] DE/EN search-doc assertion
- [x] duplicate seed-key assertion
- [ ] CRUD integration tests
- [ ] search ranking tests
- [ ] Quick Create E2E
- [ ] Training Editor E2E
- [ ] Kids/Youth E2E

## 18. Analytics

- [ ] exercise usage
- [ ] underused exercises
- [ ] body-region coverage
- [ ] movement-pattern coverage
- [ ] obstacle exposure
- [ ] running volume by group
- [ ] repetition warnings
- [ ] zero-result search terms
- [ ] AI suggestions frequently replaced

No athlete surveillance or unnecessary personal data.

---

# Current milestone

## Completed

- [x] architecture + specialized skills
- [x] CI-quality foundation
- [x] training-domain foundation
- [x] DuckDB schema/migrations
- [x] Quick Create UI + body selector
- [x] validated 140+ exercise seed
- [x] validated 25+ running seed
- [x] OCR-specific seed pool
- [x] DE/EN seed/search content
- [x] Exercise Library
- [x] Exercise Create/Edit/Archive/Restore
- [x] search documents updated after mutations
- [x] FTS dirty-state handling

## Next implementation slice

- [ ] BM25 exercise search
- [ ] autocomplete service
- [ ] Admin search-index status/rebuild
- [ ] body-region/equipment/tag editing for exercises
- [ ] Quick Create retrieval from the real exercise pool
- [ ] first deterministic non-AI `TrainingDraft`
- [ ] persisted Training Session CRUD

---

# MVP acceptance

- [ ] German/English UI selectable
- [ ] full exercise + obstacle administration
- [ ] fast FTS/autocomplete search
- [ ] configurable search/autocomplete sources
- [ ] complete manual Warm-up/Main/Cooldown editor
- [x] visual body selector
- [x] Quick Create input flow
- [ ] Quick Create creates/persists a real session
- [ ] group/level splitting
- [ ] editable Circuit/Tabata/AMRAP/EMOM/Rig & Run
- [ ] persisted `every 100 m -> exercise` running rules
- [ ] Level 1/2/3 variants
- [ ] duplicate/combine/recreate sessions
- [ ] AI composition from approved pool
- [ ] AI-created exercises require approval
- [ ] Admin user/group/media/settings/DB management
- [ ] training version history
- [ ] age/group/risk rules before save
- [ ] print / trainer display

## Reference principle

LSB Hessen / Sportjugend Hessen / DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding are used as professional planning guidance. OCR-specific obstacle/race concepts remain separate, configurable OCR/club-domain rules rather than being presented as universal LSB rules.
