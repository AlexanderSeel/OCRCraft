# OCRCraft — Implementation Plan

> **Primary language:** German (`de-DE`) · **Secondary:** English (`en`)  
> **Stack:** TypeScript · Next.js/React · Tailwind CSS · DuckDB · DuckDB FTS  
> **Training framework:** LSB/DOSB-oriented Breitensport principles + OCR-specific and configurable club rules

## Legend

- [x] implemented on `main`
- [ ] open
- Partial features are split into smaller checkable tasks.

---

## 1. Foundation & architecture

- [x] Next.js App Router + React + TypeScript
- [x] Tailwind CSS design foundation
- [x] separation: UI → services → repositories → DuckDB
- [x] framework-independent training domain
- [x] DuckDB Node integration + migrations
- [x] CI: lint, typecheck, tests, production build
- [x] Clean-Code / modular TypeScript skill
- [x] professional UI/UX skill
- [x] OCR + LSB Breitensport training skill
- [x] `AGENTS.md`
- [ ] authentication
- [ ] RBAC authorization
- [ ] production deployment setup

## 2. Training domain & rules

- [x] typed training sessions
- [x] Warm-up → Main Part → Cooldown structure
- [x] duration validation
- [x] audience/risk validation foundation
- [x] domain tests
- [ ] station-capacity validation
- [ ] simultaneous equipment-conflict validation
- [ ] transition/setup-time validation
- [ ] age-specific club-rule engine
- [ ] progression/regression rules
- [ ] recent-use/load rules

## 3. DuckDB schema

- [x] exercises + DE/EN translations + aliases
- [x] body regions + movement patterns + tags
- [x] equipment mappings
- [x] club-group foundation
- [x] training sessions/phases/items foundation
- [x] DE/EN search documents
- [x] FTS state: `healthy/dirty/rebuilding/failed`
- [x] DB bootstrap + multi-statement migrations
- [x] real In-Memory-DuckDB migration test
- [ ] training version snapshots
- [ ] favorites/recent use
- [ ] templates
- [ ] users/roles
- [ ] media metadata
- [ ] audit log
- [ ] AI generation/source history

## 4. Initial exercise database

A fresh OCRCraft DB must be useful immediately.

### Validated coverage

- [x] **140+ initial exercises** enforced by CI
- [x] **25+ running exercises** enforced by CI
- [x] 11+ exercise areas
- [x] German + English content
- [x] stable unique seed keys
- [x] common aliases
- [x] equipment/body-region/movement/tag catalogues
- [x] DE/EN search documents
- [x] duplicate protection

### Areas

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

- [x] easy/continuous run
- [x] Run-Walk
- [x] tempo run
- [x] Fartlek / Fahrtspiel
- [x] short + long intervals
- [x] hill repeats
- [x] shuttle runs
- [x] strides
- [x] acceleration/deceleration
- [x] A-Skip / B-Skip / Ankling
- [x] Lauf-ABC high knees / butt kicks
- [x] bounding
- [x] cadence run
- [x] cone/slalom/lateral drills
- [x] relay
- [x] trail + stair running
- [x] `every 100 m -> exercise`
- [x] run-to-obstacle transitions
- [ ] pace/HR-zone prescription
- [ ] GPS/route-aware sessions

### OCR pool

- [x] hangs / rings / monkey bars
- [x] rope + rig progressions
- [x] farmer/suitcase/sandbag/bucket/atlas carries
- [x] sled/tire drag + tire flip
- [x] crawls
- [x] walls + cargo net + rope traverse
- [x] Rig & Run
- [x] balance obstacles
- [x] medicine-ball/sandbag/target/spear throws
- [ ] richer obstacle prerequisites
- [ ] obstacle dimensions/setup/capacity

### Seed enrichment

- [ ] detailed coaching cues + common mistakes
- [ ] explicit Level 1/2/3 variants
- [ ] finer per-exercise body regions/movement patterns
- [ ] child-specific alternatives/restrictions
- [ ] images/videos/media placeholders

## 5. Exercise library & CRUD

