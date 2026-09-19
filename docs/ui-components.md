# OCRCraft UI-Komponenten

OCRCraft verwendet eine lokale, Tailwind-kompatible UI-Schicht. Sie ist bewusst unabhängig von Tailgrids-Laufzeitcode; semantische Tokens, deutsche Standardtexte, Fokusregeln und Serveraktionen bleiben im Projekt kontrolliert.

> HyperUI dient als dokumentierte Tailwind-CSS-v4-Referenz. Verwendete Muster
> werden lokal übernommen und stehen unter dem [MIT-Lizenzhinweis](./hyperui-migration.md).

## Bausteine

| Verantwortung | Komponente | Verwendung |
| --- | --- | --- |
| Overlay / Popover | `Dialog`, `ExerciseFilterPopover` | Fokusfalle, Escape, Backdrop-Schließen, Scroll-Lock und Fokus-Rückgabe |
| Bildvorschau | `ImageLightbox` | Lupen-Overlay, zugängliche Großansicht, Escape-/Backdrop-Schließen und Fokus-Rückgabe |
| Form-Felder | `FormField`, `FormMessage`, `FormActions`, `PrimaryFormButton`, `formControlClass` | Labels, Pflichtmarkierung, Hinweise, Fehlerzustände und konsistente Controls |
| Button-Adapter | `buttonClass`, `buttonBaseClass`, `buttonVariantClass` | HyperUI-kompatible Grundform mit semantischen OCRCraft-Varianten statt direkter Fremdfarben |
| Pagination | `CatalogResultCount`, `CatalogPagination` | URL-basierte Ergebniszähler und zugängliche Seitennavigation |
| Tabs | `AdminTabs` | semantisches `tablist` mit URL-Navigation und responsivem Overflow |
| Sidebar | `CollapsibleSidebar` | persistierter Desktop-Zustand, beschriftete Toggle-Aktion und Hauptnavigation |
| Toast | `ToastProvider`, `useToast` | `aria-live`, Loading-/Erfolgs-/Info-/Fehlerzustände, Auto-Dismiss und manuelles Schließen |
| Feedback / Empty State | `Alert`, `EmptyState` | Semantische Erfolgs-/Warn-/Fehlerhinweise und konsistente leere Zustände |
| Cards | `Card`, `CardHeader`, `StatCard` | HyperUI-kompatible Karten-Grundform mit OCRCraft-Theme-Tokens; `Card` unterstützt semantisch `section`, `article` und `div` |

## Regeln für neue Screens

- Neue Kataloge verwenden `CatalogFilterPanel`, `CatalogResultCount` und `CatalogPagination` statt eigener Zähler- oder Seitennavigation.
- Dialoge werden nur für fokussierte Aufgaben geöffnet und geben den Fokus beim Schließen an das auslösende Element zurück.
- Interaktive Controls bleiben echte Buttons, Links, Inputs oder Selects und erhalten ein sichtbares Fokus-Styling.
- User-facing Texte bleiben standardmäßig Deutsch; neue Texte dürfen nicht als unübersetzbare technische Abkürzungen eingeführt werden.
- Serveraktionen bleiben in Route-/Service-Grenzen; UI-Komponenten führen keine DuckDB-Abfragen und keine Autorisierung aus.
- `globals.css` und semantische Tokens werden nicht durch CLI- oder Fremd-Theme-Updates überschrieben.

Die Accessibility- und Playwright-Gates in `e2e/` prüfen die wichtigsten Shell-, Fokus-, Dialog-, Tastatur- und responsiven Eigenschaften.


## Visuelles System 2026

Die UI verwendet seit dem kompakten HyperUI-inspirierten Refresh ein bewusst dichteres Arbeitsflächen-System:

- **Radius:** kleine Radien (`sm` bis `lg`) für Controls und Panels; Pillen bleiben Status/Avatar-Ausnahmen.
- **Dichte:** Seitenkopf, Sidebar, Filter, Karten und Training-Phasen sind auf Trainer-Workflows statt Marketing-Abstände optimiert; Touch-Ziele bleiben bei ca. 44 px.
- **Farben:** neutrale helle Flächen bzw. Graphit/Charcoal im Dark Mode; `--brand` (Coral) markiert Erstellung/Branding, `--accent` (Lime) aktive Trainings-/Fortschrittszustände.
- **Phasen:** `--phase-warmup`, `--phase-main`, `--phase-cooldown` und ihre Soft-Varianten ersetzen generische Blau/Violett-Akzente.
- **Komposition:** AppShell nutzt maximal 1680 px, kompakte zweizeilige Header-Komposition und eine weiße Light-Sidebar bzw. neutrale Dark-Sidebar.

Die vollständigen Token- und Anwendungsregeln stehen in [`docs/design-system.md`](./design-system.md).
