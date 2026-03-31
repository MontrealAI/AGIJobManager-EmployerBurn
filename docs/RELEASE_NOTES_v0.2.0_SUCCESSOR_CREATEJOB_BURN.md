# Release Notes — v0.2.0 Successor (CreateJob-Only Burn Correction)

## Critical correction
- Prior release semantics burned on employer-win settlement/refund paths.
- That behavior is wrong for corrected requirement and the old deployment is paused/deprecated.
- `v0.2.0` successor charges employer-funded burn only at `createJob`.

## Economics and accounting
- Employer funds at create time:
  - payout escrow (held by manager)
  - non-refundable AGIALPHA burn (destroyed immediately)
- Burned AGIALPHA is permanently removed from circulation and is not received by protocol owner or any third party.
- Protocol does not derive revenue from this burn.
- Users are solely responsible for any tax consequences from burns/transfers/usage.

## Security and trust changes
- `updateAGITokenAddress` is disabled in successor (`AGIALPHATokenPinned`).
- Mainnet successor requires AGIALPHA token `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.

## Etherscan-first helper surfaces
- `quoteCreateJobBurn(uint256 payout)`
- `getCreateJobFundingRequirement(uint256 payout)`
- `getCreateJobAllowanceRequirement(uint256 payout)`
- `getJobBurnAmountSnapshot(uint256 jobId)`
- `getJobEconomicSnapshot(uint256 jobId)`

## Migration/deprecation
- Keep old deployment paused/deprecated.
- Use only successor deployment for new jobs requiring corrected createJob-only burn semantics.
