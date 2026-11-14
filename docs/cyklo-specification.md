# CYKLO — požadavky a detailní specifikace první verze

Verze dokumentu: 1.0 • Datum: 14. 11. 2026 • Stav: návrh připravený k implementaci.
Projekt: pwa modularni app / DanielCech76/pwagames. Identifikátor modulu: `cyklo`.

Tento dokument popisuje dosud neimplementovaný modul. Rozlišuje výslovné požadavky uživatele (U), přijatý vizuální směr (V), technické podmínky (T) a doporučené výchozí hodnoty (D). Doporučené hodnoty nejsou vydávány za již schválená rozhodnutí. Implementační postup je v [cyklo-implementation-plan.md](cyklo-implementation-plan.md).

## 1. Cíl a hranice

Jedna instalovatelná součást stávající modulární PWA promění telefon na cyklopočítač: okamžitá rychlost, celkový a čistý čas, vzdálenost a lokální záznam trasy s mapou a výškovým profilem. Obsluha má být jednoduchá na řídítkách, údaje čitelné krátkým pohledem.

První verze orientuje uživatele v okolí a zobrazuje projetou trasu. Nevypočítává budoucí trasu, nedává odbočovací ani hlasové pokyny, nepřipíná GPS na silnici. Neobsahuje cloudovou synchronizaci, účty, sdílení polohy, tep, kadenci ani integraci cyklistických čidel. Tyto položky mohou být dalšími etapami. Samostatné offline mapové oblasti a skutečný prostorový terén jsou rozšíření závislá na datech a licenci; samotný offline záznam je součástí první verze.

## 2. Registr požadavků

Priorita P0: nezbytné pro vydání, P1: navržené doplnění v první verzi, P2: později. U označuje požadavek uživatele, nikoli jeho schválení každého technického detailu.

