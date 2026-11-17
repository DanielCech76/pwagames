# Kapesní kolekce 2.1.0 · hry a nástroje v modulární PWA

Jedna aplikace, vlastní výběr her a nástrojů. Malé jádro neobsahuje herní kód a žádné moduly nestahuje automaticky. V nabídce jsou samostatné moduly **Pong**, **Pinball / Neon Arcade**, **Laboratoř telefonu**, **CYKLO** a **Azulejo QR Studio**.

## Vyzkoušení

https://danielcech76.github.io/pwagames/?upgrade=2.0

Při prvním otevření vyber moduly v průvodci a stiskni **Stáhnout vybrané**. Vše je původně neoznačené. Po dokončení použij **Pokračovat do kolekce**. Instalované moduly fungují offline; můžeš to ověřit režimem letadlo. Tlačítko **Moduly** otevře správu instalací, verzí a dat.

### Přechod z původní aplikace

Původní service worker může stále zobrazovat starou stránku z cache. Odkaz s `?upgrade=2.0` umožní otevřít nové rozhraní. Pokud se objeví připravená verze jádra, stiskni **Použít novou verzi**. Původní Pinball rekord se zkopíruje do dat modulu, žádná hra se však sama nevybere ani nestáhne. Po úspěšném zachování dat se stará společná offline cache uvolní. Data nevymazávej přes nastavení prohlížeče, pokud je chceš zachovat.

## Správce modulů

- Individuální nebo hromadné stažení, průběh a možnost zrušení.
- Ověření manifestu, velikostí a SHA-256 každého souboru před dokončením instalace.
- Automatická kontrola katalogu po otevření, při návratu do aplikace a po 15 minutách aktivního používání; ruční stažení aktualizací.
- Aktivace stažené aktualizace při příštím spuštění modulu.
- Jedna předchozí funkční verze, návrat bez sítě a její samostatné odstranění.
- Skrytí modulu v kolekci bez odebrání jeho souborů.
- Odebrání standardně ponechá rekordy/nastavení. Výslovná volba smaže i data a zálohy.
- Body obnovy dat před aktualizací; obnova i vrácení poslední obnovy.
- Přehled využitého úložiště a žádost o trvalejší ochranu.

Nová verze jádra se připraví automaticky, ale použije se až po potvrzení z menu. Zavření všech oken nevybírá novou verzi uživatelského jádra bez potvrzení. Instalace a verze modulů jsou na jádře nezávislé.

## Navigace a ovládání

Systémové Zpět / gesto: nejdřív zavře nastavení, potom se vrátí na předchozí obrazovku. Android může prvním Zpět nejprve ukončit fullscreen. Odchod ukončí relaci modulu, animace i měření. Dopředu otevře modul jako novou relaci; senzory se samy nezapnou.

Pong: dotykové pásy, A/D nebo šipky pro hráče; J/L pro druhého hráče; mezerník pauza. Pinball: A/D nebo šipky pro páčky, podržení/pouštění mezerníku pro vystřelení, P pro pauzu. Laboratoř: samostatné nebo společné zapnutí měření, podrobný/kompaktní režim, kalibrace. Laboratoř neukládá ani neodesílá měření. CYKLO naopak ukládá GPS trasy lokálně; online poskytovatel map vidí požadavky na zobrazované oblasti.

## Sestavení a lokální spuštění

Sestavení: Python 3 a Node.js 22+. MapLibre GL JS 5.15.0 je zabalený v modulu s licencí. Testy IndexedDB používají vývojovou závislost fake-indexeddb (`npm ci`).

```sh
python scripts/build-site.py
python scripts/check-build.py
node tests/packages.test.mjs
node tests/worker.test.cjs
node tests/bridge.test.cjs
node tests/migration.test.cjs
node tests/pinball-engine.test.cjs
node tests/phone-lab.test.cjs
python -m http.server 8000 --directory _site
```

Otevři http://localhost:8000. Pro telefon použij HTTPS hosting. Service worker a instalace vyžadují HTTPS nebo localhost. Server nesmí měnit distribuované soubory — změny HTML způsobí správné odmítnutí kontrolního součtu.

## Zdrojové soubory a vydávání

