# Testing

## Current strategy

- **Canonical release gate (Hardhat-first orchestration):** `npm test` runs `npm run test:canonical`, which calls `npm run release:readiness`.
- **EmployerBurn settlement regression suite:** `npm run test:employerburn` (Truffle compatibility runner used by the canonical readiness gate).
- **Foundry suites:** `forge-test/` for fuzz and invariant hardening (non-canonical deployment toolchain).
- **UI smoke checks:** ABI sync and front-end critical path validation.

## Test matrix

| Suite | Purpose | Command | Validates |
| --- | --- | --- | --- |
| Canonical release readiness lane | Preflight + compile + size + docs + employer-burn settlement tests | `npm test` | Mainnet release safety gate |
| EmployerBurn settlement lane | Direct settlement-path and burn enforcement tests | `npm run test:employerburn` | Burn correctness + anti-subsidy behavior |
| Lint lane | Solidity lint rules | `npm run lint` | Style/safety linting |
| Bytecode lane | EIP-170/EIP-3860 hard limits + no-growth budget | `npm run size` | Deployability constraints |
| UI smoke lane | Contract/UI integration sanity | `npm run test:ui` | ABI + flow coherence |
| Optional foundry lane | Fuzz/invariant stress | `forge test` | Property-based resilience |

## Optional hardening tooling

- Slither config exists in [`slither.config.json`](../slither.config.json). Run if locally installed.
- Foundry config exists in [`foundry.toml`](../foundry.toml) and is explicitly audit/fuzz-only.
