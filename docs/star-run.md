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
