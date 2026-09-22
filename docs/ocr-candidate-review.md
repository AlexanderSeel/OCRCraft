# Review der 18 High-Signal-ExerciseDB-Kandidaten

Der Review vergleicht die zusätzlichen Kandidaten mit dem bestehenden OCRCraft-Seed. Ziel ist keine möglichst große Bibliothek, sondern ein kleiner, sicherer und nicht doppelt geführter OCR-Kern.

| ExerciseDB-Kandidat | Entscheidung | Kanonische Behandlung |
| --- | --- | --- |
| assisted pull-up inclined | vorhandene Übung | `assisted-pullup` |
| chin-up diagonal | vorhandene Übung | `pullup`, später ggf. als Griff-/Winkelvariante |
| pure chin-up | vorhandene Übung | `pullup` |
| assisted standing chin-up with focused | vorhandene Übung | `assisted-pullup` |
| lever assisted chin-up with twisted | vorhandene Übung | `assisted-pullup`, Variante bleibt Review |
| macro style weighted one hand pull up | Progressionskandidat | kein automatischer Import; einarmige/gewichtete Progression braucht eigene Risikoprüfung |
| weighted one hand pull up fast | Progressionskandidat | kein automatischer Import; Geschwindigkeit und Zusatzlast nicht ungeprüft kombinieren |
| hanging straight leg raise with elevated | neue fachliche Lücke | eigener OCRCraft-Kernkandidat für Hanging Core |
| hanging pike with intense | neue fachliche Lücke | eigener OCRCraft-Kernkandidat für Hanging Pike |
| hanging pike weak | Variantenkandidat | mit Hanging Pike zusammenführen; leichte Regression selbst formulieren |
| firm style hanging oblique knee raise | neue fachliche Lücke | eigener OCRCraft-Kernkandidat für Hanging Oblique Knee Raise |
| hanging straight twisting leg hip raise with compound | Variantenkandidat | nur als Core-/Hanging-Progression nach Trainerreview |
| alternating bear crawl | vorhandene Übung | `bear-crawl` |
| athletic style battling ropes | neue fachliche Lücke | eigener Battle-Rope-Kandidat; nicht mit Seilklettern oder Seilgriff gleichsetzen |
| sled 45 degrees one leg press pointed | nicht OCR-spezifisch | aus OCR-Kern ausschließen; allgemeine Kraftübung bleibt externe Reviewquelle |
| triple style sled one leg calf press on leg press | nicht OCR-spezifisch | aus OCR-Kern ausschließen |
| sled 45° leg wide press - blunt variation | nicht OCR-spezifisch | aus OCR-Kern ausschließen |
| inverted style inverse leg curl (on pull-up cable machine) | nicht OCR-spezifisch | aus OCR-Kern ausschließen; Equipment-/Namenssignal ist irreführend |

## Ergebnis

- 5 Kandidaten werden auf vorhandene kanonische Übungen abgebildet.
- 5 Kandidaten werden als mögliche eigene Hanging-/Battle-Rope-Übungen gesammelt.
- 2 gewichtete/einarmige Varianten bleiben wegen Risiko und Progression im Review.
- 4 Sled-/Leg-Curl-Kandidaten werden aus dem OCR-Kern ausgeschlossen.
- 2 weitere Hanging-Varianten werden nicht separat vervielfacht, sondern als mögliche Progressionen zusammengeführt.

Für neue Kandidaten werden eigene DE-/EN-Texte, Altersgrenzen, Aufsicht, Station capacity, Regression, Fallback und Sicherheitsnotizen formuliert. Keine Rohinstruktion aus ExerciseDB wird als OCRCraft-Coachingtext veröffentlicht.
