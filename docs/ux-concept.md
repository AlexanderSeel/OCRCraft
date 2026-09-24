# OCRCraft UX-Konzept

Dieses Dokument definiert das verbindliche Bedienmuster für OCRCraft-Fachseiten. Neue Seiten und größere Umbauten sollen dieses Muster verwenden, statt lokale Sonderlösungen einzuführen.

## 1. Seitenhierarchie

Jede Fachseite folgt derselben Reihenfolge:

1. **App-Shell und Breadcrumbs**
2. **Seitentitel und kurze Fachbeschreibung**
3. **kontextbezogene Primär-/Sekundäraktionen**
4. **Status-, Warn- oder Reviewhinweise**
5. **Filter- oder Steuerbereich**
6. **Ergebnis-/Arbeitsbereich**
7. **Pagination oder Abschlussaktionen**

Der Seitenkopf bleibt kompakt. Diagnose-, Theme- und globale Einstellungen gehören nicht in lokale Seitentitelbereiche.

## 2. Primäre Aktion

Pro Seite gibt es höchstens eine visuell dominante Hauptaktion.

Beispiele:

- Übungen: „Neue Übung“
- Training: „Training erstellen“
- Hindernisse: „Hindernis anlegen“
- Medien: „Medium hinzufügen“ oder „Bild generieren“
- Outdoor-Review: „sichere Varianten übernehmen“
- Administration: abhängig vom aktiven Tab

Sekundäraktionen verwenden neutrale Buttons oder Links.

Gefährliche Aktionen verwenden ausschließlich Danger-Tokens und benötigen bei irreversiblen Änderungen eine Bestätigung.

## 3. Filterbereich

Katalogseiten verwenden den gemeinsamen Filterbereich.

Regeln:

- Suchfeld zuerst
- wichtigste Fachfilter direkt darunter
- Seitengröße im selben Panel
- Reset nur anzeigen, wenn ein Filter aktiv ist
- Filterzustand in der URL speichern
- keine fachfremden Aktionen in das Filterpanel legen
- große visuelle Auswahlwerkzeuge öffnen in Dialogen, nicht dauerhaft im Sidepanel

Mobile Ansicht:

- Filter als kompakter ausklappbarer Bereich oder Dialog
- keine horizontale Scrollpflicht
- Touch-Ziele mindestens 44 × 44 CSS-Pixel

## 4. Ergebnisbereich

Der Ergebnisbereich muss immer eindeutig zeigen:

- Anzahl der Ergebnisse
- aktuellen Ausschnitt bei Pagination
- aktive Ansichtsart
- Empty State bei 0 Treffern

Kataloge verwenden nach Möglichkeit die gemeinsamen Ansichten:

- Liste
- Klein
- Groß
- Detail

Detailinformationen dürfen kompakte Ansichten nicht unnötig überladen.

## 5. Empty, Loading und Error

### Empty State

Ein Empty State erklärt:

1. warum kein Inhalt sichtbar ist
2. was als nächstes möglich ist

Beispiele:

- „Noch keine Trainings vorhanden“ + „Training erstellen“
- „Keine Treffer für diese Filter“ + „Filter zurücksetzen“
- „Noch keine Medien“ + „Bild hinzufügen“

### Loading State

Bei serverseitigen Seiten wird unnötiger Lade-Flicker vermieden.

Für längere Aktionen:

- persistente Aufgabenqueue verwenden
- Status sichtbar halten
- Benutzer darf weiter navigieren
- kein künstlicher blockierender Spinner für Hintergrundjobs

### Error State

Fehler müssen:

- verständlich formuliert sein
- am betroffenen Bereich erscheinen
- bei Formularfeldern zusätzlich direkt am Feld stehen
- keine technischen Secrets oder Stacktraces anzeigen
- bei erneut ausführbaren Vorgängen eine klare Retry-Aktion anbieten

## 6. Formulare

Formulare folgen einer stabilen Fokusreihenfolge von oben nach unten.

Regeln:

- sichtbares Label für jedes Eingabefeld
- Hilfe- und Validierungstext unter dem Feld
- Pflichtfelder nicht ausschließlich über Farbe markieren
- Fehler nach Submit am Feld anzeigen
- erster fehlerhafter Bereich wird fokussierbar bzw. erreichbar gemacht
- Speichern bleibt am Ende des Formularflusses
- Cancel/Zurück ist visuell schwächer als Speichern

Lange Editoren werden fachlich gruppiert, nicht nur optisch in Karten aufgeteilt.

## 7. Dialoge und Popover

Dialoge verwenden die zentrale Dialog-Komponente.

Verbindlich:

- semantische Dialogrolle
- sichtbarer Titel
- Fokusfalle
- Escape schließt, sofern kein kritischer Commit läuft
- Fokus kehrt zum Auslöser zurück
- Scroll-Lock
- mobile Breite bleibt innerhalb des Viewports

