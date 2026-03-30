# Release Notes — v0.2.0 (Corrective)

## Breaking semantic correction
- Removed burn on employer-refund / employer-win paths.
- Added completion-only burn using employer-funded reserve.

## Economic behavior
- Employer upfront funding = payout escrow + burn reserve.
- Successful completion burns reserve (`CompletionBurnExecuted`).
- Non-success terminal paths refund reserve (`CompletionBurnReserveRefunded`).
- Protocol cannot withdraw reserve (`lockedBurnReserve` included in solvency gates).

## Operator note
v0.1.x is deprecated for completion-only burn requirements.
