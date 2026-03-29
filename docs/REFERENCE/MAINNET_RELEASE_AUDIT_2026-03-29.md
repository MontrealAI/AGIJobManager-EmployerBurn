# Mainnet Release Audit Artifacts (2026-03-29)

## 1) Outcome Matrix
- `finalizeJob` employer-win lane (`approvals < disapprovals`) routes to `_refundEmployer` and enforces `burnFrom(employer, burnAmount)` when burn bps is non-zero.
- `resolveDisputeWithCode(jobId,2,...)` routes to `_refundEmployer`.
- `resolveStaleDispute(jobId,true)` routes to `_refundEmployer`.
- Agent-win/expiry/cancel paths do not call employer burn.

## 2) Burn Amount Source Note
- Burn amount source is `burnAmount = (job.payout * employerBurnBps) / 10_000`.
- Token source is employer wallet via AGIALPHA `burnFrom(job.employer, burnAmount)` allowance.

## 3) Existing EmployerBurn Surface Audit
- Burn event surface: `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)`.
- Settlement path code mapper: `finalizeJob=1`, `resolveDisputeWithCode=2`, `resolveStaleDispute=3`.

## 4) Repo-Wide Stale Reference Inventory
- Canonical docs with stale `agijob` default prefix references were updated to `aijob`.
- Canonical deployment docs with ambiguous Truffle-first language were kept as legacy and Hardhat-first pointers were preserved.

## 5) Docs Canonicality Audit
- Canonical operator docs audited: root README, hardhat README, deployment index/runbooks, owner runbook, Etherscan guide, mainnet checklist.

## 6) Bypass Analysis
- Employer-win terminal outcomes in authoritative code call `_refundEmployer`; no alternate burn-free employer-win lane exists.
- Permissionless `finalizeJob` is intentional; caller can trigger settlement but burn source remains employer allowance.

## 7) External Token Verification Note
- Mainnet AGIALPHA token remains pinned to `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA` in canonical docs/checklists.

## 8) Deployability / Size Note
- Runtime limit: EIP-170 `MAX_CODE_SIZE = 24,576` bytes.
- Initcode limit: EIP-3860 `MAX_INITCODE_SIZE = 49,152` bytes.
- Repository size gates continue enforcing both limits with no-growth baseline guard for AGIJobManager.

## 9) Change-Minimization Plan
- Keep AGIJobManager settlement authority unchanged.
- Apply targeted hardening to ENS root/prefix handling and deploy script safety output/guards.
- Expand script/doc checks and tests for regression containment.
