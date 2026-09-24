# OCRCraft

OCRCraft ist eine Trainings- und Kataloganwendung für OCR-Clubs, funktionelles Training und Breitensport. Die App unterstützt Trainer dabei, Übungen strukturiert zu pflegen, sichere Trainings zusammenzustellen, Gruppen und Zielgruppen zu berücksichtigen und Medien, Outdoor-Varianten sowie KI-gestützte Vorschläge kontrolliert zu verwalten.

Die fachliche Grundstruktur eines Trainings bleibt immer sichtbar:

**Aufwärmen → Hauptteil → Cooldown & Stretching**

OCRCraft ist als Trainerwerkzeug ausgelegt: Automatik und KI dürfen Vorschläge erzeugen, die endgültige Auswahl, Freigabe und Speicherung bleibt beim Trainer.

## Hauptfunktionen

### Übungskatalog

Der Übungskatalog ist die fachliche Basis der Anwendung. Übungen können gesucht, gefiltert, erstellt, bearbeitet, archiviert und wiederhergestellt werden.

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

Die Tutorial-Grundlage deckt alle zentralen Arbeitsbereiche ab; die konkrete fachliche Vertiefung einzelner Kernworkflows wird separat weiterentwickelt.

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

Die vollständige lokale Abschlussroutine lautet:

```bash
npm run check:ui
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
