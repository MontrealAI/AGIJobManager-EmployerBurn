# ADR: CreateJob-Only Burn Successor Hardening (2026-03-30)

## Status
Accepted (successor release track `v0.2.0`).

## Decision
Adopt and harden the successor semantics where:
1. Employer burn is charged **only** during `createJob`.
2. Employer funds two components atomically at job creation:
   - payout escrow transferred into AGIJobManager
   - non-refundable AGIALPHA burn charged from employer wallet authorization path
3. No settlement path burns:
   - no burn on agent-win completion/finalization
   - no burn on employer refund
   - no burn on cancellation, delist, expiry, tie/under-quorum dispute, or dispute resolution
4. Burn is not escrow, not protocol revenue, and not refundable.
5. Successor deployment is AGIALPHA-pinned on mainnet (`0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`), with `updateAGITokenAddress` hard-disabled (revert stub).

## Rationale
- **Simplicity:** one burn trigger and one economic entry point.
- **Liveness:** settlement does not depend on future burn allowance/balance states.
- **Auditability:** burn amount and bps snapshot recorded at creation and exposed by helper views.
- **Etherscan-first usability:** one approval target (payout + burn), one posting transaction.
- **No protocol subsidy:** burn is paid directly by employer wallet, never by protocol escrow/treasury.
- **Trust minimization:** pinned AGIALPHA token removes owner token-switch risk.

## Consequences
- Employers must approve/create with total upfront requirement (`payout + burn`).
- Refund paths return escrow/bonds only; previously burned posting cost is never returned.
- Legacy paused release remains deprecated; corrected semantics require successor deployment.

## Notes
- Burn bps updates affect only future jobs; per-job snapshot preserves historical auditability.
- Runtime/initcode limits remain gated by release checks (`EIP-170` runtime limit and `EIP-3860` initcode limit).
