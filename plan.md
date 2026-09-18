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
- [x] coarse/fine body-region compatibility for training composition
- [x] station-capacity validation in the deterministic training draft, with calculated parallel-station guidance
- [x] simultaneous equipment-conflict validation for circuit stations using per-station equipment demand and declared stock
- [x] transition/setup-time validation using exercise logistics estimates and warning on estimated session overrun
- [x] age-specific club-rule engine
- [x] progression/regression rules
- [x] recent-use/load rules

## 3. DuckDB schema

- [x] exercises + DE/EN translations + aliases
- [x] body regions + movement patterns + tags
- [x] equipment mappings
- [x] club-group foundation
- [x] training sessions/phases/items foundation
- [x] DE/EN search documents
- [x] FTS state: `healthy/dirty/rebuilding/failed`
- [x] DB bootstrap + multi-statement migrations
- [x] serialized multi-process DuckDB access with WAL recovery quarantine
- [x] real In-Memory-DuckDB migration test
- [x] expanded exercise-detail schema foundation from section 4
- [x] media source/generation metadata schema and migration
- [x] granular muscle-region extension migration; existing coarse mappings remain unchanged and valid
- [x] explicit exercise muscle-opposition relation persistence, separate from secondary muscles
- [ ] training version snapshots
- [ ] favorites/recent use
- [ ] templates
- [x] external source/provenance records
- [x] external media licensing metadata with source reference and template-only usage label
- [ ] users/roles
- [ ] audit log
- [x] training generation/source history with persisted builder constraints and provider metadata

## 4. Initial exercise database

A fresh OCRCraft DB must be useful immediately. A trainer must be able to understand and teach a seeded exercise without already knowing the exercise name or relying on advanced training knowledge.

### 4.1 Current validated coverage

- [x] **157 initial exercises** enforced by CI
- [x] **25+ running exercises** enforced by CI
- [ ] grow the current 157-seed catalog with curated gaps in foundational strength, movement quality, teamwork and age-group coverage; require new cohorts to pass bilingual detail, mapping and safety gates
- [x] 11+ exercise areas
- [x] German + English content
- [x] stable unique seed keys
- [x] common aliases
- [x] equipment/body-region/movement/tag catalogues
- [x] DE/EN search documents
- [x] duplicate protection
- [x] external catalogue expansion from ExerciseDB with exact-name duplicate prevention and review tasks for fuzzy matches
- [x] startup health check verifies all 157 seed exercises and bilingual identity data without reseeding automatically

### 4.2 Required exercise detail contract

The remaining generic seed records must be enriched so that every exercise is self-explanatory in the UI and can be used reliably by search, Quick Create and AI composition.

#### Identity & classification

- [x] canonical German name for every seed
- [x] canonical English name for every seed
- [x] make the canonical name from the other locale searchable as an alias for every seed where DE/EN names differ
- [ ] curate additional German/English aliases and common trainer terminology for every seed
- [x] primary category for every seed
- [x] secondary categories/facets
- [x] shared secondary-facet taxonomy with DE/EN labels and deterministic mappings from category and movement patterns
- [x] exercise overview facet filtering with multi-select popover, removable tags and combined muscle/facet filtering
- [x] compatible training phases: warm-up / main / cooldown
- [x] exercise type: drill / strength / endurance / mobility / skill / obstacle / game / recovery
- [x] training goals: strength / strength endurance / endurance / speed / coordination / balance / mobility / grip / OCR technique / recovery / teamwork
- [x] movement patterns: squat / hinge / lunge / push / pull / carry / crawl / climb / hang / rotate / brace / jump / throw / run / balance / mobility
- [x] primary body regions
- [x] secondary body regions
- [x] define primary muscle and opposing/antagonist muscle pairs for exercises where relevant, separately from general secondary muscles
- [x] unilateral / bilateral / alternating / locomotion classification
- [x] movement plane where useful: sagittal / frontal / transverse / multiplanar
- [x] impact level: low / moderate / high
- [x] coordination complexity: simple / moderate / complex
- [x] OCR transfer tags, e.g. grip, wall, carry, rig, rope, transition, trail, obstacle efficiency

#### Trainer-readable explanation

