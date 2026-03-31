# Employer Burn Design Note (Corrected Successor)

## Scope
This successor variant enforces an **employer-funded AGIALPHA burn only at `createJob`**.

## Core rule
- Burn trigger: `createJob` only.
- Burn payer: employer wallet only.
- Burn path: `burnFrom(employer, burnAmount)`.
- Settlement/refund/dispute/cancel/delist/expiry paths: no burn.

## Funding and atomicity
At `createJob`, employer funds both:
- escrow payout (transferred into AGIJobManager), and
- burn amount (destroyed from employer wallet).

If either transfer or burn fails, the entire transaction reverts atomically.

## Formula
- `burnAmount = payout * employerBurnBps / 10_000`.
- Burn is a non-refundable posting cost.
- No protocol subsidy: protocol funds never front, reimburse, or absorb this burn.

## Auditability
Per-job snapshot persisted at create time:
- `employerBurnBpsSnapshot` (token is globally AGIALPHA-pinned in this successor)

Burn amount is deterministically derived later as:
- `burnAmount = payout * employerBurnBpsSnapshot / 10_000`.

Event emitted at create time:
- `EmployerBurnChargedAtJobCreation(jobId, employer, token, payoutAmount, burnAmount, totalUpfront, burnBps)`.

Helper views:
- `quoteCreateJobBurn(uint256 payout)`
- `getCreateJobFundingRequirement(uint256 payout)`
- `getCreateJobFundingRequirementWithToken(uint256 payout)`
- `getCreateJobAllowanceRequirement(uint256 payout)`
- `getCreateJobAllowanceRequirementWithToken(uint256 payout)`
- `getJobBurnAmountSnapshot(uint256 jobId)`
- `getJobEconomicSnapshot(uint256 jobId)`

## Token pinning and mutability hardening
- Successor mainnet deployments are pinned to AGIALPHA:
  - `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`
- Constructor rejects non-AGIALPHA token on chain id 1.
- `updateAGITokenAddress(...)` is retained as compatibility stub and always reverts with `AGIALPHATokenPinned`.

## Disclosures
- AGIALPHA burned during job creation is permanently removed from circulation and is not received by the protocol, its owner, or any third party. The protocol does not derive revenue from this burn.
- Users are solely responsible for any tax consequences arising from token burns, transfers, or usage.
