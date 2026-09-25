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
- [ ] Anatomisch geprüfte Bilder für alle Übungen ohne Bild erzeugen; der aktuelle Seed-Backlog ist in drei Codex-Batches gestaffelt (17 Einzelperson, 11 OCRFRA-Hindernisse, 14 Spiele/Partner). Task-Export und sequenzielle Batch-Generierung arbeiten nur den aktuellen DuckDB-Bedarf ab; der Medienkatalog zeigt erledigt/offen/laufend. `npm run exercise:images:codex-review -- --batch=<...>` bzw. „Pending-Review exportieren“ liefert anschließend Asset-ID, lokalen Bildpfad, erwarteten OCRCraft-Prompt und Anatomie-/Text-Checkliste für jedes noch nicht freigegebene Bild.
- [x] Fitnessstudio-/Outdoor-Klassifikation abgeschlossen: eindeutig konvertierbare Importgeräte sind auf freigegebenes Kettlebell-/Sandbag-/Band-/Matten-/OCR-Equipment normalisiert; generische oder mehrdeutige Maschinen bleiben archiviert, tragen `fitnessstudio` und sind als abgeschlossene Blockierungsentscheidung protokolliert, ohne eine Ersatzbewegung zu erfinden.
- [ ] Bildersatz nach Geräteklassifikation abschließen: bei Übungen ohne verwendbares eigenes Medium bzw. mit nicht nutzbarer ExerciseDB-/externer Referenz den bestehenden OCRCraft-AI-Bildprompt verwenden, anatomisch prüfen und als `pending` zuordnen.
- [x] Outdoor-Konvertierungsreviews abgeschlossen: 801 deterministisch sichere Konvertierungen sind freigegeben; die verbleibenden generischen/mehrdeutigen Maschinenfälle wurden ohne Heuristik als `Fitnessstudio` blockiert, archiviert und als abgeschlossene Katalogentscheidung dokumentiert.
- [x] Deterministischer Outdoor-Sammelreview ergänzt: Admins können ausschließlich Konvertierungen mit strukturiertem Ersatz-Equipment und ohne verbliebene Maschinenabhängigkeit gesammelt freigeben; mehrdeutige Fälle bleiben einzeln reviewpflichtig.
- [x] Kanonische Feldanreicherung abgeschlossen: Seed-Provenienz ist vollständig und die letzten 12 Bewegungsmuster-Lücken der kuratierten Games sind aus ihren vorhandenen Spielbeschreibungen geschlossen; variable OCR-Aufgabenraster/-sequenzen verwenden bewusst `mixed` statt eine konkrete Bewegung zu erfinden.
- [ ] Kuratierte Seed-Batches als vollständige Lieferpakete abschließen: Migration, Quellenregister, Reviewstatus, Vollständigkeitsbericht, Domain-Tests, `typecheck`, `lint`, `check:ui`, Unit-, Build- und E2E-Prüfung.
- [x] OCR-Fähigkeitsmatrix und lokale OCRFRA-Maße in Coverage-/Freigabeworkflows verbunden: 16 kontrollierte OCR-Skills und Primär-/Sekundär-Mappings für alle OCRFRA-Hindernisse sind strukturiert gespeichert; lokale Maße besitzen einen expliziten `unknown/review/approved/blocked`-Status und bleiben bis Vereinsfreigabe sichtbar offen. Der Admin-Coverage-Report zeigt Skill-Mapping und Maßfreigabe getrennt.

## P1 – UX/UI-Konzept und Einheitlichkeit

