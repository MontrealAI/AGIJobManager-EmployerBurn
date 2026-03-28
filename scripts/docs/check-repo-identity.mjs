import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const requiredSnippets = [
  ['README.md', ['AGIJobManager EmployerBurn Variant', 'Employer-burn semantics (this repo variant)']],
  ['package.json', ['"name": "agijobmanager-employerburn"', 'EmployerBurn variant']],
  ['hardhat/package.json', ['EmployerBurn variant']],
  ['docs/REFERENCE/UPSTREAM_RECONCILIATION.md', ['What changed from upstream AGIJobManager', 'What remains intentionally named AGIJobManager and why']],
  ['docs/ETHERSCAN_GUIDE.md', ['Employer burn quick flow (Etherscan-first)']],
  ['docs/OWNER_RUNBOOK.md', ['Employer-burn owner checks']],
  ['docs/DEPLOYMENT/README.md', ['EmployerBurn variant deployment identity']],
  ['MAINNET_DEPLOYMENT_CHECKLIST.md', ['EmployerBurn-specific preflight']]
];

const forbiddenExactLines = [
  ['README.md', /^#\s*AGIJobManager\s*$/m]
];

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`❌ ${msg}`);
};
const ok = (msg) => console.log(`✅ ${msg}`);

for (const [file, snippets] of requiredSnippets) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing required identity file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      fail(`Missing required identity snippet in ${file}: ${snippet}`);
    }
  }
}

for (const [file, pattern] of forbiddenExactLines) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  if (pattern.test(content)) {
    fail(`Forbidden stale heading in ${file}: ${pattern}`);
  }
}

if (failed) {
  process.exit(1);
}

ok('Repository identity checks passed');
