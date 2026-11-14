from pathlib import Path
import json,hashlib,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
index=(ROOT/'index.html').read_text()
assert 'pinball.js' not in index and 'phone-lab.js' not in index and 'app.js' not in index
assert 'core/main.js' in index
catalog=json.loads((ROOT/'catalog.json').read_text())
assert len({m['id'] for m in catalog['modules']})==len(catalog['modules'])
for m in catalog['modules']:
 path=ROOT/m['manifest'];data=path.read_bytes();assert hashlib.sha256(data).hexdigest()==m['manifestSha256'];pack=json.loads(data)
 assert sum(f['size'] for f in pack['files'])==m['size']
 for f in pack['files']:
  b=(path.parent/f['path']).read_bytes();assert len(b)==f['size'];assert hashlib.sha256(b).hexdigest()==f['sha256']
 html=(path.parent/pack['entry']).read_text();ids=re.findall(r'\sid="([^"]+)"',html);assert len(ids)==len(set(ids)),m['id']
 for script in re.findall(r'src="\./([^"]+)"',html):assert any(f['path']==script for f in pack['files']),script
 for f in path.parent.glob('*.js'):subprocess.run(['node','--check',str(f)],check=True)
for p in (ROOT/'core').glob('*.js'):
 subprocess.run(['node','--input-type=module','--check'],input=p.read_bytes(),check=True)
subprocess.run(['node','--check',str(ROOT/'sw.js')],check=True)
print('PASS: core contains no game controllers, catalog and package hashes/sizes, complete module scripts, unique IDs and JavaScript syntax')
