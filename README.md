# OCRCraft

OCRCraft ist eine Trainings- und Kataloganwendung für OCR-Clubs, funktionelles Training und Breitensport. Die App unterstützt Trainer dabei, Übungen strukturiert zu pflegen, sichere Trainings zusammenzustellen, Gruppen und Zielgruppen zu berücksichtigen und Medien, Outdoor-Varianten sowie KI-gestützte Vorschläge kontrolliert zu verwalten.

Die fachliche Grundstruktur eines Trainings bleibt immer sichtbar:

**Aufwärmen → Hauptteil → Cooldown & Stretching**

OCRCraft ist als Trainerwerkzeug ausgelegt: Automatik und KI dürfen Vorschläge erzeugen, die endgültige Auswahl, Freigabe und Speicherung bleibt beim Trainer.

## Hauptfunktionen

### Übungskatalog

Der Übungskatalog ist die fachliche Basis der Anwendung. Übungen können gesucht, gefiltert, erstellt, bearbeitet, archiviert und wiederhergestellt werden.

- Betriebssicherheit: Authentifizierung, RBAC und erweiterbare Rollen/Rechte, Audit-Events, Backup/Restore, portable Exporte/Importe und persistente Hintergrundaufgaben.
- Trainingsplanung: Quick Create und Training Builder mit Warm-up/Hauptteil/Cooldown, Alters-/Risiko-/Equipment-/Kapazitätsregeln, AI-Revalidierung, Versionen, Alternativen, Undo/Redo, Team- und Partnerformaten.
- Katalogqualität: zweisprachige Seeds, Aliase, Coaching-/Sicherheitsfelder, Facetten, Progressionen/Regressionen, Games, Hindernisse, Outdoor-Varianten, Dublettenprüfung und Medienreview.
- Gruppen und Schutz: editierbare Kids-/Youth-Profile, Trainerqualifikation, Aufsicht, Hindernissperren, Maximalrisiken und nicht abschwächbare `hardSafetyConstraints`.
- Katalog-UX: gemeinsame Liste/Klein/Groß/Detail-Ansichten, URL-Filter, Ergebniszähler, Seitengrößen, Pagination und Filter-Sidepanels für alle zentralen Kataloge; Dashboard-Kennzahlen stammen aus Repository-Aggregaten.
- Qualitätssicherung: Accessibility- und Playwright-Gates, Kids-/Builder-/Quick-Create-Pfade, UI-Review-Gate gegen feste Katalogzähler und bekannte Legacy-Texte sowie vollständige TypeScript-/Vitest-/Build-Prüfungen.
- UI-Bausteinschicht: lokale Dialog-/Popover-, Form-, Pagination-, Tab-, Sidebar- und Toast-Komponenten mit Fokus-, Live-Region- und Token-Regeln; siehe [`docs/ui-components.md`](./docs/ui-components.md).
- Internationalisierungsgrundlage: typisierte DE/EN-Dictionaries, persistierter Sprachumschalter und übersetzte globale Navigation/Theme-Beschriftungen; die vollständige Fachseiten-Abdeckung bleibt in `plan.md` offen.
- Übersetzungsqualität: Der Admin-Tab „Datenqualität“ prüft Dictionary-Schlüssel auf fehlende und verwaiste Einträge; Fachseiten können schrittweise an dieselbe Schlüsselstruktur angebunden werden.
- Strukturierte Übersetzungsqualität: Der Admin-Vollständigkeitsbericht prüft pro DE/EN-Datensatz Detailfelder, Ausführungsschritte, Coaching-Cues und Fehlerkorrekturen getrennt.
- Datenbank-Release 1.0: 90 nummerierte Migrationen bis Version 91 werden über [`src/server/db/initial-v1.sql`](./src/server/db/initial-v1.sql) als atomare Fresh-Install-Baseline ausgeliefert; bestehende Datenbanken bleiben upgradefähig.
- App-Version: Die sichtbare Versionskennung wird zentral in [`src/config/app-version.ts`](./src/config/app-version.ts) gepflegt und in Metadaten, Sidebar und Tutorials wiederverwendet.
- Hallen-/Outdoor-Katalog: Importierte Studio-Lasten werden auf Kettlebell, Sandbag, Widerstandsband, Matte oder Körpergewicht umgeschrieben; nicht sinnvoll konvertierbare Studio- und Cardiogeräte verlassen den aktiven Katalog, bleiben als Provenienz erhalten und tragen die Facette `Fitnessstudio`. Der aktive kuratierte Katalog besitzt einen nachvollziehbaren Portabilitäts-/Stationsreview in `exercise_environment_reviews`.
- Medienbereinigung: 20 benannte, portable Nutzerbilder und 37 weitere Codex-Bilder bleiben als lokale Medien erhalten. Die 48 eindeutig zugeordneten Bilder aus Batch 2 bis Batch 4 wurden nach P1 als neue, anatomisch geprüfte `1536×1024`-Sequenzillustrationen erzeugt; die alten kleinen/cropped Batch-Dateien und ihre DB-Referenzen wurden entfernt. 84 unklare Zuordnungen wurden weiterhin nicht geraten. Der deploybare Initialstand enthält damit 105 lokale Bildmedien.
- Outdoor-Review: Der Adminbereich bietet einen expliziten Sammelreview für eindeutig portabel abbildbare Konvertierungen. Freigegeben werden nur Datensätze mit strukturiertem Ersatz-Equipment und ohne Maschinen-/Instabilitätsgerät; unklare Fälle bleiben im Einzelreview.
- Outdoor-Review-Stand: 801 deterministisch sichere Konvertierungen wurden freigegeben. Generische bzw. mehrdeutige Maschinenfälle bleiben ohne erfundene Ersatzbewegung archiviert und `Fitnessstudio`-klassifiziert; Migration 89 schließt diese Blockierungsentscheidungen als Katalogreview ab.
- Seed-Provenienz und Bewegungsmuster: Migration 88 ordnet allen OCRCraft-Seeds ihre interne Originalquelle zu; Migration 90 schließt die letzten 12 kuratierten Game-Bewegungsmuster aus den vorhandenen Spielbeschreibungen. Variable OCR-Aufgabenraster/-sequenzen verwenden `mixed`, damit keine konkrete Bewegung erfunden wird.
- Equipment-Planung: Training Builder und Outdoor-Übungseditor zeigen Bestand sowie `Portabel`, `Fest / Rig` oder `Nicht klassifiziert`; Outdoor startet mit Portable-Filter und verwendet das hinterlegte Ersatz-Equipment automatisch für die Verfügbarkeitsprüfung.
- Outdoor-Konvertierungsreview: automatische Import-Ersetzungen basieren auf einer expliziten Freigabeliste statt Geräte-String-Heuristiken. Bereits migrierte Konvertierungen werden einmalig als `pending` in den Fachreview gestellt; die Vorschau nutzt Bewegungsmuster bzw. konservative Namensableitung, Trainertexte bleiben erhalten und die Freigabe wird mit Reviewer/Zeitpunkt protokolliert.
- Datenkuratierung: Quellenregister, 70%-Matching, OCR-Relevanz-Audit für 177 Kandidaten, High-Signal-Review, OCR-/OCRFRA-Lückenbatches, Quellen-/Lizenztrennung und Katalog-Coverage sind dokumentiert und getestet.
- OCRFRA-Fachpakete: lokale Hindernisse, 16 kontrollierte OCR-Skills mit Primär-/Sekundär-Mapping, Templates, Spielkatalog, Sicherheitszonen, Fallbacks und Altersgrenzen sind strukturiert hinterlegt. Lokale Hindernismaße besitzen einen separaten Freigabestatus und bleiben bis expliziter Vereinsmessung im Review.
- UI-Konsolidierung: lokale Form-, Card-, Feedback-, Dialog-, Popover-, Pagination-, Sidebar-, Toast- und Filterbausteine sowie das kompakte Coral/Lime/Graphit-Designsystem sind über die zentralen Katalog- und Trainingsseiten eingeführt. Die Legacy-Farbkompatibilität ist entfernt; direkte Fremd-/Hex-Farbklassen werden vom UI-Gate blockiert.
- Medien-UX: Übungen mit mehreren Bildern besitzen im Editor eine Schnellverwaltung zum Setzen des Hauptbilds und zum Löschen zusätzlicher Assets; das Hauptbild bleibt geschützt.
- Bestätigungs-UX: Kritische Freigaben, Löschungen, Archivierungen, Zusammenführungen und Outdoor-Sammelaktionen werden durch ein zugängliches Bestätigungs-Popover abgesichert; Abbrechen, Escape und Klick außerhalb schließen die Bestätigung ohne Submit.
- Tastaturzugänglichkeit: Bestätigungs-Popover setzen den Fokus beim Öffnen in den Dialog und geben ihn beim Schließen an den Auslöser zurück.
- E2E-Betrieb: Der kritische Medienfreigabe-Workflow ist per Playwright abgesichert; parallele Windows-DuckDB-Lock-Kollisionen werden beim E2E-/Worker-Start retrybar behandelt. Persistenz-E2E deckt zusätzlich Quick Create und Training Builder mit echten Änderungen/Speichern sowie einen harten Kids-Mindestalter-Blocker und Theme-Persistenz ab.
- Medien-Datenintegrität: Der Wechsel des Hauptbilds berücksichtigt DuckDB-Fremdschlüssel auf abgeschlossenen Bildjobs und vermeidet unnötige Updates referenzierter Assets.
- Hindernis-UX: Im Listenmodus bleibt die direkte Bearbeitung von Hindernis-Guidance sichtbar.
- Qualitäts- und Sicherheitsgates: statische UI-Prüfung, Playwright-Regressionen, Auth-/RBAC-Schutz, Kids-/Youth-Regeln, serverseitige Domänenvalidierung, AI-Review-Blocker und vollständige Seed-/Übersetzungsberichte sind vorhanden.
- Qualitätsanalyse: Die Admin-Übersicht verbindet tatsächliche Übungsnutzung, Körperregion-/Hindernis-Coverage, Laufvolumen, Wiederholungswarnungen, erklärbare Zielgruppen-/Orts-Nulltreffer und Medienersatzgründe mit dem bestehenden Vollständigkeitsreview. Accessibility-Gates prüfen alle Kernrouten, 44px-Touch-Ziele, Light/Dark-Kontrast, reduzierte Bewegung, Formularfehler sowie Dialog-/Popover-Fokusverhalten.
- Interaktive Orientierung: Release 1.0 enthält eine routebewusste DE/EN-Tour für Dashboard, Kataloge, Administration, Übungserstellung, Hinderniszuordnung, Quick Create und Training Builder.

