# OCRCraft

OCRCraft ist ein deutschsprachiger Trainingsplaner für OCR-Clubs, funktionelles Training und Breitensport. Trainer können sichere Einheiten aus einem strukturierten Übungskatalog zusammenstellen, bestehende Einheiten bearbeiten/kombinieren und Vorschläge lokal oder optional mit KI erzeugen.

Die Kernstruktur bleibt sichtbar: **Aufwärmen → Hauptteil → Cooldown & Stretching**.

## Status

Die produktive Grundlage steht auf `main`. Der Katalog wird dynamisch aus versionierten Seeds und importierten Datensätzen aufgebaut. Übungen besitzen deutsche und englische Identität, Aliase, Körperregionen, Muskel- und Gegenmuskelbeziehungen, Equipment, Bewegungsmuster, Zielgruppen-, Risiko- und Coachingdaten.

Der verbleibende Fahrplan steht kompakt in [`plan.md`](./plan.md). Er trennt Betriebs- und Datensicherheit, Trainer-Workflow, Katalog/Medien und Ausbau klar voneinander. Die produktive Betriebsroutine ist in [`docs/operations.md`](./docs/operations.md) dokumentiert.

## Funktionen

### Übungen und Muskelkarte

- Übungsübersicht mit Suche, Facetten, Bereichs- und Muskel-Mehrfachfilter
- Admin-Vollständigkeitsbericht mit getrennten Kennzahlen für versionierte Seeds und den gesamten (inklusive importierten) Katalog
- entfernbare Filter-Tags und zugängliche Listenalternative zur visuellen Karte
- wiederverwendbare Front-/Rückseiten-Muskelkarte mit 89 granularen Regionen
- primäre, sekundäre und antagonistische Muskelbeziehungen
- Übung anlegen, bearbeiten, archivieren, wiederherstellen und auf Vollständigkeit prüfen
- strukturierte Ausführung: Setup, Startposition, Schritte, Coaching, Fehler, Sicherheit, Level 1–3 und Dosierung

### Training erstellen

- Quick Create mit Zielgruppe, Alter, Teilnehmerzahl, Dauer, Zielen, Körperregionen und Formaten
- lokaler deterministischer Composer mit Alters-, Risiko-, Club-, Equipment-, Hindernis- und Kapazitätsregeln
- optionaler AI-Pfad mit denselben serverseitigen Validierungen
- Training Builder für Warm-up, mehrere Hauptteile und Cooldown
- Zirkel, Rig & Run, AMRAP, EMOM, Tabata, Technik, Relay und Run + Exercise
- Teamgröße, Rotationsgruppen, Stationskapazität, Equipmentbestand und Hindernisbestand
- Level-Auswahl, Übung ersetzen, Alternativen, Reihenfolge ändern, Duplicate und Combine

### Daten und Medien

- DuckDB über zentrale serverseitige Verbindungen und versionierte Migrationen
- lock-gesicherte Datenbank-Backups unter `data/backups/` mit JSON-Manifest und konfigurierbarer Rotation über `OCRCRAFT_BACKUP_RETENTION`; bestätigter Restore erstellt vorher automatisch ein Sicherheitsbackup
- FTS-Status (`healthy`, `dirty`, `rebuilding`, `failed`) und zweisprachige Suchdokumente
- Admin-Aktion zum Neuaufbau der deutschen und englischen Suchindizes mit Fortschritts- und Fehlerstatus
- Audit-Events für Reset-, Backup- und Dublettenaktionen
- externe Quellen-, Lizenz- und Generierungsmetadaten
- OpenAI-Images-Pipeline mit `gpt-image-2`, Dry Run, stabilen Seed-Dateinamen, Reviewstatus und Dateisystem/S3-Abstraktion
- Medienwarteschlange mit dedupliziertem Worker und periodischer Statusaktualisierung ohne wiederholte Request-Callbacks
- generierte Bilder bleiben an stabile Übungs-/Seed-IDs gebunden und werden bei Reseeds nicht automatisch gelöscht

