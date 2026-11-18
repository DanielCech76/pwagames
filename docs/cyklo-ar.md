# Rozhlédnout se – CYKLO 1.27.0

## 1.27.0 — Kompaktní panel, načítání 360° a přesouvatelná spoušť

Celý panel používá border-box a jeho flex/grid prvky mají skutečně zmenšitelnou šířku. Záložky mají nulový flex-basis, menší ikony a mezery; přepínače mají 18 px (16 px v úzkém panelu), text kategorií se může zalomit. Tři sloupce používají minmax(0,1fr), pod šířkou panelu 255 px přecházejí kategorie do dvou. Posuvníky, hodnoty a výběry nepřesahují vlastní řádek. Vertikální posouvání zůstává pouze pod pevnými záložkami. V prohlížeči byly všechny záložky ověřeny také v malém zobrazení 700 × 320: obsah i záložky mají shodnou scrollWidth a clientWidth, tedy žádný vodorovný ořez.

Automatika zůstává volitelná a vyžaduje otevřený výhled, online připojení a skutečnou GPS do 30 s s přesností do 50 m. Nově běží také při ruční výšce a v kameře. Má jediný postup: (1) výšky a názvy odhadovaného aktuálního záběru s rezervou, (2) jeho blízké pojmenované objekty, (3) výšky a názvy v celém okolí pozorovatele pro otočení 360°, (4) podrobné objekty celého blízkého okolí. U pohledu k horizontu používá omezený výsek ve směru pohledu, s úhlovou i prostorovou rezervou; u nadhledu přednostně odhad průsečíku se zemí. Výškové dlaždice se řadí podle prioritní oblasti. Celé okolí má uživatelem zvolený dosah 10/30/60 km, blízké objekty nastavených 500 m až 10 km. Při pouhém otočení se plán neruší ani znovu nezačíná; nová poloha nebo výrazná změna výšky jej přepočítá.

Průběh rozlišuje Záběr 1/2 a Okolí 360° 2/2. Připravené 360° hlásí až po ověření pokrytí celého rozsahu včetně dokončených názvů a nezkrácených detailů. Při chybě, neúplných datech nebo dosažení limitu zůstává neúplnost označená a opakování má odstup. Zrušení zastaví i následující fáze, zavření zruší přenosy, vypnutí automatiky přeruší její právě probíhající fázi. Hotové oblasti a dlaždice se znovu použijí. Přetrvává limit čtyř uložených oblastí, 48 výškových a 64 detailních dlaždic a 12 000 prvků jedné detailní oblasti.

Toto přednačítání pokrývá vlastní výšky, katalogové názvy a pojmenované vektorové objekty. Není to úplný offline balíček nativního mapového podkladu MapLibre/OpenFreeMap, jeho stylu a všech úrovní přiblížení. Nativní podrobná mapa se stále načítá online. Za nastaveným dosahem nebo při výpadku zdroje se úplnost neslibuje.

Spoušť fotografie má bezpečné výchozí umístění oddělené od tlačítka s okem. Podržení 550 ms zapne viditelně označený režim přesunu. Tažení mění polohu bez fotografie; uvolnění po podržení či tažení je potlačené. Následující samostatné krátké klepnutí spoušť zafixuje a zapíše souřadnice do předvoleb. Teprve další krátké klepnutí fotografuje. Poloha je relativní a ukládá se zvlášť pro výšku/šířku; po změně velikosti se omezí do obrazu a vyhne se ovládací liště, oku, informační liště, odkazu PNG i otevřenému nastavení. Dočasné odsunutí při otevření panelu nemění uloženou polohu. Během přesouvání neběží automatické skrývání; šipky klávesnice přesouvají, Escape ruší neuloženou změnu. Uzavření výhledu vyčistí časovače a gesta.

Ověření: 48 sestavovacích a regresních kontrol. Nové testy ověřují pořadí všech čtyř fází, 360° pokrytí, ruční výšku, opakované otočení bez přenosu, jeden probíhající postup, zrušení a starou/offline GPS; další test ověřuje podržení/tažení/zafixování, nulové nechtěné fotografie, hranice, kolizi s okem, předvolby obou orientací a úklid. V prohlížeči ověřen panel 700 × 320 a 390 × 844, skutečné tažení spouště a návrat uložené polohy po přepnutí režimu, nad syntetickým videem. Fyzická kamera, senzory a WebGL mapa se v tomto prostředí neověřovaly.


