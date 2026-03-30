# Testing

## Current strategy

- **Canonical release gate (Hardhat-first orchestration):** `npm run test:canonical` calls `npm run release:readiness`.
- **EmployerBurn successor semantics suite:** `npm run test:employerburn` (Truffle compatibility runner used by the canonical readiness gate).
- **Foundry suites:** `forge-test/` for fuzz and invariant hardening (non-canonical deployment toolchain).
- **UI smoke checks:** ABI sync and front-end critical path validation.

## Test matrix

| Suite | Purpose | Command | Validates |
| --- | --- | --- | --- |
| Canonical release readiness lane | Preflight + compile + size + docs + employer-burn settlement tests | `npm run test:canonical` | Mainnet release safety gate |
| EmployerBurn createJob-only lane | CreateJob-burn + no-later-burn semantics tests | `npm run test:employerburn` | Burn correctness + anti-subsidy behavior |
| Full regression lane (default `npm test`) | Legacy-wide Truffle/Node regression + canonical readiness | `npm test` | Prevents non-EmployerBurn regression drift in CI |
| Lint lane | Solidity lint rules | `npm run lint` | Style/safety linting |
| Bytecode lane | EIP-170/EIP-3860 hard limits + no-growth budget | `npm run size` | Deployability constraints |
| UI smoke lane | Contract/UI integration sanity | `npm run test:ui` | ABI + flow coherence |
| Optional foundry lane | Fuzz/invariant stress | `forge test` | Property-based resilience |

## Optional hardening tooling

- Slither config exists in [`slither.config.json`](../slither.config.json). Run if locally installed.
- Foundry config exists in [`foundry.toml`](../foundry.toml) and is explicitly audit/fuzz-only.
