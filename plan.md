# OCRCraft – Implementierungsplan

> Primärsprache: Deutsch · Sekundärsprache: Englisch
> Stack: Next.js/React, TypeScript, Tailwind CSS, DuckDB/FTS

## Zweck und Arbeitsregeln

OCRCraft hilft Trainern, sichere OCR- und Breitensport-Einheiten schnell zu planen, anzupassen und wiederzuverwenden. Jede Änderung muss die Trennung `UI → Anwendung/Service → Repository → DuckDB` erhalten. KI schlägt vor; der Trainer prüft und speichert.

Die Kernstruktur jeder Einheit bleibt sichtbar:

1. Aufwärmen
2. Hauptteil
3. Cooldown & Stretching

## Prioritäten

- **P0 – Betriebssicherheit und Daten:** Datenbank, Authentifizierung, Import/Export, Backups und Schutz globaler Mutationen.
- **P1 – Trainer-Workflow:** Übungsdaten vervollständigen, Editor-Versionen, Suche, Vorlagen und responsive Traineransicht.
- **P2 – Katalog und Medien:** weitere Übungskohorten, Dubletten, Vorlagenquellen, Medienverwaltung und Bildprüfung.
- **P3 – Ausbau:** Internationalisierung, Analysen, E2E-Abdeckung und optionale Trainingsformate.

## P0 – offen

### Identität und Betrieb

- [ ] Authentifizierung einführen.
- [x] RBAC für Trainer, Admin und Super-Admin einführen.
- [x] Globale Admin-Mutationen serverseitig autorisieren.
- [ ] Produktions-Deployment und Betriebsdokumentation ergänzen.
- [x] Benutzer und Rollen persistieren; externe Anmeldung kann per Actor-Konfiguration erzwungen werden.
- [x] Audit-Events für zentrale Admin-/Datenbankaktionen persistieren.

### Datenbank und portable Daten

- [x] Training-Versionen mit Snapshot und geschützter Wiederherstellung.
- [x] Lock-gesichertes DuckDB-Backup mit Zeitstempel und Manifest.
- [x] DuckDB-Restore mit Sicherheitsbackup und sichere Multi-Process-Betriebsanleitung.
- [x] Konfigurierbare Backup-Rotation und Anzeige der vorhandenen Backups im Adminbereich.
- [x] Selektierbaren, versionierten JSON-Export implementieren.
- [x] Exportoptionen für Übungen, Details, Mapping, Trainings, Gruppen, Medien und Provenienz anbieten.
- [ ] Optional Binärmedien mit MIME-Typ, Prüfsumme und Quellenmetadaten exportieren.
- [x] Import-Preflight und Schema-Version als sichere Vorschauvalidierung implementieren; transaktionaler Import bleibt als nächster Ausbau.
- [ ] Dublettenklassifikation (`same`, `new`, `probable duplicate`, `conflict`) und Side-by-Side-Vergleich für Importkonflikte abschließen.
- [ ] Feldvergleich, Bildvergleich, Bulk-Entscheidungen und `Use left / Use right / Keep both` vollständig abdecken.
- [ ] Round-trip- und Konfliktauflösungstests ergänzen.

## P1 – Trainer-Workflow

### Übungskatalog

- [ ] Katalog über alle Übungen hinaus mit kuratierten Lücken erweitern.
- [ ] Zusätzliche deutsche/englische Aliase und Trainerbegriffe für alle Seeds kuratieren.
- [ ] Fachliche Einzelprüfung und Anreicherung aller verbleibenden Seeds abschließen.
- [ ] Weitere Katalogkohorten versioniert, zweisprachig und mit Detail-/Sicherheits-Gates aufnehmen.
- [ ] Zusätzliche Kategorien und Facetten editierbar machen.
- [ ] Progressionen/Regressionen als vollständige Katalogverwaltung ausbauen.
- [ ] Geschützte Hard-Delete-Regeln implementieren.
- [ ] Dublettenprüfung, Bulk-Edit und Import/Export im Admin abschließen.

### Suche und Planung