Pro Übung können unter anderem gepflegt werden:

- deutscher und englischer Name sowie Aliase
- Kategorie, Übungstyp und Bewegungsmuster
- primäre, sekundäre und antagonistische Muskelregionen
- benötigtes Equipment und Mengen
- Indoor-/Outdoor-Eignung
- Schwierigkeitsgrad, Zielgruppen und Altersgrenzen
- Setup, Startposition und Ausführungsschritte
- Coaching-Cues, typische Fehler und Korrekturen
- Sicherheits- und Aufsichtshinweise
- Level 1–3, Regressionen und Progressionen
- Dosierung nach Wiederholungen, Zeit, Strecke oder Runden
- Outdoor-Variante mit eigenem Ersatz-Equipment
- Bild- und Videomedien mit Review- und Rechteinformationen

Der Katalog kombiniert kuratierte OCRCraft-Seeds mit importierten Datensätzen. Importierte Inhalte werden normalisiert und bleiben über Quellen- und Provenienzdaten nachvollziehbar.

### Trainingsplanung

OCRCraft besitzt zwei zentrale Wege für die Trainingsplanung.

**Quick Create** erzeugt aus wenigen Angaben einen Trainingsentwurf. Berücksichtigt werden unter anderem:

- Zielgruppe und Alter
- Teilnehmerzahl
- Trainingsdauer
- Trainingsziele
- gewünschte Körperregionen
- Trainingsformat
- vorhandenes Equipment
- verfügbare Hindernisse
- Risiko- und Aufsichtsregeln

