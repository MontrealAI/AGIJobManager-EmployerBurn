#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/hardhat/release-doctor.mjs']],
  ['npm', ['run', 'build:hardhat']],
  ['npm', ['run', 'size']],
  ['npm', ['run', 'docs:check']],
  ['npx', ['truffle', 'test', 'test/employerBurn.finalization.test.js', '--network', 'test']]
];

for (const [cmd, args] of commands) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const out = spawnSync(cmd, args, { stdio: 'inherit', env: process.env });
  if (out.status !== 0) {
    console.error(`\n❌ Release readiness failed at: ${cmd} ${args.join(' ')}`);
    process.exit(out.status ?? 1);
  }
}

console.log('\n✅ Release readiness checks passed.');
