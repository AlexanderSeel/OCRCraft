# OCR Club Training Planner — `plan.md`

> **Status:** Product & implementation plan  
> **Primary language:** German (`de-DE`)  
> **Secondary language:** English (`en`)  
> **Reference framework:** Landessportbund Hessen / Sportjugend Hessen principles + configurable club rules  
> **Core stack:** TypeScript, Next.js/React, Tailwind CSS, DuckDB, DuckDB FTS, Node.js, AI provider abstraction

---

## 1. Product vision

Build a fast, trainer-friendly system for an OCR club to:

- create, edit, copy, version, delete and restore exercises and complete training sessions;
- search a large exercise/training pool with DuckDB Full-Text Search;
- combine existing sessions or individual blocks into new sessions;
- recreate an old session with changed duration, group, focus or equipment;
- generate complete training sessions with AI;
- regenerate only a phase, block or exercise while preserving the rest;
- create sessions for adults, children, youth and mixed-ability groups;
- support OCR, functional training and running-focused sessions;
- support stations, circuits, Tabata, AMRAP, EMOM, intervals, Rig & Run and mixed formats;
- visually select target body regions;
- manage exercises, obstacles, images, videos, users, groups and search settings;
- work primarily in German while allowing an English UI and English exercise/session content.

The product should optimize for **“complete a good training in a few minutes”** rather than maximum form complexity.

---

## 2. Guiding principles

### 2.1 Training structure

Every generated or manually created training is based on three required phases:

1. **Warm-up / Aufwärmen**
2. **Main part / Hauptteil**
3. **Cooldown & Stretching / Cooldown & Dehnen**

Optional sections:

- briefing / objective;
- movement preparation;
- technique / obstacle skill block;
- transition / hydration break;
- finisher;
- reflection / feedback.

Duration ratios must be configurable by club, group, age and session type.

### 2.2 LSB-oriented design

The planner should reflect training themes emphasized by Landessportbund Hessen education:

- structured lesson/training planning;
- appropriate warm-up;
- movement teaching and technique;
- functional movement;
- endurance;
- strength;
- coordination;
- circuit training;
- relaxation/cooldown;
- body awareness;
- age- and target-group-aware instruction.

For children and youth, configurable club rules must also cover:

- age-appropriate exercises;
- trainer qualification requirements;
- supervision requirements;
- media/privacy consent;
- child safeguarding rules;
- prohibited or restricted exercises/obstacles;
- maximum risk level.

The application supports trainers but does not replace trainer qualification, first aid readiness, risk assessment or the club safeguarding concept.

---

## 3. Recommended technical architecture

### Frontend

- TypeScript
- React + Next.js
- Tailwind CSS
- accessible component primitives
- responsive desktop/tablet design
- drag & drop for blocks/stations
- keyboard-first quick-add and command palette
- optional PWA/read-only offline trainer mode later

### Backend

Use Next.js Node runtime or a small dedicated TypeScript application service.

```text
UI
  -> Server Actions / API
    -> Application Services
      -> Validation & Training Rules
      -> Search Service
      -> AI Generation Service
      -> Repository Layer
        -> DuckDB
```

DuckDB must never be accessed directly from React components.

### DuckDB

Use:

```text
@duckdb/node-api
```

DuckDB is the MVP application/search store.

Because DuckDB is not a classic high-concurrency OLTP server:

- keep one application writer;
- serialize writes through a queue/mutex;
- use transactions for related mutations;
- abstract persistence through repositories;
- keep a migration path to PostgreSQL if concurrent editing grows significantly.

### Media storage

Do not store large videos as DuckDB BLOBs by default.

Store metadata in DuckDB and media in:

- local `/data/media`, or
- S3-compatible object storage.

Support:

- images;
- galleries;
- exercise demo videos;
- external video URLs;
- thumbnails/posters;
- optional QR targets for hall use.

### AI integration

Use a provider-neutral interface:

```ts
interface TrainingAiProvider {
  generateTraining(input: TrainingGenerationRequest): Promise<TrainingDraft>;
  regenerateBlock(input: RegenerateBlockRequest): Promise<TrainingBlock>;
  createExercise(input: ExerciseGenerationRequest): Promise<ExerciseDraft>;
}
```

