#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const AGIALPHA_MAINNET = '0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA';
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

console.log(`✅ Post-deploy metadata validated from ${latest.name}`);
console.log(`- network: ${deployment.network}`);
console.log(`- chainId: ${deployment.chainId}`);
console.log(`- blockNumber: ${latest.blockNumber}`);
console.log(`- AGIJobManager: ${deployment.contracts.AGIJobManager.address}`);

const verifyTargetsPath = path.join(dir, 'verify-targets.json');
if (!fs.existsSync(verifyTargetsPath)) {
  console.error(`❌ Missing verify-targets.json in ${dir}`);
  process.exit(1);
}
console.log('✅ verify-targets.json present.');

if (!deployment.finalOwner) {
  console.error('❌ Deployment record missing finalOwner');
  process.exit(1);
}
console.log(`✅ finalOwner recorded: ${deployment.finalOwner}`);

if (typeof deployment.constructorArgs?.agiTokenAddress !== 'string') {
  console.error('❌ Deployment record missing constructorArgs.agiTokenAddress');
  process.exit(1);
}
const configuredToken = deployment.constructorArgs.agiTokenAddress;
console.log(`✅ agiTokenAddress recorded: ${configuredToken}`);
if (deployment.chainId === 1 && configuredToken.toLowerCase() !== AGIALPHA_MAINNET.toLowerCase()) {
  console.error(`❌ Mainnet successor must pin AGIALPHA token ${AGIALPHA_MAINNET}; found ${configuredToken}`);
  process.exit(1);
}
if (deployment.chainId === 1) {
  console.log(`✅ Mainnet AGIALPHA pin confirmed: ${AGIALPHA_MAINNET}`);
}

const verification = deployment.verification?.AGIJobManager?.status;
if (!verification || (verification !== 'verified' && verification !== 'already_verified')) {
  console.error(`❌ AGIJobManager verification status not ready: ${verification || 'missing'}`);
  process.exit(1);
}
console.log(`✅ AGIJobManager verification status: ${verification}`);

const artifactPath = path.join(root, 'hardhat', 'artifacts', 'contracts', 'AGIJobManager.sol', 'AGIJobManager.json');
if (!fs.existsSync(artifactPath)) {
  console.error(`❌ Missing Hardhat artifact for AGIJobManager: ${artifactPath}`);
  process.exit(1);
}
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const selectors = new Set((artifact.abi || []).filter((x) => x.type === 'function').map((x) => x.name));
const requiredHelpers = [
  'getJobBurnBpsSnapshot',
  'getJobBurnTokenSnapshot',
  'updateAGITokenAddress',
  'setEnsJobPages',
];
for (const fn of requiredHelpers) {
  if (!selectors.has(fn)) {
    console.error(`❌ Missing required helper/ENS function in ABI: ${fn}`);
    process.exit(1);
  }
}
console.log('✅ Required create-job burn helpers + ENS wiring function present in ABI.');

const helperArtifactPath = path.join(root, 'hardhat', 'artifacts', 'contracts', 'periphery', 'EmployerBurnReadHelper.sol', 'EmployerBurnReadHelper.json');
if (!fs.existsSync(helperArtifactPath)) {
  console.error(`❌ Missing Hardhat artifact for EmployerBurnReadHelper: ${helperArtifactPath}`);
  process.exit(1);
}
const helperArtifact = JSON.parse(fs.readFileSync(helperArtifactPath, 'utf8'));
const helperSelectors = new Set((helperArtifact.abi || []).filter((x) => x.type === 'function').map((x) => x.name));
for (const fn of ['quoteCreateJobBurn', 'getCreateJobFundingRequirement', 'getCreateJobAllowanceRequirement', 'getJobBurnAmountSnapshot', 'getJobEconomicSnapshot']) {
  if (!helperSelectors.has(fn)) {
    console.error(`❌ Missing required EmployerBurnReadHelper function in ABI: ${fn}`);
    process.exit(1);
  }
}
console.log('✅ EmployerBurnReadHelper createJob-only helper surface present in ABI.');
