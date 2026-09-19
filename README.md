# OCRCraft

OCRCraft ist ein deutschsprachiger Trainingsplaner für OCR-Clubs, funktionelles Training und Breitensport. Trainer können sichere Einheiten aus einem strukturierten Übungskatalog zusammenstellen, bestehende Einheiten bearbeiten/kombinieren und Vorschläge lokal oder optional mit KI erzeugen.

Die Kernstruktur bleibt sichtbar: **Aufwärmen → Hauptteil → Cooldown & Stretching**.

## Status

Die produktive Grundlage steht auf `main`. Der Katalog wird dynamisch aus versionierten Seeds und importierten Datensätzen aufgebaut. Übungen besitzen deutsche und englische Identität, Aliase, Körperregionen, Muskel- und Gegenmuskelbeziehungen, Equipment, Bewegungsmuster, Zielgruppen-, Risiko- und Coachingdaten.

Der verbleibende Fahrplan steht kompakt in [`plan.md`](./plan.md). Abgeschlossene Meilensteine sind unten zusammengefasst; die produktive Betriebsroutine ist in [`docs/operations.md`](./docs/operations.md) dokumentiert.

## Umgesetzte Meilensteine

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
- versionierte OCRCraft-Trainingsvorlagen mit Zielgruppen-/Schwerpunktfiltern und Provenienz
- Vorlagenauswahl direkt im Quick-Create-Wizard; Vorlagen setzen editierbare Startwerte und bleiben beim Speichern nachvollziehbar
- datengetriebene Trainingsübersicht mit aktuellen Einheiten, Empty State und realen Status-/Dauermetriken statt Demo-Training

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

Trainerprofile lassen sich im eigenen Tab „Benutzer & Profile“ mit Filter, Vorname, Nachname, Username, E-Mail, Ausbildung, Schwerpunkten, Kurzprofil und Bildreferenz pflegen; bestehende Profile werden auf einer eigenen Bearbeitungsseite aktualisiert. Bei neu erstellten Trainings wird das Profil kompakt in der Trainer- und Readonly-Ansicht angezeigt.
Profilbilder können als JPEG, PNG oder WebP bis 2 MB hochgeladen und in DuckDB gespeichert werden. Fehlt ein Bild, erscheinen automatisch die Initialen aus Vor- und Nachnamen.

### Administration

Administration und Einstellungen liegen in einem gemeinsamen Bereich mit sieben Tabs: Übersicht, Datenbank, Datenqualität, Aufgabenqueue, Benutzer & Profile, Einstellungen und Outdoor-Varianten. Outdoor-Varianten sind zusätzlich direkt über den Hauptmenüpunkt „Outdoor“ erreichbar.

Im Datenbank-Tab können Übungen, Details, Zuordnungen, Trainings, Gruppen, Medien und Provenienz selektiv als versioniertes JSON exportiert werden. `ocrcraft-portable`-Dateien werden vor dem transaktionalen Import auf Schema, erlaubte Tabellen und Spalten geprüft; der Import ist auf Super-Admins begrenzt.

Beim Medienexport können Binärdateien optional als Base64 eingebettet werden. Der Export ergänzt MIME-Typ, SHA-256-Prüfsumme sowie Speicher- und Quellenmetadaten; standardmäßig bleiben Binärdaten aus Platzgründen außen vor.

Übungskarten verwenden für nicht erreichbare externe Quellen (einschließlich veralteter `static.exercisedb.dev`-GIFs) automatisch eine lokale Platzhaltergrafik. Dadurch bleiben Listen, Detailansichten und Layouts stabil sichtbar, bis eine geprüfte lokale oder KI-generierte Medienquelle hinterlegt ist.

Der Tab **Datenqualität** klassifiziert erkannte Übungspaare als gleich, wahrscheinliche Dublette, Konflikt oder neu. Side-by-Side-Feldvergleich und Bulk-Entscheidungen bleiben trainerbestätigt; Datensätze werden nicht automatisch gelöscht.

Trainings können auf der Detailseite als Version-Snapshot gespeichert und mit einer Admin-Rolle wiederhergestellt werden. Die Wiederherstellung ersetzt Training, Phasen und Items innerhalb einer Transaktion.

### UI/UX

