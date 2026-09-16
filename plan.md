# OCRCraft — Product & Implementation Plan

> **Status:** Active implementation plan  
> **Primary language:** German (`de-DE`)  
> **Secondary language:** English (`en`)  
> **Core stack:** TypeScript, Next.js/React, Tailwind CSS, DuckDB, DuckDB FTS  
> **Training framework:** LSB/DOSB-oriented recreational sport principles + OCR-specific and configurable club rules

## Status legend

- [x] implemented and present on `main`
- [ ] not implemented yet
- A partially implemented area is split into completed and remaining subtasks instead of using an ambiguous third state.

---

## 1. Product vision

OCRCraft is a fast training-planning system for OCR clubs and recreational/functional sport. Trainers should be able to create, edit, search, combine, recreate and AI-compose complete training sessions with a clear structure:

1. **Warm-up / Aufwärmen**
2. **Main Part / Hauptteil**
3. **Cooldown & Stretching / Cooldown & Dehnen**

The system must support adults, children/youth, mixed ability groups, OCR technique, functional strength, circuits and running-focused sessions.

---

## 2. Engineering foundation

- [x] Next.js App Router project
- [x] TypeScript strict project configuration
- [x] Tailwind CSS design foundation
- [x] React component architecture
- [x] clean separation between UI, domain, server services and persistence
- [x] DuckDB Node integration
- [x] migration runner
- [x] CI on `main`
- [x] ESLint
- [x] TypeScript typecheck
- [x] Vitest
- [x] production build validation
- [x] project engineering skill for Clean Code / modular TypeScript
- [x] project UI/UX design skill
- [x] project OCR + Breitensport training skill
- [x] `AGENTS.md` tying the project rules together
- [ ] authentication
- [ ] authorization / RBAC enforcement
- [ ] production deployment configuration

### Engineering rules

- Domain logic must not depend on React or DuckDB.
- UI components must not contain SQL or persistence rules.
- Database access stays behind repositories/services.
- AI output is never authoritative; deterministic validation is applied before save/use.
- Prefer small reusable components and composable services over page-local implementations.

---

## 3. Training domain

- [x] typed training-session model
- [x] typed phases: warm-up, main, cooldown
- [x] typed exercise/session risk levels
- [x] session-duration validation
- [x] required-phase validation
- [x] group/risk validation foundation
- [x] domain unit tests
- [ ] station-capacity validation
- [ ] simultaneous equipment-conflict validation
- [ ] transition/setup-time validation
- [ ] age-specific club-rule engine
- [ ] progression/regression rule engine
- [ ] training-load / recent-use rule engine

---

## 4. DuckDB schema & persistence

- [x] schema migration table
- [x] exercise base table
- [x] DE/EN exercise translations
- [x] exercise aliases
- [x] body regions
- [x] movement patterns
- [x] tags
- [x] equipment and exercise-equipment mappings
- [x] club groups foundation
- [x] training sessions
- [x] training phases
- [x] training items
- [x] German search-document table
- [x] English search-document table
- [x] search-index state table
- [x] idempotent database-ready bootstrap
- [x] multi-statement migration execution
- [x] in-memory DuckDB integration test for migrations + initial seed
- [ ] training version snapshots
- [ ] favorites/recent-use tables
- [ ] media tables
- [ ] user/role tables
- [ ] audit-log table
- [ ] templates table
- [ ] AI generation audit/source tables

---

## 5. Initial exercise database

A new OCRCraft database must be immediately useful and must not start empty.

### Coverage

- [x] **140+ seed exercises validated by CI**
- [x] **25+ running exercises validated by CI**
- [x] German names/content
- [x] English names/content
- [x] common aliases for search/autocomplete
- [x] equipment catalogue
- [x] body-region catalogue
- [x] movement-pattern catalogue
- [x] tags
- [x] generated DE/EN search documents
- [x] unique stable `seed_key` values
- [x] duplicate seed-key protection

### Seed categories

- [x] warm-up
- [x] mobility / movement preparation
- [x] functional strength
- [x] core
- [x] running
- [x] grip & rig
- [x] carries & lifts
- [x] OCR skills / obstacle technique
- [x] balance & agility
- [x] throwing
- [x] cooldown / stretching

### Running pool

