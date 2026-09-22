# OCRCraft – offene Vorhaben

> Stand: September 2026 · Primärsprache Deutsch, UI-Inhalte bleiben für Englisch übersetzbar.

`README.md` dokumentiert die umgesetzten Meilensteine. Diese Datei enthält nur noch Arbeit, die tatsächlich offen ist.

## Arbeitsregeln

- Die Kernstruktur jeder Einheit bleibt sichtbar: Aufwärmen, Hauptteil, Cooldown & Stretching.
- Architektur bleibt getrennt: `UI → Anwendung/Service → Repository → DuckDB`.
- KI schlägt vor; der Trainer prüft, ändert und speichert.
- Alters-, Risiko-, Vereins-, Equipment- und Kapazitätsregeln bleiben harte Grenzen.
- Eine Änderung braucht typed boundaries, zugängliche Zustände, Domänenvalidierung und aussagekräftige Tests.

## P1 – Datenfundament und fachliche Quellen

- [x] Dateninventur und Quellenregister anlegen: beide gecachten Übungsquellen, Seed-Migrationen, 24 eigene Trainingsvorlagen und 12 eigene Spiele erfasst; Provenienz-, Lizenz- und Review-Grenzen in [`docs/data-curation-plan.md`](./docs/data-curation-plan.md) dokumentiert.
- [x] Ersten Quellenkatalog-Audit reproduzierbar machen: `npm run data:audit` prüft Rohdatensätze, Kategorien, fehlende Mindestfelder, Lizenzstatus, interne Namensduplikate und Quellenüberlappung; Ergebnis in [`docs/data-audit-report.md`](./docs/data-audit-report.md).
- [x] Quellen-Matching mit 70%-Kandidatenschwelle ergänzen: `npm run data:match` priorisiert den fachlich vollständigeren Datensatz, ohne Rohquellen zu überschreiben; die Regel ist in [`docs/source-match-audit.md`](./docs/source-match-audit.md) dokumentiert.
- [x] Kanonische Feldanreicherung auf Basis der Matchentscheidung beginnen: bestehende Matches übernehmen jetzt strukturierte Kategorie-, Körperregions- und Equipment-Metadaten sowie die Quellenverknüpfung, ohne kuratierte Namen, Coachingtexte oder Sicherheitsfelder zu überschreiben; unsichere Rohtexte bleiben Referenzen.
- [ ] Kanonische Feldanreicherung abschließen: alle zusätzlichen ExerciseDB-Kandidaten fachlich auf OCR-Relevanz prüfen und für freigegebene Datensätze eigene DE/EN-Coaching-, Sicherheits- und Progressionsfelder ergänzen.
- [x] ExerciseDB-Restbestand vorsortieren: 177 nicht überlappende Kandidaten werden mit `npm run data:ocr-relevance` in High-Signal-, Conditioning- und manuelle Review-Prioritäten geteilt; Ergebnis in [`docs/ocr-relevance-audit.md`](./docs/ocr-relevance-audit.md).
- [x] High-Signal-Review durchführen: die 18 Kandidaten sind gegen den vorhandenen OCRCraft-Seed geprüft, auf bestehende Übungen abgebildet, als echte Lücken markiert oder aus dem OCR-Kern ausgeschlossen; Entscheidungen stehen in [`docs/ocr-candidate-review.md`](./docs/ocr-candidate-review.md).
- [x] Ersten kuratierten OCR-Lückenbatch seeden: fünf eigene Übungen für Hanging Knee Raise, Hanging Straight-Leg Raise, Hanging Pike, Hanging Oblique Knee Raise und Battle Rope Waves mit DE/EN-Coaching, Sicherheits-/Progressionsfeldern, Hindernis-Guidance und Suchindex in Migration 078 ergänzt; Seed-Integration prüft Vollständigkeit und Reviewstatus.
- [x] OCRFRA-Club-Hindernispack als Migration 079 ergänzen: Irish Table, Weaver, rotierende Rig-Elemente, Multirig-Ring-Traverse, Schrägwand-Traverse und Reifen-Parcours mit DE/EN-Coaching, Progressionen, Sicherheitszonen, Alternativen, Reviewstatus und Suchindex; konkrete Vereinsmaße und Freigaben bleiben offen.
- [x] Übungskatalog vollständig auditieren: der deterministische Audit prüft jetzt für Seed- und Importdatensätze stabile Identität, kanonischen Namen, DE/EN-Felder, Aliase, Phase, Ziel, Bewegungsmuster, Körperregion, Risiko, Mindestalter, Aufsicht, Kapazität, Dosierung, Progressionsstufen und Quellenstatus; Regeln und Grenzen stehen in [`docs/exercise-catalog-audit.md`](./docs/exercise-catalog-audit.md). Fachliche Textqualität, Duplikatentscheidungen und Trainerfreigaben bleiben separate Reviews.
- [x] Duplikat- und Variantenbereinigung als Review-Workflow umgesetzt: normalisierte Namen, Aliase, Equipment, Körperregionen und externe IDs erzeugen begründete Review-Aufgaben; Side-by-Side- und Batch-Entscheidungen unterstützen Zusammenführen, „Beide behalten“ und „Keine Dublette“, archivieren statt löschen und protokollieren Entscheidung/Quellenbezug im Audit. Details in [`docs/duplicate-review-workflow.md`](./docs/duplicate-review-workflow.md).
- [x] Externe Quellen technisch getrennt: ExerciseDB bleibt standardmäßig `reference_only`, ungeklärter Quelltext wird nicht in die Übersetzungs-AI gegeben, Dataset-/Textlizenz und Medienrechte werden getrennt bewertet, Quellenreferenzen speichern Provider/URL/Datensatz-ID/Content-Mode und eigene DE/EN-Coachingentwürfe bleiben reviewpflichtig. Die Policy in [`docs/external-source-separation.md`](./docs/external-source-separation.md) ist technische Absicherung und keine Rechtsberatung.
- [x] Offizielle OCR-Fähigkeitsmatrix aus World-Obstacle-/FISO-Regeln und Sicherheitsunterlagen abgeleitet; [`docs/ocr-skill-matrix.md`](./docs/ocr-skill-matrix.md) trennt Quellenebenen, OCR-Fähigkeiten, Progressionen, Sicherheits-/Freigabefelder und lokale OCRFRA-Zuordnungen. Datenmodell- und Coverage-Integration bleiben als Folgearbeiten offen.
- [x] OCRFRA-Club-Obstacle-Pack aufbauen: die fehlenden Inventarvarianten Olympus, Eskaladierwand, Inverse Wand, Balancebalken, Slackline, Ankerketten und Atlassteine sind in Migration 081 mit DE/EN-Anleitungen, Progressionen, Sicherheitszonen, Fallbacks und Reviewstatus ergänzt; Schrägwand, Multirig und Reifen bleiben aus Migration 079 enthalten. Maße, Kapazität, Inspektion und Freigaben bleiben bis zur Vereinsbestätigung offen.
- [x] OCRFRA-Bild-/Seitenaudit dokumentieren: Multirig-Aufbau, Ringe und Seile wurden im Trainingsgelände-Foto geprüft; Irish Table, Weaver, Monkeybars, rotierende Elemente, Wände, Reifen und Schrägwand sind als Clubangaben mit getrenntem Verifikationsstatus im [`docs/ocrfra-obstacle-inventory.md`](./docs/ocrfra-obstacle-inventory.md) erfasst.
- [ ] Template- und Spielekatalog fachlich erweitern: Altersstufen, OCR-Fähigkeiten, Zeitstruktur, Equipment, Vereins-Hindernisse, Progressionen und sichere Alternativen abdecken; jede Einheit bleibt OCRCraft-Eigeninhalt mit Provenienz.
- [x] Katalog-Coverage-Report gebaut: der Admin zeigt Lücken/Nulltreffer nach Sprache, Phase, Risiko/Mindestalter, Ziel, Equipment, Körperregion, OCR-Fähigkeit und Club-Hindernis; Club-Coverage wird nur innerhalb lokaler `club-`-Varianten berechnet. Details in [`docs/catalog-coverage-report.md`](./docs/catalog-coverage-report.md).
- [ ] Kuratierte Seed-Batches einzeln liefern: pro Batch Datenmigration, Reviewstatus, Quellenregister, Domain-Tests, Vollständigkeitsbericht, `typecheck`, `lint`, `check:ui`, Unit-, Build- und E2E-Prüfung.

