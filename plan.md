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
- [x] Authentifizierungs-Bootstrap abgeschlossen: leere Benutzerbasis führt zu `/setup`, Login und Vereinscode sind serverseitig validiert, geschützte App-Seiten leiten ohne Sitzung zu `/login`, und der aktuelle Benutzer ist global sichtbar.
- [x] Bildvorschauen vereinheitlicht: Medien, Hindernisse, Übungsbilder, Dubletten- und Profilbilder bieten eine zugängliche Lupen-Schaltfläche mit Großansicht, Escape-Schließen und Fokus-Rückgabe.

## P2 – HyperUI-basierte UI-Modernisierung

> HyperUI wird als Referenz- und Markup-Quelle verwendet, nicht als Runtime-Abhängigkeit: Das Projekt liefert kopierbare Tailwind-CSS-v4-Komponenten und keine zu installierende Komponentenbibliothek. Bestehende OCRCraft-Tokens, Übersetzbarkeit, serverseitige Aktionen und Accessibility-Regeln bleiben maßgeblich.

- [ ] Bestandsaufnahme und Zielbild erstellen: aktuelle lokale UI-Komponenten, wiederholte Page-Markups, Tailwind-Utilities, responsive Zustände und semantische Tokens gegen passende HyperUI-Muster (Navigation, Cards, Forms, Tables, Alerts, Empty States) abgleichen; pro Muster Entscheidung und Screenshot/Referenz dokumentieren.
- [ ] Design-System-Adapter definieren: HyperUI-Markup in kleine OCRCraft-Komponenten überführen, dabei `var(--surface*)`, `var(--border*)`, `var(--foreground)`, `var(--muted)`, `var(--focus)` sowie Light/Dark-Theme und deutsche/englische Labels beibehalten; keine direkten Hex-Farben aus Beispielen in Fachseiten übernehmen.
- [ ] App-Shell modernisieren: Sidebar, Header, Mobile-Navigation, Breadcrumbs, Seitenaktionen und responsive Layout-Zustände auf das ausgewählte HyperUI-Muster angleichen; Auth-Weiterleitung, aktueller Benutzer, Skip-Link, Fokusreihenfolge und Tastaturbedienung als unveränderte Akzeptanzkriterien testen.
- [ ] Wiederverwendbare Oberflächen migrieren: Form-Felder und Validierungsfehler, Buttons, Cards/Stat-Cards, Tabs, Dialoge/Popover, Toasts, Pagination, Alerts und Loading-/Empty-States vereinheitlichen; bestehende `src/components/ui/*`-Komponenten erweitern oder ersetzen, nicht parallel doppelte Varianten anlegen.
- [ ] Fachseiten in kontrollierten Batches umstellen: zuerst Dashboard/Quick-Create und Trainingsübersichten, danach Übungen/Hindernisse/Medien, anschließend Gruppen- und Admin-Bereiche; pro Batch keine Änderung an Domainlogik oder Serveraktionen und ein visueller Responsive-/Dark-Mode-Abgleich.
- [ ] Accessibility- und Regression-Gate erweitern: WCAG-nahe Fokus-/Kontrastprüfung, Dialog-/Popover-Escape und Fokus-Rückgabe, Touch-Ziele, reduzierte Bewegung, Formularfehler am Feld, mobile Navigation sowie bestehende `check:ui`- und Playwright-Gates für jede migrierte Oberfläche.
- [ ] HyperUI-Übernahme abschließen: verwendete Quellen und MIT-Hinweis in der Projektdokumentation festhalten, nicht benötigte Übergangsklassen entfernen, Duplikate aus den Seiten löschen und nach jedem Batch `typecheck`, `lint`, `check:ui`, Unit-, E2E- und Build-Prüfungen ausführen.

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