| ID | Požadavek | Původ | Priorita | Ověřitelný výsledek |
|---|---|---|---|---|
| MOD-01 | Samostatný modul v katalogu | U/T | P0 | CYKLO lze jednotlivě instalovat, spustit a odebrat |
| MOD-02 | Funkční offline aplikace a lokální data | U/T | P0 | Bez internetu se otevře stažený modul a uloží simulovanou či dostupnou skutečnou GPS trasu |
| RIDE-01 | Začátek jen výslovným pokynem | D | P0 | Otevření modulu neaktivuje měření ani čas jízdy |
| RIDE-02 | Okamžitá rychlost | U | P0 | Zobrazení km/h z platného vstupu, chybějící údaj není nula |
| RIDE-03 | Doba jízdy včetně přestávek | U | P0 | Celkový čas od startu do ukončení podle pravidel kapitoly 5 |
| RIDE-04 | Čistá doba bez pauz | U | P0 | Počítají se jen potvrzené intervaly pohybu |
| RIDE-05 | Ruční a automatická pauza | D | P0 | Ruční pauzu automatika nikdy sama neukončí |
| RIDE-06 | Vzdálenost a průměr | D | P0 | Vzdálenost z přijatých úseků; průměr ze vzdálenosti a čistého času |
| GPS-01 | Záznam polohy a kvality | U/T | P0 | U bodu je čas, přesnost, zdroj odhadů a oddělení segmentů |
| GPS-02 | Výpadek a obnovení GPS | T | P0 | Mezera se nespojí falešnou čarou a neoznačí za prokázané stání |
| ALT-01 | Aktuální GPS výška | U | P0 | Výška je označená jako GPS/orientační, neznámá hodnota jako — |
| ALT-02 | Výškový profil projeté trasy | U/V | P0 | Profil respektuje mezery a chybějící výšky |
| UI-01 | Styl C, krémová/zelená/oranžová | U/V | P0 | Stejný vizuální jazyk pro Jízdu, Mapu, Historii a nastavení |
| UI-02 | Ručičkový rychloměr + číslo | U | P0 | Čitelná stupnice, plynulá ručička a menší přesný údaj |
| UI-03 | Čitelná tlačítka a údaje | U/T | P0 | Bez překryvů na 360 × 640, ovladače podle kapitoly 9 |
| MAP-01 | Aktuální poloha a projetá stopa | U | P0 | Stopa končí na poslední platné poloze, nic před ní nepředstírá plán |
| MAP-02 | Otáčení podle pohybu | U | P0 | Směr jízdy je nahoře, při nejistotě se poslední směr podrží |
| MAP-03 | Alternativně sever nahoře | D | P1 | Jednoznačně přepínatelná orientace |
| MAP-04 | 2D a sklopený pohled | U | P0 | Přepínání 0°/uložený sklon bez změny požadovaného výhledu |
| MAP-05 | Volitelný sklon | U | P0 | Nastavení 0–60°; ovládání se nepřekrývá s mapou |
| MAP-06 | Nastavitelná vzdálenost dopředu | U | P0 | Výhled má jednotky m/km, nikoli jen interní zoom |
| MAP-07 | Omezení výhledu, např. 1 km | U | P0 | Kamera ani zobrazené vzdálené pozadí nesmí předstírat neomezený horizont |
| MAP-08 | Automatické přiblížení pro kolo | U/D | P0 | Plynulé přizpůsobení rychlosti v nastavených mezích |
| MAP-09 | Tažený svislý posuvník | U | P0 | Ovládání jedním prstem; nahoru více detailu, dolů širší okolí |
| MAP-10 | +/−, bublina vzdálenosti, AUTO | Přijatý návrh | P0 | Tři alternativy obsluhy sdílejí stejnou hodnotu výhledu |
| MAP-11 | Sledování nezávislé na zoomu | Přijatý návrh | P0 | Ruční zoom nezruší sledování polohy či směru |
| MAP-12 | Návrat na polohu | Přijatý návrh | P0 | Po ručním posunu se sledování obnoví zaměřením |
| DATA-01 | Průběžné lokální ukládání | D/T | P0 | Dokončená transakce je zachována po novém otevření |
| DATA-02 | Obnovení nedokončené jízdy | D/T | P0 | Nabídka Pokračovat / Ukončit, nikdy tiché automatické měření |
| DATA-03 | Historie a detail jízdy | Přijatý návrh | P0 | Přehled, statistiky, mapa, výškový profil |
| DATA-04 | Export GPX a záložní JSON | D | P1 | Validní soubory; segmenty zachovány; JSON nese i nastavení a události |
| DATA-05 | Odebrání a obnova dat modulu | T | P0 | Fungují i pro velké trasy, nejen nastavení v localStorage |
| LIFE-01 | Korektní odchod a Zpět | T | P0 | Návrat uloží a přeruší jízdu; ukončí senzory, mapu a wake lock |
| LIFE-02 | Záznam na pozadí neslibovat | T | P0 | Viditelné označení přerušení, žádná domyšlená stopa |
| PRIV-01 | Místní historie bez automatického uploadu | D/T | P0 | Sledování neposílá body do vlastní cloudové databáze |
| FUT-01 | Plánování a pokyny | U | P2 | Samostatná budoucí etapa, bez nefunkčních tlačítek ve V1 |

## 3. Obrazovky a obsluha

### 3.1 Jízda

Horní lišta: název, Zpět, stav záznamu, kvalita GPS, nastavení. Žádná červená tečka bez slovního vysvětlení. Hlavní pohled dle stylu C: menší mapa, pod ní výrazný analogový rychloměr, pak vzdálenost, celkový čas, čistý čas a výška. Spodní velká akce před startem Spustit jízdu; během jízdy Pauza a Ukončit; v pauze Pokračovat a Ukončit. Před ukončením potvrzení a možnost zachovat rozjetý záznam.

### 3.2 Mapa

Většina prostoru patří mapě. Kompaktní rychloměr a základní statistiky dole, trvalá tlačítka Pauza/Pokračovat a Ukončit. Volba 2D/3D, kompas/orientace, posuvník detailu a tlačítko návratu na polohu. Nastavení ani atribuce nesmějí zakrývat aktuální šipku. Na malém displeji mapa používá kompaktní statistiku; úplná data jsou na Jízdě. Žádná zásadní akce se nezpřístupňuje pouze drobným gestem.

