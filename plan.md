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
- [x] deterministic non-AI `TrainingDraft` composer
- [x] deterministic phase-duration budgeting and exact minute distribution
- [x] deterministic selection uses audience/age, goals, body regions, format, intensity, tags and preferred exercises
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
- [x] expanded exercise-detail schema foundation from section 4
- [x] media source/generation metadata schema and migration
- [ ] training version snapshots
- [ ] favorites/recent use
- [ ] templates
- [ ] external source/provenance records
- [ ] users/roles
- [ ] audit log
- [ ] AI generation/source history

## 4. Initial exercise database

A fresh OCRCraft DB must be useful immediately. A trainer must be able to understand and teach a seeded exercise without already knowing the exercise name or relying on advanced training knowledge.

### 4.1 Current validated coverage

- [x] **140+ initial exercises** enforced by CI
- [x] **25+ running exercises** enforced by CI
- [x] 11+ exercise areas
- [x] German + English content
- [x] stable unique seed keys
- [x] common aliases
- [x] equipment/body-region/movement/tag catalogues
- [x] DE/EN search documents
- [x] duplicate protection

### 4.2 Required exercise detail contract

The remaining generic seed records must be enriched so that every exercise is self-explanatory in the UI and can be used reliably by search, Quick Create and AI composition.

#### Identity & classification

- [ ] canonical German name for every seed
- [ ] canonical English name for every seed
- [ ] German/English aliases and common trainer terminology for every seed
- [ ] primary category for every seed
- [ ] secondary categories/facets
- [ ] compatible training phases: warm-up / main / cooldown
- [ ] exercise type: drill / strength / endurance / mobility / skill / obstacle / game / recovery
- [ ] training goals: strength / strength endurance / endurance / speed / coordination / balance / mobility / grip / OCR technique / recovery / teamwork
- [ ] movement patterns: squat / hinge / lunge / push / pull / carry / crawl / climb / hang / rotate / brace / jump / throw / run / balance / mobility
- [ ] primary body regions
- [ ] secondary body regions
- [ ] unilateral / bilateral / alternating / locomotion classification
- [ ] movement plane where useful: sagittal / frontal / transverse / multiplanar
- [ ] impact level: low / moderate / high
- [ ] coordination complexity: simple / moderate / complex
- [ ] OCR transfer tags, e.g. grip, wall, carry, rig, rope, transition, trail, obstacle efficiency

#### Trainer-readable explanation

- [ ] **short summary:** one sentence explaining what the exercise is
- [ ] **purpose:** why this exercise is used and what it develops
- [ ] **setup:** equipment, spacing and preparation before starting
- [ ] **start position:** clear body/equipment starting position
- [ ] **execution:** 3–7 ordered steps written so a non-expert can follow them
- [ ] **finish/reset position** where relevant
- [ ] **breathing cue** where useful
- [ ] **tempo/rhythm cue** where useful
- [ ] **2–5 coaching cues** that can be called out during training
- [ ] **2–5 common mistakes** and how the trainer corrects them
- [ ] **safety notes / stop conditions** written in practical trainer language
- [ ] **quality criteria:** what a good repetition or successful obstacle attempt looks like
- [x] hand-authored bilingual, exercise-specific detail for all 10 warm-up seeds

#### Dosage & programming

- [ ] supported prescription units: reps / seconds / minutes / metres / rounds / attempts
- [ ] suggested beginner prescription
- [ ] suggested standard prescription
- [ ] suggested advanced prescription
- [ ] typical work/rest ranges where appropriate
- [ ] suitable training formats, e.g. circuit / AMRAP / EMOM / Tabata-style / interval / technique / relay / Rig & Run
- [ ] reasonable station capacity
- [ ] approximate setup time
- [ ] approximate transition time
- [ ] space requirement: small / medium / large / running route / rig area
- [ ] indoor / outdoor suitability

#### Progression, regression & mixed groups

- [ ] Level 1 regression with explanation
- [ ] Level 2 standard version
- [ ] Level 3 progression with explanation
- [ ] low-impact alternative where meaningful
- [ ] no-equipment alternative where meaningful
- [ ] child/youth variant where meaningful
- [ ] partner/team variant where meaningful
- [ ] prerequisite skills for advanced OCR exercises
- [ ] fallback exercise if an obstacle/equipment item is unavailable

#### Audience & safety metadata

