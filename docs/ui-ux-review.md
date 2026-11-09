# UI/UX-Review – OCRCraft

Stand: 8. November 2026. Schwerpunkt: Trainer wählen Gruppe und Rahmen, planen, prüfen, ändern und speichern; anschließend Training in der Halle verwenden.

## Vorgehen und Aussagegrenzen

Alle 26 Page-Dateien und ihre gemeinsamen UI-Muster wurden im Quellcode geprüft. Browserprüfungen erfassen die 17 Hauptarbeitsflächen bei 390, 768 und 1440 CSS-Pixeln; zusätzliche Prüfungen erfassen Detail-/Editorseiten, Administration, Anmeldung sowie Trainer-/Druckansicht. Screenshots entstehen in `test-results/`; ausgewählte Ausschnitte liegen in `artifacts/ui-ux-review/`. Die erste Einrichtung ist in der eingerichteten Testdatenbank eine Weiterleitung; das eigentliche Setup-Formular wurde deshalb im Quellcode geprüft.

Die Prüfung verbindet visuelle Stichproben mit automatischen Layout-, Fokus-, Tastatur-, Kontrast- und Workflowprüfungen. Sie ersetzt keinen Nutzertest mit Trainern und keine vollständige Screenreader-/WCAG-Zertifizierung. Erfolgreiche Dictionary-Schlüsselprüfung bedeutet ausdrücklich keine vollständige Übersetzung der Fachseiten. Die Browserdatenbank ist eine isolierte Kopie des Initial-Snapshots; produktive Daten und Medienfreigaben werden nicht verändert.

## In dieser Runde behoben

| Befund | Änderung | Absicherung |
| --- | --- | --- |
| Benutzeranlage verbreitert Tablet-Seiten auf 920 px bei 768 px Viewport. | Zweispaltiges Formular auf Tablets, vier Spalten erst auf großen Screens; Felder verwenden den gemeinsamen Control-Standard. | Zusätzliche Admin-Routenprüfung bei allen drei Breiten. |
| Rollen-/Rechtetabelle verbreitert die mobile Seite auf 643 px; Checkboxen sind unbeschriftet. | Fieldset darf schrumpfen; Tabelle bleibt in benannter, tastaturfokussierbarer Scrollregion. Checkboxen erhalten Bereich-/Rechtestufe als Namen und Tabellenköpfe `scope`. | Zusätzliche Admin-Routenprüfung bei 390/768/1440 px. |
| Unlayered `font: inherit` überschreibt Utility-Typografie an Buttons, Links und Controls. | Redundanten globalen Reset entfernt; Tailwind-Preflight und Utility-Layer übernehmen die vorgesehene Typografie. | Browser prüft Gewicht und Größe der gemeinsamen Primäraktion. |
| Button-Basis setzt `outline-none` und widerspricht der globalen Fokusregel. | Gemeinsame Button-Basis erhält explizite 2-px-Fokuslinie mit Abstand. | Playwright prüft berechneten Outline-Stil; statisches Gate prüft den zentralen Token. |
| Weiß auf Coral unterschreitet normalen Textkontrast. | Dunkler `--brand-foreground` in beiden Themes; Coral bleibt erhalten. | Kontrastprüfung umfasst Primärfarbe und Hover, Accent, Warnung und Fehler in Light/Dark. |
| 31 identische Feldklassen in neun Fachmodulen umgehen den gemeinsamen Control-Standard. | Gruppen, Outdoor, AI-Einstellungen, Übungseditoren, Medien und Trainingsprogrammierung verwenden `formControlClass`. | TypeScript, UI-Gate und responsive Routenprüfung. |
| Titel/Beschreibung von Auswahlkarten laufen horizontal ineinander. | Gemeinsamer `choiceButtonClass` stapelt beide Texte in Wizard und Builder. | Geometrieprüfung im tastaturbedienten Zielgruppen-Workflow. |
| Dialog-Schließen bleibt bei englischer UI deutsch; Fokus-Effekt läuft vor Portal-Mount. | DE/EN-Schlüssel für Schließen; Fokus-/Scroll-Effekt startet erst nach Mount. | Englischer Dialogtest sowie bestehende Escape-/Fokus-Rückgabeprüfung. |

## Befunde mit Abnahmekriterien

