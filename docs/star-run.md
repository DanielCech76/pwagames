# Star Run 1.0.0

Offline arcade module. Opening the module shows the menu; simulation starts only after an explicit Start or Training action and a three-second countdown.

## Menu
- Start competitive flight.
- Training: slower speed, unlimited lives, excluded from records.
- Settings: touch/tilt control, tilt sensitivity and Y inversion, calibration, three environment palettes, effect quality.
- Local top ten and cumulative completed competitive flight count, time, gates.
- Instructions, calibration shortcut, optional fullscreen, return to modules.

Portrait uses a bottom control bar; landscape uses a right control bar. Controls remain outside the playfield. Rotation pauses play; tilt requires recalibration. Both orientations use the same world coordinates, collision rules, scoring and difficulty.

Touch joystick and tilt both specify target ship position, springing back to center at neutral. Tilt is opt-in, permission requested only on calibration, mapped through screen orientation. Missing/stale samples pause flight. Screen change invalidates neutral. No sensor samples leave the module. WASD/arrows and Space are available on desktop.

Hold shield to spend energy (32/s); regenerate 3/s. Gates add 25 energy and 250 points, centered gates 500. Flight time adds 10 points/s. Three lives, collision cooldown 1.25 seconds. Training never writes records. Abandoned runs are not recorded. Settings and scores use the host's namespaced storage; no server/global leaderboard.

Rendering is a lightweight procedural Canvas perspective scene with stylized faceted rocks and spaceship; the generated concept art is design inspiration, not a runtime screenshot. No external assets or runtime dependencies.

Tests: `node tests/star-run.test.cjs`, `node tests/packages.test.mjs`, `node tests/bridge.test.cjs`, `python scripts/check-build.py`.

Physical sensor feel and permission behavior require testing on the target phone. Browser QA covers menu, training launch, pause, settings, records and portrait/landscape layout.


## Version 1.1.0 — gates, impact effects, levels and weapons

- Closest upcoming gate is green when current ship position lies within the same tolerance used by passage scoring. Other gates stay cyan. Successful passage produces a single bright white/green pulse, visible before the final-level summary.
- Rock contact emits sparks and 0.4 seconds of decaying visual recoil. Steering/collision coordinates are unchanged. Shield contacts also show impact feedback without health damage.
- New-run setting: 3–12 gates per level (default 6), with all gates scheduled to pass from 3 to 27 seconds. Level ends after the final gate passes (whether collected or missed), or after 30 seconds of active play. Pauses and countdown do not consume level time. Level summary waits for explicit Next Level or Save and Menu.
- Next level is 12% faster. Score, lives and energy persist. Training follows the same levels without recording scores. Completed-level exits save a run once; final defeat saves once. Old records remain readable.
- Automatic shooting by default; optional manual hold-PALBA or F. Bullet collisions are swept in world space and hit only the nearest intersecting asteroid. Small (radius ≤ .18), medium (≤ .24), large (> .24) asteroids require 2, 3, 5 hits. Damaged rocks show a health bar and cracks; destruction gives sparks and points.
- Bounded transient effects and projectiles; reduced particle count in low-quality mode.

Checks: `node tests/star-run.test.cjs`, `node tests/star-run-ui.test.cjs`, package/bridge checks and full build validation. The UI test runs the controller and Canvas calls in portrait/landscape DOM fixtures, including simultaneous weapons, pause, level transitions and training data isolation. Live browser visual QA for this release was unavailable because the managed preview service reported an active lock and its returned local URL refused connections. Device sensor feel still requires phone testing.
