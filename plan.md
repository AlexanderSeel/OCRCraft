# OCRCraft – Implementierungsplan

> Primärsprache: Deutsch · Sekundärsprache: Englisch
> Stack: Next.js/React, TypeScript, Tailwind CSS, DuckDB/FTS

## Zweck und Arbeitsregeln

OCRCraft hilft Trainern, sichere OCR- und Breitensport-Einheiten schnell zu planen, anzupassen und wiederzuverwenden. Jede Änderung muss die Trennung `UI → Anwendung/Service → Repository → DuckDB` erhalten. KI schlägt vor; der Trainer prüft und speichert.

Die Kernstruktur jeder Einheit bleibt sichtbar:

1. Aufwärmen
2. Hauptteil
3. Cooldown & Stretching

## Prioritäten

- **P0 – Betriebssicherheit und Daten:** Datenbank, Authentifizierung, Import/Export, Backups und Schutz globaler Mutationen.
- **P1 – Trainer-Workflow:** Übungsdaten vervollständigen, Editor-Versionen, Suche, Vorlagen und responsive Traineransicht.
- **P2 – Katalog und Medien:** weitere Übungskohorten, Dubletten, Vorlagenquellen, Medienverwaltung und Bildprüfung.
- **P3 – Ausbau:** Internationalisierung, Analysen, E2E-Abdeckung und optionale Trainingsformate.

## P0 – offen

### Identität und Betrieb

- [x] Authentifizierung einführen (signierte, kurzlebige Actor-Assertions aus einem vorgeschalteten Vereins-Login; lokale Bootstrap-/Umgebungsidentität bleibt verfügbar).
- [x] RBAC für Trainer, Admin und Super-Admin einführen.
- [x] Globale Admin-Mutationen serverseitig autorisieren.
- [x] Produktions-Deployment und Betriebsdokumentation ergänzen.
- [x] Benutzer und Rollen persistieren; externe Anmeldung kann per Actor-Konfiguration erzwungen werden.
- [x] Audit-Events für zentrale Admin-/Datenbankaktionen persistieren.

### Datenbank und portable Daten

- [x] Training-Versionen mit Snapshot und geschützter Wiederherstellung.
- [x] Lock-gesichertes DuckDB-Backup mit Zeitstempel und Manifest.
- [x] DuckDB-Restore mit Sicherheitsbackup und sichere Multi-Process-Betriebsanleitung.
- [x] Konfigurierbare Backup-Rotation und Anzeige der vorhandenen Backups im Adminbereich.
- [x] Selektierbaren, versionierten JSON-Export implementieren.
- [x] Exportoptionen für Übungen, Details, Mapping, Trainings, Gruppen, Medien und Provenienz anbieten.
- [x] Optional Binärmedien mit MIME-Typ, Prüfsumme und Quellenmetadaten exportieren.
- [x] Import-Preflight, Schema-Version und transaktionalen Schreibvorgang für erlaubte portable Tabellen implementieren.
- [x] Dublettenklassifikation (`same`, `new`, `probable duplicate`, `conflict`) und Side-by-Side-Vergleich für Importkonflikte abschließen.
- [x] Konfliktbewusste Feldübernahme im Bulk vollständig abdecken (Merge übernimmt fehlende Übersetzungen, Zuordnungen, Medien und Referenzen; vorhandene Werte der behaltenen Übung bleiben erhalten).
- [x] Konfliktauflösungstests ergänzen (Auswahlvalidierung und Portable-Medien-Round-trip sind abgedeckt).

## P1 – Trainer-Workflow

### Übungskatalog

- [ ] Katalog über alle Übungen hinaus mit kuratierten Lücken erweitern.
- [ ] Zusätzliche deutsche/englische Aliase und Trainerbegriffe für alle Seeds kuratieren.
- [ ] Fachliche Einzelprüfung und Anreicherung aller verbleibenden Seeds abschließen.
- [ ] Weitere Katalogkohorten versioniert, zweisprachig und mit Detail-/Sicherheits-Gates aufnehmen.
- [x] Zusätzliche Kategorien und Facetten editierbar machen.
- [x] Progressionen/Regressionen als Katalogverwaltung mit Editor und geschützter Archivierung ausbauen.
- [ ] Geschützte Hard-Delete-Regeln implementieren.
- [x] Dublettenprüfung, Bulk-Edit und Import/Export im Admin abschließen.

