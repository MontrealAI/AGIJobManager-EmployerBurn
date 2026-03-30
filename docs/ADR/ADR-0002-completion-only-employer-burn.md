# ADR-0002: Completion-only Employer Burn Reserve (v0.2.0)

## Status
Accepted — March 30, 2026

## Context
v0.1.x charged Employer-funded burn on Employer-refund / Employer-win paths. Corrected requirement is completion-only burn.

## Options considered

### Option A — direct wallet burn at completion time
- Burn via `burnFrom(employer, amount)` during successful completion finalization.
- **Rejected**: Employer can grief settlement by revoking allowance or dropping wallet balance right before finalization, blocking valid successful completion.

### Option B — dedicated Employer-funded burn reserve (selected)
- Employer funds payout escrow + burn reserve up front at job creation.
- Burn reserve is locked in protocol accounting (`lockedBurnReserves`) and economically sourced from Employer wallet only.
- Burn reserve is burned only in `_completeJob` (successful completion paths).
- Burn reserve is refunded to Employer on non-success terminal paths.

## Decision drivers
- Liveness-safe successful settlement.
- No protocol subsidy/fronting/reimbursement.
- Etherscan-first operator clarity (single upfront funding requirement).
- Minimal contract-surface change while preserving AGIJobManager as authoritative settlement state machine.
- Mainnet deployability under EIP-170/EIP-3860 with measured bytecode checks.

## Consequences
- Upfront Employer funding requirement increases by burn reserve amount.
- Old v0.1.x deployment is semantically obsolete for completion-only burn requirements.
- Successor deployment is required; immutable old deployment cannot be patched.
