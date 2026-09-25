# OCRCraft Design System

Stand: September 2026

Dieses Dokument beschreibt das kompakte visuelle System für OCRCraft. HyperUI dient als Referenz für robuste Tailwind-Markup-Muster; OCRCraft behält eigene Tokens, Komponenten, Accessibility-Regeln und Fachlogik.

## Designrichtung

OCRCraft ist eine Arbeitsanwendung für Trainer, kein Marketing-Dashboard. Die Oberfläche soll dicht, schnell scannbar und sportlich-präzise wirken.

- kleine bis mittlere Radien statt weicher Bubble-UI;
- geringe, aber klare Abstände;
- Light Mode mit hellen neutralen Flächen;
- Dark Mode auf Charcoal/Graphit statt blau getönten Flächen;
- Coral für Brand, Erstellung und wichtige Primäraktionen;
- Lime für aktive Trainingszustände, Fortschritt und positive Akzente;
- Statusfarben sparsam und niemals als alleiniger Informationsträger;
- subtile Linien, Layer und Schatten statt großer schwebender Karten.

## Semantische Tokens

Die maßgebliche Quelle ist `src/app/globals.css`.

| Zweck | Token |
| --- | --- |
| Seitenfläche | `--background` |
| Standardpanel | `--surface` |
| erhöhte Fläche | `--surface-elevated` |
| Sekundärfläche | `--surface-subtle` |
| Text | `--foreground` / `--muted` |
| Linien | `--border` / `--border-strong` |
| Brand / Create | `--brand`, `--brand-strong`, `--brand-soft` |
| Training / Progress | `--accent`, `--accent-strong`, `--accent-soft` |
| Fokus | `--focus` |
| Warm-up | `--phase-warmup`, `--phase-warmup-soft` |
| Hauptteil | `--phase-main`, `--phase-main-soft` |
| Cooldown | `--phase-cooldown`, `--phase-cooldown-soft` |

Direkte Hex-Farben gehören nicht in Fachseiten, wenn ein semantischer Token existiert.

## Radius

Tailwind-Radien werden zentral über `@theme` verkleinert.

- Controls: `rounded-md`
- Panels/Cards/Dialoge: `rounded-lg`
- kleine Labels: `rounded-sm`
- `rounded-full` nur für Avatare, echte Status-Pills oder kreisförmige Icons

Neue Fachseiten sollen `rounded-xl` und `rounded-2xl` nicht als Standardcontainer verwenden.

## Dichte und Spacing

- Main-Content: Desktop `p-5`, Tablet `p-4`, Mobile `p-3`
- typische Panel-Paddings: `p-3` bis `p-4`
- typische Grid-Gaps: `gap-2` bis `gap-4`
- Section-Abstände: bevorzugt `mt-4` bis `mt-5`
- Controls bleiben für Touch/Kbd in der Regel mindestens `min-h-11`

Dichte wird durch weniger Leerraum erreicht, nicht durch zu kleine Bedienelemente.

## Komponenten

### Buttons

`buttonClass()` in `src/components/ui/form.tsx` ist die zentrale Button-Grundform.

- `primary`: Coral; Erstellen, Speichern, zentrale Primäraktion
- `accent`: Lime; Training starten, aktive positive Aktion
- `secondary`: neutrale Fläche
- `danger`: destruktiv
- `ghost`: geringe visuelle Priorität

### Cards

`Card` ist die Standardfläche. Karten erhalten keine zusätzlichen großen Radien. `CardHeader` nutzt `.ui-kicker` für kleine, präzise Eyebrows.

### Training-Phasen

Phasen verwenden semantische Farben und Soft-Flächen:

- Warm-up: Grün/Teal
- Hauptteil: Coral
- Cooldown: Lime/Olive

Die Phase bleibt zusätzlich durch Text beschriftet; Farbe ist nie das einzige Signal.

### AppShell

- Desktop-Sidebar: 224 px, eingeklappt 64 px
- Content-Maximum: 1680 px
- Sidebar Light: hell statt permanent dunkel
- Sidebar Dark: neutral Graphit
- Collapse-Aktion liegt im Brand-Header statt in einer eigenen Leerzeile
- Seitenkopf kombiniert Breadcrumb/User-Controls und Title/Actions in zwei kompakten Zeilen

## Neue Screens

1. Erst semantische Tokens und lokale UI-Komponenten verwenden.
2. Wiederkehrende Markups in `src/components/ui/*` bzw. klaren Feature-Komponenten bündeln.
3. Keine separate Fremd-Theme-Schicht einführen.
4. Light, Dark, Tastatur, Touch und mobile Breite prüfen.
5. Trainer-Workflow und Sicherheitsinformationen vor Dekoration priorisieren.

## HyperUI-Abgrenzung

HyperUI ist MIT-lizenziert und wird ausschließlich als Referenz/Markup-Inspiration verwendet. OCRCraft lädt keine HyperUI-Runtime und installiert kein HyperUI-Paket. Fachkomponenten, Tokens und Verhalten bleiben projektintern. Die frühere Übergangskompatibilität für direkte `bg-white`-/Hex-Farbklassen ist entfernt; der UI-Gate verhindert deren Rückkehr.