## 1.26.0 — Schválená grafika, vzdálenostní řady a nové objekty

Panel reprodukuje schválený návrh pomocí skutečných SVG ikon a CSS: neprůhledná tmavě zelená plocha, samostatných pět ikonových záložek bez světlého společného podkladu, limetkové zvýraznění, zaoblené přepínače a posuvníky. Název i záložky jsou pevné. Samostatný posuvný obsah začíná pod záložkami a je oříznutý, takže se za nimi nemohou zobrazovat prvky nastavení. Ovládání je přizpůsobeno oběma orientacím telefonu.

Po výběru podle významnosti se karty rozmisťují od nejvzdálenějšího objektu k nejbližšímu. Vzdálenější karta nikdy neleží pod bližší; mohou sdílet jednu řadu. Každá karta leží nad svým bodem a nezobrazuje se, pokud na ni nad bodem není místo. Spojnice je přímá bez hrotu: blízko silnější tmavě zelená se světlým obrysem, obzor tenká černá, za obzorem přerušovaná černá. Oba konce musí být uvnitř mapy; připnutí to nemůže obejít. Cíle za obzorem ukazují směr na horizontu, nejsou vykreslené jako viditelné místo pod zakřivením Země. Tyto typy spojnic používá také fotoexport. Původní 650ms podržení mimo obraz z verze 1.25.0 se již nepoužívá.

Nové samostatné filtry jsou Budovy, Instituce a Přehrady. Pojmenované školy, univerzity, nemocnice a další veřejné instituce rozlišujeme podle atributů OSM; nádrže a přehrady podle typu vodního objektu nebo vodního názvu. Data se získávají z uložených detailů a také z již načtených vektorových dlaždic mapy. Nativní názvy OSM zůstávají dostupné; vlastní karty respektují filtry a kapacitu obrazovky. Nepojmenovaným objektům názvy nevymýšlíme.

Dosah za obzorem je 50–1 000 km. Běžné objekty a skupina Obzor jsou omezené 200 km. Nad 200 km se při doplnění názvů připojuje lehký katalog `ar-place-data/significant-v1/`, který obsahuje 5 946 velkých měst a hlavních měst celosvětově a 334 vysokých vrcholů ve střední Evropě a Alpách (CZ, AT, SK, DE, PL, CH, FR, IT, SI). Města mají nejméně 100 000 obyvatel nebo jsou národní metropolí. Vrcholy mají uvedenou výšku nejméně 1 500 m; z 20km okolí ponecháváme nejvyšší dostupný. Toto prostorové zjednodušení není skutečná prominence a katalog není úplný světový seznam hor. Výchozí přepínač „Jen velká města a dominantní vrcholy“ omezuje další případně dostupné cíle nad 200 km podle doložené velikosti/výšky. Samotné vypnutí filtru nestahuje další data. U neznámé výšky cíle počítáme geometrický horizont konzervativně s nulovou nadmořskou výškou a skutečnou viditelnost označujeme jako neověřenou.

Vzdálené názvy nevyžadují stahování DEM do 1 000 km. Podrobná část katalogu používá pouze blízké buňky do 100 km, samostatný dlouhý dosah pokrývají města a vybrané vrcholy. Chybějící regionální pokrytí se nevydává za úplné. Zdrojové exporty GeoNames, licence CC BY 4.0, výběrová pravidla a kontrolní součty uvádí manifest a reprodukovatelný skript `scripts/build-ar-significant.py`.

Ověření vydání: 46 sestavovacích a regresních kontrol, včetně skutečného dlouhého katalogu, pořadí podle vzdálenosti, spojnic uvnitř záběru, nových kategorií a PNG kreslení. V prohlížeči ověřen panel na výšku 390 × 844 i na šířku 844 × 390, pevné záložky při posouvání a živé popisky nad syntetickým obrazem kamery. Fyzické senzory a WebGL mapa nejsou v testovacím prohlížeči dostupné; nešlo o test vykreslování na skutečném telefonu.


Režim AR je dostupný tlačítkem **AR** vedle 2D/3D v CYKLO Open i CYKLO Mapy.com. Potřebuje jádro 2.1.2, které předává oprávnění kamery a magnetometru do modulu. Stávající verze modulů zůstávají neměnné.

## První použití

