const fs = require("fs");
const path = require("path");

const MAX_RUNTIME_BYTES = 24576;
const MAX_INITCODE_BYTES = 49152;
const TARGET_RUNTIME_BYTES = 23000;
const TARGET_INITCODE_BYTES = 46000;
const artifactsDir = path.join(__dirname, "..", "build", "contracts");
const IGNORED_CONTRACTS = new Set(["ReputationHarness"]);

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
    return 0;
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
  const hex = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  if (!hex) {
    return 0;
  }
  return hex.length / 2;
}

if (!fs.existsSync(artifactsDir)) {
  console.error(`Missing Truffle artifacts directory: ${artifactsDir}`);
  process.exit(1);
}

const oversized = [];
const overInitcode = [];
const overPreferred = [];
const artifacts = fs.readdirSync(artifactsDir).filter((file) => file.endsWith(".json"));
for (const file of artifacts) {
  const artifactPath = path.join(artifactsDir, file);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const name = artifact.contractName || path.basename(file, ".json");
  const sizeBytes = deployedSizeBytes(artifact);
  const initcodeBytes = initcodeSizeBytes(artifact);
  console.log(`${name} deployedBytecode size: ${sizeBytes} bytes`);
  console.log(`${name} initcode size: ${initcodeBytes} bytes`);
  if (sizeBytes > MAX_RUNTIME_BYTES && !IGNORED_CONTRACTS.has(name)) {
    oversized.push({ name, sizeBytes });
  }
  if (initcodeBytes > MAX_INITCODE_BYTES && !IGNORED_CONTRACTS.has(name)) {
    overInitcode.push({ name, initcodeBytes });
  }
  if (
    !IGNORED_CONTRACTS.has(name) &&
    (sizeBytes > TARGET_RUNTIME_BYTES || initcodeBytes > TARGET_INITCODE_BYTES)
  ) {
    overPreferred.push({ name, sizeBytes, initcodeBytes });
  }
}

if (oversized.length) {
  console.error(`Contracts exceeding runtime limit ${MAX_RUNTIME_BYTES} bytes:`);
  for (const { name, sizeBytes } of oversized) {
    console.error(`- ${name}: ${sizeBytes} bytes`);
  }
  process.exit(1);
}

if (overInitcode.length) {
  console.error(`Contracts exceeding initcode limit ${MAX_INITCODE_BYTES} bytes:`);
  for (const { name, initcodeBytes } of overInitcode) {
    console.error(`- ${name}: ${initcodeBytes} bytes`);
  }
  process.exit(1);
}

for (const { name, sizeBytes, initcodeBytes } of overPreferred) {
  console.warn(
    `Warning: ${name} exceeds preferred budget (runtime ${sizeBytes}/${TARGET_RUNTIME_BYTES}, initcode ${initcodeBytes}/${TARGET_INITCODE_BYTES})`
  );
}
