# Mainnet Release Audit — 2026-03-29

## 1) Outcome Matrix

| Settlement path | Employer-favor outcome? | Burn enforced? | Notes |
| --- | --- | --- | --- |
| `finalizeJob` with disapprovals > approvals | Yes | Yes (`_refundEmployer`) | Authoritative path in AGIJobManager core. |
| `resolveDisputeWithCode(..., RESOLVE_FOR_EMPLOYER, ...)` | Yes | Yes (`_refundEmployer`) | Moderator-only path. |
| `resolveStaleDispute(..., employerWins=true)` | Yes | Yes (`_refundEmployer`) | Owner stale-dispute path. |
| Agent-win paths | No | No | Settles via `_completeJob`. |
| cancel/expire paths | No | No | No employer burn in these outcomes. |

## 2) Burn Amount Source Note

`burnAmount = (job.payout * employerBurnBps) / 10_000` and is executed with `burnFrom(job.employer, burnAmount)` against AGIALPHA configured in constructor (`agiToken`).

## 3) Existing EmployerBurn Surface Audit

- Core enforcement: `contracts/AGIJobManager.sol::_refundEmployer`.
- Config control: `setEmployerBurnBps(uint256)` owner-only capped at 100%.
- Observability: `EmployerBurnEnforced(jobId, employer, token, amount, finalizer, settlementPathCode)`.
- Etherscan periphery helpers: `contracts/periphery/EmployerBurnReadHelper.sol`.

## 4) Repo-Wide Stale Reference Inventory (resolved this release)

- Root scripts previously defaulted to Truffle (`build`, `test`, deploy command naming).
- Production flow ambiguity between root Truffle and `hardhat/`.
- Compiler profile mismatch between Truffle and Hardhat.

## 5) Docs Canonicality Audit

Canonical documents now point to Hardhat-rooted release command surface and treat Truffle as compatibility-only.

## 6) Bypass Analysis

All employer-win terminal paths call `_refundEmployer`; no alternate employer-win terminal function bypasses `_refundEmployer` in current authoritative state machine.

## 7) External Token Verification Note

AGIALPHA mainnet token (`0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`) verified ABI includes `burnFrom(address,uint256)`, `permit(...)`, `paused()/pause()/unpause()` and role-gated pause/admin controls; therefore token pause state can block burn and must revert employer-win settlement atomically if active.

## 8) Deployability / Size Note

Mainnet limits used for release gates:
- Runtime code size limit: 24,576 bytes (EIP-170).
- Initcode limit: 49,152 bytes (EIP-3860).

Release scripts enforce both hard limits plus no-growth baseline checks.

## 9) Change-Minimization Plan (executed)

- Preserve AGIJobManager lifecycle authority and existing burn enforcement design.
- Do not move settlement logic out of core.
- Canonicalize release path around Hardhat and tighten release/size/docs gates.
- Keep Truffle only as explicit legacy compatibility tooling.