Für den privaten Vereinsbetrieb kann die lokale Bootstrap-Identität verwendet werden. Im Adminbereich lassen sich Benutzer und Rollen verwalten; der klassische Login verwendet E-Mail als Benutzernamen und ein individuelles Passwort (Hash wird in DuckDB gespeichert). `OCRCRAFT_LOGIN_CODE` ist nur ein optionaler gemeinsamer Fallback für die Ersteinrichtung. Mit `OCRCRAFT_AUTH_REQUIRED=1` müssen globale Admin-Aktionen einem aktiven Benutzer mit passender Rolle zugeordnet sein. Die Rollen `trainer`, `admin` und `super_admin` werden in DuckDB persistiert. Ein vorgeschalteter Vereins-Login kann alternativ einen fünf Minuten gültigen HMAC-Header übergeben: `OCRCRAFT_ACTOR_ASSERTION_SECRET=<secret>` und optional `OCRCRAFT_ACTOR_ASSERTION_HEADER=<header-name>` (Standard: `x-ocrcraft-actor`). Der Headerwert ist `email|unixSeconds|hexSignature`; signiert wird `email|unixSeconds` mit HMAC-SHA256. Das Secret bleibt ausschließlich in der Prozessumgebung.

Trainings können über `/training/<id>/trainer` als schreibgeschützte Ansicht ohne Login geteilt werden. Diese Ansicht enthält keine Bearbeitungsaktionen.

Trainerprofile lassen sich im Adminbereich mit Anzeigename, Ausbildung, Schwerpunkten, Kurzprofil und Bildreferenz pflegen. Bei neu erstellten Trainings wird das Profil kompakt in der Trainer- und Readonly-Ansicht angezeigt.
Profilbilder können als JPEG, PNG oder WebP bis 2 MB hochgeladen und in DuckDB gespeichert werden. Fehlt ein Bild, erscheinen automatisch die Initialen aus Vor- und Nachnamen.

### Administration

Administration und Einstellungen liegen in einem gemeinsamen Bereich mit vier Tabs: Übersicht, Datenbank, Datenqualität und Einstellungen. Dort sind Seed-Vollständigkeit, Dublettenprüfung, DuckDB-/FTS-Status, der bestätigungspflichtige Datenbank-Reset und das optionale Muskelkarten-Debugging getrennt erreichbar.

Im Datenbank-Tab können Übungen, Details, Zuordnungen, Trainings, Gruppen, Medien und Provenienz selektiv als versioniertes JSON exportiert werden. `ocrcraft-portable`-Dateien werden vor dem transaktionalen Import auf Schema, erlaubte Tabellen und Spalten geprüft; der Import ist auf Super-Admins begrenzt.

Der Tab **Datenqualität** klassifiziert erkannte Übungspaare als gleich, wahrscheinliche Dublette, Konflikt oder neu. Side-by-Side-Feldvergleich und Bulk-Entscheidungen bleiben trainerbestätigt; Datensätze werden nicht automatisch gelöscht.

Trainings können auf der Detailseite als Version-Snapshot gespeichert und mit einer Admin-Rolle wiederhergestellt werden. Die Wiederherstellung ersetzt Training, Phasen und Items innerhalb einer Transaktion.

### UI/UX

- Light-, Dark- und System-Theme mit semantischen Tokens
- responsive Traineroberflächen für Desktop, Tablet und mobile Nutzung
- einklappbare Hauptnavigation mit persistiertem Icon-Modus sowie wiederverwendbare Sidepanel-Filter in Übungs-, Medien- und Hinderniskatalog
- zentrale Dialog-Komponente mit ARIA-Rolle, Fokusfalle, Escape, Backdrop-Schließen, Scroll-Lock und Fokus-Rückgabe
- AppShell hält den Seitenkopf auf kontextbezogene Seitenaktionen begrenzt; Darstellung und Diagnose liegen im gemeinsamen Einstellungen-Tab der Administration
- große Muskel- und Facettenfilter öffnen als zentrierte Dialoge und halten die Sidepanels kompakt
- zentrale Disclosure-Komponente für Filter, Editoren, Builder und Adminflächen
- sichtbare Fokuszustände und Tastaturbedienung für zentrale Auswahl- und Formularpfade

