# Migration & Cutover Guide — v0.2.0 (CreateJob-only burn)

## Critical status
- Old deployment semantics are deprecated for corrected requirement.
- Old deployment is paused and should remain paused.
- Do not route new jobs to old manager.

## Successor deployment objective
Deploy corrected AGIJobManager (`v0.2.0`) where burn is only charged at `createJob`.

## Owner cutover steps
1. Deploy and verify new AGIJobManager and periphery helper.
2. Confirm owner address, `employerBurnBps`, and helper view availability.
3. Keep old manager paused.
4. Update all operator docs/UI references to the new manager address.
5. ENS cutover (if ENSJobPages reused):
   - call `ENSJobPages.setJobManager(newManager)` (ENSJobPages owner)
   - call `newManager.setEnsJobPages(existingEnsJobPages)` (new manager owner)
6. Execute postdeploy validation and smoke tests on new manager.
7. Announce old version deprecated and new version canonical.

## Employer-facing Etherscan flow
1. Call `getCreateJobFundingRequirement(payout)`.
2. Call `EmployerBurnReadHelper.quoteCreateJobFunding(payout)` and `getCreateJobFundingReadiness(employer,payout)`.
3. Approve `totalRequired` to spender `AGIJobManager` on AGIALPHA token.
4. Call `createJob(...)` once.
5. Verify `EmployerBurnChargedAtJobCreation` event and `JobCreated` event.

## Economic disclosure
AGIALPHA burned during job creation is permanently removed from circulation and is not received by the protocol, its owner, or any third party. The protocol does not derive revenue from this burn.

Users are solely responsible for any tax consequences arising from token burns, transfers, or usage.