## P1 – Trainer-Workflow und UI

- [x] Tailgrids-kompatible lokale UI-Schicht abgeschlossen: Overlay/Popover, Form-Felder, Pagination, Tabs, Sidebar und Toast sind als lokale OCRCraft-Komponenten konsolidiert und in [`docs/ui-components.md`](./docs/ui-components.md) dokumentiert; es gibt keine Tailgrids-Laufzeitabhängigkeit.
- [x] Authentifizierungs-Bootstrap abgeschlossen: leere Benutzerbasis führt zu `/setup`, Login und Vereinscode sind serverseitig validiert, geschützte App-Seiten leiten ohne Sitzung zu `/login`, und der aktuelle Benutzer ist global sichtbar.
- [x] Bildvorschauen vereinheitlicht: Medien, Hindernisse, Übungsbilder, Dubletten- und Profilbilder bieten eine zugängliche Lupen-Schaltfläche mit Großansicht, Escape-Schließen und Fokus-Rückgabe.

## P2 – HyperUI-basierte UI-Modernisierung

> HyperUI wird als Referenz- und Markup-Quelle verwendet, nicht als Runtime-Abhängigkeit: Das Projekt liefert kopierbare Tailwind-CSS-v4-Komponenten und keine zu installierende Komponentenbibliothek. Bestehende OCRCraft-Tokens, Übersetzbarkeit, serverseitige Aktionen und Accessibility-Regeln bleiben maßgeblich.

