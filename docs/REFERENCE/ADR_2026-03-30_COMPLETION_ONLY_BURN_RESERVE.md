# ADR — Completion-Only Burn Funding Design (2026-03-30)

## Decision
Adopt **Option B: dedicated Employer-funded burn reserve**.

## Option A rejected
Direct completion-time `burnFrom(employer, amount)` was rejected because employer allowance/balance control can grief permissionless settlement liveness.

## Option B selected
At job creation, employer funds:
- payout escrow, plus
- segregated completion burn reserve.

Settlement behavior:
- successful completion: reserve is burned from contract balance;
- non-success terminal paths (cancel, expiry, tie/under-quorum -> dispute, employer-win dispute/refund): reserve is refunded to employer.

## Why this is safer
- **Liveness:** completion settlement is not blocked by later employer allowance changes.
- **Anti-griefing:** employer cannot revoke completion burn funding after job creation.
- **No protocol subsidy:** reserve is employer-funded and tracked in `lockedBurnReserve`.
- **Etherscan UX:** upfront requirement is explicit and queryable via helper.
- **Deployability/auditability:** minimum state-machine changes with explicit events.