- [x] **short summary:** one sentence explaining what the exercise is
- [x] **purpose:** why this exercise is used and what it develops
- [x] **setup:** equipment, spacing and preparation before starting
- [x] **start position:** clear body/equipment starting position
- [x] **execution:** 3–7 ordered steps written so a non-expert can follow them
- [x] **finish/reset position** where relevant
- [x] **breathing cue** where useful
- [x] **tempo/rhythm cue** where useful
- [x] **2–5 coaching cues** that can be called out during training
- [x] **2–5 common mistakes** and how the trainer corrects them
- [x] **safety notes / stop conditions** written in practical trainer language
- [x] **quality criteria:** what a good repetition or successful obstacle attempt looks like
- [x] hand-authored bilingual, exercise-specific detail for all 10 warm-up seeds

#### Dosage & programming

- [x] supported prescription units: reps / seconds / minutes / metres / rounds / attempts
- [x] suggested beginner prescription
- [x] suggested standard prescription
- [x] suggested advanced prescription
- [x] typical work/rest ranges where appropriate
- [x] suitable training formats, e.g. circuit / AMRAP / EMOM / Tabata-style / interval / technique / relay / Rig & Run
- [x] reasonable station capacity
- [x] approximate setup time
- [x] approximate transition time
- [x] space requirement: small / medium / large / running route / rig area
- [x] indoor / outdoor suitability

#### Progression, regression & mixed groups

- [x] Level 1 regression with explanation
- [x] Level 2 standard version
- [x] Level 3 progression with explanation
- [x] low-impact alternative where meaningful
- [x] no-equipment alternative where meaningful
- [x] child/youth variant where meaningful
- [x] partner/team variant where meaningful
- [x] prerequisite skills for advanced OCR exercises
- [x] fallback exercise if an obstacle/equipment item is unavailable

#### Audience & safety metadata

- [x] audience suitability: kids / youth / adults / mixed
- [x] minimum recommended age where applicable
- [x] difficulty: beginner / intermediate / advanced
- [x] risk level: low / medium / high
- [x] supervision requirement: normal / increased / direct station supervision
- [x] contact/partner requirement
- [x] club-rule restriction hooks

The database should describe training suitability, not provide medical diagnosis. Individual medical restrictions remain outside the normal exercise seed.

#### Logistics & equipment

- [x] required equipment
- [x] optional equipment
- [x] equipment quantity per station
- [x] obstacle dimensions/configuration where relevant
- [x] maximum simultaneous participants
- [x] surface requirements where relevant
- [x] weather/terrain considerations for running/OCR where relevant

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

- [x] Games & Teamwork
- [x] Kids Adventure / Movement Landscape
- [x] Coordination
- [x] Speed & Reaction
- [x] Jumping / Landing / Plyometrics
- [x] Crawling / Ground Movement
- [x] Push Strength
- [x] Pull Strength
- [x] Squat / Knee Dominant
- [x] Hinge / Hip Dominant
- [x] Lunge / Single Leg
- [x] Rotation / Anti-Rotation
- [x] Shoulder Stability
- [x] Grip Endurance
- [x] Rig Technique
- [x] Rope Technique
- [x] Wall Technique
- [x] Carry Technique
- [x] Drag / Pull
- [x] Obstacle Transition
- [x] Running Technique / Lauf-ABC
- [x] Easy / Base Endurance Running
- [x] Tempo / Threshold-oriented Running
- [x] Intervals
- [x] Hills / Stairs
- [x] Trail / Terrain
- [x] Run + Exercise
- [x] Run + Obstacle
- [x] Balance / Proprioception
- [x] Mobility
- [x] Stretching
- [x] Breathing / Recovery

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
- [x] pace/HR-zone prescription
- [x] GPS/route-aware sessions

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
- [x] record club-specific obstacle dimensions when configured; no universal height/span values are assumed
- [x] detailed approach / execution / exit sequence for every seeded OCR / Grip & Rig obstacle task
- [x] explicit failed-attempt fallback/regression for every seeded OCR / Grip & Rig task
- [x] transition technique between running and obstacle work
- [x] carry/lift seed loading, route, turn, controlled set-down, RPE and fallback guidance

### 4.6 VIBSS / LSB NRW reference seed

Use VIBSS as a curated **reference and inspiration source**, not as a blind copy source.

Useful VIBSS structures to map into OCRCraft include adult endurance/coordination/strength/mobility sessions, circuit/station training, material/location filters, age filters, children/youth coordination/balance/body-awareness/teamwork goals, movement landscapes, parcours, adventure/experience sport and the linked SPOK collection.