| ID / Priorität | Befund und Auswirkung | Beleg / betroffene Module | Abnahme |
| --- | --- | --- | --- |
| UX-01 / P1 | Fachseiten bleiben nach Sprachwechsel weitgehend deutsch. Gemischte Sprache betrifft Planung, Fehler und Sicherheit. | `dictionaries.ts` enthält überwiegend Shell-/Tourtexte; Hardcodings in Dashboard, Wizard, Builder, Katalogen und Admin. | Feature-Dictionaries für DE/EN; jede Route inkl. Leer-/Fehler-/Ladezustand in beiden Sprachen testen. Servertexte benötigen einen expliziten Locale-Vertrag. |
| UX-02 / teilweise umgesetzt | Unfertige Planungen gehen bei Reload/Navigation verloren. „Noch nicht gespeichert“ erklärt den Zustand, bietet aber keine Wiederherstellung. | Wizard, Quick Planner und Builder halten Eingaben/Entwürfe in React-State. Builder hat bereits Undo für bestimmte Entwurfsänderungen. | Versionierte, validierte Entwurfswiederherstellung mit sichtbarem Speicherzustand; Wiederherstellen/Verwerfen anbieten; explizites Speichern/Freigeben bleibt Trainerentscheidung. |
| UX-03 / erledigt | Harte Validierungsfehler und Empfehlungen erscheinen gemeinsam im gelben Panel; der Zähler nutzt selbst bei Problemen grüne Erfolgsfarben. | `training-draft-preview.tsx`; Domäne unterscheidet bereits `severity: warning/error`. | Fehlerpanel mit benannten Blockern getrennt von Empfehlungen; Statuszähler zählt Fehler/Warnungen getrennt; vorhandene serverseitige Sperren bleiben erhalten. Test mit gemischten Schweregraden. |
| UX-12 / erledigt | Mobile Trainingsdetails zeigen zuerst Versionen und Vereinsvorlagen; Dauer und Phasen liegen weit unterhalb des ersten Bildschirms. | Screenshot `training-detail-mobile.png`; `training/[id]/page.tsx` rendert diese Verwaltungsbereiche vor dem Training. | Gruppe/Alter, Gesamtdauer und drei Phasen direkt am Anfang; kompakte Übersicht beim Scrollen erhalten; Versionen/Vorlagen in sekundäre Disclosure-Bereiche. |
| UX-04 / erledigt | Builder-Einstieg, Medien-/Spielanlage und bekannte automatisch erzeugte Beschreibungstexte sind vereinfacht. | `BuilderWorkspace`, `BuilderSourcePicker`, `GameCreationForm`, `MediaWorkflowCopy`, `TrainingNotes`; Nachprüfung unten. | Eine aktive Planungsansicht; fachliche Einstiegstexte, zusätzliche Details auf Wunsch und unveränderte Sicherheits-/Freigabeinformationen. Vollständige Fachseiten-Übersetzung bleibt UX-01. |
| UX-05 / erledigt | Mobile Filter waren zuerst vollständig offen, Übungen luden standardmäßig 80 Karten. | Gemeinsames Filterpanel auf neun Katalogseiten; Nachprüfung unten. | Mobil eingeklappt mit angewendetem Filterzähler; Übungen starten mit 20 Einträgen; mobile Seitennavigation bleibt erreichbar und verdeckt den Tastaturfokus nicht. |
| UX-06 / erledigt | Mobile Hauptnavigation konnte das aktive Ziel außerhalb des sichtbaren Bereichs lassen; eine Übersicht fehlte. | `primary-navigation.tsx`; Nachprüfung unten. | „Alle Ziele“ mit DE/EN-Übersicht, aktives Ziel bei Routenwechsel/Resize sichtbar; Tastatur, Touch und Zurück geprüft. |
| UX-07 / erledigt | Hinweise standen innerhalb des Labels und waren nur 20 px groß; Beschreibungsverknüpfung und Escape fehlten. | `ui/form-field.tsx`; Nachprüfung unten. | Separate 44-px-Buttons, stabile Control-/Beschreibungs-IDs, erhaltene Fehlerverknüpfung; Touch, Tastatur, Escape und Viewportgrenzen geprüft. |
| UX-08 / erledigt | Admin verwendete für Seitenlinks ein unvollständiges ARIA-Tabs-Pattern. | `admin-tabs.tsx`; Nachprüfung unten. | Benannte Linknavigation mit `aria-current`; URL-Wechsel, Outdoor-Link und Zurück-Funktion geprüft. |
| UX-09 / erledigt | Gemeinsame Route-Zustände und unterscheidbare Seitentitel fehlten. | `app/loading.tsx`, `error.tsx`, `global-error.tsx`, `config/route-titles.ts`; Nachprüfung unten. | DE/EN-Laden/Retry, providerunabhängiger globaler Fallback, 26 Routentitel und erhaltene validierte Planungseingaben geprüft. |
| UX-10 / P2 | Lokale Cards, Fehlerpanels und kleine Controls weichen weiterhin vom Designsystem ab. | Maintainability-Inventar meldet weiterhin 30 häufige Duplikatgruppen; `FormMessage`/`Alert` pflegen ähnliche Tonzuordnung. | Häufige echte Muster in `Card`, Feedback und Controls konsolidieren; reine Layout-Klassen nicht künstlich abstrahieren. Touchziele und Drucklayout separat prüfen. |
| UX-11 / erledigt | Direkter Rückweg und Feedback bei Vollbildfehlern fehlten. | `training-presentation-toolbar.tsx`, `training-presentation-controls.tsx`; Nachprüfung unten. | DE/EN-Rückweg, Inline-Feedback, echte Vollbildwechsel, Retry und Drucken bei fehlender API geprüft. |

## Routen- und Aufgabenreview

| Bereich / Routen | Bewertung |
| --- | --- |
| Dashboard `/` | Deutliche Quick-Create-Aktion und brauchbare leere Zustände. Viele Kennzahlen verdrängen auf Mobilgeräten das nächste Training; priorisierte „Nächste Einheit“ prüfen. |
| Training `/training`, `/training/templates` | Einheitliche Ansichten/URL-Filter/Pagination. Excel-Import steht vor der eigentlichen Liste; als sekundären Importbereich einklappen. Leere Trainingsliste führt sinnvoll zum Erstellen. |
| Planung `/quick-create`, `/training/builder` | Zielgruppe, Dauer, Equipment und Alter werden erfasst; bestehende Tests prüfen Kids-Grenzen und tatsächliches Speichern. Auswahlkarten korrigiert. Wiederherstellung, Planungsmodi und Fehlerhierarchie bleiben offen. |
| Training `/training/[id]`, `/combine` | Phasen, Dauer und Bearbeiten/Ersetzen sind vorhanden, liegen mobil aber hinter Versionen/Vorlagen (UX-12). Konsistenz der lokalen Panels und serverseitiger Rückmeldungen weiter abbauen. Kombination erzeugt einen neuen Entwurf. |
| Durchführung `/training/[id]/trainer`, `/print` | Phasen, Übungsanleitung und Dauer werden wiederverwendet. Rückweg und Vollbildfehler verbessern. Druckansicht zusätzlich auf Papier/PDF manuell prüfen; Browser-Screenshot belegt keinen Seitenumbruch. |
| Übungen `/exercises`, `/[id]`, `/new`, `/[id]/edit` | Suche, Facetten, Details und Bearbeitung sind vorhanden. Umfangreiche Editorbereiche sind fachlich wertvoll; mit Zusammenfassung und kontextuellen Aktionen schneller scannbar machen. Lokale Feldklassen konsolidiert. |
| Spiele `/games`, `/games/new` | Wiederverwendung des Übungseditors reduziert Parallelstrukturen. Zwei Schritte werden erklärt; technische Typ-Erklärung aus normalem Trainertext entfernen. |
| Hindernisse `/obstacles` | Zuordnung liegt außerhalb der Suchfilter; Review bleibt eine explizite Handlung. Geometrie-/Medienfreigabe weiterhin fachlich prüfen, nicht aus Darstellung ableiten. |
| Gruppen `/groups`, `/groups/safety-profiles` | Such-/Altersfilter und Schutzprofile sind strukturiert. Hard-Constraints müssen bei jeder UI-Vereinfachung sichtbar und unverändert wirksam bleiben. Feldstile konsolidiert. |
| Medien `/media`, AI-Entwürfe `/exercises/ai-drafts`, Outdoor `/admin/outdoor-variants` | Freigabe und Vorschlag sind getrennte Handlungen; kritische Aktionen haben Bestätigung. Mobile Filter, lange Verwaltungsbereiche und technische Sprache bremsen Review. |
| Admin `/admin` (alle Tabs), `/admin/users/[id]/edit` | Themen getrennt, kritische Datenoperationen bestätigt, Profilfehler feldbezogen. ARIA-Navigation korrigieren; technische Fachlichkeit hier passend, aber konsequent übersetzen. |
| Hilfe `/help` | Routenspezifische Touren mit Tastatur/Escape und DE/EN vorhanden; Tour ersetzt keine klare primäre Aktion auf der eigentlichen Seite. |
| Zugang `/login`, `/setup` | Beschriftete Standardfelder und Fehlermeldungen vorhanden. Deutsche Texte/Validierung noch nicht durchgängig im Dictionary; Setup im bereits eingerichteten System umgeleitet. |

