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
const required = ['AGIJobManager'];

for (const name of required) {
  if (!verifyTargets[name]) {
    console.error(`❌ Missing ${name} entry in verify-targets.json`);
    process.exit(1);
  }
}

console.log(`✅ Loaded verify targets for ${network}:`);
for (const [name, item] of Object.entries(verifyTargets)) {
  console.log(`- ${name}: ${item.address}`);
}

console.log('\nRun Etherscan verification commands from hardhat/ as needed:');
for (const [name, item] of Object.entries(verifyTargets)) {
  console.log(`npx hardhat verify --network ${network} ${item.address}`);
}
