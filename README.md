# OCRCraft

OCRCraft ist ein Trainingsplaner für OCR-Clubs, funktionelles Training und Breitensport. Ziel ist, komplette Trainingseinheiten schnell zu erstellen, bestehende Einheiten wiederzuverwenden oder zu kombinieren und neue Sessions aus einem strukturierten Übungspool sowie optional mit KI-Unterstützung zu erzeugen.

Die Anwendung ist primär auf Deutsch ausgelegt und wird zusätzlich Englisch unterstützen.

## Aktueller Stand

Die Implementierung hat begonnen. Auf `main` stehen bereits:

- Next.js / React / TypeScript / Tailwind-Grundgerüst
- professionelles Trainer-Dashboard
- typisiertes Trainings-Domainmodell
- deterministische Validierung für Pflichtphasen, Dauer und Vereins-Risikoregeln
- Quick-Create-Wizard mit fünf Schritten
- visueller Front-/Rückseiten-Body-Selector
- Trainingsformate wie Zirkel, Rig & Run, AMRAP, EMOM, Tabata, Run + Exercise und Technik
- zentraler DuckDB-Lifecycle mit `@duckdb/node-api`
- versioniertes initiales DuckDB-Schema
- vorbereitete deutsche/englische Suchdokumente und Search-Index-Status
- Domain-Tests mit Vitest
- GitHub Actions CI für Lint, Typecheck, Tests und Production Build
- projektinterne Skills für TypeScript/Clean Architecture, UI/UX und LSB-/OCR-Trainingsfachlichkeit
- zentrale semantische UI-Tokens mit Light-, Dark- und System-Theme

Der vollständige Produkt- und Architekturplan steht in [`plan.md`](./plan.md).

## Stack

- Next.js 16
- React 19
- TypeScript 6 (aktuell für die Next.js-/typescript-eslint-Toolchain gepinnt)
- Tailwind CSS 4
- DuckDB + `@duckdb/node-api`
- Zod
- Vitest

## Lokaler Start

```bash
npm install
npm run dev
```

Danach läuft die Anwendung standardmäßig unter `http://localhost:3000`.

Qualitätschecks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Architektur

Die zentralen Verantwortlichkeiten werden getrennt gehalten:

```text
src/
├─ app/                 Next.js routes / composition
├─ components/          reusable UI and feature components
├─ domain/              framework-free training model and rules
└─ server/
   └─ db/               DuckDB lifecycle and migrations
```

Wichtige Regeln stehen zusätzlich in [`AGENTS.md`](./AGENTS.md).

## Trainingsstruktur

Jede reguläre Session wird mindestens gegen diese Struktur geprüft:

1. **Aufwärmen / Warm-up**
2. **Hauptteil / Main part**
3. **Cooldown & Stretching**

Zusätzliche Blöcke wie Briefing, Movement Preparation, Technik, Obstacle Skills, Finisher oder Reflexion können später flexibel ergänzt werden.

Die fachliche Orientierung folgt zielgruppenorientierter Breitensport-Planung des Landessportbund Hessen / DOSB-Kontexts. Für Kinder und Jugendliche werden Schutzkonzept und Vereinsregeln separat als harte Systemregeln modelliert. OCR-spezifische Anforderungen wie Grip, Carry, Running, Rig, Walls, Balance und Hindernisprogression werden darauf aufgebaut.

## Quick Create

Der aktuelle Wizard erfasst bereits:

1. Zielgruppe, Alter, Teilnehmerzahl und Dauer
2. Trainingsziele und Körperregionen
3. Trainingsformat bzw. Formatkombination
4. Technik-/Conditioning-Ausrichtung
5. Zusammenfassung für den späteren Training Composer

Die BodyMap ist als eigener wiederverwendbarer, tastaturbedienbarer Baustein umgesetzt.

## DuckDB

Die Persistenz wird über eine serverseitige DuckDB-Abstraktion gekapselt. Das initiale Schema enthält bereits:

- Exercises und Übersetzungen
- Body Regions
- Equipment
- Club Groups
- Training Sessions
- Training Phases und Items
- deutsche und englische Search Documents
- Search-Index-Zustand (`healthy`, `dirty`, `rebuilding`, `failed`)
- Schema-Migrations

DuckDB FTS wird bewusst nicht direkt in React-Komponenten eingebaut. Index-Rebuilds werden später über einen `SearchIndexService` und die Admin-Oberfläche gesteuert.

## Exercise illustrations

The single-exercise image pipeline uses the OpenAI Images API with `gpt-image-2`. Set `OPENAI_API_KEY` in the process environment before generating an image. Never put a real key in source control.

Preview the prompt without making an API request or writing an image:

```bash
npm run exercise:image -- --exercise easy-jog --dry-run
```

Generate one exercise illustration and save it as pending trainer review:

```bash
npm run exercise:image -- --exercise easy-jog
```

The default filesystem output goes to `public/generated/exercises/`. To use an S3-compatible bucket, set `OCRCRAFT_IMAGE_STORAGE=s3`, `OCRCRAFT_IMAGE_BUCKET`, and `OCRCRAFT_S3_ENDPOINT` when required by the provider. Configure credentials through the standard AWS credential environment or profile chain; configure `OCRCRAFT_IMAGE_PUBLIC_BASE_URL` if the bucket has a public/CDN URL. Images are never automatically approved. Batch generation is not enabled.

## UI-Theming

OCRCraft besitzt eine zentrale Theme-Grundlage mit semantischen CSS-Tokens. Im Header kann zwischen **System**, **Hell** und **Dunkel** gewechselt werden. Die Auswahl wird lokal gespeichert; bei `System` folgt OCRCraft automatisch der Betriebssystem-/Browser-Einstellung. Ein Bootstrap-Script setzt das Theme vor dem Rendern, um einen sichtbaren Theme-Flash weitgehend zu vermeiden.

## AI-Prinzip

Die KI soll ein **Composer**, nicht die Datenbank sein:

```text
Wizard/Input
  -> Anforderungen normalisieren
  -> zugelassene Übungen/Trainings suchen
  -> relevanten Kontext abrufen
  -> strukturierten TrainingDraft erzeugen
  -> Zod + Domainregeln validieren
  -> Trainer prüft und speichert
```

Neue KI-generierte Übungen werden nicht automatisch in den Master-Pool übernommen.

## Projekt-Skills

Die Repository-Arbeitsweise ist in drei Skills festgehalten:

- [`skills/typescript-app-engineer/SKILL.md`](./skills/typescript-app-engineer/SKILL.md)
- [`skills/ui-ux-designer/SKILL.md`](./skills/ui-ux-designer/SKILL.md)
- [`skills/ocr-training-expert/SKILL.md`](./skills/ocr-training-expert/SKILL.md)

## Nächste Implementierungsschritte

Der nächste Vertical Slice baut auf dem vorhandenen Fundament auf:

```text
1. weitere Seed-Anreicherung für Übungen
2. VIBSS-Provenance / Trainingsvorlagen
3. BM25-Suche und erweitertes Autocomplete
4. gespeicherte Club Groups und Vereinsregeln
5. Training Editor mit Search-and-add
6. Quick Create -> echter TrainingDraft
7. AI Composer auf Basis des freigegebenen Pools
8. Admin für Übungen, Medien, Benutzer und Search Index
```

## Fachliche und technische Referenzen

Die Detailquellen und weiterführenden Links befinden sich in [`plan.md`](./plan.md). Dazu gehören insbesondere Landessportbund Hessen, Sportjugend Hessen, DOSB sowie DuckDB-Dokumentation.
