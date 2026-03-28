# Release Notes — Employer Burn Enforcement Hardening

Date: 2026-03-28

## Summary
- Added Etherscan-first helper views for employer-burn preflight checks.
- Kept employer-burn enforcement on authoritative employer-win settlement path in `AGIJobManager`.
- Reconciled external AGIALPHA token verification notes to dated live-source checks.
- Added `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)` for burn observability on authoritative employer-win paths.
- Reconfirmed contract-size gate status: `AGIJobManager` runtime and initcode are both within Ethereum mainnet hard limits (EIP-170/EIP-3860).
- Added explicit regression coverage for paused-token behavior: employer-win settlement now has a dedicated test asserting atomic revert when token pause blocks `burnFrom`.

## Contract interface additions
- New additive periphery contract: `EmployerBurnReadHelper`.
- `quoteEmployerBurn(uint256 jobId)`
- `getEmployerBurnRequirements(uint256 jobId)`
- `getEmployerBurnReadiness(uint256 jobId)`
- `canFinalizeEmployerWinWithBurn(uint256 jobId)`

## Compatibility
- Backward-compatible with existing employer-burn behavior.
- No migration of existing job state required.

## Operator action
- Continue approving AGIJobManager on AGIALPHA from employer wallet.
- Use helper views before attempting employer-win finalization/dispute settlement.
- Monitor `EmployerBurnEnforced` during employer-win settlements to confirm payer, token, amount, caller, and path code.
