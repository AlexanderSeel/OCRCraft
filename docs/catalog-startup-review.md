# Basiskatalog, Gelände, Trainingsmethodik und sauberer Start

Stand: 8. November 2026. Dies ist ein technischer Bestandsaudit mit Review-Auftrag; keine pauschale fachliche Freigabe aller Übungen oder Bilder.

## Vom Verein beschriebene Trainingsbereiche

| Bereich | Gesichert bekannt | Noch aufzunehmen | Planungsziel nach örtlicher Prüfung |
| --- | --- | --- | --- |
| Großes Feld | Große freie Trainingsfläche vorhanden | Nutzbare Maße, Untergrund, Gefälle, Hindernisse, Wege, Beleuchtung, Belegung | Aufwärmen, Lauf-/Koordinationsspiele, Shuttles und geeignete portable Stationen |
| Hindernisbereich | Größerer Platz mit vorhandenen Vereins-Hindernissen | Tatsächlicher Gerätebestand, Maße, Griff-/Trittflächen, Abstände, Freizonen, Aufsicht und Stationskapazität | Technikprogressionen, Hinderniszirkel, Übergänge und Rig & Run |
| Kunstrasenplatz | 40 × 20 m, somit 800 m² Bruttofläche | Freie Nettofläche, notwendige Auslauf-/Sicherheitsbereiche, Befestigung, Belags-/Nutzungsregeln und Wetterzustand | Markierte Spielfelder, Reaktions-/Partner-/Teamaufgaben und geeignete leichte Stationen |
| Feld mit Laufbahn | 400-m-Runden möglich | Feldmaße/-belag, Bahnbelegung, Laufrichtung, Stationsein-/ausgänge und Übergangswege | Geplante Runden-/Intervallarbeit mit räumlich getrennten Stationen |

Die Bereiche sind zunächst logische Nutzungszonen; Überschneidungen und Wege wurden nicht vermessen. Aus 40 m Platzlänge wird keine frei nutzbare 40-m-Sprintstrecke ohne Auslauf. Aus 800 m² folgt keine pauschale Gruppenkapazität. 400 m je Runde kann für die Distanzrechnung genutzt werden; Rundenanzahl, Laufgeschwindigkeit, Pausen und Wegezeiten müssen weiterhin zum Zeitbudget passen. Schweres Abwerfen, scharfe Gegenstände oder schleifende Lasten auf Kunstrasen benötigen eine gesonderte örtliche Freigabe. Keine dieser Angaben belegt, dass ein bestimmtes Gerät vorhanden oder geprüft ist.

## Datenbankprüfung

Reproduzierbar: `npm run data:audit-startup`. Der Audit öffnet die konfigurierte Arbeitsdatenbank und den Initial-Snapshot ausschließlich read-only. Er lädt keine fehlenden Medien nach, erzeugt keine Bilder und startet keine Migrationen. Exporte liegen unter [`artifacts/startup-catalog-audit/`](../artifacts/startup-catalog-audit/summary.json); Zugangscodes/API-Schlüssel werden nicht ausgegeben.

| Befund | Initial-Snapshot | Arbeitsdatenbank |
| --- | ---: | ---: |
| Übungen insgesamt / aktiv | 1.697 / 1.423 | 1.697 / 1.423 |
| Aktive Typen obstacle / game | 28 / 15 | 28 / 15 |
| Aktive Typen strength / skill / endurance | 1.304 / 18 / 24 | 1.304 / 18 / 24 |
| Aktive Typen mobility / recovery / drill / conditioning | 12 / 12 / 9 / 1 | 12 / 12 / 9 / 1 |
| Aktive Einträge ohne Mindestalter | 1.236 | 1.236 |
| Aktive Einträge ohne strukturierte Trainingsziele | 1.236 | 1.236 |
| Aktive Einträge ohne Bewegungsmuster | 1.233 | 1.233 |
| Aktive Einträge ohne freigegebenes Medium | 1.405 | 1.405 |
| Medien insgesamt / pending | 105 / 85 | 346 / 326 |
| Approved-Medien ohne beide Anatomie-/Text-Match-Pässe | 20 | 20 |
| Fehlende lokale Dateien für geprüfte lokale Medienpfade | 0 | 0 |
| Aktive Gruppen gleicher normalisierter kanonischer Namen | 3 | 3 |
| Verwaiste Medien-/Übersetzungs-/Training-Übungsreferenzen | 0 / 0 / 0 | 0 / 0 / 0 |
| Schema-Version | 91 | 91 |

