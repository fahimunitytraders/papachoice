#!/usr/bin/env python3
"""Create an S3-ready, product-free content release using only the standard library."""
import hashlib
import json
from pathlib import Path
import sys
import re
import zipfile

root = Path(__file__).resolve().parents[1]
if len(sys.argv) != 3:
    raise SystemExit('Usage: python3 scripts/package-content.py OUTPUT.zip EXTERNAL_ASSET_DIRECTORY')
output = Path(sys.argv[1])
public = Path(sys.argv[2]).resolve()
if not public.is_dir():
    raise SystemExit('External asset directory does not exist.')
output.parent.mkdir(parents=True, exist_ok=True)
prefix = 'site-content/v1/'
files = {}
for name in ('site.json', 'interface.json'):
    files[prefix + name] = (root / 'packages/content' / name).read_bytes()
site = json.loads(files[prefix + 'site.json'])
assert 'products' not in site and 'categories' not in site
for file in sorted(public.rglob('*')):
    relative = file.relative_to(public).as_posix()
    if file.is_file() and (relative == 'favicon.svg' or relative.startswith('assets/')) and not relative.startswith('assets/products/'):
        files[prefix + file.relative_to(public).as_posix()] = file.read_bytes()
# Refuse incomplete archives after local site images have been removed.
required = {'/favicon.svg'}
def collect(value):
    if isinstance(value, dict):
        for child in value.values(): collect(child)
    elif isinstance(value, list):
        for child in value: collect(child)
    elif isinstance(value, str) and value.startswith('/assets/'):
        required.add(value)
collect(site)
for source in (root / 'apps/web/src').rglob('*.jsx'):
    required.update(re.findall(r"['\"](/assets/[^'\"]+\.(?:png|jpg|jpeg|svg))['\"]", source.read_text()))
missing = sorted(path for path in required if prefix + path.lstrip('/') not in files)
if missing:
    raise SystemExit('Missing external assets: ' + ', '.join(missing))
manifest = {'schemaVersion': 1, 'baseUrl': 'https://d22teg2omtu6om.cloudfront.net/' + prefix,
            'files': [{'path': k.removeprefix(prefix), 'bytes': len(v), 'sha256': hashlib.sha256(v).hexdigest()}
                      for k, v in sorted(files.items())]}
files[prefix + 'manifest.json'] = (json.dumps(manifest, indent=2) + '\n').encode()
files['README.md'] = (root / 'docs/s3-content.md').read_bytes()
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name, data in sorted(files.items()):
        archive.writestr(name, data)
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert not any('/assets/products/' in name or name.endswith('/products.json') for name in archive.namelist())
print(f'{output}: {len(files)} files, {output.stat().st_size} bytes; ZIP integrity verified')
