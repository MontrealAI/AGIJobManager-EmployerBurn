# Release Notes — Employer Burn Enforcement Hardening

Date: 2026-03-27

## Summary
- Added Etherscan-first helper views for employer-burn preflight checks.
- Kept employer-burn enforcement on authoritative employer-win settlement path in `AGIJobManager`.

## Contract interface additions
- New additive periphery contract: `EmployerBurnReadHelper`.
- `quoteEmployerBurn(uint256 jobId)`
- `getEmployerBurnRequirements(uint256 jobId)`
- `getEmployerBurnReadiness(uint256 jobId)`
- `canFinalizeEmployerWinWithBurn(uint256 jobId)`

## Compatibility
- Backward-compatible with existing employer-burn behavior.
- Existing `EmployerBurned` event remains unchanged.
- Added additive `EmployerBurnEnforced` event carrying finalizer, token, settlement contract, and outcome code metadata for stronger audit trails.
- No migration of existing job state required.

## Operator action
- Continue approving AGIJobManager on AGIALPHA from employer wallet.
- Use helper views before attempting employer-win finalization/dispute settlement.
