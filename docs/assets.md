# Integrated Diablo II assets

Source catalog: https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/
Retrieved 2026-09-23. HTTP clients returned 403, but the browser completed its automatic site verification and loaded the real asset pages. The browser's asset export downloaded the original sheets. No proxy settings were changed.

| In-game use | Original asset | Uploader / contributor | Source |
|---|---|---|---|
| Player | Barbarian (Heavy) | napalm22 | https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/asset/54293/ |
| Fallen enemy | Fallen Shaman | napalm22; sutinoer | https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/asset/54314/ |
| Skeleton enemy | Skeleton with Bow | sutinoer | https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/asset/92815/ |
| Boss | The Smith | sutinoer | https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/asset/62943/ |
| Ground | Monastery Floor | sutinoer (sheet credit) | https://www.spriters-resource.com/pc_computer/diablo2diablo2lordofdestruction/asset/56283/ |

## Files and preparation
- `assets/source/`: unmodified original sheets, including the uploader credit panels. Excluded from dist by the web-only build.
- `public/assets/catalog.json`: source pages, credit, original filenames and SHA-256 hashes.
- `scripts/prepare-sprites.py`: deterministic frame extraction and exact background-color transparency using Pillow. Frame regions were inspected visually; each action has its own origin, dimensions, strides and direction count.
- `public/assets/sprites/`: 14 prepared PNG animation atlases, monastery floor tiles and frame manifest. About 4.7 MB total; committed/generated files are served locally with the game.
- `src/sprites.js`: asynchronous local loader, directional row mapping and animation drawing. No hotlinks or requests to the source website during gameplay.

Rebuild asset atlases, only when source or frame mapping changes:

```sh
python3 scripts/prepare-sprites.py
npm run verify
```

Pillow is only needed for atlas preparation, not for normal Node build/CI or playing the game.

## Scope
Actual original sprites now render the player, every enemy type and floor. Walk/idle/attack frames are selected from real sheets; skeleton and Fallen also use corpse frames. Barbarian/Smith corpse visuals remain a flattened idle frame fallback. Camera follows the player with a minimum zoom so sprites stay legible in a narrow window.

Walls/columns, fire particles, combat rings and HUD are still procedural. Sprite art does not change the prototype's simplified enemy AI: the bow skeleton and shaman still use the existing close-range combat behavior. This is not a full recreation of Diablo II's animation/combat system.

Original game artwork belongs to its respective rights holders (Blizzard Entertainment). Uploader attribution is recorded, but downloading from the resource site does not grant redistribution rights. The project does not claim an original/open license for these assets; confirm distribution permission before public release with original artwork.