- [x] easy continuous running
- [x] run/walk intervals
- [x] tempo run
- [x] fartlek / Fahrtspiel
- [x] short intervals
- [x] long intervals
- [x] hill repeats
- [x] shuttle runs
- [x] strides / Steigerungsläufe
- [x] acceleration and deceleration drills
- [x] A-Skip
- [x] B-Skip
- [x] Ankling / footwork
- [x] running ABC high knees
- [x] running ABC butt kicks
- [x] bounding / Sprunglauf
- [x] cadence running
- [x] cone slalom
- [x] lateral running/shuffle
- [x] relay running
- [x] trail running
- [x] stair running
- [x] run + exercise every 100 m
- [x] run-to-obstacle transitions
- [ ] route/GPS-aware running sessions
- [ ] pace/zone based running prescription

### OCR pool

- [x] dead/active hangs
- [x] towel/ring grip variants
- [x] monkey bars
- [x] ring traverse
- [x] rope grip / rope climb progression
- [x] rig transitions
- [x] farmer/suitcase carry
- [x] sandbag carries
- [x] bucket carry
- [x] atlas carry
- [x] sled/tire drag
- [x] tire flip
- [x] crawls
- [x] low/high-wall skill foundation
- [x] cargo net
- [x] rope traverse
- [x] Rig & Run interval
- [x] balance obstacles
- [x] medicine-ball / sandbag / target throws
- [x] spear-target drill
- [ ] richer obstacle prerequisites/progressions per obstacle
- [ ] detailed setup dimensions/capacity per obstacle

### Seed enrichment still needed

- [ ] detailed coaching cues for every seed exercise
- [ ] common mistakes for every seed exercise
- [ ] explicit Level 1/2/3 variants for all relevant exercises
- [ ] finer body-region mapping per exercise instead of category baseline only
- [ ] richer movement-pattern mapping per exercise
- [ ] child-specific alternatives and restrictions for all relevant exercises
- [ ] demo images/videos or media placeholders

---

## 6. Exercise library

- [x] `/exercises` page
- [x] database-backed list
- [x] text search
- [x] category filter
- [x] aliases included in search
- [x] visible total/category/running counts
- [x] equipment shown on exercise cards
- [x] risk/min-age shown
- [ ] create exercise UI
- [ ] edit exercise UI
- [ ] archive exercise
- [ ] restore exercise
- [ ] hard delete restricted to safe/admin scenarios
- [ ] edit translations
- [ ] edit aliases
- [ ] edit body regions
- [ ] edit movement patterns
- [ ] edit equipment requirements
- [ ] edit tags
- [ ] progression/regression relationships
- [ ] duplicate detection
- [ ] bulk administration
- [ ] CSV/JSON import/export

---

## 7. Search & autocomplete

- [x] denormalized German search documents
- [x] denormalized English search documents
- [x] search-index health state
- [x] DuckDB FTS rebuild service foundation
- [x] German stemming configuration
- [x] English stemming configuration
- [x] dirty/rebuild model because DuckDB FTS does not auto-update after writes
- [x] current exercise-library fallback search via structured SQL/aliases
- [ ] use BM25 FTS for live exercise search
- [ ] autocomplete term table/service
- [ ] autocomplete from names
- [ ] autocomplete from aliases
- [ ] autocomplete from tags
- [ ] autocomplete from equipment
- [ ] autocomplete from obstacles
- [ ] autocomplete from existing trainings/blocks
- [ ] configurable search profiles
- [ ] configurable field weights
- [ ] favorites/recent-use boosting
- [ ] admin reindex/status UI

---

## 8. UI/UX foundation

- [x] reusable application shell
- [x] responsive trainer dashboard
- [x] reusable training phase card
- [x] Quick Create route
- [x] accessible visual body-region selector
- [x] front/back body selection
- [x] tablet/desktop-oriented UI foundation
- [x] touch-friendly controls
- [ ] active navigation state derived from route
- [ ] mobile navigation
- [ ] reusable form field system
- [ ] toast/feedback system
- [ ] undo/redo system
- [ ] trainer presentation/full-screen mode
- [ ] print view
- [ ] accessibility audit

---

## 9. Quick Create Wizard

