const fs = require('fs');
const path = require('path');

const MAX_RUNTIME_BYTES = 24_576; // EIP-170
const MAX_INITCODE_BYTES = 49_152; // EIP-3860
const TARGET_RUNTIME_BYTES = 23_000;
const TARGET_INITCODE_BYTES = 46_000;

const defaultContracts = ['AGIJobManager', 'EmployerBurnReadHelper', 'ENSJobPages', 'AGIJobPages'];

function resolveArtifactPath(contractName) {
  const hardhatContractsRoot = path.join(__dirname, '..', 'hardhat', 'artifacts', 'contracts');
  if (fs.existsSync(hardhatContractsRoot)) {
    const stack = [hardhatContractsRoot];
    while (stack.length) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          stack.push(fullPath);
          continue;
        }
        if (entry.isFile() && entry.name === `${contractName}.json`) {
          return { path: fullPath, kind: 'hardhat' };
        }
      }
    }
  }
  const trufflePath = path.join(__dirname, '..', 'build', 'contracts', `${contractName}.json`);
  if (fs.existsSync(trufflePath)) {
    return { path: trufflePath, kind: 'truffle' };
  }
  throw new Error(`Missing artifact for ${contractName} in hardhat/artifacts or build/contracts`);
}

function hexSizeBytes(hexLike, label, contractName) {
  if (!hexLike) throw new Error(`Missing ${label} in artifact for ${contractName}`);
  const hex = hexLike.startsWith('0x') ? hexLike.slice(2) : hexLike;
  return hex.length / 2;
}

function loadArtifact(contractName) {
  const resolved = resolveArtifactPath(contractName);
  const artifact = JSON.parse(fs.readFileSync(resolved.path, 'utf8'));
  return { artifact, source: resolved.kind, artifactPath: resolved.path };
}

function deployedSizeBytes(artifact) {
  return hexSizeBytes(artifact.deployedBytecode, 'deployedBytecode', artifact.contractName);
}

function initcodeSizeBytes(artifact) {
  return hexSizeBytes(artifact.bytecode, 'bytecode', artifact.contractName);
}

function loadBaseline() {
  const baselinePath = path.join(__dirname, '..', 'hardhat', 'deployments', 'size-baseline.json');
  if (!fs.existsSync(baselinePath)) return null;
  return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}

const targets = process.env.BYTECODE_CONTRACTS
  ? process.env.BYTECODE_CONTRACTS.split(',').map((s) => s.trim()).filter(Boolean)
  : defaultContracts;

const oversized = [];
const overInitcode = [];
const overTarget = [];
const growthViolations = [];
const baseline = loadBaseline();

for (const contractName of targets) {
  const { artifact, source, artifactPath } = loadArtifact(contractName);
  const runtimeBytes = deployedSizeBytes(artifact);
  const initcodeBytes = initcodeSizeBytes(artifact);
  console.log(`${contractName} (${source}) runtime=${runtimeBytes} initcode=${initcodeBytes}`);
  console.log(`  artifact=${artifactPath}`);

  if (runtimeBytes > MAX_RUNTIME_BYTES) oversized.push({ name: contractName, runtimeBytes });
  if (initcodeBytes > MAX_INITCODE_BYTES) overInitcode.push({ name: contractName, initcodeBytes });
  if (runtimeBytes > TARGET_RUNTIME_BYTES || initcodeBytes > TARGET_INITCODE_BYTES) {
    overTarget.push({ name: contractName, runtimeBytes, initcodeBytes });
  }

  if (baseline?.[contractName]) {
    const b = baseline[contractName];
    if (runtimeBytes > b.runtimeBytes || initcodeBytes > b.initcodeBytes) {
      growthViolations.push({
        name: contractName,
        runtimeBytes,
        initcodeBytes,
        baselineRuntime: b.runtimeBytes,
        baselineInitcode: b.initcodeBytes,
      });
    }
  }
}

if (oversized.length || overInitcode.length || growthViolations.length) {
  if (oversized.length) {
    console.error(`Runtime bytecode exceeds EIP-170 limit ${MAX_RUNTIME_BYTES}:`);
    oversized.forEach((x) => console.error(`- ${x.name}: ${x.runtimeBytes}`));
  }
  if (overInitcode.length) {
    console.error(`Initcode exceeds EIP-3860 limit ${MAX_INITCODE_BYTES}:`);
    overInitcode.forEach((x) => console.error(`- ${x.name}: ${x.initcodeBytes}`));
  }
  if (growthViolations.length) {
    console.error('No-growth guard violated versus hardhat/deployments/size-baseline.json:');
    growthViolations.forEach((x) => {
      console.error(`- ${x.name}: runtime ${x.runtimeBytes} > ${x.baselineRuntime} or initcode ${x.initcodeBytes} > ${x.baselineInitcode}`);
    });
  }
  process.exit(1);
}

for (const entry of overTarget) {
  console.warn(`Warning: ${entry.name} exceeds preferred budget runtime ${entry.runtimeBytes}/${TARGET_RUNTIME_BYTES}, initcode ${entry.initcodeBytes}/${TARGET_INITCODE_BYTES}`);
}

console.log('✅ Bytecode size checks passed against EIP-170/EIP-3860 hard limits.');