1. Otevři AR na cyklomapě. GPS a senzory se standardně spustí; oprávnění telefonu je nutné povolit. Lze použít také střed mapy nebo ruční souřadnice.
2. Krátké klepnutí na ikonu přepíná její funkci, podržení přibližně 0,55 s otevírá související nastavení. Panel zavřeš stejnou ikonou, klepnutím mimo něj nebo podržením jiné ikony.
3. V Podkladech stáhni terén, názvy a detaily okolí. Upozornění na chybějící podklady otevírá tento panel přímo.
4. Ikona se svislými šipkami přepíná automatickou výšku telefonu a ruční nadhled 1,7 m až 20 km nad terénem. Ruční výšku nastavíš svislým posuvníkem; tlačítko pod ním vrací automatickou výšku. Směr i náklon řídí senzory v obou režimech. Bez senzorů lze pohled měnit tažením. Automatická výška vždy používá plochou mapu bez prostorových budov, ruční výška umožňuje reliéf a budovy. Dosah blízkých detailů je 500 m až 10 km. Tlačítko Podkladů nabízí odhadovaný záběr + 20 % rezervy.
5. Kamera se zapne výhradně její ikonou. V kameře se používá skutečná výška telefonu, nikoli ruční nadhled. Vždy viditelná spoušť vytvoří PNG s obrazem a právě viditelnými popisky; šipkou PNG lze poslední snímek stáhnout znovu. Kamera nenahrává zvuk ani neodesílá obraz na server.
6. Pro přesnější směr zvol známý cíl a zarovnej jej se zaměřovačem. Obecné nastavení nabízí ruční/automatické skrývání ovládání a interval 2–60 s. Během otevřeného nastavení nebo pořizování fotografie se ovládání automaticky neschovává.

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


## 1.22.0 – kontextové panely, ruční nadhled a fotografie s popisky

Dlouhé podržení je implementované pointer událostmi s prahem 550 ms, potlačením následného syntetického kliknutí a zrušením při posunu prstu nad 12 px. Nový dotyk vymaže potlačení předchozího gesta, aby i prohlížeč bez syntetického kliknutí zavřel panel prvním následujícím tapnutím. Současně je otevřen pouze jeden panel. Kliknutí mimo něj jej zavře; krátké kliknutí na ikonu, která jej otevřela, neprovede zároveň přepnutí původní funkce.

Ruční nadhled je výška nad místním terénem (AGL), nezmění uloženou skutečnou polohu ani nastavení výšky telefonu. Přepnutí do kamery obnoví původní směr/náklon a skutečnou výšku. Návrat do terénu obnoví ruční nadhled. Pro mapový nadhled se senzory směru nepoužívají; tažení ovládá azimut a náklon. Terén je prostorově stínovaný, ulice a místní názvy pocházejí ze skutečných vektorových dat; nejde o letecké fotografie.

Dosah podrobné mapy lze měnit posuvníkem 500 m až 10 km. Podklady detailů mají nyní limit 64 dlaždic na oblast, cache 64 dlaždic a 12000 uložených prvků na oblast; přetečení limitu je označené jako neúplné. Zachovávají se čtyři oblasti. Terén se vzorkuje z více uložených oblastí, s předností jemnějšího modelu, a názvy se sloučí z uložených oblastí i detailů. Tím lze využít podklady nového záběru i při odlišně umístěném středu oblasti.

Viditelná oblast se konzervativně odhaduje z mřížky paprsků zorného pole a kulového povrchu Země, včetně půdorysné polohy pozorovatele. Přidává se rezerva 20 % a zaokrouhlení nahoru na kilometry. Nejde o přesné promítnutí každého pixelu na detailní terén. Záběr sahající za horizont nebo vyžadující poloměr větší než 60 km se výslovně označí; aplikace jej nevydává za úplně stažený. Tlačítko doplní terén a názvy pro tento odhad a samostatně podrobnou mapu v nastaveném dosahu od polohy kamery. Stávající podklady zůstávají při chybě zachované. V ručním nadhledu se doplňování záběru spouští výslovným tlačítkem.

Fotografie kopíruje stejný cover výřez videa jako živý obraz. Popisky, ikony a spojnice se vykreslí do PNG podle aktuálních viditelných karet; ovládání a nastavení se do snímku nepřidávají. Maximální delší strana je 1920 px. Obrázek se vytváří lokálně, automaticky se nabídne ke stažení a poslední PNG lze uložit znovu viditelnou šipkou. Blob URL se uvolní při novém snímku nebo zavření. Spoušť zůstává v kameře viditelná i při ručně nebo automaticky skrytém ovládání. Stromy se v kamerovém AR nikdy nevykreslují.

