const fs = require('fs');
const path = require('path');

// Active Ethereum mainnet size limits (authoritative specs):
// - EIP-170 (Spurious Dragon): runtime code size <= 24,576 bytes
//   https://eips.ethereum.org/EIPS/eip-170
// - EIP-3860 (Shanghai): initcode size <= 49,152 bytes
//   https://eips.ethereum.org/EIPS/eip-3860
const MAX_RUNTIME_BYTES = 24576;
const MAX_INITCODE_BYTES = 49152;
const TARGET_RUNTIME_BYTES = 23000;
const TARGET_INITCODE_BYTES = 46000;

const artifactFormat = process.env.ARTIFACT_FORMAT || 'hardhat';
const defaultContracts = ['AGIJobManager', 'EmployerBurnReadHelper', 'ENSJobPages', 'AGIJobPages'];
const baselinePath = path.join(__dirname, 'size-baseline.json');
const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : {};

function resolveArtifactPath(contractName) {
  if (artifactFormat === 'truffle') {
    return path.join(__dirname, '..', 'build', 'contracts', `${contractName}.json`);
  }
  if (artifactFormat === 'hardhat') {
    const candidates = [
      path.join(__dirname, '..', 'hardhat', 'artifacts', 'contracts', `${contractName}.sol`, `${contractName}.json`),
      path.join(__dirname, '..', 'hardhat', 'artifacts', 'contracts', 'periphery', `${contractName}.sol`, `${contractName}.json`),
      path.join(__dirname, '..', 'hardhat', 'artifacts', 'contracts', 'ens', `${contractName}.sol`, `${contractName}.json`),
    ];
    return candidates.find((item) => fs.existsSync(item));
  }
  throw new Error(`Unsupported ARTIFACT_FORMAT=${artifactFormat}. Use hardhat or truffle.`);
}

function hexSizeBytes(hexLike, label, contractName) {
  if (!hexLike) throw new Error(`Missing ${label} in artifact for ${contractName}`);
  const hex = hexLike.startsWith('0x') ? hexLike.slice(2) : hexLike;
  return hex.length / 2;
}

function deployedSizeBytes(artifact, contractName) {
  const deployedBytecode = artifact.deployedBytecode || artifact.evm?.deployedBytecode?.object;
  return hexSizeBytes(deployedBytecode, 'deployedBytecode', contractName);
}

function initcodeSizeBytes(artifact, contractName) {
  const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object;
  return hexSizeBytes(bytecode, 'bytecode', contractName);
}

const targets = process.env.BYTECODE_CONTRACTS
  ? process.env.BYTECODE_CONTRACTS.split(',').map((x) => x.trim()).filter(Boolean)
  : defaultContracts;

const oversized = [];
const overInitcode = [];
const overGrowth = [];

console.log(`Checking bytecode using artifact format: ${artifactFormat}`);
for (const contractName of targets) {
  const artifactPath = resolveArtifactPath(contractName);
  if (!artifactPath) throw new Error(`Missing artifact for ${contractName} in ${artifactFormat} layout`);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  const runtimeBytes = deployedSizeBytes(artifact, contractName);
  const initcodeBytes = initcodeSizeBytes(artifact, contractName);
  console.log(`${contractName} runtime bytecode size: ${runtimeBytes} bytes`);
  console.log(`${contractName} initcode size: ${initcodeBytes} bytes`);

  if (runtimeBytes > MAX_RUNTIME_BYTES) oversized.push({ name: contractName, sizeBytes: runtimeBytes });
  if (initcodeBytes > MAX_INITCODE_BYTES) overInitcode.push({ name: contractName, sizeBytes: initcodeBytes });
  if (runtimeBytes > TARGET_RUNTIME_BYTES || initcodeBytes > TARGET_INITCODE_BYTES) {
    console.warn(`Warning: ${contractName} is above preferred budget (runtime ${runtimeBytes}/${TARGET_RUNTIME_BYTES}, initcode ${initcodeBytes}/${TARGET_INITCODE_BYTES})`);
  }

  const sizeBaseline = baseline[contractName];
  if (sizeBaseline) {
    const maxRuntimeGrowth = Number(sizeBaseline.maxRuntimeGrowthBytes ?? 0);
    const maxInitcodeGrowth = Number(sizeBaseline.maxInitcodeGrowthBytes ?? 0);
    const runtimeGrowth = runtimeBytes - Number(sizeBaseline.runtimeBytes);
    const initcodeGrowth = initcodeBytes - Number(sizeBaseline.initcodeBytes);
    if (runtimeGrowth > maxRuntimeGrowth || initcodeGrowth > maxInitcodeGrowth) {
      overGrowth.push({
        name: contractName,
        runtimeBytes,
        initcodeBytes,
        runtimeBaseline: sizeBaseline.runtimeBytes,
        initcodeBaseline: sizeBaseline.initcodeBytes,
        runtimeGrowth,
        initcodeGrowth,
        maxRuntimeGrowth,
        maxInitcodeGrowth,
      });
    }
  }
}

if (oversized.length) {
  console.error(`Runtime bytecode exceeds ${MAX_RUNTIME_BYTES} bytes:`);
  for (const { name, sizeBytes } of oversized) console.error(`- ${name}: ${sizeBytes} bytes`);
  process.exit(1);
}
if (overInitcode.length) {
  console.error(`Initcode exceeds ${MAX_INITCODE_BYTES} bytes:`);
  for (const { name, sizeBytes } of overInitcode) console.error(`- ${name}: ${sizeBytes} bytes`);
  process.exit(1);
}
if (overGrowth.length) {
  console.error('Bytecode growth policy violation(s):');
  for (const g of overGrowth) {
    console.error(`- ${g.name}: runtime ${g.runtimeBytes} (baseline ${g.runtimeBaseline}, growth ${g.runtimeGrowth}, allowed ${g.maxRuntimeGrowth}); initcode ${g.initcodeBytes} (baseline ${g.initcodeBaseline}, growth ${g.initcodeGrowth}, allowed ${g.maxInitcodeGrowth})`);
  }
  console.error(`If this growth is intentional, update ${path.relative(process.cwd(), baselinePath)} with audited new baselines.`);
  process.exit(1);
}
