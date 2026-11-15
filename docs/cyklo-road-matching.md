# CYKLO 1.12.0 — přichycení polohy

Přichycení šipky je zapnuté ve výchozím stavu. Nastavení jízdy umožňuje vypnutí a toleranci 5–60 m (výchozí 25 m). Mění pouze zobrazení polohy a sledování kamery. Záznam, statistiky a detekce odchylky/přepočet stále dostávají původní GPS.

Při aktivní navigaci se používá souvislá linie aktivní trasy, jinak načtené vektorové cesty OpenFreeMap, také nad rastrovým podkladem Mapy.com. Bez navigace jsou data dostupná při zoomu alespoň 12 v načteném výřezu. Bez dat, při staré/slabé GPS nebo mimo toleranci se zobrazí skutečná GPS poloha. Simulace a historie se nepřichytávají.

Výběr kombinuje vzdálenost a směr (odchylka nejvýše 55°); směr GPS se používá od 1 m/s, jinak lze odhadnout směr z pohybu. Cesty jsou obousměrné pro účely zobrazení, nejde o kontrolu dopravních předpisů. Předchozí úsek má přednost. Přechod na jinou cestu vyžaduje společný vrchol a lokální dosažitelnost. Různé vrstvy/most/tunel se propojují jen přes společné konce linií. Samotné geometrické překřížení není spojení. U aktivní trasy je omezen skok vzdálenosti podél linie. Po 8 s bez kompatibilního kandidáta se zámek uvolní; během nejistoty je zobrazena GPS, nikoli odhadovaná poloha na mostě.

Omezení: vektorové dlaždice jsou zjednodušená geometrie, nikoli úplný routovací graf. Identita cest je lokální podle geometrie, rozdělení dlaždic a chybějící vrcholy mohou přichycení dočasně uvolnit. Bez předchozí polohy nelze spolehlivě určit patro překryvných komunikací stejného směru. GPS výška se nepoužívá k určení patra. Algoritmus neposkytuje absolutní garanci správné komunikace při chybějících datech.

Ověření: `node tests/cyklo-road-match.test.cjs` zahrnuje směr, toleranci, skutečnou odbočku, mimoúrovňové křížení, samokřížení trasy, starou/slabou GPS, odjezd na jinou cestu a zachování původní polohy. Test je součástí Pages CI.


## 1.13.0 — společná stopa a poloha

Nový záznam přidává ke každému původnímu bodu volitelné `match` (verze, upravená poloha, směr, posun, geometrie příjezdu, zdroj). Souřadnice GPS, čas, přesnost, výška a výpočty RideEngine se nemění. Při potvrzení předchozích bodů se ukládají znovu pod stejným sekvenčním klíčem, i když už prošly checkpointem. Stávající historie bez `match` se dál vykresluje jako GPS; automatická rekonstrukce starších jízd není součástí této verze.

TrackMatcher drží nejvýše šest alternativ cest a okno pěti měření. Hodnotí odchylku od GPS vzhledem k přesnosti, směr, dosažitelnost po cestní geometrii a rozdíl mezi změřenou a rekonstruovanou vzdáleností. Potvrzení vyžaduje alespoň dvě měření, použitelný směr a rozlišení od prostorově odlišné alternativy. Posledních pět bodů lze zpětně opravit; nejednoznačné souběžné cesty zůstávají GPS. Nepropojené křížení nelze použít pro přechod; po osmi sekundách bez návaznosti lze nově určit cestu. Pauzy, změna segmentu, obrácený čas a mezera nad 15 sekund resetují kontinuitu. Uložena je geometrie skutečného navazujícího úseku včetně zatáček, nikoli jen přichycené koncové body.

Pro záznam se používají cesty OpenFreeMap v načtených dlaždicích, nikoli linie plánované trasy. Tím se záznam nevynucuje na plán při skutečném odbočení a neukládá se výstup Mapy.com routing API. Šipka při záznamu i v historii používá totéž potvrzené `match` jako stopa. GPS bez záznamu nadále používá lehký průběžný matcher podle cest. Při nedostupnosti mapových dat se zaznamenává původní GPS.

Nastavení Zobrazení stopy nabízí Podle cest / Původní GPS / Porovnání obou. V porovnání je zelená upravená stopa a oranžová přerušovaná původní GPS; neopravené úseky jsou v obou shodné. Diagnostika ukazuje přesnost, stáří, velikost korekce, 2D/3D a zdroje podkladu/cest. Tlačítka Porovnat ve 2D / Porovnat ve 3D mění pouze pohled a zapínají porovnání; nedělají pevný posun mapy. Cesty i obě stopy jsou line vrstvy ve stejném mapovém vykreslení; rozdíl 2D/3D lze tak ověřit na stejných uložených bodech. Ze screenshotů bez záznamu nelze doložit chybu terénního vykreslení a tato verze ji nepředstírá jako prokázanou ani opravenou.

Běžný GPX stále obsahuje GPS. Nové GPX podle cest zahrnuje potvrzené úseky a původní GPS tam, kde chybí jistota; časy vložených vrcholů jsou interpolované a mezilehlá výška není domýšlená. JSON záloha uchovává obě podoby. Výkonnostní limity: nejvýše 12 kandidátů, 6 stavů, 5 měření, 256 vrcholů na propojení a 250 m mezi přijatými projekcemi.