Před vydáním ověř také možnost odeslat commit z aktuálního pracovního prostředí. Přístup přes propojení GitHub v ChatGPT a přihlášení místní příkazové řádky jsou oddělené; úspěšné stažení repozitáře samo nepotvrzuje možnost zápisu.

- `core/`: rozhraní, navigace, úložiště a obecný správce balíčků.
- `module-src/<id>/`: samostatný zdroj modulu s `module.json`.
- `scripts/module-bridge.js`: společný protokol důvěryhodného modulu v1.
- `modules/<id>/<version>/`: kompletní neměnná distribuce s manifestem a součty.
- `catalog.json`: první strana katalogu; žádné cizí zdroje ani ZIP import.
- `release.json`: verze jádra a API; z ní se generuje `core/version.js`.
- `scripts/build-packages.py`: balení modulů a katalogu.
- `scripts/build-core.py`: úplná offline cache samotného jádra a její otisk.
- `docs/modularization-plan.md`: schválená rozhodnutí a architektura.

Při změně modulu zvyš **jeho** verzi v `module-src/<id>/module.json`. Při změně jádra zvyš `coreVersion` v `release.json`. Sestavení odmítne přepsat obsah již vydané stejné verze. Nový modul přidej jako další složku do `module-src`; menu a správce se vytvoří z katalogu, bez změny jádra. Starší distribuční balíčky zachovej, aby zůstaly dostupné existujícím instalacím.

Modul musí implementovat `ArcadeHost.register({start, pause, stop, dialogs})`. Vlastní data ukládá přes `ArcadeHost.storage`. Současné schéma je 1; nepodporovaná změna schématu je zablokovaná. Nový formát musí nejprve získat konkrétní migrační podporu a testy. Rámce oddělují životní cyklus a styly; nejsou bezpečnostním sandboxem pro libovolné cizí autory.

## Publikování

GitHub Actions sestaví, zkontroluje a nasadí `_site`. Settings → Pages → Source musí být **GitHub Actions**. Pro hostování přímo z větve jsou v repozitáři také připravené distribuční soubory.

## Testovací postup na telefonu

1. Otevři přechodový odkaz, případně potvrď novou verzi jádra. Nic není předvybrané.
2. Stáhni Pong, spusť ho a vrať se systémovým Zpět. V nastavení vyzkoušej návrat ve dvou krocích.
3. Zapni režim letadlo, znovu otevři aplikaci a spusť stažený Pong.
4. Po připojení stáhni Pinball a Laboratoř; ověř obě páčky a kompaktní panel senzorů.
5. Odeber Pinball s ponecháním dat, znovu ho stáhni a ověř rekord.
6. Při příští vydané aktualizaci ověř ruční stažení, aktivaci až při spuštění a návrat předchozí verze offline.

Automatické testy pokrývají také poškození, zrušení, nedostatek místa, opravu, migraci, body obnovy a oddělenou aktivaci jádra. Skutečnou latenci senzorů a specifické chování Androidu je třeba ověřit na konkrétním zařízení.

### Ověření publikované verze

Na GitHub Pages bylo ověřeno první spuštění bez předvýběru, hromadná instalace všech tří modulů s úplnou integritou, samostatné spuštění každého z nich, kompaktní režim Laboratoře, nastavení Pongu a dvoukrokové Zpět, skrytí/obnovení položky a odebrání/opětovná instalace Pinballu. Návraty verzí, přerušení, nedostatek místa a offline odpovědi workeru pokrývají automatické testy.

## CYKLO 1.5.0 — navigace a reliéf

Obě edice nově obsahují vypínatelnou horní lištu příští odbočky, automatický přepočet (výchozí tolerance 50 m / 15 s), samostatné přepínače budov/3D terénu/stínování/vrstevnic a úsporný režim. Nastavení zůstává místní. Mapterhorn dodává online výškové dlaždice, maplibre-contour 0.1.1 je přibalený s BSD licencí. Bez odbočovacích pokynů se zobrazuje sledování linie, nikoli vymyšlená odbočka. Podrobnosti a hranice: [navigace](docs/cyklo-navigation.md), [reliéf](docs/cyklo-terrain.md), [ověření](docs/cyklo-verification.md).