### 3.3 Historie a detail

Seznam: datum, délka, čistý a celkový čas, stav dokončeno/přerušeno, případné mezery. Detail: trasa se segmenty, základní statistiky, výškový profil, export, přejmenování a výslovné smazání. Historickou trasu lze celou prohlédnout tlačítkem Celá trasa: omezení živého výhledu 1 km se na tento odlišný režim nevztahuje. Přepnutí mezi záložkami uvnitř modulu jízdu nezastaví; otevření historie neaktivuje další GPS watch.

### 3.4 Nastavení

Sekce Jízda (automatická pauza), Mapa (orientace, 2D/3D, sklon, meze výhledu, ruční/auto), Přístroje (rozsah ciferníku a desetiny), Data (velikost historie, export), Provoz (zapnutá obrazovka, dostupnost wake lock). Nastavení je použitelné před startem. Změna zobrazení během jízdy neovlivní ukládání bodů.

## 4. Stavy a životní cyklus

Ukládat zvlášť stav relace, stav GPS a stav pohybu; nerozmnožovat jeden stavový enum pro všechny kombinace.

| Osa | Hodnoty | Význam |
|---|---|---|
| Relace | ready, waiting-fix, recording, manual-paused, interrupted, completed | Úmysl uživatele a životní cyklus |
| GPS | idle, acquiring, valid, weak, lost, denied | Platnost a dostupnost polohy |
| Pohyb | unknown, moving, stopped | Prokázaný pohyb nebo stání; podklad pro automatickou pauzu |

Start: Spustit jízdu vyžádá polohu, ukáže Čekám na GPS. Čas a první segment začnou až prvním použitelným fixem. Čekání na oprávnění se do jízdy nepočítá. Při zamítnutí zůstane modul v ready s možností opakovat žádost. Zrušení čekání musí zneplatnit i opožděný callback.

Ruční pauza: zapíše událost, ukončí segment a přestane přičítat čistý čas i vzdálenost. Lze nechat watch pro orientaci mapy, ale body přesunu během ruční pauzy se nezahrnují do uložené projeté stopy. Pokračovat otevře nový segment po novém platném fixu. Automatická pauza na rozdíl od ruční sleduje rozjezd a může se sama ukončit.

Pozadí, STOP od jádra, ztráta zámku nebo zavření modulu: uložit bod přerušení a poslední potvrzené shrnutí, zastavit watch a animace, uvolnit wake lock i WebGL. Po návratu nabídnout explicitní pokračování. Relace není automaticky prohlášena za dokončenou. Dva souběžné záznamy stejného modulu se nepovolí.

Systémové Zpět nejprve zavře dialog dle společného protokolu; návrat do kolekce jízdu přeruší a zachová. Jádro dnes čeká na STOP jen 150 ms: bezpečnost dat musí stát na průběžných transakcích, nikoli na velkém závěrečném zápisu. STOPPED má být odesláno po dokončení nezbytného checkpointu; před případným prodloužením čekání vyhodnotit dopad na ostatní moduly.

## 5. Čas, pauzy a statistiky

### 5.1 Jednoznačné veličiny

- Celkový čas: od prvního přijatého fixu po ukončení, včetně všech pauz. Při obnovení stejné jízdy zahrnuje i dobu přerušení; tato doba je samostatně vyznačena. Uživatel místo toho může starou jízdu ukončit a založit novou.
- Čistý čas: součet intervalů se stavem moving, dostupnou použitelnou GPS a relací recording. Ruční pauza, automatické stání, neznámý pohyb a přerušení se nezapočítají.
- Neznámý čas: intervaly bez spolehlivého určení pohybu. Zobrazit v detailu; nulový čistý čas během výpadku neznamená prokázané stání.
- Vzdálenost: součet akceptovaných úseků v témže segmentu, mimo ruční pauzu, výpadky a potvrzené stání. V přijímaném pohybu nefiltrovat každý malý úsek samostatným prahem; jinak se ztratí pomalá jízda.
- Průměr: vzdálenost / čistý čas; při nulovém čase —. Maximum rychlosti pouze z validovaných údajů; jeden GPS výkyv nesmí vytvořit rekord.

