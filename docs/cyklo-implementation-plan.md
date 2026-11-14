# CYKLO — implementační plán a akceptační scénáře

Verze 1.0 • 14. 11. 2026 • Stav: plán, implementace modulu nezačala.
Navazuje na [detailní specifikaci](cyklo-specification.md). Výstupem celého plánu je nový instalovatelný modul `cyklo`, nezbytné obecné rozšíření jádra a ověřená publikovaná verze pro telefon. Tento dokument sám nespouští implementaci ani zavedení placených služeb.

## 1. Princip postupu

Pracovat v navazujících etapách. Nejprve vyřešit mapovou kameru, zdroje dat a správu velkých dat, protože případné chyby v těchto rozhodnutích by znehodnotily uživatelsky hotový modul. Potom vytvořit nezávislý výpočet jízdy a teprve na něj připojit GPS, mapu a UI. Každá etapa má konkrétní výstup a podmínku dokončení; etapy nejsou požadavky na opakované potvrzování od uživatele.

Běžné technické volby řešit samostatně a zaznamenat. Zásadní změna platformy, nutná placená služba, automatický cloudový přenos polohy nebo změna významu schváleného požadavku jsou důvody vyžádat rozhodnutí. Nežádat opakovaně o schválení již přijatého vzhledu či standardních implementačních detailů.

## 2. Etapy a závislosti

| Etapa | Rozsah a výstup | Závislost | Hotovo, když |
|---|---|---|---|
| E0 · Technické ověření | Kamera, iframe oprávnění, mapový zdroj, storage návrh | Žádná | Existuje ověřený postup pro 2D/3D, výhled, datové mazání a provoz PWA |
| E1 · Obecná velká data | IndexedDB API, snapshoty, erase/restore, kompatibilita | E0 | Obnovy a odebrání fungují i bez spuštění CYKLO |
| E2 · Kostra modulu | Manifest, routing, obrazovky, životní cyklus | E0 | Modul se nainstaluje a otevře offline bez automatické GPS |
| E3 · Výpočet jízdy | Stavové osy, čas, filtry, segmenty | E2 | Deterministické scénáře počítají očekávaná data |
| E4 · GPS a perzistence | Watch, transakce, recovery, kvóty | E1, E3 | Přerušený záznam se bezpečně obnoví |
| E5 · Přístroje a základní mapa | Analogový rychloměr, mapové vrstvy | E2, E4 | Živé zobrazení odpovídá témuž ride modelu |
| E6 · Kamera a slider | Směr jízdy, výhled, 2D/3D, sklon, manuál/auto | E0, E5 | Kamera splňuje vzdálenosti i limit, ovládání je nezávislé na záznamu |
| E7 · Historie a export | Přehled, detail, profil, mazání, GPX/JSON | E4, E5 | Export, opětovné otevření a odstranění jsou konzistentní |
| E8 · Ergonomie a zařízení | Responzivita, wake lock, reálné GPS | E5–E7 | Cílový telefon projde testovacím protokolem |
| E9 · Vydání | Jádro, neměnný balíček, katalog, nasazení | E1–E8 | Publikovanou instalaci ověříme s integritou a zachováním starých modulů |

Kritická cesta: E0 → E1/E2 → E3 → E4 → E5 → E6 → E8 → E9. E7 má vlastní závislost na stabilním úložišti, nelze jej nahradit dočasným celým JSON v localStorage.

## 3. Podrobné úkoly

### E0 — ověřit rizikové předpoklady

1. Vytvořit malý lokální technický prototyp rendereru; nejde o zveřejnění samostatného produktu.
2. Ověřit kameru v 0/45/60°, bearing 0/90/180/359→1°, aktuální polohu dole a výhled 50/150/500/1 000 m na mobilních poměrech stran.
3. Změřit nejvzdálenější dopředné viditelné body; ověřit masku horní hranice a možnost potlačit vzdálené popisky. Rozhodnout, zda při extrémním poměru stran omezit sklon.
4. Vybrat konkrétní mapový zdroj a styl, prozkoumat licenci, CORS, fonty, sprites, klíče, atribuci a offline práva. Bezplatná služba není automaticky neomezená ani garantovaná.
5. Prověřit geolokaci, WebGL a wake lock ve stejnopůvodovém iframe skutečné aplikace. Zachovat fallback bez wake lock/WebGL.
6. Navrhnout obecné IndexedDB API, snapshot a smazání. Ověřit soužití starého workeru, starého jádra a dat nové verze. Před kódem zapsat krátké architektonické rozhodnutí.

