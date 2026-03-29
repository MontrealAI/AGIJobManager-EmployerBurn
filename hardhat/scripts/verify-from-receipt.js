const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const receiptPath = process.env.DEPLOYMENT_RECEIPT;
  if (!receiptPath) {
    throw new Error('Set DEPLOYMENT_RECEIPT=/absolute/or/relative/path/to/deployment.<chainId>.<block>.json');
  }

  const resolvedPath = path.resolve(process.cwd(), receiptPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Deployment receipt not found: ${resolvedPath}`);
  }

  const record = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const manager = record?.contracts?.AGIJobManager;
  if (!manager?.address) {
    throw new Error('Receipt missing contracts.AGIJobManager.address');
  }

  const libraries = record?.libraries;
  const constructorArgs = [
    record.constructorArgs.agiTokenAddress,
    record.constructorArgs.baseIpfsUrl,
    record.constructorArgs.ensConfig,
    record.constructorArgs.rootNodes,
    record.constructorArgs.merkleRoots,
  ];

  console.log(`Verifying AGIJobManager at ${manager.address} from receipt ${resolvedPath}`);

  await hre.run('verify:verify', {
    address: manager.address,
    constructorArguments: constructorArgs,
    libraries,
    contract: 'contracts/AGIJobManager.sol:AGIJobManager',
  });

  console.log('✅ verify-from-receipt complete');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
