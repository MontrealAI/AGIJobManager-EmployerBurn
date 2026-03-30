# Migration Guide: v0.1.x -> v0.2.0 (Completion-only Employer Burn)

## Why migrate
- v0.1.x burns on Employer-win refund paths (wrong semantics for completion-only burn policy).
- v0.2.0 burns only on successful completion and refunds burn reserve on all non-success paths.

## Owner cutover (mainnet)
1. Deploy v0.2.0 AGIJobManager successor using canonical Hardhat flow.
2. Verify contracts on Etherscan.
3. Configure owner parameters on v0.2.0 (burn bps, quorum, durations, validators/moderators, AGI types).
4. Deploy/point `EmployerBurnReadHelper` to v0.2.0 manager.
5. ENS cutover (if manager address changes):
   - `ENSJobPages.setJobManager(<newManager>)`
   - `<newManager>.setEnsJobPages(<existingEnsJobPages>)`
6. Freeze/deprecate old operational runbooks for v0.1.x; do not start new jobs there.

## Employer-facing behavior changes
- At `createJob`, employer now funds: `payout + completionBurnReserve`.
- No separate burn allowance is required at settlement time.
- Reserve is burned only if job completes successfully.
- Reserve is refunded on cancel/expiry/employer-win/non-success outcomes.

## Data migration note
- Existing jobs in v0.1.x are immutable and remain under old semantics.
- New completion-only semantics apply only to new jobs on v0.2.0 successor deployment.