### Suche und Planung

- [ ] Konfigurierbare Gewichte für strukturierte Suchfelder anbieten.
- [x] Autocomplete aus Übungs-, Trainingsziel-, Equipment-, Tag-, Bewegungsmuster- und Körperregionsdaten ergänzen.
- [ ] Suchprofile und Feldgewichte konfigurierbar machen.
- [ ] Favoriten und „zuletzt verwendet“ ergänzen.
- [x] Authentifizierte DE/EN-FTS-Rebuild-Aktionen bereitstellen.
- [ ] Partner-Workout und weitere offene Formatregeln ergänzen.
- [ ] Intervall-/Runden-/Ladder-/Pyramid-/Chipper-/Partner-Regeln vollständig ausbauen.
- [ ] Laufregeln wie „alle X Meter/Minuten/Checkpoint“ und Arbeits-/Pausenarithmetik vervollständigen.

### Training Editor und Gruppen

- [x] Version History/Restore für Trainings.
- [x] Trainingsvorlagen erstellen, speichern und wiederverwenden: bestehende Trainings können als persistierte Vereins-Snapshots mit konkreter Übungsauswahl, Hauptteilprogrammierung und Teamorganisation gespeichert, im Vorlagenkatalog erneut instanziiert und archiviert werden; vor Wiederverwendung werden alle Übungsreferenzen gegen den aktiven Katalog validiert.
- [ ] Gruppen-Splits, Stationskapazität und Vereinsdefaults weiter ausbauen.
- [ ] Kids/Youth/Beginner/Advanced/Competition/Running/Open-Presets ergänzen.
- [ ] Club-Regelprofile, Standort-/Equipmentdefaults und Skill-Verteilung ergänzen.

### UI/UX und Zugänglichkeit

- [ ] Kontrast und Lesbarkeit in Hell-/Dunkelmodus auf allen Seiten prüfen.
- [ ] Gemeinsames erweitertes Form-Kit für Labels, Hilfe, Fehler, Felder und Actions.
- [ ] Toast-/Feedbacksystem mit Loading-, Erfolg- und Fehlerzuständen.
- [ ] Undo/Redo für geeignete Editoraktionen.
- [ ] Fullscreen-Traineransicht und Druckansicht.
- [ ] Vollständiges Accessibility-Audit inklusive E2E-Tastaturpfaden.

## P2 – Katalogquellen, Medien und KI

### Quellen und Vorlagen

- [x] VIBSS-inspirierte Quellen-/Provenienzstruktur für Trainingsvorlagen ergänzen: Zielgruppe/Alter, Intention/Schwerpunkt, Materialhinweise, Ort und Phasenstruktur werden versioniert geführt; die externe Referenz ist ausdrücklich nur Taxonomie-Inspiration.
- [x] 24 unabhängige, versionierte OCRCraft-Trainingsvorlagen mit Quellen-/Provenienzreferenz bereitstellen und direkt in Quick Create wiederverwenden; gespeicherte Trainings behalten Template-Key und Provenienz.
- [x] Erwachsenen-, Kids- und Youth-Vorlagen für Ausdauer, Koordination, Kraft, Mobility, Teamwork und Parcours ergänzen; jede der sechs Kategorien ist in allen drei Zielgruppen vertreten.
- [x] Spiele als vollwertigen Katalogtyp `game` ausbauen: eigener Spielebereich, Anlage über denselben vollständigen Übungseditor, 12 zweisprachige OCRCraft-Eigenspiele für Kids/Youth/Erwachsene sowie direkte Berücksichtigung durch lokale/AI-Trainingsplanung über die bestehende Kandidaten- und Sicherheitslogik.
- [x] Teamwettkämpfe als reguläres Trainingsformat integrieren: 3er-Spezialisten mit Kraft/Schnelligkeit/Technik und gemeinsamem Finisher sowie 3er-Rotation, 4er Relay Gauntlet, 2er Switch-Duell und 3er Checkpoint-Endurance; Presets setzen Teamgröße, Komplexe und Runden, bleiben im Builder editierbar und laufen durch dieselben Alters-/Risiko-/Equipment-/Sicherheitsregeln.
- [x] Externe Inhalte lizenzgeschützt importieren: Ohne expliziten **und als geprüft bestätigten** Lizenz-/Rechtenachweis werden nur Quellen-/Metadaten referenziert; fremde Instruktionstexte und Medienreferenzen werden unterdrückt. Medien bleiben selbst mit Lizenz bis zur separaten Rechteprüfung auf `pending`.