- [x] Medien-Schnellverwaltung ergänzt: Bei Übungen mit mehreren Assets öffnet ein barrierearmer Dialog zur Auswahl des Hauptbilds und zum Löschen zusätzlicher Bilder; das Hauptbild ist gegen versehentliches Löschen geschützt.
- [x] Hinderniskatalog im Listenmodus korrigiert: Die direkte Bearbeiten-Aktion bleibt neben dem Öffnen- und Entfernen-Workflow sichtbar.
- [x] Gemeinsame Katalog-Pagination auf den zentralen UI-Button-Adapter umgestellt; Fokus-, Radius- und Statusregeln gelten damit einheitlich für Übungen, Trainings, Gruppen, Hindernisse, Medien, Spiele, Vorlagen und Outdoor-Reviews.
- [x] Gemeinsame Katalog-Filter verwenden für Anwenden und Zurücksetzen dieselben zentralen Button-Varianten; der responsive Filter-Workflow bleibt auf allen Katalogseiten konsistent.
- [x] Kritische Freigabe-, Lösch-, Archivierungs-, Zusammenführungs- und Outdoor-Review-Aktionen zeigen vor dem Absenden ein gemeinsames, per Escape schließbares Bestätigungs-Popover; bestehende Speichern-Formulare verwenden dafür eine form-kompatible Variante.
- [x] Bestätigungs-Popover sind tastaturbedienbar: Trigger verwenden `aria-haspopup`/`aria-controls`, der erste Dialogfokus wird gesetzt und beim Schließen an den auslösenden Button zurückgegeben.
- [x] Versionsanzeige vereinheitlicht: Metadaten, Sidebar und Tutorial verwenden dieselbe typisierte `APP_VERSION`-Quelle.
- [x] E2E-Regression für kritische Bestätigungen ergänzt: Medienfreigabe öffnet per Tastatur, fokussiert den sichtbaren Dialoginhalt und gibt den Fokus nach Escape zurück; der Windows-DuckDB-Lock behandelt parallele `EPERM`-Kollisionen als Retry-Fall.
- [x] Medienauswahl FK-sicher gemacht: Beim Wechsel des Hauptbilds werden nicht primäre, von abgeschlossenen Bildjobs referenzierte Assets nicht unnötig aktualisiert; echte Primärwechsel lösen nur die betroffene Jobreferenz kontrolliert.
- [ ] UI-Konsistenz über alle Routen prüfen und abschließen: Formfelder, Buttons, Abstände, Radien, Typografie, Statusfarben, Tabellen, Cards, Dialoge, Pagination und mobile Navigation ausschließlich aus den lokalen UI-Bausteinen beziehen.
- [x] Accessibility- und Regression-Gate erweitert: alle zentralen Fachseiten laufen durch Landmark-/Name-/ID-Prüfung; Mobile-Navigation erzwingt 44px-Touch-Ziele, Light/Dark-Kontrast wird browserseitig geprüft, reduzierte Bewegung global respektiert, native Formularfehler sind am Feld angekündigt und Dialog-/Popover-Escape/Fokus-Rückgabe bleiben per Playwright abgesichert.
- [x] HyperUI-Übernahme abgeschlossen: HyperUI bleibt dokumentierte MIT-Markup-Referenz ohne Runtime-Paket; die alte Dark-Mode-Kompatibilität für `bg-white`/direkte Hex-Klassen ist entfernt und `check:ui` verbietet neue Legacy-/Fremdfarben zugunsten semantischer OCRCraft-Tokens.
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
- [x] Fachliche Tiefenführungen abgeschlossen: Medienrechte führen bis zur expliziten Freigabeentscheidung, Outdoor bis zur deterministischen Sammelfreigabe, AI-Drafts bis zur blocker-sicheren Freigabe, Gruppen bis zum Kids/Youth-Schutzprofil und der Training Builder bis zur validierten Trainerreview-/Speicheraktion; die Zielmarken sind per Playwright abgesichert.

## P2 – Qualität, Analysen und Workflows

- [x] Seed-Katalog-Integrationstest erhält ein eigenes 30-Sekunden-Limit für den vollständigen DuckDB-Migrationslauf; die komplette Vitest-Suite ist mit 263/263 Tests grün.
- [x] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E ausgebaut: Quick Create erzeugt und persistiert einen validierten Entwurf, der Builder speichert echte Änderungen, zu junge Kids-Konfigurationen dürfen den freigegebenen Pool nicht durch Lockerung harter Grenzen erzwingen und Theme-Persistenz bleibt browserseitig geprüft.
- [x] Qualitätsanalyse aus Repository-/Service-Daten ergänzt: Admin-Übersicht zeigt Übungsnutzung und ungenutzte Übungen, fehlende Primärregionen, OCR-/Hindernisabdeckung, gespeichertes Laufvolumen, Running-Items, Wiederholungswarnungen der letzten sechs Trainings sowie Zielgruppen-/Orts-Szenarien mit erklärbaren Nulltreffern.
- [x] Vollständigkeits- und KI-Ersetzungsanalyse erweitert: der Qualitätsreport kombiniert Katalog-Vollständigkeit mit Bildersatzgründen (`missing`, Rechteblocker, Generierungsfehler, unbrauchbar, laufender Job) sowie offenen und freigegebenen Medienreviews; die bestehenden DE/EN-/Coaching-/Sicherheitsdetails bleiben im Seed-Vollständigkeitsbericht drill-down-fähig.

## P2 – Clean-Code- und Wartbarkeitsrunde

- [x] Initial-Datenbank-Build entkoppelt: Migrationen werden automatisch aus dem nummerierten Migrationsverzeichnis erkannt; die deterministische Outdoor-Review-Regel wird zwischen Zählung und Freigabe geteilt und der Bulk-Workflow meldet das Ergebnis barrierearm zurück.
- [x] Duplikatprüfung vereinheitlicht: Einzel- und Sammelentscheidungen laufen über `duplicate_resolve` in der Aufgabenqueue, Payloads werden am Rand validiert und der Worker meldet Sammelfortschritt bzw. unbekannte Tasktypen als Fehler.
- [ ] Doppelte UI-Markups und lokale Varianten weiter abbauen: `audit:maintainability` inventarisiert repositoryweit wiederholte statische UI-Klassen und lokale Raw-Button-Dateien in CI; die häufigsten Treffer werden anschließend in zentrale Komponenten/Adapter überführt und regressiv geprüft.
- [ ] Unnötigen oder toten Code weiter entfernen: `audit:maintainability` meldet wahrscheinlich ungenutzte benannte Exporte repositoryweit; sichere Treffer, verwaiste CSS-Klassen, nicht erreichbare Routen und überholte Übergangskomponenten werden nach Verwendungsprüfung entfernt.
- [x] Server-/Domain-Grenzen automatisiert abgesichert: `check:architecture` verhindert direkte DuckDB-Zugriffe aus UI/Routes und Infrastrukturimporte im Domain-Layer; Services/Repositories bleiben die Datenzugriffsgrenze und der Gate läuft in CI.
- [x] Abhängigkeiten und Skripte abgesichert: `check:architecture` inventarisiert Runtime-Dependencies, meldet unreferenzierte Pakete, prüft die vollständige Abschlussroutine und hält README/CI-Befehle synchron; der Gate ist CI-grün.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
