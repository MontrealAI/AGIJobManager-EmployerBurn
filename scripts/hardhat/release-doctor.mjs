#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const requiredMainnetEnv = ['MAINNET_RPC_URL', 'PRIVATE_KEY', 'ETHERSCAN_API_KEY'];
const strictMainnetEnv = process.env.DOCTOR_STRICT_MAINNET_ENV === '1';
const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const hardhatDir = path.join(repoRoot, 'hardhat');
const hardhatConfig = path.join(hardhatDir, 'hardhat.config.js');
const deployScript = path.join(hardhatDir, 'scripts', 'deploy.js');

let failed = false;

function check(msg, ok, detail = '') {
  const prefix = ok ? '✅' : '❌';
  console.log(`${prefix} ${msg}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed = true;
}

check('Hardhat workspace exists', fs.existsSync(hardhatDir), hardhatDir);
check('Hardhat config exists', fs.existsSync(hardhatConfig), hardhatConfig);
check('Canonical deploy script exists', fs.existsSync(deployScript), deployScript);

const nodeMajor = Number(process.versions.node.split('.')[0]);
check('Node.js major version is >= 20', Number.isFinite(nodeMajor) && nodeMajor >= 20, process.versions.node);

for (const envName of requiredMainnetEnv) {
  const present = Boolean(process.env[envName]);
  if (strictMainnetEnv) {
    check(`Env ${envName} is set`, present, present ? 'present' : 'missing');
  } else {
    console.log(`${present ? '✅' : '⚠️'} Env ${envName} ${present ? 'is set' : 'is not set'}${present ? ' — present' : ' — optional unless running strict doctor/deploy'}`);
  }
}

const confirm = process.env.DEPLOY_CONFIRM_MAINNET;
if (!confirm) {
  console.log('⚠️ DEPLOY_CONFIRM_MAINNET is not set (required for live mainnet deploy steps).');
} else {
  check(
    'DEPLOY_CONFIRM_MAINNET has exact safety phrase',
    confirm === 'I_UNDERSTAND_MAINNET_DEPLOYMENT',
    confirm
  );
}

if (failed) {
  console.error('\nDoctor checks failed. Fix the ❌ items before release.');
  process.exit(1);
}

console.log('\nAll mandatory doctor checks passed.');
