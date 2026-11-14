# CYKLO 1.1.0 — mapy, plánování a navigace

## Vydání
- **CYKLO Open** (`cyklo`) aktualizuje původní modul a zachovává jeho historii a nastavení. OpenFreeMap/MapLibre, explicitní hledání přes Photon, cyklistické výpočty přes BRouter (trekking, fastbike, mtb).
- **CYKLO Mapy.com** (`cyklo-mapy`) se sestavuje ze stejného zdroje; liší se konfigurací vydání. Turistický/základní/letecký raster, geokódování a výpočet přes Mapy REST API.
- Samostatné moduly mají oddělená úložiště podle současné architektury jádra. Přenos plánu je možný exportem/importem JSON; žádný modul nečte data druhého mimo své rozhraní.
- Neprovádí se registrace v referenčním katalogu Mapy.com ani aktivace placené spotřeby. Pro skutečné API je nutný vlastní projekt a klíč. Uživatelský klíč není součástí vydaného kódu; v zařízení je uložen v nastavení. Omezit doménou, např. `danielcech76.github.io`; nejde o serverové tajemství.

## Použití
1. Mapa → **Zjistit polohu**: nový GPS fix, souřadnice, přesnost, výška, stáří. Volitelné sledování bez časomíry/záznamu; žádný GPS požadavek při pouhém načtení modulu.
2. Jeden prst posouvá, dva přibližují a otáčejí (MapLibre). Ruční posun/rotace pozastaví sledování. Kompas nastaví sever, zaměřovač obnoví směr podle nastavení. Boční posuvník funguje i po ručním posunu. V plánování lze gesty oddálit mimo limit živého výhledu.
3. Trasy → Nová: start se pokusí získat aktuální GPS; při odmítnutí lze použít hledání nebo mapu. Start/cíl/via lze vybrat GPS, explicitním hledáním adresy nebo klepnutím v mapě. Nejvýše 15 via. Pořadí mění tlačítka ↑/↓ (mobil) nebo přetažení řádku; bod v mapě je přetahovatelný. Změna invaliduje vypočtenou linii.
4. Vypočítat → délka, odhad času a dostupný výškový profil. Uložit → seznam plánů oddělený od historie skutečných jízd. Kopie, změna názvu, otočení směru s novým výpočtem, smazání, JSON export/import a souvislý GPX import.
5. Simulace → modelová rychlost, 1×/5×/20×, pauza, posun, ukončení; bez GPS a bez vytváření jízdy. Během aktivního záznamu nebo čekání na start není spuštění dovoleno.
6. Použít trasu → původní start / výpočet příjezdu na start / připojení na nejbližší segment. Zapíná sledování GPS; záznam se spouští samostatným tlačítkem.
7. BRouter poskytuje odbočovací pokyny; bez pokynů (Mapy REST, GPX) se zobrazí poctivé sledování modré linie. Zbývající délka a orientační čas, detekce mimo trasu po 5 s nad max(40 m, 1,5×přesnost GPS); přepočet na pokyn se zbývajícími via. GPX se automaticky nepřepočítává, aby nezměnil původní linii.
8. Navigovat v Mapy.com → potvrzení předání bodů externí aplikaci, se zřetelnou informací o přerušení CYKLO na pozadí. Externí aplikace může trasu přepočítat jinak.

