# OCRCraft UI-Komponenten

OCRCraft verwendet eine lokale, Tailwind-kompatible UI-Schicht. Sie ist bewusst unabhängig von Tailgrids-Laufzeitcode; semantische Tokens, deutsche Standardtexte, Fokusregeln und Serveraktionen bleiben im Projekt kontrolliert.

> HyperUI dient als dokumentierte Tailwind-CSS-v4-Referenz. Verwendete Muster
> werden lokal übernommen und stehen unter dem [MIT-Lizenzhinweis](./hyperui-migration.md).

## Bausteine

| Verantwortung | Komponente | Verwendung |
| --- | --- | --- |
| Overlay / Popover | `Dialog`, `ExerciseFilterPopover` | Fokusfalle, Escape, Backdrop-Schließen, Scroll-Lock und Fokus-Rückgabe |
| Bildvorschau | `ImageLightbox` | Lupen-Overlay, zugängliche Großansicht, Escape-/Backdrop-Schließen und Fokus-Rückgabe |
| Form-Felder | `FormField`, `FieldHint`, `FormMessage`, `FormActions`, `PrimaryFormButton`, `formControlClass` | Explizite Labels, Pflichtmarkierung, touch-/tastaturfähige Hinweise, verknüpfte Fehler und konsistente Controls |
| Button-Adapter | `buttonClass`, `choiceButtonClass`, `buttonBaseClass`, `buttonVariantClass` | Gemeinsame Fokus-/Touch-/Statusregeln; `choiceButtonClass` stapelt Titel und Beschreibung von Auswahlkarten |
| Pagination | `CatalogResultCount`, `CatalogPagination` | URL-basierte Ergebniszähler; unter 1024 px bei mehreren Seiten fest erreichbare Navigation mit Inhalts-/Fokusabstand, am Desktop im Dokumentfluss |
| Katalogfilter | `CatalogFilterPanel`, `FilterSidePanel` | Mobil initial geschlossen, Desktop initial offen; DE/EN-Auslöser mit `aria-expanded`/`aria-controls`, angewendeter Filterzähler, erhaltene Formularwerte |
| Adminbereiche | `AdminTabs` | Benannte Linknavigation mit `aria-current`, URL-Navigation und responsivem Overflow |
| Sidebar | `CollapsibleSidebar` | persistierter Desktop-Zustand, beschriftete Toggle-Aktion und Hauptnavigation |
| Toast | `ToastProvider`, `useToast` | `aria-live`, Loading-/Erfolgs-/Info-/Fehlerzustände, Auto-Dismiss und manuelles Schließen |
| Feedback / Empty State | `Alert`, `EmptyState` | Semantische Erfolgs-/Warn-/Fehlerhinweise und konsistente leere Zustände |
| Route-Zustände | `RouteLoading`, `RouteError`, `RouteErrorContent` | DE/EN-Ladezustand, sicherer Retry ohne Datenbankabfrage im Fallback und unabhängiger globaler Fehlerzustand |
| Traineraktionen | `TrainingPresentationToolbar`, `TrainingPresentationControls` | Direkter Rückweg, Druckansicht, DE/EN-Druck-/Vollbildaktionen, Inline-Fehler und Zustand aus `fullscreenchange` |
| Builder-Einstieg | `BuilderWorkspace`, `BuilderSourcePicker` | Explizite Planungsweg-Auswahl, URL-/Zurück-Synchronisierung und erhaltene Planner-Instanzen; gespeicherte Basis als Disclosure |
| Trainingsnotizen | `TrainingNotes`, `presentTrainingNote`, `presentPlanningMessage` | Verständliche Anzeige exakt bekannter Systemtexte mit unverändertem Original in Erstellungsdetails; keine Änderungen an gespeicherten Daten oder Sicherheitsmeldungen |
| Fachliche Einstiegstexte | `GameCreationForm`, `MediaWorkflowCopy`, `MediaSearchInput` | DE/EN-Anleitung und Beschriftung ohne Änderungen an Spieltyp, Suchparametern oder Medienfreigabe |
| Cards | `Card`, `CardHeader`, `StatCard` | HyperUI-kompatible Karten-Grundform mit OCRCraft-Theme-Tokens; `Card` unterstützt semantisch `section`, `article` und `div` |

## Regeln für neue Screens

