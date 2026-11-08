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

### UI/UX-Review November 2026

Das [vollständige UI/UX-Review](./docs/ui-ux-review.md) bewertet alle 26 Page-Dateien und dokumentiert 12 priorisierte Folgearbeiten; UX-03 (Trennung von Blockern und Empfehlungen) und UX-12 (mobile Trainingsübersicht vor Verwaltungsfunktionen) sind umgesetzt. Responsive Prüfungen decken 99 Routen-/Breitenkombinationen ab. Gemeinsame Button-/Feldtypografie, Kontrast, Fokus, Auswahlkarten und Dialog-Schließen wurden konsolidiert; mobile Rollen- und Tablet-Benutzerverwaltung besitzen korrigierte Layouts. [Prüfbilder](./artifacts/ui-ux-review/README.md) und genaue Testergebnisse stehen im Review. Offene Maßnahmen bleiben in [plan.md](./plan.md).

### Abgeschlossene Release-1.0-Bausteine

Die abgeschlossenen Arbeitspakete aus [`plan.md`](./plan.md) sind als nutzbare Produktfunktionen umgesetzt:

- Deploybarer DuckDB-Initialstand mit automatisch erkanntem Migrationsbestand, reproduzierbarem Snapshot-Build, Bootstrap bei fehlender Datenbank und upgradefähigen Bestandsdaten.
- Kuratierter OCR-/OCRFRA-Katalog mit Provenienz, Quellenregister, strukturierten Bewegungsmustern, 16 OCR-Skills, lokalen Hindernismaßen sowie getrennten Review- und Freigabestatus.
- Portable Hallen-/Outdoor-Planung mit expliziter Equipment-Freigabeliste, deterministischer Sammelfreigabe und nachvollziehbar blockierten Maschinenfällen; 801 sichere Konvertierungen sind freigegeben.
- Lokale Medienverwaltung mit benannten Primärbildern, Codex-Batchimport, Duplikatschutz, 1536×1024-Regeneration bereits eindeutig zugeordneter Assets und FK-sicherem Wechsel des Hauptbilds.
- Gemeinsame Katalog-UX für Filter, Pagination, Ansichten und kritische Bestätigungen inklusive Escape-Unterstützung, Fokussetzung und Fokus-Rückgabe.
- Barrierearme Kernoberfläche mit semantischen Statusfarben, 44px-Touch-Zielen, Light/Dark-Kontrastprüfung, Reduced-Motion-Unterstützung und angekündigten Formularfehlern.
- Routebewusste interaktive Tutorials für Kataloge, Medienreview, Outdoor, AI-Drafts, Gruppen, Quick Create, Training Builder, Hilfezentrum und Administration mit lokalen Fortschrittsständen.
- Qualitätsanalyse für Nutzung, Katalog-Coverage, Laufvolumen, Wiederholungen, Nulltreffer, Vollständigkeit und Medienersatzgründe sowie echte Quick-Create-/Builder-/Kids-/Theme-Regressionen.
- Architektur- und Wartbarkeitsgates für Schichtengrenzen, Runtime-Abhängigkeiten, UI-Regressionsschutz, Datenqualität und ungenutzte Exporte.
- Zentrale Button-Varianten für wiederkehrende Bestätigungs-, Admin-, Planer- und Facet-Aktionen mit gemeinsamen Mindesthöhen, Fokus- und Disabled-Regeln; die Wartbarkeitsinventur wurde dadurch von 12 auf 6 Dateien mit verbleibenden spezialisierten Button-Controls reduziert.
- Trainingsdetail-Editor mit ausgerichteten Feldrastern, kontextuellen Feld-Hinweisen sowie sichtbaren, einheitlichen Aktionen für Eintrag bearbeiten, Übung ersetzen, Schnell-Alternativen und Entfernen in einer gemeinsamen responsiven Desktop-Zeile.
- Gemeinsame FormField-Hinweise als kompakte, tastaturfokussierbare Hover-/Fokus-Tooltips; Fehlermeldungen bleiben direkt am betroffenen Feld sichtbar.
- Erneut verifizierte Release-Abschlussroutine mit grünen UI-, Architektur-, TypeScript-, Unit-, Lint-, Build- und E2E-Gates; die aktuelle Playwright-Suite besteht aus 66 Tests.
- Kuratierte Seed-Batches als geprüfte Lieferpakete mit Migrationen, Quellenregister, Reviewstatus, Vollständigkeitsbericht sowie erfolgreicher TypeScript-, Lint-, UI-, Unit-, Build- und E2E-Prüfung; die aktuelle E2E-Suite umfasst 66 Tests.

Die noch offenen Punkte – darunter die fachliche Freigabe der 42 Pending-Bilder, vollständige Fachseiten-Übersetzungen und die verbleibende UI-Deduplizierung – stehen ausschließlich in [`plan.md`](./plan.md).

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

Der Medienbereich verwaltet Bilder, Illustrationen und Videos getrennt von den Übungsdaten. Für den offenen P1-Bildbacklog wurden 42 neue 1536×1024-Sequenzillustrationen erzeugt; sie bleiben bis zur fachlichen Prüfung `pending` und werden deshalb noch nicht in den deploybaren Initial-Snapshot übernommen.

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