- [x] database-backed `/exercises`
- [x] text + alias search
- [x] category filter
- [x] active/archive filter
- [x] counts, equipment, risk, min-age display
- [x] create exercise
- [x] edit exercise
- [x] archive + restore
- [x] edit DE/EN name/summary
- [x] edit DE/EN aliases
- [x] server-side Zod validation
- [x] mutations refresh DE/EN search documents
- [x] mutations mark FTS `dirty`
- [ ] protected hard delete
- [ ] edit body regions
- [ ] edit movement patterns
- [ ] edit equipment requirements
- [ ] edit tags
- [ ] progressions/regressions
- [ ] duplicate detection / bulk edit / import-export

## 6. Search & autocomplete

- [x] DE/EN denormalized search documents
- [x] DuckDB FTS rebuild service
- [x] German/English stemmer config
- [x] dirty/rebuild lifecycle
- [x] fallback structured exercise search
- [x] autocomplete service/API
- [x] autocomplete from exercise names
- [x] autocomplete from exercise aliases
- [ ] BM25 FTS live search
- [ ] autocomplete from tags/equipment/body regions
- [ ] autocomplete from obstacles
- [ ] autocomplete from existing trainings/blocks
- [ ] configurable search profiles + field weights
- [ ] favorite/recent boosts
- [x] read-only Admin index-status UI
- [ ] authenticated Admin DE/EN rebuild actions

## 7. UI/UX

- [x] reusable App Shell
- [x] responsive dashboard
- [x] phase cards
- [x] touch-friendly Quick Create
- [x] visual front/back body selector
- [x] Exercise create/edit UI
- [x] initial read-only Admin dashboard
- [ ] active navigation state
- [ ] mobile navigation
- [ ] shared advanced form kit
- [ ] toast/feedback
- [ ] undo/redo
- [ ] full-screen trainer mode
- [ ] print view
- [ ] accessibility audit

## 8. Quick Create Wizard

- [x] kids/youth/adults/mixed
- [x] age + participant count + duration
- [x] goals + body regions + intensity
- [x] Circuit / Rig & Run / AMRAP / EMOM / Tabata
- [x] Run + Exercise / Technique / Team-Relay
- [ ] location
- [ ] equipment/obstacle availability
- [ ] group split / station capacity
- [ ] avoid-region selection
- [ ] connect UI to autocomplete/retrieval
- [ ] deterministic `TrainingDraft` composer
- [ ] persist generated draft

## 9. Training formats

- [x] format taxonomy
- [x] Circuit/Stations
- [x] Tabata/AMRAP/EMOM concepts
- [x] Rig & Run / Run + Exercise
- [x] Technique / Team-Relay
- [ ] generic interval block
- [ ] rounds for time/quality
- [ ] ladder/reverse ladder/pyramid/chipper
- [ ] partner workout
- [ ] configurable `every X metres/minutes/checkpoint`
- [ ] work/rest arithmetic validation

## 10. Training editor

- [x] typed session example + phase visualization
- [ ] create/persist session
- [ ] metadata editor
- [ ] search/autocomplete and add exercise
- [ ] add/remove/reorder/drag-drop
- [ ] replace/easier/harder/equipment alternative
- [ ] Level 1/2/3 editor
- [ ] duration calculations
- [ ] duplicate/archive/restore
- [ ] combine/recreate
- [ ] version history/restore
- [ ] templates

## 11. AI Training Builder

Principle: **retrieve approved data → compose → deterministic validation → trainer approval**.

- [ ] provider-neutral AI interface
- [ ] structured Zod AI schema
- [ ] retrieve approved exercise/training pool
- [ ] complete session generation
- [ ] phase-only regeneration
- [ ] replace/easier/harder selected item
- [ ] adapt duration/participants/equipment
- [ ] adult ↔ kids/youth adaptation
- [ ] running-focus adaptation
- [ ] combine previous sessions / avoid repetition
- [ ] Level 1/2/3 generation
- [ ] AI-created exercise drafts + approval

## 12. Kids / Youth / Safeguarding

