"""Extract the user-supplied TSR Fire (Large) sheet; requires Pillow."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sheet = Image.open(ROOT / 'assets/source/fire-large.png').convert('RGBA')
assert sheet.size == (2381, 416), 'Unexpected source sheet dimensions'
output = ROOT / 'public/assets/sprites'
manifest = []
# Exclude the one-pixel teal grid and labels; keep all 20 frames in each row.
for index, (y, width, height, stride) in enumerate([(17, 46, 76, 47), (110, 69, 101, 70), (228, 118, 187, 119)], 1):
    atlas = Image.new('RGBA', (width * 20, height))
    for frame in range(20):
        tile = sheet.crop((1 + frame * stride, y, 1 + frame * stride + width, y + height))
        tile.putdata([(r, g, b, 0 if (r, g, b) in {(255, 0, 153), (0, 128, 128)} else a)
                      for r, g, b, a in tile.getdata()])
        atlas.paste(tile, (frame * width, 0))
    filename = f'fire-{index}.png'
    atlas.save(output / filename, optimize=True)
    manifest.append(dict(file=filename, width=width, height=height, frames=20))
(output / 'fire.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('Prepared 3 fire atlases, 60 frames')