Brána: požadavek na maximální výhled má měřitelnou definici a proveditelný prototyp. Pokud má být povinný záznam při zamčeném displeji, jde o zásadní rozhodnutí platformy, ne drobný bug PWA.

### E1 — rozšířit správu dat v jádře

1. Založit obecnou správu namespaced velkých dat modulů v IndexedDB. Preferovat oddělenou DB od stávající databáze instalačního workeru.
2. Zachovat současné `ArcadeHost.storage`; přidat asynchronní rozhraní a detekovatelnou capability. Určit transakční API pro body a metadata, ne callback požadavek pro každý byte.
3. Převést `readData`/metadata velikosti, `eraseData`, snapshot a restore na úplnou správu obou úložišť. Staré moduly nadále fungují beze změny svých balíčků.
4. Rozšířit správce o rozpoznání ponechaných velkých dat i po odebrání modulu. „Smazat ponechaná data“ nesmí záviset na přítomnosti spuštěného modulu.
5. Snapshoty zahrnou bloky tras, manifest bloků a nastavení. Obnovit atomicky či přepnout konzistentní generaci; před obnovou zachovat bod pro její vrácení.
6. Mazání provádět pod existujícími zámky, včetně osiřelých bloků, snapshotů a případné vlastní mapové cache při výslovném smazání všech dat. Cache programu zůstává pod původním správcem balíčků.
7. Zpracovat quota/abort/versionchange. Žádná chyba po smazání starých dat bez možnosti obnovy.
8. Vydat potřebnou verzi jádra a popsat minimum v modulu. Rozhodnout a otestovat chování návratu na jádro bez nové capability.

Brána: všechny instalační a datové regrese pro Pong, Pinball a Laboratoř projdou; samostatná testovací velká data přežijí aktualizaci, odebrání bez dat a opětovnou instalaci; erase je skutečně odstraní.

### E2 — kostra CYKLO

1. `module-src/cyklo/module.json`: první verze 1.0.0, nové minimum jádra, oprávnění Poloha a volitelně udržení obrazovky.
2. Obrazovky Jízda/Mapa/Historie, nastavení jako dialog registrovaný do stávající navigace Zpět.
3. Oddělit view state od ride state. Přepnutí záložky nesmí zakládat jízdu ani duplicitní senzory.
4. Implementovat start/pause/stop; otevření pouze ready. Bezpečný generation token pro opožděné watch callbacks a permission promise.
5. Bundle obsahuje všechen programový kód, knihovny a licence; mapová síťová data jsou explicitně oddělená závislost.

Brána: instalace a samotné spuštění fungují offline; žádné měření do pokynu. Čistý odchod a návrat bez duplicitních posluchačů.

### E3 — čistý výpočet jízdy

1. Ride engine bez DOM, s injektovanými časy a GPS vstupy.
2. Orthogonální stavy relace/GPS/pohybu; přechody a události ze specifikace.
3. Validace vzorků, segmentace, speed fallback a kontrola skoků.
4. Automatická pauza s hysterezí a kandidátními intervaly; potvrzený stav přepočítá čekací okno, aby výsledek nebyl závislý na debounce.
5. Jednoznačné oddělení moving/elapsed/unknown času; clock-change handling.
6. Shrnující statistiky a generování událostí, bez vymyšlených bodů při výpadku.

Brána: fixtures pro jízdu, semafor, pomalý kopec, přesun během ruční pauzy a tunel dávají stejný výsledek při různém pořadí render ticků.

### E4 — GPS a ukládání

1. Adaptér Geolocation API a stav oprávnění; rozlišit odmítnutí, timeout, nedostupnost a nekvalitní fix.
2. Při startu počkat na použitelný fix; ukládat UTC acquisition time i čas přijetí, SI hodnoty a kvalitu.
3. Buffer bodů s transakčním checkpointem, sekvence a idempotence. Doporučený interval max 5 s/10 bodů plus změny stavu.
4. Přerušení z pozadí/STOP zapisovat průběžně, spoléhat primárně na poslední potvrzenou transakci. Crash recovery vytvoří mezeru a nabídku pokračování, ne falešný souvislý úsek.
5. Při nedostatku místa viditelný stav „Další body se neukládají“. Po bezpečném uvolnění lze pokračovat novým segmentem.
6. Pro případ více oken využít zámek relace a následnou kontrolu vlastnictví zápisu.

