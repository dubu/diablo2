# Integrated Diablo II assets

## Health and mana UI (separate CC0 artwork)

The resource orbs use **Health Orb / Health Orb 1.1 by itsmars**, https://opengameart.org/node/65078, licensed CC0 (https://creativecommons.org/publicdomain/zero/1.0/). These are not original Diablo II assets. The user supplied the 1.1 archive; the base archive was downloaded from the same author page to obtain the liquid/glass layers.

Original archives are preserved in `assets/source/orbs/`, with hashes recorded in `public/assets/catalog.json`. `python3 scripts/prepare-orbs.py` copies the original pedestal, empty bowl, glass, shadow and dark border, and tints the grayscale fill red/blue. Seven output PNG layers live in `public/assets/ui/`. CSS clips the liquid by resource percentage without resizing the image; all layers are preloaded before leaving the loading screen.

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

## Fire wave rendering

The Q wave now uses the user-supplied **Fire (Large)** sheet (TSR asset 78100, uploader sutinoer). The original download is https://www.spriters-resource.com/media/assets/75/78100.png?updated=1755474266 and the preserved source is `assets/source/fire-large.png`; SHA-256 is recorded in the catalog. This supersedes the earlier automated-download blocker.

`python3 scripts/prepare-fire.py` removes exact magenta/teal background colors and extracts three rows of 20 frames each. `fire.json` records the three atlas grids; `src/fire.js` loads them once and reuses them with `drawImage`, without per-frame blur. Embers and ground light remain project-authored. If the fire images fail, cached procedural flames remain available.

Barbarian attack frames use ground anchor Y=108 rather than the cell-bottom default 137, which included empty space below the feet. The extraction script preserves this correction on rebuild.

## Scope
Actual original sprites now render the player, every enemy type and floor. Walk/idle/attack frames are selected from real sheets; skeleton and Fallen also use corpse frames. Barbarian/Smith corpse visuals remain a flattened idle frame fallback. Camera follows the player with a minimum zoom so sprites stay legible in a narrow window.

Walls/columns, fire particles, combat rings and HUD are still procedural. Sprite art does not change the prototype's simplified enemy AI: the bow skeleton and shaman still use the existing close-range combat behavior. This is not a full recreation of Diablo II's animation/combat system.

Original game artwork belongs to its respective rights holders (Blizzard Entertainment). Uploader attribution is recorded, but downloading from the resource site does not grant redistribution rights. The project does not claim an original/open license for these assets; confirm distribution permission before public release with original artwork.
