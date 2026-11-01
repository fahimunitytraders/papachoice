#!/usr/bin/env python3
"""Create an S3-ready, product-free content release using only the standard library."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'dist/papachoice-s3-content.zip'
output.parent.mkdir(parents=True, exist_ok=True)
prefix = 'site-content/v1/'
files = {}
for name in ('site.json', 'interface.json'):
    files[prefix + name] = (root / 'packages/content' / name).read_bytes()
site = json.loads(files[prefix + 'site.json'])
assert 'products' not in site and 'categories' not in site
public = root / 'apps/web/public'
for file in sorted(public.rglob('*')):
    if file.is_file() and not file.relative_to(public).as_posix().startswith('assets/products/'):
        files[prefix + file.relative_to(public).as_posix()] = file.read_bytes()
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
