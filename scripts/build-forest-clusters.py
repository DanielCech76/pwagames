"""Bake technical forest impostor atlases from the existing low-detail tree artwork.
Three density levels (4/9/16 crowns), three species; no runtime image generation.
"""
from pathlib import Path
from PIL import Image,ImageOps
import subprocess,json,random
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'module-src/cyklo/assets'
meta=json.loads(subprocess.check_output(['node','-e',"const c=require('./module-src/cyklo/canopy.js');console.log(JSON.stringify({rects:c.rects,topRects:c.topRects}))"],cwd=ROOT))
for overhead,file,key,tile in [(False,'tree-crowns-v2.png','rects',(384,192)),(True,'tree-crowns-top-v2.png','topRects',(384,384))]:
 src=Image.open(DEST/file).convert('RGBA');atlas=Image.new('RGBA',(tile[0]*3,tile[1]*3))
 for level,n in enumerate([2,3,4]):
  for species in range(3):
   x,y,w,h=meta[key][6+species];sprite=src.crop((round(x*src.width),round(y*src.height),round((x+w)*src.width),round((y+h)*src.height)))
   # Deliberately coarse colour/shape detail for distant stands; keep source alpha.
   alpha=sprite.getchannel('A');rgb=ImageOps.posterize(sprite.convert('RGB'),3);sprite=rgb.convert('RGBA');sprite.putalpha(alpha)
   patch=Image.new('RGBA',tile);rng=random.Random(level*17+species*131)
   for row in range(n):
    for col in range(n):
     cx=tile[0]*((col+.5)/n if overhead else .2+.6*col/max(1,n-1))+rng.uniform(-20 if overhead else -8,20 if overhead else 8)
     if overhead:
      cy=tile[1]*(row+.5)/n+rng.uniform(-20,20);size=round(112*rng.uniform(.9,1.1));glyph=sprite.resize((size,size),Image.Resampling.BILINEAR);pos=(round(cx-size/2),round(cy-size/2))
     else:
      cy=tile[1]*(.82+.17*row/max(1,n-1))+rng.uniform(-2,2);height=round(144*rng.uniform(.9,1.08));width=round(height*(.8 if species==1 else 1.05 if species==0 else 1.4));glyph=sprite.resize((width,height),Image.Resampling.BILINEAR);pos=(round(cx-width/2),round(cy-height))
     if (row+col)%2:glyph=ImageOps.mirror(glyph)
     
     if overhead:
      for dx in [-tile[0],0,tile[0]]:
       for dy in [-tile[1],0,tile[1]]:patch.alpha_composite(glyph,(pos[0]+dx,pos[1]+dy))
     else:patch.alpha_composite(glyph,pos)
   atlas.alpha_composite(patch,(species*tile[0],level*tile[1]))
 name='forest-clusters-top.png' if overhead else 'forest-clusters.png';atlas.save(DEST/name,optimize=True)
 print(name,atlas.size)
