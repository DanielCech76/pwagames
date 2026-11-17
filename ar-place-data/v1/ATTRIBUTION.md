# GeoNames AR gazetteer

Source: https://www.geonames.org/ — https://download.geonames.org/export/dump/

GeoNames data is licensed under Creative Commons Attribution 4.0:
https://creativecommons.org/licenses/by/4.0/

This snapshot was downloaded on 2026-11-17. Source ZIP hashes and URLs are in index.json.
Changes: selected populated places, peaks/hills/passes, lakes/reservoirs, castles/ruins and named landmarks; removed other feature classes; retained GeoNames IDs and original names, rounded WGS84 coordinates to five decimals, used only explicit elevation when present, assigned display ranks and split into degree cells.

Detailed regional coverage: Czechia, Austria, Slovakia, Germany and Poland. Other countries: major cities from the cities15000 export. Coverage is not exhaustive and coordinate/elevation accuracy varies. No guarantee of timeliness, accuracy or completeness is provided.

Row columns: GeoNames ID, original name, longitude, latitude, type, explicit elevation in metres or null, display rank. Types: 0 city, 1 settlement, 2 peak/terrain landmark, 3 water, 4 castle/ruin, 5 named landmark, 6 populated-place subdivision, 7 pass, 8 ridge.