### Medien

- [x] Galerie, Videos und externe Thumbnails im Medienkatalog verwalten; externe Medien können einer Übung per Autocomplete zugeordnet, bearbeitet/entfernt und Videos im Player-Popover abgespielt werden.
- [x] Lizenz-, Quellen-, Attribution- und Einwilligungsprüfung für externe Medien ergänzen; Importmedien starten ungeprüft und können explizit freigegeben oder eingeschränkt werden.
- [x] Verwaiste Medien in Dateisystem/S3 gegen DuckDB-Referenzen erkennen; nicht referenzierte Storage-Objekte werden nur nach Admin-Bestätigung gelöscht, fehlende referenzierte Objekte bleiben als Prüfhinweis sichtbar.
- [x] S3-kompatible Speicherung produktionsfest machen: validierte Production-URLs, Bucket-Healthcheck, paginierte Inventarisierung, Cache-Control, Objektmetadaten sowie optionale SSE-S3/KMS-Verschlüsselung sind dokumentiert und getestet.
- [x] Legacy-Triptychon kontrolliert in Sequenzbilder migrieren: neue Sequenz wird zuerst erzeugt und reviewed; Legacy-Assets werden erst nach freigegebener Sequenz als ersetzt/abgelehnt markiert und bleiben nachvollziehbar erhalten.
- [x] Generierte Sequenzen besitzen einen verpflichtenden fachlichen Review für biomechanische Plausibilität und Übereinstimmung mit den strukturierten Ausführungsschritten; Freigabe ist erst nach zwei bestandenen Prüfungen möglich.
- [x] Medienreview mit `reviewed_by`, `reviewed_at`, Review-Notiz sowie bestehender Quellen-/Übungsreferenz persistieren; Off-Machine-Backup für DuckDB und Medien-Storage ist im Betriebshandbuch dokumentiert.

### KI

- [x] KI-Übungsentwürfe mit separatem Trainer-Approval-Workflow abschließen; harte Namensdubletten blockieren die Freigabe und gruppenspezifische Alters-/Risikokonflikte werden im Review ausgewiesen.
- [x] KI-Ausgaben schema-validieren und deterministisch gegen vorhandene Club-/Alters-/Sicherheitsregeln prüfen; Trainingsentwürfe werden nach AI-Ausgabe weiterhin serverseitig revalidiert.
- [x] Provider-Settings als AI-Instanzliste mit Live-Modellabruf, freier Modell-ID, separatem Text-/Bildmodell, Funktionszuweisung für Training/Übungsentwurf/Bild, Prioritäts-Fallback, Environment-/verschlüsselter Key-Ablage sowie eindeutigem Request-/Text-Token-Verbrauch.
- [x] Provider-Login/OAuth für Google Gemini und GitHub Copilot ergänzt; OAuth-Tokens werden verschlüsselt gespeichert/erneuert, Copilot nutzt den offiziellen SDK inklusive `listModels()`, Gemini den nativen REST-Adapter. OpenAI/Anthropic bleiben bei den unterstützten API-Key-Verfahren.

## P3 – Ausbau und Qualität

### Schutzkonzept

- [ ] Gespeicherte Kids/Youth-Profile.
- [ ] Eingeschränkte Hindernisregeln, Aufsicht und Maximalrisiken nach Alter.
- [ ] Trainerqualifikation, Medienfreigaben und verständliche Blockierungsgründe.
- [ ] Kinder-/Jugendformulierungen und Vereinsregeln als harte Priorität.

### Internationalisierung

- [ ] UI-Dictionaries und Sprachumschaltung.
- [ ] Admin-Ansicht für Übersetzungs-Vollständigkeit.
- [ ] Strukturierte Ausführungs-/Coaching-Felder DE/EN vollständig prüfen.

### Qualität und Analysen

- [ ] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E-Tests.
- [ ] Übungsnutzung, Körperregionen, Hindernisabdeckung, Laufvolumen, Wiederholungswarnungen und Nulltreffer analysieren.
- [ ] Vollständigkeits- und KI-Ersetzungsanalysen ergänzen.

