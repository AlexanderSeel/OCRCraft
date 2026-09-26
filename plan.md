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

- [ ] Anatomisch geprüfte Bilder für alle Übungen ohne Bild erzeugen; der aktuelle Seed-Backlog ist in drei Codex-Batches gestaffelt (17 Einzelperson, 11 OCRFRA-Hindernisse, 14 Spiele/Partner). Die 42 P1-Assets sind seriell erzeugt und als `pending` registriert, müssen aber noch biomechanisch, auf Text-Match und bei Hindernissen zusätzlich auf Geometrie/Sicherheit geprüft werden, bevor sie in den Initial-DuckDB-Snapshot dürfen. Task-Export und sequenzielle Batch-Generierung arbeiten nur den aktuellen DuckDB-Bedarf ab; ein expliziter P1-Batch darf unfreigegebene Altmedien neu erzeugen, schützt aber freigegebene brauchbare Primärmedien. Der Medienkatalog zeigt erledigt/offen/laufend. `npm run exercise:images:codex-review -- --batch=<...>` bzw. „Pending-Review exportieren“ liefert anschließend Asset-ID, lokalen Bildpfad, erwarteten OCRCraft-Prompt und Anatomie-/Text-Checkliste für jedes noch nicht freigegebene Bild.
- [ ] Bildersatz nach Geräteklassifikation abschließen: bei Übungen ohne verwendbares eigenes Medium bzw. mit nicht nutzbarer ExerciseDB-/externer Referenz den bestehenden OCRCraft-AI-Bildprompt verwenden, anatomisch prüfen und als `pending` zuordnen.

## P1 – UX/UI-Konzept und Einheitlichkeit

- [ ] UI-Konsistenz über alle Routen prüfen und abschließen: Formfelder, Buttons, Abstände, Radien, Typografie, Statusfarben, Tabellen, Cards, Dialoge, Pagination und mobile Navigation ausschließlich aus den lokalen UI-Bausteinen beziehen.
- [ ] Fachseiten vollständig auf Dictionaries umstellen: keine user-facing Hardcodings in Dashboard, Katalogen, Editoren, Admin, Trainingsdetail und Statusmeldungen.

## P1 – Interaktive Tutorials


## P2 – Qualität, Analysen und Workflows


## P2 – Clean-Code- und Wartbarkeitsrunde

- [ ] Doppelte UI-Markups und lokale Varianten weiter abbauen: `audit:maintainability` inventarisiert repositoryweit wiederholte statische UI-Klassen und lokale Raw-Button-Dateien in CI; die häufigsten Treffer werden anschließend in zentrale Komponenten/Adapter überführt und regressiv geprüft.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