Für P1-Batches läuft die Generierung absichtlich mit nur einer Bildanfrage gleichzeitig. Dadurch entsteht pro Aufgabe ein separates Asset statt einer Sammelgrafik; alle neuen Assets bleiben bis zur Biomechanik- und Text-Match-Prüfung im Status `pending`. Ein explizit angeforderter P1-Batch darf ein unfreigegebenes oder unbrauchbares Altmedium zur erneuten Erzeugung aufnehmen, überspringt aber immer freigegebene brauchbare Medien.

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

### Archivierte Planabschlüsse

Die erledigten Einträge wurden aus `plan.md` hierher verschoben. Zahlen in älteren Abschlussmeldungen beschreiben den jeweiligen damaligen Prüfstand.

- [x] Vollständiges UI/UX-Review über alle 26 Page-Dateien dokumentiert: [`docs/ui-ux-review.md`](./docs/ui-ux-review.md) enthält Routenbewertung, Browser-/Quellcode-Abdeckung, priorisierte Befunde und Abnahmekriterien. Responsive Browserprüfung bei 390/768/1440 px ergänzt.
- [x] Gemeinsame Accessibility-/Layoutkorrekturen umgesetzt: sichtbarer Button-Fokus, kontrastreiche Coral-Beschriftung in Light/Dark, Utility-Typografie ohne globales Überschreiben, gestapelte Auswahlkarten in Wizard/Builder, DE/EN-Dialog-Schließen und Fokus erst nach Portal-Mount.
- [x] Benutzeranlage auf ein responsives 2-/4-Spalten-Raster und gemeinsame Controls umgestellt; Tablet-Überlauf entfernt.
- [x] Mobile Rollen-/Rechtetabelle auf den verfügbaren Platz begrenzt; horizontaler Tabellenbereich per Tastatur erreichbar und Checkboxen nach Bereich/Rechtestufe beschriftet.
- [x] 31 identische lokale Feldklassen in neun Fachmodulen auf `formControlClass` umgestellt; Fokus-, Invalid- und Disabled-Verhalten folgen damit dem gemeinsamen Control-Standard.
- [x] Mobile Trainingsdetails beginnen mit einer haftenden DE/EN-Übersicht zu gespeicherter Zielgruppe/Alter, Plan-/Zieldauer und Phasenlinks; Übungen folgen direkt, Einstellungen/Versionen/Vorlagen sind nachrangig eingeklappt (UX-12). Fehlender Planungskontext wird ausdrücklich als nicht hinterlegt angezeigt.
- [x] Sicherheitsfehler und Empfehlungen in der Trainingsvorschau getrennt dargestellt (UX-03): roter Blockerstatus, getrennte Fehler-/Hinweiszähler inklusive Composer-Hinweisen, DE/EN-Beschriftungen und neutrale Erstellungsrückmeldung vor expliziter Trainerprüfung.
- [x] Trainingsdetail-Editor nach dem gemeinsamen UI-Muster ausgerichtet: Feldraster verwenden konsistentes Bottom-Alignment, kontextuelle Hinweise sind nur noch im Feld bzw. per Hover verfügbar und Bearbeiten/Ersetzen/Alternativen/Entfernen nutzen sichtbare Button-Varianten in einer gemeinsamen Desktop-Zeile statt gestapelter Vollbreiten-Balken.
- [x] Gemeinsame `FormField`-Hinweise konsolidiert: Hinweise erscheinen als kompakter, tastaturfokussierbarer Info-Marker mit Hover-/Fokus-Tooltip; Validierungsfehler bleiben direkt am Feld sichtbar.
- [x] Zentrale Button-Varianten auf wiederkehrende Bestätigungs-, Admin-, Planer- und Facet-Aktionen übertragen; `buttonClass` vereinheitlicht dabei Mindesthöhe, Fokus, Disabled-Zustand und semantische Varianten. Das Maintainability-Audit sank dadurch von 12 auf 6 Dateien mit verbleibenden lokalen Button-Controls.
- [x] Release-Abschlussroutine nach der Wartbarkeitsrunde erneut vollständig ausgeführt: UI-, Architektur-, TypeScript-, Unit-, Lint-, Build- und E2E-Gates sind grün; die E2E-Suite umfasst 66 bestandene Tests.

- [x] Quick Create sichert Planungseingaben versioniert auf diesem Gerät, bietet explizites Wiederherstellen/Verwerfen und DE/EN-Sicherungszustände, verwirft inkompatible lokale Daten und löscht die Sicherung nach explizitem Trainingsspeichern. Erzeugte Vorschläge und Freigaben werden nicht aus dem Browser-Cache übernommen. Builder-/Quick-Planner- und Vorschlagswiederherstellung bleiben in `plan.md` offen.

- [x] Eingabewiederherstellung auf Builder und Quick Planner übertragen: gemeinsame Snapshot-/Schema-Grenze, Hook und DE/EN-Restore-/Discard-Anzeige mit Quick Create; Builder-Sicherungen pro Ursprungstraining und Einstiegsmodus getrennt. Programmierung und explizite Hindernisgrenzen bleiben erhalten; neue Vorschläge müssen erneut erzeugt und geprüft werden. Erzeugte/bearbeitete Vorschläge bleiben als eigener Planpunkt offen.