Popover werden nur für kurze kontextuelle Bearbeitung verwendet. Komplexe Formulare gehören in Dialog oder eigene Seite.

## 8. Reviewblocker

Reviewpflichtige Vorgänge dürfen nicht wie normale Erfolgszustände aussehen.

Ein Reviewblocker enthält:

- klaren Status
- fachliche Begründung
- betroffene Daten
- zulässige nächste Aktionen
- Hinweis, ob automatische Verarbeitung gestoppt ist

Beispiele:

- Outdoor-Ersatzgerät nicht eindeutig
- Kids-/Youth-Sicherheitsregel verletzt
- externe Medienrechte nicht bestätigt
- KI-Draft noch nicht geprüft
- Dublette noch nicht entschieden

Automatik darf Reviewblocker nicht still umgehen.

## 9. Responsive Verhalten

### Desktop

- Sidebar + Arbeitsbereich
- Filterpanel neben Ergebnissen, wenn ausreichend Platz vorhanden
- Tabellen nur, wenn tabellarische Struktur fachlich sinnvoll ist

### Tablet

- Navigation und Filter verdichten
- Kartenbreite begrenzen
- Zwei-Spalten-Layouts nur bei ausreichender Nutzbreite

### Mobile

- eine Hauptspalte
- keine horizontale Seitenüberläufe
- Aktionen umbrechen oder in klare sekundäre Menüs verschieben
- Filter einklappen
- Tabellen in Karten-/Listenform überführen, falls Spalten nicht sinnvoll lesbar bleiben

## 10. Fokusreihenfolge

Grundreihenfolge:

1. Skip Link
2. Hauptnavigation
3. globale Shell-Aktionen
4. Seitentitel-/Aktionsbereich
5. Filter
6. Ergebnisliste
7. Pagination
8. nachgelagerte Aktionen

Ein geöffneter Dialog unterbricht diese Reihenfolge kontrolliert und gibt den Fokus beim Schließen zurück.

## 11. Statusfarben

Farben werden semantisch über Tokens verwendet.

- Success: bestätigt, gespeichert, freigegeben
- Warning: Review nötig, unvollständig, eingeschränkt
- Danger: Fehler, blockiert, destruktiv
- Muted: zusätzliche oder sekundäre Information

Status darf nie nur durch Farbe vermittelt werden. Text oder Icon-Bedeutung muss zusätzlich vorhanden sein.

## 12. Fachseitenmuster

### Dashboard

Primär: aktueller Arbeitsstand und direkte Einstiege.

Keine langen Editoren auf dem Dashboard.

### Übungen

Filter → Ergebnisliste → Detail/Edit.

Neue Übung startet mit Identität und führt anschließend in den vollständigen Editor.

### Training

Übersicht trennt gespeicherte Einheiten, Vorlagen und Erstellung.

Im Builder bleibt die Trainingsstruktur immer sichtbar.

### Hindernisse

Katalogfilter und Zuordnungssuche bleiben getrennt.

Sicherheits- und Maßinformationen sind prominenter als dekorative Medien.

### Spiele

Katalogmuster wie Übungen, jedoch mit spielbezogenen Zielgruppen-/Gruppenfiltern.

### Gruppen

Suche und Zielgruppenfilter; Erstellung getrennt vom Ergebnisbereich.

### Medien

Filter nach Review, Quelle, Medientyp und Generierungsstatus.

Rechteblockierte externe Medien müssen als nicht verwendbar erkennbar sein.

### AI-Entwürfe

Entwurf, Validierungsstatus und Trainerfreigabe klar trennen.

KI-Inhalt ist nie automatisch „freigegeben“.

### Outdoor

Automatische Kandidaten, Fachreview und Portabilitäts-Audit klar getrennt darstellen.

### Administration

Tabs strukturieren unabhängige Verwaltungsbereiche.

Globale Einstellungen und Diagnose bleiben hier und werden nicht auf Fachseiten dupliziert.

## 13. Qualitätskriterien

Eine Fachseite gilt als UX-konform, wenn:

- genau eine H1 vorhanden ist
- ein Main-Landmark existiert
- Tastaturbedienung ohne Maus möglich ist
- keine horizontale Überbreite auf 375px entsteht
- Filterzustände verständlich und rücksetzbar sind
- Empty/Error/Review-Zustände vorhanden sind
- Fokus nach Dialog/Popover korrekt zurückkehrt
- Buttons und Formfelder lokale UI-Tokens verwenden
- mobile Touch-Ziele ausreichend groß sind
- user-facing Texte dictionary-fähig bleiben

## 14. Regression

Nach Änderungen an gemeinsamen UI-Mustern mindestens ausführen:

```bash
npm run check:ui
npm run typecheck
npm test -- --run
npm run lint
npm run build
npm run test:e2e
```

Visuelle oder Interaktionsänderungen an gemeinsamen Bausteinen müssen auf mindestens einer Desktop- und einer Mobile-Route geprüft werden.