**Training Builder** dient zur detaillierten Bearbeitung. Dort können Trainer:

- Warm-up, Hauptteile und Cooldown getrennt planen
- mehrere Hauptteile kombinieren
- Übungen hinzufügen, ersetzen und sortieren
- Alternativen anzeigen
- Level und Belastung anpassen
- Team- und Partnerformate konfigurieren
- Stationskapazitäten berücksichtigen
- Equipment- und Hindernisbestände eintragen
- Trainingsabschnitte duplizieren oder zusammenführen
- Änderungen per Undo/Redo zurücknehmen
- Trainingsversionen speichern und wiederherstellen

Unterstützte Formate umfassen unter anderem Zirkel, Rig & Run, AMRAP, EMOM, Tabata, Technik, Relay sowie Run + Exercise.

### Outdoor- und Hallenplanung

OCRCraft unterscheidet portable, stationäre und nicht eindeutig klassifizierte Ausrüstung.

Für Outdoor-Training können Übungen eine eigene Variante besitzen. Dabei werden:

- das ursprüngliche Bewegungsmuster erhalten
- ausschließlich freigegebene Ersatz-Equipment-Mappings verwendet
- tatsächlich verfügbare Mengen berücksichtigt
- Studio-spezifische Abhängigkeiten nicht automatisch geraten
- offene oder mehrdeutige Fälle einem Trainerreview zugeführt

