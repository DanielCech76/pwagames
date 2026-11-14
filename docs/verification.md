# Ověření modulární verze 2.0.1

Datum: 14. 11. 2026. Publikované prostředí: https://danielcech76.github.io/pwagames/?upgrade=2.0

## Ověřeno v publikované aplikaci

- První spuštění otevřelo průvodce bez předvybraných modulů.
- Před výběrem bylo stažené jen jádro a metadata katalogu, nikoli kód her.
- Hromadná instalace Pongu, Pinballu a Laboratoře prošla kontrolami všech souborů a stavem Připravený offline.
- Všechny tři moduly se samostatně otevřely ze svých verzovaných balíčků.
- Pinball zobrazil kompletní ilustraci a mechanické prvky; Laboratoř zachovala podrobný i ultra kompaktní režim.
- Zpět zavřelo nastavení Pongu a následně ukončilo modul s návratem do kolekce.
- Skrytí a opětovné zobrazení Pongu ve správci změnilo nabídku bez odinstalace.
- Odebrání Pinballu nabídlo smazání dat jako výchozí neoznačenou možnost; následná opětovná instalace uspěla.
- Jádro 2.0.1 se automaticky připravilo vedle běžícího 2.0.0. Aplikace zůstala na 2.0.0 až do stisku Použít novou verzi.
- Po ručním použití jádra 2.0.1 zůstaly všechny tři instalované moduly 2.0.0 zachované a připravené offline.

## Automatické kontroly

- `scripts/check-build.py`: úplnost balíčků, velikosti, SHA-256, absence herních controllerů v jádře, jedinečnost ID a syntaxe.
- `tests/packages.test.mjs`: integrita, přerušení, nedostatek místa, bezpečné zachování aktivní verze, připravená aktualizace, aktivace při spuštění, bod obnovy dat a jeho vrácení, offline návrat programu, jedna předchozí verze, odebrání a opětovná instalace, zachování/smazání dat, odmítnutí nekompatibility, oprava neúplné cache.
- `tests/worker.test.cjs`: precache pouze jádra, zachování výběru jádra přes aktivaci workeru, výslovné použití nové verze, zamítnutí síťového spuštění neinstalovaného modulu a doručení instalovaného modulu z cache.
- `tests/bridge.test.cjs`: životní cyklus, validace původu a zdroje zpráv, dialogy, návrat a oddělené ukládání dat.
- `tests/migration.test.cjs`: zachování původního Pinball rekordu, idempotence, nepoškození novějších dat a bezpečné chování při selhání zápisu.
- `tests/pinball-engine.test.cjs`: stávající fyzikální a herní regrese.
- `tests/phone-lab.test.cjs`: stávající senzorové regrese, kalibrace, směrové ukazatele, společné vypnutí a ukončení měření.

Všechny uvedené automatické kontroly prošly. Sestavení je reprodukovatelné i po vydání: kontrola neměnnosti neodmítá identický obsah stejné verze.

## Hranice ověření

Režim letadlo a skutečné fyzické senzory na konkrétním Android telefonu nejsou v cloudovém prohlížeči ověřené. Offline doručování a návraty verzí byly ověřené automatizovanými testy workeru/instalátoru; postup pro skutečný telefon je v README.

Vývojový náhled upravuje HTML a mění jeho součet, proto se pro konečnou instalační kontrolu použil publikovaný GitHub Pages web. Kontrola integrity nebyla kvůli náhledu oslabena.
