# Bug Audit Memo — Completion-Only Burn Correction (2026-03-30)

## Scope
`contracts/AGIJobManager.sol` main settlement and burn paths.

## Findings (critical)
1. Previous semantics enforced AGIALPHA burn inside `_refundEmployer(...)` (Employer-win/refund path), not on successful completion.
2. Successful completion paths (`finalizeJob` with agent-win, `resolveDisputeWithCode(...,1)`, `resolveStaleDispute(...,false)`) did not burn.
3. Employer refund paths (`finalizeJob` employer-win, `resolveDisputeWithCode(...,2)`, `resolveStaleDispute(...,true)`) triggered burn.
4. This contradicted corrected requirement: burn must be completion-only.
5. Naive move of `burnFrom(job.employer, amount)` into completion finalization introduces liveness griefing (allowance/balance revocation can block valid completion settlement).

## Release truthfulness impact
Prior docs and release notes described employer-win burn behavior as production-ready; this is semantically obsolete for completion-only requirements and must be marked deprecated.