- [ ] audience suitability: kids / youth / adults / mixed
- [ ] minimum recommended age where applicable
- [ ] difficulty: beginner / intermediate / advanced
- [ ] risk level: low / medium / high
- [ ] supervision requirement: normal / increased / direct station supervision
- [ ] contact/partner requirement
- [ ] club-rule restriction hooks

The database should describe training suitability, not provide medical diagnosis. Individual medical restrictions remain outside the normal exercise seed.

#### Logistics & equipment

- [ ] required equipment
- [ ] optional equipment
- [ ] equipment quantity per station
- [ ] obstacle dimensions/configuration where relevant
- [ ] maximum simultaneous participants
- [ ] surface requirements where relevant
- [ ] weather/terrain considerations for running/OCR where relevant

### 4.3 Category model

#### Broad areas already present

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

#### Additional target categories / facets

- [ ] Games & Teamwork
- [ ] Kids Adventure / Movement Landscape
- [ ] Coordination
- [ ] Speed & Reaction
- [ ] Jumping / Landing / Plyometrics
- [ ] Crawling / Ground Movement
- [ ] Push Strength
- [ ] Pull Strength
- [ ] Squat / Knee Dominant
- [ ] Hinge / Hip Dominant
- [ ] Lunge / Single Leg
- [ ] Rotation / Anti-Rotation
- [ ] Shoulder Stability
- [ ] Grip Endurance
- [ ] Rig Technique
- [ ] Rope Technique
- [ ] Wall Technique
- [ ] Carry Technique
- [ ] Drag / Pull
- [ ] Obstacle Transition
- [ ] Running Technique / Lauf-ABC
- [ ] Easy / Base Endurance Running
- [ ] Tempo / Threshold-oriented Running
- [ ] Intervals
- [ ] Hills / Stairs
- [ ] Trail / Terrain
- [ ] Run + Exercise
- [ ] Run + Obstacle
- [ ] Balance / Proprioception
- [ ] Mobility
- [ ] Stretching
- [ ] Breathing / Recovery

### 4.4 Running pool

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
- [x] enrich every running seed with exercise-specific technique description, intensity guidance and common mistakes
- [x] distinguish technique drill vs endurance unit vs interval prescription (also transition and team)
- [x] add RPE/intensity guidance independent of athlete-specific medical data
- [ ] pace/HR-zone prescription
- [ ] GPS/route-aware sessions

### 4.5 OCR pool

- [x] hangs / rings / monkey bars
- [x] rope + rig progressions
- [x] farmer/suitcase/sandbag/bucket/atlas carries
- [x] sled/tire drag + tire flip
- [x] crawls
- [x] walls + cargo net + rope traverse
- [x] Rig & Run
- [x] balance obstacles
- [x] medicine-ball/sandbag/target/spear throws
- [x] richer obstacle prerequisites for every seeded OCR / Grip & Rig obstacle, traverse and transition
- [x] obstacle configuration/setup, clear-zone and station-capacity guidance for all seeded OCR / Grip & Rig stations
- [ ] record club-specific obstacle dimensions when configured; no universal height/span values are assumed
- [x] detailed approach / execution / exit sequence for every seeded OCR / Grip & Rig obstacle task
- [x] explicit failed-attempt fallback/regression for every seeded OCR / Grip & Rig task
- [x] transition technique between running and obstacle work
- [x] carry/lift seed loading, route, turn, controlled set-down, RPE and fallback guidance

### 4.6 VIBSS / LSB NRW reference seed

Use VIBSS as a curated **reference and inspiration source**, not as a blind copy source.

Useful VIBSS structures to map into OCRCraft include adult endurance/coordination/strength/mobility sessions, circuit/station training, material/location filters, age filters, children/youth coordination/balance/body-awareness/teamwork goals, movement landscapes, parcours, adventure/experience sport and the linked SPOK collection.

Implementation rules:

- [ ] add `external_source_reference` / provenance model
- [ ] source fields: provider, title, URL, retrieval date, source type, notes
- [ ] tag records derived from VIBSS inspiration with `source_provider = VIBSS/LSB NRW`
- [ ] do **not** copy VIBSS text or images verbatim unless licensing explicitly permits it
- [ ] write independent OCRCraft descriptions based on the training concept
- [ ] curate VIBSS-inspired ideas for OCR relevance instead of importing unrelated sport examples
- [ ] seed 20–40 curated complete training-template ideas based on useful VIBSS structures
- [ ] add adult templates: endurance / coordination / strength / mobility / circuit / outdoor fitness
- [ ] add kids/youth templates: coordination / balance / teamwork / adventure / parcours / movement landscape
- [ ] preserve source URL on every externally inspired template for traceability