## CYKLO 1.0.3 (první verze / beta pro ověření na telefonu)

Nejdřív použij jádro **2.1.0**, pak stáhni CYKLO ve správci modulů. Otevření nevyžaduje GPS; záznam začne po **Spustit jízdu** a prvním platném fixu. Analogový rychloměr, vzdálenost, celkový a čistý čas, GPS výška. Automatická pauza má hysterezi; ruční pauzu ukončíš ručně. Po zamčení/přepnutí aplikace se jízda přeruší, po návratu pokračuj výslovně. Záznam na pozadí není garantovaný.

Mapa: směr jízdy / sever, 2D / perspektivní 3D, sklon 0–60°, nastavitelný dopředný výhled. Pravý slider mění výhled od 50 m k maximu, +/− po krocích, AUTO podle rychlosti; ruční zoom nevypíná follow. Pan mapy sledování uvolní, ◎ ho obnoví. Mapa je online OpenFreeMap / OpenMapTiles / OpenStreetMap, bez klíče. Kód modulu, historie a GPS záznam jsou offline; úplné offline mapové oblasti ani plánování a pokyny v této verzi nejsou. 3D znamená sklon vektorové mapy, ne terénní model z obrázkového náhledu.

Historie: lokální detail, GPS profil v čase, přejmenování, celá trasa, GPX a JSON export. Výšky jsou nekorigované WGS84 a orientační. Pozice při pauze a výpadku nejsou propojené falešným úsekem. Data jsou v generickém IndexedDB úložišti modulů; odebrání ponechá historii, volba včetně dat smaže i její body a zálohy. Záloha JSON je export, import není součástí první verze.

Implementované a ověřené scénáře: viz `docs/cyklo-verification.md`. Specifikace a plán zůstávají v `docs/cyklo-specification.md` a `docs/cyklo-implementation-plan.md`; skutečná fyzická přesnost GPS a ovládání při jízdě se musí ověřit na cílovém telefonu.

## Azulejo QR Studio 1.0.0

Ve správci modulů obnov katalog a stáhni **Azulejo QR Studio** (jádro 2.1.0+).
Modul obsahuje šest keramických ornamentů a všechny knihovny/obrázky, takže po instalaci funguje offline.
QR měřítko, krytí, kontrast ornamentu, síla QR a barva se nastavují samostatně.
Vlastní obrázek lze vložit z PNG/JPG/WebP/GIF/AVIF, přiblížit a oříznout; zůstává místní a nevkládá se do sdíleného katalogu.
Nastavení jsou ve jmenném prostoru modulu, oříznutý obrázek v jeho velkém úložišti IndexedDB.
Zálohy, ponechání dat při odebrání a úplné smazání spravuje jádro.
Tlačítko **← Kolekce** i systémové Zpět používají navigaci hostitele; Zpět nejdřív zavře ořez nebo zvětšený náhled.
PNG a SVG export zůstává zachován; samostatné HTML se z modulu neexportuje, offline instalaci zajišťuje správce modulů.
Kontrola čitelnosti rozlišuje celý obraz a izolovanou oblast QR. Nízké krytí a výrazný ornament mohou skenování znemožnit; před tiskem ověř konkrétní výstup telefonem.

Podrobnosti integrace a ověření: `docs/azulejo-module.md`.

## CYKLO 1.6.0

Approved A cockpit, full-screen grouped settings, independent color palettes, expanded manual zoom with whole-route fit, 150/200 km/h gauges, header-only ride actions, automatic Jízda selection and corrected control hiding. See [cockpit specification and verification](docs/cyklo-cockpit.md). Both Open and Mapy.com editions share the release.

## CYKLO 1.7.0

Unified SVG controls, icon-only GPS toggle and ride header, persistent top-right recenter in focus mode, compact route action menu, and removal of duplicate location/recovery/action panels. GPS off safely pauses recording; GPS on resumes location tracking only. Both cycling editions updated.

## CYKLO 1.8.0

Mountain-button terrain toggle with crossed flat-state icon, horizontally centered position at the lower-third anchor of the unobscured map, closest view 10 m, and tourist cartography defaults (Mapy.com Outdoor / OpenFreeMap tourist colors).

## CYKLO 1.9.0