Implementation rules:

- [x] add `external_source_reference` / provenance model
- [x] source fields: provider, title, URL, retrieval date, source type, notes
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
- [x] CI requires all seed exercises to have DE/EN names
- [x] CI requires both canonical names as cross-locale aliases wherever the DE/EN names differ
- [x] startup migration fills missing DE/EN canonical aliases for the initial seed catalogue
- [x] CI requires all seed exercises to have summary + purpose
- [x] CI requires setup + start position + at least 3 DE/EN execution steps
- [x] CI requires at least 2 coaching cues for each seeded exercise and locale
- [x] CI requires at least 1 common mistake/correction per seeded exercise and locale
- [x] CI requires difficulty + risk + audience metadata
- [x] CI requires primary body region + movement pattern for every seeded exercise
- [x] CI requires at least one supported prescription method
- [x] CI requires Level 1/2/3 for exercises marked `progression_required`
- [x] CI requires source/provenance for externally imported exercise records
- [x] Admin completeness score lists seeded exercises and their missing bilingual/catalog fields

### 4.8 Seed enrichment migration

- [x] extend schema for structured detail fields
- [ ] expert-reviewed, exercise-specific enrichment for all existing 157 seed exercises
- [x] add first five foundational strength/core exercises as bilingual seeds with aliases, body/movement mappings, structured detail, equipment and safety checks
- [x] add movement-quality and teamwork cohort: partner mirror movement, cooperative cone collection and low-height landing practice with bilingual details, safety gates, mappings and search data
- [x] add both canonical names as cross-locale search aliases for all existing seeds and mark DE/EN FTS indexes dirty for rebuild
- [ ] continue adding missing catalog cohorts as versioned, bilingual seed data with aliases, mappings, structured detail, equipment and safety checks
- [x] replace generic summaries/instructions/cues/corrections for the complete 10-exercise warm-up cohort
- [x] enrich all 25+ running exercises with bilingual technique, dosage, correction and RPE details
- [x] add missing categories/facets
- [x] add richer equipment + station logistics
- [x] add progression/regression relations
- [x] update DE/EN search documents to include every newly structured detail field
- [x] autocomplete uses aliases, categories, tags, equipment, movement patterns and body regions
- [x] extend autocomplete with explicit training goals and OCR transfer-tag taxonomy

## 5. Exercise library & CRUD

- [x] database-backed `/exercises`
- [x] text + alias search
- [x] category filter
- [x] active/archive filter
- [x] paginated exercise overview beyond the first 80 results
- [x] standard pagination controls with page-size selection, page numbers, jump-to-page and overall result count
- [x] compact multi-column filters with muscle popover and removable selection tags
- [x] compact muscle/facet filter popovers stay bounded to the viewport and do not dominate the overview
- [x] overview metrics are reduced to compact metadata tags beside the result count
- [x] counts, equipment, risk, min-age display
- [x] compact metadata treatment is consistent between overview, detail and admin result pages
- [x] create exercise
- [x] new manual exercises continue directly into the same full editor used by existing exercises
- [x] edit exercise
- [x] archive + restore
- [x] edit DE/EN name/summary
- [x] edit DE/EN aliases
- [x] server-side Zod validation
- [x] mutations refresh DE/EN search documents
- [x] mutations mark FTS `dirty`
- [x] edit body regions with primary/secondary muscle emphasis
- [x] edit and persist explicit opposing/antagonist muscle pairs separately from secondary muscles
- [x] edit movement patterns
- [x] edit equipment requirements
- [x] edit tags
- [x] edit explicit training goals and rich movement/audience/prescription classification
- [ ] edit additional categories/facets
- [x] muscle-map filtering with safe coarse/fine compatibility
- [x] read-only muscle preview/highlighting on exercise cards
- [x] show primary and opposing/antagonist muscle groups together in exercise details so trainers can deliberately target or balance them
- [x] detail page that explains the exercise without assumed expert knowledge
- [x] structured execution-step editor
- [x] coaching-cue editor
- [x] common-mistake/correction editor
- [x] dosage/programming editor
- [x] Level 1/2/3 editor
- [x] safety/logistics editor
- [x] source/provenance display
- [x] source/provider and media attribution are retained for ExerciseDB imports
- [x] dry-run adapter for hasaneyldrm/exercises-dataset preserves source and media references and requires translation/review
- [x] optional transactional persistence imports the external exercise catalogue as reviewable OCRCraft drafts
- [x] bundled external catalogue is restored automatically after bootstrap and full reseed
- [x] imported external exercises receive German names, summaries and ordered instructions via the translation job
- [x] imported preview images are linked with `Gym-Visual-Lizenz` attribution and marked as templates for later AI replacement
- [x] ExerciseDB free catalogue import supports cursor pagination, rate-limit retries and private non-commercial attribution
- [ ] protected hard delete
- [x] progressions/regressions
- [ ] duplicate detection / bulk edit / import-export
- [x] duplicate review engine with explainable similarity score and safe archive-based merge action

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
- [x] explicit training goals and OCR transfer tags participate in search/autocomplete
- [x] structured purpose/execution/coaching/common-mistake content participates in the DE/EN search documents
- [ ] expose separate configurable weights for each structured detail field
- [ ] autocomplete from existing trainings/blocks
- [ ] configurable search profiles + field weights
- [ ] favorite/recent boosts
- [x] read-only Admin index-status UI
- [ ] authenticated Admin DE/EN rebuild actions

