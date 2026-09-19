# HyperUI-Migrationsanalyse

Stand: September 2026

HyperUI wird als Referenz für Tailwind-CSS-v4-Markup verwendet. Es wird kein
HyperUI-Paket installiert und kein fremdes Runtime-Theme eingebunden. Die
Quellreferenz ist das [HyperUI-Repository](https://github.com/markmead/hyperui).

## Quellen- und Lizenzhinweis

HyperUI steht unter der [MIT-Lizenz](https://github.com/markmead/hyperui/blob/main/LICENSE).
OCRCraft übernimmt daraus ausschließlich ausgewählte HTML-/Tailwind-Markup-Muster
und passt sie an die eigenen Komponenten, Theme-Tokens und Accessibility-Regeln
an. Es wird kein HyperUI-Paket ausgeliefert und keine HyperUI-Runtime geladen.
Eigene Fachtexte, Domänenlogik, Serveraktionen, Datenmodelle und Bilder stammen
nicht aus HyperUI.

## Ausgangslage

OCRCraft besitzt bereits eine lokale UI-Schicht und semantische Theme-Tokens:

| Bereich | Bestehende Verantwortung | Migrationsentscheidung |
| --- | --- | --- |
| Theme und Farben | `src/app/globals.css`, `--surface*`, `--border*`, `--foreground`, `--focus` | Beibehalten; HyperUI-Farben werden nicht direkt übernommen |
| Dialoge und Popover | `src/components/ui/dialog.tsx`, Filter- und Medien-Popover | Markup und Abstände prüfen; Fokusfalle, Escape und Fokus-Rückgabe bleiben Pflicht |
| Formulare | `src/components/ui/form.tsx`, Fachformular-Komponenten | HyperUI-Form-Muster als visuelle Vorlage; Serveraktionen und Feldfehler bleiben unverändert |
| Disclosure | `src/components/ui/disclosure.tsx` | Für Akkordeon-/Detail-Muster wiederverwenden, keine parallelen Varianten |
| Navigation | `src/components/layout/collapsible-sidebar.tsx`, `AppShell` | Zuerst auf Desktop-/Mobile-Navigation und aktive Zustände anwenden |
| Kataloge | `OverviewLayout`, `CatalogPagination`, `CatalogResultCount` | Card-, Filter-, Tabellen- und Empty-State-Muster vereinheitlichen |
| Feedback | `ToastProvider`, Inline-Erfolg/Fehler, `StatCard` | Alerts und Statusmuster konsolidieren, `aria-live` erhalten |
| Medien | `ImageLightbox` und Medienkomponenten | Bild-/Video-Preview als gemeinsames Muster ausbauen |

## Wiederholte Seitenschemata

Die höchste Wirkung bei geringem fachlichem Risiko liegt in diesen Gruppen:

1. Dashboard, Quick-Create und Trainingsübersichten: Shell, Stat-Cards,
   Seitenaktionen, Statuskarten und Empty States.
2. Übungen, Hindernisse, Medien und Spiele: Filterleiste, Ergebniszähler,
   Kartenraster, Detail-/Listenansicht, Pagination und Bildvorschau.
3. Gruppen und Administration: Tabs, Formulare, Tabellen-/Listenzeilen,
   Warnungen, Dialoge und Berechtigungszustände.
4. Training Builder und Editor: komplexe Formabschnitte, Disclosure, Drag-/Drop-
   Bereiche und Validierungsfeedback; erst nach den einfacheren Batches.

## Zielbild

- Wiederkehrende Oberflächen kommen aus `src/components/ui/*` oder klar
  abgegrenzten Domänenkomponenten; Seiten enthalten primär Datenfluss und
  Komposition.
- HyperUI liefert nur die visuelle Grundform. OCRCraft-Tokens steuern Farbe,
  Kontrast, Dark Mode und Zustände.
- Jede neue oder migrierte Oberfläche bleibt deutsch beschriftet und über die
  bestehende i18n-Struktur ins Englische übersetzbar.
- Formulare zeigen Fehler am Feld, Dialoge sind tastaturbedienbar und alle
  interaktiven Elemente besitzen sichtbare Fokuszustände.
- Server Actions, Autorisierung, Repository-Grenzen und Domänenvalidierung
  werden bei der UI-Migration nicht verändert.

## Migrationsreihenfolge

1. Adapter und gemeinsame Zustände: Button-Varianten, Form-Control-Zustände,
   Card-/Panel-Grundform, Alert, Empty State und Seitenaktionen.
2. App-Shell: Sidebar, Header, Mobile-Navigation und Breadcrumbs.
3. Katalog-Batch: Übungen, Hindernisse, Medien und Spiele.
4. Workflow-Batch: Dashboard, Quick-Create und Trainingsübersichten.
5. Admin-/Gruppen-Batch und zuletzt der komplexe Training Builder.

Jeder Batch braucht einen Light-/Dark-Mode-Abgleich, eine mobile Prüfung,
Tastatur-/Screenreader-Prüfung sowie `check:ui`, Typecheck, Lint, Unit-, E2E-
und Build-Prüfungen.


## Visuelle Zielschärfung

Der September-2026-Refresh konkretisiert das Zielbild in [`docs/design-system.md`](./design-system.md): weniger Rundung, geringere Flächenverschwendung, neutraler Graphit-Dark-Mode sowie Coral/Lime als kontrollierte Signalfarben. Dashboard und Trainingsübersicht bilden den ersten vollständig auf diese Dichte und Hierarchie angepassten Fachseiten-Batch.
