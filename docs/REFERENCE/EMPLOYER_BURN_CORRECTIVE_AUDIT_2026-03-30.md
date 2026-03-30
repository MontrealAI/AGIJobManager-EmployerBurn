# Employer Burn Correctness Audit (2026-03-30)

## Scope
Audit of prior main semantics vs corrected requirement: burn must be createJob-only and employer-funded only.

## Findings
1. **createJob flow (prior):** employer funded only payout escrow during `createJob`; no burn was charged at posting time.
2. **agent-win terminal flow (prior):** `_completeJob` did not burn.
3. **employer-win terminal/refund flows (prior):** `_refundEmployer` executed `burnFrom(job.employer, burnAmount)` and emitted `EmployerBurnEnforced`, meaning burn happened on settlement/refund paths.
4. **dispute/finalize coupling (prior):** settlement success could depend on employer allowance/balance at end-of-life, harming liveness.
5. **doc mismatch risk (prior):** prior docs framed this as employer-win path behavior, which is now explicitly wrong relative to corrected policy.

## Correctness impact
- Burn timing was wrong (late instead of posting-time).
- Refund path still burned, violating corrected requirement.
- Settlement liveness depended on post-creation allowance state.

## Corrective direction
- Charge burn in `createJob` atomically with escrow funding.
- Snapshot burn economics at creation.
- Remove all burn logic from `_refundEmployer` and all terminal paths.
- Publish successor deployment + deprecate paused old deployment.
