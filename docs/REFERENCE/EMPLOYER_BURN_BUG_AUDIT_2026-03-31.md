# Employer Burn Correctness Memo — 2026-03-31

## Phase 0 bug audit summary

### CreateJob funding flow (authoritative path)
- `createJob(...)` computes `burnAmount = payout * employerBurnBps / 10_000`.
- The same call transfers `payout` escrow into contract custody (`safeTransferFromExact`) and calls AGIALPHA `burnFrom(employer, burnAmount)`.
- If either transfer or burn fails, transaction reverts atomically; no partial state persists.

### Agent-win / successful-completion terminal paths
- `finalizeJob(...)` may route into `_completeJob(...)` for validator-approved/no-vote/approval-majority outcomes.
- `_completeJob(...)` settles escrow/bonds and emits settlement events.
- `_completeJob(...)` contains no burn call.

### Employer-win / refund terminal paths
- `finalizeJob(...)` employer-win branch routes to `_refundEmployer(...)`.
- Dispute resolution employer-win path also routes to `_refundEmployer(...)`.
- `_refundEmployer(...)` settles escrow/bonds only and contains no burn call.

### Cancel/delist/expiry/dispute paths
- `cancelJob(...)` and `delistJob(...)` route to `_cancelJobAndRefund(...)`; refund escrow only.
- `expireJob(...)` releases escrow and settles bond effects; no burn call.
- Tie/under-quorum flow transitions to dispute state; dispute outcomes call `_completeJob(...)` or `_refundEmployer(...)`; no burn call.

### Where burn is enforced
- Burn is enforced only in `createJob(...)` via `IAGIALPHABurnable(agiToken).burnFrom(msg.sender, burnAmount)`.

### Documentation/release truthfulness status
- Repo docs now explicitly mark old release semantics as wrong for corrected requirement and require successor `v0.2.0` createJob-only burn usage.
- Old deployment is documented as paused/deprecated, not fixable in place.

### Atomicity + allowance UX observations
- Recommended Etherscan UX remains one approval for `payout + burn` followed by one `createJob` write.
- Read-helper provides deterministic preflight views for burn quote, total funding requirement, required allowance, and per-job burn snapshots.

### Source-of-truth reconciliation check
- `contracts/AGIJobManager.sol` is the deployment candidate and now removes redundant per-job burn token snapshot storage.
- Burn token is AGIALPHA-pinned for mainnet deployments and token update mutability is hard-disabled.
