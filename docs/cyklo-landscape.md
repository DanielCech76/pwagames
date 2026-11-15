# CYKLO 1.9.0 — volitelné režimy krajiny

Nastavení → Mapa → Zobrazení krajiny. Obě edice mají shodné volby:

| Režim | Podklad | Vegetace |
| --- | --- | --- |
| Mapa (výchozí) | Dosavadní OpenFreeMap nebo zvolený Mapy.com | Bez stromů |
| Realistická | Letecké Mapy.com + názvy + existující výškový terén | Bez 3D stromů |
| Krajina 3D | Stejný letecký podklad a reliéf | Přibližné stylizované stromy v lesních plochách |

Výběr krajiny zapne 3D a terén a vypne úsporný režim. Nadále lze samostatně vypnout reliéf, zvolit 2D či úsporný režim. Stromy se ve 2D a úsporném režimu nenačítají. Poloměr vegetace 200/350/500 m, hustota řídká/běžná/hustá (nejvýše 220/500/800 stromů). Volby se ukládají do existujícího úložiště nastavení; trasy a záznamy se nemigrují ani nemažou. Přepnutí neaktivuje GPS.

Letecký podklad vyžaduje vlastní klíč Mapy.com se službou Map tiles. Edice Open dovoluje klíč zadat přímo u krajiny; používá stejný uložený klíč jako ostatní služby Mapy.com. Klíč se nepřidává do balíčku nebo diagnostiky. Bez klíče Open zůstává na běžném podkladu s vysvětlením; edice Mapy.com používá dosavadní stav vyžadující klíč. Registraci do katalogu Mapy.com tato změna neprovádí. Podklady a služby mají své dosavadní podmínky a spotřebu požadavků.

## Realita a limity

Nejde o fotogrammetrii ani přesné polohy jednotlivých stromů. Stromy vznikají deterministicky nad lesními polygony OpenFreeMap/OpenStreetMap; vynechávají dostupné vodní a stavební polygony a 9m pás kolem dostupných cest a plánované trasy. Úplnost závisí na mapových datech. Modely jsou jednoduché jehličnany, nikoli realistické koruny z původního ilustračního návrhu. Zobrazují se od zoomu 12 v okolí středu mapy. Výšky se odebírají z již používaného DEM Mapterhorn; při zapnutém reliéfu stromy čekají na výškové dlaždice, aby nevisely ve vzduchu.

## Technické provedení

`landscape.js` používá WebGL2 custom layer ve vendored MapLibre 5.15.0. Jedna dávka geometrie, 60 vrcholů na strom, nejvýše 800 stromů. Výběr nejbližších stabilních buněk, omezené vstupy geometrie a obnova nejvýše jednou za sekundu po pohybu nebo načtení zdrojů. Statická mapa se nepřegenerovává. Lokální metrické souřadnice brání chybám přesnosti globálního Float32. Matice se čte z `defaultProjectionData.projectionMatrix` této konkrétní verze MapLibre. Geometrie respektuje už aplikované zvýraznění reliéfu. Vrstva obnovuje GL stav a uvolňuje buffer, VAO, shadery a program. Chyba vegetace nevypne navigaci ani podklad; samostatné tlačítko obnovy. Atribuce podkladů zůstává dostupná.

## Ověření

Automatické testy: deterministické a omezené lesy, polygonové díry, voda/budovy/cesty/trasa, výška včetně nuly a nedostupných výšek, lokální matice MapLibre 5, GL stav a uvolnění prostředků, statická cache, 2D/úspora, izolované chyby a obnova. UI testy kontrolují uložení voleb a žádné automatické GPS; mapové testy výběr letecké a popisové vrstvy, zachování původního podkladu a chybějící klíč.

Prohlížeč: přepnutí všech tří voleb, stav chybějícího klíče, mobilní 390 px a 320 px (bez vodorovného přetečení). Screenshot `screenshots/cyklo190-settings.jpg` je skutečné nastavení bez klíče. Cloudový prohlížeč nemá funkční WebGL, takže obrazové ověření terénu a vegetace na skutečném GPU a výkon na Androidu zůstávají k ověření. Mock GL test není náhradou za tuto kontrolu. Žádný skutečný API klíč ani skutečná poloha nebyly pro testování použity.


# CYKLO 1.10.0 — pestřejší a hustší vegetace

