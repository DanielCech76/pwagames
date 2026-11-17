# Rozhlédnout se – CYKLO 1.19.0

Režim AR je dostupný tlačítkem **AR** vedle 2D/3D v CYKLO Open i CYKLO Mapy.com. Potřebuje jádro 2.1.2, které předává oprávnění kamery a magnetometru do modulu. Stávající verze modulů zůstávají neměnné.

## První použití

1. Na mapě najdi vyhlídku a otevři AR. Zvol GPS, střed mapy nebo zadej souřadnice pozorovatele. Ruční poloha se při spuštění AR nepřepne automaticky na GPS.
2. Zadej výšku telefonu nad terénem: například plošina 25 m + telefon 1,7 m = 26,7 m. Pro společnou výškovou referenci se používá model terénu, nikoli nekorigovaná GPS výška WGS84.
3. Připojený k internetu stiskni **Stáhnout místa a výšky**. Vyber dosah 10, 30 nebo 60 km. Zvolená poloha se odešle Mapterhorn a Overpass. Stahování má průběh a lze je zrušit.
4. Stiskni **Spustit AR · kamera a senzory** a povol kameru, orientaci a případně GPS. Kamera nemá zvuk, nenahrává se a neodesílá se na server.
5. Vyber známý vrchol, namiř na něj středový kříž a stiskni **Zarovnat na cíl**. V případě potřeby dolaď svislý zorný úhel výřezu a zopakuj zarovnání.
6. Přepínač **Kamera / Terén** zachová stejný směr a projekci. Terén je jednoduchý výškový model, bez leteckých textur. Ruční posuvníky umožní prohlížení i bez senzorů.

## Data a offline použití

Ukládá se jedno kompletní okolí do úložiště modulu. Nové úspěšné stažení nahradí předchozí; chyba, zrušení nebo chyba zápisu předchozí balíček zachovají. Balíček obsahuje mřížku 129 × 129 výšek a nejvýše 1 500 pojmenovaných míst. Pro terén se používají z9 Terrarium WebP dlaždice Mapterhorn (nejvýše 36 na balíček), pro místa veřejný Overpass: vrcholy, města, obce, vyhlídky a památky. Po stažení kamera, senzory, popisky, projekce a terén nepotřebují internet; GPS může být bez dostupného signálu nahrazena ruční polohou. Toto stažení nepřidává offline dlaždice do běžné MapLibre mapy. Mapy.com obsah se do AR balíčku nekopíruje.

## Přesnost

Směr ze senzorů je orientační. Zarovnání opravuje azimut a náklon na jeden známý bod; nejde o automatické rozpoznávání krajiny ani o kalibraci objektivu. Zorný úhel zobrazeného výřezu je ruční nastavení, včetně případného ořezu videa na obrazovku. Změna velikosti či orientace obrazovky, výšky nebo dat vyžaduje nové zarovnání. Stav „zarovnáno“ přestane být platný po přesunu nad 100 m nebo po 10 minutách; staré senzory a stará či slabá GPS jsou označené. Při zastarání senzorů se popisky skryjí.

Kontrola zakrytí pracuje s modelem terénu a zakřivením Země, neobsahuje budovy ani stromy a má omezené rozlišení. Popisky bez potřebných výšek nebo ověřeného průběhu terénu jsou přerušované a výslovně označené. Není to záruka skutečné viditelnosti.

## Architektura

- `ar-geo.js`: společné výpočty pozice, orientace zadní kamery, projekce, kalibrace, vyhlazení, výšek a zakrytí; bez závislosti na CYKLO nebo zařízení.
- `ar-data.js`: explicitní, časově omezené a zrušitelné stahování a validace offline balíčku.
- `ar-view.js`, `ar-view.css`: kamera / terén se společnou projekcí, stav přesnosti a ovládání. Host předává pouze úložiště, polohu a střed mapy.

Jádro je připravené pro budoucí zapojení do Letadla; tato verze jej zapojuje do obou edic CYKLO. Navigační šipky, automatické rozpoznávání siluety, WebXR a zarovnání na dva body jsou další etapy.

## Ověření

`node tests/cyklo-ar.test.cjs` ověřuje směry a projekci na výšku/šířku, kalibraci, přechod přes sever, zakřivení, výškové vzorkování, zakrytí terénem, validaci dat, nezačínání sledování při otevření, GPS ID 0, opožděná oprávnění kamery, uvolnění zařízení a ochranu před pozdním stažením po zavření. Regresní kontroly mapy, plánovače, GPS, dialogů, modulu a jádra jsou zachované.

Při kontrole v cloudovém prohlížeči byl dostupný WebGL omezený a živé stažení výšek vrátilo HTTP 502. Chování při chybě je ověřené; přesnost fyzické kamery a kompasu a živé stažení na Androidu je nutné ověřit v terénu.
