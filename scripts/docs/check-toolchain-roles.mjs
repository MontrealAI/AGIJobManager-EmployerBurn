import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const checks = [
  {
    file: 'README.md',
    required: [
      'Hardhat (`hardhat/README.md`). Truffle is legacy/supported.',
      'Canonical production artifacts are built from Hardhat (`hardhat/artifacts`).',
      'Foundry remains audit/fuzz-only and is not a deployment source of truth.'
    ]
  },
  {
    file: 'hardhat/README.md',
    required: [
      'Hardhat artifact source of truth',
      'Foundry (forge) role: audit/fuzz testing only',
      'Truffle role: legacy compatibility only'
    ]
  },
  {
    file: 'docs/DEPLOYMENT/README.md',
    required: [
      'Source-of-truth production artifact: Hardhat build output (`hardhat/artifacts`).',
      'Foundry status: audit/fuzz testing only',
      'Truffle status: legacy/supported for backward compatibility'
    ]
  },
  {
    file: 'foundry.toml',
    required: ['# Non-canonical deployment toolchain: audit/fuzz testing only.']
  }
];

let failed = false;
for (const { file, required } of checks) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing file for toolchain-role check: ${file}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const snippet of required) {
    if (!content.includes(snippet)) {
      console.error(`❌ Missing required toolchain-role snippet in ${file}: ${snippet}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('✅ Toolchain role checks passed');
