# CYKLO 1.0.0 / jádro 2.1.0 — ověření a hranice

Datum: 14. 11. 2026. První funkční vydání je beta pro ověření na cílovém telefonu.

## Implementováno

- Instalovatelný modul s místními knihovnami MapLibre GL JS 5.15.0 a licencí; minimum jádra 2.1.0.
- Start GPS a jízdy na pokyn, waiting-fix, ruční/automatická pauza, přerušení při pozadí/odchodu, explicitní obnova.
- Okamžitá rychlost GPS (fallback odhad), analogový přístroj s nastavitelnou stupnicí, vzdálenost, celkový/čistý/neznámý čas, průměr a orientační GPS výška.
- Mapa OpenFreeMap Liberty s atribucí, zaznamenané segmenty, směr jízdy / sever, 2D / sklopení 0–60°, výhled od 50 m k nastavitelnému maximu. Projekční výpočet všech testovaných okrajů kamery, aby se výhled neroztahoval za maximum.
- Svislý logaritmický slider, +/−, AUTO, ruční prohlížení a návrat na polohu. Kompaktní a podrobná přístrojová obrazovka.
- Obecné IndexedDB úložiště modulů, transakční blokové ukládání bodů, zámky relace stávajícího jádra, snapshot/restore/undo a odstranění velkých dat spolu s modulem. Starší synchronní API zachováno.
- Historie, detail, GPS profil (časová osa), celá trasa, přejmenování/smazání, GPX segmenty a JSON export. Zámek ovladačů a volitelné udržení obrazovky.

## Automatické ověření

- `tests/module-data.test.cjs`: skutečné IndexedDB chování přes fake-indexeddb; izolace modulů, abort transakce, snapshot/restore/undo/erase, 15 000 bodů.
- `tests/cyklo-engine.test.cjs`: pohyb/stání s hysterezí, pauza a přesun, nula vs null, duplicitní čas, skok, přerušení a simulovaná dlouhá jízda.
- `tests/cyklo-store.test.cjs`: řazení checkpointů, idempotentní body, export segmentů, XML escaping a nulová/chybějící výška, smazání.
- `tests/cyklo-camera.test.cjs`: logaritmický slider, auto meze, heading wrap a geometrický test s perspektivním test double napříč výhledy/sklony/směry/velikostmi. Nejde sám o ověření skutečného rendereru.
- `tests/cyklo-ui.test.cjs`: otevření bez GPS, watch ID 0, zamítnutí/zrušení a opožděný callback, nula výšky, uložená pauza a pozadí.
- Původní testy instalátoru, workeru, bridge, migrace, Pongu, Pinballu a Laboratoře; `scripts/check-build.py` kontroluje kompletnost a součty vydaných balíčků.

## Rozdíly proti budoucím možnostem a návrhovým obrázkům

První verze neobsahuje plánování/pokyny, DEM terén ani stromy a budovy z obrázkového náhledu. 3D je perspektivně sklopený mapový podklad. Offline se otevírá program a historie a ukládají GPS body; celé offline mapové oblasti se nestahují. Záloha JSON je export, nikoli dosud neobjednaný import. Přesná výdrž baterie nebyla měřena. Profil je v čase, nikoli v kilometrech. Chybí automatická geoidová korekce GPS výšky a součet stoupání.

Výchozí filtry nejsou náhradou za měření na konkrétním telefonu. Pozadí/zamčení se nepředstírá jako nepřerušený záznam; po návratu je třeba Pokračovat. Při chybě kvóty neúspěšné body zůstanou v paměťovém bufferu a UI oznámí problém; nejsou garantované po násilném zavření. Poslední dokončené transakce zůstávají.

Uživatelé se starým již otevřeným oknem jádra mají před správou velkých dat otevřít aktualizovanou verzi: starý kód správce IndexedDB historii nezná. V novém jádře mazání/obnova pokrývá obě úložiště.

## Telefonní akceptace

1. Aktualizovat jádro, stáhnout CYKLO, otevřít; žádná GPS před tlačítkem.
2. Povolit polohu, vyčkat na fix, ověřit 0 při stání a rozjezd. Krátká jízda se zastávkou, zatáčkou, ruční pauzou a přesunem během pauzy.
3. Posunout slider, přepnout 2D/3D, sklon a orientaci; ověřit detail cest a čitelnost venku. Zkontrolovat, že ruční zoom dál sleduje polohu.
4. Vypnout internet: záznam se neukončí; podklad může být nedostupný. Zamknout telefon a ověřit explicitní přerušení a pokračování.
5. Ukončit, prohlédnout historii, profil, GPX a JSON export. Ověřit opětovné otevření a zachování historie při odebrání modulu bez dat.
6. Vyzkoušet nevratné smazání jen na testovací jízdě či se zálohou. Nejprve zkontrolovat historii, potom plné odstranění ve správci.

Fyzická GPS, kvalita signálu, slunce, rukavice a uchycení musí být ověřené na telefonu; automatické testy neprohlašují jejich přesnost za potvrzenou.
