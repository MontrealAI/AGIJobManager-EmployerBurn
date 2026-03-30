> [!WARNING]
> Deprecated semantic note: pre-v0.2.0 burn-on-settlement behavior is obsolete; old paused deployment must remain deprecated.

# AGIJobManager Etherscan Guide (Read/Write Contract)

Use this guide if you only have:
- a browser wallet (MetaMask, Rabby, etc.)
- Etherscan verified contract pages

## In one minute (Etherscan-first safety)

- Deployments are done with scripts (Hardhat recommended); owner cutover/governance writes are safe on Etherscan.
- ENS replacement is additive and manual for key wiring: `setApprovalForAll(newEnsJobPages, true)` then `setEnsJobPages(newEnsJobPages)`.
- ENS naming is `<prefix><jobId>.<jobsRootName>` (defaults: `aijob0.alpha.jobs.agi.eth`, `aijob1.alpha.jobs.agi.eth`).
- ENS writes are best-effort: settlement can succeed even if ENS side effects fail.
- Treat `lockIdentityConfiguration()` and `lockConfiguration()` as irreversible and postpone until full post-cutover validation.

## Employer burn quick flow (Etherscan-first)

1. Read `quoteCreateJobBurn(payout)` and `getCreateJobFundingRequirement(payout)` on `EmployerBurnReadHelper`.
2. On AGIALPHA (`0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`), approve **AGIJobManager** as spender (not the helper).
3. Execute the eligible settlement path on AGIJobManager (`finalizeJob`, `resolveDisputeWithCode` resolution `2`, or `resolveStaleDispute` with `employerWins=true`).
4. Verify `EmployerBurnChargedAtJobCreation` and the settlement entrypoint transaction (`finalizeJob` / `resolveDisputeWithCode` / `resolveStaleDispute`) to confirm payer, token, amount, finalizer, and path.

### Before you click **Write** (Employer burn transactions)

