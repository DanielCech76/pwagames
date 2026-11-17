# Rozhlédnout se – CYKLO 1.19.2

Režim AR je dostupný tlačítkem **AR** vedle 2D/3D v CYKLO Open i CYKLO Mapy.com. Potřebuje jádro 2.1.2, které předává oprávnění kamery a magnetometru do modulu. Stávající verze modulů zůstávají neměnné.

## První použití

1. Na mapě najdi vyhlídku a otevři AR. Zvol GPS, střed mapy nebo zadej souřadnice pozorovatele. Ruční poloha se při spuštění AR nepřepne automaticky na GPS.
2. Zadej výšku telefonu nad terénem: například plošina 25 m + telefon 1,7 m = 26,7 m. Pro společnou výškovou referenci se používá model terénu, nikoli nekorigovaná GPS výška WGS84.
3. Připojený k internetu stiskni **Stáhnout místa a výšky**. Vyber dosah 10, 30 nebo 60 km. Zvolená poloha se odešle Mapterhorn a Overpass. Stahování má průběh a lze je zrušit.
4. Stiskni **Spustit AR · kamera a senzory** a povol kameru, orientaci a případně GPS. Kamera nemá zvuk, nenahrává se a neodesílá se na server.
5. Vyber známý vrchol, namiř na něj středový kříž a stiskni **Zarovnat na cíl**. V případě potřeby dolaď svislý zorný úhel výřezu a zopakuj zarovnání.
6. Přepínač **Kamera / Terén** zachová stejný směr a projekci. Terén je jednoduchý výškový model, bez leteckých textur. Ruční posuvníky umožní prohlížení i bez senzorů.

## Data a offline použití

Ukládají se nejvýše 4 kompletní oblasti do úložiště modulu a nejvýše 48 výškových dlaždic pro opakované použití. Chyba, zrušení nebo chyba zápisu předchozí oblasti zachovají. Balíček obsahuje mřížku 129 × 129 výšek a nejvýše 1 500 pojmenovaných míst. Pro terén se používají z9 Terrarium dlaždice Mapterhorn nebo záložního AWS Terrain Tiles (nejvýše 36 na balíček), pro místa veřejný Overpass: vrcholy, města, obce, vyhlídky a památky. Po stažení kamera, senzory, popisky, projekce a terén nepotřebují internet; GPS může být bez dostupného signálu nahrazena ruční polohou. Toto stažení nepřidává offline dlaždice do běžné MapLibre mapy. Mapy.com obsah se do AR balíčku nekopíruje.

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


## Oprava 1.19.1 – spolehlivější stahování a automatické doplňování

Původní klient měl 20sekundový časový limit pro výškovou dlaždici. Interní timeout i ruční zrušení vyvolaly AbortError a UI oba případy označilo jako „Stažení zrušeno“. Tento text proto nebyl důkazem ručního zrušení. Nový klient rozlišuje timeout (zdroj, dlaždice a limit), HTTP chybu, síť/CORS a skutečné zrušení podle nadřazeného signálu.

Mapterhorn doplňuje záložní AWS Terrain Tiles / Mapzen ve stejném formátu Terrarium. Zdroj, který v dané relaci uspěl, má přednost pro další chybějící dlaždice. Hotové dlaždice se ukládají průběžně do lokální mezipaměti, takže opakování po chybě nebo zrušení znovu nestahuje dokončené dlaždice. Limit mezipaměti je 48 dlaždic. Při přímém ověření 17. 11. 2026 v prostředí vývoje Mapterhorn vrátil HTTP 403, zatímco stejná z9 dlaždice z AWS vrátila HTTP 200 a Access-Control-Allow-Origin: *. To neprokazuje stejnou příčinu na telefonu uživatele; nová diagnostika umožňuje příčinu rozlišit přímo v aplikaci.

Průběhový ukazatel je dostupný i při zavřeném nastavení. Terén tvoří 0–80 %, názvy míst 85–95 % a uložení 97–100 %. Zobrazuje také počty dlaždic, použití cache a dostupné počty stažených bajtů. 100 % se zobrazí až po úspěšném zápisu. Pokud nejsou názvy dostupné ani z druhého Overpass serveru, terén se přesto uloží, neúplné názvy jsou zřetelně označené a lze je později doplnit. Názvy se znovu nepoptávají, pokud je celé požadované okolí již pokryté úplnými uloženými názvy.

Volba **Automaticky doplňovat chybějící podklady při GPS** je standardně vypnutá a ukládá se v daném modulu. Po zapnutí pracuje jen při otevřeném AR, čerstvé GPS do 30 s a přesnosti do 50 m. Ručně zvolená poloha, známý offline stav a staré měření automatické požadavky nespouštějí. Na hranici 90 % poloměru pokrytí doplní nové okolí, aby výhled nezůstal bez dat po opuštění oblasti. Používá uložené dlaždice a uchovává nejvýše 4 poslední oblasti. Názvy nového okolí se dotazují pro tuto oblast a mohou se překrývat s předchozími výsledky.

Najednou běží jediný požadavek. Po úspěchu je minimální odstup 30 s; při selhání se čekání prodlužuje až na 5 min, po 5 neúspěšných pokusech se automatika pozastaví. Ruční zrušení automatického stahování je rovněž pozastaví. Pokračování vyžaduje vypnout a zapnout volbu. Zavření AR nebo přechod na pozadí stahování ukončí. Smazání podkladů smaže oblasti i mezipaměť a automatiku pozastaví.

`node tests/cyklo-ar-download.test.cjs` přidává kontroly záložního zdroje, znovupoužití dlaždic a názvů, částečného výpadku názvů, rozlišení timeoutu a zrušení, průběhu, automatického doplňování pouze po souhlasu, pokrytí, GPS a offline podmínek, souběhu, cooldownu, zrušení a limitu cache.


## Oprava 1.19.2 – terén dostupný před názvy a pravdivý stav po návratu

Ve verzi 1.19.1 se celá mřížka terénu stále ukládala až po dokončení nebo timeoutu dotazu na názvy. Nově se celý terén s dosud známými názvy atomicky uloží a zpřístupní ihned po dokončení dlaždic; nezávislý dotaz na názvy tuto dostupnost neblokuje. Pozdější přerušení dotazu zachová použitelný terén.

Dotazy na názvy mají nejvýše dva pokusy po 12 s, serverový výpočet nejvýše 8 s. UI zobrazuje skutečnou dobu čekání, číslo pokusu a zbývající limit. Síťový helper vynucuje nezávislý hard deadline pomocí Promise.race; nespoléhá pouze na to, že fetch nebo čtení těla odpovědi po abortu odmítne Promise.

Při zavření nebo přechodu na pozadí se ukazatel okamžitě označí jako přerušený, včetně příčiny a informace o uloženém terénu. Tento stav zůstane pravdivý i po opětovném otevření místo starého „běžícího“ 85 %. Čerstvá poslední poloha GPS do 30 s se při návratu zachová; starší se za aktuální nevydává.

Regresní test reprodukuje postup terén → čekání na názvy → pozadí → návrat a opožděnou odpověď staré relace. Ověřuje dostupnost a uložení terénu před odpovědí názvů, odpočet, ukončený ukazatel, zachování čerstvé GPS, odmítnutí staré GPS a hard deadline i pro transport ignorující AbortController.
