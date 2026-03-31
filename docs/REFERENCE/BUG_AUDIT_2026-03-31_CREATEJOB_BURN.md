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
6. **CreateJob UX issue identified:** quote/funding/allowance helpers must remain explicit and canonical for Etherscan-first users via `EmployerBurnReadHelper`.
7. **Withdraw policy mismatch identified:** stale docs incorrectly still described pause-gated withdrawals even though contract enforces surplus-only accounting-safe withdrawals.

## Corrective actions implemented
- Validated canonical createJob helper surfaces on `EmployerBurnReadHelper`:
  - `quoteCreateJobBurn`
  - `getCreateJobFundingRequirement`
  - `getCreateJobAllowanceRequirement`
  - `getJobBurnAmountSnapshot`
  - `getJobEconomicSnapshot`
- Confirmed `withdrawAGI` and AGI `rescueERC20` branch route through a single surplus-bound `_withdrawAGITo` policy.
- Updated operator/release docs to reflect live-operation surplus withdrawal semantics.
