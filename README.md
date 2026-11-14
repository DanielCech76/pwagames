# Kapesní arkáda 2.0 · modulární offline PWA

Jedna aplikace, vlastní výběr her a nástrojů. Malé jádro neobsahuje herní kód a žádné moduly nestahuje automaticky. V nabídce jsou samostatné moduly **Pong**, **Pinball / Neon Arcade** a **Laboratoř telefonu**.

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

Pong: dotykové pásy, A/D nebo šipky pro hráče; J/L pro druhého hráče; mezerník pauza. Pinball: A/D nebo šipky pro páčky, podržení/pouštění mezerníku pro vystřelení, P pro pauzu. Laboratoř: samostatné nebo společné zapnutí měření, podrobný/kompaktní režim, kalibrace. Data senzorů ani souřadnice se neukládají a neodesílají.

## Sestavení a lokální spuštění

Bez externích knihoven: Python 3 a Node.js 22+.

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
