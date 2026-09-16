import argparse, hashlib, io, json, pathlib, subprocess, zipfile

root = pathlib.Path(__file__).resolve().parents[2]
meta = root / 'docs/releases/v0.3.0'
config = json.loads((meta / 'release.json').read_text())
parser = argparse.ArgumentParser()
parser.add_argument('--out', type=pathlib.Path, default=root / 'dist/release/v0.3.0')
args = parser.parse_args()
out = args.out.resolve()
out.mkdir(parents=True, exist_ok=True)
if any(out.iterdir()):
    raise SystemExit('Output directory must be empty; existing artifacts are never overwritten.')

def git(*args):
    return subprocess.check_output(['git', *args], cwd=root)

def sha(data):
    return hashlib.sha256(data).hexdigest()

source = config['sourceCommit']
assert git('rev-parse', source + '^{commit}').decode().strip() == source
assert git('rev-parse', source + '^{tree}').decode().strip() == config['sourceTree']
subprocess.run(['git', 'merge-base', '--is-ancestor', source, 'HEAD'], cwd=root, check=True)
expected = ['ui/agijobmanagerburnv0.html', 'ui/agijobmanagerburnv1.html', 'ui/agijobmanagerburnv2.html']
changed = git('diff', '--name-only', config['previousTag'], source).decode().splitlines()
assert changed == expected, f'Unexpected application delta: {changed}'
assert git('diff', config['uiValidationCommit'], source, '--', 'ui', 'docs/ui', 'agijobmanager.html') == b''

payload = {}
with zipfile.ZipFile(io.BytesIO(git('archive', '--format=zip', source))) as archive:
    for item in archive.infolist():
        if not item.is_dir():
            payload['source/' + item.filename] = (archive.read(item), (item.external_attr >> 16) or 0o100644)
payload['agijobmanagerburnv2.html'] = (git('show', source + ':' + config['primaryUI']), 0o100644)
for name in ['START_HERE.md', 'RELEASE_NOTES.md', 'VALIDATION.md', 'release.json']:
    payload[name] = ((meta / name).read_bytes(), 0o100644)
for name, digest in config['releaseAssets'].items():
    data = (meta / name).read_bytes()
    assert sha(data) == digest, f'Original release asset digest mismatch: {name}'
    payload['deployment-reference/' + name] = (data, 0o100644)
for name in ['package-release.py', 'verify-employerburn-ui.mjs', 'publish-release.py']:
    payload['release-tooling/' + name] = ((root / 'scripts/release' / name).read_bytes(), 0o100644)
manifest = dict(config, files={name: {'sha256': sha(data), 'bytes': len(data)} for name, (data, mode) in sorted(payload.items())})
manifest_bytes = (json.dumps(manifest, indent=2, ensure_ascii=False) + '\n').encode()
payload['RELEASE_MANIFEST.json'] = (manifest_bytes, 0o100644)
prefix = f"AGIJobManager-EmployerBurn-{config['tag']}"
zip_path = out / (prefix + '-COMPLETE.zip')
date = tuple(map(int, config['releaseDate'].split('-'))) + (0, 0, 0)
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name, (data, mode) in sorted(payload.items()):
        info = zipfile.ZipInfo(prefix + '/' + name, date_time=date)
        info.create_system = 3
        info.external_attr = mode << 16
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, data, compresslevel=9)
with zipfile.ZipFile(zip_path) as archive:
    assert archive.testzip() is None
    for name, details in manifest['files'].items():
        assert sha(archive.read(prefix + '/' + name)) == details['sha256']
(out / 'agijobmanagerburnv2.html').write_bytes(payload['agijobmanagerburnv2.html'][0])
(out / 'RELEASE_MANIFEST.json').write_bytes(manifest_bytes)
checksums = ''.join(f'{sha(file.read_bytes())}  {file.name}\n' for file in sorted(out.iterdir()))
(out / 'SHA256SUMS.txt').write_text(checksums)
print(f'Packaged {len(manifest["files"])} payload files from {source}')
print(checksums, end='')
