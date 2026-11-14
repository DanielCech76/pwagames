"""Build immutable, complete offline packages and a first-party catalog; stdlib only."""
from pathlib import Path
import json,hashlib,shutil,tempfile,subprocess
ROOT=Path(__file__).resolve().parents[1]
entries=[]
for source in sorted((ROOT/'module-src').iterdir()):
 if not (source/'module.json').exists():continue
 meta=json.loads((source/'module.json').read_text());id=meta['id'];version=meta['version'];out=ROOT/'modules'/id/version
 with tempfile.TemporaryDirectory() as temp:
  stage=Path(temp)/'package';shutil.copytree(source,stage);(stage/'module.json').unlink()
  (stage/'bridge.js').write_bytes((ROOT/'scripts/module-bridge.js').read_bytes())
  (stage/'index.html').write_text((stage/'index.html').read_text().replace('<script src="./bridge.js">','<script data-module-id="'+id+'" src="./bridge.js">'))
  files=[]
  for f in sorted(stage.rglob('*')):
   if f.is_file():
    data=f.read_bytes();files.append({'path':f.relative_to(stage).as_posix(),'size':len(data),'sha256':hashlib.sha256(data).hexdigest()})
  manifest={'format':1,**meta,'entry':'index.html','files':files};data=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
  tracked=subprocess.run(['git','ls-files','--error-unmatch',str((out/'manifest.json').relative_to(ROOT))],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode==0
  if tracked and (out/'manifest.json').read_bytes()!=data:raise SystemExit('Balíček '+id+' '+version+' již byl vydán. Zvyš version v module.json.')
  (stage/'manifest.json').write_bytes(data)
  if out.exists():shutil.rmtree(out)
  out.parent.mkdir(parents=True,exist_ok=True);shutil.copytree(stage,out)
 entries.append({**meta,'manifest':f'modules/{id}/{version}/manifest.json','manifestSha256':hashlib.sha256(data).hexdigest(),'size':sum(f['size'] for f in files)})
(ROOT/'catalog.json').write_text(json.dumps({'format':1,'modules':entries},ensure_ascii=False,indent=2)+'\n')
print('Built:',', '.join(f"{e['id']} ({e['size']} B)" for e in entries))