Die Outdoor-Administration enthält zusätzlich einen Portabilitäts-Audit mit den Zuständen:

- **portable**
- **converted**
- **blocked**

Zu jeder Entscheidung bleiben Quelle, Begründung, Ersatz-Equipment, Reviewstatus, Reviewer und Reviewdatum nachvollziehbar.

### OCR- und Vereinsfunktionen

OCRCraft bildet typische OCR-Anforderungen strukturiert ab, darunter:

- Grip- und Hang-Aufgaben
- Rig- und Traverse-Übungen
- Carries und Loads
- Walls und Step-over-Varianten
- Rope- und Net-Climbs
- Crawls
- Balance
- Running und Übergänge
- Hindernisprogressionen
- Sicherheits- und Fallzonen
- Stationskapazitäten
- Fallback-Übungen

Für OCRFRA können zusätzliche lokale Hindernisse, Maße und Vereinsregeln hinterlegt werden. Nicht bestätigte Werte sollen sichtbar offen bleiben und nicht stillschweigend als geprüft gelten.

### Gruppen, Zielgruppen und Schutzregeln

Gruppen und Zielgruppen können mit eigenen Regeln gepflegt werden. Besonders Kinder- und Jugendtraining besitzt harte Schutzgrenzen.

Berücksichtigt werden beispielsweise:

- Mindest- und Höchstalter
- zulässige Risikostufen
- notwendige Aufsicht
- gesperrte Hindernisse
- maximale Stationsanforderungen
- Trainerqualifikation
- Gruppen- und Teamgrößen
- Vereinsregeln

Sicherheitsregeln werden serverseitig validiert und können durch KI-Ausgaben nicht abgeschwächt werden.

### Spiele und Hindernisse

OCRCraft besitzt eigene Kataloge für Spiele und Hindernisse.

Hindernisse können mit Übungen verknüpft werden und besitzen unter anderem:

