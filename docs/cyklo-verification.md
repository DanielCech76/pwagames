# CYKLO 1.0.3 / jádro 2.1.0 — ověření a hranice

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

## Kontrola publikované aplikace v prohlížeči

Ověřena skutečná aktualizace jádra 2.0.1 → 2.1.0 se zachováním starých modulů, stažení CYKLO s ověřením součtů, otevření bez GPS žádosti, nastavení limitu a změna přiblížení do manuálu, prázdná historie, zavření nastavení přes společnou navigaci a odchod do správce. První kontrola odhalila použití neexistujícího MapLibre supported(); opraveno. Následná kontrola ukázala, že cloudový prohlížeč má WebGL vypnuté; ověřen proto skutečný fallback, nikoli vykreslený online mapový podklad nebo skutečná kamera. Verze 1.0.2 navíc zpřístupňuje nastavení mapy před prvním GPS fixem a odstraňuje technický WebGL výpis z uživatelského stavu. Skutečný mapový renderer, mobilní rozměry a GPS je třeba dále ověřit na podporovaném telefonu.

Verze 1.0.3 opravuje prostor pro horní popisek ciferníku, umístění hlášky náhradního podkladu a orientaci GPS šipky v mapových souřadnicích. Natočení šipky musí být GPS heading mínus bearing kamery, nikoli samotný bearing.

## 1.1.0 — navigation extension
See [cyklo-navigation.md](cyklo-navigation.md) for the implemented workflow, provider/persistence boundaries and remaining physical-device checks. Both editions are generated from one source, with separate module storage. Existing `cyklo` histories remain intact. All repository regression suites pass; additional navigation and planner suites run in Pages CI.

## 1.2.0 — sloupcový profil a vzhled A/B
Všechny regresní sady prošly. Přidán test vážení podle vzdálenosti, chybějících/nulových výšek, krátkých vrcholů, přístupných popisů a synchronizace aktuálního sloupce se seekem simulace. Lokální preview je obsazeno jiným projektem; jeho běh nebyl přerušen. V publikovaném sestavení ověřena aktualizace 1.0.3 → 1.2.0, import ukázkového plánu, vykreslení 24 sloupců a spuštění simulace. Pauza a seek na 850/1000 přepnuly aktuální sloupec na 21 a výškový štítek na 188,3 m. Hlavička uvádí Simulace, skutečné jízdní metriky jsou skryté. Snímek: `screenshots/cyklo-1.2.0-elevation.jpg`. Mobilní fyzické zařízení nebylo součástí této vizuální kontroly.

## 1.3.0 — kontrola vzhledu a ovládání
Všechny regresní sady a build/check-build prošly. Nové testy ověřují devět kombinací vzhledu, migraci nastavení, pevné rozměry, adaptivní osu, odpojení observeru a kompaktní kameru. V prohlížeči ověřeny rozměry 390 × 844 a 390 × 680, kruhová tlačítka 48 × 48 px, vodorovný zoom na nízké mapě, seek a profil simulace, všechna témata a rozložení a zachování volby po obnovení. Snímek: screenshots/cyklo-1.3.0-layout.jpg. Cloudový prohlížeč nemá použitelný WebGL; vizuální kontrola použila schematický fallback. Fyzická GPS a renderer na telefonu tím nejsou ověřeny.

## 1.3.1 — simulace a svislý zoom
- Volba jiné spodní obrazovky přeruší simulaci, zruší časovač i simulační polohu a otevře vybraný režim. Interní přechod plánovače do mapy při spuštění simulace ji nepřeruší. Spuštění skutečné jízdy nejprve ukončí simulaci. Přepnutí obrazovky samo nezapíná GPS ani záznam.
- Zoom je vždy svisle vpravo, včetně simulace. Automatický vodorovný režim z 1.3.0 je odstraněn. Minimální výška mapy 320 px zajišťuje místo pro ovladač; při nedostatku místa je obsah posuvný.
- Nastavení → Vzhled a rozložení → Průměr ovladače zoomu: 40 / 48 / 56 px (výchozí 48). Tlačítka +/− a jezdec jsou kruhové, mění se jejich průměr i šířka lišty. Celková výška lišty závisí na mapě, nikoli na zvoleném průměru; při změně velikosti zůstává stejná. Volba je uložená lokálně pro každou edici.
- Všech 20 testovacích souborů, build a kontrola balíčků prošly. Integrační UI test spouští skutečný plánovač a ověřuje přechod ze simulace do Jízdy, Tras i Historie bez vytvoření záznamu. Prohlížeč: přechod na Trasy a opětovné spuštění simulace, svislý ovladač 8 px od pravého okraje; změna průměru 48 → 56 px ponechala výšku 216 px, tlačítko i jezdec mají 56 px. Snímek screenshots/cyklo-1.3.1-zoom.jpg. WebGL v cloudovém prohlížeči není dostupné, ověřeno na schematickém podkladu.