AI output must be structured JSON and validated with Zod before display/save.

---

## 4. Main navigation

```text
Dashboard
Training
Exercises
Obstacles
Quick Create
AI Create
Groups
Media
Templates
Admin
Settings
```

Dashboard should show:

- recent/upcoming sessions;
- quick Create Training;
- recreate last training;
- favorite templates;
- recently used exercises;
- incomplete drafts;
- focus history;
- recent body-region coverage.

---

## 5. Training session domain model

```text
Training Session
├─ Metadata
├─ Group / audience
├─ Objectives
├─ Equipment / location
├─ Warm-up
│  └─ blocks/items
├─ Main part
│  └─ blocks/items
├─ Cooldown / stretching
│  └─ blocks/items
├─ Alternatives / progressions
├─ Safety notes
└─ Trainer notes
```

Session metadata:

- title;
- date/time;
- trainers;
- group;
- age range;
- participant count;
- total duration;
- language;
- location;
- indoor/outdoor;
- difficulty;
- target intensity;
- session type;
- focus;
- body regions;
- movement patterns;
- required equipment;
- OCR obstacles;
- tags;
- notes;
- source: manual/template/copied/combined/AI/imported;
- version;
- status: draft/ready/completed/archived.

---

## 6. Exercise model

Each exercise should contain enough structured information for search, AI composition, progressions and substitutions.

Core fields:

- German name;
- English name;
- aliases/synonyms;
- short description;
- coaching instructions;
- common mistakes;
- technique cues;
- duration/repetition/distance options;
- intensity;
- difficulty;
- risk level;
- minimum recommended age;
- maximum participant count per station;
- supervision level;
- indoor/outdoor;
- space requirement;
- tags;
- active/archive state.

Movement patterns:

- run, walk, crawl;
- squat, lunge, hinge;
- push, pull;
- carry, drag;
- climb, hang, swing;
- rotate, brace;
- balance;
- jump, land;
- throw, catch;
- mobility, stretch;
- breathing/recovery.

Body regions:

- neck;
- shoulders;
- chest;
- upper back/lats;
- upper arms;
- forearms/grip;
- core/anterior;
- obliques;
- lower back;
- hips/glutes;
- quadriceps;
- hamstrings;
- adductors/abductors;
- calves;
- ankles/feet;
- full body.

Each body-region relation can include primary/secondary, load score and mobility/stability/strength/endurance emphasis.

Every exercise can define:

- easier regression;
- standard variation;
- harder progression;
- child variation;
- low-impact alternative;
- no-equipment alternative;
- partner alternative.

---

## 7. OCR obstacle catalogue

Seed a broad OCR-specific catalogue.

### Carries

- kettlebell farmer carry;
- suitcase carry;
- sandbag bear-hug carry;
- sandbag shoulder/front carry;
- bucket carry;
- atlas stone/ball carry;
- weighted object carry;
- team carry;
- uneven carry.

### Walls & climbing

- low/high wall;
- sloped wall;
- inverted wall;
- over-under wall;
- cargo net;
- rope climb;
- rope traverse;
- ladder climb;
- wall traverse.

### Rig / hanging

- dead hang;
- pull-up bar;
- monkey bars;
- offset monkey bars;
- multi-rig;
- rings/ring traverse;
- rope-to-ring transitions;
- nunchuck-style holds;
- ball/grip holds;
- peg-style traverse;
- lateral bar traverse.

### Balance

- balance beam;
- narrow beam;
- stepping blocks;
- wobble board;
- slackline-style trainer;
- balance traverse;
- unstable carries.

### Ground movement

- bear crawl;
- crab walk;
- low crawl;
- army crawl;
- tunnel crawl;
- obstacle crawl;
- tire steps.

### Pull / drag / lift

- sled drag;
- rope pull;
- object/tire drag;
- tire flip;
- sandbag ground-to-shoulder;
- atlas stone/ball load;
- hoist/pulley simulation.

### Throwing

- spear-style target throw;
- medicine ball target throw;
- sandbag target throw;
- ball throw;
- overhead throw;
- rotational throw.

