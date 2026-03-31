# ADR 2026-03-31 — CreateJob-only burn with AGIALPHA pinning and size hardening

- Status: Accepted
- Applies to: successor release line `v0.2.0` and later corrected deployments

## Decision
1. Employer funds **two** create-time components in one atomic `createJob` transaction:
   - payout escrow deposited into AGIJobManager
   - non-refundable AGIALPHA burn charged from employer wallet
2. Burn occurs only in `createJob`; no settlement, refund, cancellation, delist, expiry, tie, under-quorum, or dispute path burns.
3. Burned AGIALPHA is permanently destroyed and never becomes protocol/owner revenue.
4. AGIALPHA token is pinned for mainnet successor deployments (`0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`), and `updateAGITokenAddress` remains an uncallable compatibility stub.
5. For size preservation and clarity, per-job burn token snapshot storage/getter is removed; only `employerBurnBpsSnapshot` is stored per job and burn amount is derived from payout + bps snapshot.

## Why
- **Simplicity:** one burn trigger and one deterministic formula.
- **Liveness:** finalization no longer depends on post-create allowance/balance conditions.
- **Auditability:** create-time event + payout + burn bps snapshot fully reconstruct economics.
- **Etherscan-first UX:** approve once for `payout + burn`, then call `createJob` once.
- **No subsidy:** protocol cannot front or reimburse burn economics.
- **Trust minimization:** owner cannot switch settlement token after deployment.
- **Size discipline:** remove redundant storage/getter surface in near-EIP-170 contract.
