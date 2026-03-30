#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const network = process.env.DEPLOY_NETWORK || 'mainnet';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const dir = path.join(root, 'hardhat', 'deployments', network);

if (!fs.existsSync(dir)) {
  console.error(`❌ Missing deployment directory: ${dir}`);
  process.exit(1);
}

const deploymentFiles = fs
  .readdirSync(dir)
  .filter((name) => name.startsWith('deployment.') && name.endsWith('.json'))
  .map((name) => {
    const match = /^deployment\.(\d+)\.(\d+)\.json$/.exec(name);
    return {
      name,
      chainId: match ? Number(match[1]) : Number.NaN,
      blockNumber: match ? Number(match[2]) : Number.NaN,
    };
  })
  .filter((entry) => Number.isFinite(entry.blockNumber))
  .sort((a, b) => a.blockNumber - b.blockNumber);

if (!deploymentFiles.length) {
  console.error(`❌ No deployment.<chainId>.<blockNumber>.json files found in ${dir}`);
  process.exit(1);
}

const latest = deploymentFiles[deploymentFiles.length - 1];
const deployment = JSON.parse(fs.readFileSync(path.join(dir, latest.name), 'utf8'));

const requiredKeys = ['network', 'chainId', 'deployer', 'contracts'];
for (const key of requiredKeys) {
  if (!(key in deployment)) {
    console.error(`❌ Deployment record missing key: ${key}`);
    process.exit(1);
  }
}

if (!deployment.contracts?.AGIJobManager?.address) {
  console.error('❌ Deployment record missing contracts.AGIJobManager.address');
  process.exit(1);
}
if (!deployment.contracts?.EmployerBurnReadHelper?.address) {
  console.error('❌ Deployment record missing contracts.EmployerBurnReadHelper.address');
  process.exit(1);
}

console.log(`✅ Post-deploy metadata validated from ${latest.name}`);
console.log(`- network: ${deployment.network}`);
console.log(`- chainId: ${deployment.chainId}`);
console.log(`- blockNumber: ${latest.blockNumber}`);
console.log(`- AGIJobManager: ${deployment.contracts.AGIJobManager.address}`);
console.log(`- EmployerBurnReadHelper: ${deployment.contracts.EmployerBurnReadHelper.address}`);

const managerAbiPath = path.join(root, 'hardhat', 'artifacts', 'contracts', 'AGIJobManager.sol', 'AGIJobManager.json');
if (!fs.existsSync(managerAbiPath)) {
  console.error(`❌ Missing ABI artifact: ${managerAbiPath}`);
  process.exit(1);
}
const managerAbi = JSON.parse(fs.readFileSync(managerAbiPath, 'utf8')).abi || [];
const requiredViews = ['getJobEconomicSnapshot'];
for (const fn of requiredViews) {
  if (!managerAbi.some((item) => item.type === 'function' && item.name === fn)) {
    console.error(`❌ Missing required helper view in AGIJobManager ABI: ${fn}`);
    process.exit(1);
  }
}
console.log('✅ createJob economic snapshot view present in AGIJobManager ABI.');

const helperAbiPath = path.join(
  root,
  'hardhat',
  'artifacts',
  'contracts',
  'periphery',
  'EmployerBurnReadHelper.sol',
  'EmployerBurnReadHelper.json'
);
if (!fs.existsSync(helperAbiPath)) {
  console.error(`❌ Missing ABI artifact: ${helperAbiPath}`);
  process.exit(1);
}
const helperAbi = JSON.parse(fs.readFileSync(helperAbiPath, 'utf8')).abi || [];
for (const fn of ['quoteCreateJobFunding', 'getCreateJobFundingReadiness']) {
  if (!helperAbi.some((item) => item.type === 'function' && item.name === fn)) {
    console.error(`❌ Missing helper function in EmployerBurnReadHelper ABI: ${fn}`);
    process.exit(1);
  }
}
console.log('✅ createJob funding helper views present in EmployerBurnReadHelper ABI.');

const verifyTargetsPath = path.join(dir, 'verify-targets.json');
if (!fs.existsSync(verifyTargetsPath)) {
  console.error(`❌ Missing verify-targets.json in ${dir}`);
  process.exit(1);
}
console.log('✅ verify-targets.json present.');
