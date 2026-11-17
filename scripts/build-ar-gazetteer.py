"""Build a versioned first-party AR gazetteer from official GeoNames exports.
Usage: python scripts/build-ar-gazetteer.py --sources /path/to/exports
No automatic network access; source ZIPs and hashes remain explicit.
"""
from pathlib import Path
import argparse,zipfile,json,hashlib,math,collections,gzip
ROOT=Path(__file__).resolve().parents[1]
COUNTRIES=['CZ','AT','SK','DE','PL']
P_CODES={'PPL','PPLA','PPLA2','PPLA3','PPLA4','PPLA5','PPLC','PPLL','PPLS','PPLX','STLMT'}
T_CODES={'MT','MTS','PK','PKS','HLL','HLLS','RDGE','PASS'}
H_CODES={'LK','LKS','LKN','RSV','RSVT'}
S_CODES={'CSTL','RUIN','MONU'}
def digest(b):return hashlib.sha256(b).hexdigest()
def rows(path):
 with zipfile.ZipFile(path) as z:
  name=path.stem+'.txt'
  with z.open(name) as f:
   for line in f:
    row=line.decode('utf-8').rstrip('\r\n').split('\t')
    if len(row)>=19:yield row

def convert(row):
 code=row[7];pop=int(row[14] or 0);typ=None
 if row[6]=='P' and code in P_CODES:typ=6 if code=='PPLX' else 0 if pop>=5000 or code=='PPLC' else 1
 elif row[6]=='T' and code in T_CODES:typ=7 if code=='PASS' else 8 if code=='RDGE' else 2
 elif row[6]=='H' and code in H_CODES:typ=3
 elif row[6]=='S' and code in S_CODES:typ=4 if code in {'CSTL','RUIN'} else 5
 if typ is None:return None
 try:lat=float(row[4]);lon=float(row[5]);alt=int(row[15]) if row[15] else None
 except ValueError:return None
 if not(-180<=lon<=180 and -85<=lat<=85):return None
 if alt is not None and not(-500<=alt<=9000):alt=None
 rank=0 if typ==0 else 1 if typ in {2,7,8} else 2 if typ in {3,4,5} else 4 if typ==6 else 3
 return [int(row[0]),row[1][:120],round(lon,5),round(lat,5),typ,alt,rank]

def build(sources,out):
 out.mkdir(parents=True,exist_ok=True);cells=collections.defaultdict(dict);inputs=[];counts={}
 for country in COUNTRIES:
  path=sources/(country+'.zip');count=0
  for row in rows(path):
   item=convert(row)
   if item is None:continue
   key=f'{math.floor(item[3])}_{math.floor(item[2])}';cells[key][item[0]]=item;count+=1
  counts[country]=count;inputs.append({'file':path.name,'url':'https://download.geonames.org/export/dump/'+path.name,'sha256':digest(path.read_bytes())})
 cities={}
 for row in rows(sources/'cities15000.zip'):
  item=convert(row)
  if item:cities[item[0]]=item
 inputs.append({'file':'cities15000.zip','url':'https://download.geonames.org/export/dump/cities15000.zip','sha256':digest((sources/'cities15000.zip').read_bytes())})
 def write(name,items):
  b=(json.dumps({'format':1,'rows':sorted(items,key=lambda p:p[0])},ensure_ascii=False,separators=(',',':'))+'\n').encode();compressed=gzip.compress(b,mtime=0);(out/(name+'.gz')).write_bytes(compressed);return {'file':name+'.gz','count':len(items),'bytes':len(compressed),'uncompressedBytes':len(b),'sha256':digest(compressed)}
 manifest={'format':1,'snapshot':'2026-11-17','source':'GeoNames','license':'CC BY 4.0','attribution':'GeoNames.org — CC BY 4.0; filtered and tiled for CYKLO AR','detailCountries':COUNTRIES,'counts':counts,'inputs':inputs,'global':write('cities.json',list(cities.values())),'cells':{}}
 for key,items in sorted(cells.items()):manifest['cells'][key]=write(key+'.json',list(items.values()))
 (out/'index.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
 (out/'ATTRIBUTION.md').write_text('''# GeoNames AR gazetteer\n\nSource: https://www.geonames.org/ — https://download.geonames.org/export/dump/\n\nGeoNames data is licensed under Creative Commons Attribution 4.0:\nhttps://creativecommons.org/licenses/by/4.0/\n\nThis snapshot was downloaded on 2026-11-17. Source ZIP hashes and URLs are in index.json.\nChanges: selected populated places, peaks/hills/passes, lakes/reservoirs, castles/ruins and named landmarks; removed other feature classes; retained GeoNames IDs and original names, rounded WGS84 coordinates to five decimals, used only explicit elevation when present, assigned display ranks and split into degree cells.\n\nDetailed regional coverage: Czechia, Austria, Slovakia, Germany and Poland. Other countries: major cities from the cities15000 export. Coverage is not exhaustive and coordinate/elevation accuracy varies. No guarantee of timeliness, accuracy or completeness is provided.\n\nRow columns: GeoNames ID, original name, longitude, latitude, type, explicit elevation in metres or null, display rank. Types: 0 city, 1 settlement, 2 peak/terrain landmark, 3 water, 4 castle/ruin, 5 named landmark, 6 populated-place subdivision, 7 pass, 8 ridge.\n''')
 print(json.dumps({'cells':len(cells),'counts':counts,'cities':len(cities),'bytes':sum(p.stat().st_size for p in out.iterdir())}))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);p.add_argument('--output',type=Path,default=ROOT/'ar-place-data/v1');args=p.parse_args();build(args.sources,args.output)