### Jumps / agility

- box step-up;
- box jump;
- broad jump;
- hurdle/lateral hurdle;
- precision jump;
- agility ladder;
- cone change-of-direction.

Each obstacle stores dimensions/configuration, equipment, target skills, body regions, grip type, difficulty, risk, age rules, prerequisites, setup time, capacity and fallback exercise.

---

## 8. Training formats

### Core formats

- free structured session;
- classic circuit / Zirkel;
- station training;
- Tabata-style intervals;
- AMRAP;
- EMOM;
- E2MOM/configurable interval clock;
- rounds for quality;
- rounds for time;
- ladder/reverse ladder;
- pyramid;
- chipper;
- work/rest intervals;
- partner/team workout;
- relay;
- technique/skill block;
- obstacle workshop;
- strength-endurance;
- mobility/recovery;
- benchmark/retest;
- game-based kids session.

### Running formats

- easy continuous run;
- technique running;
- interval running;
- tempo segments;
- fartlek;
- hill intervals;
- relay running;
- running drills / Lauf-ABC;
- shuttle runs;
- trail/OCR running;
- run + obstacle;
- run + exercise.

### Run + exercise builder

Support patterns like:

```text
Repeat until 4 km complete:
  Run 400 m
  10 Sandbag Squats
  Run 400 m
  20 m Bear Crawl
```

or:

```text
Every 100 m:
  choose 1 exercise from pool
  Level 1 = 5 reps
  Level 2 = 10 reps
  Level 3 = harder variation
```

Triggers:

- every X metres;
- every X minutes;
- checkpoint;
- random station;
- trainer-selected station.

### OCR-specific formats

- Rig & Run;
- Obstacle + Run circuit;
- Grip & Carry;
- Wall technique;
- Monkeybar/Rig progression;
- OCR race simulation;
- OCR team relay;
- obstacle skill + conditioning;
- obstacle efficiency;
- obstacle transition practice.

---

## 9. Quick Create Wizard

The wizard should generate a usable complete draft with minimal typing.

### Step 1 — Group

- saved group or ad-hoc;
- adults/kids/youth/mixed;
- age/range;
- participant count;
- skill level;
- OCR experience;
- mixed-level yes/no.

Kids/youth groups automatically activate additional safeguarding and age-rule validation.

### Step 2 — Duration & location

- total duration;
- indoor/outdoor;
- hall/field/forest/track/rig;
- available space;
- equipment;
- obstacles.

### Step 3 — Goal

Multi-select:

- full body;
- endurance;
- strength endurance;
- strength;
- grip;
- core;
- upper/lower body;
- push/pull/carry;
- running/speed;
- agility;
- balance;
- coordination;
- mobility;
- OCR technique;
- race preparation;
- fun/team building.

### Step 4 — Body map

Interactive front/back body diagram:

- click/tap body regions;
- multi-select;
- primary/secondary target;
- avoid region;
- show recent load;
- reset/full body.

Selections feed search and AI.

### Step 5 — Format

Allow mixed phase formats, for example:

```text
Warm-up: Game + Mobility
Main 1: Technique Stations
Main 2: Rig & Run
Finisher: Tabata
Cooldown: Mobility
```

Start from recommended, favorite template, recent training or blank.

### Step 6 — Group split

- no split;
- 2/3/4+ groups;
- ability groups;
- same stations with different levels;
- rotating stations;
- separate skill/conditioning groups;
- partner pairs;
- teams.

System checks station capacity against participant count.

### Step 7 — Intensity & difficulty

- easy/moderate/hard;
- technique-first/balanced/conditioning-first;
- low-impact;
- competition preparation;
- beginner-safe;
- child-friendly.

### Step 8 — Generate

Options:

- existing exercises only;
- allow AI-created draft exercises;
- prefer favorites;
- avoid recently used;
- reuse successful exercises;
- allow repeated obstacles;
- create Level 1/2/3 variants.

Generated result opens in the standard editor.

---

## 10. Fast Training Editor UX

Desktop/tablet layout:

