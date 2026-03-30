import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AGIALPHA_MAINNET = '0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA';

const requiredSnippets = [
  ['README.md', ['v0.2.0', 'CompletionBurnExecuted', 'quoteCompletionBurn(jobId)']],
  ['docs/ETHERSCAN_GUIDE.md', ['CompletionBurnExecuted', 'CompletionBurnReserveRefunded', 'canFinalizeSuccessfulCompletion(jobId)']],
  ['docs/OWNER_RUNBOOK.md', ['lockedBurnReserve', 'CompletionBurnReserveRefunded']],
  ['docs/DEPRECATION_NOTICE_v0.1.x_EMPLOYER_WIN_BURN.md', ['v0.1.x', 'wrong for completion-only requirement']],
  ['docs/REFERENCE/ADR_2026-03-30_COMPLETION_ONLY_BURN_RESERVE.md', ['Option B', 'liveness']],
  ['docs/RELEASE_NOTES_v0.2.0_COMPLETION_BURN_ONLY.md', ['completion-only', 'v0.1.x is deprecated']],
  ['docs/REFERENCE/BUG_AUDIT_COMPLETION_BURN_2026-03-30.md', ['_refundEmployer', 'liveness griefing']],
  ['docs/DEPLOYMENT/CORRECTED_SUCCESSOR_v0.2.0_RUNBOOK.md', ['release:build', 'release:postdeploy']],
  ['docs/MIGRATION_TO_V0_2_0_COMPLETION_BURN_ONLY.md', ['setJobManager(newManager)', 'setEnsJobPages(existingEnsJobPages)']],
  ['docs/ETHERSCAN_GUIDE.md', [AGIALPHA_MAINNET]]
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

pass('Completion-only employer-burn canonical docs checks passed');
