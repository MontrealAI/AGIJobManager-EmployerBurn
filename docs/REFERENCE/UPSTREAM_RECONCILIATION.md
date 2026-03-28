# Upstream Reconciliation (EmployerBurn Variant)

## What changed from upstream AGIJobManager

- This repository is the **EmployerBurn variant** of AGIJobManager for production operations.
- Employer-favor settlement paths enforce employer-authorized AGIALPHA burns via `burnFrom(employer, amount)`.
- Etherscan-first additive helper surface exists in `EmployerBurnReadHelper` for preflight/readiness checks.
- Repository metadata, deployment docs, and owner/operator runbooks are aligned to EmployerBurn-first operations.

## What remains intentionally named AGIJobManager and why

The following names remain intentionally preserved for compatibility and audit continuity:

- Solidity contract name `AGIJobManager`.
- Existing ABI identifiers and lifecycle functions (for example `finalizeJob`, `resolveDisputeWithCode`).
- Historical docs and generated references that describe upstream-compatible interfaces.

Rationale: renaming the on-chain contract or established ABI identifiers would add integration risk and create avoidable migration complexity for existing operators, tooling, and external integrations.
