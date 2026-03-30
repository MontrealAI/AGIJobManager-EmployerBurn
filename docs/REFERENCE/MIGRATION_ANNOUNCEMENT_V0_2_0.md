# Migration Announcement — Employer Burn Semantics Correction (v0.2.0)

Date: 2026-03-30

## Announcement
The prior release burned on employer-win refund/settlement paths. For corrected policy, this is deprecated.

## What changes in v0.2.0
- Burn is charged only at `createJob`.
- Employer pays burn directly via token authorization during posting.
- Settlement/refund/dispute/cancel/delist/expiry never burn.

## Required operator action
1. Keep old deployment paused/deprecated.
2. Deploy corrected successor manager.
3. Update ENS wiring to new manager (`ENSJobPages.setJobManager(newManager)` and `newManager.setEnsJobPages(existingEnsJobPages)` as needed).
4. Route all new traffic to successor deployment only.

## User-facing economics
- Burn is immediate and non-refundable posting cost.
- Refunds return escrow/bonds only.
- Protocol receives no burn revenue.
