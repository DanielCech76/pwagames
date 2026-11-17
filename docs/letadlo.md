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


## 1.2.0 — route-specific offline packs
The module contains no terrain or imagery data. Choosing airports only checks local availability. Download data explicitly or start a flight to download the selected route. 28 unordered airport pairs use separately cropped terrain and imagery, including a viewing margin within the original source coverage. Data are hosted under flight-data/v1 and cached independently of module versions. Downloads have integrity checks, progress, a 60-second deadline, cancellation and retry of missing files. Incomplete packs never receive the ready marker. Deletion affects only the selected route.

This release retains the original coarse Blue Marble imagery; the uncommitted 1.1.0 detail work was not available in the repository. It does not claim street or building detail. Old 1.0.0 packages remain immutable for rollback. Generate route data manually with scripts/build-route-data.py (Pillow); normal builds only copy the already generated data.


## 1.3.0 — detailed vector landscape and recorded flights

- Real Protomaps v4 vector geometry (OpenStreetMap and Natural Earth) is drawn in a worker to terrain textures. Water, woodland, farmland, settlement land use, roads and 2D building footprints use source features. Lower source zooms merge building footprints; source omissions remain omissions.
- Defaults: full detail to 30 km, simplified map to 200 km, original Blue Marble beyond. Slant range from the camera and projected tile size determine selection. GPU fragment coverage masks replace the original terrain below available detail, including a short dithered transition. Unavailable data leave the original layer visible.
- Vector detail levels 11/12/13, contour spacing 50/100/200 m, layer toggles, memory profiles and adaptive near range are configurable. Full detail uses Terrarium elevation at z10 (approximately 100 m source spacing in central Europe); a 33x33 mesh samples it per detailed tile. Middle detail uses z8 elevation. Contours are generated from those same heights, not copied from the coarse baseline.
- The user requests an offline corridor after selecting airports or importing a flight. Byte-range extraction reads only selected tiles from https://data.source.coop/protomaps/openstreetmap/v4.pmtiles. No planet archive or map images are bundled with the module. This is a user-triggered spatial extraction, not indefinite online map hotlinking. The dated source currently reports Last-Modified 2026-03-31; features can be older than the app release. Elevation comes from https://s3.amazonaws.com/elevation-tiles-prod/terrarium/. Credits remain visible.
- Downloads use three jobs, 20-second request timeouts, a 30-minute operation limit, a 100/300/600 MB budget, bounded streaming reads, explicit cancellation and reusable partial tiles. A completion marker is written only after every vector/DEM tile is present. The coarse fallback pack is prepared as part of the detail download so offline startup does not depend on a new network fetch. Changing the footprint or source zoom requires a new completeness check. Rendering never starts network requests.
- Runtime texture profiles cap resident tile records at 40/72/96 with 256/512/768 pixel near textures; middle textures are 256 pixels. Tiles outside the frustum are skipped, texture creation is asynchronous, old resources are disposed, and a worker DEM LRU is capped at 16 decoded images. Screen space removes subpixel tiles. Low FPS can reduce near distance by 30%. These are bounds, not a promised frame rate on every phone.
- Recorded flight import supports GPX, GeoJSON LineString/MultiLineString, and readsb ADS-B JSON/JSON.gz. GPX elevation is meters; ADS-B feet are converted to km and geometric height is preferred. Time-based replay uses recorded timestamps, speed is derived per segment, and long/stale gaps are explicitly labelled as interpolated. Missing altitude is explicitly labelled as a simulated 10,600 m. Daily readsb traces split into selectable legs; the longest is initially selected. The selected trace is cached across module versions. GPX/GeoJSON imports are not automatically asserted to be verified real flights.
- Automatic historical flight search by flight number is not included. A downloaded trace can be imported from adsb.lol (https://www.adsb.lol/docs/open-data/historical); its data are ODbL. No fabricated airline route is labelled as real.

Validation: all Node regression suites and build/package checks; real byte-range fetch and vector decode; browser download of 77-item and 152-item Innsbruck–Salzburg test packs (10 MB and 13 MB), cancellation and resumed completion, cache restoration, actual readsb archive import (aircraft 3c66b0, 2026-11-16; 2,949 points split into four legs), and 2D rendering. The cloud browser disables WebGL. All three production Lambert material variants additionally passed actual GLES3 compile/link with scripts/check-flight-gpu.py. Full 3D appearance and Android performance still require device verification.

Manual vendor rebuild (no map data downloaded): node node_modules/esbuild/bin/esbuild scripts/flight/vendor-entry.js --bundle --format=esm --minify --outfile=module-src/letadlo/vendor/maps.js


## 1.3.1 — smooth labels and explicit simulation playback
Place selection and terrain occlusion refresh separately from per-frame projection. Label buttons are reused and move using fractional CSS translate3d coordinates on every rendered frame, including looking around while paused. Map redraws follow frame changes without the old 80 ms throttle. Simulations open paused at the existing preview position; only Play starts their timeline. Playback uses vendored Bootstrap Icons 1.13.1 play-fill/pause-fill SVGs (MIT), with accessible names and no visible button text or external font request. Live GPS retains explicit activation. Regression checks cover frozen startup time, play/pause, changing projections with stable nodes, immediate offscreen hiding and cached expensive occlusion.


## 1.4.0 — full-map variant A
A full-map toggle preserves the selected 2D/3D/window view, zoom, playback and route position. The map fills the app viewport; a translucent telemetry ribbon includes play/pause, a corner control restores normal layout, vertical +/- zoom sits on the right, and route distance/progress is overlaid at the bottom. Large toolbars, title, help and diagnostic overlays are hidden; attribution remains. GPS keeps relevant position warnings and hides the simulation timeline. A nonvisual session dialog participates in the existing host back protocol, and Escape/corner/back restore normal layout. Controls are shared rather than duplicated.

Playback SVGs now toggle the actual hidden attribute: assigning SVGElement.hidden in the previous release did not affect the rendered icons. Runtime browser checks verified that running shows only pause, and paused shows only play. The route slider is expressed as travelled distance, with correct timestamp conversion for recorded flights.

Validation: functional immersive state/back/Escape/zoom tests; regression coverage rejects SVG hidden-property writes; distance/time round trips for recorded flights; browser verification at desktop and a 390x844 iframe viewport, including zoom, play/pause and restoring normal layout. WebGL remains unavailable in the cloud browser; 2D was used for layout verification.
