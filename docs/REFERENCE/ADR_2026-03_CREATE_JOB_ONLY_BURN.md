# ADR: CreateJob-only Employer Burn (2026-03)

## Status
Accepted for successor release `v0.2.0`.

## Decision
- Burn is charged only in `createJob`.
- Employer funds `payout escrow + burn amount` in one atomic transaction.
- Contract transfers escrow to itself and burns employer amount via `burnFrom(employer, burnAmount)`.
- If either operation fails, full transaction reverts.
- No settlement/dispute/refund/cancel/expiry path burns anything.

## Rationale
- **Simplicity:** burn logic has one authoritative execution point.
- **Liveness:** finalization and dispute paths no longer depend on employer allowance at settlement time.
- **Auditability:** creation event snapshots burn bps and amount.
- **Etherscan-first UX:** users approve one total amount and submit one `createJob` call.
- **No subsidy:** protocol escrow/treasury never pays burn.
- **No deferred dependency:** burn is immediate posting cost, not a reserve.

## Accounting consequences
- Burn is non-refundable posting cost.
- Escrow accounting stays isolated in `lockedEscrow` and settlement logic.
- Refund paths return escrow/bonds only, never burned amount.
- Burned tokens are destroyed and never protocol revenue.
