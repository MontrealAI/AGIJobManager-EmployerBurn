#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const network = process.env.DEPLOY_NETWORK || 'mainnet';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const dir = path.join(root, 'hardhat', 'deployments', network);
const verifyTargetsPath = path.join(dir, 'verify-targets.json');

if (!fs.existsSync(verifyTargetsPath)) {
  console.error(`❌ Missing verify targets: ${verifyTargetsPath}`);
  process.exit(1);
}

const verifyTargets = JSON.parse(fs.readFileSync(verifyTargetsPath, 'utf8'));
const targets = Array.isArray(verifyTargets.targets) ? verifyTargets.targets : [];
if (!targets.length) {
  console.error('❌ verify-targets.json has no targets array entries');
  process.exit(1);
}

const managerTarget = targets.find((item) => item?.name === 'AGIJobManager');
if (!managerTarget) {
  console.error('❌ Missing AGIJobManager entry in verify-targets.json targets[]');
  process.exit(1);
}
if (!managerTarget.address || typeof managerTarget.address !== 'string') {
  console.error('❌ AGIJobManager target is missing a usable address in verify-targets.json targets[]');
  process.exit(1);
}

console.log(`✅ Loaded verify targets for ${network} (chainId=${verifyTargets.chainId ?? 'unknown'}):`);
for (const item of targets) {
  if (!item?.name || !item?.address) continue;
  console.log(`- ${item.name}: ${item.address}`);
}

console.log('\nRun Etherscan verification commands from hardhat/ as needed:');
for (const item of targets) {
  if (!item?.address) continue;
  console.log(`npx hardhat verify --network ${network} ${item.address}`);
}
