# Hardhat Deploy Runbook — Corrected Successor v0.2.0

## Canonical flow
1. `npm run doctor`
2. `npm run release:build`
3. `npm run release:dry-run`
4. `DEPLOY_CONFIRM_MAINNET=I_UNDERSTAND_MAINNET_DEPLOYMENT npm run release:deploy:mainnet`
5. `npm run release:verify`
6. `npm run release:postdeploy`
7. `npm run release:readiness`

## Required postdeploy assertions
- AGIJobManager address and owner match expected values.
- `employerBurnBps` configured as intended.
- `lockedBurnReserve` starts at zero and is included in solvency accounting.
- ENS wiring points to intended `ENSJobPages` instance.
