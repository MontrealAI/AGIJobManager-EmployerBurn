# Mainnet Deployment Checklist

## EmployerBurn-specific preflight

- Confirm the AGIALPHA mainnet token address is `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.
- Confirm `employerBurnBps` policy is decided and documented before production traffic.
- Confirm employer guidance includes separate burn allowance/balance requirements beyond payout escrow.
- Confirm event monitoring includes `EmployerBurnEnforced` for employer-win burn observability.
- Confirm `npm run size` passes EIP-170 runtime cap (24,576 bytes) and EIP-3860 initcode cap (49,152 bytes) before deploying on Ethereum mainnet.
- Authoritative limit references: EIP-170 (`https://eips.ethereum.org/EIPS/eip-170`) and EIP-3860 (`https://eips.ethereum.org/EIPS/eip-3860`).
- Confirm `npm run size` also passes the no-growth guard in `scripts/size-baseline.json` (AGIJobManager runtime growth currently locked to +0 bytes unless intentionally re-baselined).

- Transfer contract ownership to a multisig (e.g., Safe), not an EOA.
- Decide whether to keep `useEnsJobTokenURI` disabled at launch; if enabling, confirm `ensJobPages` is the intended contract.
- ENS configuration verification:
  - Jobs root node is owned or wrapped by the expected entity.
  - Resolver is set correctly for the root and job subdomains.
  - Job manager address is configured in the ENS job pages contract (if used).
  - ENS job pages address is non-zero and has contract code when enabled.
- Run Slither and unit tests; include at least one invariant-style test focused on solvency
  (contract balance >= lockedEscrow + locked*Bonds) and settlement flows.
- Obtain an external audit or review before deploying funds at scale.

## Canonical Hardhat release gate commands

Run these from repository root before any Ethereum mainnet deployment:

- `npm run doctor`
- `npm run release:build`
- `npm run release:dry-run`
- `npm run release:readiness`

For live deploy, require explicit confirmation phrase:

- `DEPLOY_CONFIRM_MAINNET=I_UNDERSTAND_MAINNET_DEPLOYMENT npm run release:deploy:mainnet`
- `npm run release:verify`
- `npm run release:postdeploy`

- v0.2.0 corrective semantics: verify `EmployerBurnChargedAtJobCreation` during createJob posting.