- [x] target group: kids/youth/adults/mixed
- [x] age input
- [x] participant count
- [x] duration
- [x] training goals
- [x] body-region selection
- [x] format selection
- [x] intensity orientation
- [x] mixed-level concept
- [x] formats: circuit
- [x] formats: Rig & Run
- [x] formats: AMRAP
- [x] formats: EMOM
- [x] formats: Tabata style
- [x] formats: Run + Exercise
- [x] formats: technique
- [x] formats: relay/team
- [ ] location selection
- [ ] available-equipment selection
- [ ] available-obstacle selection
- [ ] group split configuration
- [ ] station capacity planning
- [ ] “avoid body region” selection
- [ ] connect wizard to real exercise retrieval
- [ ] create real `TrainingDraft`
- [ ] save generated draft

---

## 10. Training formats

- [x] format taxonomy defined in product model/plan
- [x] circuit concept
- [x] station training concept
- [x] Tabata-style concept
- [x] AMRAP concept
- [x] EMOM concept
- [x] running + exercise concept
- [x] Rig & Run concept
- [x] technique block concept
- [x] relay/team concept
- [ ] generic interval-block model
- [ ] rounds-for-time
- [ ] rounds-for-quality
- [ ] ladder/reverse ladder
- [ ] pyramid
- [ ] chipper
- [ ] partner workout
- [ ] configurable “every X metres/minutes/checkpoint” trigger model
- [ ] format-specific duration/work-rest validation

---

## 11. Training editor

Target: a trainer can build a complete session quickly from the pool and modify only what is necessary.

- [x] dashboard example renders typed training data
- [x] reusable phase visualization
- [ ] create session
- [ ] edit session metadata
- [ ] add/remove phase items
- [ ] search-and-add exercise
- [ ] drag/drop reorder
- [ ] replace with similar exercise
- [ ] easier/harder action
- [ ] alternate equipment action
- [ ] Level 1/2/3 editor
- [ ] circuit/station editor
- [ ] duration arithmetic in editor
- [ ] duplicate session
- [ ] archive/restore session
- [ ] combine sessions
- [ ] recreate session with changed constraints
- [ ] version history
- [ ] compare/restore version
- [ ] save as template

---

## 12. AI Training Builder

Architecture principle: **retrieve first, compose second, validate deterministically, trainer approves**.

- [ ] provider-neutral AI interface
- [ ] structured Zod AI schemas
- [ ] retrieve approved exercises from DuckDB
- [ ] create complete training
- [ ] regenerate warm-up only
- [ ] regenerate main part only
- [ ] regenerate cooldown only
- [ ] replace selected exercise only
- [ ] make easier/harder
- [ ] adapt duration
- [ ] adapt participant count
- [ ] adapt adults ↔ kids/youth
- [ ] adapt available equipment
- [ ] increase/decrease running focus
- [ ] combine selected prior sessions
- [ ] avoid recently used exercises
- [ ] create Level 1/2/3
- [ ] AI-created exercise draft workflow
- [ ] explicit trainer approval before AI draft enters master pool
- [ ] store generation source/context for traceability

---

## 13. Children & youth / safeguarding

- [x] audience and age exist in domain/wizard
- [x] risk validation foundation
- [x] project training skill documents safeguarding principles
- [ ] saved Kids/Youth club profiles
- [ ] allowed/restricted obstacle rules
- [ ] supervision rules
- [ ] age-specific maximum risk rules
- [ ] media-consent metadata
- [ ] trainer qualification rules
- [ ] explicit explanation in UI when an exercise is blocked
- [ ] AI must be unable to override club restrictions

No child names or medical profiles are required for normal group training planning.

---

## 14. Groups

- [x] `club_groups` DB foundation
- [ ] group management UI
- [ ] saved age ranges
- [ ] normal participant count
- [ ] default session duration
- [ ] available equipment/location defaults
- [ ] preferred formats
- [ ] club rules profile
- [ ] group skill distribution

Suggested presets:

- [ ] OCR Kids 8–11
- [ ] OCR Youth 12–15
- [ ] OCR Beginners
- [ ] OCR Advanced
- [ ] OCR Competition
- [ ] Running Group
- [ ] Open Club Training

---

## 15. Admin

- [ ] admin dashboard
- [ ] user management
- [ ] role management
- [ ] group management
- [ ] exercise management
- [ ] obstacle management
- [ ] media management
- [ ] training-template management
- [ ] club-rule management
- [ ] search-profile management
- [ ] AI settings
- [ ] DuckDB status
- [ ] schema version display
- [ ] FTS status
- [ ] rebuild German FTS
- [ ] rebuild English FTS
- [ ] backup
- [ ] restore
- [ ] import/export
- [ ] read-only SQL diagnostics for Super Admin