Reference entry points:

- https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/erwachsene
- https://www.vibss.de/sportpraxis/stundenbeispiele-pfp/kinder-und-jugendliche
- https://www.vibss.de/sportpraxis/spiele-uebungssammlung-spok

### 4.7 Seed quality gates

- [x] warm-up cohort gate: bilingual summaries/details, three ordered steps, specific cues/corrections, dosage and movement/body mappings
- [ ] CI requires all seed exercises to have DE/EN names
- [ ] CI requires all seed exercises to have summary + purpose
- [ ] CI requires setup + start position + execution steps
- [ ] CI requires at least 2 coaching cues for normal movement exercises
- [ ] CI requires at least 1 common mistake/correction
- [ ] CI requires difficulty + risk + audience metadata
- [ ] CI requires primary body region + movement pattern unless genuinely not applicable
- [ ] CI requires at least one supported prescription method
- [ ] CI requires Level 1/2/3 for exercises marked `progression_required`
- [ ] CI requires source/provenance for externally inspired seed records
- [ ] admin completeness score highlights exercises that need enrichment

### 4.8 Seed enrichment migration

- [x] extend schema for structured detail fields
- [ ] expert-reviewed, exercise-specific enrichment for all existing 140+ seed exercises
- [x] replace generic summaries/instructions/cues/corrections for the complete 10-exercise warm-up cohort
- [x] enrich all 25+ running exercises with bilingual technique, dosage, correction and RPE details
- [ ] add missing categories/facets
- [ ] add richer equipment + station logistics
- [ ] add progression/regression relations
- [ ] update DE/EN search documents to include every newly structured detail field
- [x] autocomplete uses aliases, categories, tags, equipment, movement patterns and body regions
- [ ] extend autocomplete with explicit training goals and OCR transfer-tag taxonomy

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
- [ ] detail page that explains the exercise without assumed expert knowledge
- [ ] structured execution-step editor
- [ ] coaching-cue editor
- [ ] common-mistake/correction editor
- [ ] dosage/programming editor
- [ ] Level 1/2/3 editor
- [ ] safety/logistics editor
- [ ] source/provenance display
- [ ] protected hard delete
- [ ] edit body regions
- [ ] edit movement patterns
- [ ] edit equipment requirements
- [ ] edit tags/goals/categories
- [ ] progressions/regressions
- [ ] duplicate detection / bulk edit / import-export

## 6. Search & autocomplete

- [x] DE/EN denormalized search documents
- [x] DuckDB FTS rebuild service
- [x] German/English stemmer config
- [x] dirty/rebuild lifecycle
- [x] structured fallback search when FTS is dirty/failed/unavailable
- [x] **BM25 FTS live exercise search** when index is healthy
- [x] exact/prefix name and alias boosts ahead of generic BM25 matches
- [x] autocomplete service/API
- [x] autocomplete from exercise names
- [x] autocomplete from exercise aliases
- [x] autocomplete from categories
- [x] autocomplete from tags
- [x] autocomplete from equipment
- [x] autocomplete from body regions
- [x] autocomplete from movement patterns
- [ ] explicitly index every purpose/execution/coaching-cue/common-mistake field separately
- [ ] autocomplete from explicit goals/OCR transfer tags
- [ ] autocomplete from existing trainings/blocks
- [ ] configurable search profiles + field weights
- [ ] favorite/recent boosts
- [x] read-only Admin index-status UI
- [ ] authenticated Admin DE/EN rebuild actions

## 7. UI/UX & theming

- [x] reusable App Shell
- [x] responsive dashboard
- [x] phase cards
- [x] touch-friendly Quick Create
- [x] visual front/back body selector
- [x] Exercise create/edit UI
- [x] initial read-only Admin dashboard
- [x] central semantic design-token foundation with core screens migrated
- [x] **Light mode**
- [x] **Dark mode**
- [x] **System mode** following OS/browser preference
- [x] persistent theme selection
- [x] theme selector in header/user settings
- [x] active navigation state
- [x] mobile navigation
- [x] persistent header shortcuts to Administration and database settings
- [ ] normalize remaining page-local styling into shared Card/Form/Table/Filter/Empty-State components
- [ ] verify contrast/readability in light and dark themes on all pages
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
- [x] real exercise autocomplete/retrieval from the DuckDB library
- [x] preferred exercise/obstacle references in the wizard
- [x] deterministic `TrainingDraft` composer
- [x] use structured category/body/tag metadata plus enriched instructions in the deterministic candidate pool
- [x] real Warm-up/Main/Cooldown preview generated through server API
- [x] persist generated draft to DuckDB
- [x] server regenerates and validates the draft from the current DB before persistence instead of trusting client JSON
- [x] optional custom training title before persistence
- [ ] richer semantic ranking from full purpose/cues/mistakes
- [ ] location
- [ ] equipment/obstacle availability filters
- [ ] group split / station capacity
- [ ] avoid-region selection

