# Development evidence · 2026-09-23

## Fire wave visual improvement
- Performance fix: prebuild eight small flame textures and one ground-light texture at startup; reuse them with `drawImage` instead of applying 56 live shadows/gradients each frame. Cache size is fixed and independent of cast count.
- Same-machine headless Chrome at 1280×800, DPR 2: isolated drawing plus forced pixel readback median improved from 274.2 ms to 12.1 ms; full-game requestAnimationFrame median improved from 133.3 ms to 16.7 ms (p95 150 → 83.3 ms). These are local samples, not a cross-device FPS guarantee.
- Replaced the simple Q ellipse with expanding flame tongues, drifting embers and additive ground illumination. Flames are split behind/in front of actors and fade over 0.85 seconds.
- Shared the existing 3.6 world-unit attack radius with rendering. Damage, mana cost and cooldown remain unchanged; lingering visuals cause no extra damage.
- Original fire sheet retrieval was blocked by HTTP 403/site security verification. This release uses project-authored Canvas effects, not imported fire artwork.
- `npm run verify` passed 10 tests, combat harness and static build. Added range and lingering-effect regression coverage.
- Actual Chrome verified actor loading, Q keyboard cast, mana consumption, pause, restart, effect expiry and desktop/narrow rendering with no page errors. Screenshots were inspected locally. Narrow-screen quest panel overlap is a pre-existing limitation.

## Public GitHub Pages release
- Pushed initial commit `9b7fcf8` to `dubu/diablo2` main. Changed the repository from private to public with explicit user approval because the current plan rejected Pages on the private repository.
- Enabled workflow-based Pages. Build and deployment succeeded: https://github.com/dubu/diablo2/actions/runs/35871064855
- Live game: https://dubu.github.io/diablo2/
- All 22 checked deployed HTML, source, catalog and sprite files returned HTTP 200 and matched the local build's SHA-256 hashes.
- CI ran the 9 tests, deterministic combat harness and static build successfully. Browser rendering and interactive controls were not rechecked during deployment.

## Local workspace setup from archive
- Imported `/Users/dubu/Downloads/diablo2.zip` into `/Users/dubu/workspace/diablo2`, preserving the existing `.git` directory and excluding macOS archive metadata.
- Node v22.22.3 and npm 10.9.8 are available; no external package installation is required.
- `npm run verify` passed all 9 tests, the seed 666 combat harness, and the static build.
- Started the development server at http://127.0.0.1:5173/ after sandbox permission approval; all 22 checked page, source, catalog and sprite files returned successful HTTP responses.
- Browser rendering and interactive controls were not rechecked during this setup; no browser automation tool was available.

## Complete
- Empty workspace bootstrapped into a dependency-free Canvas RPG prototype.
- Isometric arena, procedural characters/ruins/torches, depth sorting, resource-orb HUD.
- Movement, enemy pursuit, melee/fire, mana regeneration, potion, XP/level display, gold, boss item, quest, victory/death/restart, pause and inventory.
- Codex instructions, task template and sandboxed CLI runner, deterministic browser API and simulation scenarios.
- Asset provenance catalog and honest placeholder/source availability documentation.

## Verification
- npm run check: all JS syntax checks and 5 behavior tests passed.
- npm run harness: seed 666 passed, 12 kills, 342 gold, boss item, victory/death checks.
- npm run codex:task -- --dry-run: prompt created successfully after template was added.
- No nested live Codex execution was performed. CLI options checked against installed codex exec --help and official documentation.
- npm run dev was blocked by sandbox EPERM. Escalation was requested and rejected by user. Browser rendering and real input have therefore NOT been visually verified.
- Source site direct page and sheet requests returned 403; catalog researched using search index. Original sheets not included.

## Next
1. Run npm run dev and visually inspect desktop/narrow layouts, mouse movement and keyboard combat.
2. Obtain a local source sheet and implement frame metadata/loader/fallback following docs/assets.md.
3. Add obstacle collision and pathfinding before turning decorative columns into solid geometry.

## GitHub Pages increment
- Added relative resource/home URLs, web-only dist build, project-prefix preview server, and GitHub Pages workflow.
- npm run verify passed: 6 tests, seeded combat report, clean build.
- Build test covers account-root, /diablo2/, renamed repository paths and rejects stale/development artifact leakage.
- Local preview server was authorized and started on /diablo2/ using dist output. This supersedes the previous local-server verification blocker.
- In-app browser verification: actual game field/HUD rendered at PC viewport; Q cast reduced mana from 80 to 62; Escape paused; resume and inventory opening worked; idle enemy damage reached death; restart reset life to 100.
- Manual browser checks do not constitute full playthrough or cross-browser testing. Narrow-screen presentation remains limited; supported first release target is PC keyboard/mouse.
- GitHub Actions has not run remotely. No repository/.git or remote URL exists yet; no files pushed or site published.
- Deployment instructions recorded in docs/deployment.md.

## Temporary easy-play balance
- Centralized temporary values in src/engine.js BALANCE: HP 1000, mana 300, 20 potions, 500 HP per potion, 15 mana/second, incoming damage ×0.4.
- HUD and resource caps use player.maxHp/maxMana; new games and restart use boosted defaults.
- npm run verify passed (8 tests), including five minutes surrounded by all enemies while using the starting potion supply and resource-cap checks. This scenario uses potions in the test; actual players must press 1 manually.
- Rebuilt dist and refreshed the current browser preview. DOM confirmed 1000/1000 life, 300/300 mana, both orbs 100%, and 20 potions. Left preview paused for the user to resume.

## Original Diablo II sprite integration
- Downloaded and preserved 5 original TSR sheets through the browser: Barbarian (Heavy), Fallen Shaman, Skeleton with Bow, The Smith, Monastery Floor. This supersedes the previous original-asset blocker.
- Prepared 14 animation atlases plus floor texture, with transparent background keys, frame dimensions, action regions and direction mappings. Source files/credits/hashes are documented.
- Replaced player, all enemy types and floor with actual original artwork. Added player-follow camera/minimum zoom and matching inverse click projection.
- Kept boosted easy-play stats unchanged. Walls/columns, UI and effects remain procedural; ranged enemy behavior is still simplified melee.
- npm run verify passed 9 tests, seeded combat harness and Pages build. Added atlas dimension and direction bounds validation.
- Browser loaded the local atlases, showed original character/enemy/floor sprites at useful scale, and reported no console errors. Preview is refreshed and paused. No live Pages publication performed.

## Readable source refactor
- Expanded all src files with readable formatting; added Korean comments explaining input, spawning, AI, combat, rendering and asset loading.
- engine.js now separates createEnemy, usePotion, dropEnemyLoot, movePlayer and updateEnemy while preserving exported APIs.
- main.js uses named keyboard/pointer handlers, readMovementInput, and individual ground/scenery/loot/actor/effect/vignette render stages. Preserved the existing user formatting edits as the starting point.
- sprites.js separates image loading and per-actor animation loading. style.css now has one declaration per line.
- Compared old/new full engine states for 5 seeds × 2400 frames including movement, attacks, spells and potions: identical.
- npm run verify passed all 9 tests, harness and build. Browser reload, Q cast and Escape pause worked; no captured console errors.
