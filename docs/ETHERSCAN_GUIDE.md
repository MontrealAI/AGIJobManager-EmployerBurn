# Etherscan Guide (v0.2.0 Completion-Only Burn Reserve)

## Critical warning
- v0.1.x semantics burned on employer-win refund paths (deprecated for completion-only requirement).
- v0.2.0 semantics burn only on successful completion settlement.

Mainnet AGIALPHA token: `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.

## Employer preflight (Read Contract)
Use `EmployerBurnReadHelper`:
1. `quoteCompletionBurn(jobId)`
2. `getCompletionBurnFundingStatus(jobId)`
3. `getEmployerUpfrontFundingRequirement(jobId)`
4. `getSuccessfulCompletionFinalizationReadiness(jobId)`
5. `canFinalizeSuccessfulCompletion(jobId)`

Interpretation:
- `payoutEscrow` + `burnReserveRequired` = upfront AGIALPHA needed at job creation.
- `reserveFunded=true` means completion burn funding is already locked.

## What burns and what does not
Burns:
- successful completion finalization (`finalizeJob` success branch),
- dispute resolution in favor of successful completion.

Does not burn:
- employer refund/employer-win,
- cancel,
- expiry,
- tie/under-quorum forced dispute,
- unresolved/disputed states that are not settled as successful completion.

## Events to monitor
- `CompletionBurnExecuted(jobId, employer, token, amount, finalizer, settlementPathCode, burnMode)`
- `CompletionBurnReserveRefunded(jobId, employer, token, amount)`
