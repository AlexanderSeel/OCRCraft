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

- [x] Deploybarer Initialstand: eingecheckte `data/ocrcraft.initial.duckdb` mit Katalog und lokalen Übungsbildern, automatischer Bootstrap bei fehlender DB und reproduzierbarer Snapshot-Build ohne Benutzer-/Trainingsdaten.
- [x] Lizenzfreie, benannte Übungsbilder importiert: 20 Nutzerbilder sind den portablen Übungen zugeordnet, als eigene Primärmedien registriert und externe Bildreferenzen entfernt; nahe Zuordnungen bleiben im Importskript nachvollziehbar.
- [x] Zweites Codex-Bildpaket verarbeitet: 37 neue portable Bilder sind als `club_created`/`pending` importiert; 20 Duplikate wurden übersprungen, freigegebene Medien geschützt und 61 unklare oder nicht vorhandene Zuordnungen für das Review zurückgestellt.
- [x] Korrigiertes Batch 2 verarbeitet: 37 weitere lokale Bilder sind als `club_created`/`pending` importiert, 7 vorhandene freigegebene Medien blieben geschützt und 36 mehrdeutige Zuordnungen wurden für das Review zurückgestellt; der Initial-DuckDB-Snapshot wurde mit 94 lokalen Bildmedien neu gebaut.
- [x] P1-Regeneration der letzten drei Bildpakete abgeschlossen: 48 eindeutig zugeordnete Übungen aus Batch 2–4 wurden mit dem Code-Prompt als 1536×1024-Assets neu erzeugt, anatomisch geprüft und im Initialstand ersetzt; die alten Batch-Quellen haben keine aktiven DB-Referenzen mehr.
- [x] Reviewtes Batch 3 verarbeitet: 40 weitere JPG-Bilder sind als `club_created`/`pending` importiert, 8 vorhandene freigegebene Medien blieben geschützt und 18 mehrdeutige Zuordnungen wurden für das Review zurückgestellt; der Importer validiert nun PNG und JPEG und der Initial-DuckDB-Snapshot enthält 134 lokale Bildmedien.
- [x] Anatomisch geprüftes Batch 4 verarbeitet: 35 weitere JPG-Bilder sind als `club_created`/`pending` importiert, 8 vorhandene freigegebene Medien blieben geschützt und 30 mehrdeutige Zuordnungen wurden fürs Review zurückgestellt; der Initial-DuckDB-Snapshot enthält nun 169 lokale Bildmedien.
- [ ] Offene Outdoor-Konvertierungsreviews fachlich abarbeiten: alle durch Migration 87 als `pending` markierten Importvarianten einzeln prüfen/freigeben; generische Maschinen und mehrdeutige Ersatzgeräte bleiben bis zur Entscheidung blockiert.
- [x] Deterministischer Outdoor-Sammelreview ergänzt: Admins können ausschließlich Konvertierungen mit strukturiertem Ersatz-Equipment und ohne verbliebene Maschinenabhängigkeit gesammelt freigeben; mehrdeutige Fälle bleiben einzeln reviewpflichtig.
- [ ] Kanonische ExerciseDB-Feldanreicherung abschließen: die 159 noch blockierten Kandidaten fachlich entscheiden; nur freigegebene Lücken erhalten eigene DE/EN-Coaching-, Sicherheits- und Progressionsfelder.
- [ ] Kuratierte Seed-Batches als vollständige Lieferpakete abschließen: Migration, Quellenregister, Reviewstatus, Vollständigkeitsbericht, Domain-Tests, `typecheck`, `lint`, `check:ui`, Unit-, Build- und E2E-Prüfung.
- [ ] OCR-Fähigkeitsmatrix und lokale OCRFRA-Maße in Coverage- und Freigabeworkflows durchgängig verbinden; unbestätigte Vereinsmaße bleiben sichtbar offen.

## P1 – UX/UI-Konzept und Einheitlichkeit

