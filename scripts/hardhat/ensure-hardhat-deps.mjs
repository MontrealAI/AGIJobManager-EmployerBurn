#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const hardhatDir = path.join(root, 'hardhat');
const hardhatBin = path.join(hardhatDir, 'node_modules', '.bin', process.platform === 'win32' ? 'hardhat.cmd' : 'hardhat');

if (fs.existsSync(hardhatBin)) {
  console.log('✅ hardhat dependencies already installed');
  process.exit(0);
}

console.log('ℹ️ hardhat binary not found; installing hardhat workspace dependencies...');
const res = spawnSync('npm', ['--prefix', 'hardhat', 'ci', '--no-audit', '--no-fund'], {
  stdio: 'inherit',
  env: process.env,
});

if (res.status !== 0) {
  console.error('❌ Failed to install hardhat workspace dependencies');
  process.exit(res.status ?? 1);
}

if (!fs.existsSync(hardhatBin)) {
  console.error('❌ hardhat binary still missing after install');
  process.exit(1);
}

console.log('✅ hardhat dependencies installed');