```text
┌───────────────────────────────────────────────────────────┐
│ Session header: group | duration | focus | save | AI      │
├───────────────┬─────────────────────────┬─────────────────┤
│ Search/       │ Training timeline       │ Item inspector  │
│ library       │                         │                 │
│               │ Warm-up                 │ reps/time       │
│ Exercises     │ ├─ item                 │ level           │
│ Templates     │ ├─ item                 │ progression     │
│ Recent        │                         │ equipment       │
│ Favorites     │ Main                    │ notes           │
│               │ ├─ block               │ body regions    │
│               │ └─ block               │                 │
│               │ Cooldown                │                 │
└───────────────┴─────────────────────────┴─────────────────┘
```

Fast actions:

- drag exercise into phase;
- quick-add with keyboard;
- duplicate;
- replace with similar;
- easier/harder;
- alternate equipment;
- swap obstacle;
- change reps/time/distance;
- convert to station;
- convert block to AMRAP/Tabata/EMOM;
- split into Level 1/2/3;
- ask AI to modify selection only.

Session operations:

- duplicate;
- recreate;
- combine;
- save as template;
- archive/restore;
- version compare;
- export/print;
- shared/QR view later.

Combine workflow can select warm-up from A, main from B, cooldown from C and optionally let AI harmonize duration/duplicates/transitions.

---

## 11. DuckDB data model

Suggested tables:

```text
users
roles
user_roles

club_groups
group_rules

exercises
exercise_translations
exercise_aliases
exercise_progressions
exercise_regressions
exercise_tags
exercise_body_regions
exercise_equipment
exercise_obstacles
exercise_media

equipment
obstacles
body_regions
movement_patterns
tags

training_sessions
training_session_versions
training_phases
training_blocks
training_items
training_item_levels
training_item_alternatives
training_tags
training_body_regions
training_equipment

templates
favorite_items
recent_usage

media_assets
media_consents

search_documents_de
search_documents_en
search_profiles
search_profile_weights
autocomplete_terms

ai_generation_runs
ai_generation_sources

app_settings
club_rules
audit_log
schema_migrations
```

Use UUIDs and explicit `created_at`, `updated_at`, `created_by`, `updated_by` fields.

Prefer soft delete/archive for sessions and exercises so historic versions remain reproducible.

---

## 12. Search architecture

Search across:

- exercises;
- obstacles;
- complete trainings;
- training blocks;
- templates;
- tags;
- equipment;
- trainer notes when enabled.

### DuckDB FTS

Create language-specific denormalized search-document tables.

German example:

```sql
PRAGMA create_fts_index(
  'search_documents_de',
  'document_id',
  'title',
  'aliases',
  'summary',
  'tags',
  'body_regions',
  'movement_patterns',
  'equipment',
  'obstacles',
  'instructions',
  stemmer = 'german',
  stopwords = 'german_stopwords',
  strip_accents = 1,
  lower = 1,
  overwrite = 1
);
```

English uses an English stemmer/stopword configuration.

### FTS refresh strategy

DuckDB FTS indexes do not automatically reflect changes to source data. Therefore all mutations go through a managed pipeline:

```text
CRUD mutation
  -> transaction commit
  -> mark search index dirty
  -> rebuild denormalized search docs if required
  -> debounce/rebuild FTS
  -> expose status
```

Admin states:

- healthy;
- dirty;
- rebuilding;
- failed;
- last rebuilt at;
- indexed document count.

Provide a manual **Rebuild Search Index** action.

### Search profiles

Profiles:

- Default;
- OCR Focus;
- Kids;
- Running;
- Warm-up;
- Rig;
- Admin/Everything.

Each profile controls:

- entity types;
- enabled fields;
- title/alias/tag/body-region/equipment/obstacle/instruction weights;
- favorite/recent boosts;
- exact-match boost;
- default filters;
- DE/EN/both;
- max results;
- autocomplete sources.

Blend BM25 field scores in the application layer to implement configurable weighting.

### Autocomplete

Combine:

1. exact/prefix names;
2. aliases;
3. tags;
4. obstacles;
5. equipment;
6. body regions;
7. recent exercises;
8. favorites;
9. frequent combinations;
10. existing training blocks.

Maintain `autocomplete_terms` for fast prefix lookup.

---

## 13. Search filters