## 9. Training formats

- [x] format taxonomy
- [x] Circuit/Stations
- [x] Tabata/AMRAP/EMOM concepts
- [x] Rig & Run / Run + Exercise
- [x] Technique / Team-Relay
- [x] persisted per-item format selection in Training Editor
- [ ] specialized format editors/settings for work/rest/rounds
- [ ] generic interval block
- [ ] rounds for time/quality
- [ ] ladder/reverse ladder/pyramid/chipper
- [ ] partner workout
- [ ] configurable `every X metres/minutes/checkpoint`
- [ ] work/rest arithmetic validation

## 10. Training editor

- [x] typed session example + phase visualization
- [x] create/persist session from Quick Create
- [x] DB-backed `/training` overview
- [x] persisted training detail page
- [x] title + lifecycle status metadata editor
- [x] archive view + restore through lifecycle status
- [x] archived sessions are content-read-only until restored
- [x] search/autocomplete and add exercise to a phase
- [x] show concise persisted exercise instructions directly inside a training item
- [x] edit item duration
- [x] edit item format
- [x] edit free Level/variant label
- [x] edit per-session training hint/instructions
- [x] add/remove/reorder items via deterministic controls
- [x] replace exercise through structured autocomplete while preserving item programming
- [x] total session duration recalculates from persisted items after content mutations
- [x] content changes automatically return lifecycle status to `draft`
- [x] DuckDB mutation core is transaction-wrapped at repository layer
- [ ] group/focus/notes metadata editor
- [ ] drag & drop ordering
- [ ] structured easier/harder/equipment-alternative suggestions
- [ ] expand an item to full execution/coaching/safety/detail data
- [ ] structured Level 1/2/3 variant editor
- [ ] phase title/editor controls
- [ ] add/remove/reorder phases beyond fixed Warm-up/Main/Cooldown model
- [ ] duplicate session
- [ ] combine/recreate sessions
- [ ] version history/restore
- [ ] templates

## 11. AI Training Builder

Principle: **retrieve approved data → compose → deterministic validation → trainer approval**.

- [ ] provider-neutral AI interface
- [ ] structured Zod AI schema
- [ ] retrieve approved exercise/training pool
- [ ] use structured exercise purpose/execution/safety/variant data as AI context
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
- [ ] child-specific exercise wording and teaching cues
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
- [ ] exercise completeness report
- [ ] seed-source/provenance view
- [ ] bulk enrichment workflow for seed exercises
- [ ] templates + club rules
- [ ] search profiles
- [ ] AI settings
- [ ] authenticated FTS rebuild
- [ ] DuckDB/schema/backup/restore/import/export
- [x] confirmed full database reseed from versioned migrations with transactional rollback
- [ ] read-only diagnostic SQL console for Super Admin

### Import / Export JSON packages

Import/export must be selective and trainer/admin friendly rather than an all-or-nothing database dump.

- [ ] add **Import** and **Export** actions that open a popover/dialog with selectable content areas
- [ ] export selection supports exercises, exercise details, aliases, categories/tags, body regions, movement patterns, equipment mappings, obstacles, training templates, training sessions, groups, source/provenance metadata and media metadata
- [ ] optional **include images/media binaries** switch; included images are embedded in the portable JSON package together with MIME type, checksum and source metadata
- [ ] generate a versioned `.json` file with package schema version, OCRCraft version, export timestamp and selected sections
- [ ] presets: `Exercises only`, `Exercises + images`, `Trainings/Templates`, `Complete portable package`
- [ ] validate JSON/package schema before import and show a readable preflight summary before any write
- [ ] import popover allows selecting which sections from the file should actually be imported
- [ ] duplicate detection uses stable IDs/seed keys first and normalized names, aliases, metadata and image checksums as similarity signals
- [ ] classify matches as `same`, `new`, `probable duplicate`, or `conflict`
- [ ] auto-resolve only high-confidence identical records; never silently overwrite uncertain matches
- [ ] uncertain duplicates/conflicts open a **compare screen** with existing record left and imported record right
- [ ] compare screen shows text/details, categories, mappings and images/media side-by-side
- [ ] per conflicting record allow **Use left (existing)**, **Use right (imported)**, or **Keep both**
- [ ] `Keep both` creates a distinct record with new internal identity while preserving import provenance
- [ ] field-level comparison/highlighting for changed descriptions, metadata and mappings
- [ ] image comparison includes preview, dimensions, MIME type, checksum/source and AI-generation metadata where available
- [ ] bulk decisions for exact duplicates with per-record override
- [ ] final import plan/counts before commit: create / replace / keep existing / keep both / skip
- [ ] execute import transactionally where practical and provide a clear failure report without partial silent corruption
- [ ] imported records preserve source/provenance and package origin for later audit
- [ ] round-trip tests including images and duplicate/conflict-resolution tests