- Maße
- Aufbauhinweise
- Sicherheitszonen
- Voraussetzungen
- Annäherung und Ausstieg
- Fallbacks
- Risiko- und Aufsichtsanforderungen

Übungen können aus dem bestehenden Katalog als Hindernis übernommen und falsche Zuordnungen wieder entfernt werden.

### Medien und Bilder

Der Medienbereich verwaltet Bilder, Illustrationen und Videos getrennt von den Übungsdaten.

Unterstützt werden:

- lokale Uploads
- externe Referenzen
- KI-generierte Bilder
- Reviewstatus
- Primärmedien
- Lizenz- und Quelleninformationen
- Einwilligungsstatus
- Generierungsstatus
- Videoquellen

Externe Bilder ohne bestätigte Nutzungsfreigabe gelten nicht als verwendbare Übungsbilder. Sie erscheinen automatisch als Kandidaten für einen eigenen Ersatz.

Für KI-generierte Übungsbilder existiert eine eigene Pipeline mit stabilen Dateinamen, Reviewstatus und lokalem oder S3-kompatiblem Storage.

### KI-Provider

Mehrere KI-Provider können zentral verwaltet werden. Provider lassen sich Funktionen zuweisen und priorisieren.

Je nach Integration können konfiguriert werden:

- Provider-URL
- API-Schlüssel oder OAuth-Verbindung
- verfügbare Modelle
- Funktionszuordnung
- Priorität
- Limits
- Fallback auf den nächsten Provider

KI-gestützte Funktionen umfassen unter anderem Trainingsvorschläge, Bildgenerierung und Datenanreicherung. KI-Ausgaben werden vor Persistenz validiert.

### Hintergrundaufgaben

Längere Vorgänge laufen über eine persistente Aufgabenqueue.

Duplikat-Scans sowie Einzel- und Sammelentscheidungen werden als `duplicate_scan` bzw. `duplicate_resolve` eingeplant und im Adminbereich unter „Aufgabenqueue“ verfolgt.

Dazu zählen zum Beispiel:

- Trainingsgenerierung
- Bildgenerierung
- Datenanreicherung
- Medienverarbeitung

Ein globaler Statusbereich zeigt aktive Aufgaben. Die Detailansicht enthält Status, Fortschritt und Fehlerzustände.

### Suche und Filter

Die zentralen Kataloge verwenden ein gemeinsames Bedienmuster:

- URL-basierte Filter
- Suche
- Filter-Sidepanel
- Ergebniszähler
- Seitengröße
- Pagination
- Listen-, Klein-, Groß- und Detailansicht
- persistierte Ansichtspräferenz

Die Suchindizes unterstützen deutsche und englische Begriffe sowie Aliase.

### Benutzer, Rollen und Audit

OCRCraft besitzt eine eigene Benutzer- und Rollenverwaltung.

Standardrollen sind:

- Trainer
- Admin
- Super-Admin

Zusätzliche Rollen und Berechtigungen können erweitert werden. Administrative Aktionen werden über Audit-Events nachvollziehbar gehalten.

Trainerprofile können Name, Username, E-Mail, Ausbildung, Schwerpunkte, Kurzprofil und Profilbild enthalten.

### Backups, Import und Export

Die Datenhaltung basiert auf DuckDB.

Die Administration unterstützt:

- Datenbank-Backups
- Restore mit Sicherheitsbackup
- portable JSON-Exporte
- selektiven Export von Übungen, Trainings, Gruppen und Medien
- optional eingebettete Binärmedien
- validierten Import
- Quellen- und Prüfsummeninformationen

## Benutzeroberfläche

OCRCraft verwendet ein kompaktes eigenes UI-System auf Tailwind-Basis.

Wichtige Eigenschaften:

- Light-, Dark- und System-Theme
- responsive Desktop-, Tablet- und Mobile-Ansichten
- reduzierte Flächenverschwendung
- kompakte Karten und Filter
- zentrale Dialog-, Popover-, Sidebar- und Toast-Komponenten
- sichtbare Fokuszustände
- Tastaturbedienung
- semantische Statusfarben
- zugängliche Formulare und Dialoge