Na aktivní stránce počítat intervaly monotónním časem; datum/čas uložit UTC. Návrat z pozadí vytváří přerušení. Změna hodin telefonu se označí a nesmí vyrobit zápornou délku. Neodvozovat čistý čas od počtu ticků ani od počtu GPS bodů. Číselné jednotky a zaokrouhlení používat až při zobrazení.

### 5.2 Doporučené laditelné hodnoty

| Parametr | První návrh D | Poznámka |
|---|---|---|
| Potvrzení rozjezdu | nad 3 km/h po 3 s platných dat | Nečekat na dokončení debounce se zahozením celého rozjezdu; interval po potvrzení zahrnout od začátku kandidáta |
| Potvrzení stání | pod 1,5 km/h po 8 s | Po potvrzení vyřadit kandidátní klidový interval; před potvrzením jde o předběžnou statistiku |
| Slabá poloha | horizontální přesnost nad 30 m | Vzorek lze uchovat s příznakem, nepřičítat bez ověření |
| Ztracená poloha | žádný použitelný fix 10 s | Ukázat zastaralost; mezitím kvalitu viditelně zhoršovat |
| Kandidát GPS skoku | odhad úseku nad 100 km/h | Kontrola s přesností a časem; nejde o uživatelský rychlostní limit |
| Uložení bufferu | nejvýše po 5 s nebo 10 bodech | Vždy po změně relace; cíl ztráty při násilném ukončení do 5 s za normálního provozu |

Prahy se musí potvrdit testem reálné pomalé jízdy, tlačení kola a zastavování. Akcelerometr může podpůrně zvýšit důvěru v detekci, ale nesmí proměnit neurčitou GPS v přesné měření vzdálenosti. V1 může plně fungovat bez povolení pohybových senzorů.

## 6. GPS, rychlost a výška

Žádat `watchPosition` s vysokou přesností, bez vynucování údajné pevné frekvence vzorkování: frekvenci určuje zařízení a prohlížeč. Uchovat acquisition timestamp a čas přijetí. Odmítnout nečíselné souřadnice, neplatné rozsahy, duplicity a zpětný čas. Přesnost, stáří a konzistence s předchozími body rozhodují o použitelnosti.

Rychlost: přednostně nenulová i nulová platná `coords.speed`; nula je skutečný údaj a nesmí spouštět fallback. Je-li speed null, použít odhad z několika kvalitních bodů a skutečného času s označením odhad. Haversine nebo geodetický výpočet, nikoli rozdíl stupňů. Při nedostatku podkladů —. Vzdálenost a rychlostní filtr mají mít oddělené pipeline.

Ručička: stálý rozsah 0–60 km/h (D), volitelně 0–40/80. Za jízdy se rozsah sám nepřepíná. Překročení rozsahu drží ručičku na konci s indikací a zachová skutečný číselný údaj. Filtrovaný vstup pro ručičku, rychlá animace na aktuální odhad bez nekonečného zpoždění. Číslo nejvýše 2× za sekundu; standardně celé km/h, volitelně desetiny. Nejde o zdroj nových údajů mezi GPS vzorky. Při výpadku údaj zneplatnit, nezobrazovat animovanou falešnou nulu.

Výška: uchovat altitude a altitudeAccuracy, null oddělit od nuly. API udává výšku vůči WGS84 elipsoidu; bez geoidové korekce neslibovat přesnou výšku nad mořem. UI používá „Výška GPS“ a „orientační“. Geoidová korekce nebo výška z terénních dat může být rozšíření. Profil zahrnuje jen dostupné výšky, bez interpolace přes dlouhé mezery. Součet nastoupaných metrů kvůli šumu není P0; nepřidávat ho bez filtrace a ověření.

