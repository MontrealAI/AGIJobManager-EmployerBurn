const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  const managerAddress = process.env.AGI_JOB_MANAGER_ADDRESS;
  if (!managerAddress || !ethers.isAddress(managerAddress)) {
    throw new Error('Set AGI_JOB_MANAGER_ADDRESS to a valid deployed AGIJobManager address.');
  }

  const contract = await ethers.getContractAt('AGIJobManager', managerAddress);
  const agiToken = await contract.agiToken();
  const burnBps = await contract.employerBurnBps();
  const settlementPaused = await contract.settlementPaused();

  console.log('=== Post-deploy check ===');
  console.log(`AGIJobManager: ${managerAddress}`);
  console.log(`agiToken: ${agiToken}`);
  console.log(`employerBurnBps: ${burnBps.toString()}`);
  console.log(`settlementPaused: ${settlementPaused}`);

  const output = {
    checkedAt: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    AGIJobManager: managerAddress,
    agiToken,
    employerBurnBps: burnBps.toString(),
    settlementPaused,
  };

  const outDir = path.resolve(__dirname, '..', 'deployments', 'checks');
  fs.mkdirSync(outDir, { recursive: true });
  const filePath = path.join(outDir, `postdeploy.${output.chainId}.${Date.now()}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`✅ wrote ${filePath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