Ověření: test záběru ve výšce 1,7 m, 1 km a 20 km, horizont a limity rezervy, kombinace terénních oblastí, návrat k reálné výšce kamery, správný cover ořez a PNG, dlouhé podržení a mobilní gesta, zavírání mimo panel, ochrany automatického skrývání a odstranění listenerů. V prohlížeči byl ověřen nadhled 20 km, návrat do kamery, viditelná spoušť při skrytých ovladačích a skutečně stažený PNG s popisky ze syntetického testovacího obrazu. Fyzická kamera a chování ukládání na Androidu nebyly v cloudovém prohlížeči dostupné k přímému ověření.


## 1.23.0 — Podrobný plastický nadhled

Ruční terénní nadhled nyní standardně používá MapLibre a styl Liberty z OpenFreeMap, stejný podklad jako hlavní otevřená mapa CYKLO. Zobrazuje ulice, názvy, vodní plochy, využití území, stínovaný reliéf Mapterhorn a volitelné prostorové budovy. Nejde o fotogrammetrický model; tvar a výška budov závisí na mapových datech. Tlačítko budov řídí extruze, dosah detailů 500 m až 10 km omezuje jejich zobrazení kolem pozice kamery. Základní podklad pokrývá celý záběr.

Panel Detaily nabízí „Podrobná 3D mapa · online“ a „Zjednodušený terén · offline“. Podrobná mapa je v obou edicích OpenFreeMap; nemění nastavení hlavní cyklomapy. Načítá se online, není součástí stávajícího stažení AR oblastí. Panel Podklady tento rozdíl výslovně uvádí. Offline záloha nadále používá uložený DEM, názvy a geometrii detailů. Při chybě podrobné mapy, nedostupném WebGL, pohledu výše než 5° pod horizontem nebo požadavku přes maximální zoom knihovny se automaticky vykreslí záloha. Pro nový pokus lze přepnout typ nadhledu v panelu Detaily. Fyzický pohled z aktuální výšky telefonu zůstává na původním vykreslení; podrobná mapa je určena pro ručně zvolený nadhled.

Kamera mapy vychází z absolutní výšky oka, směru, náklonu a stejného vertikálního zorného úhlu jako GeoLook. Terénní upnutí středu je vypnuté, aby knihovna svévolně neměnila nastavenou výšku. Popisky při podrobném zobrazení používají projekci mapy. Přepnutí do kamery podrobnou mapu odstraní; AR kamera nadále používá živé video a popisky, bez stromů a bez mapové geometrie. Zavření výhledu uvolní mapu, reliéf i posluchače. Opraveno také zachování výšky nadhledu při změně nastavení automatického skrytí nebo nápovědy.

Ověření: regresní sada a nový test absolutní pozice kamery, shodného FOV na výšku/šířku, přepínačů reliéfu a budov, vzdálenostního filtru, zálohy u horizontu/limitu zoomu, chyb a odstranění mapy. V testovacím prohlížeči WebGL nelze inicializovat; ověřena automatická záloha, přepínač typu nadhledu a návrat do kamery. Výsledný vzhled podrobné mapy na fyzickém telefonu nebyl přímo ověřen.


## 1.24.0 — Senzory, ovládání výšky a blízké vrstevnice

Výška je nezávislá na orientaci. Přepínání automatické/ruční výšky, tažení posuvníku ani přechod mezi terénem a kamerou nevypínají senzory a nemažou kalibraci. Senzory určují směr, náklon i natočení obrazu kolem osy pohledu. Vypnutí senzorů zachová poslední směr pro ruční ovládání. Kamera nadále používá skutečnou výšku telefonu.

Samostatná ikona výšky (svislé šipky s měřítkem) krátkým dotykem přepíná automatickou a ruční výšku. V ručním režimu se vedle pravé lišty otevře úzký svislý logaritmický posuvník 1,7 m–20 km; nahoře je hodnota, pod posuvníkem ikonové tlačítko automatické výšky telefonu. Podržení ikony otevře posuvník bez změny režimu; jeho posunutí aktivuje ruční výšku. Dotyk mimo panel nebo Escape jej zavře. Automatické skrývání ovládání po dobu otevřeného posuvníku neběží. Posuvník podporuje klávesnici a má vertikální orientaci i slovní hodnotu pro čtečky.

