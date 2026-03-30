# Release Notes — v0.2.0 (Corrective Successor)

## Deprecation notice
Prior release semantics burned on employer-win refund/settlement paths. That is deprecated for corrected requirements; old deployment remains paused.

## What changed
- Burn moved to `createJob` only.
- `createJob` now requires/funds `payout + burn` atomically.
- Settlement/dispute/refund/cancel/delist/expiry paths do not burn.
- Added create-job funding helper views on `EmployerBurnReadHelper`:
  - `quoteCreateJobFunding(uint256 payout)`
  - `getCreateJobFundingReadiness(address employer, uint256 payout)`
- Added job economics snapshot getter on manager:
  - `getJobEconomicSnapshot(uint256 jobId)`
- Added event:
  - `EmployerBurnChargedAtJobCreation(...)`
- Updated periphery helper to Etherscan-first create-job funding preflight.

## Disclosures
AGIALPHA burned during job creation is permanently removed from circulation and is not received by the protocol, its owner, or any third party. The protocol does not derive revenue from this burn.

Users are solely responsible for any tax consequences arising from token burns, transfers, or usage.
