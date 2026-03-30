# Deployment Documentation Index

> [!WARNING]
> Old paused release semantics burned on employer-win settlement/refund paths. For corrected requirements, deploy the successor createJob-only burn release (`v0.2.0`) and keep old deployment deprecated.

## Start here by deployment task
- Fresh deployment (official path): [../../hardhat/README.md](../../hardhat/README.md)
- ENSJobPages replacement/cutover: [./ENS_JOB_PAGES_MAINNET_REPLACEMENT.md](./ENS_JOB_PAGES_MAINNET_REPLACEMENT.md)
- Owner web-only deployment/operations: [./OWNER_MAINNET_DEPLOYMENT_AND_OPERATIONS_GUIDE.md](./OWNER_MAINNET_DEPLOYMENT_AND_OPERATIONS_GUIDE.md)
- Migration announcement: [../REFERENCE/MIGRATION_ANNOUNCEMENT_V0_2_0.md](../REFERENCE/MIGRATION_ANNOUNCEMENT_V0_2_0.md)

## Canonical answers for operators
- Recommended deployment path: **Hardhat**.
- Source-of-truth production artifact: Hardhat build output (`hardhat/artifacts`).
- Foundry status: audit/fuzz testing only (non-canonical for deployment artifacts).
- Truffle status: legacy/supported for backward compatibility.
- ENS replacement is additive and requires manual post-deploy wiring.
- ENS default job label prefix in current code/docs is `aijob` (owner-changeable before ENSJobPages `lockConfiguration()`).
- Do not lock ENS/identity configuration until cutover + migration checks pass.

## EmployerBurn variant deployment identity

- Repository identity is the **AGIJobManager EmployerBurn variant**.
- On-chain contract name remains `AGIJobManager` for compatibility, while operator guidance is EmployerBurn-first.
- Reconciliation reference: `docs/REFERENCE/UPSTREAM_RECONCILIATION.md`.

## 1) Hardhat (recommended / official)

- [Hardhat Operator Guide](../../hardhat/README.md)
- [ENSJobPages Mainnet Replacement Runbook](./ENS_JOB_PAGES_MAINNET_REPLACEMENT.md)
- [Ethereum Mainnet Beta Deployment Record](./MAINNET_BETA_DEPLOYMENT_RECORD.md)
- [Official Mainnet Deployment Record](./MAINNET_OFFICIAL_DEPLOYMENT_RECORD.md)

## 2) Truffle (legacy / compatibility-only)

- [Ethereum Mainnet Deployment, Verification & Ownership Transfer Guide (Truffle)](./MAINNET_TRUFFLE_DEPLOYMENT.md)
- [Truffle Mainnet Deploy](./TRUFFLE_MAINNET_DEPLOY.md)
- [Truffle Production Deploy](./TRUFFLE_PRODUCTION_DEPLOY.md)

> Truffle migrations remain available for backward compatibility and historical reproducibility only. They are not the canonical production release path.

## UI boundary during deployment operations

- Standalone HTML UI artifacts are additive client surfaces, not deployment authority.
- If you are using the standalone `v21` page for operational review, pair it with:
  - `../ui/GENESIS_JOB_MAINNET_HTML_UI.md`
  - `../../ui/README.md`
- For deployment/cutover decisions, this index and `../../hardhat/README.md` remain canonical.