Optional Mapa / Realistická / Krajina 3D modes in both editions; Mapy.com aerial tiles with labels, existing DEM terrain, bounded approximate forest meshes and configurable radius/density. See [landscape modes and verification limits](docs/cyklo-landscape.md).

## CYKLO 1.10.0

Denser configurable vegetation, broadleaf/mixed/conifer crowns, regional elevation estimates, low edge shrubs, procedural grass/scrub/field textures and a local geometry worker with distance LOD. Automatic classification remains an estimate where tile properties are absent; Copernicus is not connected. See [landscape details](docs/cyklo-landscape.md).

## CYKLO 1.11.0

Independent map search via a compact magnifier, place markers and saved-place actions without starting GPS or changing a plan. Vegetation range now supports 100m–2km with distance bands and bounded far coverage. Both editions share this release.

## CYKLO 1.15.0

Tři nezávislé vrstvy vegetace: původní 3D modely, pseudo 3D koruny ke kameře a orientované shluky korun. Tři vzdálenostní detaily, stínování podle sklonu terénu a zachování vzdálené plošné textury. Výchozí jsou pseudo 3D koruny a shluky; skutečné 3D lze zapnout pro porovnání. Nových 100 % nadále odpovídá původním 50 %. Obě edice používají stejné změny. Podrobnosti a hranice ověření: [vrstvy vegetace](docs/cyklo-landscape-lod.md#1150--nezávislé-vrstvy-a-koruny-ke-kameře).

## CYKLO 1.15.1

Oprava stromů podle původních návrhů: skutečné průhledné malované/low-poly textury, svislé kmeny otáčené pouze kolem světové svislé osy a stabilní pata na terénu. Pohled shora používá samostatné koruny. Nahrazuje procedurální náhradní vzhled a naklápění billboardů z 1.15.0. Obě edice; původní přepínače zůstávají zachované. [Podrobnosti opravy](docs/cyklo-landscape-lod.md#1151--oprava-svislé-orientace-a-výtvarné-shody).


## CYKLO 1.15.2 — diagnostika zmizení vegetace

Telefon ve verzi 1.15.1 hlásí obecné „3D vegetace není dostupná“, přestože pseudo 3D i orientované koruny jsou zapnuté. Přesná příčina zatím není potvrzená. Verze 1.15.2 zachová ve stavovém textu fázi selhání a původní chybovou zprávu, včetně protokolu překladu/linkování shaderu. Rozliší načtení a GPU nahrání konkrétního obrázku, chybu mapových dat, přípravu geometrie a vykreslení. Chyba při vykreslení nově projde stejným řízeným ukončením a obnovou GL stavu. Tlačítko Obnovit vegetaci zahájí nový pokus a vymaže předchozí diagnostiku.

Jde o diagnostické vydání pro obě edice, nikoli o potvrzenou opravu příčiny na Androidu. Vzhled korun, přepínače, uložené trasy a datové schéma se nemění. Testy simulují odlišná selhání a ověřují zachování důvodu, obnovu GL stavu a opakování pokusu. Předchozí balíčky zůstávají neměnné.


## CYKLO 1.15.3 — stromy při částečně načteném terénu

Při načítání DEM už vegetace nečeká na `isSourceLoaded` celého výškového zdroje. Stromy se vytvoří pro jednotlivé body, kde `queryTerrainElevation` vrací konečnou výšku; ostatní počkají na další událost zdroje. Události výškových dat nově invalidují geometrii i bez pole `tile`. Stav rozlišuje čekání na místní výšky a částečně zobrazený porost; počty zahrnují pouze prvky se známou výškou. Stromy bez výšky se neposazují na nulu.

Regresní test ověřuje vykreslení při globálně nedokončeném zdroji, úplně chybějící i částečné místní výšky a doplnění po načtení DEM bez pohybu mapy. Vzhled, tři přepínače a původní diagnostika zůstávají. Oprava řeší prokázanou blokující podmínku; výsledek na telefonu je nutné ověřit.


## CYKLO 1.16.0 — výkon vegetace při zachování vzhledu

Pseudo 3D stromy a orientované koruny nyní používají WebGL2 instancování. Záznam stromu má 36 B místo 528 B rozbalené geometrie (14,67× méně); obě plochy sdílejí statickou šablonu. Konzervativní osmiúhelníkové obrysy omezují průhledné rohy, aniž by měnily původní obrázky. Plochy s nulovou viditelností se oříznou ve vertex shaderu a fragmenty mimo přechodovou masku se odmítnou před načtením textury. Konzervativní frustum test vyřazuje instance mimo obraz včetně bezpečné rezervy na přesah korun. Rozmístění, hustota, výška, dosah, druhy a všechny tři nezávislé přepínače zůstávají zachované.

Cache světových buněk uchovává ověření lesa, vody, budov, cest a okrajů; cache místních výšek sdílí výsledky mezi výběrem druhů, ukotvením a stínováním. Příchod DEM invaliduje výšky, příjem lesních dat připravené polygony i buňky, změna trasy průjezdný koridor a změna terénního zdroje či převýšení výšky. Obě mapové cache mají limit 50 000 položek a zanikají s vrstvou. Při vypnutých skutečných 3D modelech se nespouští prázdná úloha workeru. Neměnné atributy a atlasové uniformy se nastavují jednou; stojící kamera znovu neposílá instance.

V nastavení pod stavem vegetace je měření: CPU příprava, CPU odeslání, GPU korun (pokud telefon podporuje časovací rozšíření), viditelné/celkové instance a průměrovaný interval snímků při pohybu. GPU dotazy jsou asynchronní, řídce vzorkované, bez čekání a výsledky při disjoint události se zahazují. Interval snímků není vydáván za GPU čas ani FPS benchmark.

Ověření: 31 regresních sad, úplný build a integrita balíčků. Volitelný skutečný Mesa EGL test porovnává staré obdélníky a nové instance v 42 kombinacích druhů/LOD/pohledů a čtyřech hustých perspektivních scénách s hloubkovým bufferem; každé porovnání má méně než 1 % významně změněných pixelů popředí. Lokální CPU mikrobenchmark pro 3 000 stromů je uložen v `docs/benchmarks/cyklo-1160-cpu.json`; opakovaný výběr s teplou cache vyšel přibližně 19.7× a příprava instancí přibližně 23.4× rychleji. To není důkaz 10× vyššího FPS celé mapy na Androidu. Plynulost a kompatibilita cílového telefonu zůstávají k ověření.


## CYKLO 1.17.0 — čtyřnásobný celkový rozpočet a širší oblast

Rozpočty jsou 4 000 / 12 000 / 24 000 fyzických stromů pro Úspornou / Automatickou / Vysokou kvalitu, tedy 4× předchozí limity. Hustota v procentech a velikosti jednotlivých stromů se nemění. Při prvním spuštění se uložený poloměr oblasti a dosah detailů zdvojnásobí, nejvýše na 4 km; příznak `vegetationAreaVersion` zabrání opakování. Zdvojnásobení poloměru/diametru znamená 4× plochu, nikoli dodatečnou 4× hustotu. Větší rozpočet není zárukou jeho naplnění: záleží na mapových datech, výškách, vodě/cestách a zvolené hustotě.

Pseudo 3D koruny používají konzervativní odhad překrytí v obrazové mřížce. Tři přední vrstvy se počítají jako detailní; převážně překryté koruny po prodlevě 120 ms přecházejí během 240 ms na poslední LOD. Hotové zjednodušené instance mají samostatný 12vrcholový batch místo 36vrcholového. Skupinové koruny se nepovažují za další fyzické přední stromy. Překrytí neurčuje definitivní neviditelnost přes průhledné větve: žádný strom se jen z tohoto odhadu nezahazuje. Skutečné 3D modely nadále používají existující vzdálenostní LOD.

Geografický výběr probíhá v lokálním workeru; metadata a výsledky se přenášejí s generačními ID. Běží nejvýše jeden job a čeká pouze nejnovější požadavek. Líné geometrie MapLibre se před předáním převádějí na prostá data v krátkých dávkách a při nezměněném zdroji se znovu neposílají. DEM dotazy a stínování běží na UI vlákně v dávkách s přibližně 6ms rozpočtem; předchozí scéna zůstává do dokončení. Bez workeru je výběr kooperativně dávkovaný. Jednotlivé synchronní mapové API volání nelze přerušit, takže 6 ms není pevný limit každého snímku.

Ověřeno: 32 regresních sad, úplný build a neměnné balíčky. Mesa EGL porovnání zahrnuje dosavadních 46 pohledů/scén a dalších 21 kontrol jednoduchého batche proti původnímu LOD 2. Testy pokrývají 4× limity, dosah 4 km, jednorázovou změnu nastavení, hysterézi při posunu lokálního počátku, výběr 12vrcholového batche, koalescenci workeru a odmítnutí opožděných výsledků. Mobilní plynulost a výsledný vzhled s větší oblastí zůstávají k ověření na telefonu.


## CYKLO 1.18.0 — husté vzdálené porosty

Detail pseudo 3D stromů se vybírá podle velikosti na obrazovce: nad 60 px malované koruny, 20–60 px střední detail, pod 20 px jednoduché koruny. Rozšíření dosahu už nezvyšuje detail malých stromů. Blízké stromy zůstávají jednotlivé a svislé.

Vzdálený les používá skutečné skupinové podklady se 4/9/16 korunami, opakované v blocích 32–256 m. Bloky se podle projekce dělí; rozpočet upřednostňuje viditelnou plochu a rezervu za okrajem. Ověřuje se celá plocha bloku vůči cestám, vodě, budovám a okrajům lesa. Na zakřiveném terénu se bloky dále dělí, na svahu sledují místní rovinu. Jemný souvislý podklad vyplňuje vzdálené mezery ve stávajícím průchodu povrchů.

Koruny mají jednu mipmapovanou texturu s izolovanými vrstvami, bez prosakování sousedních obrázků. Běžný pixel vyžaduje jeden vzorek. Nastavení pseudo 3D a orientovaných korun nadále fungují nezávisle; skutečné 3D modely používají dosavadní renderer.

Validace: 33 regresních sad, build/offline balíčky, 67 původních GPU porovnání a nový skutečný GLES3 test. Reprodukovatelné výsledky jsou v `docs/benchmarks/cyklo-1180-*.json`. Syntetická scéna snížila počet vrcholů z 14 184 na 3 000 a odhad dotazů na terén z 12 000 na 1 302. Počty korun ve skupinách jsou vizuální odhad, nikoli počet samostatných stromů. Studená geografická příprava ani software GPU průchod nejsou rychlejší; vykreslují podstatně větší část obrazu. Stejný nebo nižší celkový čas na Androidu tedy zatím není prokázán, stejně jako dřívější cíl 10× FPS.

## Letadlo 1.4.0 — detailní offline krajina a záznamy letů

Ve správci modulů obnov katalog a aktualizuj **Letadlo**. Před letem vyber letiště nebo načti záznam letu a stiskni **Stáhnout detailní mapu trasy**. Vektorové podklady obsahují obce, lesy, pole, vodstvo, komunikace a 2D půdorysy budov; vrstevnice vznikají z podrobnějšího reliéfu. Výchozí dosah plných detailů je 30 km, zjednodušené mapy 200 km, dále zůstává orientační povrch. Dosahy, vrstvy, rozlišení dat a paměťové profily jsou v **Mapa a výkon**. Data se stahují samostatně a zachovají se při aktualizaci modulu.

Skutečnou proletěnou dráhu lze přehrát z importovaného GPX, GeoJSON nebo ADS-B/readsb JSON/JSON.gz. Denní ADS-B záznamy nabízejí výběr jednotlivých úseků; chybějící výška a mezery jsou označené. Automatické vyhledání letu podle čísla zatím není součástí. Živá GPS se spouští jen na pokyn. Bez WebGL funguje detailní 2D mapa. Prostorový vzhled a výkon na Androidu je třeba ověřit na zařízení. [Funkce, zdroje, přesnost a ověření](docs/letadlo.md).

Letadlo 1.3.1 otevírá simulaci v pauze, používá ikonové Play/Pauza a posouvá popisky míst plynule s vykreslováním.

Letadlo 1.4.0 přidává celomapovou variantu A: horní údaje o letu, ikonové Play/Pauza, zoom vpravo a vzdálenost na trase dole. Rohová ikona vrací běžné zobrazení.