Structured filters alongside FTS:

- phase;
- age range;
- group;
- difficulty;
- intensity;
- risk;
- body region;
- movement pattern;
- duration;
- reps/distance;
- equipment;
- obstacle;
- location;
- indoor/outdoor;
- station capacity;
- training format;
- child-friendly;
- low-impact;
- favorite;
- recently used/never used;
- language.

Example query:

```text
"grip beginner"
+ Main Part
+ 12–16 years
+ Rig
+ no rope
+ low/medium risk
```

---

## 14. AI Training Builder

### Retrieval-first generation

Do not generate blindly.

```text
Wizard/Input
  -> normalize requirements
  -> search exercise/training pool
  -> retrieve best exercises/templates
  -> build AI context
  -> AI returns TrainingDraft
  -> deterministic validation
  -> trainer preview
  -> save after approval
```

AI actions:

- create complete training;
- create only warm-up/main/cooldown;
- fill missing duration;
- replace exercise;
- make easier/harder;
- more OCR-specific;
- more running-heavy;
- lower impact;
- adults -> kids / kids -> adults;
- 60 -> 90 minutes;
- adapt participant count;
- adapt available equipment;
- split groups;
- create Level 1/2/3;
- combine selected trainings;
- recreate previous training without repetition;
- translate DE/EN;
- draft a new exercise.

### AI-created exercises

AI may only create a draft exercise containing:

- generated badge;
- description;
- target body regions;
- movement pattern;
- equipment;
- risk level;
- regression;
- progression;
- safety notes;
- reason why it fits.

Trainer/admin approval is required before the new exercise becomes reusable master data.

### Deterministic validation

Validate independently of AI:

- total time;
- phase presence;
- work/rest arithmetic;
- rounds;
- station capacity;
- participant count;
- equipment conflicts;
- body-region targets;
- age restrictions;
- risk restrictions;
- prerequisites;
- duplicates;
- missing alternatives;
- transition/setup time;
- run-distance totals.

Show warnings instead of silently correcting the plan.

---

## 15. Body map / muscle visual

Reusable component:

```ts
type BodyRegionSelection = {
  regionId: string;
  side: "front" | "back" | "both";
  priority: "primary" | "secondary" | "avoid";
};
```

Features:

- front/back toggle;
- touch-friendly anatomical zones;
- selected-region summary;
- primary/secondary/avoid state;
- optional recent-load overlay.

Use in exercise editor, wizard, phase editor, individual items, search and analytics.

The body graphic represents broad training areas, not medical anatomy.

---

## 16. Children & youth mode

A group can activate Kids/Youth Mode.

Configuration:

- age range;
- session length defaults;
- permitted difficulty;
- allowed risk levels;
- restricted obstacles;
- trainer/supervision rules;
- game-based warm-up preference;
- station complexity;
- contact/partner exercise policy;
- image/video consent policy.

Rules:

- restricted exercises visibly blocked;
- AI cannot override group restrictions;
- trainer sees why an item is restricted;
- group rules outrank search relevance and AI suggestions.

Do not require personal child profiles for basic planning. Group planning should work without storing children’s names.

---

## 17. Group management

`club_groups` supports:

- name/type;
- age range;
- normal participant count;
- skill distribution;
- default duration;
- usual location;
- available equipment;
- preferred formats;
- restrictions;
- goals;
- default language;
- rules profile.

Examples:

```text
OCR Kids 8–11
OCR Youth 12–15
OCR Beginners
OCR Advanced
OCR Competition
Running Group
Open Club Training
```

---

## 18. User & role management

### Super Admin

- system configuration;
- users/roles;
- DuckDB administration;
- migrations;
- backup/restore;
- AI provider configuration.

### Club Admin

- users;
- groups;
- exercises;
- obstacles;
- media;
- templates;
- club rules;
- search profiles.

### Trainer

- create/edit training;
- exercise drafts;
- AI generation;
- media upload when permitted.

### Assistant Trainer

- create drafts;
- edit assigned sessions;
- no global rule changes.

### Viewer

- view/print/share approved sessions.

Sensitive changes must be written to `audit_log`.

---

## 19. Exercise & media admin