## 15. Media & AI-generated exercise illustrations

- [x] media schema
- [ ] exercise images/gallery/videos
- [ ] external video + thumbnail
- [ ] copyright/source/consent
- [ ] orphan detection
- [ ] S3-compatible storage abstraction

### OCRCraft illustration style

Create a consistent visual language for exercise cards and detail pages based on the supplied reference images:

- [ ] define reusable style profile `ocrcraft-exercise-illustration-v1`
- [ ] clean flat/semi-flat instructional illustration
- [ ] light neutral background, strong readable silhouette, minimal visual clutter
- [ ] dark functional OCR sportswear with muted red accent details inspired by club/OCR clothing
- [ ] avoid third-party event logos, trademarks or copied branding
- [ ] equipment must be clearly recognizable
- [ ] body position and movement direction must be the visual priority
- [ ] consistent camera angle and proportions across the library where practical

### Initial AI image generation

For **every initial seed exercise**, generate one standardized example image containing three clearly separated demonstrations of the same exercise:

1. **Kind**
2. **Frau**
3. **Mann**

All three figures must show the same exercise/phase and use the same OCRCraft illustration style. Age/gender representation changes; exercise mechanics must remain consistent.

- [x] generate an AI illustration for every initial seed exercise
- [x] one image contains child + woman + man versions
- [x] use consistent OCRCraft clothing/style profile
- [ ] show meaningful start/execution position rather than decorative poses
- [ ] for movement-heavy exercises, use a small 2-step motion sequence within each person area where required to understand the movement
- [ ] review every generated image for biomechanical plausibility and match to written instructions
- [ ] regenerate images that conflict with the exercise description
- [ ] create lower-complexity child presentation without changing the intended exercise unless the child variant differs explicitly

### Image/source metadata

- [x] `media_type`: image / video / illustration
- [x] `source_type`: `ai_generated` / `club_created` / `external_reference`
- [x] `style_profile`
- [ ] `audience_variant`: `kid-woman-man-triptych`
- [x] `generation_provider`
- [x] `generation_model`
- [x] `generation_prompt`
- [x] `generated_at`
- [x] `review_status`: pending / approved / rejected
- [ ] `reviewed_by`
- [ ] `source_reference` / originating exercise id
- [ ] visible AI-generated indicator where required
- [x] ability to regenerate while preserving style profile and source history
- [x] single-exercise prompt dry run, OpenAI generation with retry handling, and filesystem/S3-compatible storage adapters
- [x] resumable seed-catalog generation with serialized database writes and concurrent API requests
- [x] generate and inspect one real sample exercise image
- [x] generate and persist one image for each of the 149 initial seed exercises (all remain pending trainer review)
- [x] load bilingual structured DuckDB details, movement/body metadata and available running/obstacle/carry guidance into the single-exercise prompt

## 16. Internationalization

- [x] DB + initial content supports DE/EN
- [x] DE/EN search docs
- [ ] UI dictionaries + localized UI
- [ ] language selector
- [ ] translation completeness Admin view
- [ ] detailed execution/coaching fields translated DE/EN

## 17. Tests & quality gates

