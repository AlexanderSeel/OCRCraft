# OCRCraft – offene Vorhaben

> Release: `1.0.0` · Primärsprache Deutsch · UI-Inhalte bleiben für Englisch übersetzbar.

Die abgeschlossenen Vorhaben stehen in [`README.md`](./README.md). Diese Datei enthält nur noch offene Arbeit und die nächsten geplanten Schritte.

Die behobene Dev-Ladezeit samt Messungen und Betriebsgrenzen ist in [`docs/page-loading-performance.md`](./docs/page-loading-performance.md) dokumentiert. Die unten offenen Lade-/Fehlerzustände betreffen die verbleibende UX-Arbeit.

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
- [ ] **Geländeprofile vor Ort vervollständigen und räumliche Grenzen validieren**: nutzbare Teilflächen statt Gesamtmaße, Wege/Übergänge, Belegung, Bahnbreite/Ein- und Ausgänge, Oberflächen-/Wettergrenzen und verfügbare Geräte/Stationen aufnehmen. Diese Grenzen anschließend deterministisch auf beide Generatoren anwenden; der Profilname oder bekannte 40 × 20 m bzw. 400-m-Rundenlänge ist keine Flächen-/Sicherheitsfreigabe. Keine Gerätebestände, Shuttlelängen oder nutzbaren Sicherheitsabstände erfinden. Die vorhandene Profilauswahl ist in README dokumentiert.
- [ ] **Outdoor-Adaptionen fachlich prüfen**: Kraft-/Calisthenics-/CrossFit-Varianten müssen mit tatsächlich vorhandenem portablem Equipment und geeignetem Untergrund funktionieren; kein bloßes Umbenennen von Studiomaschinen. Technikziel, Last, Level, Ausweichvariante und Aufbau-/Wechselzeit dokumentieren. Kunstrasen nicht automatisch für schwere Drops, scharfe Gegenstände oder jede Reibungs-/Zugübung freigeben.
- [ ] **Datenbestand kuratieren und Startkatalog freigeben**: 1.236 aktive Datensätze ohne Mindestalter/Ziele und 1.233 ohne Bewegungsmuster nacharbeiten; drei aktive Namensduplikatgruppen vergleichen und referenzsicher zusammenführen/abgrenzen; geprüften Startkatalog von unkuratiertem Import-/Reviewbestand trennen. Trainings-/Versions-/Medienreferenzen und stabile IDs erhalten; keine pauschale Löschung vorhandener Nutzerdaten.
- [ ] **Fachliche Planerfreigabe als eigenen Workflow einführen**: Metadaten-Eligibility wird bereits deterministisch für beide Generatoren geprüft; expliziten Review-/Freigabestatus mit Verantwortlichem, Begründung und Invalidierung nach relevanten Änderungen ergänzen. Legacy-`compat-v1`-Reviews sind keine manuelle Fachfreigabe. Import-/Altbestände einzeln prüfen, nicht automatisch aus aktivem Status oder vollständigen Feldern freigeben.
- [ ] **Startup-Inhalte abschließend prüfen**: Seed-/Medienreview, Datei-/Referenzintegrität, Quellen/Lizenzen, keine privaten Konfigurationsdaten, keine Test-/Queue-/Trainingsreste, aktuelle Migrationen und Suchindex. Die technisch bereinigte Startdatenbank ist noch keine fachliche Freigabe aller Kataloginhalte.

- [ ] **42 P1-Bilder nachbearbeiten und fachlich freigeben**: Der [erste visuelle Durchgang](./docs/reviews/README.md) dokumentiert 27 konkrete Änderungsfälle und 15 weitere Trainerprüfungen. Kontakte, Pfeile, Endpositionen, Hindernisgeometrie sowie Spielrollen/-wege korrigieren; anschließend Anatomie, Text-Match, Rechte und Vor-Ort-Sicherheit erneut prüfen. Keine pauschale Freigabe anhand vollständiger Metadaten oder des visuellen Erstdurchgangs.
- [ ] **Verbleibende Bildlücken schließen**: Fehlende brauchbare Übungsbilder mit dem bestehenden OCRCraft-Prompt erzeugen und einzeln prüfen. Serien-/Batchexporte über `npm run exercise:images:codex-tasks` bzw. `exercise:images:codex-review` anhand des aktuellen Datenbankbedarfs neu erstellen; alte Exporte sind keine aktuellen Pending-Zähler. Neue Medien bleiben bis dokumentierter Anatomie-/Text-/Rechteprüfung unfreigegeben.
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

1. Die 27 dokumentierten Bildbefunde korrigieren und 15 offene Trainerprüfungen abschließen. Reale Hindernisgeometrien aufnehmen; übrige Katalogmedien/Videos und Gelände-/Equipment-Inventar weiter prüfen.
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
