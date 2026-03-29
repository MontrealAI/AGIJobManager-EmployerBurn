# Release Reconciliation Note — EmployerBurn Mainnet Finalization (2026-03-29)

## What changed from upstream AGIJobManager

1. Employer-favor settlement paths enforce employer-authorized AGIALPHA burn via `burnFrom(employer, amount)`.
2. Dedicated EmployerBurn event emitted for observability: `EmployerBurnEnforced(...)`.
3. Additive read helper supports Etherscan-first readiness and quoting (`EmployerBurnReadHelper`).
4. Hardhat is the canonical production deploy/verify/release workflow.
5. Root scripts now route operators to canonical Hardhat release commands.

## What remains intentionally named `AGIJobManager` and why

- Contract name `AGIJobManager` is intentionally retained for ABI/deployment compatibility and ecosystem continuity.
- Existing interfaces, events, and storage layout are preserved unless additive changes are required.
- Documentation explicitly brands this repository as the EmployerBurn production variant while keeping on-chain compatibility names.

## Legacy tool status

- Truffle remains for historical reproducibility and compatibility testing only.
- Legacy commands are explicitly marked with `:legacy` suffix to prevent accidental use as production default.

## Remaining human sign-off items (non-Codex)

- Independent external audit sign-off.
- Mainnet multisig/operator key ceremony and transaction sign-off.
- Production change-management approval.