Exercise admin:

- table/grid view;
- bulk tagging;
- bulk body-region mapping;
- duplicate detection;
- translation status;
- missing media filter;
- missing regression/progression filter;
- archive/restore;
- AI-assisted description/translation drafts;
- CSV/JSON import/export.

Media manager:

- upload;
- image crop/thumbnail;
- video metadata;
- alt text;
- exercise assignment;
- copyright/source;
- consent status;
- archive/delete;
- orphaned-media detection.

---

## 20. DuckDB admin interface

Overview:

- DB file/location;
- DuckDB version;
- tables/views;
- row counts;
- file size;
- last backup/checkpoint;
- migration version;
- FTS status;
- search document counts.

Maintenance:

- rebuild German FTS;
- rebuild English FTS;
- rebuild autocomplete;
- rebuild search documents;
- export data;
- create backup;
- restore backup with confirmation;
- import seed pack;
- run migrations;
- integrity/health checks.

Optional Super Admin query console:

- read-only by default;
- explicit write unlock;
- timeout;
- row limit;
- audit every execution.

Do not expose arbitrary SQL to normal club admins.

---

## 21. Settings

### Club settings

- club name/logo;
- primary/supported languages;
- phase defaults;
- duration defaults;
- intensity scale;
- age groups;
- risk levels;
- equipment;
- locations;
- safeguarding rules;
- media rules.

### Search settings

- default profile;
- searchable sources;
- field weights;
- favorite/recent boosts;
- autocomplete sources;
- result limit;
- language index settings;
- custom German stopwords;
- FTS rebuild behavior.

### AI settings

- provider/model;
- creativity;
- max retrieved references;
- allow new exercise drafts;
- approved exercise pool only;
- include previous trainings;
- repetition avoidance window;
- store prompts/results yes/no;
- club-specific generation rules.

---

## 22. Suggested seed content

The initial system should not feel empty.

Seed:

- body regions;
- movement patterns;
- common equipment;
- OCR obstacles;
- training formats;
- warm-up patterns;
- cooldown/stretching patterns;
- running drills;
- functional exercises;
- OCR progressions/regressions;
- sample groups;
- sample templates.

Useful target:

- 150–250 general exercises;
- 75+ OCR-specific skills/exercises;
- 30+ running drills;
- 30+ mobility/cooldown items;
- 40+ obstacle definitions;
- 20+ reusable training templates.

All seed data stays editable.

---

## 23. Starter templates

### OCR Full Body Circuit

```text
Warm-up
Movement prep
6–10 OCR/functional stations
Short team finisher
Cooldown
```

### Rig & Run

```text
Warm-up
Grip/shoulder prep
Run X m
Rig station
Run X m
Carry station
Run X m
Wall/crawl station
Repeat
Cooldown
```

### Kids OCR Adventure

```text
Game warm-up
Movement skill
Obstacle story circuit
Team relay
Easy mobility/cooldown
```

### Running + Exercise

```text
Running warm-up
Running technique
Main run
Exercise every X metres
Progression levels
Easy run/walk cooldown
Mobility
```

### OCR Technique

```text
Warm-up
Grip preparation
Technique block A
Technique block B
Short conditioning application
Cooldown
```

### Grip & Carry

```text
Warm-up
Grip activation
Carry circuit
Hang/traverse circuit
Run/carry combination
Forearm/shoulder cooldown
```

---

## 24. Training versioning

Every meaningful save creates a snapshot.

Support:

- version history;
- compare versions;
- restore;
- duplicate old version;
- recreate with changes.

Example:

```text
Recreate session from 2026-09-01
Duration: 75 -> 90 min
Participants: 14 -> 26
Avoid: Monkey Bars
Focus: more running
Keep warm-up, regenerate main part
```

---

## 25. Practical analytics

Examples:

- most/least used exercises;
- training format frequency;
- body-region coverage;
- movement-pattern coverage;
- obstacle exposure;
- running volume by group;
- recent repetition;
- average session duration;
- favorite templates;
- search terms with no results;
- AI suggestions frequently replaced by trainers.

Do not turn the application into athlete surveillance.

---

## 26. Application services