Nullwerte bei Mindestalter sind fehlende Angaben, keine nachträglich diagnostizierte Altersuntauglichkeit. Die 1.236 bzw. 1.233 Lücken sind Review-Prioritäten. Die 1.697 Datensätze enthalten 196 Seed-Einträge; bei aktiven Einträgen gibt es 182 `passed`-Seed-Qualitätsreviews und 1.241 ohne diesen Reviewdatensatz. Ein fehlender Seed-Reviewdatensatz allein beweist keine schlechte Übung; er liefert aber keinen Nachweis der fachlichen Freigabe.

Die drei Namensgruppen sind `90/90 hip switch`, `hanging oblique knee raise` und `hanging pike`. Die vollständigen IDs stehen im JSON-Audit. Varianten, Quellen und bestehende Referenzen müssen vor einer Zusammenführung verglichen werden; sie wurden nicht pauschal gelöscht. Dass Bewegungen wie Crab Walk oder Penalty Burpees als `obstacle` eingeordnet sind, ist zusätzlich ein Anlass, physische Hindernisse von Übungen/Technikdrills im Typ-Review abzugrenzen.

Bei aktiven Outdoor-Datensätzen sind 794 als `converted/approved`, 623 als `portable/catalog` und sechs ohne Environment-Review erfasst. Diese Datenbanklabels belegen weder den tatsächlichen Gerätebestand noch die passende Umsetzung auf dem Vereinsgelände.

## Durchgeführte technische Bereinigung

Im ursprünglichen Initial-Snapshot waren Benutzer, Trainings und Providerinstanzen bereits leer, jedoch war noch ein Vereinszugangscode vorhanden. Der Initial-Snapshot wurde über eine separate Staging-Datei bereinigt und erst nach erfolgreicher Prüfung veröffentlicht:

- Vereinszugangscode entfernt; Importzugangsdaten und Importhistorie werden bei jedem Export geleert; Importendpunkte werden auf öffentliche Standard-URLs zurückgesetzt, externe Importe starten deaktiviert.
- Accounts, Providerkonfiguration/-historie, persönliche Rollen/Zuweisungen, AI-Entwürfe, Trainings/Versionen, Favoriten, Audit-/Queue-/Bildjobreste werden aus dem Export entfernt.
- Bestehender Snapshot bleibt bei einem fehlgeschlagenen Build erhalten; vor erfolgreichem Ersetzen wird eine lokale `.backup-<Zeitstempel>.duckdb`-Kopie angelegt. Diese liegt unter `data/` und wird nicht ins Repository aufgenommen.
- Die Arbeitsdatenbank mit ihrem vorhandenen Benutzer, Training, vier Providerinstanzen und zwei Queue-Einträgen wurde nicht bereinigt oder überschrieben. Ihre Zugangsdaten bleiben lokale Betriebsdaten.
- Nachprüfung des veröffentlichten Initial-Snapshots: 0 Benutzer, 0 Trainings, 0 Zugangscodes, 0 Import-Credentials, 0 Providerinstanzen, 0 AI-Entwürfe, 0 Queue-Einträge. Die 1.697 Übungen und 105 Medien wurden erhalten.

Das Exportwerkzeug unterstützt isolierte Quell-/Zielpfade für Tests. Ein vorhandenes Source-WAL verhindert einen Export; der Besitzer muss vorher regulär checkpointen. Das ist kein Bereinigungswerkzeug für eine laufende Produktivdatenbank.

**Noch offen:** inhaltliche Kuratierung, Medienfreigaben, eindeutige Varianten-/Duplikatentscheidungen und die verbindliche Startkatalog-Auswahl. Der Snapshot enthält weiterhin 85 pending Medien und Legacy-Freigaben ohne dokumentierte Einzelchecks; die technische Bereinigung ist keine fachliche Releasefreigabe.

## Verbindlicher Prüfauftrag pro Katalogeintrag

