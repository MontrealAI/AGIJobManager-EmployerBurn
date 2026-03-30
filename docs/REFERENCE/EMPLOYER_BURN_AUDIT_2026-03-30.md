# Employer Burn Correctness Audit Memo (2026-03-30)

## Scope
- Repository state audited for successor release semantics where employer-funded AGIALPHA burn is charged only at `createJob`.

## Findings
1. **Create-job funding flow**
   - `createJob` computes burn from `employerBurnBps`, snapshots burn bps/token, transfers payout escrow to manager, then executes token `burnFrom(employer, burnAmount)` in the same transaction.
   - If escrow transfer or burn fails, the full transaction reverts atomically.

2. **Agent-win / successful completion terminal paths**
   - `_completeJob` performs payout allocation, validator settlement, and optional protocol remainder accounting.
   - No burn is executed in completion/finalization paths.

3. **Employer-win / refund terminal paths**
   - `_refundEmployer` returns escrow-derived amounts and settles bonds.
   - No burn is executed in refund or dispute resolution paths.

4. **Other terminal/non-terminal operational paths**
   - `cancelJob`, `delistJob`, `expireJob`, tie/under-quorum forced dispute, moderator dispute resolution, and stale dispute resolution paths do not invoke burn logic.

5. **Current burn enforcement location**
   - Burn occurs only in `createJob` via `IAGIALPHABurnable(agiToken).burnFrom(msg.sender, burnAmount)`.
   - `EmployerBurnChargedAtJobCreation` event now emits for all job creations (including `burnAmount == 0`) with payout, burn, total upfront, and burn bps snapshot.

6. **Documentation/release posture**
   - Existing docs already include successor/deprecation posture in multiple places.
   - This corrective pass updates remaining legacy wording that implied `updateAGITokenAddress` was operational; successor now documented as AGIALPHA-pinned with disabled update stub.

7. **Allowance UX/atomicity observations**
   - Etherscan-first helper contract exposes:
     - `quoteCreateJobBurn(payout)`
     - `getCreateJobFundingRequirement(payout)`
     - `getCreateJobAllowanceRequirement(payout)`
     - `getCreateJobAllowanceRequirementWithToken(payout)`
     - `getJobBurnAmountSnapshot(jobId)`
     - `getJobEconomicSnapshot(jobId)`
   - These make payout escrow, burn amount, total upfront funding, token, and spender explicit for non-technical employers.

## Correctness conclusion
- Successor implementation satisfies createJob-only burn requirement and prevents settlement-time burns.
- Remaining operator-critical risk is deployment hygiene: ensure constructor token is AGIALPHA on Ethereum mainnet and keep paused legacy deployment deprecated.