Automatická výška vždy vykresluje nulovou mapovou rovinu, bez výškového reliéfu a bez prostorových budov; kamera mapy je o nastavenou výšku telefonu nad touto rovinou. Půdorysy budov ve standardním mapovém podkladu mohou zůstat viditelné. Přepínače reliéfu a prostorových budov jsou v automatické výšce neaktivní. Ruční výška umožňuje plastický reliéf i volitelné budovy; poslední volba budov se zachovává. Nastavení Detaily nyní zobrazuje pouze dosah detailů a budovy; stará nastavení zelené geometrické mapy se v UI nenabízejí.

MapLibre používá stejný vertikální zorný úhel jako GeoLook, výšku oka, směr, náklon i roll. Rozsah náklonu mapy je 0–179° a zoomu do 30, aby pohled k horizontu a blízko země nepřepínal na jiný renderer. Výškové přichytávání středu zůstává vypnuté. Podrobná mapa se používá v obou výškových režimech. Starý zelený terén a čáry ulic se nevykreslují ani při prvním načtení, změně výšky, nedostupnosti dat nebo WebGL. Během načítání je vidět indikátor, při chybě explicitní informace. Mapa se odkryje po prvním vykreslení načtených dlaždic. V ručním reliéfu se čeká na výšku pozorovatele ze staženého DEM nebo z mapy; skutečná nula metrů je platná výška. Selhání vrstevnic ponechá základní mapu, selhání DEM je oznámené a ponechá plochý podklad.

Vrstevnice používají stejný lokálně přibalený generátor a výškový zdroj Mapterhorn jako hlavní cyklomapa. Zobrazují se do výšky nadhledu 3 000 m, při zoomu 12 až 24, v nastaveném dosahu detailů, maximálně 5 km od pozorovatele. Rozestup čar se mění s přiblížením; významné vrstevnice mají výškové popisky. Ve vzdáleném přehledu se vrstvy skryjí. Nastavení hlavní cyklomapy se nemění.

Podrobný podklad nadále potřebuje dostupná online data; stávající stažení AR ukládá DEM, názvy a geometrii/bodové detaily, nikoli kompletní stylovanou MapLibre mapu. Offline uložené výšky a názvy zůstávají použitelné pro kamerové popisky. Odstranění staré záložní scény tuto skutečnost neskrývá.

Ověření: všech 44 kontrol vydání, nové případy skutečného řadiče (senzorové události → kalibrace/vyhlazení → kamera mapy v ruční a automatické výšce), zachování senzorů, nucená rovina a vypnuté budovy, posuvník/automatická výška, roll, pohled nad horizont, zoom u země, blízké vrstevnice, částečné chyby, čekání na skutečné nulté DEM a odstranění mapy. V prohlížeči ověřeny oba konce posuvníku, návrat na automatickou výšku, kompaktní panel a kamera se spouští. Testovací prohlížeč neumožňuje vytvořit WebGL kontext; fyzické senzory a finální vykreslení podrobné mapy/vrstevnic na telefonu nebyly přímo ověřeny.

### 1.24.1 — Nativní dlouhé podržení výšky

Nativní kontextové gesto telefonu i pravé tlačítko myši otevírají přímo svislý posuvník výšky, stejně jako časované podržení. Přidán regresní případ, aby toto gesto neotevíralo prázdný obecný panel.


## 1.25.0 — Stabilní orientace a vysvětlitelné popisky

Opraveno znaménko bočního natočení při převodu z ENU orientace telefonu na MapLibre roll. Výchozí stabilní horizont mapy ponechává směr a pohled nahoru/dolů, ale potlačuje boční naklánění. Lze jej vypnout v Nastavení výhledu. Slabá, běžná a silná stabilizace používají potlačení drobného chvění a adaptivní vyhlazení; záměrné větší otočení dohánějí rychleji. Jednorázový velký skok kompasu musí přetrvat 150 ms, než se přijme. Mapa a popisky používají shodnou vyhlazenou orientaci. Kamera zachovává natočení živého videa; přepnutí režimu resetuje filtr bez změny kalibrace.

Popisky mají nezávislé skupiny Blízko (v zorném poli a nastaveném blízkém dosahu), Obzor (vzdálenější významné objekty ve směru pohledu) a Za obzorem (zakryté terénem nebo geometricky za horizontem). Výchozí stav je Blízko + Obzor zapnuté, Za obzorem vypnuté. Geometrický horizont vychází ze sférické Země a známých nadmořských výšek; nejde o výpočet atmosférické refrakce. Zakrytí mimo 60 km je bez podrobnějšího DEM neověřené. V ploché mapě zůstávají blízké názvy viditelné i tam, kde by je reálný terén zakrýval. Vzdálené karty používají geografický směr a výšku cíle, nikoliv projekci na nulovou mapovou rovinu; tím lze pojmenovat skutečné vrcholy u obzoru i při plochém podkladu. Zakryté cíle jsou tlumené a mají přerušované šipky; neověřená viditelnost je označená a popsaná.