## 7. Mapa a kamera

### 7.1 Definice souřadnic pohledu

Volba knihovny: doporučen MapLibre GL JS se zamčenou ověřenou verzí. Podporuje bearing, pitch, zoom a padding [S2, S3]. Poloha kola je kolem 75 % výšky nezakryté mapy a vodorovně uprostřed volné oblasti, ne nutně celého canvasu. Do výpočtu zahrnout slider, atributy, záhlaví a spodní přístrojový panel.

Orientace podle jízdy používá validní GPS heading; jinak směr kvalitního úseku nad prahem nejistoty. Při malé rychlosti drží poslední spolehlivý bearing, před jeho získáním sever nahoře s vysvětlením. Kompas telefonu není default: směr držení telefonu není směr jízdy. Kruhové filtrování musí projít z 359° na 1° krátkou cestou. Rychlá skutečná zatáčka nesmí čekat několik sekund na přetočení.

### 7.2 Výhled a tvrdá hranice

Uživatel nastavuje výhled L v metrech, nikoli číslo zoomu. L je dopředná vzdálenost od GPS polohy k horní hranici viditelné mapy po směru pohybu. V první verzi jde o geografický směr, nikoli vzdálenost po neznámé budoucí cestě. Křivolakou budoucí trasu bez plánu nelze předvídat.

Kamera se přepočítá při změně L, zeměpisné šířky, sklonu, bearingu, orientace a rozměrů mapy. Pracovat s projekcí/unprojekcí bodů, iterativně najít zoom a center; nespoléhat na pevnou tabulku zoom→metry. Cíl geometrické odchylky L do 5 % na podporovaném rozsahu a testovaných zeměpisných šířkách 45–55°.

Tvrdé maximum uživatele platí pro dopřednou projekci všech vykreslených pozemních bodů, nikoli jen horního středu. Ověřit horní okraj a rohy. Pokud sklon a poměr stran vytváří vzdálenější viditelné body, upravit kameru; pokud to nestačí, obsah za rovinou maxima zakrýt neutrální maskou se změkčenou hranou. Maska musí současně potlačit popisky a ovládání skrytého obsahu, nesmí překrýt GPS šipku ani atribuci. Žádný zobrazený nekonečný horizont. Pokud není limit na daném zařízení dosažitelný, snížit sklon a informovat uživatele; nevydávat překročení za splnění požadavku.

### 7.3 Režimy

2D: pitch 0°. 3D pohled: uložený pitch 0–60°, výchozí 45° (D). Přepnutí zachová L, režim přiblížení, orientaci, polohu a údaje. Název „3D pohled“ znamená perspektivně sklopenou mapu; neobsahuje příslib reálného reliéfu, budov či stromů z obrazových náhledů. DEM terén musí mít samostatný zdroj, licenci, offline strategii i testy, pokud bude později zařazen.

Výchozí doporučení: směr jízdy, auto zoom, 250–1 000 m, 45°. Ruční výhled od 50 m do nastaveného maxima; maximum standardně 1 000 m, navržené volby 250/500/1 000/2 000 m. Změna maxima omezí i aktuální ruční hodnotu, bez jejího přepsání do jiné jízdy.

Auto výhled: `L = clamp(v_filtered × 60 s, L_min, L_max)`. Pro 25 km/h vyjde přibližně 417 m. Použít filtrování rychlosti, změnu L až při rozdílu např. 15 %, plynulý přechod 0,5–1,0 s a omezení frekvence kamerových cílů. Při stání či nejisté GPS držet poslední smysluplný výhled; nejistá data jej nezvětšují na maximum.

### 7.4 Svislý posuvník detailu

Umístění: pravý okraj mapy; rail, oranžový thumb s hmatově čitelnými čárkami, + nahoře, − dole, vedle thumbu bublina „150 m“/„1 km“. Dále AUTO a zaměření. Dotyková oblast širší než samotná čára, alespoň 48 CSS px; thumb a hlavní tlačítka alespoň 48–56 CSS px dle prostoru.