## 7. UI/UX & theming

- [x] reusable App Shell
- [x] independently scrollable desktop navigation and content panels
- [x] responsive dashboard
- [x] phase cards
- [x] touch-friendly Quick Create
- [x] visual front/back body selector
- [x] reusable `MuscleMap` component with select/emphasis/display modes
- [x] OCRCraft-owned anatomical front/back asset with semantic muscle overlays
- [x] integrate all 89 pinned `body-muscles` regions with German/English labels under 25 semantic selectable groups; distinguish muscles from other body areas
- [x] calibrate SVG-derived regions to the 376 × 504 WebP; share adapted outer contours between highlighting and hit testing; retain source paths, transforms, Apache license and NOTICE
- [x] support coarse/detail selection in exercise filters, editing and Quick Create; preserve existing IDs and primary/secondary state
- [x] migrate 89 detail IDs into DuckDB and validate persistence, filter compatibility, pointer reachability, reported missing points and desktop/mobile form behavior
- [x] accessible list fallback for precise selection of overlapping regions
- [x] muscle highlight design tokens for Light/Dark/System themes
- [x] Exercise create/edit UI
- [x] initial read-only Admin dashboard
- [x] central semantic design-token foundation with core screens migrated
- [x] **Light mode**
- [x] **Dark mode**
- [x] **System mode** following OS/browser preference
- [x] persistent theme selection
- [x] theme selector in header/user settings
- [ ] verify contrast/readability in light and dark themes on all pages
- [x] active navigation state
- [x] mobile navigation
- [x] persistent header shortcuts to Administration and database settings
- [x] shared accessible dialog primitive with focus management, Escape/backdrop close and scroll locking
- [x] shared disclosure primitive for consistent expandable panels across filters, editors and administration
- [x] dialog and expandable-panel accessibility pass for focus, keyboard and visible focus states
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
- [x] granular body-region focus uses the same shared muscle-map taxonomy
- [x] Circuit / Rig & Run / AMRAP / EMOM / Tabata
- [x] Run + Exercise / Technique / Team-Relay
- [x] connect UI to real exercise autocomplete/retrieval
- [x] preferred exercise/obstacle selection from the live exercise pool
- [x] deterministic `TrainingDraft` composer
- [x] server-side candidate retrieval from approved DuckDB exercises
- [x] generated Warm-up/Main/Cooldown preview using real exercises
- [x] audience/age filtering of candidate exercises
- [x] use goals/body regions/format/intensity/preferred exercises for deterministic ranking
- [x] persist generated draft as a real training session
- [x] location selection with real indoor/outdoor candidate filtering
- [x] Quick Create equipment inventory input with inventory-aware circuit warnings
- [x] Quick Create obstacle availability
- [x] group split / station capacity input
- [x] avoid-region selection
- [x] optionally select a target muscle together with its opposing/antagonist group for deliberate balanced session planning
- [x] use enriched structured exercise detail payload for deterministic ranking beyond current tags/body/category guidance

## 9. Training formats

- [x] format taxonomy
- [x] Circuit/Stations
- [x] Tabata/AMRAP/EMOM concepts
- [x] Rig & Run / Run + Exercise
- [x] Technique / Team-Relay
- [x] generic interval block
- [x] rounds for time/quality
- [x] ladder/reverse ladder/pyramid/chipper
- [ ] partner workout
- [x] configurable `every X metres/minutes/checkpoint`
- [x] work/rest arithmetic validation