## 1.4.0 — vizuální a funkční kontrola
Všech 21 testovacích souborů prošlo, stejně jako build/check-build. Nová sada cyklo-controls ověřuje nečinnost, dotykové probuzení, potlačení nechtěného výběru místa, více prstů/pointercancel, otevřené dialogy, klávesnici, obrazovky, vypnutí automatiky, pozadí a cleanup. Appearance test přidává přepnutí Aero Glass/LED Pulse, migraci nastavení a LED fill včetně neplatné rychlosti.
Prohlížeč 390 × 780: změna vzhledu a tématu, trvání volby po reloadu, import ukázkového plánu a simulace, zhasnutí ovladačů po nečinnosti, probuzení dotykem mapy bez otevření dialogu místa, rychlá pauza, vypnutí automatiky a oba vzhledy. LED panel vykresluje sedmisegmentové SVG číslice a 24 LED, modelová rychlost 22 km/h. Snímky screenshots/cyklo-1.4.0-led-hidden.jpg a screenshots/cyklo-1.4.0-glass.jpg. WebGL v cloudovém prohlížeči není dostupné; vizuálně ověřen schematický podklad, nikoli fyzická GPS a renderer na telefonu.

## 1.4.1 — shoda konstrukce rozhraní s B/G
Všech 21 testovacích souborů a build/check-build prošly po finálních změnách. Prohlížeč 390 × 780: rozložení LED číslic vlevo a pásu vpravo, 90px panel, číslice 53px vysoké, digitální oblast 115px a pás 219px, bez horizontálního přetečení. Ověřeny Aero Glass, viditelné a skryté ovladače Pulse, neaktivní stav bez GPS a čitelnost detailu trasy/grafu v tmavé paletě. Existující automatika dotykového vyvolání zůstává beze změny.
Skutečné snímky: screenshots/cyklo-1.4.1-pulse.jpg a screenshots/cyklo-1.4.1-glass.jpg, modelová rychlost 22 km/h. V cloudovém prohlížeči není WebGL dostupné, proto je na snímcích schematický podklad. Náhledy z imagegen jsou výtvarná reference, nejsou screenshotem ani přesným mapovým podkladem.

## 1.5.0 — navigace, přepočet a reliéf
Všech 23 testovacích souborů a build/check-build prošly. Nové sady cyklo-reroute a cyklo-terrain pokrývají čas/vzdálenost/přesnost GPS, mezery měření, návrat, zachování povinných bodů, ruční/automatický požadavek, single-flight/cooldown, chybu služby, zrušení a opožděné výsledky, vypnutí automatiky, neměnnost plánu a GPX. Terénní sada testuje nezávislé budovy, Terrarium zdroj/atribuci, lazy worker/cache, ekonomický a 2D režim, hustotu/popisky vrstevnic, oddělení chyb podkladu a reliéfu, retry a cleanup. Kamera navíc ověřuje chybějící projekci. UI test ověřuje průběžné uložení číselných tolerancí a neplatnou rozpracovanou hodnotu.
Prohlížeč 390 × 780: nové volby, zachování parametrů terénu po reloadu, číselné hodnoty nepřepisované jiným přepínačem, import lokální testovací trasy s instrukcí, simulace, pokyn Odboč vpravo a vzdálenost po trase. Horní lišta má 58 px, top 181 px, rychloměr končí na 176 px, mapa začíná na 244 px. Panel zůstává při skrytém ovládání, lze jej vypnout přes menu a znovu zapnout mapovým tlačítkem bez ukončení simulace. Snímek screenshots/cyklo-1.5.0-navigation.jpg.
WebGL není v tomto cloudovém prohlížeči dostupné. Skutečné 3D vykreslení, mobilní výkon a fyzický GPS přepočet nejsou touto kontrolou potvrzené; testy stavu nejsou náhradou za terénní akceptaci. Mapy.com klíč nebyl čten ani testován. Přesné odbočovací instrukce Mapy.com nadále nejsou součástí našeho adaptéru (aktuální routing schema je nevrací); panel tuto mezeru nepředstírá.

## 1.6.0

All 23 test files pass; browser verification at 390×780 and 320×780. See [cockpit verification](cyklo-cockpit.md) for geometry measurements, synthetic GPS scope and renderer limitation.

## 1.7.0

All 23 regression files pass, including GPS toggle on/off, GPS off pausing/persisting recording, GPS on not resuming a paused ride, pending fix cancellation, late callback rejection, and unfinished-ride header restore/finish. Browser QA confirms persistent recenter in focus mode, icon-only GPS and header ride controls at 390 and 320 px. See [cockpit](cyklo-cockpit.md).

## 1.8.0

23 test files pass. Added relief toggle, 10 m endpoint and minimum AUTO, visible-map lower-third anchor, floating-panel occlusion, reversible tourist fill colors and raster-provider isolation checks. Browser QA confirms controls and the new fallback anchor; no WebGL is available in the cloud browser. See [details](cyklo-cockpit.md).

## 1.9.0

See [landscape verification](cyklo-landscape.md): three selectable modes, aerial source selection and labels, forest geometry/resource tests and mobile settings QA. Real GPU rendering is not verified in the cloud browser (WebGL unavailable).

## 1.10.0

Vegetation/type/density/LOD/texture/worker tests and all existing regressions pass. Mobile settings checked at 320/390px. Real GPU vegetation rendering remains unverified in the cloud browser; see [implementation and limits](cyklo-landscape.md).