---

## 16. Media

- [ ] media metadata schema
- [ ] exercise images
- [ ] exercise galleries
- [ ] exercise videos
- [ ] external video links
- [ ] thumbnails/posters
- [ ] copyright/source metadata
- [ ] consent metadata
- [ ] orphaned-media detection
- [ ] S3-compatible storage abstraction

Large media must not be stored directly in DuckDB by default.

---

## 17. Internationalization

- [x] DB model supports `de` and `en`
- [x] initial exercise catalogue contains DE/EN names/content
- [x] DE/EN search-document tables
- [ ] application route/UI localization
- [ ] German UI dictionary
- [ ] English UI dictionary
- [ ] language selector
- [ ] translation completeness indicator in Admin

---

## 18. Testing & quality gates

- [x] GitHub Actions CI
- [x] lint gate
- [x] typecheck gate
- [x] unit-test gate
- [x] production-build gate
- [x] training-validation unit tests
- [x] real in-memory DuckDB migration test
- [x] seed-size validation
- [x] running-seed coverage validation
- [x] DE/EN seed translation validation
- [x] DE/EN search-document validation
- [x] duplicate seed-key validation
- [ ] exercise repository integration tests
- [ ] search ranking tests
- [ ] CRUD integration tests
- [ ] Quick Create E2E test
- [ ] training editor E2E test
- [ ] Kids/Youth rule E2E test

---

## 19. Practical analytics

- [ ] exercise usage frequency
- [ ] underused exercises
- [ ] body-region coverage
- [ ] movement-pattern coverage
- [ ] obstacle exposure
- [ ] running volume by group
- [ ] recent repetition warnings
- [ ] search queries with no result
- [ ] AI suggestions frequently replaced by trainers

Do not turn OCRCraft into athlete surveillance.

---

## 20. Current implementation milestone

### Completed foundation

- [x] project architecture
- [x] specialized project skills
- [x] CI/toolchain
- [x] training domain + validation
- [x] DuckDB base schema/migrations
- [x] Quick Create UI
- [x] body selector
- [x] 140+ initial exercise pool
- [x] 25+ running exercise pool
- [x] OCR-specific initial pool
- [x] DE/EN seed content
- [x] exercise-library read/search/filter UI
- [x] FTS rebuild service foundation

### Next implementation slice

- [ ] Exercise create/edit/archive/restore service
- [ ] Exercise create/edit UI
- [ ] mark search documents/index dirty on CRUD changes
- [ ] BM25 search integration
- [ ] autocomplete service
- [ ] search settings/admin status UI
- [ ] connect Quick Create to exercise retrieval
- [ ] generate first non-AI deterministic `TrainingDraft`

---

## 21. MVP acceptance checklist

- [ ] trainer can choose German or English UI
- [ ] trainer/admin can manage exercises and OCR obstacles
- [ ] trainer can search exercises and previous trainings quickly
- [ ] admin can configure search/autocomplete sources
- [ ] trainer can create a complete Warm-up/Main/Cooldown session manually
- [x] visual body-region selector exists
- [x] Quick Create interaction exists
- [ ] Quick Create produces a real persisted training draft
- [ ] trainer can split exercises by groups/levels
- [ ] circuit/Tabata/AMRAP/EMOM/Rig & Run blocks can be persisted and edited
- [ ] running + exercise rules such as every 100 m can be persisted
- [ ] Level 1/2/3 progressions can be saved
- [ ] sessions can be duplicated, combined and recreated
- [ ] AI can generate/modify a complete training from approved pool
- [ ] AI can be constrained to approved exercises
- [ ] AI-created exercises require approval
- [ ] admin can manage users/groups/exercises/media/settings
- [ ] admin can inspect/rebuild DuckDB FTS
- [ ] training history is versioned
- [ ] group/age/risk restrictions run before save
- [ ] final training can be printed/displayed clearly in the hall

---

## 22. Reference principles

The application is informed by Landessportbund Hessen / Sportjugend Hessen and DOSB themes such as structured session planning, target-group orientation, warm-up, endurance, strength, mobility, coordination, functional movement, relaxation and safeguarding. OCR-specific obstacle/race concepts are modeled separately as club/OCR domain rules rather than presented as universal LSB rules.

Primary external references remain listed in the project documentation and should be reviewed when rule-driven features are implemented.
