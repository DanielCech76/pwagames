# Rozhlédnout se – CYKLO 1.21.1

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


## Oprava 1.19.3 – katalog názvů dostupný přímo s aplikací

Ve standardním průběhu již názvy nepotřebují živý dotaz na Overpass. Aplikace načte verzovaný statický katalog z vlastní adresy `ar-place-data/v1/`. Zdroj GeoNames je uvedený v UI a v `ar-place-data/v1/ATTRIBUTION.md` pod CC BY 4.0; index obsahuje zdrojové URL a SHA-256 oficiálních exportů. Zahrnuje sídla, vrcholy, hřebeny, průsmyky, jezera a vybrané památky pro CZ, AT, SK, DE a PL a větší města ostatních zemí. Nejde o úplný soupis všech turistických bodů celého světa.

Katalog je rozdělen do 149 regionálních buněk po jednom stupni a samostatného základního světového seznamu měst. Soubory jsou gzip komprimované; celkem přibližně 4,3 MB na serveru, telefon při prvním použití načte index, základ měst (přibližně 638 kB) a jen dotčené regionální buňky. Data se filtrují podle skutečné vzdálenosti a limitu 1 500 míst. Dekódování používá vestavěný DecompressionStream v moderním prohlížeči. Při dalším použití se katalog načte z lokálního úložiště; uchovává se nejvýše 24 částí katalogu. Uložené oblasti obsahují přímo vybrané názvy i pro offline režim. Smazání podkladů odstraní také tuto mezipaměť.

Úspěšné načtení katalogu vynechá oba servery Overpass úplně. Overpass zůstává pouze jako záložní cesta při selhání načtení statického katalogu. V balíčku se ukládá zdroj, rozsah a datum snapshotu; názvy z jiného zdroje se nevydávají za OpenStreetMap.

Opakovatelné zpracování zdrojů: `python scripts/build-ar-gazetteer.py --sources /adresar/s/oficialnimi/ZIPy`. Zdroje musí být dodané explicitně; skript sám síť nepoužívá. `node tests/cyklo-ar-catalog.test.cjs` ověřuje všechny komprimované soubory a hashe, skutečné veřejné body v okolí Poděbrad, filtr dosahu, načtení ze stejného hostitele, úplné vynechání Overpass, opakované použití bez sítě a kompletní offline balíček terénu i názvů.


## 1.20.0 – celoplošný výhled a ikonové ovládání

Výhled se otevírá v režimu **Jen mapa**, bez automatického spuštění zařízení. Kamera, senzory a GPS mají nezávislá ikonová tlačítka. Přepnutí na mapu zastaví všechny kamerové stopy včetně opožděného udělení oprávnění; přechod na pozadí vše uvolní. Nastavení se otevírá ozubeným kolem jako boční panel na šířku nebo spodní panel na výšku. Tlačítka mají názvy pro čtečky a nápovědu při najetí; aktivní stav je zelený. Oko schová ovládání, zůstane tlačítko návratu ovládání. Dokončené stahování po zavření nastavení nezabírá obraz, běžící průběh zůstává viditelný.

Minimální výška pozorovatele je 1,7 m (vstup i výpočet); rozhledna se zadává jako výška plošiny plus výška telefonu. Terén má síť soustředěnou kolem pozorovatele (krok 16 m v nejbližším okolí), pokračuje pod kameru a trojúhelníky protínající blízkou rovinu se ořezávají. Rozlišení původního DEM se tím nezvyšuje. Ikona vrstev přepíná plochý a výškový model. Plochý model je perspektivní rovina, nikoli pohled shora; běžná 2D cyklomapa je dostupná návratem. Budovy čerpají skutečné načtené vektorové půdorysy z běžné mapy do 2 km, jejich výšky mohou být odhadnuté (6 m při chybějícím údaji). Nejde o nový offline balíček budov; při chybějících podkladech se zobrazí informace. Budovy a plastický přepínač jsou nad živou kamerou neaktivní.

Popisky mají ikonu typu, vzdálenost a druhý řádek s názvem. Vrcholy, hřebeny a průsmyky přidávají známou nadmořskou výšku; propasti skutečně dostupnou hloubku, nikdy náhradní výšku terénu jako hloubku. Kategorie jsou obce, města, vrcholy, řeky, jezera, moře, propasti, památky a ostatní. Katalog aktuálně neobsahuje všechny tyto typy v každé oblasti; filtr chybějící objekty nedoplňuje. Blízko (výchozí 2 km) se povolují všechny významnosti, středně (do 10 km) hlavní místa a dál významné cíle. Pásma, hustota a kategorie se ukládají do nastavení modulu. Překryvy se vynechávají.

Klepnutí na popisek vybere cíl bez otevření nastavení. Zaměřovač dole vybere nejbližší známý bod ve středu obrazu; vybraný cíl má přednost a šipka na okraji ukazuje stranu při jeho opuštění záběru. Tlačítko zaměření v ručním režimu otočí pohled na cíl, při senzorech vede uživatele šipkou. Samostatné tlačítko zarovná senzory podle známého cíle. Tažením mapy lze bez senzorů měnit směr a náklon.

Ověření zahrnuje projekci a ořezávání, síť pod pozorovatelem, minimální výšku, nezávislé přepínání zařízení, opožděná oprávnění, filtry významnosti i původní testy stahování a offline katalogu. Přesnost kompasu a kamery zůstává k ověření na fyzickém telefonu.


## 1.21.0 – detaily popředí, nápověda a samostatné výchozí GPS/senzory

