# Employer Burn Design Note

## Scope
This variant enforces an **employer-funded AGIALPHA burn** only when a job is finalized in favor of the employer.

## Live AGIALPHA token verification (mainnet)
Verified against the live token at `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA` (Etherscan verified ABI/source metadata):
- `burnFrom(address,uint256)` is present.
- `permit(...)` is present (ERC-2612 style), but **not required** for protocol operation.
- Token supports pausing (`pause`, `unpause`, `paused`, `isPaused`), so paused-token conditions can block `burnFrom` and therefore atomically block employer-win settlement.
- Role-gated controls (`PAUSER_ROLE`, etc.) exist on the token and are external to AGIJobManager; protocol behavior is fail-safe on token-level reverts.

## Authoritative trigger
The burn is executed only inside `AGIJobManager._refundEmployer(...)`, which is reached by employer-win settlement paths:
- `finalizeJob(...)` when disapprovals beat approvals after the review path.
- `resolveDisputeWithCode(..., resolutionCode=2, ...)`.
- `resolveStaleDispute(..., employerWins=true)`.

No agent-win, cancel, or expire path calls `_refundEmployer(...)`.

## Burn source and atomicity
- Source: `burnFrom(job.employer, burnAmount)` on configured AGI token.
- The protocol contract never burns from treasury/escrow balances.
- No protocol subsidy: protocol accounting never fronts, socializes, reimburses, or nets out the employer burn amount.
- If `burnFrom` fails (allowance/balance/token-level revert), employer-win settlement reverts atomically.
- Ordering: settlement first checks lifecycle eligibility, then executes burn, then proceeds with employer refund + validator/bond settlement; no partial burn-without-settlement or settlement-without-burn.
- Permissionless finalization note: on the `finalizeJob` employer-win branch, **any caller** may trigger settlement, but burn payer remains `job.employer` due to `burnFrom(job.employer, ...)` and required employer allowance.

## Burn amount
- `burnAmount = job.payout * employerBurnBps / 10_000`.
- `employerBurnBps` defaults to `0` for safe rollout and backward compatibility.
- Owner may set bounded value through `setEmployerBurnBps(uint256)`, but only when escrow/bond locks are empty, preventing retroactive policy changes on active jobs.
- Token capability is enforced at settlement time: if the configured token does not implement `burnFrom` (or reverts), the employer-win settlement path reverts atomically.

## Observability
When non-zero burn is applied, `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)` is emitted.
The event is settlement-path aware (`1=finalizeJob`, `2=resolveDisputeWithCode`, `3=resolveStaleDispute`).

## Etherscan read helpers
To reduce operator mistakes for non-technical employers, additive periphery contract `EmployerBurnReadHelper` exposes:
- `quoteEmployerBurn(jobId)` → token, amount, bps, payer, spender.
- `getEmployerBurnRequirements(jobId)` → token/payer/spender + current balance/allowance sufficiency.
- `getEmployerBurnReadiness(jobId)` → readiness booleans + reason/path codes (includes dispute-resolution paths).
- `canFinalizeEmployerWinWithBurn(jobId)` → single boolean guard for the **`finalizeJob` employer-win branch only**.
- If settlement is paused on AGIJobManager, readiness reports not-ready and finalize helper returns false.

## Etherscan-first operator flow
1. Read `quoteEmployerBurn(jobId)` and `getEmployerBurnReadiness(jobId)`.
2. Ensure employer AGIALPHA balance covers `payout + burn`.
3. Approve AGIJobManager for at least `payout + burn`.
4. Execute eligible finalize/dispute resolution path.
5. Verify settlement + `EmployerBurnEnforced` event when burn amount is non-zero.

## v0.2.0 corrective note
Burn is charged only at createJob as a posting cost and never in settlement paths.
