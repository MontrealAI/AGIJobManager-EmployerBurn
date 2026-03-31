#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const commands = [
  ['node', ['scripts/hardhat/release-doctor.mjs']],
  ['npm', ['run', 'build:hardhat']],
  ['npm', ['run', 'size']],
  ['npm', ['run', 'docs:check']],
  ['npm', ['run', 'docs:ens:check']],
  ['npm', ['run', 'test:employerburn']],
  ['npx', ['truffle', 'test', 'test/deployScripts.safety.test.js', '--network', 'test']],
  ['npm', ['run', 'release:verify']],
  ['npm', ['run', 'release:postdeploy']]
];

const strictSuccessor = process.env.RELEASE_SUCCESSOR_STRICT === '1';
const strictSuccessorForFreshDeployment =
  strictSuccessor && process.env.RELEASE_EXPECT_FRESH_DEPLOYMENT === '1';

for (const [cmd, args] of commands) {
  console.log(`\n▶ ${cmd} ${args.join(' ')}`);
  const env = {
    ...process.env,
    ...(strictSuccessorForFreshDeployment && cmd === 'npm' && args.join(' ') === 'run release:postdeploy'
      ? { POSTDEPLOY_REQUIRE_SUCCESSOR_HELPER: '1' }
      : {})
  };
  const out = spawnSync(cmd, args, { stdio: 'inherit', env });
  if (out.status !== 0) {
    console.error(`\n❌ Release readiness failed at: ${cmd} ${args.join(' ')}`);
    process.exit(out.status ?? 1);
  }
}

console.log('\n✅ Release readiness checks passed.');
if (strictSuccessor && !strictSuccessorForFreshDeployment) {
  console.log(
    'ℹ️ Successor strict mode ran in repository-readiness mode. ' +
    'Set RELEASE_EXPECT_FRESH_DEPLOYMENT=1 to enforce postdeploy helper-address presence for a newly generated deployment receipt.'
  );
}