Posuvník Významné objekty nastavuje maximum 5–100 vzdálených karet (výchozí 32), nezávisle na hustotě blízkých detailů. Dosah je 10–200 km. Vždy platí skutečná kapacita obrazovky, zapnuté typy/skupiny a dostupnost názvů. Karty jsou rozmístěné do více řad a jejich vodicí čáry se kreslí pod kartami, aby nepřekrývaly text. Vybraný či připnutý cíl má přednost a může překonat vypnutou skupinu nebo filtr. Připnutí je samostatná ikona v liště vybraného cíle a ukládá se do nastavení (nejvýše 100 cílů).

Výběr se vyhodnocuje přibližně čtyřikrát za sekundu, samotné souřadnice se mění plynule každý snímek. Nové objekty čekají 250 ms na ustálení, již zobrazené mají 1,2 s zvýšenou prioritu a poté mírnou preferenci. U okrajů platí jiné hranice pro objevení a zmizení a krátké podržení maximálně 650 ms. Svislá změna řady a průhlednost jsou plynulé. Aktualizace polohy či dat už neruší všechny DOM karty a jejich historii. Základní pořadí tvoří význam z katalogu (0 nejvyšší), typ a vzdálenost; prominence a počet obyvatel pomáhají pouze tam, kde jsou skutečně v podkladech uvedené. Nadmořská výška se nevydává za prominenci.

Přehled uvádí počty „V podkladech → odpovídá filtrům → ve směru pohledu → zobrazeno“. V rozbalovací části Proč právě tyto popisky lze u objektu zjistit skupinu, vzdálenost, význam z katalogu, ověření viditelnosti a důvod skrytí (filtr, dosah, směr, ustálení, limit, překryv). Podrobnosti jsou také v popisu přístupnosti a titulku karty.

Doplnit vzdálené názvy načte z katalogu aplikace nejvýše 6 000 bodů do zvoleného dosahu, odděleně od původního DEM balíčku s limitem 1 500 míst. Jde pouze o názvy, ne o stahování terénu do 200 km. Data se uloží pro opětovné použití a mají vlastní zrušení. Chyba nebo zrušení zachová předchozí vzdálený katalog; zavření výhledu zruší probíhající požadavek. Pro velmi rozsáhlé oblasti ve vysokých zeměpisných šířkách platí stávající limit 36 buněk katalogu; při jeho překročení je nutné snížit dosah. Chybějící názvy ani výšky se nevymýšlejí. Smazání stažených podkladů odstraňuje i tento samostatný seznam.

Trvalá nativní ikona „i“ MapLibre je odstraněná. Uvedení mapových zdrojů se zobrazí při prvním skutečném zobrazení mapy alespoň na 5 s, později při zapnuté nápovědě. Zdroje mapových dat a licence jsou vždy dostupné v Nastavení výhledu, včetně odkazů na OSM/ODbL, OpenMapTiles, OpenFreeMap, Mapterhorn a GeoNames. Tento způsob vychází z pravidel https://osmfoundation.org/wiki/Licence/Attribution_Guidelines a https://openfreemap.org/ (attribution). V kameře se zbytečně nezobrazuje mapový kredit. Fotoexport respektuje délku a směr nových šipek, průhlednost a připnutí; všechny šipky jsou vykreslené před kartami a nemohou přepisovat jejich text.

Ověření: 45 kontrol vydání včetně nových testů chvění, průchodu severem, náklonu a roll, kompasového výkyvu, tří skupin, plochých blízkých názvů, ustálení, zachování řad, priority připnutí, vysvětlení, 64 současných vzdálených karet, hystereze okrajů a fotošipek. Test skutečného katalogu ověřuje rozšířený výběr nad 1 500 bodů. V prohlížeči se syntetickým obrazem kamery ověřeny filtry a počty, vysvětlení konkrétního vrcholu, stabilizace, připnutí a stažení PNG s rozloženými kartami. Fyzické senzory a WebGL vykreslení mapy nelze v testovacím prohlížeči přímo ověřit.
