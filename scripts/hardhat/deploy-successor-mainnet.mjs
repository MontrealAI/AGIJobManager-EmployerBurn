#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

console.log('🚀 Deploying corrected successor (createJob-only burn semantics)...');
const result = spawnSync('node', ['scripts/hardhat/deploy-mainnet.mjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    RELEASE_TRACK: 'v0.2.0-successor-createjob-burn'
  },
});

if (result.status !== 0) {
  console.error('❌ Successor deployment command failed.');
  process.exit(result.status ?? 1);
}

console.log('✅ Successor deployment command completed.');
