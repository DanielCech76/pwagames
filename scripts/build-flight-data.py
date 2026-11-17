from pathlib import Path
from PIL import Image
import urllib.request,concurrent.futures,io,json,math,struct
out=Path(__file__).resolve().parents[1]/'module-src/letadlo/data'
out.mkdir(parents=True,exist_ok=True)
def get(t):
 kind,x,y=t
 url=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/6/{x}/{y}.png' if kind=='dem' else f'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/6/{y}/{x}.jpeg'
 p=Path(f'/tmp/flight-{kind}-{x}-{y}')
 if not p.exists():
  with urllib.request.urlopen(url,timeout=50) as r:p.write_bytes(r.read())
 im=Image.open(p).convert('RGB');im.load();return kind,x,y,im
mosaics={k:Image.new('RGB',(768,768)) for k in ['dem','image']}
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as ex:
 for k,x,y,im in ex.map(get,[(k,x,y) for k in mosaics for y in range(21,24) for x in range(33,36)]):
  mosaics[k].paste(im,((x-33)*256,(y-21)*256))
mosaics['image'].save(out/'alps.jpg',quality=90)
im=mosaics['dem'];n=385;values=[]
for j in range(n):
 for i in range(n):
  r,g,b=im.getpixel((min(i*2,767),min(j*2,767)));values.append(round(r*256+g+b/256-32768))
(out/'alps-dem.bin').write_bytes(struct.pack('<'+'h'*len(values),*values))
(out/'region.json').write_text(json.dumps({'name':'Střední Evropa a Alpy','zoom':6,'x':33,'y':21,'tiles':3,'n':n,'step':2,'imagery':'NASA GIBS Blue Marble • orientační povrch, nikoli detailní ortofoto','terrain':'Mapzen / AWS Terrain Tiles','date':'2026-11-17'}))
print('DONE',len(values),'samples', (out/'alps.jpg').stat().st_size)