```text
TrainingService
ExerciseService
ObstacleService
GroupService
MediaService
SearchService
AutocompleteService
TrainingGenerationService
TrainingValidationService
SearchIndexService
AdminDatabaseService
AuditService
LocalizationService
```

Example operations:

```ts
training.create()
training.update()
training.delete()
training.restore()
training.clone()
training.combine()
training.recreate()
training.saveAsTemplate()
training.regeneratePhase()

exercise.create()
exercise.update()
exercise.archive()
exercise.restore()
exercise.findSimilar()

search.query()
search.autocomplete()
search.rebuild()

ai.generateTraining()
ai.regenerateSelection()
ai.createExerciseDraft()
```

---

## 27. Proposed project structure

```text
src/
├─ app/
│  ├─ [locale]/
│  │  ├─ dashboard/
│  │  ├─ training/
│  │  ├─ exercises/
│  │  ├─ obstacles/
│  │  ├─ quick-create/
│  │  ├─ groups/
│  │  ├─ media/
│  │  ├─ settings/
│  │  └─ admin/
│  └─ api/
├─ components/
│  ├─ training/
│  ├─ exercises/
│  ├─ search/
│  ├─ body-map/
│  ├─ media/
│  └─ ui/
├─ domain/
│  ├─ training/
│  ├─ exercise/
│  ├─ obstacle/
│  ├─ group/
│  └─ rules/
├─ server/
│  ├─ db/
│  │  ├─ duckdb.ts
│  │  ├─ migrations/
│  │  ├─ repositories/
│  │  └─ seed/
│  ├─ search/
│  ├─ ai/
│  ├─ auth/
│  ├─ media/
│  └─ services/
├─ schemas/
├─ i18n/
│  ├─ de.json
│  └─ en.json
└─ tests/
```

---

## 28. Validation examples

### Session duration

```text
warm-up + main + transitions + cooldown = total planned duration
```

Warn when the sum exceeds available time.

### Circuit capacity

```text
participants = 28
stations = 7
capacity/station = 4
=> valid
```

### Equipment collision

```text
Station 1 requires 4 kettlebells
Station 4 requires 4 kettlebells
Club owns 4
Both run simultaneously
=> conflict
```

### Age/risk rule

```text
Group: OCR Kids 8–11
Obstacle: advanced high wall
Risk rule: restricted
=> block or require an authorized alternative
```

---

## 29. Accessibility & UX

- tablet-friendly touch targets;
- keyboard operation;
- no color-only meaning;
- icons plus labels;
- high contrast;
- printable session view;
- large-text trainer mode;
- full-screen run-session mode;
- timer integration later;
- avoid excessive modals;
- autosave drafts;
- undo/redo.

A trainer should create most sessions without entering Admin or advanced settings.

---

## 30. Security, privacy & safeguarding

- role-based access;
- password/SSO-ready auth abstraction;
- secure media upload validation;
- audit trail;
- no medical data by default;
- data minimization;
- children’s names not required for group planning;
- media consent metadata;
- private media protection;
- CSRF/session protection;
- server-side authorization for all mutations;
- sanitized rich text;
- validated AI output.

Safeguarding rules must exist as data and validation logic, not merely documentation.

---

## 31. Testing strategy

### Unit

- duration calculations;
- station capacity;
- equipment conflicts;
- group rules;
- progressions/regressions;
- AI schema validation;
- search ranking;
- filter composition.

### Integration

- DuckDB CRUD;
- migrations;
- FTS build/rebuild;
- DE/EN search;
- search settings;
- version restore;
- combine/recreate.

### E2E

- Quick Create -> generated training -> edit -> save;
- manual training creation;
- combine sessions;
- recreate previous session;
- kids validation;
- media upload;
- admin search reindex.

---

## 32. Implementation roadmap

### Phase A — Foundation

- project shell;
- localization DE/EN;
- auth/RBAC;
- DuckDB repository;
- migrations;
- layout;
- audit logging.

### Phase B — Exercise/Obstacle Library

- exercise CRUD;
- obstacles;
- body regions;
- equipment;
- progressions/regressions;
- media;
- seed data.

### Phase C — Search & Autocomplete

