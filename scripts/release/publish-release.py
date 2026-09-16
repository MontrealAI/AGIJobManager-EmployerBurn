import argparse, hashlib, json, os, pathlib, subprocess

root = pathlib.Path(__file__).resolve().parents[2]
meta = root / 'docs/releases/v0.3.0'
config = json.loads((meta / 'release.json').read_text())
repo, tag, source = (config[k] for k in ['repository', 'tag', 'sourceCommit'])
parser = argparse.ArgumentParser()
parser.add_argument('--publish', action='store_true')
args = parser.parse_args()

def gh(*args):
    return subprocess.check_output(['gh', *args], cwd=root, text=True)

def api(endpoint):
    return json.loads(gh('api', f'repos/{repo}/{endpoint}'))

if os.environ.get('GITHUB_REPOSITORY') != repo:
    raise SystemExit('Repository identity mismatch.')
for item, commit in [(r, source) for r in config['requiredSourceRuns'].values()] + [(config['requiredUIRun'], config['uiValidationCommit'])]:
    run = api(f'actions/runs/{item["id"]}')
    assert run['repository']['full_name'] == repo
    assert run['head_sha'] == commit
    assert run['path'] == '.github/workflows/' + item['workflow']
    assert run['status'] == 'completed' and run['conclusion'] == 'success'
    print(f'Confirmed historical evidence: {run["name"]} at {commit} ({run["html_url"]})')
if not args.publish:
    raise SystemExit(0)
if os.environ.get('GITHUB_EVENT_NAME') != 'push' or os.environ.get('GITHUB_REF') != 'refs/heads/main':
    raise SystemExit('Publication is only allowed from a push to main.')
subprocess.run(['git', 'merge-base', '--is-ancestor', source, 'HEAD'], cwd=root, check=True)
out = root / 'dist/release/v0.3.0'
expected = {}
for line in (out / 'SHA256SUMS.txt').read_text().splitlines():
    digest, name = line.split('  ', 1)
    assert pathlib.Path(name).name == name
    assert hashlib.sha256((out / name).read_bytes()).hexdigest() == digest
    expected[name] = digest
expected['SHA256SUMS.txt'] = hashlib.sha256((out / 'SHA256SUMS.txt').read_bytes()).hexdigest()
query = subprocess.run(['gh', 'api', f'repos/{repo}/releases/tags/{tag}'], cwd=root, capture_output=True, text=True)
if query.returncode:
    if 'HTTP 404' not in query.stderr:
        raise SystemExit(query.stderr)
    existing_tags = api('tags?per_page=100')
    assert not any(item['name'] == tag for item in existing_tags), 'Existing tag must not be repointed.'
    gh('release', 'create', tag, '--repo', repo, '--target', source, '--title', config['name'], '--notes-file', str(meta / 'RELEASE_NOTES.md'), '--draft')
release = api(f'releases/tags/{tag}')
assert release['draft'], 'Published releases are immutable by policy; refusing to edit.'
assert release['name'] == config['name'] and release['target_commitish'] == source
assert release['body'].strip() == (meta / 'RELEASE_NOTES.md').read_text().strip()
assets = {asset['name']: asset for asset in release['assets']}
assert not set(assets) - set(expected), 'Unexpected draft assets; manual review required.'
for name, digest in expected.items():
    if name in assets:
        assert assets[name].get('digest') == 'sha256:' + digest, 'Existing asset differs; refusing to replace.'
    else:
        gh('release', 'upload', tag, str(out / name), '--repo', repo)
release = api(f'releases/tags/{tag}')
assert {a['name']: a.get('digest') for a in release['assets']} == {name: 'sha256:' + digest for name, digest in expected.items()}
gh('release', 'edit', tag, '--repo', repo, '--draft=false', '--latest')
release = api(f'releases/tags/{tag}')
assert not release['draft'] and not release['prerelease']
assert api(f'git/ref/tags/{tag}')['object']['sha'] == source
print(release['html_url'])
