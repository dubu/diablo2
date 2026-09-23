"""Prepare itsmars CC0 orb layers. Original archives retained in assets/source/orbs."""
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
from io import BytesIO
ROOT = Path(__file__).resolve().parent.parent
out = ROOT / 'public/assets/ui'
out.mkdir(exist_ok=True)
with ZipFile(ROOT / 'assets/source/orbs/itsmars-orb-base.zip') as base:
    for source, dest in [('itsmars_orb_back1.png','orb-base.png'), ('itsmars_orb_back2.png','orb-empty.png'), ('itsmars_orb_highlight.png','orb-glass.png'), ('itsmars_orb_shadow.png','orb-shadow.png')]:
        (out / dest).write_bytes(base.read(source))
    fill = Image.open(BytesIO(base.read('itsmars_orb_fill.png'))).convert('RGBA')
    for name, color in [('health', (235, 45, 50)), ('mana', (45, 135, 245))]:
        tinted = fill.copy()
        tinted.putdata([(r*color[0]//255, g*color[1]//255, b*color[2]//255, a) for r,g,b,a in fill.getdata()])
        tinted.save(out / f'orb-{name}.png', optimize=True)
with ZipFile(ROOT / 'assets/source/orbs/itsmars-orb-1.1.zip') as update:
    (out / 'orb-border.png').write_bytes(update.read('DarkOrbBorder.png'))
print('Prepared 7 orb layers')
