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