## Reihenfolge für die nächste Umsetzung

1. Wiederherstellbare Planungsentwürfe (UX-02).
2. Feature-Dictionaries im Trainerfluss beginnen, anschließend Katalog/Admin (UX-01).
3. Mobile Filter/Seitengrößen/Navigation, Hinweise und Admin-Semantik (UX-05–08).
4. Lade-/Fehlergrenzen, Routentitel und verbleibende Komponentenvereinheitlichung (UX-09–11).

## Prüfprotokoll

| Prüfung | Ergebnis |
| --- | --- |
| `npm run check:ui` | Bestanden, 390 Quelldateien. |
| `npm run check:architecture` | Bestanden, 390 Quelldateien / 10 Runtime-Abhängigkeiten. |
| `npm run typecheck` und TypeScript im finalen Build | Bestanden. |
| `npm test -- --run` | 80 Testdateien / 270 Tests bestanden. |
| `npm run lint` | Keine Fehler; bestehende Warnung zum ungenutzten Parameter `index` in `training-excel-service.ts:248`. |
| `npm run build` | Finaler Produktionsbuild bestanden. |
| Vollständiger Browserlauf | 71/71 Tests bestanden, vor der letzten visuellen Nachkorrektur. |
| Nachprüfung gemeinsamer UI-Korrekturen | 9 Tests bestanden: Tastatur-/Auswahlkartenlayout, Farben, Fokus/Typografie, DE/EN-Dialog, 17 Routen × 3 Breiten und beide Speichern-Workflows. |
| Erweiterter Detail-/Adminlauf nach Layoutkorrekturen | 1/1 bestanden: 16 Routen/Zustände × 3 Breiten, Status/H1/Viewport und benannte Berechtigungscontrols. |
| Maintainability-Inventar | 390 Source-/152 UI-Dateien; weiterhin 30 häufige Duplikatgruppen, 1 Raw-Button-Datei, 0 wahrscheinlich ungenutzte Exporte. |

Die beiden neuen Admin-Überläufe wurden von der erweiterten Browserprüfung entdeckt und vor dem erfolgreichen Endlauf korrigiert. Damit sind 99 responsive Routen-/Breitenkombinationen geprüft. Die Suite enthält jetzt 72 Tests; die Ergebnisse stammen aus dem vollständigen 71er-Lauf und den beschriebenen gezielten Nachprüfungen, nicht aus einem weiteren vollständigen 72er-Lauf.

Die ersten Sandbox-Läufe scheiterten an Windows-Dateizugriffen für Vitest/Next.js. Mit freigegebenem Dateizugriff liefen Tests und Build erfolgreich. Keine Datenbankmigration und keine Medienfreigabe wurden vorgenommen.

Prüfbilder: [`artifacts/ui-ux-review/README.md`](../artifacts/ui-ux-review/README.md).


## Nachbereitung: UX-03

Die gemeinsame Trainingsvorschau trennt blockierende Validierungsfehler und Empfehlungen oberhalb der Phasenkarten. Der Status zählt beide Schweregrade und Composer-Hinweise; Erfolg erscheint nur ohne Fehler und Hinweise. Fehler werden als Alert angekündigt, Details stehen in getrennten benannten Bereichen. Status- und Erstellungsrückmeldungen besitzen DE/EN-Dictionarytexte. Quick Create und Builder bestätigen die Erstellung neutral und fordern zur Prüfung vor dem Speichern auf. Die serverseitigen Regeln und die explizite Trainerentscheidung bleiben erhalten.

Vier neue Komponententests prüfen gemischte Schweregrade, Composer-Hinweise ohne Validierungsfehler, den sauberen Zustand und englische Beschriftung. Der mobile Browsertest speist gezielt gemischte Meldungen ein und prüft Trennung, Zähler, responsive Breite und Sprachwechsel. Die übrigen offenen Befunde bleiben gültig.

Nachprüfung UX-03 bestanden: 274 Unit-/Integrationstests (81 Dateien), vier gezielte Browsertests (Quick-Create-/Builder-Speichern, Kids-Altersgrenze und mobile DE/EN-Validierung), finaler Build, TypeScript, UI-/Architekturgate. Lint hat weiterhin ausschließlich die zuvor dokumentierte Warnung. [Prüfaufnahme](../artifacts/ui-ux-review/validation-mixed-mobile.png).


## Nachbereitung: UX-12