## 10. Training editor

- [x] typed session example + phase visualization
- [x] create/persist session
- [x] training list with draft/published/archived views
- [x] training detail page with stored Warm-up/Main/Cooldown blocks
- [x] metadata editor for title + session status
- [x] archive + restore
- [x] search/autocomplete and add exercise
- [x] edit stored item duration / format / level / trainer note
- [x] remove stored exercise item
- [x] reorder stored items within a phase
- [x] replace stored exercise through autocomplete while preserving programming metadata
- [x] duration recalculation after item mutations
- [x] content mutations return a published session to `draft`
- [x] show concise exercise instructions directly inside a training item
- [x] expand item to full execution/coaching/safety details
- [x] drag/drop ordering UI
- [x] easier/harder/equipment alternative actions
- [x] Level 1/2/3 selection/editor backed by structured exercise levels
- [x] duplicate session
- [x] combine sessions
- [x] recreate/regenerate an existing generated session from its persisted editable builder constraints
- [ ] version history/restore
- [ ] templates

## 11. AI Training Builder

Principle: **retrieve approved data → compose → deterministic validation → trainer approval**.

### Shared builder foundation

- [x] one typed builder request for AI and local planning: audience/age, participants, duration, goals, muscles/body regions, avoid-regions, exercise types, formats, location, intensity, preferred exercises and available equipment
- [x] retrieve only approved active exercises from DuckDB with audience/age/location/equipment constraints
- [x] use structured purpose/execution/safety/variant, movement, muscle, goal, equipment and logistics metadata as planning context
- [x] persisted generation history includes builder mode, constraints and provider metadata
- [x] recreate/adapt a saved generated training from its persisted constraints without mutating the source training
- [x] shared deterministic post-composition sports-quality audit for AI and local drafts
- [x] shared final session validation for duration, phases, age/risk, station capacity, equipment conflicts and setup/transition time

### AI provider path

- [x] provider-neutral `AiTrainingProvider` interface
- [x] OpenAI-compatible provider implementation configurable by base URL/model/API key
- [x] structured Zod AI response schema
- [x] AI may select only IDs from the approved exercise pool; invented exercises are rejected
- [x] complete Warm-up/Main/Cooldown session generation
- [x] exact phase durations are assigned deterministically after the AI selection
- [x] phase-only regeneration while preserving the other reviewed phases
- [x] replace selected draft exercise with easier/harder/lower-equipment alternatives
- [x] adapt duration/participants/equipment/location/goals/muscles/types by regenerating from edited constraints
- [x] adult ↔ kids/youth adaptation through audience metadata, age filters and deterministic safety checks
- [x] running-focus adaptation through goals, exercise types, categories, running metadata and structured planning context
- [x] recent-use counts are supplied to AI context so repeated exercises can be avoided
- [x] Level 1/2/3 selection is restricted to stored approved variants; Kids proposals are deterministically constrained to Level 1 and unsafe Level 3 escalation is downgraded
- [x] provider-selected main formats must be among the trainer-selected formats; provider output cannot override trainer format constraints
- [x] AI result is rehydrated from the current approved catalogue and revalidated before save
- [x] AI-assisted multi-session combine/recomposition using multiple previous sessions as explicit source context
- [ ] AI-created exercise drafts + separate trainer approval workflow before they can become active catalogue exercises

### Local non-AI sports planner

- [x] deterministic/reproducible local planner with no external AI/provider call
- [x] same builder inputs and hard candidate constraints as the AI path
- [x] goal/type/muscle/body-region weighted selection from approved exercises
- [x] primary muscle + typical antagonist balancing when suitable catalogue exercises exist
- [x] movement-counterpart balancing such as push/pull, squat/hinge and rotate/brace
- [x] whole-body macro diversity across upper body/core/lower body where the goal requires it
- [x] main objective is selected first; warm-up is then matched to actual main-part movement/body demands and cooldown to actual load/recovery demands
- [x] technique/skill/coordination is preferentially placed before excessive fatigue; conditioning work can be weighted later in the main part
- [x] avoid unnecessary consecutive high-impact/high-risk work and audit complex coordination immediately after high impact
- [x] audience-aware deterministic Level 1/2/3 selection from stored exercise variants
- [x] recent-session use creates a soft repetition penalty while explicit trainer-preferred exercises can intentionally override it
- [x] equipment availability participates in selection and remains validated after composition
- [x] station throughput/capacity participates in local ranking to reduce group bottlenecks before the validator needs to warn
- [x] unmet muscle, exercise-type, antagonist or movement-balance goals produce explicit warnings rather than silently claiming full coverage

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
- [x] Group CRUD UI with archive/restore
- [x] age/participant/duration defaults
- [x] location/equipment defaults
- [x] skill distribution + preferred formats
- [ ] club-rule profile
- [ ] Kids/Youth/Beginner/Advanced/Competition/Running/Open presets