Logaritmický převod: pro polohu t od horního do dolního konce `L = L_min × (L_max/L_min)^t`. Horní konec tedy 50 m a spodní aktuální maximum. Label zaokrouhlit pro čitelnost, interní výpočet zachovat přesný. +/− mění hodnotu např. faktorem 1,25. Vizuálně se slider aktualizuje i při pinch gesture a změně AUTO.

První pointerdown během tažení přepne zoom do manual; neodpojí follow-position ani follow-heading. Použít pointer capture, touch-action: none pouze na ovladači, blokovat mapové drag gesture začaté na slideru. Pointercancel ponechá poslední platnou hodnotu a korektně ukončí drag. AUTO obnoví automatický výpočet v nastavených mezích. Obsluha klávesnicí/čtečkou: role slider, jednotky, aktuální hodnota, šipky a Home/End; ± a AUTO přístupné tlačítky.

### 7.5 Ruční prohlížení a síť

Ruční posun mapy mění follow-position na free-pan; heading-up se během prohlížení podrží, aby mapa neujížděla pod prstem. Ukázat tlačítko Obnovit sledování. Pinch mění jen zoom do manual. Návrat na polohu obnoví follow bez nuceného přepnutí zoomu na auto.

Živý track a poloha jsou oddělené vrstvy od podkladu. Při nedostupnosti podkladu záznam pokračuje; zobrazit stav „Mapa není dostupná“, GPS data a možnost zobrazit stopu na neutrálním podkladu s měřítkem. Není to plnohodnotná offline navigační mapa. Podklady/styly/fonty/sprites nesmějí být skrytá nezdokumentovaná závislost instalačního balíčku.

## 8. Data, obnova a architektura

### 8.1 Návrhový datový model

| Entita | Hlavní pole |
|---|---|
| Ride | id UUID, schemaVersion, startedAt UTC, endedAt, state, name, lastCheckpoint, aggregates, qualitySummary |
| TrackPoint | rideId, sequence, segmentId, acquiredAt, receivedAt, lat, lon, accuracy, altitude?, altitudeAccuracy?, speed?, heading?, source, qualityFlags |
| Segment | id, rideId, startedAt, endedAt, reasonStart/reasonEnd, první/poslední sequence |
| RideEvent | id, rideId, timestamp, type: pause/resume/gps-lost/interrupted/clock-change, metadata bez citlivého logování |
| Settings | mapMode, pitch, orientation, zoomMode, manualLookahead, min/maxLookahead, autoPause, instrumentRange, displayPrecision |
| RideSummary | distanceM, movingMs, elapsedMs, unknownMs, maxSpeed, counts; odvoditelná cache, ne jediná autorita |

Všechny číselné hodnoty uvnitř v SI; UI lokalizované. Trasa se ukládá po blocích, nikoli jako neustále přepisovaný celý JSON v localStorage. Zápis bodů a souvisejícího checkpointu má být transakční a idempotentní pomocí `(rideId, sequence)`. Při duplicitním callbacku se bod ani čas nepřičte dvakrát. Při plném úložišti jasně oznámit, že další body nejsou uloženy, nabídnout export; nic automaticky nemaže staré jízdy.

Surové přijatelné body a příznaky uchovat; pro vykreslování generovat zjednodušenou reprezentaci, která nesnižuje autoritu exportu. GPX ukládá trkseg podle segmentů, souřadnice WGS84 a UTC time; body s chybějící výškou nedostanou vymyšlené ele. JSON nese původ výšky a všechna metadata, která GPX nemusí přenést. Bez geoidové korekce není ele prohlášen za ověřenou nadmořskou výšku.

### 8.2 Integrace do skutečného projektu

Aktuální soubory: `core/db.js`, `core/packages.js`, `core/main.js`, `scripts/module-bridge.js`, `scripts/sw-template.js`, `scripts/build-packages.py`.