Die Trainingsdetailseite beginnt mit einer kompakten haftenden Übersicht: Plan- und Zieldauer, Zielgruppe/Alter aus dem gespeicherten Generierungskontext sowie direkte Phasenlinks mit Dauer. Nicht hinterlegter Planungskontext wird benannt; aktuelle Vereinsgruppen-Defaults werden nicht als historische Trainingsdaten ausgegeben. Die Übersicht und Linkbeschriftungen sind DE/EN-fähig. Die Header-/Übersichtshöhen werden bei Größenänderungen gemessen, damit Sprungziele sichtbar unter beiden Bereichen landen.

Übungsphasen stehen vor der Verwaltung. Einstellungen, Versionen und Vereinsvorlagen bleiben über native, initial geschlossene Disclosure-Bereiche erreichbar. Der Schreibschutzhinweis für archivierte Einheiten bleibt vor dem Training sichtbar. Serveraktionen und Sicherheitsregeln wurden nicht verändert.

Nachprüfung UX-12 bestanden: 274 Unit-/Integrationstests; responsive Browserprüfung bei 390/768/1440 px mit sichtbaren Phasensprungzielen und zugänglichen Versions-/Vorlagenformularen; beide bestehenden Generierungs-/Speichern-Workflows; finaler Build, TypeScript und UI-/Architekturgates. Lint hat ausschließlich die dokumentierte bestehende Warnung. [Prüfaufnahme mobil](../artifacts/ui-ux-review/phase-overview-390.png).


## Nachbereitung: UX-02, Quick-Create-Eingaben

Quick Create sichert geänderte Planungseingaben nach kurzer Verzögerung im lokalen Browser-Speicher. Die Oberfläche unterscheidet Sichern, Gesichert, Wiederhergestellt und Nicht verfügbar. Beim erneuten Öffnen werden Eingaben ausschließlich nach „Planung wiederherstellen“ übernommen; „Lokale Planung verwerfen“ entfernt die Sicherung. Initialwerte überschreiben eine gefundene Sicherung nicht automatisch. Explizites Trainingsspeichern entfernt die lokale Kopie.

Die Version-1-Snapshots werden an einer Zod-Grenze geprüft, auf 128.000 Zeichen begrenzt und bei inkompatiblen oder beschädigten Daten zurückgewiesen. Generierte Vorschläge, gespeicherte IDs und Freigaben sind kein Teil des Wiederherstellungsformats. Nach Restore muss der Trainer einen neuen Vorschlag erzeugen und prüfen. Storage-/Quota-Fehler blockieren die Planung nicht; Texte stehen in DE/EN bereit.

Das ist ein Teilschritt: die Wiederherstellung bearbeiteter Vorschläge sowie der Eingaben in Builder und Quick Planner bleibt ausdrücklich offen. Noch laufende Sicherungen sind am Status erkennbar; für verlässliche Wiederaufnahme den Status „gesichert“ abwarten.

Nachprüfung dieses Teilschritts: 277 Unit-/Integrationstests (82 Dateien), fünf gezielte Browsertests (Restore/Discard/Speichern, beschädigte Daten, Storage-/Quota-Fehler sowie beide bisherigen Speichern-Workflows), finaler Build, TypeScript und UI-/Architekturgates bestanden. Lint meldet ausschließlich die bekannte Warnung in `training-excel-service.ts:248`.


## Nachbereitung: UX-02, Builder und Quick Planner

Die Eingabewiederherstellung ist jetzt in Quick Create, Builder und Quick Planner vorhanden. Alle drei verwenden dieselbe versionierte Snapshot-Grenze, denselben Hook und dieselbe DE/EN-Anzeige für Sichern/Gesichert/Wiederherstellen/Verwerfen/Fehler. Beschädigte oder zu große Daten werden abgewiesen; freigegebene Vorschläge, Trainings-IDs und Freigabeflags werden nicht wiederhergestellt. Explizites Trainingsspeichern entfernt die zugehörige Sicherung.

Builder-Sicherungen sind nach Ursprungstraining und Einstiegsmodus getrennt; ein Wechsel des Quellen-/Moduskontexts setzt den Editor kontrolliert neu auf. Zirkeldaten, Hauptteilanzahlen und -programmierung sowie explizite Hinderniseinschränkungen werden beim Restore beibehalten. Quick Planner besitzt einen eigenen Sicherungsschlüssel und verwendet weiterhin den aktuellen geladenen Equipment-Bestand. Ein Wiederherstellen übernimmt keine Vorschläge; Generierung, aktuelle Sicherheitsprüfung und explizites Speichern bleiben nötig.

Offen bleibt ausschließlich der weitere UX-02-Teilschritt für bereits erzeugte oder bearbeitete Vorschläge. Dieser Abschluss ersetzt den älteren Zwischenstand, nach dem Builder-/Quick-Planner-Eingaben noch nicht wiederherstellbar waren.

Nachprüfung bestanden: 281 Unit-/Integrationstests (83 Dateien), sieben gezielte Browsertests (Builder-/Quick-Planner-Restore, Modusisolation, mobiles Layout, Backup-Löschung, Quick-Create-Regressionen und beide bisherigen Speichern-Workflows), Produktionsbuild inklusive TypeScript sowie UI-/Architekturgates. Lint meldet weiterhin ausschließlich die bekannte Warnung in `training-excel-service.ts:248`.


## Nachbereitung: Geländewahl und erhaltene Feldhilfe

Quick Create, Quick Planner und detaillierter Builder verwenden denselben DE/EN-Geländepicker mit explizitem Label und verknüpftem Hilfetext. Bekannte Gesamtmaße und die 400-m-Laufbahn werden von unbekannter nutzbarer Fläche, Geräten und Freizonen getrennt. Auswahl setzt Outdoor und wird als Eingabe wiederhergestellt; eine Geländewahl verleiht keine fachliche Sicherheitsfreigabe.