- [x] audience/age + risk foundation
- [x] safeguarding principles in training skill
- [ ] saved Kids/Youth profiles
- [ ] restricted obstacle rules
- [ ] supervision + max-risk-by-age
- [ ] trainer qualification rules
- [ ] media consent
- [ ] blocked-item explanations
- [ ] club rules always override AI

## 13. Groups

- [x] DB foundation
- [ ] Group CRUD UI
- [ ] age/participant/duration defaults
- [ ] location/equipment defaults
- [ ] skill distribution + preferred formats
- [ ] club-rule profile
- [ ] Kids/Youth/Beginner/Advanced/Competition/Running/Open presets

## 14. Admin

- [x] initial Admin dashboard
- [x] read-only DE/EN FTS state
- [ ] authentication + roles first
- [ ] users/roles
- [ ] groups
- [ ] advanced exercise/obstacle/media administration
- [ ] templates + club rules
- [ ] search profiles
- [ ] AI settings
- [ ] authenticated FTS rebuild
- [ ] DuckDB/schema/backup/restore/import/export
- [ ] read-only diagnostic SQL console for Super Admin

## 15. Media

- [ ] media schema
- [ ] exercise images/gallery/videos
- [ ] external video + thumbnail
- [ ] copyright/source/consent
- [ ] orphan detection
- [ ] S3-compatible storage abstraction

## 16. Internationalization

- [x] DB + initial content supports DE/EN
- [x] DE/EN search docs
- [ ] UI dictionaries + localized UI
- [ ] language selector
- [ ] translation completeness Admin view

## 17. Tests & quality gates

- [x] CI / lint / typecheck / build
- [x] domain tests
- [x] real DuckDB migration test
- [x] seed-size + running coverage assertions
- [x] DE/EN translation/search-doc assertions
- [x] duplicate seed-key assertion
- [ ] CRUD integration tests
- [ ] autocomplete/search ranking tests
- [ ] Quick Create E2E
- [ ] Training Editor E2E
- [ ] Kids/Youth E2E

## 18. Analytics

- [ ] exercise usage / underused exercises
- [ ] body-region + movement-pattern coverage
- [ ] obstacle exposure
- [ ] running volume by group
- [ ] repetition warnings
- [ ] zero-result searches
- [ ] AI suggestion replacement analysis

No athlete surveillance or unnecessary personal data.

---

# Current milestone

## Completed

- [x] architecture + specialized skills
- [x] CI-quality foundation
- [x] training-domain foundation
- [x] DuckDB schema/migrations
- [x] validated 140+ exercise pool + 25+ running pool
- [x] OCR-specific seed pool
- [x] DE/EN exercise/search content
- [x] Exercise Library + Create/Edit/Archive/Restore
- [x] search documents + FTS dirty-state handling
- [x] name/alias autocomplete API
- [x] read-only Admin search status
- [x] Quick Create UI + body selector

## Next implementation slice

- [ ] BM25 exercise search
- [ ] connect Quick Create to real autocomplete/retrieval
- [ ] body-region/equipment/tag editing
- [ ] deterministic non-AI `TrainingDraft`
- [ ] persisted Training Session CRUD
- [ ] authentication/RBAC before global Admin mutations

---

# MVP acceptance

- [ ] selectable German/English UI
- [ ] full exercise + obstacle administration
- [ ] fast FTS/autocomplete search with configurable sources
- [ ] complete manual Warm-up/Main/Cooldown editor
- [x] visual body selector
- [x] Quick Create input flow
- [ ] Quick Create creates/persists a real session
- [ ] group/level splitting
- [ ] editable Circuit/Tabata/AMRAP/EMOM/Rig & Run
- [ ] persisted running rules such as every 100 m
- [ ] Level 1/2/3 variants
- [ ] duplicate/combine/recreate sessions
- [ ] AI composition from approved pool
- [ ] AI-created exercises require approval
- [ ] Admin users/groups/media/settings/DB
- [ ] training version history
- [ ] age/group/risk rules before save
- [ ] print / trainer display

## Reference principle

LSB Hessen / Sportjugend Hessen / DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding are used as professional planning guidance. OCR-specific obstacle/race concepts remain separate configurable OCR/club-domain rules rather than being presented as universal LSB rules.
