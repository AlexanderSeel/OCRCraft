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

- [ ] Tailgrids-kompatible lokale UI-Schicht abschließen: Overlay/Popover, Form-Felder, Pagination, Tabs, Sidebar und Toast als dokumentierte OCRCraft-Komponenten mit semantischen Tokens, Fokus-/Z-Index-Regeln, deutscher UI und Serveraktionen konsolidieren; keine Tailgrids-Laufzeitabhängigkeit und kein CLI-Überschreiben von `globals.css`.

## P3 – Internationalisierung

- [ ] UI-Dictionaries und Sprachumschaltung für die user-facing Bereiche einführen; Deutsch bleibt Standard, Englisch wird vollständig über Schlüssel statt Inline-Texte steuerbar.
- [ ] Admin-Ansicht für Übersetzungs-Vollständigkeit ergänzen: fehlende Schlüssel, Fallbacks und verwaiste Dictionary-Einträge sichtbar machen.
- [ ] Strukturierte Ausführungs-/Coaching-Felder DE/EN vollständig prüfen und fehlende Übersetzungen als Datenqualitätsbefund ausweisen.

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
