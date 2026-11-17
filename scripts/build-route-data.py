"""Generate small flight-specific data packs. Run manually with Pillow installed.
No network access, imagery generation or data download is part of the app build.
"""
from pathlib import Path
import json, math, struct, hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
src=root/'flight-data/source'; out=root/'flight-data/v1'; out.mkdir(parents=True,exist_ok=True)
m=json.loads((src/'region.json').read_text()); n=m['n']; raw=(src/'alps-dem.bin').read_bytes(); image=Image.open(src/'alps.jpg')
airports=[('PRG',14.26,50.1008),('VCE',12.3519,45.5053),('VIE',16.5697,48.1103),('MUC',11.7861,48.3538),('INN',11.344,47.2602),('SZG',13.0043,47.7933),('ZRH',8.5492,47.4581),('MXP',8.7281,45.6306)]
def pixel(lon,lat):return ((lon+180)/360*64-m['x'])*256/m['step'],((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*64-m['y'])*256/m['step']
for i,a in enumerate(airports):
 for b in airports[i+1:]:
  # 200 km viewing margin around both ends; the supplied source bounds are the limit.
  points=[pixel(lon,lat) for _,lon,lat in [a,b]]; margin=70
  x=max(0,math.floor(min(p[0] for p in points))-margin); y=max(0,math.floor(min(p[1] for p in points))-margin)
  side=min(n,max(math.ceil(max(p[0] for p in points))+margin-x,math.ceil(max(p[1] for p in points))+margin-y)+1)
  x=min(x,n-side);y=min(y,n-side)
  key='-'.join(sorted([a[0],b[0]]));dest=out/key;dest.mkdir(exist_ok=True)
  meta={**m,'name':key,'x':m['x']+x*m['step']/256,'y':m['y']+y*m['step']/256,'n':side}
  (dest/'region.json').write_text(json.dumps(meta))
  (dest/'terrain.bin').write_bytes(b''.join(raw[((y+j)*n+x)*2:((y+j)*n+x+side)*2] for j in range(side)))
  image.crop((round(x/(n-1)*image.width),round(y/(n-1)*image.height),round((x+side-1)/(n-1)*image.width),round((y+side-1)/(n-1)*image.height))).save(dest/'surface.jpg',quality=88)
  files=[{'path':f,'size':(dest/f).stat().st_size,'sha256':hashlib.sha256((dest/f).read_bytes()).hexdigest()} for f in ['region.json','terrain.bin','surface.jpg']]
  (dest/'manifest.json').write_text(json.dumps({'version':1,'route':key,'files':files}))
print('Generated 28 route packs')
