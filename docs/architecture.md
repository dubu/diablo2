# Architecture

Zero runtime dependencies. Node 22+ serves native ES modules; Canvas 2D draws the world.

- src/engine.js: seeded world, clamped delta time, movement, enemy pursuit, combat, mana, potion, XP, loot, terminal states. Coordinates are world-space.
- src/main.js: isometric projection, original sprite actors/ground with procedural scenery fallback, player-following camera, depth ordering, DOM HUD, keyboard/pointer input, animation loop.
- scripts/server.mjs: loopback-only static server restricted to index.html, src/, public/.
- tests/engine.test.mjs: simulation regression tests.
- scripts/harness.mjs: deterministic combat fixture, reward/victory/death assertions; artifacts/harness-report.json.
- scripts/codex-task.mjs: optional Codex CLI prompt runner and dry-run preparation. Inherits environment unchanged; never stores proxy values.

## Browser harness
Open /?harness=1. Only this query enables window.__game.

```js
window.__game.reset(666); // reset and pause real-time simulation
window.__game.step({dx:1,dy:0},60); // 60 fixed 1/60-second ticks
window.__game.action('fire'); // attack | fire | potion
window.__game.snapshot(); // independent structured clone
```

The CLI harness relocates the player and clears cooldowns as explicit test fixtures. It verifies combat transitions, not human playability or a full navigation replay. Browser validation remains a separate step.

## Current scope
Single fixed arena, one player, 12 enemies including one boss, short repeatable combat loop.
Walls and pillars are decorative; no obstacle collision or pathfinding. Level is an XP indicator, not a stat upgrade. No audio, save, multiplayer, character selection or equipment system.

## GitHub Pages
- scripts/build.mjs: clean static artifact (dist/) with relative entry URLs and .nojekyll.
- tests/build.test.mjs: web-only artifact, stale-file removal, root/project/renamed-project URL resolution, module and catalog checks.
- scripts/server.mjs --dist --base=/diablo2/: serve release artifact under the same project prefix as Pages.
- .github/workflows/pages.yml: read-only PR verification; main-only deployment job with Pages/OIDC permissions.

## Sprite rendering
`src/sprites.js` loads prepared PNG atlases and frame metadata from `public/assets/sprites/`. The runtime selects idle/walk/attack/death frames independently of deterministic combat state. Original source sheets live in `assets/source/`; Pillow preparation is optional offline tooling, not a deployment dependency. Sprite-load failures are visible in the HUD and retain the procedural fallback.
