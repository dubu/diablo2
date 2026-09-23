"""Extract verified grid regions from original TSR sheets. Requires Pillow only for asset rebuilding."""
from pathlib import Path
from PIL import Image
import json, hashlib
ROOT = Path(__file__).resolve().parent.parent
# x, y, frame width/height, columns, directions, stride x/y
REGIONS = {
 'barbarian': {'walk': (0,13,88,99,8,16,88,99), 'idle': (705,13,78,99,16,16,78,99), 'attack': (0,3687,182,142,16,16,182,142)},
 'fallen': {'walk': (0,1735,123,111,14,8,123,111), 'idle': (0,1735,123,111,1,8,123,111), 'attack': (0,962,115,95,17,8,115,95), 'death':(0,13,152,117,21,8,152,117)},
 'smith': {'idle':(793,1541,83,106,12,8,83,107), 'walk':(1790,1541,97,106,12,8,97,107), 'attack':(0,7,157,150,14,8,157,151)},
 'skeleton': {'walk':(1460,781,81,91,11,8,82,92), 'idle':(652,1697,79,90,16,8,80,91), 'attack':(0,11,96,94,22,8,97,95), 'death':(0,781,120,112,11,8,121,113)},
}
KEYS = {'barbarian': {(170,170,170),(244,244,244)}, 'fallen':{(170,170,170),(244,244,244)}, 'smith':{(195,195,195),(255,255,255)}, 'skeleton':{(255,0,153),(0,128,128)}}
manifest = {}
for name, regions in REGIONS.items():
 source = ROOT/'assets/source'/f"{name}.{ 'gif' if name=='barbarian' else 'png'}"
 sheet = Image.open(source).convert('RGBA')
 entries={}
 for action,(x,y,w,h,cols,rows,dx,dy) in regions.items():
  atlas=Image.new('RGBA',(w*cols,h*rows))
  for row in range(rows):
   for col in range(cols):
    frame=sheet.crop((x+col*dx,y+row*dy,x+col*dx+w,y+row*dy+h))
    frame.putdata([(r,g,b,0 if (r,g,b) in KEYS[name] else a) for r,g,b,a in frame.getdata()])
    atlas.paste(frame,(col*w,row*h))
  filename=f'{name}-{action}.png';atlas.save(ROOT/'public/assets/sprites'/filename,optimize=True)
  entries[action]={'file':filename,'width':w,'height':h,'frames':cols,'directions':rows,'anchorX':w/2,'anchorY':h-5}
 manifest[name]=entries
floor=Image.open(ROOT/'assets/source/monastery.png').convert('RGBA')
floor.putdata([(r,g,b,0 if (r,g,b)==(255,0,255) else a) for r,g,b,a in floor.getdata()])
floor.save(ROOT/'public/assets/sprites/monastery.png')
(ROOT/'public/assets/sprites/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared',sum(len(v) for v in manifest.values()),'animation atlases and monastery tiles')