Die Browserprüfung deckte einen globalen Accessibilityfehler auf: `FormValidation` entfernte bei jeder gültigen Feldänderung `aria-describedby`, auch ohne zuvor selbst eine Fehlermeldung erzeugt zu haben. Dadurch gingen bestehende Hilfetextverknüpfungen verloren. Die Korrektur verwaltet eigene Fehler-IDs pro Feld und entfernt ausschließlich deren Meldung und Beschreibungs-ID; andere Hilfetexte und nicht von dieser Validierung gesetzte Fehlerzustände bleiben erhalten. Die touchfähigen/schließbaren Feldhinweise und übrigen UX-07–09-Punkte bleiben getrennt offen.

Nachprüfung: sechs gezielte Browserfälle nach Wiederholung umgebungsbedingt unterbrochener Fälle bestanden. Alle drei Picker wurden bei 390 px ohne Dokumentüberlauf, mit DE/EN-Texten und erhaltenem Hilfelink nach Auswahl/Restore geprüft; ein zusätzlicher nativer Validierungsfall prüft das Entfernen nur des eigenen Fehlers. Generieren/Speichern/erneutes Laden erhält die Geländewahl. [Visuell geprüfter mobiler Quick-Create-Ausschnitt](../artifacts/ui-ux-review/club-venue-quick-create-mobile.png).


## Nachbereitung: UX-06, mobile Navigation

Stand: 9. November 2026. Die mobile Leiste erhält einen dauerhaft sichtbaren Auslöser „Alle Ziele“ / „All destinations“. Die Übersicht verwendet den bestehenden Dialog und dieselben Hauptziele einschließlich Administration und Hilfezentrum; aktive Links sind mit `aria-current` markiert. Quick Create gehört zum Trainingsbereich; AI-Entwürfe und Outdoor werden von ihren übergeordneten Katalog-/Adminzielen abgegrenzt, sodass genau ein aktives Ziel erscheint.

Beim Routenwechsel und bei Größenänderung wird ausschließlich die horizontale Leiste so weit verschoben, dass der aktive Eintrag vollständig sichtbar bleibt. Seitenposition und Fokus werden dabei nicht verändert. Der Dialog schließt bei Navigation sowie beim Wechsel zur Desktopbreite. Escape, Fokusbegrenzung und Fokus-Rückgabe übernimmt der gemeinsame Dialog. Die Desktopnavigation bleibt im vorhandenen Layout.

Nachprüfung: 352 Unit-/Integrationstests (97 Dateien), Typecheck, Produktionsbuild, UI-/Architekturgate bestanden. Lint hat keine Fehler und weiterhin nur die bekannte Warnung in `training-excel-service.ts:248`. Drei gezielte Playwright-Fälle bestanden: aktive Ziele auf vier Routen inklusive Quick Create und verschachtelter Ziele, alle elf Menülinks, Escape/Tab/Fokus-Rückgabe, tatsächliche Navigation und Browser-Zurück sowie DE/EN und 320/390/1440 px. Die vollständige E2E-Suite wurde in diesem Schritt nicht wiederholt. [Visuell geprüfte mobile Navigation](../artifacts/ui-ux-review/mobile-navigation.png). UX-05 (Filter/Seitengrößen) bleibt offen.


## Nachbereitung: UX-05, mobile Katalogfilter und Seitenlänge

Stand: 9. November 2026. Das gemeinsame Filterpanel auf Übungen, Spielen, Hindernissen, Gruppen, Medien, Trainings, Vorlagen, AI-Entwürfen und Outdoor-Review startet unter 1024 px geschlossen. Am Desktop startet es offen. Beide Ansichten behalten ihren eigenen Öffnungszustand; die Formularfelder bleiben beim Schließen gemountet, damit noch nicht angewendete Eingaben erhalten bleiben. Ein vollbreiter nativer Button verknüpft den Inhalt mit `aria-controls` und meldet `aria-expanded`; neue Steuerungs- und Zählertexte sind DE/EN-fähig. Die bestehenden fachseitigen Feldtexte bleiben Teil der offenen Dictionary-Arbeit.

Die stets sichtbare Anzahl zählt angewendete Kriterien, nicht ungespeicherte Eingaben. Suche und Auswahlfilter zählen jeweils einmal, ausgewählte Körperregionen/Facetten jeweils pro eindeutiger Auswahl. Seitenzahl, Seitengröße, Rückmeldungen und beim Reset beibehaltene Archiv-/Historienbereiche zählen nicht mit. Die Route liefert den Zähler aus ihren normalisierten Filtern; das Panel interpretiert keine beliebigen URL-Parameter.

Die Übungsbibliothek startet unabhängig vom Gerät mit 20 statt 80 Einträgen; explizite 40/80/120 bleiben verfügbar und in Seitenlinks erhalten. Andere Kataloge behalten ihre vorhandenen Seitengrößen. Übungen erhalten einen gemeinsamen Reset-Link. Bei mehreren Seiten bleibt `CatalogPagination` unter 1024 px am unteren Bildschirmrand erreichbar; Desktopdarstellung bleibt im Dokumentfluss. Inhaltsabstand und zusätzlicher Scrollabstand schützen letzte Inhalte und Tastaturfokus vor Überdeckung.

Die gezielte Tastaturprüfung fand zunächst eine Überdeckung des fokussierten Filter-Submitbuttons durch die neue Seitennavigation. Der ergänzte Scrollabstand behebt dies; derselbe Test prüft die tatsächliche Geometrie des Fokusziels oberhalb der Leiste. Ein anfänglicher Testlokator wurde ebenfalls korrigiert: Er muss das Toggle nach dem Wechsel von „öffnen“ zu „schließen“ weiterhin identifizieren können.

Nachprüfung: 352 Unit-/Integrationstests (97 Dateien), finaler Produktionsbuild, Typecheck sowie UI-/Architekturgate bestanden. Lint hat keine Fehler und ausschließlich die bekannte Warnung in `training-excel-service.ts:248`. Acht bestehende Browserfälle zu Katalogfiltern und mobilem Overflow bestanden; anschließend bestanden alle drei neuen Fälle am finalen Build: neun Routen mit Filterzählern und Collapse-Verknüpfung, reale Pagination/Reset/Seitengröße, Tastaturfokus sowie erhaltene Eingaben, DE/EN und Größenwechsel bei 320/390/1440 px. Die vollständige E2E-Suite wurde nicht erneut ausgeführt. [Visuell geprüfte mobile Übungsbibliothek](../artifacts/ui-ux-review/mobile-catalog-filters.png).