### Basiskatalog und Startup-Audit

Der [Katalog-/Gelände-/Methodik-Review](./docs/catalog-startup-review.md) dokumentiert das vollständige Inventar, Metadaten- und Medienlücken sowie den Vereinskontext (Feld, Hindernisse, 40 × 20 m Kunstrasen, 400-m-Laufbahn). `npm run data:audit-startup` erzeugt einen read-only Bestandsaudit. Der Startup-Exporter bereinigt Deployment-Credentials, baut über Staging und erhält bei Fehlern den bisherigen Snapshot. Die technische Bereinigung ersetzt die noch offene fachliche Einzelfreigabe des Katalogs und seiner Bilder nicht.

- [x] Automatische Planung verwendet eine gemeinsame Mindest-Metadatenprüfung für KI und Offline: fehlendes Mindestalter, unbekannte Eignung, Risiko/Kapazität sowie leere Ziele/Bewegungsmuster werden zurückgewiesen. 187 aktive Einträge des aktuellen Startkatalogs bestehen diese Prüfung für gemischte Zielgruppe/Orte (DE-Kapazität); übrige Einträge bleiben zur Bearbeitung im Katalog. Die Prüfung ist keine fachliche Einzelfreigabe.

- [x] Seed-Reviewanzeige korrigiert: versionierte Revieweinträge, automatisch nachgetragene Kompatibilitätslabels, Nachbearbeitung/unklare Nachweise und fehlende Einträge werden getrennt gezählt und auf DE/EN erklärt. Die Administration setzt sie nicht mehr pauschal mit bestandenem Fachreview gleich.

- [x] Erste visuelle Einzelpersonen-Bildprüfung dokumentiert: [17 datei-/promptgebundene Befunde](./docs/reviews/image-review-single-subject-2026-11-08.md), davon 10 mit Änderungsbedarf und 7 mit weiterer Trainerprüfung. Gemeinsame Medienpfade/Promptabweichungen aufgedeckt; keine automatische Freigabe. Korrekturen und weitere Medienreviews bleiben in `plan.md` offen.

- [x] Ersten visuellen Durchgang aller drei P1-Bildbatches abgeschlossen: [42 datei-/promptgebundene Reviews](./docs/reviews/README.md), davon 27 mit Änderungsbedarf und 15 mit weiterer Trainerprüfung. Hindernisgeometrien, Spielregeln und gemeinsame Dateireferenzen dokumentiert; Korrekturen, formale Freigabe und übrige Katalogmedien bleiben offen.

- [x] Medienbytes gegen Überschreiben durch wiederholte/parallele Generierung und Paketimport geschützt; S3-Schreibzugriffe sind bedingt. Read-only Startup-Audit um Datei-Hashvergleich und gemeinsame Dateireferenzen erweitert: Initial-Snapshot ohne Integritätsfehler, Arbeitsbestand mit 42 gemeinsamen Dateigruppen und 42 Pending-Hashabweichungen. Altzuordnungen bleiben zur referenzsicheren Klärung offen.

- [x] 42 technisch veraltete, nicht primäre Pending-Bildkandidaten nach Preview und erfolgreicher Kopie-Probe mit Checkpoint-Backup als `rejected` ausgesondert. Originalhashes, Dateien, überlebende Kandidaten, Trainings-/Jobreferenzen und Nutzer unverändert; 42 technische Audit-Einträge. [Abschlussnachweis](./docs/reviews/media-retirement-2026-11-08.json). Erneuter Preview: 0 Kandidaten; keine Hashabweichungen oder gemeinsamen Pfade unter nicht verworfenen Medien. Verworfene Medien sind im Übungseditor nicht mehr auswählbar und werden serverseitig als Primärmedium abgewiesen.

- [x] Vier versionierte Vereinsgeländeprofile in Quick Create, Builder und Quickplaner integriert: großes Feld, Hindernisbereich, 40 × 20 m Kunstrasen und Feld mit 400-m-Laufbahn. Auswahl ist DE/EN, wiederherstellbar und Teil der Generierungs-/Speicherparameter; KI erhält Fakten und ausdrücklich unbekannte Nutzfläche/Abstände/Bestände. Beide Wege sowie Ersetzen/Regeneration filtern bei Geländewahl Outdoor. Automatisches Run + Exercise verwendet auf der bekannten Laufbahn 400 m, sonst einen unbemaßten Checkpoint statt erfundener 500 m; explizite Trainerprogrammierung bleibt erhalten. Vor-Ort-Maße/-Bestände, Oberflächenfreigaben und vollständige Laufvolumen-/Zeitvalidierung bleiben offen.

- [x] Globale Formularvalidierung erhält vorhandene `aria-describedby`-Hilfetexte bei normalen Feldänderungen. Native Fehlermeldungen werden feldbezogen zugeordnet; Korrektur entfernt nur den eigenen Fehler und dessen Beschreibungs-ID, nicht bestehende Feldhilfe.
