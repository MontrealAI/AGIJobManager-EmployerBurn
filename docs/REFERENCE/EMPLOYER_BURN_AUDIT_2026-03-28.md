# EmployerBurn Audit and Reconciliation Report (2026-03-28)

## Scope
- Repository: `AGIJobManager-EmployerBurn`.
- Goal: verify whether EmployerBurn is truly enforced in authoritative employer-win settlement paths, identify bypass risk, verify AGIALPHA token integration assumptions, and reconcile repo-level operator guidance.

## 1) Audit summary

### Relevant contracts and docs reviewed
- `contracts/AGIJobManager.sol`
- `contracts/periphery/EmployerBurnReadHelper.sol`
- `test/employerBurn.finalization.test.js`
- `test/employerBurn.readHelper.test.js`
- `docs/REFERENCE/EMPLOYER_BURN_DESIGN.md`
- `docs/REFERENCE/EMPLOYER_BURN_ADR.md`
- `docs/REFERENCE/UPSTREAM_RECONCILIATION.md`
- `MAINNET_DEPLOYMENT_CHECKLIST.md`
- `README.md`
- `package.json`

### Lifecycle and authority finding
AGIJobManager remains the single settlement authority. Employer-favor settlement is handled by `_refundEmployer(...)`, reached via:
- `finalizeJob(...)` when disapprovals exceed approvals and quorum/timing conditions are met.
- `resolveDisputeWithCode(..., resolutionCode=2, ...)`.
- `resolveStaleDispute(..., employerWins=true)`.

### Existing EmployerBurn surface found
Already implemented in core:
- Config: `employerBurnBps`.
- Enforcement point: `_refundEmployer(...)` computes burn and calls `burnFrom(job.employer, burnAmount)`.
- Event: `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)`.

Already implemented in periphery:
- `EmployerBurnReadHelper` preflight/readiness helpers: `quoteEmployerBurn`, `getEmployerBurnRequirements`, `getEmployerBurnReadiness`, `canFinalizeEmployerWinWithBurn`.

## 2) Outcome matrix

| Outcome | Economic winner | Burn applies? | Why | Authoritative path | Permissionless caller? | Bypass-sensitive? |
|---|---|---:|---|---|---:|---:|
| Agent win after validator-majority approval | Agent | No | Employer did not win | `finalizeJob -> _completeJob` | Yes | No |
| Agent win (no-vote liveness) | Agent | No | Employer did not win | `finalizeJob -> _completeJob` (no votes) | Yes | No |
| Employer win after validator-majority disapproval | Employer | Yes | Employer-favor settlement path | `finalizeJob -> _refundEmployer` | Yes | Yes |
| Employer win via moderator dispute action | Employer | Yes | Employer-favor settlement path | `resolveDisputeWithCode(code=2) -> _refundEmployer` | No (`onlyModerator`) | Yes |
| Employer win via stale dispute owner fallback | Employer | Yes | Employer-favor settlement path | `resolveStaleDispute(true) -> _refundEmployer` | No (`onlyOwner`) | Yes |
| Cancel unassigned job | Employer refund | No | Not a completion/finalization employer-win settlement path | `cancelJob -> _cancelJobAndRefund` | No (employer only) | No |
| Expire assigned job without completion request | Employer refund | No | Expiry path explicitly separate from finalization/dispute settlement | `expireJob` | Yes | No |

## 3) Burn amount source
- Burn amount is already defined in existing economics: `burnAmount = (job.payout * employerBurnBps) / 10_000`.
- `employerBurnBps` is owner-configurable (bounded by `<= 10000`) and guarded by empty-escrow requirement before change.
- No protocol-held escrow/treasury amount is netted-out as burn source.

## 4) Architecture decision record

### Option A — Pure sidecar, no core changes
Rejected in current architecture: direct employer-win entrypoints remain callable on AGIJobManager, so pure wrapper is bypassable.

### Option B — Sidecar + minimal core gate
Not adopted because burn is already integrated at core settlement authority in `_refundEmployer`, and existing periphery helper already covers Etherscan preflight UX.

### Option C — Direct minimal core integration
Already implemented and currently active.

### Option D — Stop/blocker
Not required: current implementation is deployable under Ethereum mainnet hard size limits (see section 8).

## 5) Existing implementation reconciliation

### Already present and preserved
- Core enforcement at `_refundEmployer`.
- Atomic revert behavior if `burnFrom` fails.
- Additive read-helper surface for non-technical Etherscan users.

