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

- [x] Bestandsaufnahme und Zielbild erstellen: aktuelle lokale UI-Komponenten, wiederholte Page-Markups, Tailwind-Utilities, responsive Zustände und semantische Tokens gegen passende HyperUI-Muster (Navigation, Cards, Forms, Tables, Alerts, Empty States) abgleichen; Entscheidungen und Migrationsreihenfolge in [`docs/hyperui-migration.md`](./docs/hyperui-migration.md) dokumentieren.
- [x] Design-System-Adapter definieren: HyperUI-Markup in kleine OCRCraft-Komponenten überführen, dabei `var(--surface*)`, `var(--border*)`, `var(--foreground)`, `var(--muted)`, `var(--focus)` sowie Light/Dark-Theme und deutsche/englische Labels beibehalten; die semantische Button-Grundform ist in `src/components/ui/form.tsx` zentralisiert und in [`docs/ui-components.md`](./docs/ui-components.md) dokumentiert.
- [x] App-Shell modernisieren: Sidebar, Header, Mobile-Navigation, Breadcrumbs, Seitenaktionen und responsive Layout-Zustände auf das ausgewählte HyperUI-Muster angleichen; Breadcrumbs und eine mobile Benutzerkennung sind in der Shell ergänzt, Auth-Weiterleitung, aktueller Benutzer, Skip-Link, Fokusreihenfolge und Tastaturbedienung bleiben erhalten.
- [ ] Wiederverwendbare Oberflächen migrieren: Form-Felder und Validierungsfehler, Buttons, Cards/Stat-Cards, Tabs, Dialoge/Popover, Toasts, Pagination, Alerts und Loading-/Empty-States vereinheitlichen; bestehende `src/components/ui/*`-Komponenten erweitern oder ersetzen, nicht parallel doppelte Varianten anlegen.
- [x] Gemeinsame Feedback-Grundformen begonnen: `Alert` und `EmptyState` sind als lokale, tokenbasierte Komponenten ergänzt und in der Trainingsvorlagen-Seite eingesetzt; weitere Fachseiten folgen im Batch.
- [x] Feedback-Batch erweitert: Trainingsdetail und Gruppenübersicht verwenden jetzt dieselben Alerts und Empty States, ohne Änderungen an Serveraktionen oder Domänenlogik.
- [x] Feedback-Batch auf Hindernisse und Medien ausgeweitet: alle Statusmeldungen der beiden Katalogseiten verwenden jetzt zentrale Alerts; weitere Empty States folgen im Seiten-Batch.
- [x] Empty-State-Batch erweitert: Spielekatalog und AI-Entwürfe verwenden jetzt die gemeinsame `EmptyState`-Komponente mit verständlichem Kontexttext.
- [x] Medien-Empty-State migriert: der leere Medienkatalog verwendet jetzt dieselbe zentrale `EmptyState`-Komponente wie Spiele, AI-Entwürfe, Gruppen und Vorlagen.
- [x] AI-Entwurfsfeedback migriert: die lokale Erfolgs-Notice wurde entfernt und Fehlerzustände verwenden jetzt den zentralen `Alert`-Baustein.
- [x] Admin-Feedback-Batch begonnen: Queue-, Qualitäts-Empty-States und globale Job-Rückmeldungen verwenden jetzt `Alert` beziehungsweise `EmptyState`.
- [x] Admin-Feedback-Batch abgeschlossen: Datenbank-, Benutzer- und Rollenmeldungen verwenden ebenfalls zentrale Alerts mit einheitlicher Live-Region-Semantik.
- [x] Card-Grundform begonnen: `Card` und `CardHeader` sind als tokenbasierte Komponenten ergänzt; `StatCard` verwendet die gemeinsame Grundform.
- [x] Card-Migration erweitert: die statusbehafteten Admin-Übersichtskarten verwenden jetzt `Card` und `CardHeader`.
- [x] Card-Migration erweitert: das Vereinsvorlagen-Panel verwendet jetzt die zentrale `Card`-Grundform; das Filter-/Ergebnis-Grid bleibt davon getrennt.
- [x] Card-Migration abgeschlossen für den Vorlagenkatalog: gespeicherte Vereinsvorlagen und versionierte Startvorlagen verwenden jetzt ebenfalls semantische `Card`-Elemente.
- [x] Card-Migration erweitert: Gruppen-Katalogkarten verwenden jetzt die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-Migration erweitert: Spiele-Katalogkarten verwenden ebenfalls die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-/Empty-State-Migration erweitert: Übungskatalogkarten und der leere Übungskatalog verwenden jetzt die gemeinsamen UI-Bausteine über alle Darstellungsmodi hinweg.
- [x] Card-Migration erweitert: Medien- und Hinderniskatalogkarten verwenden jetzt die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-Migration erweitert: AI-Entwurfskarten verwenden jetzt die gemeinsame Card-Grundform; Review-Blocker und Freigabeaktionen bleiben unverändert.
- [x] Card-/Empty-State-Migration erweitert: Trainingskarten und leere Trainingsarchive verwenden jetzt die gemeinsamen UI-Bausteine.
- [x] Card-Migration erweitert: die Übungsdetailseite verwendet jetzt die zentrale `Card`-/`CardHeader`-Grundform; die bisherige lokale Kartenmarkierung wurde ohne Änderung an Fachlogik oder Datenzugriff entfernt.
- [x] Trainings-UI-Batch erweitert: Phasen-Karten und der deterministische Quickplaner verwenden jetzt die zentrale `Card`-Grundform; Trainingsberechnung, Speichern und AI-/Service-Aufrufe blieben unverändert.
- [ ] Fachseiten in kontrollierten Batches umstellen: Dashboard und Trainingsübersicht sind auf das kompakte Coral/Lime-/Graphit-System migriert; Quick-Create folgt als nächstes, danach Übungen/Hindernisse/Medien sowie Gruppen- und Admin-Bereiche. Pro Batch keine Änderung an Domainlogik oder Serveraktionen und ein visueller Responsive-/Dark-Mode-Abgleich.
- [x] Kompaktes visuelles System umgesetzt: kleinere Radien, dichter AppShell/Header/Sidebar, neutrale Charcoal-Dark-Flächen, Coral als Brand/Creation-Signal, Lime als Training/Progress-Akzent und semantische Warm-up/Main/Cooldown-Tokens; dokumentiert in `docs/design-system.md`.
- [x] Layout-Regression der Trainingsvorlagen behoben: der sticky Vorlagenfilter liegt jetzt in einem gemeinsamen zweispaltigen Grid mit Ergebnisbereich und kann beim Scrollen keine Karten mehr überlagern.
- [ ] Accessibility- und Regression-Gate erweitern: WCAG-nahe Fokus-/Kontrastprüfung, Dialog-/Popover-Escape und Fokus-Rückgabe, Touch-Ziele, reduzierte Bewegung, Formularfehler am Feld, mobile Navigation sowie bestehende `check:ui`- und Playwright-Gates für jede migrierte Oberfläche.
- [x] Statisches Accessibility-Gate erweitert: `check:ui` prüft jetzt zugängliche Breadcrumbs, Live-Regionen/Rollen der Feedback-Komponenten und semantische Card-Elementtypen; echte Browser- und Kontrastprüfungen bleiben offen.
- [ ] Browser-Regression-Gate für migrierte Katalogseiten ergänzen, sobald die E2E-Suite eine authentifizierte Test-Sitzung bereitstellt; aktuell prüft `check:ui` die statischen Accessibility-Verträge.
- [ ] HyperUI-Übernahme abschließen: verwendete Quellen und MIT-Hinweis in der Projektdokumentation festhalten, nicht benötigte Übergangsklassen entfernen, Duplikate aus den Seiten löschen und nach jedem Batch `typecheck`, `lint`, `check:ui`, Unit-, E2E- und Build-Prüfungen ausführen.
- [x] HyperUI-Quellen- und MIT-Hinweis dokumentiert: Herkunft, Lizenzumfang und Abgrenzung zu OCRCraft-eigenem Code sind in [`docs/hyperui-migration.md`](./docs/hyperui-migration.md) und [`docs/ui-components.md`](./docs/ui-components.md) festgehalten; Bereinigung und Abschlussprüfungen bleiben offen.

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
