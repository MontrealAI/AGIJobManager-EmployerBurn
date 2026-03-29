# Test Status

## Latest deterministic validation snapshot (2026-03-29)

Canonical checks were executed from repository root and completed successfully.

### Commands and outcomes

- `npm run release:readiness` ✅
- `npm run test:core` ✅ (legacy full regression suite retained as a merge gate)
- `npm test` ✅ (routes to the canonical release-readiness gate)
- `npm run size` ✅

### Environment notes

- `npm` may print non-blocking environment/deprecation warnings depending on local configuration.
- Canonical release orchestration is Hardhat-first (`release:readiness`), while default `npm test` still includes the full `test:core` regression lane before readiness checks.

### Size gate snapshot (Hardhat artifacts)

- `AGIJobManager` runtime: **24,339 bytes** (EIP-170 hard limit: 24,576; headroom 237 bytes).
- `AGIJobManager` initcode: **26,667 bytes** (EIP-3860 hard limit: 49,152; headroom 22,485 bytes).

This passes hard mainnet deployability limits and remains guarded by the checked-in no-growth baseline policy.
