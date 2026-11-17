from pathlib import Path
import subprocess,shutil
ROOT=Path(__file__).resolve().parents[1]
for name in ['build-packages.py','build-core.py']:subprocess.run(['python',str(ROOT/'scripts'/name)],cwd=ROOT,check=True)
out=ROOT/'_site'
if out.exists():shutil.rmtree(out)
out.mkdir()
for name in ['index.html','manifest.webmanifest','catalog.json','sw.js']:shutil.copy2(ROOT/name,out/name)
for name in ['core','icons','modules','flight-data','ar-place-data']:shutil.copytree(ROOT/name,out/name)
(out/'.nojekyll').touch()
print('Static deployment ready:',out)
