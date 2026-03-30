# v0.2.0 Mainnet Release Runbook (Completion-only Employer Burn)

## Canonical commands
```bash
npm run doctor
npm run release:build
npm run release:dry-run
DEPLOY_CONFIRM_MAINNET=I_UNDERSTAND_MAINNET_DEPLOYMENT npm run release:deploy:mainnet
npm run release:verify
npm run release:postdeploy
npm run release:readiness
```

## Post-deploy checks (Etherscan)
1. Confirm `owner()` equals intended final owner.
2. Confirm `employerBurnBps()` value.
3. Confirm `lockedBurnReserves()` starts at `0` before first job.
4. Deploy/read `EmployerBurnReadHelper` against new manager.
5. Validate `quoteCompletionBurn(jobId)` and `getEmployerUpfrontFundingRequirement(jobId)` on test job.

## ENS compatibility/cutover
- If using existing ENSJobPages:
  - `ENSJobPages.setJobManager(newManager)`
  - `newManager.setEnsJobPages(existingEnsJobPages)`
