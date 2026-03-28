# Upstream AGIJobManager Reconciliation (EmployerBurn Variant)

## What changed from upstream AGIJobManager

This repository is the **EmployerBurn variant**. Operator-facing behavior changes are:

1. Employer-win settlement paths enforce AGIALPHA burn from employer-authorized balance (`burnFrom`).
2. Additive periphery helper `EmployerBurnReadHelper` supports Etherscan-first readiness and allowance/balance checks.
3. Repository/package/docs/scripts are reconciled to present this repo as `AGIJobManager-EmployerBurn` while preserving compatibility identifiers where needed.
4. Burn observability uses `EmployerBurned(jobId, employer, amount)` for employer-win burn tracing.

## What remains intentionally named AGIJobManager (and why)

These identifiers are intentionally preserved for compatibility, audit continuity, and operational interoperability:

- Solidity contract name `AGIJobManager`.
- Existing ABI methods/events/state names that external tooling already integrates with.
- Legacy documentation references when they are clearly historical or compatibility-focused.

We do **not** rename on-chain ABI identities purely for branding because that creates integration and verification risk.

## Compatibility policy

- Preserve on-chain names/interfaces unless a security invariant requires change.
- Prefer additive extensions (periphery/helper docs/scripts) over ABI-breaking refactors.
- Keep operator docs explicit about which naming is compatibility-preserved versus product/repository identity.