Dnes `ArcadeHost.storage` obaluje pouze namespaced localStorage; `readData`, `eraseData`, snapshot a restore v jádře pracují pouze s touto oblastí. Samostatné vložení GPS databáze do modulu by obešlo „Odebrat včetně dat“ a body obnovy. Toto je P0 závislost před vydáním, nikoli důvod uložit velké trasy do localStorage.

Doporučený směr: obecné asynchronní úložiště dat modulů s IndexedDB, společné pro bridge a správce dat. Existující synchronní API zůstane kompatibilní. Nepřidávat speciální zacházení jen pro ID cyklo. Velká data, přehled jejich velikosti, snapshot, obnova a smazání musí mít společnou správu a zámky. Pro snapshot použít bloky s odkazy/copy-on-write nebo ověřenou kopii s kontrolou kvóty; neúspěšná záloha nesmí aktivovat nevratnou migraci.

Doporučené minCoreVersion 2.1.0 (dosud nevydaná, potvrdit při implementaci), modul 1.0.0, API kompatibilní doplnění protokolu 1 s explicitní kontrolou nové storage capability. Existující moduly API 1 mají dál fungovat. Formát dat modulů a verze instalačního manifestu se nezaměňují. Konkrétní API/DB migrace se musí ověřit v etapě 0.

Pozor na existující service worker: otevírá centrální `arcade-modular-v1` s DB version 1. Nelze slepě zvýšit IndexedDB version z modulu a nechat starý worker otevírat version 1. Preferovat samostatnou obecnou datovou databázi `arcade-module-data-v1`, nebo provést úplnou kompatibilní migraci všech klientů včetně workeru. Návrat jádra na starou verzi nesmí předstírat podporu nového datového úložiště. Případné mazání nekompatibilním starým jádrem musí být blokované nebo explicitně vysvětlené.

Navržená struktura modulu: `module-src/cyklo/{module.json,index.html,style.css,game.js,ride-engine.js,gps.js,ride-store.js,map-controller.js,camera.js,speedometer.js,exports.js,vendor/}`. Název game.js lze ponechat kvůli zvyklosti, nemá herní význam. Statické knihovny a jejich licence zabalit do neměnného balíčku; nepoužívat běhové CDN pro samotné ovladače. Adaptér mapových podkladů držet odděleně od ride-engine.

### 8.3 Lifecycle, iframe a výkon

`start` pouze otevře připravenou obrazovku, měření až po akci. `pause` od jádra znamená přerušení měření, ne automatickou pauzu při stání. `stop` je idempotentní úklid s bezpečným checkpointem. Opožděné callbacks ignorovat pomocí generation tokenu; geolocation watch ID 0 zpracovat korektně, i když ho některé mocky používají.

Pro wake lock je nutné ověřit podporu a případnou Permissions Policy v iframe; jádro dnes deleguje geolocation/accelerometer/gyroscope, nikoli explicitně screen-wake-lock. Při nepodpoře zobrazit srozumitelný stav a záznam neslibovat na zamčeném displeji. Při obnově stránky žádat wake lock znovu až podle povoleného aktivního kontextu; žádné pokusy držet aplikaci na pozadí skrytým audiem.

Cíle: plynulá ručička kolem 30 fps nebo výše na cílovém telefonu; GPS callback nesmí čekat na těžké překreslení mapy. Testovací dataset 4 h / 15 000 bodů, prohlížení historie bez vykreslení všech markerů najednou. Mapa WebGL se po odchodu skutečně zničí. Ztráta WebGL nesmí ukončit záznam; UI může přejít na přístroje a oznámit nedostupnou mapu.

## 9. Přístupnost, soukromí a provoz

