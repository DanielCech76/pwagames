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
