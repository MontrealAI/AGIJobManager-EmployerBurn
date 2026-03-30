# Release Notes — v0.2.0 (Critical semantic correction)

## Critical correction
- Corrected burn semantics: AGIALPHA burn is now completion-only.
- Burn is Employer-funded via dedicated upfront reserve.
- Burn no longer executes on Employer-refund / Employer-win outcomes.

## Contract-level changes
- Added `lockedBurnReserves` accounting.
- Job creation now escrow-funds payout + burn reserve.
- `_completeJob` burns reserve.
- Non-success terminal paths refund reserve.
- Added completion burn helper views via `EmployerBurnReadHelper` periphery.

## Security/economic impact
- Removes allowance-based finalization griefing vector present in direct wallet pull design.
- Prevents protocol subsidy by excluding reserve from withdrawable balance.

## Deployability
- Runtime and initcode measured against EIP-170 and EIP-3860 gates via `npm run size`.
