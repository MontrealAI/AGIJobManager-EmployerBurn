const assert = require('assert');
const fs = require('fs');
const path = require('path');

contract('Hardhat deploy scripts safety checks', () => {
  const deployScript = fs.readFileSync(path.join(__dirname, '..', 'hardhat', 'scripts', 'deploy.js'), 'utf8');
  const ensDeployScript = fs.readFileSync(path.join(__dirname, '..', 'hardhat', 'scripts', 'deploy-ens-job-pages.js'), 'utf8');

  it('deploy.js keeps explicit mainnet confirmation gate', () => {
    assert(deployScript.includes('DEPLOY_CONFIRM_MAINNET'));
    assert(deployScript.includes('I_UNDERSTAND_MAINNET_DEPLOYMENT'));
  });

  it('deploy.js blocks implicit example config on mainnet', () => {
    assert(deployScript.includes('Mainnet deployment requires an explicit DEPLOY_CONFIG file path'));
    assert(deployScript.includes('Mainnet deployment cannot use deploy.config.example.js'));
  });

  it('deploy.js enforces compiler parity against hardhat config', () => {
    assert(deployScript.includes('assertCompilerMatchesHardhatConfig'));
    assert(deployScript.includes('Hardhat compiler mismatch detected. Deployment halted.'));
  });

  it('deploy.js writes deployment receipt and supports verify path', () => {
    assert(deployScript.includes('deployment.${chainId}.${managerDeployment.blockNumber}.json'));
    assert(deployScript.includes("run('verify:verify'"));
  });

  it('deploy-ens-job-pages.js requires explicit mainnet JOB_MANAGER/JOBS_ROOT_NAME/JOBS_ROOT_NODE', () => {
    assert(ensDeployScript.includes('Mainnet deploy requires explicit JOB_MANAGER environment variable'));
    assert(ensDeployScript.includes('Mainnet deploy requires explicit JOBS_ROOT_NAME and JOBS_ROOT_NODE'));
  });

  it('deploy-ens-job-pages.js rejects root name/root node mismatch and prints manual cutover steps', () => {
    assert(ensDeployScript.includes('JOBS_ROOT_NODE mismatch for JOBS_ROOT_NAME'));
    assert(ensDeployScript.includes('Manual cutover steps (not automated by this script):'));
    assert(ensDeployScript.includes('setApprovalForAll(newEnsJobPages, true)'));
    assert(ensDeployScript.includes('setEnsJobPages(newEnsJobPages)'));
  });
});