- Light-, Dark- und System-Theme mit semantischen Tokens
- responsive Traineroberflächen für Desktop, Tablet und mobile Nutzung
- gemeinsames Bedienkonzept für Kataloge: Filter-Sidepanel, Suche, Größenwahl, Ergebniszähler und Pagination sind für Übungen, Training, Spiele, Hindernisse, Medien, AI-Entwürfe, Gruppen, Vorlagen und Outdoor vereinheitlicht
- einklappbare Hauptnavigation mit persistiertem Icon-Modus sowie wiederverwendbare Sidepanel-Filter in Übungs-, Medien- und Hinderniskatalog
- zentrale Dialog-Komponente mit ARIA-Rolle, Fokusfalle, Escape, Backdrop-Schließen, Scroll-Lock und Fokus-Rückgabe
- AppShell hält den Seitenkopf auf kontextbezogene Seitenaktionen begrenzt; Darstellung und Diagnose liegen im gemeinsamen Einstellungen-Tab der Administration
- große Muskel- und Facettenfilter öffnen als zentrierte Dialoge und halten die Sidepanels kompakt
- zentrale Disclosure-Komponente für Filter, Editoren, Builder und Adminflächen
- sichtbare Fokuszustände und Tastaturbedienung für zentrale Auswahl- und Formularpfade
- gemeinsames Ansichts-Pattern für Training und Vorlagen mit Liste/Klein/Groß/Detail und persistierter Auswahl
- gemeinsame Ansichtsumschaltung und responsive Ergebnisdichte für Spiele, Hindernisse, Medien, Gruppen, AI-Entwürfe und Outdoor-Varianten
- gemeinsame Ansichtsumschaltung mit echter Liste/Klein/Groß/Detail-Geometrie, persistierter Auswahl und begrenzten Kartenbreiten über alle Katalogseiten
- Playwright-Quality-Gates für Seiten-Shell, genau eine Hauptüberschrift/Main-Landmark, horizontale Überläufe auf Desktop/Mobil, gemeinsame Listenansicht, Hindernis-Filter-Nesting, Quick-Create-Vorlagenauswahl, Kids-Review und Builder-Sicherheitsgrenzen
- gemeinsame serverseitige Ergebniszähler- und Pagination-Komponenten für Übungen und Spiele mit responsiver Seitennavigation
- Spielekatalog mit gemeinsamem Filter-Sidepanel, URL-basiertem Such-/Status-/Seitengrößenfilter und Reset-Zustand
- Gruppenkatalog mit gemeinsamem Filter-Sidepanel, URL-basierter Namenssuche, Zielgruppenfilter und getrenntem Erstellungsdialog
- AI-Entwürfe und Outdoor-Review mit gemeinsamen URL-basierten Such-/Statusfiltern und kompakten Reset-Zuständen
- Medienkatalog mit gemeinsamem Ergebniszähler sowie URL-basierten Review-, Generierungs-, Quellen- und Medientypfiltern
- Vorlagenkatalog mit kompaktem gemeinsamem Filterpanel für Zielgruppe und Schwerpunkt, getrennt vom Vereinsvorlagenbereich

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
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
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
OCRCRAFT_IMAGE_PUBLIC_BASE_URL=https://...
OCRCRAFT_S3_REGION=...
OCRCRAFT_IMAGE_PREFIX=exercise-images
OCRCRAFT_S3_SSE=AES256
```

Im Produktionsbetrieb validiert OCRCraft S3-Endpunkt und öffentliche Auslieferungs-URL auf HTTPS. Optional sind `aws:kms` plus `OCRCRAFT_S3_KMS_KEY_ID`, ein eigener Cache-Control-Wert und Path-Style für MinIO/R2-kompatible Systeme möglich. Details stehen in `docs/operations.md`.

Die Bilder bleiben zur Trainerprüfung auf `pending`. Für eine Wiederherstellung müssen DuckDB-Datei und Bildverzeichnis gemeinsam gesichert werden.

## Import und Katalogquellen

Verfügbare Import-/Übersetzungsskripte:

```bash
npm run exercise:import:hasaneyldrm
npm run exercise:translate:de
npm run exercise:import:exercisedb
```

Importierte Datensätze werden normalisiert, mit stabilen Quellen-/Seed-Informationen versehen und gegen vorhandene Übungsnamen geprüft. Unsichere Dubletten bleiben zur Prüfung sichtbar.

Externe Instruktionstexte und Medien werden standardmäßig **nicht** übernommen, solange für den Datensatz kein expliziter und geprüft bestätigter Lizenz-/Rechtenachweis vorliegt. Beim ExerciseDB-Import kann ein Betreiber nach eigener Rechteprüfung beides bewusst freischalten:

```text
OCRCRAFT_EXERCISEDB_LICENSE_LABEL=<geprüfter Lizenz-/Rechtenachweis>
OCRCRAFT_EXERCISEDB_LICENSE_VERIFIED=1
```

Ohne diese Bestätigung speichert OCRCraft nur Quellen-/Katalogmetadaten und erzeugt eigene neutrale Review-Hinweise; externe Medien werden nicht angelegt.

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
