"""Build the compact long-distance GeoNames catalog. No implicit downloads.
Usage: python scripts/build-ar-significant.py --sources /path/to/official/zips
"""
from pathlib import Path
import argparse,zipfile,json,hashlib,gzip,math,collections,importlib.util
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('gazetteer',ROOT/'scripts/build-ar-gazetteer.py');gaz=importlib.util.module_from_spec(spec);spec.loader.exec_module(gaz)
def distance(a,b):
 p,q=math.radians(a[3]),math.radians(b[3]);return 12742000*math.asin(min(1,math.sqrt(math.sin((q-p)/2)**2+math.cos(p)*math.cos(q)*math.sin(math.radians(b[2]-a[2])/2)**2)))
def build(sources):
 out=ROOT/'ar-place-data/significant-v1';out.mkdir(parents=True,exist_ok=True);inputs=[];cities={};peaks={}
 for p in (ROOT/'ar-place-data/v1').glob('*.json.gz'):
  for r in json.load(gzip.open(p))['rows']:
   if r[4]==2 and isinstance(r[5],(int,float)) and r[5]>=1500:peaks[r[0]]=r
 for name in ['cities15000.zip','CH.zip','FR.zip','IT.zip','SI.zip']:
  p=sources/name;inputs.append({'file':name,'url':'https://download.geonames.org/export/dump/'+name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  for raw in gaz.rows(p):
   r=gaz.convert(raw)
   if not r:continue
   if name=='cities15000.zip':
    pop=int(raw[14] or 0);capital=raw[7]=='PPLC'
    if r[4]==0 and (pop>=100000 or capital):cities[r[0]]=r+[pop,capital,True]
   elif r[4]==2 and isinstance(r[5],(int,float)) and r[5]>=1500:peaks[r[0]]=r
 # Keep the highest available summit per 20 km neighbourhood. This is a spatial
 # height selection, not a fabricated prominence measurement.
 buckets=collections.defaultdict(list);chosen=[]
 for r in sorted(peaks.values(),key=lambda r:(-r[5],r[0])):
  y,x=math.floor(r[3]*4),math.floor(r[2]*4);dx=math.ceil(20000/(27798*max(.1,math.cos(math.radians(r[3])))))+1
  if any(distance(r,a)<20000 for j in range(y-2,y+3) for i in range(x-dx,x+dx+1) for a in buckets[j,i]):continue
  chosen.append(r+[None,False,True]);buckets[y,x].append(r)
 rows=sorted([*cities.values(),*chosen],key=lambda r:r[0]);data=(json.dumps({'format':1,'source':'GeoNames','rows':rows},ensure_ascii=False,separators=(',',':'))+'\n').encode();(out/'places.json').write_bytes(data)
 info={'format':1,'source':'GeoNames','license':'CC BY 4.0','cities':len(cities),'peaks':len(chosen),'peakCountries':['CZ','AT','SK','DE','PL','CH','FR','IT','SI'],'cityCoverage':'worldwide; population >= 100000 or national capital','peakSelection':'highest explicit GeoNames elevation per 20 km neighbourhood, elevations >= 1500 m; not prominence','inputs':inputs,'regionalSnapshotSha256':hashlib.sha256((ROOT/'ar-place-data/v1/index.json').read_bytes()).hexdigest(),'data':{'file':'places.json','bytes':len(data),'count':len(rows),'sha256':hashlib.sha256(data).hexdigest()}}
 (out/'index.json').write_text(json.dumps(info,ensure_ascii=False,indent=2)+'\n')
 (out/'ATTRIBUTION.md').write_text('# Long-distance AR catalog\n\nSource: https://www.geonames.org/ — CC BY 4.0.\nOfficial source ZIP URLs and hashes are in index.json.\nGlobal cities: population at least 100,000 or national capitals.\nMountains: explicit elevations at least 1,500 m in the listed nine countries, spatially thinned to the highest available point in a 20 km neighbourhood. No prominence values were inferred. This is not complete worldwide mountain coverage.\nExtended row columns after the seven v1 fields: population or null, national-capital flag, long-distance-major flag.\n')
 print({'cities':len(cities),'peaks':len(chosen),'bytes':len(data)})
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--sources',type=Path,required=True);build(a.parse_args().sources)