- [x] Gemeinsame Katalog-Pagination auf den zentralen UI-Button-Adapter umgestellt; Fokus-, Radius- und Statusregeln gelten damit einheitlich für Übungen, Trainings, Gruppen, Hindernisse, Medien, Spiele, Vorlagen und Outdoor-Reviews.
- [x] Gemeinsame Katalog-Filter verwenden für Anwenden und Zurücksetzen dieselben zentralen Button-Varianten; der responsive Filter-Workflow bleibt auf allen Katalogseiten konsistent.
- [ ] UI-Konsistenz über alle Routen prüfen und abschließen: Formfelder, Buttons, Abstände, Radien, Typografie, Statusfarben, Tabellen, Cards, Dialoge, Pagination und mobile Navigation ausschließlich aus den lokalen UI-Bausteinen beziehen.
- [ ] Accessibility- und Regression-Gate erweitern: Browser-Fokus-/Kontrastprüfung, Touch-Ziele, reduzierte Bewegung, Formularfehler am Feld, Dialog-/Popover-Escape und Fokus-Rückgabe sowie mobile Shell für alle Fachseiten.
- [ ] HyperUI-Übernahme abschließen: Übergangsklassen und doppeltes Seiten-Markup entfernen, Quellenhinweise erhalten und nach jedem Batch die vollständige Abschlussroutine ausführen.
- [ ] Fachseiten vollständig auf Dictionaries umstellen: keine user-facing Hardcodings in Dashboard, Katalogen, Editoren, Admin, Trainingsdetail und Statusmeldungen.

## P1 – Interaktive Tutorials

- [x] Führungen für Dashboard, Kataloge, Übungserstellung, Hinderniszuordnung, Quick Create, Training Builder, Medien, AI-Entwürfe, Outdoor und Administration sind routebewusst registriert und lokal fortsetzbar.
- [x] Hilfezentrum-Führung ergänzt: Tutorial-Neustart, Direkteinstiege und Glossar/Fachhinweise sind als echte Zielbereiche markiert und per E2E abgesichert.
- [x] Tutorial-Trigger kennzeichnet den Abschluss der SSR-/Hydration-Phase explizit; damit können E2E- und Assistenzpfade den interaktiven Bereitschaftszustand prüfen.
- [x] Medienreview-Führung ergänzt: Filter, Batch-/KI-Aktionen sowie Rechte- und Fachreviewkarten sind als konkrete Arbeitsschritte erklärt und per E2E geprüft.
- [x] Outdoor-Review-Führung ergänzt: Portabilitäts-Audit, sichere Anreicherung und Kandidatenfreigabe sind als getrennte Prüfschritte erklärt und per E2E geprüft.
- [x] AI-Entwurfsführung ergänzt: Vorschlagserzeugung, deterministischer Review sowie offene/historische Entwürfe und Trainerfreigabe sind getrennt erklärt und per E2E geprüft.
- [x] Gruppenführung ergänzt: Gruppenerstellung, Filterung sowie Standard- und Schutzwerte sind als eigene Arbeitsschritte erklärt und per E2E geprüft.
- [x] Interaktive Tourführung erweitert: aktive responsive Ziele werden markiert, zum sichtbaren Element gescrollt und können pro Schritt über „Zum Element springen“ erneut angesprungen werden; die Markierung respektiert `prefers-reduced-motion`.
- [ ] Fachliche Tiefenführungen für Medienrechte, Outdoor-Review, AI-Drafts, Gruppenregeln und Trainingsspeicherung mit echten Bearbeitungs-/Reviewaktionen ergänzen.

## P2 – Qualität, Analysen und Workflows

- [x] Seed-Katalog-Integrationstest erhält ein eigenes 30-Sekunden-Limit für den vollständigen DuckDB-Migrationslauf; die komplette Vitest-Suite ist mit 263/263 Tests grün.
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
