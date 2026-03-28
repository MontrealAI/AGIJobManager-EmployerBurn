# Release Notes — Employer Burn Enforcement Hardening

Date: 2026-03-28

## Summary
- Added Etherscan-first helper views for employer-burn preflight checks.
- Kept employer-burn enforcement on authoritative employer-win settlement path in `AGIJobManager`.
- Reconciled external AGIALPHA token verification notes to dated live-source checks.
- Reconfirmed contract-size gate status: `AGIJobManager` runtime currently exceeds EIP-170 and remains a release blocker.

## Contract interface additions
- New additive periphery contract: `EmployerBurnReadHelper`.
- `quoteEmployerBurn(uint256 jobId)`
- `getEmployerBurnRequirements(uint256 jobId)`
- `getEmployerBurnReadiness(uint256 jobId)`
- `canFinalizeEmployerWinWithBurn(uint256 jobId)`

## Compatibility
- Backward-compatible with existing employer-burn behavior.
- Existing `EmployerBurned` event remains unchanged.
- No migration of existing job state required.

## Operator action
- Continue approving AGIJobManager on AGIALPHA from employer wallet.
- Use helper views before attempting employer-win finalization/dispute settlement.
- Treat size-gate failure as a hard stop for new mainnet deployments until runtime bytecode is reduced below 24,576 bytes.
