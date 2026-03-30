# Release Notes — Corrected Successor v0.2.0 (CreateJob-Only Burn)

Date: 2026-03-30

## ⚠️ Deprecation notice
The prior paused release enforced burn on employer-win settlement/refund paths. That behavior is semantically wrong for the corrected requirement and is now deprecated for new deployments.

## Summary of correction
- Burn now occurs exactly once at `createJob`.
- Burn is funded only from the employer wallet authorization path (`burnFrom(employer, burnAmount)`).
- Settlement/refund/dispute/cancel/delist/expiry paths no longer burn.
- Burn and escrow accounting are explicitly separated.
- Added create-job helper views and per-job economic snapshots for Etherscan-first transparency.

## Contract interface updates
- New event: `EmployerBurnChargedAtJobCreation(jobId, employer, token, payoutAmount, burnAmount, totalUpfront, burnBps)`.
- New views:
  - `quoteCreateJobBurn(uint256 payout)`
  - `getCreateJobFundingRequirement(uint256 payout)`
  - `getCreateJobAllowanceRequirement(uint256 payout)`
  - `getJobEconomicSnapshot(uint256 jobId)`

## Behavior guarantees in successor
- Burn is an immediate non-refundable posting cost at job creation.
- Later refunds return escrow/bonds only, never previously burned amount.
- AGIALPHA burned during job creation is permanently removed from circulation and is not received by the protocol, its owner, or any third party. The protocol does not derive revenue from this burn.
- Users are solely responsible for any tax consequences arising from token burns, transfers, or usage.

## Operator action
- Keep old deployment paused/deprecated.
- Use corrected successor deployment path only.
- Update employer runbooks to approve `payout + burn` before `createJob`.
- Monitor `EmployerBurnChargedAtJobCreation` at posting time.
