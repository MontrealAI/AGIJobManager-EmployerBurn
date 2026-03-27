/* eslint-disable no-console */
const hre = require('hardhat');

async function main() {
  const managerAddress = process.env.AGI_JOB_MANAGER_ADDRESS;
  if (!managerAddress) {
    throw new Error('AGI_JOB_MANAGER_ADDRESS is required');
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
