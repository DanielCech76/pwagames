# CYKLO 1.14.0 — vzdálená textura a blízké 3D objekty

## Ovládání

Ve 3D krajině je ve výchozím stavu zapnuté „Vzdálenou krajinu nahradit texturami“. Dosah 3D detailů lze zvolit 100 / 200 / 350 / 500 / 1000 / 2000 metrů; výchozí je 500 m od kamery. Max. oblast 3D vegetace dále omezuje poloměr výpočtu stromů a keřů. Menší dosah detailů snižuje množství vytvářené a vykreslované geometrie, vzdálený porost ale nadále zobrazuje plošná textura. Při vypnutí přepínače se vrací předchozí zjednodušované vzdálené modely.

## Podporované prvky

- Listnaté, jehličnaté a smíšené lesy: vzdálené koruny mají stejnou paletu jako 3D modely. Hustota a velikost vegetace mění počet a velikost korun v textuře. Ruční typ lesa má přednost; v režimu auto se pro výplň uplatní dostupný leaf_type/leaf:type/wood. Bez těchto dat používá textura stejný regionální výškový odhad jako modely. Textura je obraz očekávaného porostu, nikoli fotografie nebo evidence konkrétních stromů.
- Křoviny, nízké porosty a podrost: textura a 3D shluky využívají stejnou paletu a společný dosah.
- Louky a pole: používají lehké procedurální povrchové textury; 3D stébla ani jednotlivé plodiny aplikace nepodporuje. Pole používají skutečnou vrstvu landuse, ostatní porosty landcover.
- Zapnuté 3D budovy v krajině: mimo dosah zůstanou ploché texturované půdorysy. Filtr skutečně vyřadí vzdálené extruze; jejich výška a základna klesá v přechodovém pásmu. Původní filtr a výškové výrazy se zachovávají a obnovují po vypnutí funkce. Dostupné jen tam, kde podklad podporuje vektorové 3D budovy; raster Mapy.com je nepodporuje.

## Vzdálenost a výkon

Z projektivní matice se počítá skutečná poloha kamery pro shader. Pro přípravu lokální geometrie se používá poslední odpovídající poloha kamery; do její dostupnosti odhad z veřejných údajů zoomu, náklonu, směru a výšky viewportu. Vzdálenost zohledňuje i výšku kamery. Pokud je celá scéna za dosahem detailů, neprovádí se ani dotazování/samplování polygonů stromů, nevzniká mesh a starý mesh se invaliduje. Při přiblížení se generuje pouze blízká oblast. Limity kvality (1000/3000/6000 prvků), worker, omezení vrcholů a vyloučení vody, budov a okolí cest zůstávají zachované.

Shader vypíná detail za hranicí dosahu a posledních 25 % překrývá s texturou pomocí levné uspořádané masky bez průhledného blendování. Příprava geometrie je omezená a časovaná, nikoli spuštěná pro každý snímek. Textury jsou 64×64, procedurální, lokální a aktualizované jen při změně parametrů/regionálního profilu. Barevné palety sdílí kód s 3D objekty; textura i vzorek jsou deterministické. Textury se vkládají pod dostupné vektorové cesty/vodu/budovy. U rastrového podkladu jsou plochy pouze stylizovaným překryvem; jejich geometrie může být jiná než v rastru.

## Ověření

Automatické testy ověřují nulovou geometrii a nulové samplování ve vzdáleném pohledu, vznik blízkých modelů, invalidaci po oddálení, vliv hustoty/typu/velikosti na textury, extrakci kamery z projektivní matice, filtrování budov, pořadí vrstev, cache a úklid. Původní testy ověřují polygonové otvory, vyloučení vody/cest/budov, DEM, GL stav a worker. Shadery byly navíc skutečně přeloženy a slinkovány v OpenGL ES 3 kontextu EGL. Výkon na konkrétním telefonu ani vizuální přechody za jízdy tím nejsou změřené.

## 1.14.1 — nový základ velikosti

