# OCR-Frankfurt-Drucklayout

Die Druckansicht unter `/training/[id]/print` verwendet das vom Nutzer gelieferte OCR-Frankfurt-Logo, ein schwarzes Kopfband mit rotem Schrägstreifen und eine eigens erzeugte OCR-Illustration. Die Illustration ist dekorativ, keine Übungsanleitung. [Assetherkunft und vollständiger Generierungsprompt](../public/brand/README.md).

Der weiße Inhaltsbereich zeigt Trainingstitel, Gesamtdauer, Übungszahl und Trainerprofil. Nummerierte Phasen, kräftige Linien, rote Übungsmarkierungen und rechts stehende Dauern greifen die Shirtgestaltung auf. Die Bedeutung der Phasen hängt nicht allein von Farbe ab. Der Druck bleibt vom App-Farbmodus unabhängig; App-Navigation und Druckcontrols erscheinen nicht auf Papier.

## Zwei Druckumfänge

- **Kompakter Trainingsplan** ist Standard: Zusammenfassung und vollständige Traineranweisungen, vorhandene Level 1–3, Belastung/Pause, Sicherheitsnotizen, Voraussetzungen, Aufsicht, Untergrund/Wetter, Jugendvariante und Alternative. Wenn kein Trainertext existiert, werden hinterlegte Ausführungsschritte ausgegeben. Texte werden nicht abgeschnitten. Sonstige ausführliche Kataloginformationen stehen in der zweiten Ansicht.
- **Mit allen Übungsdetails** (`?details=full`) zeigt zusätzlich die vollständige bestehende Übungsdarstellung mit geöffneten Ausführungs-/Coaching-/Level-Disclosures. Die Druckvorschau zeigt diesen Umfang bereits vor dem Druck. Technische Erstellungsdetails bleiben wie bisher im Druck ausgeblendet. Auch umfangreiche Anweisungen dürfen über Seiten laufen; ganze Phasen werden nicht zusammengehalten.

Neue Druckcontrols und Beschriftungen stehen auf DE/EN zur Verfügung. Die Trainingssprache bestimmt diese serverseitigen Inhalte; die bestehenden Druckbuttons folgen der UI-Sprache. Der Trainerbildschirm verwendet weiterhin dieselbe fachliche Trainingsdarstellung. Es gibt keine Datenbank-, Planungs- oder Freigabeänderung.

## Verantwortung und Prüfung

`training-print-masthead.tsx` enthält das Branding, `training-print-guidance.tsx` den kompakten Inhalt, `training-print.module.css` die lokal gekapselte Gestaltung und Seitenumbruchregeln. Die Print-Route lädt die vorhandenen Trainings-/Guidancedaten und wählt lediglich den Druckumfang. A4 mit 12-mm-Rand, schwarze lesbare Texte und exakte Druckfarben im Kopfband; die endgültige Farbwiedergabe hängt auch vom Browser/Drucker ab.

Reproduzierbarer Browsercheck: `npm run test:e2e -- e2e/training-print.spec.ts`. Er erzeugt eine echte gespeicherte Einheit, prüft lokale Bilddateien, 320-/794-px-Überlauf, Druck aus Dark Mode, ausgeblendete Controls, drei Phasen, unveränderten Übungsinhalt beim Wechsel des Medienmodus und Sicherheitsnotizen in beiden Druckumfängen. PDF und Vorschau entstehen unter `artifacts/print-review/`; diese Beispiele enthalten E2E-Testdaten.

Prüfstand 9. November 2026: 364 Unit-/Integrationstests, separater Typecheck und Produktionsbuild bestanden. UI-/Architekturgates bestanden; Lint ohne Fehler, bekannte bestehende `index`-Warnung in `training-excel-service.ts:248`. Sieben unterschiedliche gezielte Browserfälle über Erstlauf und Nachprüfung bestanden: Drucklayout, Notizdarstellung, Spiel-/Medientexte sowie Trainer-Rückweg/Vollbild/Englisch. Der finale Printfall prüft beide Druckumfänge einschließlich erhaltener Sicherheitsnotizen; eine echte A4-PDF wurde gerendert und visuell kontrolliert. Vollständige E2E-Suite nicht wiederholt. Der separate Abschlussfooter wurde entfernt, nachdem PDF-Rendering eine Zusatzseite bzw. Browserüberlagerungen aufgedeckt hatte; das Branding bleibt im Kopfband.
