# CYKLO 1.6.0 — approved A cockpit

The approved A design is the geometry reference. At a 390 CSS pixel viewport the LED cockpit has a 48 px header, centered 62 px digital SVG digits, a 10 px segmented speed strip, a shallow 46 px minimum maneuver strip, a map with 12 px side margins, joined 43×32 px 2D/3D/bearing controls, an 80×34 px Auto/follow button, and a slim zoom rail centered on the right edge. Default zoom buttons are 32×32 px; the rail is 164 px on the standard tall map and contracts to 132 px on short maps. Changing button diameter does not change rail height. The small slider thumb is proportional to button size, 12 px at the default. Plus/minus have enlarged transparent 44 px hit areas. Four metrics overlay the bottom of the map; the four-tab dock is 62 px tall. Map content is provider data, not the photorealistic concept illustration.

LED Pulse and Aero Glass share geometry. Color themes independently set surfaces, borders, text and accents. Navy blue keeps the approved cyan accents; six new palettes are blue, navy, green, brown, orange and red. Existing forest/mist/night preferences remain valid. Speed warning zones retain their semantic colors.

Fresh installation: LED Pulse, Navy blue, 32 px zoom, 80 km/h gauge, auto-hide after 4 s. Existing explicit preferences are preserved. Speed ranges: 40, 60, 80, 100, 150, 200 km/h. Three-digit SVG speed values scale inside the existing instrument area. This does not change the cycling routing profile into a motorcycle routing profile.

## Settings and navigation

Settings visually fill the screen, with their own back header and scrolling compact accordions: Vzhled (palette icon), Mapa (folded-map icon), Funkce (sliders icon). A full-viewport native dialog retains the core's existing dialog-history protocol so Android Back closes settings and restores the previous screen without stopping navigation. Settings are saved immediately; individual inputs keep existing IDs and storage keys. The main map is retained, not re-created on opening settings.

The only ride controls are in the header: primary Start/Pause/Resume, and an overflow menu with Finish. There is no duplicate ride-actions panel under the map. The routine manual-pause banner is hidden; state remains identifiable from the header button. Recovery and error messages remain visible. Navigation alone does not start recording. Starting navigation or a ride selects Jízda; starting simulation retains its existing separate workflow.

Auto-hide suppresses map buttons, rail, statistics and the bottom dock. Speed, navigation strip, GPS and header ride controls stay visible. A touch reveals controls; the first wake gesture does not accidentally pick a route point. Multi-touch pauses the inactivity timer. Only a real open dialog or an explicitly tagged controls menu blocks hiding: unrelated open settings accordions, attribution details and touch focus do not. Keyboard-visible focus is retained for accessibility.

## Manual zoom

Manual minimum: 25/50/100 m. Manual maximum: 2/5/10/20/50 km. Defaults 25 m–20 km. The slider maps distances logarithmically. AUTO keeps its independent min/max forward-distance bounds. Pinch zoom and button zoom use the manual range. Whole-route fits all planned geometry, or the recorded ride if no plan is available, independently of the slider maximum. Recenter/Auto returns to following. Terrain, bearing gestures and original basemap attribution behavior are retained.

## Verification

All 23 regression test files pass. Tests include new theme persistence, 28/32 px geometry, logarithmic expanded zoom, navigation/recording screen transitions, settings close via the host dialog lifecycle, 150/200 ranges, and the original auto-hide focus/details regression.

Browser QA used 390×780 and 320×780 module frames, real controls and local-only synthetic GPS for a stored plan. Confirmed navigation selects Jízda and GPS-following displays 24 km/h without recording (elapsed time stays zero). At 390 px zoom buttons measure 32×32 px and rail 164 px. At 320 px the application has no horizontal overflow. Screenshots are actual app UI using the schematic fallback because the cloud browser has no WebGL. The QA GPS shim and harness are excluded from the release. Actual provider terrain rendering still requires a WebGL device.


## 1.7.0 — icon-only header and persistent recenter

The A/B states now share an SVG icon vocabulary (`icons.js`) for back, play/pause/stop, GPS, bearing/north, plus/minus, route actions and reveal. The header GPS control is a real toggle with `aria-pressed`, accessible state/action labels and tooltip; it has no visible text. Off, searching, valid, weak/lost, denied and simulation states use distinct icon/color states; searching respects reduced motion. Icons are only rebuilt when their shape changes.

GPS toggling controls the application's geolocation watches, not the device-wide GPS setting. Turning it off aborts pending location work, suspends rerouting, clears watch ID 0 correctly and pauses/persists a running ride. Turning it back on starts GPS-only tracking, never implicitly resumes recording. Late callbacks are ignored using generation tokens. GPS remains opt-in; no geolocation starts on load. One-shot recenter can request a fresh fix while continuous tracking is off. A paused navigation panel no longer presents the previous maneuver as a live instruction after GPS is disabled.

Play/pause/resume and stop are directly in the header. An unfinished ride uses the same play and stop controls (recovery play is highlighted); the old recovery card does not occupy map space. Ride and simulation action buttons below the map are suppressed. The previous location panel and follow checkbox are no longer shown. Route creation, editing and whole-route fit share a single route icon menu on the map, with proper menu-aware auto-hide. GPS altitude is shown from a fresh map fix without requiring a ride record. Four metric labels use matching small SVG icons.

Recenter is independent of Auto zoom, stays at top-right with a 34×34 px outline button and 12 px map inset, and remains visible/clickable when `controls-hidden` is active. Auto is immediately to its left. The route action menu and statistics hide in focus mode. Basemap attribution stays accessible.

Browser QA: 390×780 and 320×780 with local-only synthetic GPS. Confirmed GPS off during a ride yields a paused ride and an off icon; header play restores a pending ride; header stop saves it; no large recovery/location card; no header overflow at 320 px. With controls hidden, recenter measures `display:grid`, `visibility:visible`, top inset 12 px and accepts a click. Screenshots show real rendered UI with the schematic map fallback (cloud browser lacks WebGL); crops remove only the surrounding QA desktop. Test fixtures are excluded from published files. All 23 test files pass.