- Hlavní dotykové akce 56 CSS px, ostatní minimálně 48 tam, kde to prostor dovoluje. Kontrast textu standardně nejméně 4,5:1, velkého textu 3:1. Stav vyjadřovat textem i barvou.
- Testovat portrait 360 × 640 a 390 × 844, tablet a landscape. Při nedostatku místa zmenšit panel, nikoli zásadní tlačítka; nastavení může scrollovat. Slider nesmí zablokovat navigaci prohlížeče mimo svou plochu.
- Zamknutí ovladačů jako P1, se zřetelným dlouhým odemknutím a alternativou pro přístupnost. Nevyžadovat přesné tažení pro Pauzu.
- Žádná automatická geolokace po instalaci, otevření historie či návratu na stránku. Oprávnění a důvod vysvětlit při startu.
- Body se nezapisují do konzole, analytiky ani reportů chyb. Ruční export je výslovná akce.
- Online poskytovatel map nutně vidí síťové požadavky na zobrazované oblasti a síťové údaje; tvrzení „všechna poloha zůstává v telefonu“ proto není pravdivé pro online mapu. Toto popsat v nastavení. Neposílat seznam GPS bodů dodavateli bez další schválené funkce.
- Uživatel může vymazat data webu, úložiště může být omezené; export je nezávislá záloha. Aplikace neslibuje absolutní zachování.

## 10. Mapové zdroje a licence — otevřené rozhodnutí

MapLibre je renderer, nikoli poskytovatel map. Vybrat zvlášť vektorové dlaždice, styl, glyphs, sprites a případný DEM. Vyhodnotit cyklistické detaily (cesty, povrch, omezení průjezdu podle dostupných dat), čitelnost, CORS, HTTPS, rychlost, kvóty, cenu, veřejnost API klíče, atribuci a práva k offline použití. Obrazové náhledy nezaručují totožné 3D budovy či vegetaci.

První návrh vydání: online mapový podklad + plně lokální offline záznam; plné offline oblasti až po výběru povoleného zdroje. Nezahrnovat hromadné stahování z veřejného standardního serveru tile.openstreetmap.org; jeho pravidla tuto funkci zakazují [S4]. Žádnou placenou službu, účet či neveřejný klíč nezřizovat bez konkrétního rozhodnutí uživatele. Pokud půjde zvolit vhodný bezplatný zdroj bez závazku, je jeho výběr rutinní implementační krok, který se zdokumentuje.

## 11. Rozhodnutí před zahájením příslušné etapy

| Téma | Stav | Doporučení / dopad |
|---|---|---|
| Rozsah první verze a styl C | Požadavky z konverzace | Zachovat včetně analogového přístroje a slideru |
| Reálný prostorový terén | Neobjednané rozšíření | V1 jen sklon mapy; DEM až zvlášť |
| Záznam při zhasnutém telefonu | PWA omezení | V1 aktivní viditelná stránka; požadavek na garantované pozadí by měnil platformu |
| Dodavatel a offline podklady | Otevřené | Nejdřív technický test a podmínky; při nutnosti platby se rozhoduje uživatel |
| Výchozí prahy pauzy/filtrace | Doporučení D | Ladit podle testovací jízdy, není to změna produktového záměru |
| Hostované IndexedDB a snapshoty | Nutná technická závislost | Ověřit kompatibilní obecný návrh před stavbou historie |
| Historie, GPX/JSON, lock | Navržená funkčnost | GPX/JSON a zámek P1; lze schválit při zahájení celého plánu |

## 12. Zdroje technických omezení

Ověřeno 14. 11. 2026; online dokumentace se může měnit. Konkrétní knihovnu při implementaci připnout a znovu ověřit API.

- [S1] W3C Geolocation: https://www.w3.org/TR/geolocation/ — pole polohy, rychlosti a směru, výška vůči elipsoidu a podmínka viditelného dokumentu.
- [S2] MapLibre CameraOptions: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/ — bearing, zoom, pitch.
- [S3] MapLibre PaddingOptions: https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/PaddingOptions/ — nezakrytá oblast kamery.
- [S4] OSMF Tile Usage Policy: https://operations.osmfoundation.org/policies/tiles/ — atribuce, caching a zákaz offline prefetch standardního veřejného tile serveru.
- Primární podklady projektu: README.md, docs/modularization-plan.md a výše vyjmenované aktuální zdrojové soubory. Specifikace neprohlašuje nové funkce za již implementované.
