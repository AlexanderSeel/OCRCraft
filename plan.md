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

## P1 – Basiskatalog, Gelände und sauberer Start

Referenz und aktueller Prüfstand: [`docs/catalog-startup-review.md`](./docs/catalog-startup-review.md). Reproduzierbarer Datenbank-Audit: `npm run data:audit-startup` (read-only).

- [ ] **Alle bestehenden Hindernisse, Spiele und Übungen fachlich prüfen**, einschließlich importierter/archivierter Einträge: eindeutiger Name/Identität, korrekter Typ (Gerät/Hindernis vs. Bewegung/Drill/Spiel), OCR-/Calisthenics-/Functional-/CrossFit-Bezug, Alters-/Erfahrungsgrenzen, Risiko, Voraussetzungen, Aufsicht, Kapazität, Equipment, Bewegungsmuster, Ziele, DE/EN-Anleitung, Level und sichere Alternativen. Entscheidungen je Datensatz nachvollziehbar protokollieren.
- [ ] **Alle zugeordneten Bilder und Videos auf tatsächliche Übereinstimmung prüfen**: Übungsvariante, Anatomie/Gelenkstellung, Start-/Endposition, Last/Griff, Anzahl/Rollen der Personen, Equipment und bei Hindernissen Geometrie, Ein-/Ausstieg und Freizonen; Bildtext/Schrittfolge, Rechte/Quellen und Primärmedium kontrollieren. `approved` allein ersetzt keine dokumentierte Anatomie-/Text-Match-Prüfung. Falsche Medien sperren/ersetzen, erst nach Review freigeben.
- [ ] **Basiskatalog anhand einer Abdeckungsmatrix vervollständigen**: gängige OCR-Hindernisfamilien und Technikprogressionen; Calisthenics-Grundmuster; funktionelle/CrossFit-typische Bewegungen mit skalierbaren Outdoor-Alternativen; inklusive Lauf-/Koordinations-/Partner-/Teamspiele; Warm-up und Cooldown. Kein pauschaler Vollständigkeitsanspruch anhand einer Importanzahl; fehlende Familien gezielt ergänzen, keine redundanten Namensvarianten erzeugen. Die aufgedeckte Alterslücke für fünfjährige Gruppen separat fachlich bearbeiten; Mindestalter nicht zur Umgehung leerer Kandidatenpools herabsetzen.
- [ ] **Gelände strukturiert abbilden und in beide Planer einbinden**: großes Feld, Hindernisbereich, Kunstrasenplatz **40 × 20 m** und Feld mit **400-m-Laufbahn**. Abmessungen unbekannter Flächen, Wege/Übergänge, belegte Teilflächen, Oberflächen-/Wettergrenzen und verfügbare Geräte/Stationen vor Ort aufnehmen. Keine Gerätebestände oder nutzbaren Sicherheitsabstände erfinden.
- [ ] **Outdoor-Adaptionen fachlich prüfen**: Kraft-/Calisthenics-/CrossFit-Varianten müssen mit tatsächlich vorhandenem portablem Equipment und geeignetem Untergrund funktionieren; kein bloßes Umbenennen von Studiomaschinen. Technikziel, Last, Level, Ausweichvariante und Aufbau-/Wechselzeit dokumentieren. Kunstrasen nicht automatisch für schwere Drops, scharfe Gegenstände oder jede Reibungs-/Zugübung freigeben.
- [ ] **Datenbestand kuratieren und Startkatalog freigeben**: 1.236 aktive Datensätze ohne Mindestalter/Ziele und 1.233 ohne Bewegungsmuster nacharbeiten; drei aktive Namensduplikatgruppen vergleichen und referenzsicher zusammenführen/abgrenzen; geprüften Startkatalog von unkuratiertem Import-/Reviewbestand trennen. Trainings-/Versions-/Medienreferenzen und stabile IDs erhalten; keine pauschale Löschung vorhandener Nutzerdaten.
- [ ] **Fachliche Planerfreigabe als eigenen Workflow einführen**: Metadaten-Eligibility wird bereits deterministisch für beide Generatoren geprüft; expliziten Review-/Freigabestatus mit Verantwortlichem, Begründung und Invalidierung nach relevanten Änderungen ergänzen. Legacy-`compat-v1`-Reviews sind keine manuelle Fachfreigabe. Import-/Altbestände einzeln prüfen, nicht automatisch aus aktivem Status oder vollständigen Feldern freigeben.
- [ ] **Startup-Inhalte abschließend prüfen**: Seed-/Medienreview, Datei-/Referenzintegrität, Quellen/Lizenzen, keine privaten Konfigurationsdaten, keine Test-/Queue-/Trainingsreste, aktuelle Migrationen und Suchindex. Die technisch bereinigte Startdatenbank ist noch keine fachliche Freigabe aller Kataloginhalte.

