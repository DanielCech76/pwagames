"""Bake conservative octagonal sprite outlines; preserve the unchanged RGBA artwork."""
from pathlib import Path
from PIL import Image
import json,subprocess
ROOT=Path(__file__).resolve().parents[1]
meta=json.loads(subprocess.check_output(['node','-e',"const c=require('./module-src/cyklo/canopy.js'); console.log(JSON.stringify({rects:c.rects,topRects:c.topRects}))"],cwd=ROOT))
shapes=[]
for filename,key in [('tree-crowns-v2.png','rects'),('tree-crowns-top-v2.png','topRects')]:
 im=Image.open(ROOT/'module-src/cyklo/assets'/filename).convert('RGBA')
 for x,y,w,h in meta[key]:
  x0,y0=round(x*im.width),round(y*im.height);W,H=round(w*im.width),round(h*im.height)
  # Include low-alpha edge texels and two-texel filter padding.
  pts=[(i/W,j/H) for j in range(H) for i in range(W) if im.getpixel((x0+i,y0+j))[3]>=32]
  poly=[(0.,0.),(1.,0.),(1.,1.),(0.,1.)]
  for a,b in [(1,1),(1,-1),(-1,1),(-1,-1)]:
   limit=max(a*u+b*v for u,v in pts)+2/W+2/H;out=[]
   for p,q in zip(poly,poly[1:]+poly[:1]):
    dp=a*p[0]+b*p[1]-limit;dq=a*q[0]+b*q[1]-limit
    if dp<=0:out.append(p)
    if (dp<=0)!=(dq<=0):
     t=dp/(dp-dq);out.append((p[0]+t*(q[0]-p[0]),p[1]+t*(q[1]-p[1])))
   poly=out
  assert 3<=len(poly)<=8
  poly.extend([poly[-1]]*(8-len(poly)))
  shapes.append([[round(u,8),round(v,8)] for u,v in poly])
(ROOT/'module-src/cyklo/assets/tree-outlines.json').write_text(json.dumps(shapes,separators=(',',':'))+'\n')
print('Baked',len(shapes),'conservative sprite outlines')

# Keep the runtime shader constants reproducible without a runtime JSON fetch.
import re
runtime=ROOT/'module-src/cyklo/canopy.js'
source=runtime.read_text()
source,n=re.subn(r'const outlines=.*?;\n','const outlines='+json.dumps(shapes,separators=(',',':'))+';\n',source,count=1)
assert n==1, 'Runtime outline declaration missing'
runtime.write_text(source)
