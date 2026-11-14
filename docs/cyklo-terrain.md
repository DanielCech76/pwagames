# CYKLO 1.5.0 — terén, stínování a vrstevnice

## Chování
3D budovy jsou vypnuté ve výchozím stavu a nezávislé na sklonu mapy. Přepínač mění pouze fill-extrusion vrstvy budov a při zapnutí obnoví původní viditelnost; ostatní extruze ani půdorysy nemění. U současného rastrového Mapy.com podkladu není samostatná 3D vrstva budov a ovladač je vypnutý.

3D terén je výchozí zapnutý pro 3D režim, zvýraznění 1× s volbou 1,5×/2×. Ve 2D a úsporném režimu se skutečný terén vypne. Stínování je samostatné (výchozí jemné), vrstevnice samostatné (výchozí vypnuté), popisky volitelné. Automatická hustota má rozestupy 100/50/20/10 m podle zoomu; vlastní volba 10/20/50/100 m. Hlavní vrstevnice jsou po pěti intervalech. Vrstevnice a stínování mohou být zapnuté i nad plochou 2D mapou. Přepínač ovládá přidanou vrstvu; vrstevnice napevno obsažené v rastrovém podkladu samostatně odstranit nelze.

## Zdroj a knihovny
- Online zdroj Mapterhorn: https://tiles.mapterhorn.com/{z}/{x}/{y}.webp, Terrarium, 512 px. Používáme konzervativní globální rozsah zoomu 0–12, vyšší zobrazení interpoluje. Rozestup vrstevnic není údaj o přesnosti výškových dat.
- Přístup: https://mapterhorn.com/data-access/; autorství a seznam datových zdrojů: https://mapterhorn.com/attribution/. Odkaz je v mapové atribuci i nastavení.
- maplibre-contour 0.1.1 z oficiálního npm balíčku; SHA-512 archivu ověřeno proti registry integrity, lokální bundle a BSD-3-Clause licence jsou v module-src/cyklo/vendor. https://github.com/onthegomap/maplibre-contour
- MapLibre GL JS zůstává na zabalené verzi 5.15.0. DEM zdroj je oddělený pro mesh a hillshade podle vzoru knihovny. Mapy.com raster style přidává glyph endpoint OpenFreeMap pro samostatné výškové popisky.

## Výkon a výpadky
Vrstevnicový pracovník se vytvoří až při zapnutí vrstevnic, sdílí se v rámci iframe a používá omezenou cache 16 dlaždic. Při změně podkladu se nevytváří další pracovník. Jeho životnost je omezena iframe modulu. Když jsou všechny výškové funkce vypnuté, nevytvářejí se nové DEM zdroje. Při přepnutí se zneviditelní nepoužívané vrstvy a vypne mesh; zavření mapy uvolní renderer.

Chyba výškového zdroje vypne mesh i přidané výškové vrstvy a oznámí problém v Nastavení. Nezakryje jinak funkční základní mapu a neoznačí DEM dlaždici za úspěšně načtený základní podklad. Obnovit terén znovu vytvoří výškové zdroje. Ztráta WebGL zůstává chybou rendereru s dosavadním schematickým fallbackem. Při neplatné projekci terénu kamera nevyhodí výjimku do GPS obsluhy.

GPS výška v přístrojích se nemění na DEM výšku. Trasa a marker se vykreslují v mapovém rendereru nad terénem; výškový profil plánů nadále používá data dané trasy. Žádné offline oblasti DEM se automaticky nestahují. Mapterhorn vidí požadavky na zobrazované oblasti; nevkládá se do nich klíč Mapy.com.

## Ověření
Automatické testy ověřují konfiguraci, oddělení vrstev, přepínače, intervaly, připisování zdrojů, lazy worker, výpadek a obnovu. Cloudový prohlížeč nemá dostupné WebGL a síťový executor vrací na mapové tile endpointy 403; nelze tím prohlásit ověřené skutečné vykreslení reliéfu ani dostupnost dlaždic na telefonu. Je nutná kontrola na podporovaném mobilu: 3D mesh, čitelnost vrstevnic v pohybu, poloha trasy na terénu a výdrž.