- [ ] Anatomisch geprüfte Bilder für alle Übungen ohne Bild erzeugen; der aktuelle Seed-Backlog ist in drei Codex-Batches gestaffelt (17 Einzelperson, 11 OCRFRA-Hindernisse, 14 Spiele/Partner). Die 42 P1-Assets sind seriell erzeugt und als `pending` registriert, müssen aber noch biomechanisch, auf Text-Match und bei Hindernissen zusätzlich auf Geometrie/Sicherheit geprüft werden, bevor sie in den Initial-DuckDB-Snapshot dürfen. Task-Export und sequenzielle Batch-Generierung arbeiten nur den aktuellen DuckDB-Bedarf ab; ein expliziter P1-Batch darf unfreigegebene Altmedien neu erzeugen, schützt aber freigegebene brauchbare Primärmedien. Der Medienkatalog zeigt erledigt/offen/laufend. `npm run exercise:images:codex-review -- --batch=<...>` bzw. „Pending-Review exportieren“ liefert anschließend Asset-ID, lokalen Bildpfad, erwarteten OCRCraft-Prompt und Anatomie-/Text-Checkliste für jedes noch nicht freigegebene Bild.
- [ ] Bildersatz nach Geräteklassifikation abschließen: bei Übungen ohne verwendbares eigenes Medium bzw. mit nicht nutzbarer ExerciseDB-/externer Referenz den bestehenden OCRCraft-AI-Bildprompt verwenden, anatomisch prüfen und als `pending` zuordnen.

## P1 – Trainingsmethodik für KI und Offline-Algorithmus

- [ ] Gemeinsamen, versionierten Methodikvertrag für beide Generatoren vollständig nachweisen: Ziel-/Alters-/Erfahrungsbezug; progressive Vorbereitung; Technik vor relevanter Ermüdung; skalierbare Intensität/Last/Volumen und ausreichende Erholung; sinnvolle Bewegungsbalance; drei Kernphasen; realistische Dauer inklusive Übergängen. Quellenbasierte Regeln, Vereinsentscheidungen und Heuristiken unterscheiden.
- [ ] Gelände-/Equipment-/Kapazitäts-/Aufsichts- und Altersregeln als deterministische Grenzen auf beide Wege anwenden; 400-m-Runden, Teilstrecken und Feld-/Court-Shuttles mit tatsächlichen Wegen und Zeitbudgets berechnen. Wettkampfregeln nicht als allgemeine Vereinsregel ausgeben.
- [ ] Vergleichbare Regressionen für KI und Offline aufbauen: Kinder/Jugend, gemischte Gruppen, Calisthenics-Einstieg, OCR-Technik vor Fatigue, Outdoor-Zirkel, Rig & Run/400-m-Runden, Kunstrasen-Spiele, knappe Stationen und ungeeignete Flächen. Kein Erfolg allein durch einen plausiblen KI-Text oder einen heuristischen Qualitätsscore.

## P1 – UX/UI-Konzept und Einheitlichkeit

- [ ] Erzeugte und bearbeitete Vorschläge einschließlich Übungsauswahl/Programmierung wiederherstellbar machen; wiederhergestellte Inhalte bleiben bis Schema- und aktueller Domänenprüfung untrusted und benötigen explizite Trainerprüfung (UX-02).
- [ ] Mobile Filter, Standardseitengrößen und Sichtbarkeit des aktiven Navigationsziels verbessern (UX-05/06).
- [ ] Feldhinweise touchfähig/verknüpft/schließbar machen, Admin-Linknavigation semantisch korrigieren und Route-Lade-/Fehlergrenzen ergänzen (UX-07–09).
- [ ] UI-Konsistenz über alle Routen prüfen und abschließen: Formfelder, Buttons, Abstände, Radien, Typografie, Statusfarben, Tabellen, Cards, Dialoge, Pagination und mobile Navigation ausschließlich aus den lokalen UI-Bausteinen beziehen.
- [ ] Fachseiten vollständig auf Dictionaries umstellen: keine user-facing Hardcodings in Dashboard, Katalogen, Editoren, Admin, Trainingsdetail und Statusmeldungen.

## P2 – Clean-Code- und Wartbarkeitsrunde

- [ ] Doppelte UI-Markups und lokale Varianten weiter abbauen: `audit:maintainability` inventarisiert repositoryweit wiederholte statische UI-Klassen und lokale Raw-Button-Dateien in CI; die häufigsten Treffer werden anschließend in zentrale Komponenten/Adapter überführt und regressiv geprüft.

## Nächste Schritte

1. Katalog-/Medienprüfung und Gelände-/Equipment-Inventar anhand des Audits beginnen; Startbestand fachlich kuratieren.
2. Methodik-/Geländevertrag und gleiche deterministische Prüfungen für KI und Offline nachweisen.
3. Wiederherstellung erzeugter/bearbeiteter Vorschläge abschließen (UX-02).
4. Mobile Filter/Navigation, Feldhinweise, Admin-Semantik, Lade-/Fehlerzustände, Dictionaries und UI-Konsolidierung.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