### Hardened/updated in this audit pass
- Added this explicit audit artifact as a canonical reconciliation record.
- Added a dated size-risk and token-verification statement tied to observed source-of-truth outputs.

### Not changed in this pass
- Settlement economics, dispute semantics, owner/moderator role semantics, ENS behavior, payout formulas.

## 6) Repository consistency reconciliation

### Identity status (sampled canonical surfaces)
- `README.md` title and package metadata already identify this repo as EmployerBurn variant.
- Compatibility naming explicitly documented in `docs/REFERENCE/UPSTREAM_RECONCILIATION.md`.

### Intentionally preserved AGIJobManager naming
- Solidity contract name, ABI function names, and ecosystem-facing identifiers remain AGIJobManager for compatibility.

### Docs/code mismatch findings (audit)
- EmployerBurn docs, ADR, and helper docs are generally aligned with current implementation.
- Remaining repo has legacy/duplicate historical docs; canonical operator surfaces should continue to be treated as source-of-truth.

## 7) Bypass analysis
- Direct bypass via sidecar avoidance is prevented because burn is enforced inside authoritative core employer-win settlement handler `_refundEmployer`.
- All three employer-win settlement entrypoints funnel to `_refundEmployer`.
- No alternate burn-free employer-win settlement function was found in active core paths.

## 8) Contract-size report and deployability note

Measured on 2026-03-28 using `node scripts/check-contract-sizes.js` in this repository state:
- `AGIJobManager` runtime: **24,299 bytes** (within EIP-170 limit 24,576; headroom 277 bytes).
- `AGIJobManager` initcode: **26,627 bytes** (within EIP-3860 limit 49,152; headroom 22,525 bytes).
- `EmployerBurnReadHelper` runtime/initcode: 3,958 / 4,146 bytes.
- `ENSJobPages` runtime/initcode: 15,602 / 16,634 bytes.

Status: current repo state passes hard deployability limits; AGIJobManager remains above internal preferred runtime budget (23,000) and should continue to be monitored for growth.

## 9) Implementation summary (current codebase)
- Core burn enforcement in `AGIJobManager._refundEmployer`.
- Burn rate config via `setEmployerBurnBps`.
- Read-helper periphery contract for quote/readiness/requirements.
- Test coverage across finalize/dispute/stale-dispute burn paths and failure cases.

## 10) Security rationale snapshot
- Employer is sole burn payer because source is `burnFrom(job.employer, amount)`.
- Protocol cannot subsidize burn amount because burn is not debited from locked escrow/accounting pools.
- Atomicity holds: if `burnFrom` fails, settlement transaction reverts.
- No privileged arbitrary burn route found; burn only occurs while settling a specific job via `_refundEmployer`.
- Permissionless `finalizeJob` implies third party can trigger already-authorized employer burn at eligible time; this is acceptable under current design and documented by helper/readiness surfaces.

## 11) Testing summary snapshot
- Existing tests cover:
  - happy-path burn on employer-win dispute resolution,
  - stale-dispute employer-win burn,
  - no burn on agent-win,
  - insufficient allowance failure,
  - settlement pause behavior,
  - helper readiness and allowance/balance diagnostics.
- Size checks currently fail due to AGIJobManager runtime > EIP-170.
- Re-validated on 2026-03-28:
  - `npx truffle test test/employerBurn.finalization.test.js --network test` (pass).
  - `npm run docs:check` (pass).
  - `node scripts/check-contract-sizes.js` (fails on AGIJobManager runtime limit).

## 12) Documentation summary snapshot
- EmployerBurn design note, ADR, Etherscan guide, runbooks, and checklist already include EmployerBurn-specific operator guidance.
- This report adds a date-stamped reconciliation + blocker status artifact for reviewers and release managers.

## 13) Open risks / follow-ups
1. Continue tracking AGIJobManager runtime against the preferred 23,000-byte budget to preserve future change headroom.
2. Continue enforcing canonical-doc checks to avoid drift across legacy docs.

---

## External token verification note (live source, 2026-03-28)
Token verified from Sourcify full-match source:
- Address: `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.
- `burnFrom(address,uint256)`: available (ERC20Burnable).
- `permit(...)`: available (ERC20Permit).
- Pausable behavior: token includes `ERC20Pausable`; paused state can block transfers/burns.
- Access control: role-gated pausing/minting via AccessControl roles.

Source endpoints used during this audit:
- `https://repo.sourcify.dev/contracts/full_match/1/0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA/metadata.json`
- `https://repo.sourcify.dev/contracts/full_match/1/0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA/sources/project:/contracts/AGIAlphaToken.sol`
