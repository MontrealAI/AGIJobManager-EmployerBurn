# Mainnet Deployment Checklist

## EmployerBurn-specific preflight

- Confirm AGIALPHA mainnet token is exactly `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.
- Confirm `employerBurnBps` policy (basis points) is approved in writing.
- Confirm employer docs clearly state burn comes from employer wallet authorization (`burnFrom`) and is not paid by protocol escrow or treasury.
- Confirm event monitoring includes `EmployerBurnEnforced`.
- Run canonical hard gates:
  - `npm run release:doctor`
  - `npm run release:build`
  - `npm run release:size`
  - `npm run release:dry-run`
  - `npm run release:ready`

## Before you click **Write** on Etherscan (owner/operator)

- Confirm signer role: deployer vs AGIJobManager owner vs wrapped-root owner.
- Confirm spender address employers must approve is AGIJobManager contract address.
- Confirm employers hold AGIALPHA for both escrow and any configured burn amount.
- Confirm `DEPLOY_CONFIRM_MAINNET=I_UNDERSTAND_MAINNET_DEPLOYMENT` is set for mainnet send scripts.
- Confirm dry-run output matches expected constructor parameters and final owner.

## Deployment + post-deploy

- Execute `npm run release:deploy:mainnet`.
- Save deployment receipt path and rerun explicit verify if needed:
  - `DEPLOYMENT_RECEIPT=<path> npm run release:verify:receipt`
- Run post-deploy contract sanity check:
  - `AGI_JOB_MANAGER_ADDRESS=<deployed_manager> npm run release:postdeploy`

## ENS / ownership operations

- Transfer contract ownership to multisig (Safe), not EOA.
- Complete ENS cutover manual steps in order:
  1. `NameWrapper.setApprovalForAll(newEnsJobPages, true)` by wrapped-root owner.
  2. `AGIJobManager.setEnsJobPages(newEnsJobPages)` by AGIJobManager owner.
  3. Optional legacy migration: `migrateLegacyWrappedJobPage(jobId, exactLabel)`.
- Lock irreversible config only after full validation.

## Human-only sign-offs

- External audit / independent reviewer approval.
- Mainnet transaction review by designated signers.
- Incident-response contacts verified and on call.