Nastavení → Mapa obsahuje hustotu 25–200 %, typ Automaticky/Listnatý/Smíšený/Jehličnatý, velikost 50–150 %, podrost Vypnutý/Jemný/Výrazný, povrchy Původní/Jemné/Ilustrační a kvalitu Automatická/Úsporná/Vysoká. Výchozí hustota 100 %, automatický typ, přirozená velikost, jemný podrost a jemné textury. Staré volby sparse/normal/dense se převedou na 50/100/150 %. Nastavení ani přepnutí nestartují GPS a nemění uložené trasy.

## Podoba a klasifikace

Listnaté modely mají nepravidelnou uzavřenou oblou korunu, jehličnaté více pater a nízké porosty široké nízké koruny. Smíšený režim kombinuje oba typy deterministicky. Automatika čte dostupné vlastnosti leaf_type nebo starší wood. Současné dlaždice OpenMapTiles zpravidla tyto vlastnosti neobsahují: v takovém případě jde o regionální ilustrační odhad, nikoli změřené složení lesa. V oblasti 5–25° E / 45–55° N zohledňuje dostupnou absolutní výšku terénu; bez výšky nebo mimo oblast použije smíšený odhad. Výškový odhad plynule zmenšuje vysokohorské stromy a nad 1450 m může použít nízké porosty. Jde o zjednodušení pro střední Evropu, není to přesná hranice lesa v každém pohoří. Ruční volba a explicitní mapový typ mají přednost. Výška terénu použitá pro klasifikaci je očištěná o vizuální násobek zvýraznění reliéfu; geometrie zůstává na vykresleném terénu.

Podrost doplňuje malé nízké koruny u vnitřního okraje lesního polygonu. Nevytváří automaticky pás kolem celého lesa. Samostatně mapované scrub/shrubbery/heath mohou také dostat nízké modely. Cesty, plánovaná trasa, voda, budovy a díry polygonů jsou nadále vyloučené.

Povrchy jsou původní procedurální bezešvé 64px obrazce: tráva, křoviny, les a řádky pole. Filtry respektují landcover class/subclass a neaplikují pole na sady nebo vinice. Vrstva je před trasou a symboly. Jemná varianta má nízkou neprůhlednost, ilustrační výraznější. Režim Realistická nechává samotný letecký podklad; 2D může používat textury, úsporný režim je vypíná. Pole nereprezentují aktuální plodinu ani skutečný směr orby. Nejsou staženy žádné externí textury.

## Výkon a životní cyklus

Stabilní 8m mřížka s pravděpodobnostním výběrem podle hustoty a výkonovým stropem 1000/3000/6000 prvků. Nejbližší prvky mají prioritu; při dosažení stropu není garantováno zaplnění celého nastaveného okruhu. Vzdálenost nad 220 m a úsporná kvalita zjednodušují koruny. Automatická kvalita znamená konzervativní limit s řízením detailu podle vzdálenosti, nikoli průběžný adaptivní FPS regulátor. Jedna vykreslovací dávka zůstává zachována.

Geometrie vzniká v přibaleném landscape-worker.js. Přenos Float32 bufferu nepoužívá kopírování. ID výpočtu chrání před opožděným výsledkem; původ a nová geometrie se mění současně. Při výpadku workeru je k dispozici lokální výpočet. Worker se při odstranění vegetace či zničení mapy ukončí. Statická mapa se nepřegenerovává. Změna plánované trasy zneplatní cache ochranného pásu.

## Ověření a rozsah této etapy

Všechny automatické regrese včetně nových testů typů korun, hustoty, výškového odhadu, priority mapových údajů, omezení regionu, textur, LOD a workeru prošly. Mobilní 320 px i 390 px: posuvník na 200 %, smíšený les a ilustrační povrchy; bez vodorovného přetečení. Skutečný snímek nastavení je screenshots/cyklo110-settings.jpg. Cloudový prohlížeč nemá WebGL, obrazové posouzení nových modelů a výkon na Androidu proto zůstávají k ověření na zařízení.

Tato verze dokončuje první etapu návrhu. Živé klasifikační dlaždice Copernicus, ESA WorldCover a výšky korun ETH nejsou připojeny a aplikace je neprezentuje jako zdroj svých odhadů. Jejich příprava, hosting, aktualizace a datová atribuce tvoří samostatnou druhou etapu. Nevznikla nová placená služba ani registrace do katalogu Mapy.com.
