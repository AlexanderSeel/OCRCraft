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
