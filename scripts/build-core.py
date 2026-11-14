from pathlib import Path
import json,hashlib,re,subprocess
ROOT=Path(__file__).resolve().parents[1]
release=json.loads((ROOT/'release.json').read_text());version=release['coreVersion'];api=release['apiVersion']
(ROOT/'core/version.js').write_text(f'export const CORE_VERSION={json.dumps(version)};\nexport const API_VERSION={api};\n')
p=ROOT/'index.html';p.write_text(re.sub(r'JÁDRO \d+\.\d+\.\d+ · API \d+',f'JÁDRO {version} · API {api}',p.read_text()))
paths=['index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png']+[p.relative_to(ROOT).as_posix() for p in sorted((ROOT/'core').glob('*')) if p.is_file()]
files=[{'path':p,'sha256':hashlib.sha256((ROOT/p).read_bytes()).hexdigest()} for p in paths];build=hashlib.sha256(json.dumps(files).encode()).hexdigest()[:16]
old=subprocess.run(['git','show','HEAD:sw.js'],cwd=ROOT,capture_output=True,text=True).stdout
match=re.search(r'const VERSION="([^"]+)",BUILD="([^"]+)"',old)
if match and match[1]==version and match[2]!=build:raise SystemExit('Jádro '+version+' již bylo vydáno. Zvyš coreVersion v release.json.')
s=(ROOT/'scripts/sw-template.js').read_text().replace('__VERSION__',json.dumps(version)).replace('__BUILD__',json.dumps(build)).replace('__FILES__',json.dumps(files))
(ROOT/'sw.js').write_text(s)
print('Built core',version,':',len(files),'files,',sum((ROOT/p).stat().st_size for p in paths),'bytes')