Nových 100 % odpovídá původním 50 %. Výška i odvozená šířka všech vegetačních modelů a velikost jejich stopy v dosavadní textuře používají poloviční základ. Při jednorázovém převodu nastavení (`treeSizeVersion=2`) se původních 50 % převede na 100 %; původní výchozí 100 % také přijme nový menší základ. Ostatní vlastní hodnoty se zdvojnásobí, aby zachovaly fyzickou velikost. Rozsah je proto nově 50–300 %. Styl textury se tímto vydáním nemění; šest návrhů je pouze k výběru před další implementací.

## 1.15.0 — nezávislé vrstvy a koruny ke kameře

V Nastavení → Mapa → Krajina 3D jsou tři samostatné přepínače:

| Vrstva | Výchozí stav | Význam |
|---|---|---|
| Skutečné 3D stromy | vypnuto | Původní prostorové modely pro porovnání |
| Pseudo 3D stromy | zapnuto | Jednotlivé koruny na dvojici trojúhelníků natočené ke kameře |
| Orientované víceúrovňové koruny | zapnuto | Řidší shluky korun, rovněž natočené ke kameře |

Přepínače jsou nezávislé a ukládají se v nastavení dané edice. Zapnutí všech vrstev je srovnávací režim s úmyslným překryvem. Při vypnutí všech tří zůstane plošná textura podle dosavadního nastavení povrchů. Nový základ velikosti z 1.14.1 zůstává zachovaný.

Koruny mají tři detaily podle skutečné vzdálenosti od kamery: do 35 % dosahu jemně stínované malované koruny, do 70 % hranatější low-poly vzhled, dále nejjednodušší siluety. Používá se původní lokálně generovaný atlas 768 × 384 RGBA, nikoli fotografie ani šest dřívějších návrhových obrázků. Typy listnatý/jehličnatý/nízký porost sdílí výběr se skutečnými modely. Plošná textura za dosahem zůstává z 1.14.1. Jednotlivé koruny plynule mizí od 75 % dosahu; shluky se při současně zapnutých jednotlivých korunách objevují od 68 do 85 %. Shluky mizí v posledních 15 %. Přechody používají prostorovou masku bez průhledného blendování a bez nutnosti řadit koruny.

Billboard basis je sférický a ošetřuje i svislý pohled shora, kdy běžný vektorový součin nemá definovaný směr. Koruna se otáčí ve shaderu, nikoli přepočtem geometrie při každém snímku. Světlost jednotlivé koruny vychází z lokálního sklonu DEM na dvou sousedních vzorcích; při nedostupné výšce se daný strom nevykreslí, při nedostupném sklonu se použije neutrální světlost. Jde o ilustrační stínování, nikoli dynamické vržené stíny či simulaci slunce.

Zůstávají limity počtu vzorků, vyloučení vody/budov/cest a worker původních modelů. Shluk je jeden pro každý pátý platný výchozí vzorek; atlas obsahuje více korun v jednom shluku. Geometrie orientovaných korun je omezená stejnými vzorky a vzniká pouze při aktualizaci okolí. Nejsou přidány síťové požadavky na textury. GPU prostředky, aktivní textura, pixel alignment a stav rendereru se obnovují; vypnutí všech vrstev ukončí i čekající worker. Po obnovení WebGL kontextu se vegetace vytvoří znovu.

### Ověření 1.15.0

- `tests/cyklo-canopy.test.cjs` (také součást existujícího CI vstupu `cyklo-landscape.test.cjs`): všechny tři detaily a typy atlasu mají průhledné okolí; konečná a omezená geometrie; nulová i chybějící výška; odstín terénu; samostatné vrstvy i jejich kombinace; obnova GL stavu, vypnutí/zapnutí a uvolnění prostředků.
- `python scripts/check-canopy-gpu.py`: skutečný surfaceless OpenGL ES 3 kontext Mesa; překlad/link shaderů, vykreslení každého ze tří detailů a pohledu přímo shora a ořez za dosahem. Software renderer llvmpipe není měřením výkonu Androidu.
- Build a kontrola neměnných balíčků plus všechny existující regresní sady. Obě edice se sestavují ze stejného zdroje jako 1.15.0; předchozí distribuční balíčky zůstávají beze změn.
- Lokální Chromium nelze v tomto prostředí spustit kvůli zákazu vytváření socketů. Vizuální kontrola byla provedena na skutečném EGL výstupu jednotlivých korun a atlasu, nikoli na živé mapě. Přechody za jízdy, plná mapa s DEM, mobilní ergonomie a výkon zůstávají k ověření na telefonu. PWA záznam na pozadí se touto verzí nemění.

