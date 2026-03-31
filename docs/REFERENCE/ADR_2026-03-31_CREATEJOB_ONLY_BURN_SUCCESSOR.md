# ADR — CreateJob-only Employer-Funded Burn Successor (2026-03-31)

## Status
Accepted (successor release `v0.2.0`).

## Decision
1. Employer burn is charged **only in `createJob`**.
2. Employer funds both payout escrow and burn in the same create transaction.
3. No settlement/refund/dispute/cancel/delist/expiry path burns tokens.
4. Burn is non-refundable posting cost, not escrow, not protocol revenue.
5. AGIALPHA token is pinned (token update path hard-disabled with `AGIALPHATokenPinned`).
6. Owner `withdrawAGI(uint256)` remains `onlyOwner nonReentrant`, is no longer pause-gated, and is bounded strictly by `withdrawableAGI()`.
7. AGI branch of `rescueERC20` routes through the same surplus-accounting policy as `withdrawAGI`.
8. Etherscan-first helpers are available on additive `EmployerBurnReadHelper` for burn quote/funding/allowance/snapshot transparency.

## Rationale
- **Simplicity/liveness:** burn has one trigger point (`createJob`) and no settlement dependency.
- **Auditability:** create-time event + burn bps snapshot makes economics reconstructable and deterministic.
- **No protocol subsidy:** burn is pulled directly from employer wallet authorization path (`burnFrom`), never from protocol balances.
- **Etherscan usability:** upfront requirement is explicit (`escrow + burn`) via helper views.
- **Trust minimization:** AGIALPHA pinning removes token-switch governance risk.
- **Size preservation:** no new persistent burn token snapshots; burn amount is derived from payout + bps snapshot.
- **Safe live operations:** treasury withdrawals can proceed during normal operations while remaining insolvency-safe by locked-balance accounting bounds.
