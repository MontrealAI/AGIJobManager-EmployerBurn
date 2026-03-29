# Toolchain Canonicality (Mainnet Release)

Date: 2026-03-29 (UTC)

## Canonical production path

- **Canonical deployment + verification toolchain:** Hardhat.
- **Canonical deploy/verify artifact source:** `hardhat/artifacts/**`.
- **Canonical release wrappers:** root `release:*` scripts that dispatch to Hardhat scripts.

## Non-canonical toolchains

- **Truffle:** legacy compatibility + historical reproducibility only.
- **Foundry:** audit/fuzz/invariant testing only.

Neither Truffle nor Foundry outputs are a production deployment source of truth for mainnet release in this repository variant.

## Why this split exists

- Hardhat scripts implement the operator-safe confirmation gates (`DEPLOY_CONFIRM_MAINNET`) and release wrappers (`doctor`, `release:build`, `release:dry-run`, `release:deploy:mainnet`, `release:verify`, `release:postdeploy`, `release:readiness`).
- Bytecode size checks are enforced from Hardhat artifacts by default.
- Documentation and repository consistency checks explicitly require Hardhat-first wording and legacy fencing for Truffle/Foundry.

## Compatibility note

On-chain contract names remain `AGIJobManager` / `ENSJobPages` for ABI and deployment compatibility. Repository/operator identity is intentionally `AGIJobManager EmployerBurn variant`.
