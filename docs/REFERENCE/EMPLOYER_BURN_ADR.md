# ADR — Employer-funded burn enforcement architecture

## Status
Accepted (2026-03-27).

## Context
Business rule: employer is sole economic payer for AGIALPHA burn, and burn occurs only on authoritative employer-win settlement paths.

## Options considered

### Option A — Pure separate sidecar contract (no AGIJobManager changes)
Rejected.

Reason: current employer-win finalization remains directly callable on `AGIJobManager` (`finalizeJob` employer-win branch, `resolveDisputeWithCode` code 2, `resolveStaleDispute` employerWins=true). A sidecar-only wrapper would be bypassable by calling AGIJobManager directly.

### Option B — Separate sidecar + minimal AGIJobManager gate/hook
Rejected for this repository variant.

Reason: existing implementation already enforces burn in authoritative core path (`_refundEmployer`) without introducing shadow settlement logic or extra custody. Adding a sidecar on top would increase complexity without improving bypass resistance.

### Option C — Minimal direct integration in AGIJobManager
Accepted.

Reason: burn enforcement is already integrated in `_refundEmployer` (single authoritative employer-win settlement handler), preserving AGIJobManager as lifecycle source of truth. This is least invasive and non-bypassable under current architecture.

## Decision details
- Keep burn logic in `AGIJobManager._refundEmployer(...)`.
- Keep `burnFrom(job.employer, amount)` as the only burn source.
- Add Etherscan helpers for quote/readiness/requirements to reduce operator mistakes.
- Emit `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)` from the authoritative burn point for indexed traceability of payer/path/caller.

## Consequences
- No shadow settlement or duplicate state machine.
- No protocol subsidy path introduced.
- Employer must provide AGIALPHA allowance/balance; third parties may trigger permissionless finalization only after employer authorization exists.
- If AGIALPHA token config changes to a token without compatible burn behavior, employer-win settlement reverts (fail-safe).
- AGIJobManager runtime size is close to EIP-170 limit, so new observability/UX surfaces should preferentially live in periphery/docs instead of core unless a security invariant requires core changes.
