# CYKLO 1.12.0 — přichycení polohy

Přichycení šipky je zapnuté ve výchozím stavu. Nastavení jízdy umožňuje vypnutí a toleranci 5–60 m (výchozí 25 m). Mění pouze zobrazení polohy a sledování kamery. Záznam, statistiky a detekce odchylky/přepočet stále dostávají původní GPS.

Při aktivní navigaci se používá souvislá linie aktivní trasy, jinak načtené vektorové cesty OpenFreeMap, také nad rastrovým podkladem Mapy.com. Bez navigace jsou data dostupná při zoomu alespoň 12 v načteném výřezu. Bez dat, při staré/slabé GPS nebo mimo toleranci se zobrazí skutečná GPS poloha. Simulace a historie se nepřichytávají.

Výběr kombinuje vzdálenost a směr (odchylka nejvýše 55°); směr GPS se používá od 1 m/s, jinak lze odhadnout směr z pohybu. Cesty jsou obousměrné pro účely zobrazení, nejde o kontrolu dopravních předpisů. Předchozí úsek má přednost. Přechod na jinou cestu vyžaduje společný vrchol a lokální dosažitelnost. Různé vrstvy/most/tunel se propojují jen přes společné konce linií. Samotné geometrické překřížení není spojení. U aktivní trasy je omezen skok vzdálenosti podél linie. Po 8 s bez kompatibilního kandidáta se zámek uvolní; během nejistoty je zobrazena GPS, nikoli odhadovaná poloha na mostě.

Omezení: vektorové dlaždice jsou zjednodušená geometrie, nikoli úplný routovací graf. Identita cest je lokální podle geometrie, rozdělení dlaždic a chybějící vrcholy mohou přichycení dočasně uvolnit. Bez předchozí polohy nelze spolehlivě určit patro překryvných komunikací stejného směru. GPS výška se nepoužívá k určení patra. Algoritmus neposkytuje absolutní garanci správné komunikace při chybějících datech.

Ověření: `node tests/cyklo-road-match.test.cjs` zahrnuje směr, toleranci, skutečnou odbočku, mimoúrovňové křížení, samokřížení trasy, starou/slabou GPS, odjezd na jinou cestu a zachování původní polohy. Test je součástí Pages CI.
