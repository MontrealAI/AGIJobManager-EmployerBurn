# ADR — CreateJob-only Employer-funded AGIALPHA burn (successor release)

- Date: 2026-03-30
- Status: Accepted
- Scope: Corrected successor deployment (`v0.2.0`) for AGIJobManager EmployerBurn variant

## Context

The deprecated/paused prior release burned in employer-win settlement/refund paths, which is wrong for the corrected requirement.

Corrected requirement:

- Burn occurs **only** when Employer calls `createJob(...)`.
- Burn is funded **only** from Employer wallet authorization (`burnFrom(employer, amount)`).
- No settlement/dispute/refund/cancel/delist/expiry path may burn.
- Burn is not escrow and not protocol revenue.

## Decision

Adopt createJob-only burn semantics in the authoritative manager:

1. `createJob` computes deterministic burn from active `employerBurnBps`.
2. `createJob` transfers payout escrow into contract custody.
3. `createJob` charges burn directly from Employer wallet via AGIALPHA `burnFrom`.
4. Both actions execute in one transaction; if either fails, the whole transaction reverts.
5. Job snapshots include burn configuration at creation (`employerBurnBpsSnapshot`, `burnTokenSnapshot`) for auditability.
6. Burn observability is provided by `EmployerBurnChargedAtJobCreation`.
7. Settlement paths (`_completeJob`, `_refundEmployer`, dispute/finalize/expiry/cancel/delist) do not burn.
8. Corrected mainnet successor is AGIALPHA-pinned (`0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`) and token mutability is disabled (`updateAGITokenAddress` always reverts).

## Rationale

- **Simplicity:** single burn trigger (job posting) avoids cross-phase coupling.
- **Liveness:** finalization cannot be blocked by post-creation allowance drift.
- **Auditability:** event + snapshots make economics reconstructable per job.
- **Etherscan-first UX:** one up-front approval target (`escrow + burn`) and one write flow (`createJob`).
- **No protocol subsidy:** protocol never fronts, reimburses, or socializes burn cost.
- **Trust minimization:** AGIALPHA pinning prevents owner-side token switching in production successor.

## Economic interpretation

- Burn is a **non-refundable posting cost**.
- Escrow accounting excludes burned amount.
- Burned AGIALPHA is destroyed; protocol/owner/third parties do not receive it.
- Later employer refunds return escrow/bonds only (never burned amount).

## Consequences

- Prior release remains deprecated/paused for corrected requirements.
- New deployments requiring corrected semantics must use the successor release path.
- Operator docs and Etherscan guidance must present createJob-only burn semantics as canonical behavior.
