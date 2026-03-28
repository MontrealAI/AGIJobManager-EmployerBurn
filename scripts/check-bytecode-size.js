const fs = require("fs");
const path = require("path");

const MAX_RUNTIME_BYTES = 24576;
const MAX_INITCODE_BYTES = 49152;
const TARGET_RUNTIME_BYTES = 23000;
const TARGET_INITCODE_BYTES = 46000;
const artifactsDir = path.join(__dirname, "..", "build", "contracts");
const defaultContracts = [
  "AGIJobManager",
  "EmployerBurnReadHelper",
  "ENSJobPages",
  "AGIJobPages"
];

function hexSizeBytes(hexLike, label, contractName) {
  if (!hexLike) {
    throw new Error(`Missing ${label} in artifact for ${contractName || "unknown"}`);
  }
  const hex = hexLike.startsWith("0x") ? hexLike.slice(2) : hexLike;
  if (!hex) {
    throw new Error(`Empty ${label} in artifact for ${contractName || "unknown"}`);
  }
  return hex.length / 2;
}

function deployedSizeBytes(artifact) {
  const deployedBytecode =
    artifact.deployedBytecode || artifact.evm?.deployedBytecode?.object;
  return hexSizeBytes(deployedBytecode, "deployedBytecode", artifact.contractName);
}

function initcodeSizeBytes(artifact) {
  const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object;
  return hexSizeBytes(bytecode, "bytecode", artifact.contractName);
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

const oversized = [];
const overInitcode = [];
const overTarget = [];
for (const contractName of targets) {
  const artifact = loadArtifact(contractName);
  const runtimeBytes = deployedSizeBytes(artifact);
  const initcodeBytes = initcodeSizeBytes(artifact);
  console.log(`${contractName} runtime bytecode size: ${runtimeBytes} bytes`);
  console.log(`${contractName} initcode size: ${initcodeBytes} bytes`);

  if (runtimeBytes > MAX_RUNTIME_BYTES) {
    oversized.push({ name: contractName, sizeBytes: runtimeBytes });
  }
  if (initcodeBytes > MAX_INITCODE_BYTES) {
    overInitcode.push({ name: contractName, sizeBytes: initcodeBytes });
  }
  if (runtimeBytes > TARGET_RUNTIME_BYTES || initcodeBytes > TARGET_INITCODE_BYTES) {
    overTarget.push({ name: contractName, runtimeBytes, initcodeBytes });
  }
}

if (oversized.length) {
  console.error(`Runtime bytecode exceeds ${MAX_RUNTIME_BYTES} bytes:`);
  for (const { name, sizeBytes } of oversized) {
    console.error(`- ${name}: ${sizeBytes} bytes`);
  }
  process.exit(1);
}

if (overInitcode.length) {
  console.error(`Initcode exceeds ${MAX_INITCODE_BYTES} bytes:`);
  for (const { name, sizeBytes } of overInitcode) {
    console.error(`- ${name}: ${sizeBytes} bytes`);
  }
  process.exit(1);
}

if (overTarget.length) {
  for (const { name, runtimeBytes, initcodeBytes } of overTarget) {
    console.warn(
      `Warning: ${name} is above preferred budget (runtime ${runtimeBytes}/${TARGET_RUNTIME_BYTES}, initcode ${initcodeBytes}/${TARGET_INITCODE_BYTES})`
    );
  }
}
