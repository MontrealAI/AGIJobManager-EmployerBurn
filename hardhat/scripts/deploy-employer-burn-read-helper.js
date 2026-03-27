/* eslint-disable no-console */
const hre = require('hardhat');

async function main() {
  const rawManagerAddress = process.env.AGI_JOB_MANAGER_ADDRESS || process.env.JOB_MANAGER;
  if (!rawManagerAddress) {
    throw new Error('AGI_JOB_MANAGER_ADDRESS or JOB_MANAGER is required');
  }

  let managerAddress;
  try {
    managerAddress = hre.ethers.getAddress(rawManagerAddress);
  } catch {
    throw new Error(`Invalid manager address: ${rawManagerAddress}`);
  }

  const managerCode = await hre.ethers.provider.getCode(managerAddress);
  if (managerCode === '0x') {
    throw new Error(`No contract code found at manager address: ${managerAddress}`);
  }

  const Helper = await hre.ethers.getContractFactory('EmployerBurnReadHelper');
  const helper = await Helper.deploy(managerAddress);
  await helper.waitForDeployment();

  const helperAddress = await helper.getAddress();
  console.log('EmployerBurnReadHelper deployed:', helperAddress);
  console.log('AGIJobManager:', managerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
