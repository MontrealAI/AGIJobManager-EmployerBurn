# Bug Audit Memo — 2026-03-31 (CreateJob-only Burn Successor)

## Scope
- Contract: `contracts/AGIJobManager.sol`
- Release surfaces: Hardhat deploy/verify/postdeploy scripts + operator docs.

## Findings summary
1. **createJob funding flow:** funding occurs in one tx (`transferFrom` payout escrow into manager + `burnFrom` employer wallet), with burn amount derived from `employerBurnBps`. This is atomic because either revert aborts the whole transaction.
2. **Agent-win terminal paths:** settlement (`_completeJob`) distributes escrow/bonds and does not perform burn.
3. **Employer-win/refund terminal paths:** refund (`_refundEmployer`, cancellation/delist/expiry/dispute employer-win outcomes) returns escrow/bonds only and does not perform burn.
4. **Burn enforcement location:** burn is enforced in `createJob` only; no settlement/refund/dispute burn calls remain.
5. **Repo/docs overstatement risk identified:** several docs still described paused-only treasury withdrawal posture, which diverged from required live-operations withdrawal policy.
6. **CreateJob UX issue identified:** helper quote/funding/allowance functions must stay clearly documented for non-technical users; canonical Etherscan usage relies on `EmployerBurnReadHelper`.
7. **Withdraw policy mismatch identified:** `withdrawAGI` and AGI branch in `rescueERC20` required pause posture; this violated the corrected owner live-operations requirement.

## Corrective actions implemented
- Preserved/validated createJob helper surfaces on `EmployerBurnReadHelper`:
  - `quoteCreateJobBurn`
  - `getCreateJobFundingRequirement`
  - `getCreateJobAllowanceRequirement`
  - `getJobBurnAmountSnapshot`
  - `getJobEconomicSnapshot`
- Removed pause/settlement pause gating from `withdrawAGI`.
- Unified AGI rescue policy by routing AGI `rescueERC20` through the same surplus-bound `_withdrawAGITo` path without pause gating.
- Updated operator/release docs to reflect live-operation surplus withdrawal semantics.
