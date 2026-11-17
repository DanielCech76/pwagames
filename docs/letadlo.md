# Letadlo 1.0.0 — první ověřovací verze

Nový samostatný modul stávající kolekce, bez změny jádra a bez automatického stažení. V Moduly obnov katalog a nainstaluj Letadlo (přibližně 1,25 MB). Kód, knihovna Three.js, reliéf a povrchová mapa jsou kompletní součástí neměnného offline balíčku.

## Funguje

- Výběr osmi letišť, prohození trasy, místní nastavení; spuštění pouze explicitním tlačítkem.
- Simulace přímé velké kružnice, profil stoupání/klesání, posuvník času, pauza a 1×/10×/60×/300×. Simulace začíná v 58 % trasy pro rychlé prohlédnutí Alp; čas lze vrátit na začátek.
- 2D mapa, perspektivní pohled za modelem letadla, prostorové okénko se čtyřmi vrstvami rámu.
- Skutečný kulový terén v lokálních ENU souřadnicích; žádné náhodně vymyšlené hory. Geograficky umístěná NASA textura.
- Tažení rozhlíží v rozsahu ±72° a −85° až +40°. Blíž ke sklu posune rám od 58 cm k 14 cm před hlavou; skutečné vrstvy rámu výhled omezují. Zoom 1–8× mění pouze zorný úhel krajiny, nikoli polohu hlavy nebo velikost rámu. Volitelný pohled bez kabiny, reset a fullscreen.
- 37 vybraných míst s typem, vzdáleností, směrem a souřadnicemi. Popisky procházejí kontrolou zorného pole, zaokrouhleného otvoru, kolizí popisků a orientační viditelnosti přes terén a zakřivení Země. Seznam zahrnuje také zakryté objekty, jasně označené.
- GPS pouze po explicitním spuštění, rychlost vůči zemi, kurz pohybu, nekorigovaná GPS výška. Nepřítomné hodnoty se zobrazují jako nedostupné. Bez výšky nebo kurzu se vypne prostorový výhled; mapa zůstává. Chyba a stáří fixu se zobrazují, bez odhadu pohybu při ztrátě GPS.
- Pauza/odchod/skrytí zastaví GPS; pokračování pouze na pokyn. Žádné lokace se neodesílají ani neukládají do historie. Návrat přes hostitele a dialogy přes standardní bridge.

## Omezení dat

Vestavěný region z6 x33–35 y21–23 pokrývá 5,625–22,5° E a 40,98–52,48° N. DEM je převzorkován na 385×385 bodů, přibližně 3–4 km mezi vzorky. Nejde o detailní horský model. NASA Blue Marble je orientační kompozit, nikoli detailní ortofoto: zoom neukáže ulice/budovy. Mimo region 3D výhled zůstává prázdný s upozorněním. Seznam míst není úplná databáze obcí a objektů.

Vlastní regionální stahování podle letu, globální letiště, detailní letecké snímky, gyroskopické rozhlížení, záznam/replay skutečného letu, odhad při ztrátě GPS a konkrétní typy kabin jsou další práce. Aktuální počasí a náklon skutečného letadla nejsou dostupné.

## Data a reprodukce

`scripts/build-flight-data.py` (Python + Pillow, síť) pořídí devět Terrarium dlaždic z Mapzen AWS Open Data a devět NASA GIBS BlueMarble_ShadedRelief_Bathymetry dlaždic. Kontroluje dekódování, vytváří malý DEM a JPEG; běžné sestavení síť ani Pillow nepotřebuje. Data pořízena 2026-11-17. Mapzen attribution je přibalená v `data/terrain-attribution.md`; NASA credit a licence Three.js jsou v modulu. Kurátorované souřadnice míst jsou orientační.

## Ověření

Automatický test `tests/letadlo.test.cjs`: délka/směr trasy, geodetická interpolace, Mercator roundtrip, lokální ENU, rozměry a skutečné vzorky DEM, chybějící pokrytí, kulové zakrytí a fyzická clona rámu. Build kontroluje integritu celého instalovatelného balíčku.

Prohlížeč v pracovním prostředí nepodporuje WebGL (`Error creating WebGL context`): ověřená mapa, načtení dat, simulace a seznam míst, fallback do mapy. 3D renderer a dotykové rozhlížení nejsou v tomto prohlížeči vizuálně ověřené. Nezaměňovat matematické testy za vizuální potvrzení. Android, skutečný GNSS příjem v kabině, portrait/landscape ergonomie, příkon a výkon vyžadují ověření na zařízení.

Na telefonu: nainstalovat modul → simulace → pauza → Okénko → obě strany → tažení/zoom/poloha hlavy → kabina vypnout/zapnout → Letadlo/Mapa → otočit telefon → dialog a systémové Zpět → režim letadlo → znovu spustit stažený modul. Živou GPS zkoušet u okna, po skrytí ověřit zastavení. Bez kurzu při stání používat mapu nebo simulaci.
