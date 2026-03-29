# EmployerBurn Release Handoff (2026-03-29)

## What changed
- ENSJobPages default prefix changed from `agijob` to `aijob`.
- ENS root safety remains enforced on-chain using lowercase ASCII LDH subset + on-chain namehash/root-node equality checks.
- Hardhat deploy scripts were hardened for clearer mainnet/dry-run guidance and explicit mainnet env requirements in ENS cutover flow.
- Added script-safety regression test coverage and canonical docs-sync checks for the `aijob` default.
- Tightened release-readiness aggregation so `release:verify` and `release:postdeploy` are now mandatory gates in the same exact-commit readiness run.
- Added `scripts/docs/check-release-gates.mjs` so canonical release script wiring (`doctor`, `release:build`, `release:dry-run`, `size`, `release:verify`, `release:postdeploy`, `release:readiness`) is enforced in CI/docs checks.

## What remained intentionally unchanged
- On-chain contract names remain `AGIJobManager` / `ENSJobPages` for ABI/address compatibility.
- Employer burn economics remain unchanged: burn only on employer-win finalization paths and only via employer `burnFrom` authorization.
- ENS hooks remain best-effort and non-authoritative for settlement correctness.

## External sign-offs still required
- Independent security review / audit sign-off.
- Owner/operator final review of mainnet config values and multisig signer controls.
- Live mainnet dry-run/output approval before final broadcast.