Ein routebewusstes Tutorial erklärt wichtige Arbeitsbereiche direkt in der Anwendung.
 Quick Create und Training Builder besitzen getrennte, tatsächlich erreichbare Schrittfolgen für Eingaben, Planungsgrenzen, Trainerreview und Speichern.
 Das Hindernis-Tutorial führt über Kandidatensuche, Risikoprüfung, Freizone/Kapazität und den abschließenden Trainerreview.

Die Tutorial-Grundlage deckt alle zentralen Arbeitsbereiche ab. Tiefenführungen reichen bei Medienrechten, Outdoor-Review, AI-Drafts, Gruppenregeln und Trainingsspeicherung bis zu den tatsächlichen Review-/Freigabeaktionen. Tutorial-Regression deckt Tastatur/Escape, Fokus-Rückgabe, reduzierte Bewegung, Mobile, Sprachwechsel und die Zielmarken der Kernworkflows per Playwright ab.
 Tutorial-Fortschritt wird pro Bereich lokal gespeichert; Führungen starten nur auf Benutzeraktion und weisen verständlich auf aktuell nicht sichtbare Zielmarken hin.

## Internationalisierung

Deutsch ist die Primärsprache. Die Anwendung besitzt eine typisierte DE/EN-Dictionary-Struktur und einen persistenten Sprachumschalter.

Neue UI-Texte sollen nicht lokal hart codiert, sondern über die gemeinsame Dictionary-Struktur geführt werden.

## Architektur

Die Anwendung folgt einer klaren Schichtenstruktur:

```text
src/
├─ app/          Next.js-Routen und Seitenkomposition
├─ components/   UI- und Feature-Komponenten
├─ domain/       frameworkfreie Domänenmodelle und Regeln
├─ server/       Services, Repositories, Suche, AI und DuckDB
└─ data/         Mapping- und Katalogdaten
```

Die zentrale Richtung lautet:

```text
UI → Service/Application → Repository → DuckDB
```

React-Komponenten greifen nicht direkt auf DuckDB zu. Externe Eingaben und KI-Ausgaben werden vor Speicherung validiert.

Ein CI-gestütztes Architektur-/Dependency-Gate prüft diese Schichtengrenzen, frameworkfreie Domain-Module, referenzierte Runtime-Abhängigkeiten sowie die Synchronität der dokumentierten Qualitätsbefehle.

## Technologie

- Next.js
- React
- TypeScript
- Tailwind CSS
- DuckDB
- Vitest
- Playwright
- OpenAI Images / konfigurierbare KI-Provider

## Entwicklung

Voraussetzungen:

- Node.js `>=20.19.0`
- npm
- Git LFS (für `data/ocrcraft.initial.duckdb`)

Installation:

```bash
npm install
npm run dev
```

Die lokale Anwendung läuft standardmäßig unter:

```text
http://localhost:3000
```

## Qualitätsprüfungen

`audit:maintainability` erzeugt zusätzlich eine repositoryweite Inventur für doppelte statische UI-Klassen, lokale Raw-Buttons und wahrscheinlich ungenutzte Exporte; die Inventur ist diagnostisch und wird in CI protokolliert.


Aktuellen Datenqualitäts-Snapshot (Bewegungsmuster, fehlende Bilder, Outdoor-Reviews, OCRFRA-Hindernisse) ausgeben:

```bash
npm run data:quality-snapshot
```


Die vollständige lokale Abschlussroutine lautet:

```bash
npm run check:ui
npm run check:architecture
npm run audit:maintainability
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```

## Übungsbilder

Prompt ohne API-Aufruf prüfen:

```bash
npm run exercise:image -- --exercise easy-jog --dry-run
```

Ein Bild erzeugen:

```bash
npm run exercise:image -- --exercise easy-jog
```

