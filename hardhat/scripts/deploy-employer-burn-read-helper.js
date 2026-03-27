/* eslint-disable no-console */
const hre = require('hardhat');

async function main() {
  const managerAddress = process.env.AGI_JOB_MANAGER_ADDRESS || process.env.JOB_MANAGER;
  if (!managerAddress) {
    throw new Error('AGI_JOB_MANAGER_ADDRESS or JOB_MANAGER is required');
  }
  if (!hre.ethers.isAddress(managerAddress)) {
    throw new Error(`Invalid manager address: ${managerAddress}`);
  }

  const managerCode = await hre.ethers.provider.getCode(managerAddress);
  if (managerCode === '0x') {
    throw new Error(`No contract bytecode at manager address: ${managerAddress}`);
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