## Bereits umgesetzt – kompakte Baseline

- Next.js App Router, React, TypeScript, Tailwind und modulare Domain-/Service-/Repository-Architektur.
- DuckDB-Migrationen, WAL-Recovery/Schreibserialisierung, FTS-Zustände und In-Memory-Migrationstests.
- Dynamisch validierter Seed- und Importkatalog mit zweisprachiger Identität, Aliases, Mapping, Sicherheits- und Detailfeldern.
- Exercise Library mit Suche, Filtern, Muskelkarte, Create/Edit, Archivieren/Wiederherstellen und Vollständigkeitsbericht.
- Granulare 89-Muskel-/Körperregionen-Taxonomie, primär/sekundär/Gegenmuskel-Beziehungen und zugängliche Listenalternative.
- Quick Create und Training Builder mit lokalem deterministischem Composer, optionalem AI-Pfad, Zielgruppen-/Alters-/Risiko-/Equipment-/Hindernisregeln und Trainerprüfung.
- Training CRUD, Phasen, Items, Level 1–3, Alternativen, Reorder, Duplicate/Combine und gespeicherte Builderbedingungen.
- Versionierte Trainings-Snapshots mit rollenprüfter Wiederherstellung von Training, Phasen und Items.
- Gruppen-Grundmodell, Lauf-/OCR-Formate, Team-/Stationskapazität, Übergangszeiten und strukturierte Hauptteilprogrammierung.
- OpenAI-`gpt-image-2`-Bildpipeline mit Dry Run, stabilen Seed-Dateinamen, Quellen-/Reviewmetadaten und S3-Abstraktion.
- Wiederverwendbare Dialog-/Disclosure-Komponenten mit Fokusmanagement, Escape, Fokusfalle, Scroll-Lock, sichtbarem Fokus und konsistenten Panels; große Katalogfilter öffnen als zentrierte Dialoge statt im Sidepanel zu wachsen.
- Einklappbare Hauptnavigation mit persistiertem Icon-Modus, semantischen SVG-Menüicons und wiederverwendbarem Filter-Sidepanel; Übungs-, Medien- und Hinderniskatalog nutzen beide Muster mit responsiv begrenzten Eingaben und Popovern.
- Gemeinsamer Administrationsbereich mit Tabs für Übersicht, Datenbank, Datenqualität und Einstellungen; doppelte Settings-/Admin-Navigation entfernt.
- Dynamischer Vollständigkeitsbericht für Seed-Bestand und gesamten Übungskatalog sowie Admin-Aktion zum Neuaufbau der deutschen und englischen Suchindizes.
- Light/Dark/System-Theme, semantische UI-Tokens, responsive Layouts und laufende CI-Gates.
- AppShell zeigt im Seitenkopf nur kontextbezogene Aktionen; der Seitenkopf ist pro Seite ein- und ausklappbar. Administration, Darstellung und Diagnose sind über die Hauptnavigation und den Einstellungen-Tab erreichbar.
- Darstellung und optionale Diagnose sind im Administrations-Tab Einstellungen gebündelt; der globale Seitenkopf bleibt frei von doppelten Systemaktionen.
- Adminbereich mit eigenem Tab „Benutzer & Profile“, filterbarer Mitgliederliste, Bearbeiten-Dialog, Benutzer-/Rollenverwaltung und lokalem Login-Dialog; Trainings-Readonly-Ansicht bleibt ohne Login teilbar.
- Klassische E-Mail-/Passwort-Anmeldung mit gesalzenem scrypt-Hash und optionalem Zugangscode-Fallback.
- Bearbeitbare Trainerprofile mit Vorname, Nachname, Username, E-Mail, Ausbildung, Schwerpunkten, Kurzbiografie und Bildreferenz; neue Trainings übernehmen das Profil in Readonly-/Traineransichten.
- Profilbild-Upload (JPEG/PNG/WebP bis 2 MB) mit Speicherung in DuckDB; ohne Bild werden Initialen aus Vor- und Nachnamen angezeigt.

## CI und Definition of Done

Vor jedem Abschluss sequenziell ausführen:

```bash
npm run typecheck
npm test -- --run
npm run lint
npm run build
```

Eine Änderung ist erst fertig, wenn Verantwortung, Typen, UI-Zustände, Sicherheits-/Domänenregeln und aussagekräftige Tests vorhanden sind.
