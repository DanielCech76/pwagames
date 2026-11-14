# Pong 2.1.0 — pohybové ovládání

Ovládání hráčovy pálky: dotyk, náklon→rychlost, náklon→poloha, volant, relativní gyroskop a experimentální boční impulzy. Horní hráč ve dvou zůstává dotykový/klávesnicový. Profily Přímá/Vyvážená/Chůze mění filtraci, mrtvou zónu a omezení zrychlení. Citlivost 0,5–2×.

Po výběru pohybového režimu se hra pozastaví. Povolení senzorů se žádá pouze po uživatelské akci. Kalibrace nastaví aktuální polohu jako neutrální a umožní náhled pálky v pauze. Po otočení hřiště/displeje je nutná nová kalibrace. Volant potřebuje dostatečně vzpřímený displej; plochá poloha je odmítnuta. Gyroskop integruje filtrovanou rychlost otáčení do posunu pálky; impulzy používají zrychlení bez gravitace a postupně brzdí.

Při skrytí stránky a ukončení se odpojí měření. Výpadek potřebného vstupu nad 700 ms pozastaví hru a vyžaduje kalibraci. Žádná orientační ani polohová data se neodesílají. Ukládá se profil, citlivost a hodnocení pohodlí podle režimu; při novém otevření je výchozí dotyk, aby se senzory nepovolovaly automaticky. Nová hra a přepnutí režimu nulují statistiky. Statistika obsahuje odrazy, aktivní čas a nejdelší výměnu.

Ověřeno: numerické směry všech režimů, filtry, meze, transformace os, nulová/chybějící data, oddělené časování gyroskopu a akcelerometru; UI životní cyklus, povolení/zamítnutí a zrušení čekajícího povolení, kalibrace, pauza při výpadku, odpojení na pozadí; všechny dosavadní regresní testy a integrita balíčků.

Neověřeno: fyzické senzory a pohodlí při chůzi. Vizuální kontrola v prohlížeči nebyla dokončena — místní Chromium nemůže v tomto prostředí vytvořit potřebný socket. Publikování zastavila automatická kontrola oprávnění pro push do main. Výchozí citlivosti proto považujeme za první nastavení k praktickému odladění.