Seed-Bilder erzeugen:

```bash
npm run exercise:images:seed -- --all-seeds
```

Aktuelle Codex-Aufgaben für alle Übungen ohne verwendbares Bild exportieren:

```bash
npm run exercise:images:codex-tasks
npm run exercise:images:codex-tasks -- --batch=single-subject
npm run exercise:images:codex-tasks -- --batch=ocrfra-obstacles
npm run exercise:images:codex-tasks -- --batch=games-partner

# Batch direkt erzeugen – absichtlich sequenziell (1 Request gleichzeitig)
npm run exercise:images:seed -- --batch=single-subject
npm run exercise:images:seed -- --batch=ocrfra-obstacles
npm run exercise:images:seed -- --batch=games-partner

# Pending-Bilder für Codex-Review exportieren
npm run exercise:images:codex-review -- --batch=single-subject
npm run exercise:images:codex-review -- --batch=ocrfra-obstacles
npm run exercise:images:codex-review -- --batch=games-partner
```

Für P1-Batches läuft die Generierung absichtlich mit nur einer Bildanfrage gleichzeitig. Dadurch entsteht pro Aufgabe ein separates Asset statt einer Sammelgrafik; alle neuen Assets bleiben bis zur Biomechanik- und Text-Match-Prüfung im Status `pending`.

Der Export wird standardmäßig nach `artifacts/codex-image-tasks.json` geschrieben. Er enthält den Ersatzgrund, den stabilen Zieldateinamen und – sofern die strukturierten DE/EN-Übungsdaten vollständig sind – exakt den OCRCraft-Bildprompt. Übungen mit bereits laufendem Bildjob werden nicht erneut eingeplant. Admins können denselben Export im Medienkatalog direkt aus dem aktuellen Datenbankstand erzeugen. Für die P1-Bildabarbeitung stehen zusätzlich drei stabile Batches bereit: **Einzelperson** (17 Seed-Keys), **OCRFRA-Hindernisse** (11) und **Spiele/Partner** (14). Ein Batch exportiert nur Übungen, die im aktuellen Datenbankstand weiterhin ein Ersatzbild benötigen; bereits versorgte Seeds werden als übersprungene Keys dokumentiert.

Generierte Bilder liegen standardmäßig unter `public/generated/exercises/`.

## Importquellen

Vorhandene Importpfade umfassen unter anderem:

```bash
npm run exercise:import:hasaneyldrm
npm run exercise:translate:de
npm run exercise:import:exercisedb
```

Externe Instruktionstexte oder Medien werden nur übernommen, wenn die jeweilige Rechtefreigabe explizit bestätigt ist.

## Konfiguration

Wichtige optionale Umgebungsvariablen betreffen insbesondere:

- KI-Provider/API-Schlüssel
- S3-kompatiblen Bildspeicher
- Authentifizierung
- Backup-Retention
- externe Importquellen

API-Schlüssel und andere Secrets dürfen nicht committed werden.

## Weitere Dokumentation

- [Offene Vorhaben](./plan.md)
- Hilfezentrum direkt in der App unter `/help`
- [Betrieb und Backup](./docs/operations.md)
- [Designsystem](./docs/design-system.md)
- [UX-Konzept](./docs/ux-concept.md)
- [UI-Komponenten](./docs/ui-components.md)
- [OCR-Fähigkeitsmatrix](./docs/ocr-skill-matrix.md)
- [OCRFRA-Hindernisinventar](./docs/ocrfra-obstacle-inventory.md)
- [Katalog-Coverage](./docs/catalog-coverage-report.md)
- [Daten-Audit](./docs/data-audit-report.md)
- [Release Notes](./RELEASE_NOTES.md)

## Status und Version

Aktuelle Version: **1.0.0**

Änderungen zwischen Versionen, Datenbankentwicklungen und migrationsbezogene Hinweise gehören nicht in diese Übersicht, sondern in die [Release Notes](./RELEASE_NOTES.md).