## 14. Admin

- [x] initial Admin dashboard
- [x] read-only DE/EN FTS state
- [ ] authentication + roles first
- [ ] users/roles
- [ ] groups
- [ ] advanced exercise/obstacle/media administration
- [x] exercise completeness report
- [x] duplicate review supports side-by-side comparison and marked multi-selection with bulk keep-left/keep-right/ignore actions
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
- [ ] allow presets such as `Exercises only`, `Exercises + images`, `Trainings/Templates`, and `Complete portable package`
- [ ] validate JSON/package schema before import and show a readable preflight summary before any write
- [ ] import popover allows selecting which sections from the file should actually be imported
- [ ] duplicate detection uses stable IDs/seed keys first and then normalized names, aliases, metadata and image checksums as similarity signals
- [ ] classify matches as `same`, `new`, `probable duplicate`, or `conflict`
- [ ] auto-resolve only high-confidence identical records; never silently overwrite uncertain matches
- [ ] for uncertain duplicates/conflicts open a **compare screen** with existing record on the left and imported record on the right
- [ ] compare screen shows text/details, categories, mappings and images/media side-by-side
- [ ] per conflicting record allow **Use left (existing)**, **Use right (imported)**, or **Keep both**
- [ ] `Keep both` creates a distinct record with new internal identity while preserving import provenance
- [ ] allow field-level comparison/highlighting so changed descriptions, metadata and mappings are easy to spot
- [ ] image comparison includes preview, dimensions, MIME type, checksum/source and AI-generation metadata where available
- [ ] provide bulk decisions for exact duplicates while retaining per-record override
- [ ] show final import plan/counts before commit: create / replace / keep existing / keep both / skip
- [ ] execute import transactionally where practical and provide a clear failure report without partial silent corruption
- [ ] imported records preserve source/provenance and package origin for later audit
- [ ] add import/export round-trip tests including packages with images and duplicate/conflict resolution tests

## 15. Media & AI-generated exercise illustrations

- [x] media schema
- [ ] exercise images/gallery/videos
- [ ] external video + thumbnail
- [ ] copyright/source/consent
- [ ] orphan detection
- [ ] S3-compatible storage abstraction

### OCRCraft illustration style

- [x] preserve legacy style profile `ocrcraft-exercise-illustration-v1` for existing triptych assets
- [x] define reusable sequence style profile `ocrcraft-exercise-illustration-v2`
- [x] clean flat instructional illustration with a neutral background, readable silhouette and minimal clutter
- [x] dark functional OCR sportswear with muted red accent details inspired by club/OCR clothing
- [x] avoid third-party event logos, trademarks or copied branding
- [x] recognizable equipment, with body position and movement direction as visual priorities
- [x] consistent camera angle and proportions across sequence frames

### Initial AI image generation

Each sequence illustration uses one adult athlete, selected randomly as a woman or man, repeated across ordered frames that explain the exercise steps stored in the dataset.

- [x] legacy triptych illustrations were generated for each of the original 149 seed exercises
- [x] sequence prompt uses the localized ordered execution steps in `exercise_execution_steps` as its frame-by-frame source
- [x] use one randomly selected adult woman or man consistently across all frames
- [x] create one frame per stored step, preserve the same athlete and equipment, and show direction of movement
- [x] generate and attach sequence illustrations for the 8 exercises added in catalog expansion cohorts; two samples visually inspected, all assets pending trainer review
- [ ] migrate legacy triptych illustrations to sequence format after exercise steps are specific enough and reviewed
- [ ] review every generated sequence image for biomechanical plausibility and match to written instructions

### Image/source metadata

