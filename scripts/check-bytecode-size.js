const fs = require("fs");
const path = require("path");

const MAX_RUNTIME_BYTES = 24_576;
const MAX_INITCODE_BYTES = 49_152;
const PREFERRED_RUNTIME_BYTES = 23_000;
const PREFERRED_INITCODE_BYTES = 46_000;
const artifactsDir = path.join(__dirname, "..", "build", "contracts");
const defaultContracts = ["AGIJobManager"];

function deployedSizeBytes(artifact) {
  const deployedBytecode =
    artifact.deployedBytecode || artifact.evm?.deployedBytecode?.object;
  if (!deployedBytecode) {
    throw new Error(
      `Missing deployedBytecode in artifact for ${artifact.contractName || "unknown"}`
    );
  }
  const hex = deployedBytecode.startsWith("0x")
    ? deployedBytecode.slice(2)
    : deployedBytecode;
  if (!hex) {
    throw new Error(
      `Empty deployedBytecode in artifact for ${artifact.contractName || "unknown"}`
    );
  }
  return hex.length / 2;
}

function initcodeSizeBytes(artifact) {
  const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object;
  if (!bytecode) {
    throw new Error(
      `Missing bytecode in artifact for ${artifact.contractName || "unknown"}`
    );
  }
  const hex = bytecode.startsWith("0x")
    ? bytecode.slice(2)
    : bytecode;
  if (!hex) {
    throw new Error(
      `Empty bytecode in artifact for ${artifact.contractName || "unknown"}`
    );
  }
  return hex.length / 2;
}

function loadArtifact(contractName) {
  const artifactPath = path.join(artifactsDir, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Missing artifact for ${contractName}: ${artifactPath}`);
  }
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

const targets = process.env.BYTECODE_CONTRACTS
  ? process.env.BYTECODE_CONTRACTS.split(",").map((entry) => entry.trim()).filter(Boolean)
  : defaultContracts;

if (!fs.existsSync(artifactsDir)) {
  console.error(`Missing Truffle artifacts directory: ${artifactsDir}`);
  process.exit(1);
}

const limitFailures = [];
for (const contractName of targets) {
  const artifact = loadArtifact(contractName);
  const runtimeBytes = deployedSizeBytes(artifact);
  const initcodeBytes = initcodeSizeBytes(artifact);
  const runtimeHeadroom = MAX_RUNTIME_BYTES - runtimeBytes;
  const initcodeHeadroom = MAX_INITCODE_BYTES - initcodeBytes;
  console.log(
    `${contractName} runtime=${runtimeBytes}B (headroom ${runtimeHeadroom}B), initcode=${initcodeBytes}B (headroom ${initcodeHeadroom}B)`
  );
  if (runtimeBytes > PREFERRED_RUNTIME_BYTES || initcodeBytes > PREFERRED_INITCODE_BYTES) {
    console.warn(
      `[warn] ${contractName} exceeds preferred budget: runtime<=${PREFERRED_RUNTIME_BYTES}, initcode<=${PREFERRED_INITCODE_BYTES}`
    );
  }
  if (runtimeBytes > MAX_RUNTIME_BYTES || initcodeBytes > MAX_INITCODE_BYTES) {
    limitFailures.push({ name: contractName, runtimeBytes, initcodeBytes });
  }
}

if (limitFailures.length) {
  console.error(
    `Contract size exceeds Ethereum hard limits (runtime ${MAX_RUNTIME_BYTES}, initcode ${MAX_INITCODE_BYTES}):`
  );
  for (const { name, runtimeBytes, initcodeBytes } of limitFailures) {
    console.error(`- ${name}: runtime=${runtimeBytes}, initcode=${initcodeBytes}`);
  }
  process.exit(1);
}