GPS a orientační senzory se při otevření výhledu standardně spouštějí, kamera nikdy. Volby **GPS při otevření** a **Senzory při otevření** lze vypnout a ukládají se pro konkrétní modul. Telefon může vyžádat oprávnění; pokud prohlížeč vyžaduje další přímé gesto pro senzory, uživatel je povolí ikonou telefonu. Zavření, pozadí a opožděné odpovědi zachovávají dosavadní ochrany.

GPS hláška vznikne jen při prvním platném měření nebo obnovení po chybě; průběžné polohy její konec neposouvají. Nastavení nabízí vypnutí běžných oznámení nebo 3/5 sekund, výchozí 3 s. Chyby oprávnění se zobrazí samostatně. Stav GPS zůstává v malém spodním indikátoru.

Otazník přepíná nápovědu s názvy vedle ikon. Stav se ukládá. Ozubené kolo je přístupné i po skrytí ostatního ovládání a otevře nastavení přímo z výhledu. Nová záložka **Detaily popředí** obsahuje předvolby Úsporné/Vyvážené/Podrobné, dosah 0,5–5 km, jemnost sítě, cesty, vodu, lesní plochy, hustotu a dosah jednoduchých stromů, půdorysy/prostorové budovy. Předvolby ovlivňují skutečnou geometrii, nikoli přesnost zdrojového DEM.

**V kamerovém AR se nikdy nevykreslují stromy ani jiné mapové objekty.** Kamera má pouze popisky a ovládání. Nastavení geometrie je v kameře neaktivní a zůstává zachované pro návrat do mapy. Toto pravidlo platí i při předvolbě Podrobné a při zapnutých stromech. Test ověřuje nulový počet geometrických volání v kamerovém režimu.

Detaily využívají skutečné vektorové prvky OpenFreeMap / OpenStreetMap: transportation, water, waterway, landcover a building. Volba stažení okolí stáhne po terénu a názvech také detaily. V záložce lze spustit nebo zrušit stažení detailů samostatně. Výšky budov bez údaje jsou odhadnuté; stromy jsou schematické, umístěné výhradně do lesních polygonů (včetně respektování otvorů). Nejde o zaměření jednotlivých skutečných stromů. Rozmístění je ukotvené k uložené oblasti, ne ke kameře.

Jeden požadavek detailů má nejvýše 16 vektorových dlaždic, 10 s na index i dlaždici, nejvýše 6000 prvků na oblast. Ukládají se 4 oblasti a 32 binárních dlaždic; následné stažení je znovu používá. Dál se vykresluje zjednodušený terén a filtrované popisky. Automatické doplňování detailů je navázané na již existující výslovné zapnutí automatiky a čerstvou GPS, běží jen v mapovém výhledu, má časový odstup a limit pěti neúspěchů. Zrušení pozastaví automatiku do jejího opětovného zapnutí. Chyba detailů neodstraní terén, názvy ani předchozí oblasti. Smazání podkladů odstraní i detaily.

Mapový výhled používá malý WebGL renderer s hloubkovým bufferem pro správné zakrytí geometrie; bez WebGL zůstává zjednodušená Canvas varianta. Nové ar-detail.js a ar-renderer.js jsou součástí úplného offline modulu. Dekodér vektorů je sestavený z připnutých balíčků pbf, vector-tile a earcut; reprodukce: `node scripts/build-look-vendor.mjs`. Licence jsou ve vendor/.

Ověření 17. 11. 2026: živé stažení v testovacím prohlížeči dokončilo 6/6 dlaždic a uložilo 4619 prvků na 100 %. Přímý požadavek z vývojového shellu vrátil HTTP 403, browserové stažení stejného zdroje fungovalo. Prohlížeč měl dostupnou jen Canvas variantu; skutečná kompilace a linkování GPU shaderů i hloubkové zakrytí byly ověřeny pomocí EGL/GLES (`python scripts/check-look-gpu.py`). Testy zahrnují cache, zrušení, limity, skutečné polygony, otvory, předvolby, výchozí zařízení a neprodlužování GPS hlášky. Fyzickou přesnost senzorů je nadále potřeba ověřit na telefonu.


## 1.21.1 – posouvání nastavení a přednost blízkých popisků

Panel má pevnou výšku odvozenou od viewportu, samostatnou svisle posuvnou část a zvýrazněný scrollbar. Nadpis zůstává nad posuvnou částí, ikonové záložky jsou při posunu přilepené nahoře. Oprava odstraňuje nevyhodnocené procentní max-height, kvůli kterému spodní pole na Androidu přetékala mimo panel.

Výběr popisků nově nejdřív zpracuje blízké pásmo podle vzdálenosti, pak hlavní a vzdálená místa podle významu. Výběr se stále řídí kategoriemi, zakrytím terénem, záběrem a překryvy. Minimální odstup místa je 5 m místo původních 30 m; nejde o záruku přesnosti GPS na 5 m.

Stažené vektorové detaily nově dekódují také pojmenované POI, místní názvy a vrcholy. Z těchto a již dostupných pojmenovaných budov, cest či vodních prvků lze vytvořit blízké popisky; nepojmenované objekty nedostávají vymyšlené názvy. Obyčejný katalog měst nadále nepředstavuje úplný seznam blízkých turistických míst. Pro nové názvy je potřeba znovu stáhnout detaily okolí; binární dlaždice se znovu používají z cache.

Doporučené nastavení: kategorie v záložce Popisky, Blízké detaily do 2–5 km a vyšší Hustota; v Detailech popředí zvolit odpovídající dosah a stáhnout okolí. Hlavní místa do 30 km upravují vzdálenější pásmo, nikoli množství dostupných blízkých objektů. Neznámé nebo skutečně zakryté místo tato nastavení nezobrazí.