## Voraussetzungen

- Node.js `>=20.19.0`
- npm
- DuckDB wird lokal als Datei unter `data/` erzeugt
- Für Bildgenerierung: `OPENAI_API_KEY` in `.env` oder der Prozessumgebung

API-Schlüssel niemals committen. Lokale Daten, WAL-Dateien und erzeugte Bilder gehören in Backups und bleiben außerhalb der Versionskontrolle.

## Installation und Entwicklung

```bash
npm install
npm run dev
```

Die Anwendung läuft danach unter <http://localhost:3000>.

### Qualitätsprüfungen

Die CI wird sequenziell ausgeführt:

```bash
npm run typecheck
npm test -- --run
npm run lint
npm run build
```

## Übungsbilder

Prompt prüfen, ohne API-Aufruf oder Datei zu schreiben:

```bash
npm run exercise:image -- --exercise easy-jog --dry-run
```

Einzelbild erzeugen:

```bash
npm run exercise:image -- --exercise easy-jog
```

Seed-Bilder erzeugen:

```bash
npm run exercise:images:seed -- --all-seeds
```

Standardmäßig landen Bilder unter `public/generated/exercises/`. Für S3-kompatiblen Speicher:

```text
OCRCRAFT_IMAGE_STORAGE=s3
OCRCRAFT_IMAGE_BUCKET=...
OCRCRAFT_S3_ENDPOINT=...
OCRCRAFT_IMAGE_PUBLIC_BASE_URL=...
```

Die Bilder bleiben zur Trainerprüfung auf `pending`. Für eine Wiederherstellung müssen DuckDB-Datei und Bildverzeichnis gemeinsam gesichert werden.

## Import und Katalogquellen

Verfügbare Import-/Übersetzungsskripte:

```bash
npm run exercise:import:hasaneyldrm
npm run exercise:translate:de
npm run exercise:import:exercisedb
```

Importierte Datensätze werden normalisiert, mit stabilen Quellen-/Seed-Informationen versehen und gegen vorhandene Übungsnamen geprüft. Unsichere Dubletten bleiben zur Prüfung sichtbar.

## Architektur

```text
src/
├─ app/                 Next.js-Routen und Komposition
├─ components/          wiederverwendbare UI- und Feature-Komponenten
├─ domain/              frameworkfreie Trainingsmodelle und Regeln
├─ server/              Services, Repositories, Suche, AI und DuckDB
└─ data/                versionierte Katalog-/Mappingdaten
```

React-Komponenten greifen nicht direkt auf DuckDB zu. Server-Services validieren externe Eingaben und persistieren nur strukturierte, geprüfte Daten. AI-Ausgaben gelten als untrusted, bis Schema- und Domänenregeln erfolgreich durchlaufen wurden.

Weitere Arbeitsregeln stehen in [`AGENTS.md`](./AGENTS.md). Die projektinternen Skills liegen unter:

- [`skills/typescript-app-engineer/SKILL.md`](./skills/typescript-app-engineer/SKILL.md)
- [`skills/ui-ux-designer/SKILL.md`](./skills/ui-ux-designer/SKILL.md)
- [`skills/ocr-training-expert/SKILL.md`](./skills/ocr-training-expert/SKILL.md)

## Fachliche Leitlinien

OCRCraft orientiert sich an zielgruppenorientierter Breitensportplanung und ergänzt diese um konfigurierbare OCR-Regeln für Grip, Carry, Running, Rig, Walls, Balance und Hindernisprogression. Kinder- und Jugendregeln sowie Vereinsregeln werden als harte Einschränkungen behandelt. Die Anwendung ersetzt keine medizinische Diagnose.