## Nachbereitung: UX-07/08, Feldhinweise und Adminnavigation

Stand: 9. November 2026. `FormField` ist als kleiner Clientbaustein mit genau einem nativen Control abgegrenzt. Stylingfunktionen bleiben unabhängig in `form-styles.ts`; der bisherige Import aus `form.tsx` funktioniert weiterhin für Server- und Clientmodule. Das Feld vergibt stabile IDs, erhält explizite IDs und bestehende Beschreibungen und verbindet Fehlertexte mit dem Control. Die eine bisher verschachtelte Dauerangabe im Hinzufügen-Formular verwendet nun ein direktes Zahlenfeld mit sichtbarer Minutenangabe im Label; die Trainingseinheit bleibt unverändert.

Hinweisauslöser stehen außerhalb des Labels und verändern dessen zugänglichen Namen nicht. Das 44 × 44-px-Touchziel öffnet einen nativen Auto-Popover per Touch, Enter oder Leertaste. Erneute Betätigung, Escape und Außenklick schließen; Tastaturfokus bleibt am Auslöser bzw. geht beim Außenklick zum gewählten Feld. Die Hinweise bleiben über `aria-describedby` auch bei geschlossenem Popover als Feldbeschreibung verfügbar. Position und Maximalgröße berücksichtigen Viewport, Scrollen und Resize. Das ist eine explizite Bedienung; Hover allein öffnet keine Hilfe.

Adminbereiche sind als benannte Navigation mit normalen Links und genau einem aktuellen Ziel ausgezeichnet. Die irreführenden Rollen `tablist`/`tab` sind entfernt. URL-Parameter, Außenroute Outdoor und Browser-Zurück bleiben erhalten.

Nachprüfung: 354 Unit-/Integrationstests (98 Dateien), davon zwei neue Prüfungen für die Trennung von Label/Beschreibung, vorhandene IDs, Invalid-Zustand und Fehlerverknüpfung. Der finale Testmarkup verwendet JSX und wurde nach einer Lintkorrektur separat erneut geprüft. Produktionsbuild, Typecheck, UI-/Architekturgate sowie Lint ohne Fehler bestanden; ausschließlich die bekannte Warnung in `training-excel-service.ts:248` bleibt. Das statische UI-Gate prüft weiterhin Fokus-/Touch-/Invalid-Stile und semantische Feldfehler an den neuen Modulgrenzen.

Sechs gezielte Playwright-Fälle bestanden: Touch-/Enter-/Leertaste-/Escape-/Außenklick-Bedienung, saubere zugängliche Namen und Beschreibungen, 320/390/1440 px inklusive Viewportgrenzen, DE/EN-Auslöser, erhaltene Hilfe nach nativer Validierung, Admin-Links und Browser-Zurück sowie beide Trainings-Speichern-Workflows. Die vollständige E2E-Suite wurde nicht wiederholt. [Visuell geprüfter mobiler Feldhinweis](../artifacts/ui-ux-review/field-hint-mobile.png). Route-Lade-/Fehlergrenzen und Routentitel (UX-09) bleiben offen.


## Nachbereitung: UX-09, Route-Zustände und Titel

Stand: 9. November 2026. Die gemeinsame Seitenladegrenze verwendet `app/loading.tsx` und `app/error.tsx`. Der Ladezustand benennt Route und laufende Vorbereitung; der Fehlerzustand zeigt eine verständliche, generische Meldung mit erneutem Laden und Rückweg zur Übersicht. Beide sind DE/EN-fähig und benötigen keine Datenbankabfrage. Next.js 16.3 stellt `retry()` für erneutes Refetchen bereit; ein bloßes `reset()` wäre für diese Datenladefehler nicht ausreichend. Erwartete Formular-/API-Fehler bleiben bei ihren bestehenden Rückmeldungen; Schreibaktionen werden nicht automatisch wiederholt. Der globale Fallback besitzt ein eigenes Dokument/Styles und funktioniert auch bei ausgefallenem Root-Sprachprovider; Browser-Sprache und Theme werden dort abgesichert gelesen.

Alle 26 Page-Dateien exportieren Titel aus einer gemeinsamen DE/EN-Routentabelle. Servermetadaten enthalten bereits ohne JavaScript den vollständigen deutschen Titel samt Appkennung. Nach Hydration folgt der Titel der lokalen Sprachwahl, Navigation und Zurück. Später eintreffende gestreamte Metadaten dürfen die Browser-Sprachwahl nicht überschreiben. Die initiale Browserprüfung entdeckte, dass ein Layout-Template nicht auf die Page desselben Segments wirkt; vollständige absolute Titel beheben dies auch vor Hydration. Keine zusätzliche Datenbankabfrage und keine privaten Datensatznamen in Titeln.

Die gemeinsame Planungssicherung schreibt noch ausstehende, bereits committed Eingaben bei `pagehide` oder Unmount zusätzlich, einschließlich Fehler-Unmount. Bestehendes Schema, Größenlimit, Kontextschlüssel, explizites Wiederherstellen und Löschen nach Verwerfen/Speichern bleiben erhalten. Ein angebotenes Backup wird nicht durch Initialwerte überschrieben. Unmount schreibt keinen React-Status; `pagehide` aktualisiert den Speicherstatus für eine mögliche Browser-Zurück-Wiederaufnahme. Gesichert werden weiterhin nur validierte Planungseingaben, keine erzeugten/bearbeiteten Vorschläge oder Freigaben. Bei nicht verfügbarem Storage oder beendetem Browserprozess ist keine vollständige Sicherung garantiert; die Fehlerkopie verspricht dies ausdrücklich nicht. UX-02 für Vorschlagswiederherstellung bleibt offen.

