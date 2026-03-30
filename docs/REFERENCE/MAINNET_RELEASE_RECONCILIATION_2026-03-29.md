> **Historical note (deprecated):** This reconciliation captured pre-successor settlement-burn semantics and is retained only as an archive record. For corrected requirements, use createJob-only burn release `v0.2.0` and current docs.

# Mainnet Release Reconciliation (2026-03-29)

## 1) Outcome Matrix
| Settlement path | Function entrypoint | Winner | Burn required | Notes |
| --- | --- | --- | --- | --- |
| finalize after review with disapprovals > approvals and quorum met | `finalizeJob` | Employer | Yes | Calls `_refundEmployer`, emits `EmployerBurnEnforced` when burn amount > 0. |
| moderator dispute resolution code 2 | `resolveDisputeWithCode` | Employer | Yes | Calls `_refundEmployer`. |
| owner stale dispute with employerWins=true | `resolveStaleDispute` | Employer | Yes | Calls `_refundEmployer`. |
| finalize agent-win routes | `finalizeJob` | Agent | No | Calls `_completeJob`. |
| dispute resolve agent-win | `resolveDisputeWithCode` code 1 | Agent | No | Calls `_completeJob`. |
| cancel / expire paths | `cancelJob` / `expireJob` | Employer refund | No | Not employer-win finalization path. |

## 2) Burn Amount Source Note
- Burn source is `IAGIALPHABurnable(address(agiToken)).burnFrom(job.employer, burnAmount)`.
- Burn amount is `job.payout * employerBurnBps / 10_000`.
- Burn does not draw from protocol-held balances.

## 3) Existing EmployerBurn Surface Audit
- Core enforcement: `contracts/AGIJobManager.sol` `_refundEmployer`.
- Event traceability: `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)`.
- Etherscan helper: `contracts/periphery/EmployerBurnReadHelper.sol`.
- Tests: `test/employerBurn.finalization.test.js`, `test/employerBurn.readHelper.test.js`.

## 4) Repo-Wide Stale Reference Inventory
- Legacy script alias removed from canonical docs: `deploy:agijobmanager:prod`.
- Legacy Truffle path preserved under explicit `*:legacy` script names.
- Foundry role explicitly fenced as audit/fuzz-only in canonical docs and config comments.
- Canonical docs now reference `release:*` Hardhat-first wrappers.
- Toolchain split documented in `docs/REFERENCE/TOOLCHAIN_CANONICALITY.md`.

## 5) Docs Canonicality Audit
- Canonical docs contain Hardhat-first commands (`README.md`, `hardhat/README.md`, `MAINNET_DEPLOYMENT_CHECKLIST.md`).
- Docs drift gate strengthened in `scripts/docs/check-canonical-surface-sync.mjs`.

## 6) Bypass Analysis
- Employer-win settlement cannot bypass burn because all employer-win terminal paths route to `_refundEmployer`.
- No additional employer-win settlement function bypassing `_refundEmployer` found.

## 7) External Token Verification Note
Verified from the Ethereum mainnet Etherscan verified source page for `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA` (checked on 2026-03-29 UTC):
- `burnFrom(address,uint256)` exists.
- `permit(...)` exists.
- `pause()`, `unpause()`, `paused()` and `ERC20Pausable` behavior exist.
- Paused token state can block burn/finalization and safely reverts the settlement path.

## 8) Deployability / Size Note
Mainnet hard limits verified from canonical EIP specs:
- EIP-170 `MAX_CODE_SIZE = 0x6000 (24,576 bytes)`.
- EIP-3860 `MAX_INITCODE_SIZE = 2 * MAX_CODE_SIZE = 49,152 bytes`.
- Candidate successor proposals (for example EIP-7907 and EIP-7954) are drafts and are **not active mainnet rules** as of 2026-03-29 UTC.

Canonical size gate runs against Hardhat artifacts by default (`npm run size`) and enforces a checked-in no-growth baseline guard for `AGIJobManager`.

## 9) Change-Minimization Plan (implemented)
- Preserve core AGIJobManager settlement semantics.
- Keep burn enforcement in existing authoritative `_refundEmployer` path.
- Avoid ABI/storage churn.
- Move release workflow improvements into scripts/docs/checks rather than core-contract growth.

## 10) Canonical Test/Release Command Reconciliation
- Root `npm test` now runs full `test:core` regression first, then `test:canonical` (`release:readiness`) so CI keeps broad regression coverage while preserving Hardhat-first release orchestration.
- EmployerBurn settlement assertions remain explicitly executed via `test:employerburn`; `test:legacy:employerburn` remains as compatibility alias only.
- Legacy Truffle deployment guide was relabeled to compatibility-only (`docs/Deployment.md`) to prevent production-path ambiguity.
