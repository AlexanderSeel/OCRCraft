# OCRCraft Release Notes

Diese Datei enthält versionsbezogene Änderungen, Upgrade-Hinweise und relevante Datenbank-/Migrationsinformationen. Die allgemeine Produkt- und Featurebeschreibung steht in [README.md](./README.md).

## 1.0.0

Erste konsolidierte OCRCraft-Version mit produktiver Trainings-, Katalog- und Administrationsgrundlage.

### Training

- Quick Create und detaillierter Training Builder
- Warm-up, mehrere Hauptteile und Cooldown
- Zirkel, Rig & Run, AMRAP, EMOM, Tabata, Technik, Relay und Run + Exercise
- Team-, Partner- und Stationsplanung
- Equipment- und Hindernisverfügbarkeit
- Alternativen, Replace, Duplicate, Combine und Undo/Redo
- gespeicherte Vorlagen und Trainingsversionen

### Übungskatalog

- DE/EN-Übungen und Aliase
- Körper- und Muskelregionen
- Bewegungsmuster, Equipment und Zielgruppen
- Coaching-, Sicherheits- und Progressionsdaten
- Hindernis- und Outdoor-Varianten
- Dubletten- und Qualitätsreview
- Quellen- und Provenienztracking

### OCR und Sicherheit

- OCR-Skill-Matrix
- OCRFRA-Hindernispaket
- Grip-, Carry-, Rig-, Wall-, Crawl-, Balance- und Running-Abdeckung
- Kids-/Youth-Sicherheitsprofile
- Aufsichts- und Risikoregeln
- nicht abschwächbare serverseitige Sicherheitsgrenzen

### Medien

- lokale und externe Medien
- Rechte-/Lizenzmetadaten
- KI-generierte Übungsbilder
- Medienreview und Primärbildlogik
- Ersatzkandidaten für externe Bilder ohne Nutzungsfreigabe
- persistente Bildgenerierungsjobs

### KI

- mehrere Providerinstanzen
- Modellzuordnung
- Funktionsprioritäten und Fallback
- Trainingsgenerierung
- Bildgenerierung
- AI-Drafts mit Trainerreview

### Administration

- Benutzer, Rollen und Berechtigungen
- Trainerprofile
- Audit-Events
- Datenbank-Backup und Restore
- Portable Export-/Import-Pakete
- Aufgabenqueue
- Datenqualitätsberichte
- Outdoor-/Portabilitätsreview

### UX und Accessibility

- Light/Dark/System Theme
- responsives App-Shell-Layout
- gemeinsame Katalogfilter und Ansichten
- Dialog-/Popover-/Sidebar-/Toast-Bausteine
- Tastatur- und Fokusregeln
- routebewusste Tutorials
- Playwright Accessibility-/Regression-Gates

### Datenbank

Release 1.0.0 verwendet die versionierte DuckDB-v1-Baseline.

Aktuell umfasst die Migrationskette Versionen bis einschließlich Migration 87. Fresh Install und Upgradepfad werden durch automatisierte Migrationstests geprüft.

Wichtige spätere 1.0-Katalogmigrationen umfassen unter anderem:

- portable Hallen-/Outdoor-Katalogisierung
- strukturierte Outdoor-Ersatzgeräte
- Portabilitätsreview
- Fitnessstudio-Klassifikation für blockierte Importübungen
- manuell freizugebende konvertierte Outdoor-Varianten

### Upgrade-Hinweise

Vor einem Upgrade sollte ein Datenbankbackup erstellt werden.

Nach Änderungen an Migrationen oder Katalogseeds sollte die vollständige Qualitätsroutine ausgeführt werden:

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```

Lokale oder S3-basierte Übungsbilder müssen gemeinsam mit der Datenbank gesichert werden, da die Datenbank nur die Medienreferenzen enthält.
