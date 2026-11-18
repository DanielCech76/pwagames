"""Build the standalone flight PWA from the current immutable module package."""
import hashlib
import json
from pathlib import Path
import shutil
import sys

root = Path(__file__).resolve().parents[1]
site = Path(sys.argv[1])
catalog = json.loads((site / 'catalog.json').read_text(encoding='utf-8'))
module = next(module for module in catalog['modules'] if module['id'] == 'letadlo')
package = site / module['manifest']
manifest = json.loads(package.read_text(encoding='utf-8'))
out = site / 'letadlo'
out.mkdir()
files = [item['path'] for item in manifest['files']]
for file in files:
    destination = out / file
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(package.parent / file, destination)

# Both entry points retain the same origin-relative keys for downloaded data.
for file in ('index.html', 'offline.js', 'app.js', 'data-worker.js'):
    path = out / file
    source = path.read_text(encoding='utf-8')
    path.write_text(source.replace('../../../flight-', '../flight-'), encoding='utf-8')

index = out / 'index.html'
html = index.read_text(encoding='utf-8')
html = html.replace('</head>', '''
<link rel="manifest" href="./manifest.webmanifest">
<link rel="icon" href="./icon-192.png">
<link rel="apple-touch-icon" href="./icon-192.png">
<style>body:has(#flight[hidden]) #back { visibility: hidden; }</style>
<script src="./install.js" defer></script>
</head>''')
html = html.replace('<p id="routeDescription"', '''
<div style="margin-top: 12px">
  <button id="installApp" type="button" aria-controls="installHelp" hidden>Nainstalovat aplikaci</button>
  <p id="installHelp" class="muted" role="status" hidden>V Chromu otevři nabídku ⋮ a zvol Nainstalovat aplikaci nebo Přidat na plochu. V Safari na iPhonu použij Sdílet → Přidat na plochu.</p>
</div>
<p id="routeDescription"''')
index.write_text(html, encoding='utf-8')

for asset in sorted((root / 'letadlo').iterdir()):
    if asset.name != 'sw.js':
        shutil.copy2(asset, out / asset.name)
        files.append(asset.name)

worker = (root / 'letadlo' / 'sw.js').read_text(encoding='utf-8')
worker = worker.replace('__SHELL_FILES__', json.dumps(sorted(files)))
digest = hashlib.sha256(worker.encode())
for file in sorted(files):
    digest.update((out / file).read_bytes())
(out / 'sw.js').write_text(
    worker.replace('__BUILD_HASH__', digest.hexdigest()[:16]), encoding='utf-8'
)