Brána: kill/reopen neztratí dokončené bloky, není dvojitý bod, dvojitý čas ani souvislá čára přes přerušení.

### E5 — přístroje a základ mapy

1. Přesný vektorový ciferník (SVG/canvas), ne vygenerovaný obrázek ciferníku. Správné převody všech značek a ručičky, číslo a jednotky ze stejného zdroje.
2. Rozsah 0–60, přepínání rozsahu v nastavení, indikace překročení a zneplatnění při ztrátě fixu.
3. Cream/forest/orange styling, velká Pauza/Ukončit/Pokračovat, celkový a čistý čas explicitně rozlišené.
4. MapLibre adaptér, styl a zdroj, geometrie segmentů, aktuální arrow a kruh nejistoty. Jeden GeoJSON line segment pro každý souvislý úsek, ne jeden přes celou historii.
5. Neutrální fallback mapy při síťové chybě a oddělení vykreslování od záznamu.

Brána: bez chybějících údajů vydávaných za nulu, bez blokace ukládání při chybě rendereru či sítě.

### E6 — orientace, vzdálenost výhledu, 2D/3D a slider

1. Vytvořit samostatný camera controller s cílem L, anchor a tvrdým maximem.
2. Kalibrovat přes projekci/unprojekci, validovat horní hranu a rohy. Správně udržet požadovaný výhled po změně pitch a rozměru.
3. Heading filter s kruhovou aritmetikou a zamrznutím při nekvalitní poloze/stání. Zároveň umožnit north-up.
4. Auto výhled ze speed window, hystereze a plynulé přechody. Žádný „zoom pump“ při kolísání rychlosti.
5. 2D/3D, uložený sklon, ořez/maska za limitem. Při nutnosti menšího sklonu jasný stav.
6. Svislý logaritmický slider 50 m až max, label, +/−, AUTO, pointer capture, cancel a accessibility. Ruční přiblížení mění zoomMode, nikoli sledování.
7. Rozlišit pinch, pan, rotate a slider gesture. Zaměření polohy nemění manuální výhled; AUTO nemění sklon.
8. Ukládat poslední nastavení bez změny GPS měření; na jiném poměru stran znovu vypočítat skutečnou kameru.

Brána: zadaný limit je měřitelně dodržen, ruční slider je přesný a nenarušuje mapu; všechny ovladače dosažitelné na telefonu.

### E7 — historie, profil a export

1. Stránkované shrnutí historie, detail ze skutečných bloků bodů, název a přerušení.
2. Výškový profil bez vymyšlených nul a spojování mezer. Označit GPS výšku a nejistotu; gain/loss nezahrnovat bez ověřeného algoritmu.
3. GPX trkseg, UTC čas a volitelná výška; korektní XML escaping. JSON záloha obsahuje formát, verzi, nastavení, body a události. Import JSON není součástí P0, pokud není později objednán.
4. Smazání konkrétní jízdy s potvrzením, aktualizace statistik a indexu. Nesmazat jinou jízdu nebo data jiného modulu.
5. Detail celé trasy má vlastní camera režim; při návratu do živé mapy obnovit živý výhled a follow.

Brána: export se načte standardním XML parserem a neztratí segmenty; historie je po novém otevření konzistentní.

### E8 — ergonomie a fyzické ověření

1. Viewporty 360 × 640, 390 × 844, 844 × 390 a tablet. Zkontrolovat mapu se sliderem, nastavení i rozbalenou klávesnici.
2. Kontrast, čtečka, klávesnice, redukované animace. Vizuální stav GPS, pauzy a ukládání se nespoléhá na barvu.
3. Wake lock: dostupný/nedostupný, ztráta při skrytí, opětovné spuštění; žádná nekonečná smyčka žádostí.
4. Reálná krátká jízda: klid, rozjezd, zatáčky, semafor, pomalé stoupání, ruční pauza a přenesení kola, GPS výpadek, zamčení telefonu a návrat.
5. Dlouhá simulace 4 h/15 000 bodů, zatížení mapy a historie. Změřit paměť a spotřebu alespoň porovnáním přístroje/mapa; neuvádět neověřenou výdrž.
6. Sladit filtry a prahy podle výsledků, zdokumentovat výchozí hodnoty i zbývající omezení.

Brána: technické testy mohou být automatické, ale fyzické GPS, slunce, uchycení a ovládání v rukavicích musí ověřit uživatel na telefonu. Pokud takové ověření není dostupné, vydání označit jako beta a konkrétní části jako neověřené, nikoli jako kompletně otestované.

