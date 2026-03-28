import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGIALPHA_MAINNET = '0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA';

const requiredSnippets = [
  [
    'README.md',
    [
      AGIALPHA_MAINNET,
      'EmployerBurnReadHelper',
      'EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)'
    ]
  ],
  [
    'docs/ETHERSCAN_GUIDE.md',
    [
      AGIALPHA_MAINNET,
      'approve **AGIJobManager** as spender',
      'Before you click **Write** (Employer burn transactions)',
      'Employer burn readiness reason codes (plain English)'
    ]
  ],
  [
    'docs/OWNER_RUNBOOK.md',
    [
      AGIALPHA_MAINNET,
      'Employer-burn owner checks'
    ]
  ],
  [
    'docs/DEPLOYMENT/OWNER_MAINNET_DEPLOYMENT_AND_OPERATIONS_GUIDE.md',
    [
      AGIALPHA_MAINNET,
      'EmployerBurnReadHelper'
    ]
  ],
  [
    'MAINNET_DEPLOYMENT_CHECKLIST.md',
    [
      AGIALPHA_MAINNET,
      'EmployerBurnEnforced'
    ]
  ],
  [
    'docs/REFERENCE/EMPLOYER_BURN_DESIGN.md',
    [
      'burnFrom(job.employer, burnAmount)',
      'No protocol subsidy'
    ]
  ]
];

let failed = false;
const fail = (msg) => {
  failed = true;
  console.error(`❌ ${msg}`);
};
const pass = (msg) => console.log(`✅ ${msg}`);

for (const [relPath, snippets] of requiredSnippets) {
  const absolutePath = path.join(root, relPath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing required canonical file: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(absolutePath, 'utf8');
  for (const snippet of snippets) {
    if (!content.includes(snippet)) {
      fail(`Missing required canonical snippet in ${relPath}: ${snippet}`);
    }
  }
}

if (failed) {
  process.exit(1);
}

pass('EmployerBurn canonical docs checks passed');
