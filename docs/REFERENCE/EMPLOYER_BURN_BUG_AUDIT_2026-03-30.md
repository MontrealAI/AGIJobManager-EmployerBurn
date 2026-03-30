# Employer Burn Correctness Audit Memo (2026-03-30)

## Scope
Audit of the pre-successor `AGIJobManager` semantics versus corrected requirement: **burn only at createJob, funded only by employer wallet, never in settlement/refund/dispute paths**.

## Findings (pre-successor behavior)

1. **createJob funding flow (old behavior):** `createJob(...)` only transferred payout escrow (`_payout`) into contract custody; no burn occurred at creation time.
2. **successful completion / agent-win paths:** `_completeJob(...)` did not burn.
3. **employer-win/refund paths:** `_refundEmployer(...)` computed `(job.payout * employerBurnBps)/10_000` and called `burnFrom(job.employer, burnAmount)` during settlement/refund paths.
4. **burn enforcement location:** burn was enforced in settlement paths reached via `finalizeJob`, `resolveDisputeWithCode`, and `resolveStaleDispute` when employer won.
5. **documentation overstatement risk:** prior release/docs framed employer-burn semantics around employer-win settlement paths, which is incorrect for the corrected createJob-only requirement.
6. **allowance UX hazard (old behavior):** employers could post jobs with only escrow funded, then later settlement could fail due to missing burn allowance/balance.

## Correctness delta required

- Move burn charging from `_refundEmployer` settlement branch into `createJob` atomic posting flow.
- Ensure settlement/finalization/dispute paths contain **no burn logic**.
- Snapshot per-job burn economics at create time for auditability.
- Provide create-job helper views to quote escrow, burn, total upfront, and allowance requirement.

## Security and liveness implications

- **Improved liveness:** settlement no longer depends on employer maintaining post-creation allowance/balance for burn.
- **No protocol subsidy:** burn still uses `burnFrom(employer, amount)` directly from employer wallet path.
- **Atomic safety:** if escrow transfer or burn fails during createJob, whole tx reverts.