### E9 — balení a publikování

1. Navýšit jádro jen při jeho skutečné změně, vygenerovat release a worker. Zachovat starší balíčky a explicitní aktivaci jádra.
2. Vygenerovat neměnný balíček CYKLO s manifestem, součty, závislostmi a minCoreVersion; katalog doplnit pouze generátorem.
3. Do CI přidat nové engine/storage/camera/UI testy a spustit stávající úplné kontroly.
4. Aktualizovat README: jde už o kolekci her i nástrojů; původní tvrzení, že se souřadnice nikde neukládají, musí být vymezené na staré moduly a opravené pro CYKLO.
5. Publikovat až po autorizaci implementace a zveřejnění podle aktuální konverzace. Potvrzení návrhu/specifikace samo není instalací nové placené služby ani sdílením polohy.
6. Na veřejné aplikaci stáhnout jádro i CYKLO, ověřit součty skutečně doručených souborů, ready stav, oprávnění na pokyn, základní funkce a offline otevření.
7. Zaznamenat verze, commit, výsledek CI, funkce ověřené simulací/prohlížečem/telefonem a známá omezení.

## 4. Akceptační matice

| Test | Vstup / situace | Očekávání | Požadavky |
|---|---|---|---|
| A01 | Instalace, první otevření | Ready, žádný GPS dialog, žádné časování | MOD-01, RIDE-01 |
| A02 | Zamítnutí a opožděné povolení po odchodu | Srozumitelný stav; žádný zbylý watch | GPS-01, LIFE-01 |
| A03 | 20 min pohybu, 5 min ruční pauzy, 10 min pohybu | Celkem 35 min, čistě 30 min; pauza nový segment | RIDE-03–06 |
| A04 | Potvrzené stání 60 s | Čistý čas nepřibývá, automatický rozjezd funguje | RIDE-04–05 |
| A05 | GPS chybí 30 s a poloha se pak liší | Neznámý interval, nový segment, žádný falešný úsek | GPS-02 |
| A06 | speed=0 / speed=null / neplatné pole | Nula není null; odhad jen z dostatečných podkladů | RIDE-02 |
| A07 | Duplicita a zpětný čas | Bez dvojitého bodu/času nebo záporné statistiky | GPS-01, DATA-01 |
| A08 | Jediný GPS skok | Nevznikne falešná vzdálenost ani maximum | GPS-01 |
| A09 | altitude=null / 0 / šum | — / skutečná nula / filtrované zobrazení, bez falešného součtu stoupání | ALT-01–02 |
| A10 | bearing 359°→1° | Otočení krátkou cestou; při stání drží směr | MAP-02 |
| A11 | 0°/45°/60°, 50/150/500/1 000 m | Správný výhled s odchylkou do 5 %, žádný obsah dopředu za tvrdým maximem | MAP-04–08 |
| A12 | Slider nahoru/dolů, ±, pointercancel | Správný směr, rozumná citlivost a zakončení drag; žádný pan mapy | MAP-09–10 |
| A13 | Ruční zoom, pak AUTO | Follow se nezruší; AUTO obnoví výpočet v mezích | MAP-08–11 |
| A14 | Pan mapy, pak zaměření | Volné prohlížení, návrat polohy bez změny ručního výhledu | MAP-12 |
| A15 | Vypnutí sítě | Měření/uložení běží při dostupné GPS; podklad jasně označí nedostupnost | MOD-02 |
| A16 | Kill a nové otevření | Poslední potvrzené body zachovány; nabídka pokračovat, čas mezery správně klasifikován | DATA-01–02 |
| A17 | Odebrání bez dat, opětovná instalace | Historie i nastavení existují | DATA-05 |
| A18 | Odebrání včetně dat bez spuštění modulu | Zmizí i body, indexy a snapshoty; ostatní moduly zachovány | DATA-05 |
| A19 | Aktualizace, snapshot, obnova/vrácení | Konzistentní velká data a kompatibilita, bez tiché ztráty | DATA-05 |
| A20 | Export trasy s pauzou a mezerou | Validní GPX s trkseg, UTC a bez vymyšlených výšek | DATA-04 |
| A21 | Dvě okna, kvóta, ztráta zámku | Jeden zapisovatel, zřetelná chyba, žádné tiché mazání | DATA-01, LIFE-01 |
| A22 | Pozadí/zamčení, STOP, návrat | Přerušení, uvolněné prostředky, ruční pokračování | LIFE-01–02 |
| A23 | WebGL context lost a selhání mapy | Záznam nezávisle pokračuje, stav mapy viditelný | GPS-01, MAP-01 |
| A24 | 360 × 640, landscape, čtečka | Akce dostupné, slider nepřekrývá šipku/atribuci, čitelné jednotky | UI-01–03 |
| A25 | Celá historie vs živá mapa | Historie ukáže celý výlet; živá mapa obnoví omezený výhled | DATA-03, MAP-07 |
| A26 | Nové jádro se starými hrami | Instalace, spuštění, Zpět, snapshot a rollback beze změny | MOD-01, DATA-05 |