1. Identität, Quellen und passende Klassifikation prüfen; eine Bewegung ist nicht automatisch ein physisches Hindernis. Alias/Variante/Regression/Progression von echter Dublette trennen.
2. Ziel, Bewegungsmuster, beanspruchte Regionen, Level, Voraussetzungen, Alter/Erfahrung, Risiko und Aufsicht strukturiert ergänzen. Nicht jedes Feld darf unbesehen aus Importtext oder AI übernommen werden.
3. Aufbau, Ausführung, Abbruch-/Qualitätskriterien, Aufwand, Stationskapazität, Wechselzeit und verfügbare sichere Alternative auf DE/EN prüfen.
4. Outdoor-Variante mit tatsächlichen Vereinsgeräten und geeignetem Untergrund testen; Maschinenersatz muss das Trainingsziel sinnvoll erhalten. Keine CrossFit-/Calisthenics-Spezialübung ohne passende Voraussetzungen allein wegen eines Suchtreffers freigeben.
5. Jedes Bild/Video gegen genau diese Variante prüfen: anatomische Plausibilität, Griffe/Lasten, Bewegungsrichtung, Start-/Endposition, Anzahl/Rollen der Personen, Equipment und bei Hindernissen Geometrie/Freizonen. Schritttext, Bildtext und Reihenfolge müssen passen. Rechte und Einwilligungen separat prüfen.
6. Entscheidung mit Eintrags-/Asset-ID, Reviewer, Datum, Status und Änderungsgrund dokumentieren. Fehlerhafte Zuordnungen sperren oder ersetzen; keine vermeintlichen Anatomie-/Text-Match-Pässe automatisch setzen.

Die Medienlisten im Audit enthalten erwarteten Übungsnamen, lokalen Pfad/Key, vorhandenen Generierungsprompt und Coaching-/Sicherheitskontext. Das erleichtert die serielle Sichtprüfung, ersetzt sie aber nicht. Es wurde in diesem Schritt kein Bild als passend oder biomechanisch korrekt freigegeben.

## Ziel-Abdeckungsmatrix des Basiskatalogs

„Alle gängigen Übungen“ ist keine endliche, quellenübergreifend standardisierte Liste. Als Abnahme dient eine gepflegte Familienmatrix mit geprüften Kernformen, sinnvollen Leveln, Ausweichvarianten und Equipment-/Geländebezug. Das Ziel ist eine belastbare, übersichtliche Basis, nicht möglichst viele Importzeilen.

| Bereich | Zu prüfende Kernfamilien / Beispiele |
| --- | --- |
| OCR: Hangeln/Griff | Aktiver/passiver Hang, bodenunterstützte Varianten, Monkey Bars, Ringe/Multirig, verschiedene Griff- und Traversearten |
| OCR: Wand/Klettern | Niedrige Wand, Step-over/Vault, Schräg-/Inverse Wand, Irish Table, Rope Climb, Cargo Net, Olympus/Weaver und lokale Hindernisse |
| OCR: Boden/Präzision | Crawls/Low Crawl, Over-/Under, Balancebalken, Slackline, Tritt-/Zielaufgaben; lokale Seil-/Reifen-Übergänge |
| OCR: Last/Transport | Farmer-/Suitcase-/Sandbag-/Bucket-Carry, sichere Aufnahme/Ablage, Drag/Pull, Steine/Ankerketten nur mit tatsächlichem Bestand und Freigabe |
| OCR: Werfen/Übergänge | Zielwurf/Speer-Variante nur mit geeignetem Material und abgetrenntem Bereich; Lauf-Hindernis- und Hindernis-Lauf-Übergänge |
| Calisthenics | Horizontales/vertikales Drücken und Ziehen, Squat/Lunge/Step-up, Hinge/Bridge, Brace/Hollow/Plank, Stütz/Hang; kontrollierte Progressionen für Dips/Pull-ups und anspruchsvollere Skills |
| Functional/CrossFit-typisch | Deadlift, Squat, Press, Row, Carry, Swing, Burpee, Box-Step-/Jump, Slam/Throw, Thruster/Clean/Snatch nur mit Skill-/Equipmentvoraussetzungen; portable Varianten statt erfundener Studioausstattung |
| Lauftraining | Lauf-ABC, lockere Grundlagen, dosierte Intervalle, Beschleunigung/Richtungswechsel, 400-m-Runden, Shuttles, Rig & Run, Übergänge und ruhiges Auslaufen |
| Spiele | Reaktion/Fangen, Staffel, Orientierung/Memory/Code, Kooperation/Teamtransport, Partner-Spiegeln/Tempoabgleich, Balance-/Zielaufgaben; inklusive Regeln und Alternativen statt Ausscheiden-/Zeitdruck als Sicherheitsanreiz |
| Warm-up/Recovery | Progressives Erwärmen, dynamische Vorbereitung der Zielmuster, Koordination/Technikvorbereitung, graduelles Herunterfahren, passende Mobilität/Stretching/Reflexion |

