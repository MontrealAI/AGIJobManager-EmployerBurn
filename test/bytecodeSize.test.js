const assert = require("assert");
const fs = require("fs");
const path = require("path");

const MAX_DEPLOYED_BYTES = 24576;
const MAX_INITCODE_BYTES = 49152;
const TARGET_DEPLOYED_BYTES = 23000;
const TARGET_INITCODE_BYTES = 46000;

function deployedSizeBytes(artifact) {
  const deployedBytecode =
    artifact.deployedBytecode || artifact.evm?.deployedBytecode?.object || "";
  const hex = deployedBytecode.startsWith("0x")
    ? deployedBytecode.slice(2)
    : deployedBytecode;
  return hex.length / 2;
}

function initcodeSizeBytes(artifact) {
  const bytecode = artifact.bytecode || artifact.evm?.bytecode?.object || "";
  const hex = bytecode.startsWith("0x") ? bytecode.slice(2) : bytecode;
  return hex.length / 2;
}

function loadArtifact(name) {
  const artifactPath = path.join(
    __dirname,
    "..",
    "build",
    "contracts",
    `${name}.json`
  );
  if (!fs.existsSync(artifactPath)) {
    return null;
  }
  return require(artifactPath);
}

contract("Bytecode size guard", () => {
  it("keeps deployed bytecode within the EIP-170 runtime size limit", () => {
    ["AGIJobManager", "EmployerBurnReadHelper"].forEach((name) => {
      const artifact = loadArtifact(name);
      if (!artifact) {
        return;
      }
      const sizeBytes = deployedSizeBytes(artifact);
      assert(
        sizeBytes <= MAX_DEPLOYED_BYTES,
        `${name} deployedBytecode size ${sizeBytes} bytes exceeds ${MAX_DEPLOYED_BYTES} bytes`
      );
    });
  });

  it("keeps initcode within the EIP-3860 initcode size limit", () => {
    ["AGIJobManager", "EmployerBurnReadHelper"].forEach((name) => {
      const artifact = loadArtifact(name);
      if (!artifact) {
        return;
      }
      const sizeBytes = initcodeSizeBytes(artifact);
      assert(
        sizeBytes <= MAX_INITCODE_BYTES,
        `${name} initcode size ${sizeBytes} bytes exceeds ${MAX_INITCODE_BYTES} bytes`
      );
    });
  });

  it("reports preferred size-headroom budgets", () => {
    ["AGIJobManager", "EmployerBurnReadHelper"].forEach((name) => {
      const artifact = loadArtifact(name);
      if (!artifact) {
        return;
      }
      const runtimeBytes = deployedSizeBytes(artifact);
      const initcodeBytes = initcodeSizeBytes(artifact);
      if (runtimeBytes > TARGET_DEPLOYED_BYTES || initcodeBytes > TARGET_INITCODE_BYTES) {
        // eslint-disable-next-line no-console
        console.warn(
          `${name} exceeds preferred budget (runtime ${runtimeBytes}/${TARGET_DEPLOYED_BYTES}, initcode ${initcodeBytes}/${TARGET_INITCODE_BYTES})`
        );
      }
    });
  });
});