- [x] CI / lint / typecheck / build
- [x] domain tests
- [x] real DuckDB migration test
- [x] full reseed integration test covers removal of user data and rollback on migration failure
- [x] seed-size + running coverage assertions
- [x] DE/EN translation/search-doc assertions
- [x] duplicate seed-key assertion
- [x] seed detail completeness tests for required populated DE/EN detail fields, ordered steps, running guidance, OCR prerequisites/fallback/supervision
- [x] warm-up seed quality integration gate rejects original generic scaffolding and checks DE/EN search documents
- [x] DuckDB BM25 ranking/search integration tests
- [x] structured autocomplete DuckDB integration tests
- [x] deterministic `TrainingDraft` unit tests
- [x] TrainingDraft candidate/audience/age/enriched-data DuckDB integration tests
- [x] Quick Create age-range + normalized payload tests
- [x] persisted training item Add/Edit/Delete/Reorder/Replace DuckDB integration tests
- [ ] Exercise CRUD integration tests
- [ ] Quick Create browser E2E
- [ ] Training Editor browser E2E
- [ ] Kids/Youth E2E
- [ ] theme Light/Dark/System E2E
- [x] media source/provenance tests
- [x] image prompt, dry-run, OpenAI retry, filesystem/S3 adapter and DB metadata migration tests
- [x] exercise-image prompt, dry-run, metadata, failure and OpenAI retry tests

## 18. Analytics

- [ ] exercise usage / underused exercises
- [ ] body-region + movement-pattern coverage
- [ ] obstacle exposure
- [ ] running volume by group
- [ ] repetition warnings
- [ ] zero-result searches
- [ ] exercise completeness / missing-detail analytics
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
- [x] BM25 exercise search with structured fallback
- [x] structured autocomplete over names/aliases/categories/tags/equipment/body regions/movement patterns
- [x] read-only Admin search status
- [x] Quick Create UI + body selector + real library references
- [x] deterministic non-AI `TrainingDraft`
- [x] Quick Create preview + server-regenerated persistence
- [x] persisted Training Session create/list/read + title/status/archive lifecycle
- [x] persisted Training item add/edit/remove/reorder/replace
- [x] automatic persisted duration recalculation after item mutation
- [x] semantic UI tokens + Light/Dark/System theme foundation
- [x] media schema + AI exercise-image pipeline foundation

## Next implementation slice

- [ ] **enrich all remaining generic seed exercises with expert-authored, exercise-specific content**
- [ ] add richer categories/goals/facets
- [ ] add body-region/equipment/tag editing to Exercise Admin
- [ ] add VIBSS-inspired training-template/source model
- [ ] add richer Quick Create equipment/location/station-capacity constraints
- [ ] add structured easier/harder/equipment alternatives in Training Editor
- [ ] add phase-level editing + session duplicate/combine/versioning
- [ ] add complete exercise detail/editor UI using the enriched data model
- [ ] selectable JSON import/export with duplicate compare/resolution workflow
- [ ] generate/review real AI exercise-image samples, then bulk-generate initial seed images
- [ ] authentication/RBAC before global Admin mutations

---

# MVP acceptance

- [ ] selectable German/English UI
- [x] Light/Dark/System theme
- [ ] every initial exercise understandable without assumed advanced exercise knowledge
- [ ] every initial exercise has structured setup/execution/coaching/common-mistake data
- [ ] full exercise + obstacle administration
- [ ] fast FTS/autocomplete search with configurable search profiles/sources
- [ ] complete manual Warm-up/Main/Cooldown editor including phase controls
- [x] visual body selector
- [x] Quick Create input flow
- [x] **Quick Create creates and persists a real DB-backed session**
- [x] persisted training list/detail + basic lifecycle management
- [x] persisted training items can be added/edited/removed/reordered/replaced
- [ ] group/level splitting
- [ ] specialized editable Circuit/Tabata/AMRAP/EMOM/Rig & Run settings
- [ ] persisted running rules such as every 100 m
- [ ] structured Level 1/2/3 variants
- [ ] duplicate/combine/recreate sessions
- [ ] portable selectable JSON import/export including optional images
- [ ] duplicate/conflict compare screen with left/right/both resolution
- [ ] AI composition from approved pool
- [ ] AI-created exercises require approval
- [ ] AI example illustration for every initial seed exercise
- [ ] each generated exercise illustration contains child + woman + man version
- [ ] illustration source/generation metadata stored and reviewable
- [ ] Admin users/groups/media/settings/DB
- [ ] training version history
- [ ] age/group/risk rules before save
- [ ] print / trainer display

## Reference principle

LSB Hessen / Sportjugend Hessen / DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding are used as professional planning guidance. OCR-specific obstacle/race concepts remain separate configurable OCR/club-domain rules rather than being presented as universal LSB rules.

VIBSS / Landessportbund NRW is used as a reference/inspiration source for session structures, goals, age-group ideas, materials, locations, games and exercise discovery. OCRCraft keeps source provenance and independently authors its own seed descriptions rather than copying external text or imagery verbatim.