## Hranice dat a dostupnosti
- Výsledná geometrie, instrukce ani statistiky Mapy API se nikdy nezapisují do PlanStore/exportů. Ukládá se uživatelský plán z vybraných bodů; jeho výpočet je po opětovném otevření online. Smluvní možnost trvalého ukládání API výsledků je nadále otevřená. Vlastní GPS záznam je samostatný.
- BRouter/Photon veřejné služby nemají garantovanou dostupnost. Žádné průběžné dotazování při psaní ani automatické opakování/přepočítávání; timeout 45 s. Zadaný dotaz/body se odesílají příslušné službě, viditelné mapové oblasti poskytovateli podkladu.
- Mapy logotyp a copyright jsou přítomné v mapě i samostatných vyhledávacích/plánovacích obrazovkách. Logotyp je originál https://api.mapy.com/img/api/logo.svg, viz https://developer.mapy.com/rest-api-mapy-cz/atribution/.
- Mapy data se nepřidávají do offline cache service workeru. Klientské HTTP požadavky mají `no-store`, mapové dlaždice se načítají běžným rendererem.
- 3D je perspektivní sklopení rovinné mapy, ne terénní model. Výšky GPS jsou orientační; import/výpočet bez výšek zobrazí nedostupnost.
- PWA záznam funguje při viditelné aplikaci. Pozadí ukončí GPS watch a přeruší záznam; pokračování pouze ručně.
- Pokud není dostupný WebGL/mapový podklad, funguje schematická modrá plánovaná a zelená zaznamenaná stopa. Výběr cest a mapová gesta vyžadují funkční renderer; lze nadále hledat místa a zaznamenávat GPS.

## Ověření
- Automatické regresní sady pro engine, úložiště, kameru, UI a mapový životní cyklus; nové sady `cyklo-navigation.test.cjs` a `cyklo-planner.test.cjs` pro projekci na trasu, smyčky, simulaci, waypointy, turn hinty, provider kontrakty a zákaz persistence Mapy výsledků.
- UI test ověřuje jednotlivý GPS fix a průběžné sledování bez vytvoření jízdy, nulovou výšku i zastavení watch ID 0 při pozadí.
- Prohlížeč: skutečné hledání Praha hl. n. / Vyšehrad přes Photon, výpočet BRouter (3,6 km), výškový profil, uložení a spuštění simulace.
- Cloudový prohlížeč neposkytl použitelný WebGL; zobrazení podkladu/gesta na telefonu a fyzická GPS zůstávají k terénnímu ověření. Skutečné Mapy.com API nelze ověřit bez uživatelského klíče; testovány kontrakty a chování bez klíče.

## 1.2.0 — jemné karty a sloupcová výška
- Zachovaný layout a paleta, jemné okraje a stíny podle varianty A; výškové sloupce s decentním barevným přechodem podle varianty B.
- Plán, historie i simulace používají společný profil: 24 stejně dlouhých úseků podle vzdálenosti. Výška sloupce je průměr vážený délkou úseku, nikoli počtem vzorků. Tenké značky min/max zachovávají krátké vrcholy; neúplná výšková data zůstávají jako mezery.
- Graf jasně označuje lokální rozsah v metrech (minimální rozsah 2 m pro roviny) a vzdálenost v km. Nulová i záporná výška jsou platná data.
- Simulace obsahuje kompaktní profil pod mapou: projeté zelené sloupce, oranžový aktuální sloupec s výškovým štítkem a světlejší budoucí úseky. Pauza, seek, rychlost přehrávání a konec trasy aktualizují profil ze stejného simulačního stavu.
- Hlavička během simulace uvádí „Simulace“, nezobrazuje starý GPS fix. Skutečné jízdní metriky jsou nahrazeny vysvětlením modelové rychlosti. Opakované informační proužky byly sjednoceny.
- Agregace se cachuje podle trasy; při přehrávání se znovu nezpracovává celý seznam GPS bodů. Změna rozměrů/otočení překreslí oba profily.
- Test `cyklo-elevation.test.cjs` ověřuje vážení, mezery, nulu, rovinu, zachování vrcholů, krajní polohy simulace, cache a přístupný popis grafu. Planner test ověřuje profil i posun jeho aktuálního sloupce při seeku.