- German/English search documents;
- DuckDB FTS;
- profiles;
- filters;
- autocomplete;
- admin rebuild/status.

### Phase D — Training Editor

- session CRUD;
- phases;
- blocks/items;
- drag/drop;
- duration math;
- versioning;
- clone/archive/restore;
- templates.

### Phase E — Quick Create Wizard

- group/age;
- duration;
- focus;
- body map;
- format;
- equipment;
- group split;
- intensity;
- draft composition.

### Phase F — AI Builder

- retrieval;
- structured generation;
- validation;
- regenerate selection;
- combine/recreate;
- draft exercise generation.

### Phase G — Admin

- users/roles;
- groups;
- exercises/media;
- search settings;
- AI settings;
- DuckDB operations;
- backups/import/export.

### Phase H — Trainer polish

- print view;
- trainer/full-screen mode;
- favorites/recent;
- analytics;
- tablet optimization;
- optional PWA/offline cache.

---

## 33. MVP acceptance criteria

The MVP is successful when a trainer can:

1. choose German or English;
2. manage exercises and OCR obstacles;
3. search exercises and previous trainings quickly;
4. configure search/autocomplete sources;
5. build a Warm-up/Main/Cooldown session manually;
6. use the body-region selector;
7. create sessions through the wizard;
8. split exercises by groups/levels;
9. build circuit, Tabata, AMRAP, EMOM, running and Rig & Run formats;
10. create run + exercise patterns such as “every 100 m”;
11. save Level 1/2/3 progressions;
12. duplicate, combine and recreate previous sessions;
13. let AI generate or modify a full session;
14. constrain AI to the approved exercise pool;
15. approve AI-created exercises before reusable publication;
16. manage users, groups, exercises, images/videos and settings;
17. inspect/rebuild DuckDB FTS from Admin;
18. preserve training history through versioning;
19. apply group/age/risk restrictions before save;
20. print/display the final session clearly for hall use.

---

## 34. Recommended first vertical slice

```text
1. DuckDB + migrations
2. Exercise CRUD
3. Body region mapping
4. German FTS
5. Training CRUD with 3 phases
6. Search-and-add exercise
7. Circuit block
8. One saved club group
9. Quick Create basic wizard
10. AI generate from approved exercises
```

This validates the architecture early without implementing every training format first.

---

## 35. Design decisions to keep

### Isolate DuckDB FTS

Search indexing is a dedicated service with explicit refresh/rebuild handling.

### Keep structured metadata alongside full-text search

Age, risk, body region, equipment, capacity, phase and format remain structured fields rather than generic tags.

### AI is a composer, not the database

The exercise/training pool is authoritative. AI retrieves, composes and proposes; deterministic rules validate.

### Make replace easier than rewrite

Useful live planning actions are often:

- replace this;
- easier;
- harder;
- less equipment;
- more running;
- keep everything else.

### Separate trainer workflow from administration

Training creation stays fast. Complex configuration belongs under Admin/Settings.

---

## 36. Reference sources

Keep these as external references rather than copied content:

- Landessportbund Hessen — Ausbildungsangebote und Lizenzerwerb  
  https://www.landessportbund-hessen.de/geschaeftsfelder/schule-bildung-und-personalentwicklung/ausbildungsangebote-und-lizenzerwerb/

- Sportjugend Hessen — Materialien zu Kindeswohl-Maßnahmen  
  https://www.sportjugend-hessen.de/kindeswohl/materialien

- DOSB — Schutzkonzepte im Sport  
  https://www.dosb.de/wissen/detail/schutzkonzepte-im-sport

- DuckDB — Full-Text Search Extension  
  https://duckdb.org/docs/lts/core_extensions/full_text_search

- DuckDB — Node.js Client (Neo)  
  https://duckdb.org/docs/current/clients/node_neo/overview

---

## 37. Next development artifacts

After this plan:

```text
/docs/domain-model.md
/docs/search-design.md
/docs/ai-training-schema.md
/docs/ui-flows.md
/src/server/db/migrations/001_initial.sql
/src/server/db/seed/
```

Implementation should begin with the vertical slice in section 34 rather than attempting every feature simultaneously.