## 1.15.1 — oprava svislé orientace a výtvarné shody

Verze 1.15.0 používala sférické billboardy a jednoduché procedurální koruny. To nebyla shoda s původními výtvarnými návrhy: naklánění celé plochy podle výšky kamery vytvářelo dojem šikmých nebo plovoucích stromů. Tato oprava nahrazuje obě části:

- Svislá osa každého stromu je pevná světová osa Z. Otáčí se pouze podle azimutu kamery. Pata kmene je ukotvená v DEM; sklon svahu mění světlost, nikoli svislou orientaci.
- Atlas `assets/tree-crowns-v2.png` obsahuje skutečné průhledné malované a faceted low-poly stromy odvozené z uživatelem přiložených původních návrhů. Devět polí představuje tři typy porostu ve třech úrovních detailu. Listnáče mají nepravidelné shluky listí a větve; smrky vrstvené větve místo geometrických kuželů.
- Každé pole má vlastní UV výřez a kalibrovanou patu kmene. Přechod detailu tak zachovává polohu a výšku stromu i při rozdílných okrajích původního obrázku.
- Pohled shora má samostatné vodorovné koruny z atlasu `assets/tree-crowns-top-v2.png`, bez kmene a bez jeho naklápění. V blízkosti svislého pohledu se koruna překryje se svislým stromem pomocí stejné uspořádané masky. Ostatní perspektivy zachovávají svislou plochu.
- Oba atlasy mají 1254 × 1254 RGBA a jsou kompletně součástí offline balíčku. Načtou se jednou při vytvoření vrstvy; do načtení je textura průhledná. Pozdní callback z odstraněné vrstvy nic nezmění. Obnovují se oba texture units, unpack alignment, flip-Y a premultiplication. Po vypnutí nebo zničení vrstvy se oba atlasy uvolní.
- Skutečné 3D modely a tři nezávislé přepínače zůstávají zachované; oprava nemění historii, nastavení jízdy ani datové schéma. Předchozí balíček 1.15.0 zůstává neměnný.

### Kontrola opravy

Automatická regrese dekóduje skutečný PNG atlas, kontroluje průhledné pozadí, typy a detaily, UV meze, kalibraci paty, přepínání vrstev, načtení obrázků a obnovu obou texture units. Volitelný EGL test nově používá skutečné PNG obrázky a přes transform feedback čte výstup světových souřadnic přímo z vertex shaderu: pro různé azimuty, výšky kamery a úrovně detailu ověřuje shodné X/Y paty a vrcholu a patu v DEM. Kontroluje i vykreslení všech tří detailů, pohled shora a dosah. Skript vyžaduje Mesa EGL/GLES3 a Pillow.

Výtvarné atlasy byly připraveny podle přiložených malovaných a low-poly návrhů s požadavkem na průhlednost, čelní svislé stromy, tři shodné typy a tři úrovně detailu; doplňkový atlas používá odpovídající koruny z ptačí perspektivy. Nejde již o procedurální náhradní kresbu z 1.15.0. Skutečný vzhled na živé mapě a výkon na Androidu stále vyžadují ověření na cílovém zařízení.


## 1.15.2 — zachování důvodu selhání

Hláška z cílového telefonu potvrzuje přechod vrstvy do `failed`, ale 1.15.1 ve všech cestách původní výjimku zahazovala. Tento patch předá původní chybu a fázi z inicializace, sestavení, načítání/odeslání atlasu i mapového zdroje. Překlad a linkování zachovají hlášení grafického ovladače. Chyby kreslení jsou zachyceny po obnovení GL stavu a uvedeny ve stejném stavovém textu. `lastFailure` ukládá fázi a normalizovaný důvod (nejvýše 600 znaků); nový pokus ho vynuluje.

Regrese v `tests/cyklo-canopy.test.cjs` injektují chybu shaderu, načítání a uploadu obrázku, zdroje i vykreslení. Testy neprokazují konkrétní příčinu na telefonu: skutečný důvod je nutné přečíst z této diagnostické verze na cílovém zařízení. Nebyly provedeny spekulativní změny geometrie, atlasů nebo LOD.


