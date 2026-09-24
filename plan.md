# OCRCraft – offene Vorhaben

> Release: `1.0.0` · Primärsprache Deutsch · UI-Inhalte bleiben für Englisch übersetzbar.

Die abgeschlossenen Vorhaben stehen in [`README.md`](./README.md). Diese Datei enthält nur noch offene Arbeit und die nächsten geplanten Schritte.

## Leitplanken

- Jede Einheit zeigt Aufwärmen, Hauptteil und Cooldown & Stretching.
- Architektur bleibt getrennt: `UI → Anwendung/Service → Repository → DuckDB`.
- KI schlägt vor; Trainer prüfen, ändern und speichern.
- Alters-, Risiko-, Vereins-, Equipment- und Kapazitätsregeln bleiben harte Grenzen.
- Jede Änderung braucht typed boundaries, zugängliche Zustände, Domänenvalidierung und aussagekräftige Tests.
- Ein UI-Muster wird zentral gepflegt und auf alle Fachseiten übertragen; keine parallelen Varianten.

## P1 – Daten und Fachlichkeit

- [x] Lizenzfreie, benannte Übungsbilder importiert: 20 Nutzerbilder sind den portablen Übungen zugeordnet, als eigene Primärmedien registriert und externe Bildreferenzen entfernt; nahe Zuordnungen bleiben im Importskript nachvollziehbar.
- [ ] Offene Outdoor-Konvertierungsreviews fachlich abarbeiten: alle durch Migration 87 als `pending` markierten Importvarianten einzeln prüfen/freigeben; generische Maschinen und mehrdeutige Ersatzgeräte bleiben bis zur Entscheidung blockiert.
- [ ] Kanonische ExerciseDB-Feldanreicherung abschließen: die 159 noch blockierten Kandidaten fachlich entscheiden; nur freigegebene Lücken erhalten eigene DE/EN-Coaching-, Sicherheits- und Progressionsfelder.
- [ ] Kuratierte Seed-Batches als vollständige Lieferpakete abschließen: Migration, Quellenregister, Reviewstatus, Vollständigkeitsbericht, Domain-Tests, `typecheck`, `lint`, `check:ui`, Unit-, Build- und E2E-Prüfung.
- [ ] OCR-Fähigkeitsmatrix und lokale OCRFRA-Maße in Coverage- und Freigabeworkflows durchgängig verbinden; unbestätigte Vereinsmaße bleiben sichtbar offen.
- [ ] Die readme.md wird zur einer richtigen Übersicht und Features dieser App umgeschrieben, mit detailierten Infos. Nicht aber ein Migrations oder Update Dokumnet, dafür gibt es Release Notes

## P1 – UX/UI-Konzept und Einheitlichkeit

- [ ] UX-Konzept als verbindliches Muster dokumentieren: Seitenhierarchie, primäre Aktion, Filterbereich, Ergebnisbereich, Empty/Loading/Error-State, responsive Verhalten, Fokusreihenfolge und Reviewblocker pro Fachseite.
- [ ] UI-Konsistenz über alle Routen prüfen und abschließen: Formfelder, Buttons, Abstände, Radien, Typografie, Statusfarben, Tabellen, Cards, Dialoge, Pagination und mobile Navigation ausschließlich aus den lokalen UI-Bausteinen beziehen.
- [ ] Accessibility- und Regression-Gate erweitern: Browser-Fokus-/Kontrastprüfung, Touch-Ziele, reduzierte Bewegung, Formularfehler am Feld, Dialog-/Popover-Escape und Fokus-Rückgabe sowie mobile Shell für alle Fachseiten.
- [ ] HyperUI-Übernahme abschließen: Übergangsklassen und doppeltes Seiten-Markup entfernen, Quellenhinweise erhalten und nach jedem Batch die vollständige Abschlussroutine ausführen.
- [ ] Fachseiten vollständig auf Dictionaries umstellen: keine user-facing Hardcodings in Dashboard, Katalogen, Editoren, Admin, Trainingsdetail und Statusmeldungen.

## P1 – Interaktive Tutorials

- [ ] Tutorial-Grundlage auf alle Arbeitsbereiche erweitern: Dashboard, Training, Übungen, Hindernisse, Spiele, Gruppen, Medien, AI-Entwürfe, Outdoor und Administration erhalten routebewusste Schritte mit DE/EN-Texten und echten Zielmarken.
- [ ] Kernführungen fachlich vertiefen: „Übung erstellen“, „Hindernis erstellen/zuordnen“ und „Trainingsplan erstellen“ erklären Eingaben, Sicherheitsprüfung, Trainerreview und Speichern in der tatsächlichen Reihenfolge.
- [ ] Tutorial-Zustand verbessern: Fortschritt pro Bereich speichern, Wiedereinstieg ermöglichen, fehlende Zielmarken verständlich behandeln und keine Führung automatisch über kritische Formulare legen.
- [ ] Tutorial-Tests ergänzen: Tastatur, Escape, Fokus, reduzierte Bewegung, mobile Ansicht, Sprachwechsel und korrekte Zielmarken für jeden Kernworkflow per Playwright prüfen.
- [ ] Ein dauerhaft zugängliches Hilfezentrum als Einstieg für „Tutorial erneut öffnen“, Glossar und kurze Fachhinweise ergänzen.

## P2 – Qualität, Analysen und Workflows

- [ ] Portabilitäts-Audit als regelmäßigen Qualitätsworkflow ergänzen: `portable`, `converted` und `blocked` mit Quelle, Begründung und Reviewdatum auswerten.
- [ ] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E ausbauen: echte Editoränderung, Speichern, Reviewblocker und geschützte Kids/Youth-Sperren abdecken.
- [ ] Übungsnutzung, Körperregionen, Hindernisabdeckung, Laufvolumen, Wiederholungswarnungen und Nulltreffer aus Repository-/Service-Daten analysieren; Filterzustände müssen erklärbar bleiben.
- [ ] Vollständigkeits- und KI-Ersetzungsanalysen weiter ausbauen: fehlende DE/EN-/Coaching-/Sicherheitsfelder, Ersatzquote, Blockierungsgründe und Trainerfreigaben nachvollziehbar darstellen; Medien ohne Nutzungsfreigabe werden bereits als eigene KI-Ersatzkandidaten ausgewiesen.

## P2 – Clean-Code- und Wartbarkeitsrunde

- [ ] Doppelte UI-Markups und lokale Varianten per AST-/Repository-Inventur erfassen, in zentrale Komponenten überführen und nach jedem Schritt visuell/regressiv prüfen.
- [ ] Unnötigen oder toten Code entfernen: ungenutzte Exporte, verwaiste CSS-Klassen, nicht erreichbare Routen, doppelte Hilfsfunktionen und überholte Übergangskomponenten; Verhalten vorher/nachher testen.
- [ ] Server-/Domain-Grenzen prüfen: React darf keine DuckDB-Abfragen enthalten, externe Eingaben bleiben schema-validiert, Domänenregeln bleiben frameworkfrei und Services bleiben zuständig für Orchestrierung.
- [ ] Abhängigkeiten und Skripte bereinigen: ungenutzte Pakete, doppelte Testpfade und nicht dokumentierte Build-Schritte entfernen; README und CI-Befehle synchron halten.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
