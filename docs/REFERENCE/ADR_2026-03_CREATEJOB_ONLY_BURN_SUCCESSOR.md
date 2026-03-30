# ADR: CreateJob-Only Employer Burn for Successor Release (v0.2.0)

- Date: 2026-03-30
- Status: Accepted
- Decision owners: protocol engineering, security, release management

## Context
Prior behavior enforced employer burn on employer-win settlement/refund paths. Corrected requirement mandates:

- burn charged exactly once at `createJob`
- employer wallet is sole economic source
- no burn in any later settlement/dispute/refund/cancel/expiry path

## Decision
Adopt createJob-only burn semantics in successor manager deployment:

1. `createJob` computes `burnAmount = payout * employerBurnBps / 10_000`.
2. `createJob` transfers payout escrow into contract.
3. `createJob` calls token `burnFrom(employer, burnAmount)` in same transaction.
4. Transaction reverts atomically if either escrow transfer or burn fails.
5. Settlement/refund/dispute paths perform **no burn calls**.
6. Per-job economic snapshot is persisted at create time:
   - `employerBurnBpsSnapshot`
   - burn amount derivable from snapshot + payout (`payout * employerBurnBpsSnapshot / 10_000`)
7. Event `EmployerBurnChargedAtJobCreation` provides indexed audit trail.

## Why this design

- **Simplicity:** one burn trigger, one time, one payer path.
- **Liveness:** finalization no longer blocked by employer allowance/balance drift after posting.
- **Auditability:** deterministic snapshot + event at creation.
- **Etherscan-first usability:** users precompute one upfront requirement (`escrow + burn`) and approve once.
- **No protocol subsidy:** burn always via employer authorization path (`burnFrom(employer, ...)`).
- **No settlement dependency:** all later outcomes distribute only escrow/bonds.

## Economic and disclosure interpretation

- Burn is a **non-refundable posting cost** paid at create time.
- Burn is separate from escrow accounting.
- Burned AGIALPHA is destroyed, not protocol revenue.
- Refunds later return escrow/bonds only; never the burned posting cost.
