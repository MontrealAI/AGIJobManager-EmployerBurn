#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const confirmPhrase = 'I_UNDERSTAND_MAINNET_DEPLOYMENT';
const dryRun = process.env.DRY_RUN === '1';

if (process.env.DEPLOY_CONFIRM_MAINNET !== confirmPhrase) {
  console.error(`❌ Mainnet deploy blocked. Set DEPLOY_CONFIRM_MAINNET=${confirmPhrase}`);
  process.exit(1);
}

console.log(`🚀 Starting ${dryRun ? 'dry-run' : 'live'} mainnet deploy via canonical Hardhat workflow...`);
const result = spawnSync('npm', ['--prefix', 'hardhat', 'run', 'deploy:mainnet'], {
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.error('❌ Mainnet deploy command failed.');
  process.exit(result.status ?? 1);
}

console.log('✅ Mainnet deploy command completed.');