- [x] Bestandsaufnahme und Zielbild erstellen: aktuelle lokale UI-Komponenten, wiederholte Page-Markups, Tailwind-Utilities, responsive Zustände und semantische Tokens gegen passende HyperUI-Muster (Navigation, Cards, Forms, Tables, Alerts, Empty States) abgleichen; Entscheidungen und Migrationsreihenfolge in [`docs/hyperui-migration.md`](./docs/hyperui-migration.md) dokumentieren.
- [x] Design-System-Adapter definieren: HyperUI-Markup in kleine OCRCraft-Komponenten überführen, dabei `var(--surface*)`, `var(--border*)`, `var(--foreground)`, `var(--muted)`, `var(--focus)` sowie Light/Dark-Theme und deutsche/englische Labels beibehalten; die semantische Button-Grundform ist in `src/components/ui/form.tsx` zentralisiert und in [`docs/ui-components.md`](./docs/ui-components.md) dokumentiert.
- [x] App-Shell modernisieren: Sidebar, Header, Mobile-Navigation, Breadcrumbs, Seitenaktionen und responsive Layout-Zustände auf das ausgewählte HyperUI-Muster angleichen; Breadcrumbs und eine mobile Benutzerkennung sind in der Shell ergänzt, Auth-Weiterleitung, aktueller Benutzer, Skip-Link, Fokusreihenfolge und Tastaturbedienung bleiben erhalten.
- [ ] Wiederverwendbare Oberflächen migrieren: Form-Felder und Validierungsfehler, Buttons, Cards/Stat-Cards, Tabs, Dialoge/Popover, Toasts, Pagination, Alerts und Loading-/Empty-States vereinheitlichen; bestehende `src/components/ui/*`-Komponenten erweitern oder ersetzen, nicht parallel doppelte Varianten anlegen.
- [x] Gemeinsame Feedback-Grundformen begonnen: `Alert` und `EmptyState` sind als lokale, tokenbasierte Komponenten ergänzt und in der Trainingsvorlagen-Seite eingesetzt; weitere Fachseiten folgen im Batch.
- [x] Feedback-Batch erweitert: Trainingsdetail und Gruppenübersicht verwenden jetzt dieselben Alerts und Empty States, ohne Änderungen an Serveraktionen oder Domänenlogik.
- [x] Feedback-Batch auf Hindernisse und Medien ausgeweitet: alle Statusmeldungen der beiden Katalogseiten verwenden jetzt zentrale Alerts; weitere Empty States folgen im Seiten-Batch.
- [x] Empty-State-Batch erweitert: Spielekatalog und AI-Entwürfe verwenden jetzt die gemeinsame `EmptyState`-Komponente mit verständlichem Kontexttext.
- [x] Medien-Empty-State migriert: der leere Medienkatalog verwendet jetzt dieselbe zentrale `EmptyState`-Komponente wie Spiele, AI-Entwürfe, Gruppen und Vorlagen.
- [x] AI-Entwurfsfeedback migriert: die lokale Erfolgs-Notice wurde entfernt und Fehlerzustände verwenden jetzt den zentralen `Alert`-Baustein.
- [x] Admin-Feedback-Batch begonnen: Queue-, Qualitäts-Empty-States und globale Job-Rückmeldungen verwenden jetzt `Alert` beziehungsweise `EmptyState`.
- [x] Admin-Feedback-Batch abgeschlossen: Datenbank-, Benutzer- und Rollenmeldungen verwenden ebenfalls zentrale Alerts mit einheitlicher Live-Region-Semantik.
- [x] Card-Grundform begonnen: `Card` und `CardHeader` sind als tokenbasierte Komponenten ergänzt; `StatCard` verwendet die gemeinsame Grundform.
- [x] Card-Migration erweitert: die statusbehafteten Admin-Übersichtskarten verwenden jetzt `Card` und `CardHeader`.
- [x] Card-Migration erweitert: das Vereinsvorlagen-Panel verwendet jetzt die zentrale `Card`-Grundform; das Filter-/Ergebnis-Grid bleibt davon getrennt.
- [x] Card-Migration abgeschlossen für den Vorlagenkatalog: gespeicherte Vereinsvorlagen und versionierte Startvorlagen verwenden jetzt ebenfalls semantische `Card`-Elemente.
- [x] Card-Migration erweitert: Gruppen-Katalogkarten verwenden jetzt die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-Migration erweitert: Spiele-Katalogkarten verwenden ebenfalls die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-/Empty-State-Migration erweitert: Übungskatalogkarten und der leere Übungskatalog verwenden jetzt die gemeinsamen UI-Bausteine über alle Darstellungsmodi hinweg.
- [x] Card-Migration erweitert: Medien- und Hinderniskatalogkarten verwenden jetzt die gemeinsame Card-Grundform mit semantischem `article`-Element.
- [x] Card-Migration erweitert: AI-Entwurfskarten verwenden jetzt die gemeinsame Card-Grundform; Review-Blocker und Freigabeaktionen bleiben unverändert.
- [x] Card-/Empty-State-Migration erweitert: Trainingskarten und leere Trainingsarchive verwenden jetzt die gemeinsamen UI-Bausteine.
- [x] Card-Migration erweitert: die Übungsdetailseite verwendet jetzt die zentrale `Card`-/`CardHeader`-Grundform; die bisherige lokale Kartenmarkierung wurde ohne Änderung an Fachlogik oder Datenzugriff entfernt.
- [x] Trainings-UI-Batch erweitert: Phasen-Karten und der deterministische Quickplaner verwenden jetzt die zentrale `Card`-Grundform; Trainingsberechnung, Speichern und AI-/Service-Aufrufe blieben unverändert.
- [x] Fachseiten in kontrollierten Batches umstellen: Dashboard, Trainingsübersicht, Quick-Create, Übungsbibliothek, Gruppenübersicht und Admin-Hauptbereiche verwenden das kompakte Coral/Lime-/Graphit-System sowie die gemeinsamen Card-/Form-/Feedback-Adapter; die filterbasierten Kataloge teilen ein einheitliches Seitenleistenraster, einen gemeinsamen Ergebnisstart und kompakte sticky Top-Zählwerte. Hindernis-/Medienstatus sowie der Trainingskatalog sind in dieses Muster eingeordnet. Admin-Hauptpanels verwenden zusätzlich eine gemeinsame dichte Panel-Grundform; spezialisierte Admin-Komponenten bleiben fachlich unverändert.
- [x] Kompaktes visuelles System umgesetzt: kleinere Radien, dichter AppShell/Header/Sidebar, neutrale Charcoal-Dark-Flächen, Coral als Brand/Creation-Signal, Lime als Training/Progress-Akzent und semantische Warm-up/Main/Cooldown-Tokens; dokumentiert in `docs/design-system.md`.
- [x] Layout-Regression der Trainingsvorlagen behoben: der sticky Vorlagenfilter liegt jetzt in einem gemeinsamen zweispaltigen Grid mit Ergebnisbereich und kann beim Scrollen keine Karten mehr überlagern.
- [x] Vorlagenworkflow ergänzt: Vereinsvorlagen lassen sich in Name/Beschreibung bearbeiten, für Strukturänderungen als neues Training öffnen und der Training Builder startet über „Neue Vorlage mit AI planen“ direkt im AI-Modus; Trainerprüfung und anschließendes Speichern als Vorlage bleiben verbindlich.
- [x] Batch-Freigaben ergänzt: Medien können ausgewählt oder anhand der aktuellen Filter gesammelt freigegeben werden; offene AI-Übungsentwürfe bieten ebenfalls „Alle freigeben“. Bestehende Qualifikations-, Rechte-, Einwilligungs- und Review-Blocker bleiben verbindlich, übersprungene Datensätze werden ausgewiesen.
- [x] Administrativen External-Import ergänzt: ExerciseDB/AscendAPI und hasaneyldrm werden über konfigurierbare Serverquellen importiert; ExerciseDB-RapidAPI-Schlüssel werden verschlüsselt gespeichert, Importmengen sind begrenzt/auditierbar und fehlende deutsche Texte können über den konfigurierten AI-Provider übersetzt werden. Trainerreview und externe Medien-Attribution bleiben vor Veröffentlichung erforderlich.
- [x] Import-Coverage sichtbar gemacht: der neue Administrationsbereich zeigt für den vollständigen Katalog die Pflichtfeldlücken importierter Übungen, darunter DE/EN-Texte, Ausführung, Coaching, Fehlerkorrekturen, Körperregionen, Bewegungsmuster, Dosierung und Progressionsstufen.
- [x] External-Import abgesichert: die Administration kann ExerciseDB/RapidAPI und hasaneyldrm vor dem Schreiben mit einem schreibgeschützten Verbindungstest prüfen; Beispielname und Antwortumfang werden zurückgemeldet.
- [x] External-Import mit Vorschau ergänzt: vor dem Schreiben werden Datensatzumfang, erkannte Instruktionssprachen, Medienreferenzen und Beispielnamen schreibgeschützt angezeigt; Übersetzung und Import bleiben getrennte Aktionen.
- [ ] Accessibility- und Regression-Gate erweitern: WCAG-nahe Fokus-/Kontrastprüfung, Dialog-/Popover-Escape und Fokus-Rückgabe, Touch-Ziele, reduzierte Bewegung, Formularfehler am Feld, mobile Navigation sowie bestehende `check:ui`- und Playwright-Gates für jede migrierte Oberfläche.
- [x] Statisches Accessibility-Gate erweitert: `check:ui` prüft jetzt zugängliche Breadcrumbs, Live-Regionen/Rollen der Feedback-Komponenten, semantische Card-Elementtypen, sichtbare Fokus-/Touch-Ziele, Feldfehler, Dialog-Escape/Fokus-Rückgabe, mobile Navigation und reduzierte Bewegung; echte Browser- und Kontrastprüfungen bleiben offen.
- [ ] Browser-Regression-Gate für migrierte Katalogseiten ergänzen, sobald die E2E-Suite eine authentifizierte Test-Sitzung bereitstellt; aktuell prüft `check:ui` die statischen Accessibility-Verträge.
- [ ] HyperUI-Übernahme abschließen: verwendete Quellen und MIT-Hinweis in der Projektdokumentation festhalten, nicht benötigte Übergangsklassen entfernen, Duplikate aus den Seiten löschen und nach jedem Batch `typecheck`, `lint`, `check:ui`, Unit-, E2E- und Build-Prüfungen ausführen.
- [x] HyperUI-Quellen- und MIT-Hinweis dokumentiert: Herkunft, Lizenzumfang und Abgrenzung zu OCRCraft-eigenem Code sind in [`docs/hyperui-migration.md`](./docs/hyperui-migration.md) und [`docs/ui-components.md`](./docs/ui-components.md) festgehalten; Bereinigung und Abschlussprüfungen bleiben offen.