## 1.2.1 — obnova mapy a diagnostika Mapy.com
- Opraveno trvalé překrytí mapy náhradním plátnem po jediné chybě dlaždice. Skutečně načtená rastrová dlaždice obnoví podklad; chyba jedné dlaždice nezakryje již funkční mapu. Metadata zdroje sama nepotvrzují úspěšné načtení dlaždice.
- Chyby rozlišují HTTP 401/403, 402, 404, 429, serverové potíže, síť a WebGL. Žádné URL ani API klíče se nevypisují do uživatelského hlášení.
- Nastavení Mapy.com: **Otestovat klíč** a automatické ověření po **Použít klíč a podklad**. GET jedné pevné světové dlaždice `basic/256/0/0/0` (bez GPS), bez ukládání odpovědi, timeout 15 s. Úspěšný HTTP obrázek potvrzuje přístup k Map tiles, nikoli funkčnost WebGL či všech oblastí ostatních mapových sad.
- Nastavení oprávnění klíče: HTTP referer `danielcech76.github.io` bez protokolu a cesty; povolená služba Map tiles. Podle oficiální dokumentace se změny omezení mohou projevit do přibližně 15 minut: https://developer.mapy.com/my-account/api-key-security/.
- Reálný klíč uživatele nebyl čten ani testován. Přesnou příčinu jeho HTTP odmítnutí lze určit až z výsledku testu na jeho zařízení. Samotný původní snímek potvrzuje náhradní podklad, nikoli konkrétní chybu klíče.

## 1.3.0 — rozložení, témata a stabilní zoom
- Nastavení → Vzhled a rozložení: analogový rychloměr dole / nahoře / vodorovný rychlostní pruh nahoře. Výchozí je horní pruh a Lesní krém. Další témata: Modrá mlha a Noční grafit. Volby jsou nezávislé, okamžité a uložené do nastavení každé edice bez změny historie nebo API klíče.
- Rychlostní pruh využívá stejnou vyhlazenou rychlost jako ručička; přesný údaj zůstává doplňkový. Není interaktivním posuvníkem.
- Zoom: pevná kruhová tlačítka 48 × 48 px, kulatý jezdec 24 px na dotykové ploše 48 px. Délka dráhy se přizpůsobuje, tlačítka se nesmršťují. Při výšce mapy pod 320 px se ovládání přesune vodorovně dole. AUTO a zaměření jsou samostatně vpravo nahoře. Kamera i schematický fallback ponechávají místo nad kompaktním ovládáním.
- Témata mění ovládání, ciferník a výškový profil; mapový podklad zůstává ve vlastní paletě poskytovatele. Obě edice sdílejí implementaci.

## 1.3.1 — simulace a svislý zoom
- Volba jiné spodní obrazovky přeruší simulaci, zruší časovač i simulační polohu a otevře vybraný režim. Interní přechod plánovače do mapy při spuštění simulace ji nepřeruší. Spuštění skutečné jízdy nejprve ukončí simulaci. Přepnutí obrazovky samo nezapíná GPS ani záznam.
- Zoom je vždy svisle vpravo, včetně simulace. Automatický vodorovný režim z 1.3.0 je odstraněn. Minimální výška mapy 320 px zajišťuje místo pro ovladač; při nedostatku místa je obsah posuvný.
- Nastavení → Vzhled a rozložení → Průměr ovladače zoomu: 40 / 48 / 56 px (výchozí 48). Tlačítka +/− a jezdec jsou kruhové, mění se jejich průměr i šířka lišty. Celková výška lišty závisí na mapě, nikoli na zvoleném průměru; při změně velikosti zůstává stejná. Volba je uložená lokálně pro každou edici.
- Všech 20 testovacích souborů, build a kontrola balíčků prošly. Integrační UI test spouští skutečný plánovač a ověřuje přechod ze simulace do Jízdy, Tras i Historie bez vytvoření záznamu. Prohlížeč: přechod na Trasy a opětovné spuštění simulace, svislý ovladač 8 px od pravého okraje; změna průměru 48 → 56 px ponechala výšku 216 px, tlačítko i jezdec mají 56 px. Snímek screenshots/cyklo-1.3.1-zoom.jpg. WebGL v cloudovém prohlížeči není dostupné, ověřeno na schematickém podkladu.