- Neue Kataloge verwenden `CatalogFilterPanel`, `CatalogResultCount` und `CatalogPagination` statt eigener Zähler- oder Seitennavigation.
- `activeFilterCount` stammt aus den angewendeten, normalisierten Seitenfiltern; Seitenzahl, Seitengröße und Verwaltungsrückmeldungen zählen nicht mit. Einzelne Körperregionen/Facetten zählen jeweils einmal. Archiv-/Historienbereiche, die beim Reset erhalten bleiben, sind Ansichtsmodi und zählen nicht als rücksetzbare Filter.
- `FormField` enthält genau ein natives `input`, `select` oder `textarea`. Es erhält eine bestehende Control-ID oder vergibt eine stabile ID, verknüpft das Label und ergänzt `aria-describedby` um Hinweis-/Fehler-IDs. Vorhandene Beschreibungen und vom Aufrufer gesetzte Invalid-Zustände bleiben erhalten. Zusätzliche Layoutwrapper gehören außerhalb des Felds.
- `FieldHint` verwendet einen nativen Auto-Popover mit 44-px-Auslöser außerhalb des Labels. Touch, Enter und Leertaste öffnen; erneutes Auslösen, Escape oder Außenklick schließen. Die Position wird bei Öffnung, Scrollen und Resize an den Viewport angepasst. Styles liegen in `form-styles.ts`, das interaktive Feld in `form-field.tsx`; `form.tsx` bleibt kompatibler Einstiegspunkt.
- Dialoge werden nur für fokussierte Aufgaben geöffnet und geben den Fokus beim Schließen an das auslösende Element zurück.
- Interaktive Controls bleiben echte Buttons, Links, Inputs oder Selects und erhalten ein sichtbares Fokus-Styling.
- User-facing Texte bleiben standardmäßig Deutsch; neue Texte dürfen nicht als unübersetzbare technische Abkürzungen eingeführt werden.
- Serveraktionen bleiben in Route-/Service-Grenzen; UI-Komponenten führen keine DuckDB-Abfragen und keine Autorisierung aus.
- `globals.css` und semantische Tokens werden nicht durch CLI- oder Fremd-Theme-Updates überschrieben.
- `app/loading.tsx` und `app/error.tsx` schützen die Seitenladegrenze. Fehler verwenden Next.js 16.3 `retry()` zum erneuten Laden; erwartete Formular-/API-Fehler bleiben in ihren bestehenden Rückmeldungen. `global-error.tsx` stellt ein eigenes Dokument bereit und setzt keinen funktionierenden App-Provider voraus. Keine Exception-Texte, automatische Schreibwiederholungen oder Löschungen lokaler Backups im Fallback.
- Routentitel stammen aus `config/route-titles.ts`: vollständige deutsche Servermetadaten, nach Hydration DE/EN aus der Browser-Spracheinstellung. Die Titel benötigen keine zusätzliche Datenbankabfrage und enthalten keine Datensatznamen. Bei neuen Page-Routen Titel ergänzen und `routeMetadata` exportieren.
- Vollbildaktionen prüfen Ziel/API und behandeln abgelehnte Promises. Fehler bleiben direkt am Control im Vollbildziel sichtbar; globale Toasts außerhalb des Vollbildelements sind dafür ungeeignet. Der Browserzustand bestimmt `aria-pressed`; laufende Aktionen sind gegen Doppelklick geschützt. Rückweg und Drucken dürfen bei fehlendem Vollbild weiter funktionieren.
- Builder-Ansichten verwenden native Buttons mit `aria-pressed`/`aria-controls`, kein unvollständiges Tabs-Pattern. `planner=quick|detailed` ist ausdrücklich; ohne diese Auswahl öffnen bestehende `mode=ai|local`-/`source`-Links den detaillierten Weg, sonst startet der kompakte Weg. Native History hält beide Komponenten gemountet und stellt Browser-Zurück ohne erneute Generierung bereit. Diese Speicherhaltung innerhalb der Seite ersetzt keine persistente Vorschlagssicherung nach Reload.
- Trainingsnotizen verwenden ausschließlich eine exakte Liste bekannter automatisch erzeugter Texte zur Anzeigeanpassung. Eigene oder ergänzte Notizen bleiben wörtlich erhalten; keine Keyword-Heuristik und kein Zurückschreiben in die Datenbank. Die Erstellungsdetails sind im Druck ausgeblendet. Die Anpassung einer bekannten Informationsmeldung verändert weder Warnungsanzahl noch Schweregrade oder Validierung.

Die Accessibility- und Playwright-Gates in `e2e/` prüfen die wichtigsten Shell-, Fokus-, Dialog-, Tastatur- und responsiven Eigenschaften.


## Visuelles System 2026

Die UI verwendet seit dem kompakten HyperUI-inspirierten Refresh ein bewusst dichteres Arbeitsflächen-System:

- **Radius:** kleine Radien (`sm` bis `lg`) für Controls und Panels; Pillen bleiben Status/Avatar-Ausnahmen.
- **Dichte:** Seitenkopf, Sidebar, Filter, Karten und Training-Phasen sind auf Trainer-Workflows statt Marketing-Abstände optimiert; Touch-Ziele bleiben bei ca. 44 px.
- **Farben:** neutrale helle Flächen bzw. Graphit/Charcoal im Dark Mode; `--brand` (Coral) markiert Erstellung/Branding, `--accent` (Lime) aktive Trainings-/Fortschrittszustände.
- **Phasen:** `--phase-warmup`, `--phase-main`, `--phase-cooldown` und ihre Soft-Varianten ersetzen generische Blau/Violett-Akzente.
- **Komposition:** AppShell nutzt maximal 1680 px, kompakte zweizeilige Header-Komposition und eine weiße Light-Sidebar bzw. neutrale Dark-Sidebar.

Die vollständigen Token- und Anwendungsregeln stehen in [`docs/design-system.md`](./design-system.md).

## Trainingsdruck

Die Trainings-Druckansicht nutzt einen eigenen lokal gekapselten Print-Stil in `training-print.module.css`, den Logo-/OCR-Masthead und die kompakte `TrainingPrintGuidance`. Traineransicht und ausführliche Druckansicht behalten `TrainingItemGuidance`; `expanded` öffnet dessen fachliche Disclosures für die vollständige Druckvorschau. Brandingfarben überschreiben keine globalen App-Tokens. [Druckumfang, Assetherkunft und Prüfablauf](./training-print-layout.md).