Nachprüfung: 355 Unit-/Integrationstests (99 Dateien), finaler Produktionsbuild, Typecheck und UI-/Architekturgate bestanden. Lint bleibt ohne Fehler und mit der bekannten Warnung in `training-excel-service.ts:248`. Ein finaler Neun-Test-Browserlauf prüfte bestehende Builder-/Quick-Planner-/Quick-Create-Wiederherstellung und Speichern, kaputte/nicht verfügbare Sicherungen, deutsche Titel ohne JavaScript, DE/EN-Titel bei Navigation/Zurück, sofortiges Reload vor dem Debounce sowie echten temporären Datenbank-Timeout mit Ladeanzeige, sicherem Fehler und erfolgreichem Retry plus explizitem Restore. Dafür wurde nur eine eigene temporäre Sperre an der isolierten E2E-Datenbank gehalten und im `finally` entfernt. Anschließend bestand ein zusätzlicher Browserfall am selben Build für Root-Provider-Ausfall durch blockierten Locale-Storage und erfolgreichen Retry nach Behebung. Technische Exception-Texte blieben in beiden Fehleransichten verborgen.

Die vollständige E2E-Suite wurde nicht erneut ausgeführt. [Visuell geprüfter mobiler Fehlerzustand](../artifacts/ui-ux-review/route-error-mobile.png). Die übrigen offenen Reviewpunkte stehen in `plan.md`; UX-04 und UX-11 sind dort nun ausdrücklich aufgeführt.


## Nachbereitung: UX-11, Traineransicht und Vollbild

Stand: 9. November 2026. Die Traineransicht beginnt mit einem direkten Rückweg zur Trainingseinheit und einer eindeutigen Nur-Lesen-Kennzeichnung. Druckansicht und Vollbild verwenden gemeinsame Controls und DE/EN-Texte. Die Trainingsdarstellung und ihre drei Phasen bleiben in derselben Readonly-Komponente.

Vollbild prüft Ziel, API und Browserfreigabe und fängt abgelehnte Ein-/Austritts-Promises ab. Hinweise unterscheiden nicht verfügbares Vollbild, fehlgeschlagenen Eintritt und fehlgeschlagenen Austritt mit Esc-Hinweis. Sie stehen direkt am Control innerhalb des Vollbildelements; globale Toasts außerhalb wären im Vollbild nicht zuverlässig sichtbar. Technische Exception-Texte werden nicht angezeigt. `fullscreenchange` synchronisiert den Zustand auch bei externem Austritt und entfernt überholte Hinweise; `aria-pressed` beschreibt den tatsächlichen Zustand. Laufende Aktionen sind gegen parallele Mehrfachauslösung geschützt. Rückweg und Druckansicht bleiben bei fehlendem Vollbild benutzbar.

Nachprüfung: 355 Unit-/Integrationstests (99 Dateien), Produktionsbuild, Typecheck, UI-/Architekturgates und Lint ohne Fehler bestanden; weiterhin nur die bekannte Warnung in `training-excel-service.ts:248`. Vier gezielte Browserfälle bestanden am selben Build: echte Ein-/Austritte plus externer API-Austritt, abgelehnter Eintritt mit erfolgreichem Retry, abgelehnter Austritt und anschließender Zustandskorrektur ohne ungefangene Browserfehler, fehlende API mit englischen Hinweisen und funktionierendem Printauslöser sowie die bisherige Phasenübersicht. Die drei neuen Szenarien verteilen diese Prüfungen; das vierte ist die bestehende Übersicht. Zwei Fehlerfälle wurden nach Präzisierung der Alert-Lokatoren erneut erfolgreich ausgeführt, weil Next.js zusätzlich seinen eigenen Route-Announcer als Alert auszeichnet.

Responsive Kontrolle umfasst 320/390/768/1440 px; Rücknavigation führt tatsächlich zum gespeicherten Training. Der Printaufruf wurde über eine Browser-API-Attrappe geprüft, kein Papier-/PDF-Layout. Externes Beenden wurde über die echte Fullscreen-API ausgelöst, kein Betriebssystem-Esc-Test. Die vollständige E2E-Suite wurde nicht wiederholt. [Visuell geprüfte mobile Trainerleiste](../artifacts/ui-ux-review/trainer-toolbar-mobile.png). UX-04, UX-01/02 und die weitere UI-Konsolidierung bleiben offen.


## Nachbereitung: UX-04, Builder-Einstieg

Stand: 9. November 2026. Der Builder startet mit einer kompakten DE/EN-Auswahl „Kompakt planen“ / „Detailliert planen“. Es ist nur ein Planungsweg sichtbar und bedienbar. Standard ist kompakt; bestehende `mode=ai|local`- und `source`-Links öffnen weiterhin direkt den detaillierten Weg, sofern kein explizites `planner` gesetzt ist. Auswahlbuttons besitzen eindeutige Namen, Beschreibungen, `aria-pressed` und `aria-controls`.

Der Wechsel aktualisiert über die von Next.js unterstützte native History nur den Ansichtsparameter. Beide Planner-Instanzen bleiben gemountet; Eingaben und bereits erzeugte Vorschläge bleiben beim Wechsel und Browser-Zurück erhalten. Dies ist bewusst keine neue Garantie für Vorschlagssicherung nach Reload oder Navigation auf eine andere Seite; UX-02 bleibt offen. Die bestehenden getrennten Recovery-Schlüssel und serverseitigen Alters-/Equipment-/Sicherheitsprüfungen bleiben unverändert.

Gespeicherte Trainings als Basis stehen in einem standardmäßig geschlossenen Disclosure, bei konkretem Quelltraining offen mit verständlichem Fehlerzustand. Übernehmen/Neu starten erhalten den detaillierten Weg und den passenden Planungsmodus. Die technische Erklärung zur Kombination gespeicherter Parameter wurde durch eine kurze Beschreibung des Trainerergebnisses ersetzt. Planungsweise heißt nun „Ohne KI planen“ bzw. „KI-Vorschlag“ mit kurzen Erklärungen. Die umfangreiche Planungslogik steht eingeklappt nach dem Editor, ohne eine dauerhaft leere Seitenspalte. Die Tour beginnt an der Planungsweg-Auswahl und erreicht den sichtbaren Planer; AI-Aufrufe wurden dafür nicht benötigt.