- [ ] Konfigurierbare Gewichte für strukturierte Suchfelder anbieten.
- [ ] Autocomplete aus bestehenden Trainings und Blöcken ergänzen.
- [ ] Suchprofile und Feldgewichte konfigurierbar machen.
- [ ] Favoriten und „zuletzt verwendet“ ergänzen.
- [ ] Authentifizierte DE/EN-FTS-Rebuild-Aktionen bereitstellen.
- [ ] Partner-Workout und weitere offene Formatregeln ergänzen.
- [ ] Intervall-/Runden-/Ladder-/Pyramid-/Chipper-/Partner-Regeln vollständig ausbauen.
- [ ] Laufregeln wie „alle X Meter/Minuten/Checkpoint“ und Arbeits-/Pausenarithmetik vervollständigen.

### Training Editor und Gruppen

- [ ] Version History/Restore für Trainings.
- [ ] Trainingsvorlagen erstellen, speichern und wiederverwenden.
- [ ] Gruppen-Splits, Stationskapazität und Vereinsdefaults weiter ausbauen.
- [ ] Kids/Youth/Beginner/Advanced/Competition/Running/Open-Presets ergänzen.
- [ ] Club-Regelprofile, Standort-/Equipmentdefaults und Skill-Verteilung ergänzen.

### UI/UX und Zugänglichkeit

- [ ] Kontrast und Lesbarkeit in Hell-/Dunkelmodus auf allen Seiten prüfen.
- [ ] Gemeinsames erweitertes Form-Kit für Labels, Hilfe, Fehler, Felder und Actions.
- [ ] Toast-/Feedbacksystem mit Loading-, Erfolg- und Fehlerzuständen.
- [ ] Undo/Redo für geeignete Editoraktionen.
- [ ] Fullscreen-Traineransicht und Druckansicht.
- [ ] Vollständiges Accessibility-Audit inklusive E2E-Tastaturpfaden.

## P2 – Katalogquellen, Medien und KI

### Quellen und Vorlagen

- [ ] VIBSS-inspirierte Quellen-/Provenienzstruktur ergänzen.
- [ ] 20–40 unabhängige Trainingsvorlagen mit Quellenreferenz erstellen.
- [ ] Erwachsenen- und Kids/Youth-Vorlagen für Ausdauer, Koordination, Kraft, Mobility, Teamwork und Parcours ergänzen.
- [ ] suche auch nach Spielen für Kinder und Erwachsene die als Training genutzt werden können, erstelle hierfür eine eigene Bereich und ermögliche alles wie bei einer Übung, aber als Typ Spiel, es wird auch im Trainingsengine mit berücksichtig
- [ ] Ermögliche auch Teamwettkämpfe z.B. 3 Personen (3 Komplexe Kraft, Schnelligkeit, Technik) jeder aus dem Team wählt einen Komplex mit Übungen, zum Abschluss machen alle 3 noch zusammen Übungen, dies kann auch mit zusätzlichen Runden laufen kombiniert werden. Erstelle weitere solcher Wettkampfstile oder suche nach Vorlagen
- [ ] Keine externen Texte/Bilder ohne passende Lizenz übernehmen.

### Medien

- [ ] Galerie, Videos und externe Thumbnails verwalten.
- [ ] Lizenz-, Quellen- und Einwilligungsprüfung ergänzen.
- [ ] Verwaiste Medien erkennen und bereinigen.
- [ ] S3-kompatible Speicherung produktionsfest machen.
- [ ] Legacy-Triptychon nach fachlicher Prüfung in Sequenzbilder migrieren.
- [ ] Generierte Sequenzen auf biomechanische Plausibilität und Textübereinstimmung prüfen.
- [ ] Review-Felder (`reviewed_by`, Quelle/Übungsreferenz) und Off-Machine-Backup dokumentieren.

### KI

- [ ] KI-Übungsentwürfe mit separatem Trainer-Approval-Workflow abschließen.
- [ ] KI-Ausgaben weiterhin schema-validieren und deterministisch gegen Club-/Alters-/Sicherheitsregeln prüfen.
- [ ] Settings für die AI Auswahl OpenAI, Gemini, CoPilot, Claude, etc. und Setzen der entsprechenden Keys/Zugänge (auch per Login bei Anbieter und Freigabe möglich machen) zusätzlich das Nutzungslimit und aktuellen Verbrauch in einem Info Panel anzeigen

