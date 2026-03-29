import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const canonicalFiles = [
  'README.md',
  'hardhat/README.md',
  'docs/DEPLOYMENT/README.md',
  'docs/DEPLOYMENT/OWNER_MAINNET_DEPLOYMENT_AND_OPERATIONS_GUIDE.md',
  'docs/OWNER_RUNBOOK.md',
  'docs/ETHERSCAN_GUIDE.md',
  'MAINNET_DEPLOYMENT_CHECKLIST.md'
];

const forbiddenSnippets = [
  'deploy:agijobmanager:prod',
  'contributeToRewardPool(',
  'RewardPoolContribution(',
  'resolveDispute(uint256',
  'DisputeResolved(',
  'EmployerBurned(',
  'safeMintCompletionNFT('
];

const requiredSnippetsByFile = {
  'README.md': ['release:readiness', 'release:deploy:mainnet'],
  'MAINNET_DEPLOYMENT_CHECKLIST.md': ['npm run release:build', 'npm run release:readiness'],
  'hardhat/README.md': ['DEPLOY_CONFIRM_MAINNET', 'I_UNDERSTAND_MAINNET_DEPLOYMENT']
};

let failed = false;

for (const relativeFile of canonicalFiles) {
  const fullPath = path.join(root, relativeFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing canonical doc for surface sync check: ${relativeFile}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  for (const snippet of forbiddenSnippets) {
    if (content.includes(snippet)) {
      console.error(`❌ Stale canonical reference found in ${relativeFile}: ${snippet}`);
      failed = true;
    }
  }

  const required = requiredSnippetsByFile[relativeFile] || [];
  for (const snippet of required) {
    if (!content.includes(snippet)) {
      console.error(`❌ Missing canonical reference in ${relativeFile}: ${snippet}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);

console.log('✅ Canonical surface sync checks passed');