Nachprüfung: 356 Unit-/Integrationstests (100 Dateien), finaler Produktionsbuild inklusive TypeScript, separater Typecheck, UI-/Architekturgate sowie Lint ohne Fehler bestanden. Die bekannte Warnung in `training-excel-service.ts:248` bleibt. 15 unterschiedliche gezielte Browserfälle bestanden über mehrere Läufe: Erhalt beider Inputs und erzeugter Vorschläge beim Wechsel/Zurück, alte AI-/Quelllinks, DE/EN und Tastatur, Builder-/Quick-Planner-Recovery, reale Speicherung, Kids-Altersgrenzen einschließlich leerem Alters-fünf-Pool, gespeicherte Geländewahl, drei mobile Gelände-Picker, erhaltene Feldhilfe und die aktualisierte Tour. Ein neuer AI-Button-Lokator wurde nach Berücksichtigung seines erklärenden Textes korrigiert; der finale Build ergänzt lediglich die DE/EN-Einheit der Übungsanzahl in Quellenoptionen. Die vollständige E2E-Suite wurde nicht wiederholt.

[Visuell geprüfter mobiler Builder-Einstieg](../artifacts/ui-ux-review/builder-entry-mobile.png), ohne überlagernde Erstellungsbenachrichtigung. Der technische Textreview für Medien-/Spielanlage und generierte Beschreibungen bleibt als Rest UX-04 in `plan.md` offen.


## Nachbereitung: UX-04, verbleibende Trainertexte

Stand: 9. November 2026. Die Spielanlage erklärt zuerst Name/Kurzbeschreibung und die anschließend zu ergänzenden Spielregeln, Material-, Zielgruppen- und Sicherheitsangaben. Die technische Typ-Erklärung entfällt. `GameCreationForm` verwendet weiterhin dieselbe Serveraktion und den festen Typ `game`; der anschließende vollständige Editor bleibt erhalten.

Medienaktionen heißen „Mehrere Bilder bearbeiten“, „Aktion für die Auswahl“ und „Fortschritt der Bilderstellung“. Suchfelder nennen Übungen/Kategorien statt interner Seed-Begriffe; Suchparameter und Suchfunktion bleiben unverändert. Bildserien, technische Exportlinks und deren Fortschritt stehen in einem standardmäßig geschlossenen Disclosure. Hinweise auf unbrauchbare externe Bilder, Lizenzen, Quellen, Einwilligungen sowie Freigabe- und Bestätigungsaktionen bleiben außerhalb dieser Exportdetails erhalten. Auswahlfehler und Einrichtungshinweise sind vereinfacht, ohne Aktionen oder Rechteprüfungen zu ändern. Neue Einstiegstexte und Suchplatzhalter unterstützen DE/EN; andere Fachseitenfelder bleiben Gegenstand von UX-01.

Vorschauen benennen KI-/Nicht-KI-Vorschläge und fordern zur Prüfung von Auswahl, Belastung und Sicherheit auf. Die Formulierung behauptet keine pauschale fachliche Freigabe sämtlicher Katalogdaten. Eine exakt bekannte technische Informationsmeldung wird verständlich angezeigt; die Liste, Anzahl und Schwere der Validierungs-/Sicherheitsmeldungen bleiben erhalten.

`TrainingNotes` zeigt für drei exakt bekannte automatische Erstellungsnotizen eine verständliche Zusammenfassung. Die Originaltexte bleiben unverändert in Datenbank und Exportdaten und sind auf Detail-/Trainer-/Druckseiten unter „Erstellungsdetails“ einsehbar. Diese technischen Details sind im Druck ausgeblendet; die Zusammenfassung bleibt sichtbar. Andere Notizen, angehängte Ergänzungen und Quellen-/Vorlagennotizen werden nicht anhand einzelner Wörter umgeschrieben. Auch Trainertexte mit „deterministisch“ bleiben wörtlich erhalten. Es gab keine Datenmigration oder Änderung an gespeicherten Nutzertrainings.

Nachprüfung: 359 Unit-/Integrationstests (101 Dateien), Produktionsbuild, Typecheck, UI-/Architekturgate und Lint ohne Fehler bestanden; ausschließlich die bekannte Warnung in `training-excel-service.ts:248` bleibt. Drei neue Unitfälle prüfen exakte Systemtext-Zuordnung, Originalerhalt, eigene/ergänzte/leere Notizen sowie unveränderte Sicherheitsmeldungen. Neun unterschiedliche gezielte Browserfälle bestanden über Hauptlauf und Nachprüfung: tatsächliche Spielanlage mit weiterhin gespeichertem Typ `game`, DE/EN-Texte, Medienbestätigung mit Rechte-/Quellenhinweis und Abbrechen, weiterhin erreichbare Exporte, verständliche Vorschau, gespeicherte Notizen mit Originaldetails und Print-Ausblendung sowie bestehende Medien-Tour-/Fokus-, Trainings-Speicher- und Alters-fünf-Blockerfälle. Der neue Medien-Lokator wurde auf die zugängliche Feldbeschriftung präzisiert. Die drei neuen Szenarien wurden für die abschließende visuelle Kontrolle nochmals erfolgreich geprüft; die vollständige E2E-Suite wurde nicht erneut ausgeführt.

Mobile Prüfansichten: [Spielanlage](../artifacts/ui-ux-review/game-creation-copy-mobile.png), [Medienaktionen](../artifacts/ui-ux-review/media-copy-mobile.png), [Trainingsnotiz](../artifacts/ui-ux-review/training-copy-mobile.png). Die Medienprüfung enthält zusätzlich eine 320-px-Überlaufkontrolle. UX-04 ist damit abgeschlossen; vollständige Übersetzungen und UI-Konsolidierung bleiben separat offen.