## P3 – Ausbau und Qualität

### Schutzkonzept

- [ ] Gespeicherte Kids/Youth-Profile.
- [ ] Eingeschränkte Hindernisregeln, Aufsicht und Maximalrisiken nach Alter.
- [ ] Trainerqualifikation, Medienfreigaben und verständliche Blockierungsgründe.
- [ ] Kinder-/Jugendformulierungen und Vereinsregeln als harte Priorität.

### Internationalisierung

- [ ] UI-Dictionaries und Sprachumschaltung.
- [ ] Admin-Ansicht für Übersetzungs-Vollständigkeit.
- [ ] Strukturierte Ausführungs-/Coaching-Felder DE/EN vollständig prüfen.

### Qualität und Analysen

- [ ] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E-Tests.
- [ ] Übungsnutzung, Körperregionen, Hindernisabdeckung, Laufvolumen, Wiederholungswarnungen und Nulltreffer analysieren.
- [ ] Vollständigkeits- und KI-Ersetzungsanalysen ergänzen.

## Bereits umgesetzt – kompakte Baseline

- Next.js App Router, React, TypeScript, Tailwind und modulare Domain-/Service-/Repository-Architektur.
- DuckDB-Migrationen, WAL-Recovery/Schreibserialisierung, FTS-Zustände und In-Memory-Migrationstests.
- Dynamisch validierter Seed- und Importkatalog mit zweisprachiger Identität, Aliases, Mapping, Sicherheits- und Detailfeldern.
- Exercise Library mit Suche, Filtern, Muskelkarte, Create/Edit, Archivieren/Wiederherstellen und Vollständigkeitsbericht.
- Granulare 89-Muskel-/Körperregionen-Taxonomie, primär/sekundär/Gegenmuskel-Beziehungen und zugängliche Listenalternative.
- Quick Create und Training Builder mit lokalem deterministischem Composer, optionalem AI-Pfad, Zielgruppen-/Alters-/Risiko-/Equipment-/Hindernisregeln und Trainerprüfung.
- Training CRUD, Phasen, Items, Level 1–3, Alternativen, Reorder, Duplicate/Combine und gespeicherte Builderbedingungen.
- Versionierte Trainings-Snapshots mit rollenprüfter Wiederherstellung von Training, Phasen und Items.
- Gruppen-Grundmodell, Lauf-/OCR-Formate, Team-/Stationskapazität, Übergangszeiten und strukturierte Hauptteilprogrammierung.
- OpenAI-`gpt-image-2`-Bildpipeline mit Dry Run, stabilen Seed-Dateinamen, Quellen-/Reviewmetadaten und S3-Abstraktion.
- Wiederverwendbare Dialog-/Disclosure-Komponenten mit Fokusmanagement, Escape, Fokusfalle, Scroll-Lock, sichtbarem Fokus und konsistenten Panels; große Katalogfilter öffnen als zentrierte Dialoge statt im Sidepanel zu wachsen.
- Einklappbare Hauptnavigation mit persistiertem Icon-Modus, semantischen SVG-Menüicons und wiederverwendbarem Filter-Sidepanel; Übungs-, Medien- und Hinderniskatalog nutzen beide Muster mit responsiv begrenzten Eingaben und Popovern.
- Gemeinsamer Administrationsbereich mit Tabs für Übersicht, Datenbank, Datenqualität und Einstellungen; doppelte Settings-/Admin-Navigation entfernt.
- Dynamischer Vollständigkeitsbericht für Seed-Bestand und gesamten Übungskatalog sowie Admin-Aktion zum Neuaufbau der deutschen und englischen Suchindizes.
- Light/Dark/System-Theme, semantische UI-Tokens, responsive Layouts und laufende CI-Gates.

## CI und Definition of Done

Vor jedem Abschluss sequenziell ausführen:

```bash
npm run typecheck
npm test -- --run
npm run lint
npm run build
```

Eine Änderung ist erst fertig, wenn Verantwortung, Typen, UI-Zustände, Sicherheits-/Domänenregeln und aussagekräftige Tests vorhanden sind.