- [x] `media_type`: image / video / illustration
- [x] `source_type`: `ai_generated` / `club_created` / `external_reference`
- [x] `style_profile`
- [x] `illustration_format`: `exercise_sequence` (legacy assets are retained as `legacy_triptych`)
- [x] `figure_presentation`: randomly selected `adult_woman` or `adult_man`
- [x] `sequence_step_count`: matches the bilingual ordered exercise steps
- [x] `generation_provider`
- [x] `generation_model`
- [x] `generation_prompt`
- [x] `generated_at`
- [x] `review_status`: pending / approved / rejected
- [ ] `reviewed_by`
- [ ] `source_reference` / originating exercise id
- [x] visible AI-generated indicator where required
- [x] show linked generated exercise images in the exercise library and search results
- [x] preserve seed image metadata and associations through full database reseed
- [ ] off-machine backup strategy for generated image files
- [x] ability to regenerate while preserving style profile and source history
- [x] filesystem image keys use stable exercise seed names instead of opaque UUIDs
- [x] single-exercise prompt dry run, OpenAI generation with retry handling, and filesystem/S3-compatible storage adapters
- [x] resumable seed-catalog generation with serialized database writes and concurrent API requests
- [x] generate and inspect one real sample exercise image
- [x] generate and inspect real sequence illustration samples (partner mirror movement and quiet landing) before/within the expansion cohort batch; generated assets remain pending trainer review
- [x] generate and persist one sequence image for each of the 157 seed exercises (all remain pending trainer review)
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
- [x] warm-up seed quality integration gate rejects the original generic scaffolding and checks DE/EN search documents
- [x] BM25 integration test with real in-memory DuckDB FTS
- [x] structured fallback-search ranking test
- [x] structured autocomplete integration tests for aliases/tags/equipment/body regions/categories/movement patterns/training goals
- [x] deterministic TrainingDraft domain tests
- [x] TrainingDraft candidate retrieval integration test
- [x] local sports-planner tests for antagonists, requested type diversity, fatigue ordering, movement counterparts, demand-matched warm-up/cooldown, audience levels and station throughput
- [x] AI composer tests reject invented exercises, wrong phases, avoided muscles and unselected formats, and enforce audience-safe stored levels
- [x] shared sports-quality tests cover whole-body/movement balance, high-impact sequencing, Kids safety, warm-up relevance and cooldown quality
- [x] granular/coarse body-region compatibility unit tests
- [x] Quick Create request normalization tests include granular muscle regions, avoid-regions and location
- [x] persisted Training Session integration test
- [x] persisted Training item mutation integration tests for add/edit/remove/reorder/replace
- [x] exercise antagonist-pair persistence integration tests
- [x] rich exercise classification persistence tests
- [ ] Quick Create E2E
- [ ] Training Editor E2E
- [ ] Kids/Youth E2E
- [ ] theme Light/Dark/System E2E
- [x] media source/provenance tests
- [x] image prompt, dry-run, OpenAI retry, filesystem/S3 adapter and DB metadata migration tests
- [x] exercise-image prompt, dry-run, metadata, failure and OpenAI retry tests
- [x] sequence image presentation, per-step prompt construction, metadata persistence and reseed preservation tests

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
- [x] validated 157-exercise pool + 25+ running pool
- [x] OCR-specific seed pool
- [x] DE/EN exercise/search content
- [x] Exercise Library + Create/Edit/Archive/Restore
- [x] same full editor flow for newly created and existing exercises
- [x] rich exercise goal/classification editor
- [x] persisted antagonist muscle-pair editing and display
- [x] search documents + FTS dirty-state handling
- [x] BM25 live search + structured fallback
- [x] enriched autocomplete API including explicit training goals
- [x] read-only Admin search status
- [x] Admin setting for muscle-map debug overlay, disabled by default
- [x] reusable anatomical MuscleMap across Quick Create, exercise editing, filtering and previews
- [x] granular muscle taxonomy with safe compatibility for legacy coarse mappings
- [x] Quick Create UI + body selector + live exercise retrieval
- [x] Quick Create avoid-regions, antagonist suggestions and indoor/outdoor location filtering
- [x] deterministic real-exercise TrainingDraft preview
- [x] Quick Create persistence to real training sessions
- [x] Training list/detail + metadata/archive/restore
- [x] stored Training item add/edit/remove/reorder/replace + drag/drop + Level 1–3 + alternatives
- [x] session duplicate and combine flows
- [x] recreate generated sessions from persisted builder constraints
- [x] shared AI/local Training Builder with provider-neutral AI path and deterministic local sports algorithm
- [x] main-objective-led local planning with matched warm-up/cooldown, antagonist/movement balance, fatigue sequencing, recent-use and station-capacity ranking
- [x] deterministic AI guardrails for approved exercise IDs, selected formats, audience-safe stored levels and shared sports-quality validation
- [x] Group CRUD + basic age/participant/duration/risk defaults
- [x] semantic UI tokens + Light/Dark/System theme foundation
- [x] media schema + AI exercise-image pipeline foundation

