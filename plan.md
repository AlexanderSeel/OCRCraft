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
- [x] expanded exercise-detail schema foundation from section 4 (localized instructions, ordered steps/cues/mistakes and structured logistics/programming)
- [ ] training version snapshots
- [ ] favorites/recent use
- [ ] templates
- [ ] external source/provenance records
- [ ] users/roles
- [ ] media metadata
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

The current seed is too terse. Every initial exercise must be enriched so that the exercise is self-explanatory in the UI and can later be used reliably by search, Quick Create and AI composition.

#### Identity & classification

- [ ] canonical German name
- [ ] canonical English name
- [ ] German/English aliases and common trainer terminology
- [ ] primary category
- [ ] secondary categories
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

Every seed exercise must include meaningful text, not only a short label.

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

#### Dosage & programming

An exercise must be usable immediately in a training block.

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

Avoid one flat category field for everything. Use a broad primary area plus searchable facets/subcategories.

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

Useful VIBSS structures to map into OCRCraft include:

- adult session intentions such as endurance, coordination, strength and mobility;
- circuit/station training and fitness categories;
- material/equipment and location filters;
- children/youth age filters;
- children/youth goals such as endurance, coordination/balance, body awareness and teamwork;
- movement landscapes, parcours and adventure/experience sport concepts;
- the linked SPOK exercise/game collection as a discovery source for additional seed ideas.

Implementation rules:

- [ ] add `external_source_reference` / provenance model
- [ ] source fields: provider, title, URL, retrieval date, source type, notes
- [ ] tag records derived from VIBSS inspiration with `source_provider = VIBSS/LSB NRW`
- [ ] do **not** copy VIBSS text or images verbatim into OCRCraft seed data unless licensing explicitly permits it
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

Seed completeness must be testable, not subjective.

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
- [ ] expert-reviewed, exercise-specific enrichment for all existing 140+ seed exercises (all receive bilingual detail scaffolding; bespoke biomechanical instructions remain open)
- [x] enrich all 25+ running exercises with bilingual, exercise-specific technique, dosage, correction and RPE details
- [ ] add missing categories/facets
- [ ] add richer equipment + station logistics
- [ ] add progression/regression relations
- [ ] update DE/EN search documents to include the new detail fields
- [ ] update autocomplete to use aliases, categories, goals, equipment and OCR tags

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
- [x] fallback structured exercise search
- [x] autocomplete service/API
- [x] autocomplete from exercise names
- [x] autocomplete from exercise aliases
- [ ] BM25 FTS live search
- [ ] index purpose/execution/coaching cues/common mistakes
- [ ] autocomplete from tags/equipment/body regions
- [ ] autocomplete from goals/categories/OCR transfer tags
- [ ] autocomplete from obstacles
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
- [ ] central semantic design-token system instead of page-local colors
- [ ] consistent Card / Form / Table / Filter / Empty-State components
- [ ] **Light mode**
- [ ] **Dark mode**
- [ ] **System mode** following OS/browser preference
- [ ] persistent theme selection
- [ ] theme selector in header/user settings
- [ ] verify contrast/readability in light and dark themes
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
- [ ] use enriched exercise details for ranking and selection
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
- [ ] show concise exercise instructions directly inside a training item
- [ ] expand item to full execution/coaching/safety details
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
- [ ] read-only diagnostic SQL console for Super Admin

## 15. Media & AI-generated exercise illustrations

- [ ] media schema
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

- [ ] generate an AI illustration for every initial seed exercise
- [ ] one image contains child + woman + man versions
- [ ] use consistent OCRCraft clothing/style profile
- [ ] show meaningful start/execution position rather than decorative poses
- [ ] for movement-heavy exercises, use a small 2-step motion sequence within each person area where required to understand the movement
- [ ] review each generated image for biomechanical plausibility and match to written instructions
- [ ] regenerate images that conflict with the exercise description
- [ ] create lower-complexity child presentation without changing the intended exercise unless the child variant differs explicitly

### Image/source metadata

- [ ] `media_type`: image / video / illustration
- [ ] `source_type`: `ai_generated` / `club_created` / `external_reference`
- [ ] `style_profile`
- [ ] `audience_variant`: `kid-woman-man-triptych`
- [ ] `generation_provider`
- [ ] `generation_model`
- [ ] `generation_prompt`
- [ ] `generated_at`
- [ ] `review_status`: pending / approved / rejected
- [ ] `reviewed_by`
- [ ] `source_reference` / originating exercise id
- [ ] visible AI-generated indicator where required
- [ ] ability to regenerate while preserving style profile and source history

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
- [x] seed-size + running coverage assertions
- [x] DE/EN translation/search-doc assertions
- [x] duplicate seed-key assertion
- [x] seed detail completeness tests for required populated DE/EN detail fields, ordered steps, running guidance, OCR prerequisites/fallback/supervision
- [ ] CRUD integration tests
- [ ] autocomplete/search ranking tests
- [ ] Quick Create E2E
- [ ] Training Editor E2E
- [ ] Kids/Youth E2E
- [ ] theme Light/Dark/System E2E
- [ ] media source/provenance tests

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
- [x] name/alias autocomplete API
- [x] read-only Admin search status
- [x] Quick Create UI + body selector

## Next implementation slice

- [x] **expand exercise schema with self-explanatory detail fields** (detail data foundation; further categories and relations remain open)
- [ ] **enrich all 140+ seed exercises, especially all running and OCR exercises**
- [x] enrich and classify every running seed with RPE, bilingual technique cues, corrected steps and common-mistake guidance
- [x] add bilingual, obstacle-specific setup/prerequisite/approach/execution/exit/fallback guidance to every `ocr-skill` and `grip-rig` seed
- [x] enrich all carry/drag/flip seeds with load selection, RPE, safe lifting, route/turn, set-down and regression guidance
- [x] add seed completeness CI rules for bilingual detail fields, execution steps, running and OCR safety fields
- [ ] add richer categories/goals/facets
- [ ] add VIBSS-inspired training-template/source model
- [ ] central UI tokens + Light/Dark/System theme
- [ ] BM25 exercise search over enriched content
- [ ] connect Quick Create to real autocomplete/retrieval
- [ ] body-region/equipment/tag editing
- [ ] deterministic non-AI `TrainingDraft`
- [ ] persisted Training Session CRUD
- [ ] media schema + AI exercise-image pipeline foundation
- [ ] authentication/RBAC before global Admin mutations

---

# MVP acceptance

- [ ] selectable German/English UI
- [ ] Light/Dark/System theme
- [ ] every initial exercise understandable without assumed advanced exercise knowledge
- [ ] every initial exercise has structured setup/execution/coaching/common-mistake data
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
- [ ] AI example illustration for every initial seed exercise
- [ ] each generated exercise illustration contains child + woman + man version
- [ ] illustration source/generation metadata stored and reviewable
- [ ] Admin users/groups/media/settings/DB
- [ ] training version history
- [ ] age/group/risk rules before save
- [ ] print / trainer display

## Reference principle

LSB Hessen / Sportjugend Hessen / DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding are used as professional planning guidance. OCR-specific obstacle/race concepts remain separate configurable OCR/club-domain rules rather than being presented as universal LSB rules.

VIBSS / Landessportbund NRW is used as a reference/inspiration source for session structures, goals, age-group ideas, materials, locations, games and exercise discovery. OCRCraft should keep source provenance and independently author its own seed descriptions rather than copying external text or imagery verbatim.
