# Seitenladezeit im Entwicklungsmodus

Prüfstand: 8. November 2026, lokales Windows-System, Next.js 16.3.5.

## Ursache und Änderung

Die lange Next-Anzeige „Rendering“ enthielt vor allem Datenbankarbeit: Die modulgebundene Startinitialisierung ging bei HMR verloren. Der automatische Import durchlief auch bereits bekannte Datensätze der rund 17 MB großen Quelldatei erneut. Zusätzlich öffnete und schloss jede Repository-Abfrage die DuckDB-Datei separat; ein Öffnen kostete hier rund 0,5 Sekunden.

- Die Startinitialisierung wird pro absolutem Datenbankpfad, Umgebung und Importkonfiguration im Prozess geteilt und überlebt HMR. Fehlgeschlagene Starts bleiben wiederholbar; Restore und Reseed invalidieren den Zustand.
- Automatisches Seeding ermittelt vorhandene Quellen einmal und importiert nur fehlende Datensätze. Der explizite Import über `npm run exercise:import:hasaneyldrm` behält die Anreicherung und Medienabstimmung bestehender Datensätze.
- Migrationen lesen nur noch ausstehende SQL-Dateien ein.
- Wartende Datenbankoperationen teilen kurzzeitig eine Verbindung, laufen weiterhin seriell und behalten die dateibasierte Prozesssperre. Nach leerer Queue, spätestens nach 32 Operationen oder nach einem Callback-Fehler wird die Verbindung geschlossen. Es bleibt keine dauerhaft offene Verbindung zurück.
- Jeder Callback behält seinen eigenen asynchronen Anfragekontext einschließlich Authentifizierung/Headers/Cookies. Weder Ergebnisse noch Benutzerrechte werden global gecacht.

Nach dieser Änderung den laufenden Dev-Server einmal neu starten. Neue Migrationen oder Änderungen am Bootstrap erfordern ebenfalls einen Neustart; normale Seitenänderungen können weiterhin HMR verwenden. Externe Änderungen an der Datenbank außerhalb der App erfordern einen Neustart zur erneuten Startvalidierung.

## Messung

Isolierte Kopien derselben bereits befüllten Testdatenbank, automatischer externer Import aktiviert. Gemessen wurde die vollständige lokale HTTP-Antwort von `next dev`, einschließlich serverseitiger Arbeit; keine Browser-Hydration. Einzelmessungen, keine Perzentile oder garantierten Grenzwerte. „Erster Request“ bezeichnet einen neuen Serverprozess mit vorhandener `.next`-Entwicklungsablage, keinen vollständig leeren Compiler-Cache.

| Vorgang | Vorher | Nachher |
| --- | ---: | ---: |
| Datenbank-Startinitialisierung (separater Probeprozess) | 30.511 ms | 1.379 ms |
| Quick Create, erster Request | 39.105 ms | 2.711 ms |
| Quick Create, wiederholter Request | 2.372 ms | 923 ms |
| Dashboard nach Quick Create | 1.576 ms | 1.284 ms |
| Rückkehr zu Quick Create | 2.329 ms | 909 ms |

Ein zusätzlicher HMR-Request nach Änderung des Readiness-Moduls benötigte 2.069 ms, davon laut Dev-Log 878 ms Anwendungsarbeit; der vollständige Import wurde nicht erneut ausgeführt. Die Rohmessungen liegen lokal unter `artifacts/page-performance/` (ignorierte Prüfartefakte). Die Arbeitsdatenbank wurde für diese Messungen nicht verändert.

## Regressionen

Unit-Tests prüfen serielle Ausführung, begrenzte Batches, Freigabe nach Fehlern, Wiederholung nach Öffnungsfehlern, Ablehnung verschachtelter Operationen und getrennte Anfragekontexte. Weitere Tests prüfen HMR-Wiederverwendung, Invalidierung, erneuten Start nach Fehlern sowie automatische Imports bei vollständig und teilweise vorhandenen Quellen.

Verifiziert: 352 Tests in 97 Dateien, Typecheck, Produktionsbuild, Architektur- und UI-Gate. Sieben gezielte Playwright-Regressionen prüfen Builder-/Quick-Planner-/Quick-Create-Wiederherstellung, echte Trainingsspeicherung sowie ungültige und nicht verfügbare lokale Speicherung. Lint meldet keine Fehler; die bereits vorhandene Warnung zum ungenutzten `index` in `training-excel-service.ts` bleibt bestehen. Die vollständige E2E-Suite wurde für diese Änderung nicht erneut ausgeführt.

Offene UI-Arbeit an Lade-/Fehlergrenzen bleibt in `plan.md`; sie ersetzt keine Behebung langsamer Serverarbeit.
