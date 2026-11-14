# Modulární Kapesní arkáda — schválený plán a implementace 2.0

## Schválená rozhodnutí

1. Jen naše kontrolované moduly; cizí autoři a izolované nedůvěryhodné pluginy až později.
2. Instalují se celé moduly včetně obsahu. Žádné samostatné pinballové stoly.
3. Jediný vlastní online katalog na stejném webu; bez ZIP importu a cizích katalogů.
4. Nová instalace obsahuje jen malé jádro; průvodce nemá žádný předvýběr.
5. Aktualizace modulů se automaticky kontrolují, ale stáhnou se jen ručně. Aktivace až při příštím spuštění.
6. Odebrání ponechá data, volitelně lze odebrat i data. Ponechaná data lze smazat později.
7. Jádro se stáhne automaticky, jeho použití se potvrzuje ručně z menu.
8. Přechod současné aplikace rovněž bez předvýběru, s ponecháním existujících dat.
9. Po aktualizaci zachovat jednu předchozí funkční verzi; umožnit její odstranění.

## Dokončené etapy

- Jádro a protokol modulů v1: katalog, navigace, instalace, data a iframe host.
- Samostatný Pong jako pilot; samostatný Pinball včetně Neon Arcade a Laboratoř telefonu.
- Správce a první výběr, hromadné stahování, velikosti a stavy offline dostupnosti.
- Úplné stahování s SHA-256 ověřením, dočasná cache, atomický zápis registru až po dokončení.
- Příprava aktualizace vedle funkčního balíčku, kontrola API/jádra/datového formátu, odložená aktivace.
- Jedna předchozí verze, návrat bez sítě, body obnovy dat a možnost vrátit obnovu.
- Ručně potvrzený výběr nové verze jádra, který zůstává zachovaný i po zavření všech oken.
- Převod původního Pinball rekordu do oddělených dat modulu; původní klíč zůstává do výslovného smazání dat.
- Regresní kontroly instalací, workeru, lifecycle, migrace, Pinballu a senzorů.

## Architektura

`core/` obsahuje obecný host, IndexedDB registr, správce balíčků a vzhled kolekce. Neobsahuje herní kód. `module-src/<id>/` obsahuje zdroj samostatného modulu a jeho metadata. `modules/<id>/<version>/` jsou neměnné distribuční balíčky. `catalog.json` je nezávislý katalog a není součástí otisku jádra: nový modul tedy nemusí vyvolat aktualizaci jádra.

Každý modul má vlastní dokument a styly. Protokol `READY / INIT / STARTED / PAUSE / STOP / STOPPED` řeší životní cyklus; zprávy pro navigaci a dialogy zachovávají systémové Zpět. Zdroj okna a původ zpráv se ověřují. Jde stále o důvěryhodný kód stejného původu, nikoli bezpečnostní sandbox pro cizí pluginy.

Cache modulu je pojmenovaná podle ID, verze a jedinečné instalace. Registr odkazuje na aktivní, připravenou a jednu předchozí verzi. Přerušení nebo nedostatek místa odstraní jen rozpracovanou cache. Spuštění ověří úplnost a součty; chybějící soubory neobchází načtením programu ze sítě.

Nativní Web Locks chrání souběh oken; pro prohlížeče bez nich je připraven časově omezený IndexedDB zámek. Každý spuštěný modul drží zámek relace. Úložiště se automaticky neuvolňuje na úkor instalovaných modulů. Po pádu mohou zůstat rozpracované cache, které se čistí až po dni a pouze pokud nejsou součástí registru.

Jádro má vlastní obsahový otisk a vybranou cache v IndexedDB. Nový worker může být stažen a aktivován prohlížečem, ale bez potvrzení se dál servíruje vybraná verze uživatelského jádra. Proto zavření všech oken samo o sobě nepotvrdí novou verzi rozhraní.

Uživatelská data jsou oddělena prefixem `arcade.data.<id>.`. Snímky před změnami jsou v IndexedDB. Současné moduly používají datové schéma 1; nepodporovaná změna schématu se zablokuje, místo aby se zkoušela neověřená migrace. Přechod na schéma 2 musí dodat konkrétní migrační a návratovou funkci spolu s příslušnými testy.

## Omezení první verze

- Bez cizích zdrojů, ZIP importu a samostatných obsahových balíčků.
- Jedna spuštěná relace konkrétního modulu v rámci stejného původu; při kolizi aplikace požádá o zavření jiné relace.
- Odebrání či návrat verze je možný z menu, ne během hraní.
- Offline fungují programy a jejich soubory; dostupnost GPS/senzorů a jejich oprávnění je vlastnost zařízení/prohlížeče.
- Trvalost webového úložiště nelze absolutně garantovat; správce ukazuje využití a nabízí žádost o trvalejší ochranu.

## Závěrečné ověření

Automatické kontroly a ruční testovací postup jsou v README. Vývojový náhled může měnit HTML, a tím správně vyvolat zamítnutí integrity; skutečnou instalaci je nutné ověřit na serveru, který soubory nemění.