## Next implementation slice

- [x] **expand exercise schema with self-explanatory detail fields**
- [ ] **enrich all 157 seed exercises**
- [x] enrich and classify every running seed with RPE, bilingual technique cues, corrected steps and common-mistake guidance
- [x] add bilingual, obstacle-specific setup/prerequisite/approach/execution/exit/fallback guidance to every `ocr-skill` and `grip-rig` seed
- [x] enrich all carry/drag/flip seeds with load selection, RPE, safe lifting, route/turn, set-down and regression guidance
- [x] add seed completeness CI rules for populated detail fields and running/OCR safety fields
- [x] author and validate a complete exercise-specific bilingual warm-up cohort
- [x] add rich editable training goals and movement/audience/prescription classification
- [ ] add richer categories/facets
- [ ] add VIBSS-inspired training-template/source model
- [x] central UI tokens + Light/Dark/System theme
- [x] BM25 exercise search over enriched content
- [x] connect Quick Create to real autocomplete/retrieval
- [x] body-region/movement/equipment/tag facet editing
- [x] reusable muscle map selection/filter/preview slice
- [x] compact side-by-side muscle map workspace with list/small/medium/large/detail exercise overview modes
- [x] deterministic non-AI `TrainingDraft`
- [x] persisted Training Session CRUD foundation
- [x] AI/local Training Builder from approved exercise pool with shared deterministic validation
- [ ] AI-created exercise proposal + trainer approval workflow
- [x] AI-assisted multi-session recomposition
- [ ] selectable JSON import/export with duplicate compare/resolution workflow
- [ ] authentication/RBAC before global Admin mutations

---

# MVP acceptance

- [ ] selectable German/English UI
- [x] Light/Dark/System theme
- [ ] every initial exercise understandable without assumed advanced exercise knowledge
- [ ] every initial exercise has structured setup/execution/coaching/common-mistake data
- [ ] full exercise + obstacle administration
- [ ] fast FTS/autocomplete search with configurable sources
- [ ] complete manual Warm-up/Main/Cooldown editor
- [x] visual body selector with reusable anatomical muscle highlighting
- [x] Quick Create input flow
- [x] Quick Create creates/persists a real session
- [ ] group/level splitting
- [ ] editable Circuit/Tabata/AMRAP/EMOM/Rig & Run
- [ ] persisted running rules such as every 100 m
- [x] Level 1/2/3 variants can be edited on exercises and selected in stored training items
- [x] duplicate/combine sessions
- [x] recreate/regenerate existing generated sessions from saved constraints
- [ ] portable selectable JSON import/export including optional images
- [ ] duplicate/conflict compare screen with left/right/both resolution
- [x] AI composition from approved pool with deterministic server validation and trainer review before persistence
- [x] deterministic local sports-algorithm composition from the same selected goals/types/muscles/resources
- [ ] AI-created exercises require approval
- [x] AI sequence illustration generated and attached for every initial seed exercise using stable seed-name files (all 157 remain pending trainer review)
- [x] new sequence illustrations show one randomly selected adult woman or man across the exercise steps
- [x] illustration source/generation metadata stored and reviewable
- [ ] Admin users/groups/media/settings/DB
- [ ] training version history
- [ ] age/group/risk rules before save
- [ ] print / trainer display

## Reference principle

LSB Hessen / Sportjugend Hessen / DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding are used as professional planning guidance. OCR-specific obstacle/race concepts remain separate configurable OCR/club-domain rules rather than being presented as universal LSB rules.

VIBSS / Landessportbund NRW is used as a reference/inspiration source for session structures, goals, age-group ideas, materials, locations, games and exercise discovery. OCRCraft should keep source provenance and independently author its own seed descriptions rather than copying external text or imagery verbatim.
