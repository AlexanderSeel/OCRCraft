# OCRCraft

OCRCraft ist ein Trainingsplaner für OCR-Clubs und funktionelles Training. Ziel ist, komplette Trainingseinheiten schnell zu erstellen, bestehende Einheiten wiederzuverwenden oder zu kombinieren und neue Sessions mit Hilfe einer strukturierten Übungsbibliothek und optionaler KI-Unterstützung zu erzeugen.

Die Anwendung ist primär auf Deutsch ausgelegt und soll zusätzlich Englisch unterstützen.

## Zielbild

OCRCraft soll Trainer dabei unterstützen, Trainingseinheiten nach einer klaren Struktur aus **Aufwärmen**, **Hauptteil** und **Cooldown/Stretching** zu planen. Der fachliche Rahmen orientiert sich an Trainings- und Ausbildungsprinzipien des Landessportbund Hessen / Sportjugend Hessen sowie an konfigurierbaren Vereinsregeln.

Der Fokus liegt auf einem schnellen Trainer-Workflow statt auf komplizierter Dateneingabe.

## Geplante Kernfunktionen

- Trainingseinheiten erstellen, bearbeiten, kopieren, versionieren, archivieren und wiederherstellen
- bestehende Trainings kombinieren oder mit geänderten Rahmenbedingungen neu erzeugen
- Quick-Create-Wizard für Gruppe, Alter, Dauer, Trainingsziel, Intensität, Equipment und Trainingsformat
- interaktive Körperkarte zur Auswahl von Zielregionen
- Übungs- und Hindernisbibliothek mit Progressionen, Regressionen und Alternativen
- OCR-spezifische Inhalte wie Rig & Run, Monkey Bars, Rings, Walls, Rope Climb, Carries, Balance, Crawls und Throwing
- Trainingsformate wie Zirkel, Stationstraining, Tabata, AMRAP, EMOM, Intervalle, Partner-/Teamtraining und Running + Exercise
- Running-Workouts mit Regeln wie „alle 100 m eine Übung“
- Level-1/2/3-Varianten für gemischte Leistungsgruppen
- DuckDB Full-Text Search für Übungen, Hindernisse, Trainings und Templates
- konfigurierbare Suchprofile und Autocomplete-Quellen
- KI-gestützte Erstellung und Anpassung von Trainings auf Basis des vorhandenen Übungspools
- Kids-/Youth-Regeln für Alter, Risiko, Aufsicht und eingeschränkte Übungen
- Benutzer-, Rollen-, Gruppen-, Medien-, Exercise- und Datenbank-Administration
- Deutsch/Englisch-Lokalisierung

## Geplanter Stack

- TypeScript
- Next.js / React
- Tailwind CSS
- DuckDB
- DuckDB Full-Text Search
- `@duckdb/node-api`
- Zod für strukturierte Validierung
- provider-neutrale AI-Schnittstelle

## Trainingsstruktur

Jede Session basiert mindestens auf:

1. **Warm-up / Aufwärmen**
2. **Main Part / Hauptteil**
3. **Cooldown & Stretching / Cooldown & Dehnen**

Optionale Blöcke können z. B. Briefing, Movement Preparation, Technik, Obstacle Skills, Finisher oder Reflexion enthalten.

## Suche & Autocomplete

Die Suche soll strukturierte Filter und Volltextsuche kombinieren. Relevante Bereiche sind unter anderem:

- Übungen
- Hindernisse
- bestehende Trainings
- Trainingsblöcke
- Templates
- Equipment
- Körperregionen
- Bewegungsmuster
- Tags

DuckDB FTS wird über einen eigenen SearchIndexService gekapselt. Da DuckDB-FTS-Indizes nach Änderungen explizit aktualisiert werden müssen, sieht die Architektur einen Dirty/Rebuild-Workflow mit Admin-Status und manueller Reindex-Funktion vor.

## KI-Prinzip

Die KI ist ein **Composer**, nicht die Datenbank.

Ablauf:

```text
Wizard/Input
  -> Anforderungen normalisieren
  -> passenden Exercise-/Training-Pool durchsuchen
  -> relevante Inhalte abrufen
  -> strukturierten AI-Kontext erzeugen
  -> TrainingDraft generieren
  -> deterministisch validieren
  -> Trainer prüft und speichert
```

Neue KI-generierte Übungen landen zunächst nur als Draft im System und müssen vor der Wiederverwendung freigegeben werden.

## Projektstatus

Das Repository befindet sich aktuell in der Planungs-/Bootstrap-Phase.

Der ausführliche Produkt-, UX- und Implementierungsplan befindet sich in:

- [`plan.md`](./plan.md)

Dort sind unter anderem enthalten:

- Domain Model
- OCR-Hinderniskatalog
- Trainingsformate
- Quick Create Wizard
- Body Map
- DuckDB-Datenmodell
- Full-Text-Search-Architektur
- AI Training Builder
- Kids/Youth Mode
- Admin-Interface
- Rollenmodell
- Testing-Strategie
- Implementierungs-Roadmap
- MVP Acceptance Criteria

## Empfohlener erster Vertical Slice

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

## Referenzen

Die fachliche Planung verweist unter anderem auf:

- Landessportbund Hessen
- Sportjugend Hessen
- DOSB Schutzkonzepte im Sport
- DuckDB Full-Text Search
- DuckDB Node.js Client

Die konkreten Links und Architekturhinweise stehen im [`plan.md`](./plan.md).