A11 je numerický geometrický test i vizuální test; samotný screenshot neměří skutečné metry. A03 ověřuje výpočet, nikoli přesnost fyzického GPS zařízení. Testy nevyžadují přesnost satelitní polohy na centimetry.

## 5. Navržená testovací struktura

- `tests/module-data.test.mjs`: velká data, zámky, quota, snapshot/restore/erase a kompatibilita starých dat.
- `tests/cyklo-engine.test.cjs`: časy, stavy, pauzy, GPS validace, statistiky a segmentace.
- `tests/cyklo-camera.test.*`: heading wrap, kalibrace L, geometrické maximum, zachování výhledu při změně pitch/viewport.
- `tests/cyklo-ui.test.*`: start na pokyn, permission race, slider pointercancel, oddělení follow/zoom, background cleanup.
- `tests/cyklo-export.test.*`: GPX/XML, JSON, segmenty, null výška a datum.
- Prohlížečové integrační scénáře: skutečný iframe, renderer, storage a offline worker, nikoli pouze DOM mock.
- Fyzický protokol telefonu: samostatný stručný záznam kroků E8, zařízení/prohlížeč/verze a zjištěná omezení.

## 6. Milníky pro review

1. M1: ověřená architektura, datové rozšíření jádra a instalační kostra.
2. M2: spolehlivý záznam a obnova bez mapové závislosti.
3. M3: kompletní UI, kamera, posuvník a historie.
4. M4: integrace, beta na telefonu a následně ověřené vydání.

Review milníku je kontrolní bod práce, nikoli automatické přerušení a žádost o potvrzení. Pokud uživatel následně autorizuje celý plán, lze pokračovat etapami bez jeho průběžných zásahů, dokud nevznikne zásadní otevřená otázka.

## 7. Orientační pracnost a nejistota

Níže jsou hrubé rozsahy soustředěné vývojové práce jednoho vývojáře, nikoli kalendářní slib, cena ani odhad kreditů. Zahrnují implementaci a odpovídající testy, ne čekání na uživatelovu testovací jízdu. AI asistence může práci urychlit, ale nemění technické závislosti.

| Celek | Odhad | Nejistota |
|---|---|---|
| E0 ověření | 1–2 dny | Zdroj map, kamera a prohlížeč |
| E1 data a kompatibilita jádra | 2–4 dny | Snapshoty velkých dat a návrat verzí |
| E2–E4 modul a záznam | 3–5 dnů | Filtry, pauzy, recovery |
| E5–E6 UI a mapa | 3–5 dnů | Geometrie tvrdého výhledu a ergonomie |
| E7 historie/export | 1–2 dny | Velká data a profil |
| E8–E9 integrace a vydání | 2–3 dny | Fyzické výsledky a regrese |
| Celkem | 12–21 pracovních dnů | Upřesnit po E0; nelze spolehlivě převést na počet AI běhů |

Největší rizika: požadavek na pozadí mimo možnosti PWA; neúplné datové mazání/obnova; omezená licence map; kamera překračující výhled při sklonu; GPS drift zaměněný za pohyb. Každé riziko má příslušnou ověřovací bránu, nikoli skryté odložení na závěr.

## 8. Definition of Done

Všechny P0 jsou implementované a testované. P1 je buď dokončené, nebo výslovně vyjmenované jako odložené — nelze tvrdit splnění celého plánu a současně je tiše vynechat. Nikde není předstírané plánování trasy ani terénní navigace. CI a regresní kontroly projdou; publikované soubory mají správné součty; uživatel dostane jasný postup instalace a první jízdy. Ověření na fyzickém telefonu a případné nedokončené části jsou odlišené od simulovaných testů. Dokumentace uvádí zdroj map, licenci, verze a omezení PWA.
