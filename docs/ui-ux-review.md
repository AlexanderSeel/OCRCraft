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
| UX-04 / P2 | Viele technische Erläuterungen stehen vor dem eigentlichen Trainerziel. Builder bietet Quick Planner, Quellenauswahl und detaillierten Builder untereinander. | Builder, Medienseite, Spielanlage; Begriffe wie „deterministisch“, „Seed-Key“, „Algorithmus“. | Eine klare Startentscheidung im Builder; technische Details in Hilfe/Details; Titel, Gruppe, Dauer und nächste Aktion zuerst. |
| UX-05 / P2 | Mobile Kataloge benötigen sehr viel Scrollen; Filter sind zuerst vollständig offen, Übungen laden standardmäßig 80 Karten. | `filter-side-panel.tsx`, `exercises/page.tsx`; mobiler Übungsscreenshot ist ca. 27.700 px hoch. | Kleinere Standardseitengröße prüfen; mobile Filter mit sichtbarem aktiven Filterzähler einklappbar; Ergebnis-/Seitennavigation ohne Zurückscrollen erreichbar. |
| UX-06 / P2 | Mobile Hauptnavigation ist eine horizontale Leiste ohne erkennbare Übersicht aller Ziele; aktiver Eintrag kann außerhalb des sichtbaren Bereichs liegen. | `primary-navigation.tsx`; Screenshots Gruppen/Medien/Builder. | Aktives Ziel beim Routenwechsel sichtbar machen; eindeutig beschriftete Möglichkeit zur Übersicht aller Ziele. Tastatur und Touch beibehalten. |
| UX-07 / P2 | Feldhinweise sind nur 20 px groß, stehen innerhalb des Labels und erweitern dadurch dessen zugänglichen Namen; eine explizite Beschreibung-Verknüpfung fehlt; Hover-/Fokus-Popups besitzen kein Escape-Verhalten. | `FormField` / `FieldHint` in `ui/form.tsx`. | Touchfähiger Hinweis-Auslöser, stabile IDs/`aria-describedby`, schließbar per Escape; keine Überdeckung am rechten Rand. Feldlabel und Fehlerverknüpfung erhalten. |
| UX-08 / P2 | Admin verknüpft Seiten, verwendet aber ARIA-Tabs ohne `aria-selected`, Panelbeziehung oder Pfeiltastennavigation. | `admin-tabs.tsx`. | Als normale beschriftete Linknavigation auszeichnen oder vollständiges Tabs-Pattern implementieren; URL-Navigation und Zurück-Funktion testen. |
| UX-09 / P2 | Einheitliche Route-Lade-/Fehlergrenzen fehlen; allgemeiner Seitentitel ist auf allen Routen gleich. | Keine `loading.tsx`/`error.tsx` im App-Verzeichnis; globale Metadaten in `layout.tsx`. | Passende Lade-/Retry-Zustände an Datenladegrenzen und aussagekräftige Routentitel; auf erhaltenen Eingaben nach Fehler achten. |
| UX-10 / P2 | Lokale Cards, Fehlerpanels und kleine Controls weichen weiterhin vom Designsystem ab. | Maintainability-Inventar meldet weiterhin 30 häufige Duplikatgruppen; `FormMessage`/`Alert` pflegen ähnliche Tonzuordnung. | Häufige echte Muster in `Card`, Feedback und Controls konsolidieren; reine Layout-Klassen nicht künstlich abstrahieren. Touchziele und Drucklayout separat prüfen. |
| UX-11 / P2 | Traineransicht bietet Druck/Vollbild, aber keinen direkten Rückweg zur bearbeitbaren Einheit; Vollbildfehler haben kein Feedback. | `training/[id]/trainer/page.tsx`, `training-presentation-controls.tsx`. | Sichtbarer Rückweg; fehlende/abgelehnte Vollbild-API verständlich behandeln; Traineransicht bleibt benutzbar. |

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