## P3 – Internationalisierung

- [ ] UI-Dictionaries und Sprachumschaltung für alle user-facing Bereiche vervollständigen; die typisierte DE/EN-Grundlage, persistierte Auswahl sowie globale Navigation und Theme-Beschriftungen sind umgesetzt, Fachseiten bleiben noch auf vollständige Schlüsselabdeckung umzustellen.
- [x] Admin-Ansicht für Übersetzungs-Vollständigkeit ergänzt: strukturelle Dictionary-Lücken und verwaiste Schlüssel werden im Tab „Datenqualität“ geprüft und sichtbar gemacht.
- [x] Strukturierte Ausführungs-/Coaching-Felder DE/EN vollständig prüfen: der Admin-Vollständigkeitsbericht weist pro Sprachdatensatz Details, Ausführungsschritte, Coaching-Cues und Fehlerkorrekturen getrennt aus.

## P3 – Qualität und Analysen

- [ ] Quick-Create-, Training-Editor-, Kids/Youth- und Theme-E2E weiter ausbauen: neben den bestehenden Tastatur-, Review-, Builder-, Schutz- und Theme-Gates noch echte Editoränderung, Speichern und geschützte Kids/Youth-Blockierung abdecken.
- [ ] Übungsnutzung, Körperregionen, Hindernisabdeckung, Laufvolumen, Wiederholungswarnungen und Nulltreffer analysieren; Auswertungen müssen aus Repository-/Service-Daten stammen und Filterzustände erklären.
- [x] Dashboard-Analysegrundlage erweitert: echte 8-Wochen-Trainingsaktivität, Trainingsquellen, Statusmix, Spieleumfang, AI-Entwurfsqueue sowie Bildgenerierungs-Queue und 24h-Ergebnisse werden über den dedizierten Dashboard-Read-Model-Layer dargestellt; tiefere Nutzungs-/Körperregions-/Nulltrefferanalysen bleiben offen.
- [x] Dashboard-Nutzungsanalyse ergänzt: 8-Wochen-Poolabdeckung, Laufminuten/-bausteine, primäre Körperregionsnutzung und häufig verwendete Übungen werden direkt aus Training-Sessions/-Items und Katalogzuordnungen aggregiert; Nulltreffer und echte Wiederholungswarnungen bleiben als separate Analyse offen.
- [ ] Vollständigkeits- und KI-Ersetzungsanalysen ergänzen: fehlende DE/EN-/Coaching-/Sicherheitsfelder, Ersatzquote, Blockierungsgründe und Trainerfreigaben nachvollziehbar darstellen.

## Abschlussroutine

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```
