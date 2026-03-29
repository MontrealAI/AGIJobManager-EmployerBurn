import { execSync } from 'node:child_process';

const checks = [
  'npm run release:doctor',
  'npm run release:build',
  'npm run release:size',
  'npm run docs:check',
  'npm run lint',
  'npm run test:burn',
];

for (const cmd of checks) {
  console.log(`\n=== ${cmd} ===`);
  execSync(cmd, { stdio: 'inherit' });
}

console.log('\n✅ Release readiness checks passed');
