# OCRCraft – offene Vorhaben

> Stand: September 2026 · Primärsprache Deutsch, UI-Inhalte bleiben für Englisch übersetzbar.

`README.md` dokumentiert die umgesetzten Meilensteine. Diese Datei enthält nur noch Arbeit, die tatsächlich offen ist.

## Arbeitsregeln

- Die Kernstruktur jeder Einheit bleibt sichtbar: Aufwärmen, Hauptteil, Cooldown & Stretching.
- Architektur bleibt getrennt: `UI → Anwendung/Service → Repository → DuckDB`.
- KI schlägt vor; der Trainer prüft, ändert und speichert.
- Alters-, Risiko-, Vereins-, Equipment- und Kapazitätsregeln bleiben harte Grenzen.
- Eine Änderung braucht typed boundaries, zugängliche Zustände, Domänenvalidierung und aussagekräftige Tests.

## P1 – Trainer-Workflow und UI

- [x] Tailgrids-kompatible lokale UI-Schicht abgeschlossen: Overlay/Popover, Form-Felder, Pagination, Tabs, Sidebar und Toast sind als lokale OCRCraft-Komponenten konsolidiert und in [`docs/ui-components.md`](./docs/ui-components.md) dokumentiert; es gibt keine Tailgrids-Laufzeitabhängigkeit.

## P3 – Internationalisierung

- [ ] UI-Dictionaries und Sprachumschaltung für alle user-facing Bereiche vervollständigen; die typisierte DE/EN-Grundlage, persistierte Auswahl sowie globale Navigation und Theme-Beschriftungen sind umgesetzt, Fachseiten bleiben noch auf vollständige Schlüsselabdeckung umzustellen.
- [x] Admin-Ansicht für Übersetzungs-Vollständigkeit ergänzt: strukturelle Dictionary-Lücken und verwaiste Schlüssel werden im Tab „Datenqualität“ geprüft und sichtbar gemacht.
- [x] Strukturierte Ausführungs-/Coaching-Felder DE/EN vollständig prüfen: der Admin-Vollständigkeitsbericht weist pro Sprachdatensatz Details, Ausführungsschritte, Coaching-Cues und Fehlerkorrekturen getrennt aus.

## P3 – Qualität und Analysen

- [ ] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E weiter ausbauen: neben den bestehenden Tastatur-, Review-, Builder-, Schutz- und Theme-Gates noch echte Editoränderung, Speichern und geschützte Kids/Youth-Blockierung abdecken.
- [ ] Übungsnutzung, Körperregionen, Hindernisabdeckung, Laufvolumen, Wiederholungswarnungen und Nulltreffer analysieren; Auswertungen müssen aus Repository-/Service-Daten stammen und Filterzustände erklären.
- [ ] Vollständigkeits- und KI-Ersetzungsanalysen ergänzen: fehlende DE/EN-/Coaching-/Sicherheitsfelder, Ersatzquote, Blockierungsgründe und Trainerfreigaben nachvollziehbar darstellen.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
