const fs = require("fs");
const path = require("path");

const MAX_RUNTIME_BYTES = 24_576;
const MAX_INITCODE_BYTES = 49_152;
const PREFERRED_RUNTIME_BYTES = 23_000;
const PREFERRED_INITCODE_BYTES = 46_000;
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
  const hex = bytecode.startsWith("0x")
    ? bytecode.slice(2)
    : bytecode;
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
const preferredWarnings = [];
const artifacts = fs.readdirSync(artifactsDir).filter((file) => file.endsWith(".json"));
for (const file of artifacts) {
  const artifactPath = path.join(artifactsDir, file);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const name = artifact.contractName || path.basename(file, ".json");
  const runtimeBytes = deployedSizeBytes(artifact);
  const initcodeBytes = initcodeSizeBytes(artifact);
  console.log(
    `${name} runtime=${runtimeBytes} bytes, initcode=${initcodeBytes} bytes`
  );
  if (
    !IGNORED_CONTRACTS.has(name) &&
    (runtimeBytes > PREFERRED_RUNTIME_BYTES || initcodeBytes > PREFERRED_INITCODE_BYTES)
  ) {
    preferredWarnings.push({ name, runtimeBytes, initcodeBytes });
  }
  if (
    !IGNORED_CONTRACTS.has(name) &&
    (runtimeBytes > MAX_RUNTIME_BYTES || initcodeBytes > MAX_INITCODE_BYTES)
  ) {
    oversized.push({ name, runtimeBytes, initcodeBytes });
  }
}

if (oversized.length) {
  console.error(
    `Contracts exceeding hard limits (runtime ${MAX_RUNTIME_BYTES}, initcode ${MAX_INITCODE_BYTES}):`
  );
  for (const { name, runtimeBytes, initcodeBytes } of oversized) {
    console.error(`- ${name}: runtime=${runtimeBytes}, initcode=${initcodeBytes}`);
  }
  process.exit(1);
}

if (preferredWarnings.length) {
  console.warn(
    `Preferred size budget warnings (runtime>${PREFERRED_RUNTIME_BYTES} or initcode>${PREFERRED_INITCODE_BYTES}):`
  );
  for (const { name, runtimeBytes, initcodeBytes } of preferredWarnings) {
    console.warn(`- ${name}: runtime=${runtimeBytes}, initcode=${initcodeBytes}`);
  }
}