## 1.15.3 — částečně dostupné výšky

Stav „Stromy čekají na výškový podklad“ mohl přetrvávat při `isSourceLoaded('cyklo-relief-dem') === false`, ačkoli místní dotazy již vracely výšku. Globální bariéra je odstraněna; aktivní terén je stále nutný, jednotlivé neznámé výšky se vynechávají. Počet a druhy ve stavu odpovídají skutečně dostupným výškám. Pokud žádný vzorek výšku nemá, geometrie se vyprázdní a cache klíč zneplatní. Každá událost relevantního výškového/lesního zdroje zvýší revizi i bez pole `tile`, aby neúplná geometrie nezůstala v cache.

Test `cyklo-landscape-lod.test.cjs` pokrývá celkově nenačtený zdroj s dostupnými výškami, nulovou a částečnou dostupnost a obnovu po události bez `tile`. Mobilní GPU není tímto testem simulováno; případné další chyby zobrazí diagnostika z 1.15.2.


## 1.16.0 — instancování, obrysy, cache a měření

Runtime používá `Canopy.instances`: 9 floatů (anchor XYZ, width/height, druh/seed/shade/group), 36 B na strom. Sdílená šablona obsahuje dva trojúhelníkové vějíře s 36 vrcholy celkem; konzervativní obrysy mají maximálně osm bodů pro každý druh, detail a čelní/horní pohled. `build-canopy-shapes.py` generuje obrysy z nezměněných PNG včetně dvou texelů rezervy pro filtrování. Přibývá tedy vrcholových výpočtů oproti dvěma obdélníkům, ale mizí opakovaná data a část průhledné rasterizované plochy (průměrná plocha obrysů je o 18 % menší než UV obdélníky). Není to příslib 18% rychlejšího GPU.

Instanční VAO a atlasové konstanty jsou stabilní. Po změně kamery nebo dat se provede konzervativní test šesti rovin frusta a přenese se jen viditelný výběr. Běžný nezměněný snímek buffer neaktualizuje. Obalová koule zahrnuje kmen, všechny kalibrované paty i širší skupiny korun; strom se nevyřazuje pouze podle paty. Nulová váha čelní/horní plochy přesune její vrcholy mimo clip prostor. Dither odmítá fragment před texture fetch. LOD prahy a umělecké atlasy zůstávají původní.

Cache buněk je založena na původní deterministické světové mřížce a uchovává pouze geografickou přípustnost a okraj lesa. Druh a výška se nadále vyhodnocují s aktuálními nastaveními a výškami. Události vektorového zdroje ruší snapshot polygonů a cache buněk; změna plánované trasy ruší pouze ověření buněk. DEM události ruší výšky. Převýšení, zapnutí terénu a změna zdroje se účastní klíče cache výšek. Cache jsou omezené na 50 000 položek; neznámé výšky se do příští DEM události pamatují, stále se nevykreslují na nule. Geometrie se dále sestavuje jako celek, ale převody polygonů, ověření buněk a dotazy na výšky se znovu nedělají pro každý již známý strom.

`VegetationTimer` používá volitelné `EXT_disjoint_timer_query_webgl2` přibližně jednou za 30 kreslení. Nikdy nečte nedostupný výsledek, nevnořuje se do cizího query a maže neplatné disjoint výsledky i prostředky po odstranění vrstvy. CPU příprava nezahrnuje asynchronní výpočet skutečných 3D modelů ve workeru; GPU údaj se týká korun, nikoli celé mapy. EMA intervalu render callbacků ignoruje mezery nad 250 ms a není důkazem samostatného GPU času.