1. Confirm you are on the verified AGIJobManager contract page (Write Contract tab).
2. Confirm the AGIALPHA token is exactly `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.
3. On AGIALPHA, confirm `allowance(employer, AGIJobManager)` is at least the burn quote.
4. Confirm employer wallet AGIALPHA balance covers the burn quote (this is separate from escrow already posted).
5. Confirm `getCreateJobFundingRequirement(payout)` is on an employer-win path **before** writing:
   - `reasonCode` must **not** be `BURN_READINESS_NOT_EMPLOYER_WIN_PATH` (`1`).
   - `settlementPathCode` must be one of `1`, `2`, or `3` (not `0`).
6. Confirm `getCreateJobFundingRequirement(payout)` does **not** return:
   - `BURN_READINESS_INSUFFICIENT_BALANCE` (`4`)
   - `BURN_READINESS_INSUFFICIENT_ALLOWANCE` (`5`)
   - `BURN_READINESS_SETTLEMENT_PAUSED` (`6`)
7. Confirm job status is not already terminal (`completed` or `expired`) from `getJobCore(jobId)`.
8. Confirm you are calling the intended settlement function:
   - Permissionless lane: `finalizeJob(jobId)`
   - Moderator lane: `resolveDisputeWithCode(jobId, 2, reason)`
   - Owner stale-dispute lane: `resolveStaleDispute(jobId, true)`
   - Important: `finalizeJob` can be called by any address when conditions are met; if employer-win and burn is non-zero, AGIJobManager still burns from the employer wallet authorization (`burnFrom(employer, amount)`), never from caller funds.
9. Confirm wallet/network in your browser extension is Ethereum mainnet.
10. Submit and wait for receipt status `Success`.
11. Verify burn evidence conditionally:
   - If `quoteCreateJobBurn(payout).amount > 0`, the settlement tx **must** include `EmployerBurnChargedAtJobCreation`.
   - If `quoteCreateJobBurn(payout).amount == 0` (for example `BURN_READINESS_BURN_BPS_ZERO` / reason code `3`), settlement can succeed without that event.

### Exact approval vs unlimited approval (risk warning)

- **Exact approval (recommended):** approve exactly the quoted burn amount for this settlement.  
  - Pros: least approval risk if spender key/contract assumptions change.
  - Cons: may require another approval transaction later.
- **Unlimited approval (`2^256-1`):** convenient, but high risk.  
  - If spender trust assumptions break, remaining wallet balance can be exposed.
- The spender for burn is **AGIJobManager** (not `EmployerBurnReadHelper`).
- Approval is always a **separate transaction** from settlement/finalization.

## Choose your role
- [Employer](#employer-flow)
- [Agent](#agent-flow)
- [Validator](#validator-flow)
- [Moderator](#moderator-flow)
- [Owner / operator](#owneroperator-flow)

---

## ENS replacement (owner-focused) quick path

Use this order on mainnet to avoid partial cutovers:
1. Wrapped-root owner on NameWrapper: `setApprovalForAll(newEnsJobPages, true)`.
2. AGIJobManager owner on AGIJobManager: `setEnsJobPages(newEnsJobPages)`.
3. ENSJobPages owner (if needed): `migrateLegacyWrappedJobPage(jobId, exactLabel)` for affected legacy jobs.
4. Verify `status=1` receipts and read fields before considering lock calls.

Expected outcome: new job hooks resolve through the new ENSJobPages; legacy jobs retain historical labels unless migrated.

Do not call irreversible lock functions until these checks are complete.

### Start here by owner intent
- **I only need the minimum safe cutover order:** follow this section plus [Expected result after ENS replacement cutover checks](#expected-result-after-ens-replacement-cutover-checks).
- **I need lifecycle steps by role:** jump to [B) Core role flows](#b-core-role-flows).
- **I am about to lock configuration:** complete [Safety checklist before any write tx](#safety-checklist-before-any-write-tx) and confirm both lock preconditions above.

### ENS cutover signer matrix

| Action | Required signer | Safe to do on Etherscan? |
| --- | --- | --- |
| `setApprovalForAll(newEnsJobPages, true)` on NameWrapper | wrapped-root owner | Yes |
| `setEnsJobPages(newEnsJobPages)` on AGIJobManager | AGIJobManager owner | Yes |
| `migrateLegacyWrappedJobPage(jobId, exactLabel)` on ENSJobPages | ENSJobPages owner | Yes |
| `lockIdentityConfiguration()` / `lockConfiguration()` | owner(s) | Yes, but irreversible |

### Expected result after ENS replacement cutover checks
- AGIJobManager `ensJobPages()` returns the new address.
- NameWrapper approval is active for the same address.
- At least one future job emits expected ENS hook processing events.
- Any legacy jobs needing historical labels are either migrated or explicitly tracked.


### What is safe from Etherscan vs what still needs deploy scripts

- **Safe and expected on Etherscan:** owner/admin writes (`setEnsJobPages`, pause controls, allowlists, roots), NameWrapper approval by wrapped-root owner, read-based verification.
- **Do with scripts first:** contract deployment and source verification workflow (Hardhat recommended).
- **Never assume automated:** NameWrapper approval and `setEnsJobPages` are always explicit manual transactions.

---

## A) Before you start

### Verification matters
You need verified source + ABI on Etherscan for human-readable forms and decoded custom errors. If verification is missing, follow [`docs/VERIFY_ON_ETHERSCAN.md`](VERIFY_ON_ETHERSCAN.md) first.

### Units and conversions
- Token amounts are base units (`uint256`).
  - `1 AGI` at 18 decimals -> `1000000000000000000`
  - `1.5 AGI` -> `1500000000000000000`
- Time values are seconds.
  - `12h` -> `43200`
  - `7d` -> `604800`

Offline converter:
```bash
node scripts/etherscan/prepare_inputs.js --action convert --amount 1.5 --duration 7d
```

### Safety checklist before any write tx
1. Read `paused()`.
2. Read `settlementPaused()`.
3. For job actions, read `getJobCore(jobId)` and `getJobValidation(jobId)`.
4. On AGI ERC20 contract, read `balanceOf(yourAddress)`.
5. On AGI ERC20 contract, read `allowance(yourAddress, AGIJobManagerAddress)`.
6. Confirm all `uint256` values are base units/seconds.

### Common failure modes

| Error/symptom | Likely cause | Fix |
|---|---|---|
| `NotAuthorized` | caller not role-authorized | use correct signer, proof, or ENS label route |
| `Blacklisted` | caller is blacklisted | owner must remove blacklist |
| `SettlementPaused` | settlement lane paused | wait for owner unpause |
| `InvalidState` | wrong lifecycle phase/time window | re-check timeline + read-contract data |
| `JobNotFound` | wrong job ID | verify event/read output |
| `InvalidParameters` | malformed URI/code/config | fix inputs |
| `TransferFailed` | insufficient balance/allowance or unsupported token transfer behavior | fix balance/allowance; use strict ERC20 |
| `InsufficientWithdrawableBalance` | owner withdrawal too large | use `withdrawableAGI()` bound |
| `InsolventEscrowBalance` | owner action would violate escrow solvency | reduce action amount |
| `ConfigLocked` | identity config already locked | cannot change identity config |
| `finalizeJob` opens dispute | validator outcomes/quorum unresolved | moderator resolution path is required |

### Employer burn readiness reason codes (plain English)

`getCreateJobFundingRequirement(payout)` returns `reasonCode` + `settlementPathCode`.

| reasonCode | Constant | Plain English |
|---:|---|---|
| 0 | `BURN_READINESS_OK` | Job is on an employer-win path and burn funding checks passed. |
| 1 | `BURN_READINESS_NOT_EMPLOYER_WIN_PATH` | Current job state is not an employer-win settlement path right now. |
| 2 | `BURN_READINESS_ALREADY_TERMINAL` | Job already completed or expired; no further settlement burn flow. |
| 3 | `BURN_READINESS_BURN_BPS_ZERO` | Employer burn rate is currently zero; no burn amount required. |
| 4 | `BURN_READINESS_INSUFFICIENT_BALANCE` | Employer wallet AGIALPHA balance is too low for the burn amount. |
| 5 | `BURN_READINESS_INSUFFICIENT_ALLOWANCE` | Employer approved amount is too low for AGIJobManager to burn. |
| 6 | `BURN_READINESS_SETTLEMENT_PAUSED` | Settlement lane is paused; settlement call will revert until unpaused. |

`settlementPathCode` quick reference:
- `0`: no active employer-win settlement path right now.
- `1`: employer-win through `finalizeJob`.
- `2`: employer-win through moderator dispute resolution.
- `3`: employer-win through stale-dispute owner resolution.

### Etherscan input formatting
- `bytes32`: `0x` + 64 hex chars.
- `bytes32[]`: JSON-like array, e.g. `[]` or `["0xaaa...","0xbbb..."]`.
- `string`: plain text (no wrapping quotes in field box).
- `uint256`: base-10 integer only.

Copy/paste examples:
```text
bytes32: 0x4f9d5f7a16f4f0f8307f57ca53f2d5000f2f4a1ec2a0b5f30c0f0e8f2ddaa9ce
bytes32[]: ["0x1111111111111111111111111111111111111111111111111111111111111111","0x2222222222222222222222222222222222222222222222222222222222222222"]
```

### Offline helper scripts (recommended)
- Merkle proofs (paste-ready `bytes32[]`):
  ```bash
  node scripts/merkle/export_merkle_proofs.js --input scripts/merkle/sample_addresses.json --output proofs.json
  ```
- Etherscan parameter blocks + checklists:
  ```bash
  node scripts/etherscan/prepare_inputs.js --action create-job --payout 1200 --duration 7d --jobSpecURI ipfs://bafy.../job.json --details "Translate legal packet EN->ES"
  ```
- Offline state advisor from pasted Read Contract outputs:
  ```bash
  node scripts/advisor/state_advisor.js --input scripts/advisor/sample_job_state.json
  ```

---

## B) Core role flows

## Employer flow

### 1) Approve escrow (AGI token contract)
Write: `approve(spender, amount)`

```text
spender: 0xAGIJobManagerAddress
amount: 1200000000000000000000   // 1200 AGI @ 18 decimals
```

### 2) Create job
Write: `createJob(jobSpecURI, payout, duration, details)`
- `jobSpecURI`: metadata URI
- `payout`: base units
- `duration`: seconds
- `details`: plain-language summary

```text
jobSpecURI: ipfs://bafy.../job-spec.v1.json
payout: 1200000000000000000000
duration: 259200
details: Translate legal packet EN->ES
```

Prepare this block automatically:
```bash
node scripts/etherscan/prepare_inputs.js --action create-job --payout 1200 --duration 3d --jobSpecURI ipfs://bafy.../job-spec.v1.json --details "Translate legal packet EN->ES"
```

### 3) Cancel job (only when allowed)
Write: `cancelJob(jobId)`
- `jobId`: numeric ID from `JobCreated` event / `totalJobs`

```text
jobId: 42
```

### 4) Finalize after windows
Write: `finalizeJob(jobId)`
- `jobId`: numeric ID to settle
- If the job settles employer-win and `employerBurnBps > 0`, AGIJobManager also executes `burnFrom(employer, burnAmount)` on AGIALPHA; ensure employer allowance/balance includes burn coverage.
- Verify burn-path observability in logs with `EmployerBurnChargedAtJobCreation(jobId, employer, token, amount, finalizer, settlementPathCode)`.

```text
jobId: 42
```

### 5) Dispute when needed
Write: `disputeJob(jobId)`
- `jobId`: numeric ID under active review/challenge conditions

```text
jobId: 42
```

## Agent flow

### Authorization routes (pick one)
1) owner additional allowlist (`addAdditionalAgent`), or
2) Merkle proof route (agent root), or
3) ENS subdomain ownership route.

### 1) Apply to job
Write: `applyForJob(jobId, subdomain, proof)`

- Merkle route example:
```text
jobId: 42
subdomain:
proof: ["0x111...","0x222..."]
```
- ENS route example:
```text
jobId: 42
subdomain: alice-agent
proof: []
```

Generate a copy/paste payload:
```bash
node scripts/etherscan/prepare_inputs.js --action apply --route merkle --jobId 42 --proof '["0x111...","0x222..."]'
```

### 2) Bond approval (if required by current params)
Write on AGI token: `approve(spender, amount)`.

### 3) Request completion
Write: `requestJobCompletion(jobId, jobCompletionURI)`

```text
jobId: 42
jobCompletionURI: ipfs://bafy.../completion.json
```

### 4) Optional dispute
Write: `disputeJob(jobId)` if still inside review window.

## Validator flow

### Authorization routes
1) owner additional allowlist (`addAdditionalValidator`), or
2) Merkle proof route (validator root), or
3) ENS subdomain ownership route.

### 1) Bond approval (if required)
Write on AGI token: `approve(spender, amount)`.

### 2) Vote approve
Write: `validateJob(jobId, subdomain, proof)`

```bash
node scripts/etherscan/prepare_inputs.js --action validate --route merkle --jobId 42 --proof '["0x111...","0x222..."]'
```

### 3) Vote disapprove
Write: `disapproveJob(jobId, subdomain, proof)`

```bash
node scripts/etherscan/prepare_inputs.js --action disapprove --route merkle --jobId 42 --proof '["0x111...","0x222..."]'
```

Outcomes can trigger:
- direct completion,
- dispute opening,
- validator slashing/reward settlement at final resolution.

## Moderator flow

Write: `resolveDisputeWithCode(jobId, resolutionCode, reason)`
- `jobId`: disputed job ID
- `resolutionCode`: `0` no-op, `1` agent wins, `2` employer wins
- `reason`: standardized evidence string (plain UTF-8 text)

Resolution code table:
- `0`: no-op bookkeeping (keeps dispute active)
- `1`: agent wins
- `2`: employer wins

Standardized reason format (recommended):
```text
EVIDENCE:v1|job:42|code:1|summary:Delivered spec v1|links:ipfs://...|moderator:0x...|ts:1735689600
```

Prepare moderator inputs:
```bash
node scripts/etherscan/prepare_inputs.js --action resolve-dispute --jobId 42 --code 1 --reason "EVIDENCE:v1|job:42|code:1|summary:Delivered spec v1|links:ipfs://...|moderator:0x...|ts:1735689600"
```

## Operator safety notes for ENSJobPages cutover

- **Scripted/deploy-tool actions:** deploy contracts, run verification attempts, emit deployment artifacts.
- **Manual Etherscan actions:** NameWrapper `setApprovalForAll(newEnsJobPages, true)` and AGIJobManager `setEnsJobPages(newEnsJobPages)`.
- **Role split:**
  - `setApprovalForAll(...)` must be sent by the **wrapped-root owner**.
  - `setEnsJobPages(...)` must be sent by the **AGIJobManager owner**.
- **Irreversible actions:** `lockConfiguration()` on ENSJobPages and `lockIdentityConfiguration()` on AGIJobManager.
- **Do not lock early:** lock only after post-cutover validation and any required legacy migrations.

## Owner/operator flow

Use with extreme caution:
- intake/settlement controls: `pause`, `unpause`, `pauseAll`, `unpauseAll`, `setSettlementPaused`
- role governance: `addAdditionalAgent`, `removeAdditionalAgent`, `addAdditionalValidator`, `removeAdditionalValidator`, `blacklistAgent`, `blacklistValidator`, `addModerator`, `removeModerator`
- risk params: quorum, approval/disapproval thresholds, review/challenge periods, bond/slash values
- withdrawals: `withdrawableAGI`, `withdrawAGI`
- ENS/identity config: `updateEnsRegistry`, `updateNameWrapper`, `updateRootNodes`, `setEnsJobPages`, `setUseEnsJobTokenURI`, `updateMerkleRoots`, `lockIdentityConfiguration`
- rescue paths: `rescueERC20`, `rescueToken`

---

## C) Time windows (ASCII timeline)

```text
assignment (assignedAt)
   |
   |--- agent works ---|
   |                   v
   |          requestJobCompletion()
   |                   |
   |<---- completionReviewPeriod ---->|  validators vote/dispute allowed
   |                                   v
   |                            review window end
   |                                   |
   |<-- challengePeriodAfterApproval -->| (only if validator-approved path active)
   |                                   v
   |                           finalizeJob() eligible
   |                                   |
   |                        (if contested) dispute open
   |                                   |
   |<------ disputeReviewPeriod ------>| owner stale-dispute fallback after this
