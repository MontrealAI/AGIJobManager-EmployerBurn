#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'package.json');
const releaseReadinessPath = path.join(repoRoot, 'scripts', 'hardhat', 'release-readiness.mjs');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const scripts = pkg.scripts || {};
const releaseReadiness = fs.readFileSync(releaseReadinessPath, 'utf8');

const requiredScripts = [
  'doctor',
  'release:build',
  'release:dry-run',
  'size',
  'release:verify',
  'release:postdeploy',
  'release:readiness',
  'docs:check'
];

const missingScripts = requiredScripts.filter((name) => !scripts[name]);
if (missingScripts.length) {
  console.error(`❌ package.json missing required release scripts: ${missingScripts.join(', ')}`);
  process.exit(1);
}

const requiredReadinessRefs = [
  "['npm', ['run', 'size']]",
  "['npm', ['run', 'docs:check']]",
  "['npm', ['run', 'release:verify']]",
  "['npm', ['run', 'release:postdeploy']]"
];

const missingReadinessRefs = requiredReadinessRefs.filter((needle) => !releaseReadiness.includes(needle));
if (missingReadinessRefs.length) {
  console.error(
    `❌ scripts/hardhat/release-readiness.mjs missing required gate(s): ${missingReadinessRefs.join(', ')}`
  );
  process.exit(1);
}

console.log('✅ Release gate surface checks passed.');
