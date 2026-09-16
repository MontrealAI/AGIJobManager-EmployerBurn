# Validation record — v0.3.0

Prepared 2026-09-16 for source commit `cdf75e7a95afa0894be253a1929d3ca5e8c16ca1`, tree `2669f53eb05dcb1f87d38114611cc622ad4c0268`.

## Evidence

| Check | Result | Scope |
| --- | --- | --- |
| GitHub CI, run 24054258867 | PASS, historical | Exact source commit; install, lint, build, size, tests, existing UI smoke |
| GitHub Docs Integrity, run 24054258883 | PASS, historical | Exact source commit |
| GitHub Security Verification, run 24054258894 | PASS, historical | Exact source commit; Foundry unit/fuzz/invariants and configured Slither |
| GitHub UI CI, run 24052606787 | PASS, historical | PR #80 head; UI tree identical to release source |
| Root `npm ci --ignore-scripts` | PASS, fresh | Local dependencies only; install hooks intentionally not executed |
| `npm run docs:check` | PASS, fresh | Source documentation checks |
| `npm run docs:ens:check` | PASS, fresh | ENS documentation checks |
| `npm run lint` | PASS, fresh | Zero errors; four existing warnings |
| `npm run check:no-binaries` | PASS, fresh | Repository binary-addition policy |
| `node scripts/release/verify-employerburn-ui.mjs` | PASS, fresh | 16 targeted checks; actual extracted UI functions with mocked environment |
| `POSTDEPLOY_REQUIRE_SUCCESSOR_HELPER=1 node scripts/hardhat/postdeploy-validate.mjs` | FAIL, reproduced | Committed historical receipt lacks EmployerBurnReadHelper |
| `npm run release:readiness:successor` | NOT COMPLETED locally | Hardhat dependency installation did not complete in this environment |
| Fresh live chain / wallet E2E / external audit | NOT PERFORMED | No claim of current production qualification |

Historical runs are April 2026 results inspected in September 2026. Their logs were unavailable when inspected; run/job/step conclusions were available. These results are not represented as fresh full-suite execution. Local checks used Node 24.19.0 / npm 11.9.0; historical CI used Node 20. The release-only checks are also run on Node 20 by the publishing workflow.

## Release-specific checks

The release verifier parses every inline script in the three added HTML files. It executes the current v2 functions for integer burn arithmetic, rounding, zero burn, large payouts, successful/failed reads, state preservation, approval amounts after rate changes, final balance/allowance guards and cancelled approvals. These checks do not mock a whole browser or exercise a real wallet. Cached-rate fallback is tested as existing behavior and recorded as a limitation, not endorsed as fail-closed behavior.

The packager requires the exact configured source SHA and tree, compares the changed-file inventory to the three expected UI additions since `v0.2.0`, checks the UI tree against the successful UI CI head, and verifies the original deployment-reference asset digests. It creates a deterministic ZIP and a manifest containing each payload's SHA-256. The publisher checks the referenced GitHub run identities/conclusions again and refuses to overwrite a published release.

## Deferred work for the next development phase

1. Reconcile all deployment records, UI defaults, README entry points and hosted routes with the intended successor deployment; independently validate the live chain state.
2. Fail closed when the burn rate cannot be refreshed; require renewed review when economics change. Evaluate an on-chain maximum-burn parameter for transaction-level protection.
3. Add full browser-wallet tests of the burn-aware standalone console, including RPC failures and changing burn rates.
4. Assess and update dependencies, rerun the full validation campaign and qualify supported browser/wallet combinations.

These are documented limits of this frozen snapshot. A successful source-release workflow does not convert the strict successor metadata failure into a pass.