[`coverage-candidates.json`](../artifacts/startup-catalog-audit/coverage-candidates.json) liefert erste Namens-Treffer je Familie mit IDs. **Nur Suchkandidaten:** Importnamen, Keywords oder das Vorhandensein eines Bildes beweisen keine Abdeckung, saubere Technik oder Outdoor-Tauglichkeit. Auch archivierte Treffer müssen bei der Abgrenzung berücksichtigt werden.

## Methodik: Quellen, gemeinsame Prüfung und offene Umsetzung

Die Quellen wurden am 8. November 2026 geprüft:

- [CrossFit: Mechanics, Consistency, Intensity](https://www.crossfit.com/essentials/mechanics-consistency-intensity-part-1-what-does-it-mean): Bewegungsqualität und wiederholbare Ausführung gehen der Steigerung der Intensität voraus; Skalierung wird relativ zum Individuum betrachtet. Dies ist eine sportartspezifische Methodik, keine allgemeine Kinder-Lastvorschrift.
- [ACSM Position Stand 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/): Grundlage für individualisiertes Krafttraining gesunder Erwachsener und zielbezogene Gestaltung. Keine automatische Übertragung von Erwachsenenverordnungen auf Kinder oder medizinische Sonderfälle.
- [World Athletics Kids’ Athletics](https://worldathletics.org/kids-athletics): inklusive, anpassbare und spielerische Entwicklung grundlegender Bewegungsfertigkeiten bei Kindern. Kein Nachweis, dass jedes OCR-Hindernis für jede Altersgruppe geeignet ist.

OCRCraft besitzt bereits einen gemeinsamen Nachprüfungsweg in `training-draft-service.ts`: `finalizeDraft` berechnet Programmierung, deterministische Domänenvalidierung und `assessTrainingSportsQuality`. Der Offline-Komponist wählt zusätzlich ziel-/phasenbezogen nach Metadaten und konservativen Heuristiken. Der KI-Prompt erhält die gemeinsamen Planungsprinzipien; diese wurden um Mechanik vor Steigerung, altersbezogene Abgrenzung und nicht erfundene Outdoor-Rahmenbedingungen ergänzt und enthalten nun Quellenreferenzen.

Bereits vorhandene Qualitätsprüfungen betreffen Warm-up-Bezug, Cooldown, Bewegungs-/Muskelbalance, wiederholte Belastung und anspruchsvolle Technik nach Ermüdung. **Die Gewichte, Punktabzüge und der 0–100-Score sind OCRCraft-Heuristiken**, keine wissenschaftlich validierte Gesamtnote oder Sicherheitsfreigabe. Harte Alters-/Risiko-/Kapazitäts-/Equipmentregeln bleiben getrennt davon deterministisch wirksam; Trainer entscheiden über die Einheit.

Noch umzusetzen sind die strukturierten Vereinsgeländeprofile, gleiche flächen-/wegebezogene Randbedingungen für beide Generatoren und vollständige vergleichbare Regressionen für OCR, Calisthenics, Functional/CrossFit-Formen und Spiele. Textliche KI-Anweisungen allein ersetzen diese Umsetzung nicht.


### Ursprünglicher Befund zur Planerfreigabe (Metadatenlücke inzwischen geschlossen)

`training-draft-candidate-core.ts` filtert `archived=false`, erlaubt aber ein fehlendes Mindestalter (`e.min_age IS NULL`) und verwendet bei fehlender Zielgruppen-/Outdoor-Eignung teilweise `COALESCE(..., true)`. Es gibt an dieser Abfrage keine vollständige explizite fachliche Reviewfreigabe. Die Bezeichnung „approved candidates“ im Service darf deshalb nicht als Nachweis einer Einzelprüfung aller aktiven Imports verstanden werden. Explizit hinterlegte Alters-/Vereinsgrenzen bleiben geprüft; unbekannte Metadaten sind dennoch eine offene Qualitäts-/Eligibility-Lücke. Vor Freigabe des kuratierten Startkatalogs ist ein strukturierter Review-/Eligibility-Vertrag für beide Planer nötig. Dieser Audit hat keine fehlenden Sicherheitswerte geraten und keine pauschale fachliche Freigabe gesetzt.


## Verifikation dieses Arbeitsstands

- Vollständiger Unit-/Integrationslauf: 283 Tests in 84 Dateien bestanden.
- Gezielte Nachprüfung: Startup-Exporter mit Credential-/Endpoint-Bereinigung und Fehlererhalt, KI-Payload inklusive Quellen und gemeinsame Sportqualitätsprüfung bestanden.
- Drei Browserregressionen gegen einen frischen Startup-Snapshot: Quick-Create-Speichern, Builder-Speichern mit Änderungen und Kids-Mindestaltergrenze bestanden.
- Produktionsbuild inklusive TypeScript, UI-Gate und Architekturgrenzen bestanden. Lint: keine Fehler, weiterhin die bekannte Warnung zu `index` in `training-excel-service.ts:248`.
- Fachliche Einzelreviews, vollständiger Bildabgleich und die strukturierte Geländeintegration sind ausdrücklich nicht als abgeschlossen ausgewiesen.


## Nachbereitung: gemeinsame Metadaten-Eligibility

`assessPlanningMetadata` in der unabhängigen Domänenschicht prüft Mindestalter, bekannten Risikowert, Zielgruppen-/Ortsangaben, positive ganzzahlige Stationskapazität sowie nichtleere Ziele und Bewegungsmuster. Unbekannte Eignungswerte werden nicht als `true` behandelt. Bei flexiblen Zielgruppen/Orten müssen die zugehörigen Eignungsangaben bekannt sein und mindestens eine Nutzung erlauben. Die konkrete Alters-/Vereins-/Equipment-/Kapazitätsprüfung des Trainings bleibt zusätzlich erforderlich.

Die gemeinsame Kandidatenabfrage wendet diese Prüfung vor dem Aufbau des Pools an; damit sehen KI- und Offline-Generierung sowie erneute KI-Persistenzprüfung dieselbe eingeschränkte Auswahl. Favoriten, bevorzugte IDs oder KI-Ausgaben können diesen Pool nicht erweitern. Drei Planeroberflächen erklären über eine DE/EN-Disclosure die Auswahlkriterien. Einträge werden dabei nicht gelöscht, archiviert oder als fachlich freigegeben markiert.

Der read-only Audit exportiert pro Eintrag `planning_metadata_issues_mixed`, also maschinenlesbare Ausschlussgründe, und einen klar begrenzten Zähler für DE-Kapazität bei gemischter Zielgruppe und gemischten Orten. Im aktuellen Snapshot bestehen 187 von 1.423 aktiven Einträgen diese Mindestprüfung. Das ist kein gruppen-/geländespezifisches Eignungszertifikat.

Der zusätzlich geprüfte Legacy-Bestand zeigt 177 `compat-v1`-Reviews. Diese wurden per Kompatibilitätsmigration nachgetragen und dürfen nicht als expliziter menschlicher Reviewnachweis umgedeutet werden. Eine vollständige formale Fachfreigabe mit Änderungsinvalidierung bleibt deshalb offen. Die Metadatenprüfung ersetzt ebenso wenig eine konkrete Gruppenaltersangabe, eine Vor-Ort-Geräteprüfung oder die individuelle Trainerentscheidung.


### Nachprüfung der Altersdaten im Vorschlag

Die Browserverifikation deckte auf, dass die beiden Offline-Komponisten und der kanonische KI-Komponist das gefilterte `minAge` nicht als `minimumAge` in die Übungsreferenz übernahmen. Diese Information wird nun in allen drei Pfaden erhalten; dadurch kann auch die spätere Domänenvalidierung den Wert prüfen und die Vorschau ihn nachvollziehbar ausgeben.

Für fünfjährige Teilnehmende enthält der aktuelle Startkatalog keinen geeigneten Metadaten-Pool. Beide Generatorwege melden deshalb ausdrücklich, dass kein passender Pool verfügbar ist; es wird kein Vorschlag erzeugt und nicht auf Imports ohne Altersangabe ausgewichen. Das ist eine offene inhaltliche Kataloglücke, kein Grund, vorhandene Mindestalter automatisch herabzusetzen. Der Erfolgsfall der Kids-Regression prüft nun einen tatsächlich abgedeckten Altersbereich und verlangt explizite Alterswerte im Ergebnis.