```

### “Can I finalize now?” checklist
- `settlementPaused() == false`
- `getJobValidation(jobId).completionRequested == true`
- `getJobCore(jobId).disputed == false`
- now > `getJobValidation(jobId).completionRequestedAt + completionReviewPeriod`
- note: `validatorApproved` / `validatorApprovedAt` are not exposed by read getters; challenge-gated finalize checks may still revert and require conservative retry timing
- if revert still occurs, re-read `getJobValidation(jobId)` approvals/disapprovals and retry later

---

## D) Read-contract cheat sheet

Use these reads before any write:

- `getJobCore(jobId)` for ownership, assignment, payout/duration/assignedAt, and completed/disputed/expired flags.
- `getJobValidation(jobId)` for `completionRequested`, approvals/disapprovals, `completionRequestedAt`, and `disputedAt`.
- `challengePeriodAfterApproval` exists, but `validatorApproved`/`validatorApprovedAt` are not returned by public getters; use conservative timing and expect possible `InvalidState` until challenge gates have elapsed.
- `getJobSpecURI(jobId)` to confirm expected job payload.
- `getJobCompletionURI(jobId)` to verify submitted completion evidence.
- `tokenURI(tokenId)` for NFT metadata URI (base or ENS job pages path, depending on configuration).

---

## E) Authorization decision tree

### ENS label constraints
For ENS route, `subdomain` must be:
- lowercase ASCII,
- 1..63 chars,
- `[a-z0-9-]` only,
- no dots,
- no leading/trailing dash.

### Which route are you using?
```text
Start
 ├─ Is your address in additionalAgents/additionalValidators?
 │   └─ Yes → route=allowlist, proof=[]
 ├─ Do you have an owner-published Merkle proof for your address?
 │   └─ Yes → route=merkle, paste proof bytes32[]
 └─ Otherwise use ENS ownership route
     └─ route=ens, set valid subdomain label, proof=[]