Kontroly:
- `tests/cyklo-performance.test.cjs`: shoda umístění a průjezdných koridorů s cache, invalidace tras/DEM/lesních dat, menší záznamy, zachování přesahujících korun při cullingu, prázdný worker a neblokující GPU query. Součást stávajícího CI vstupu `cyklo-landscape.test.cjs`.
- `python scripts/check-canopy-instancing.py`: skutečné porovnání starých a nových výstupů na Mesa EGL/GLES3, všechny druhy/LOD a horní pohled, husté perspektivní scény, hloubka a různé azimuty. Povolený limit je <1 % významně změněných pixelů popředí, ztracené siluety samostatně omezené v izolovaných pohledech. Nenahrazuje Android GPU test.
- `node scripts/benchmark-canopy.cjs`: reprodukovatelný kontrolovaný CPU test proti 1.15.3 (vyžaduje historický commit v gitu). Stejné vzorky jsou před měřením porovnány; 15 běhů po zahřátí, mediány. Výsledky uložené v `docs/benchmarks/cyklo-1160-cpu.json` nejsou měřením FPS celého telefonu.

Mipmapy atlasu a agresivnější slučování vzdálených stromů nejsou v tomto vydání zapnuté; tato sada zachovává existující obraz a dosah. Výtvarné změny ani snižování hustoty se nepoužívají jako zdroj deklarovaných CPU úspor.


## 1.17.0 — širší pokrytí se 4× celkovým rozpočtem

Potvrzený požadavek je 4× celkový počet, nikoli 4× hustota navíc. Economy/Auto/High mají limity 4 000/12 000/24 000. Původní rozteče světové mřížky 8/24/60 m a hustota zůstávají; prstenec 60m vzorků pokračuje do 4 km a sdílí vzdálenou kvótu. Uložené radius/detail-distance hodnoty se jednorázově zdvojnásobí s limitem 4 km. Volby 400 a 700 m umožňují přesné zdvojnásobení starších hodnot; stromová výška ani treeScale se nemigrují.

Adaptivní detail je levný odhad překrytí korun v mřížce 32×32, ne důkaz skutečné neprůhledné okluze. Zpracování od předních korun zachová první tři vrstvy, skupiny nezvyšují počet fyzických vrstev. Při ≥80% překrytí následuje 120ms prodleva a 240ms prolnutí do LOD 2; znovu odkrytá koruna se okamžitě vrací k obvyklému vzdálenostnímu detailu. Světové klíče uchovávají hysterézi přes změny lokálního počátku. Přechod používá bezpečný obdélník, aby nové obrysy neořízly míchané textury. Hotové jednoduché koruny se balí za detailní a kreslí ve druhém instancovaném batche s 12 vrcholy. Nemění to počet fyzických stromů. Zjednodušené koruny stále zachovávají průhledné pozadí a ukotvení v DEM. Plně skryté stromy se neodstraňují na základě neprůhledného bbox předpokladu.

Nový `vegetation-worker.js` provádí geografickou část bez DOM a bez DEM API. Hlavní vlákno dávkuje materializaci getterů MapLibre a lokální výškové dotazy. Další požadavky při obsazeném workeru se koaleskují na poslední, nikoli řadí do neomezené fronty. Nezměněné geografické zdroje a připravené polygony se využívají znovu. Změny zdroje a trasy invalidují příslušnou cache. Timeout/chyba workeru přepne na kooperativní generátor s 6ms rozpočtem; Obnovit vegetaci může worker zkusit znovu. Vypnutí vrstvy či clear/destroy zneplatní generace a ukončí worker. Starý dokončený výsledek nikdy neobnoví odstraněné stromy.

Metriky rozlišují součet CPU práce hlavního vlákna, worker čas a celkovou dobu přípravy na pozadí. Limity API zůstávají: querySourceFeatures, getter jedné velké geometrie nebo jediný queryTerrainElevation jsou synchronní a nelze je přerušit uprostřed. Skutečné 3D modely mají přesnější předalokaci podle druhu/LOD, místo 228 vrcholů pro každý vzdálený strom; jejich renderer zůstává jinak zachovaný.

Validace: `cyklo-visibility.test.cjs` je součástí stávajícího CI vstupu. Kontroluje rozpočty, 4km prstenec, migraci bez změny hustoty/velikosti, tři detailní přední vrstvy, plynulý přechod a odkrytí, původní souřadnicový klíč, worker reuse/coalescing/cancellation a fallback generátor. `check-canopy-instancing.py` nyní ověřuje i 21 výsledků 12vrcholového batche proti původnímu poslednímu LOD. Zůstává nutná kontrola výkonu a vzhledu na skutečném telefonu; není deklarováno 10× FPS při 4× stromů.