```

Helper commands:
```bash
node scripts/merkle/export_merkle_proofs.js --input scripts/merkle/sample_addresses.json --output proofs.json
node scripts/etherscan/prepare_inputs.js --action apply --route merkle --jobId 42 --proof '["0x...","0x..."]'
node scripts/advisor/state_advisor.js --input scripts/advisor/sample_job_state.json
```

---

## F) FAQ (EmployerBurn, plain English)

### Q1) Why do I need a second approval if I already escrowed payout AGIALPHA?
Escrow approval and employer-burn approval are separate token spends. Escrow is consumed when creating the job; burn is consumed later only if settlement is employer-win.

### Q2) Can AGIJobManager burn tokens from any wallet?
No. Burn uses `burnFrom(employer, amount)` on the employer tied to that job and requires that employer's allowance.

### Q3) Can the protocol treasury pay my burn for me?
No. Burn source is employer wallet authorization only. Protocol-held balances are not used to satisfy burn.

### Q4) Why did my finalize/dispute tx revert?
Most common reasons: settlement paused, job not in eligible employer-win path, insufficient AGIALPHA allowance, insufficient AGIALPHA balance, or wrong signer for moderator/owner-only paths.

### Q5) Is permit required?
No. Standard `approve` is supported and is the default Etherscan-first path.

---

## G) Short glossary (non-technical)

- **Allowance:** token permission you give a spender contract to move/burn up to a limit.
- **Spender:** contract address that uses your allowance. Here, spender is AGIJobManager.
- **Burn:** permanent token destruction that reduces total supply.
- **Basis points (bps):** 1 bps = 0.01%; 100 bps = 1%.
- **Finalization:** closing a job into a terminal outcome.
- **Employer-win:** settlement path where employer receives refund-side outcome.
- **Permit:** signature-based allowance method (EIP-2612) as an alternative to `approve`.
- **Paused:** emergency stop state where protected functions revert.
- **Revert:** transaction fails and all state changes in that tx are undone.
- **Event:** log emitted by a contract, used as verifiable evidence of what happened.
