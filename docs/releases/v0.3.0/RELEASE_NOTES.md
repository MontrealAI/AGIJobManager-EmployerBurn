# v0.3.0 — EmployerBurn UI · Current-State Final Release

This release freezes the current AGIJobManager EmployerBurn source and standalone UI before the next development phase. The application snapshot is exactly **`cdf75e7a95afa0894be253a1929d3ca5e8c16ca1`** (merged PR #80). It adds the accumulated EmployerBurn UI work since `v0.2.0`; smart-contract sources are unchanged.

**Release scope:** source and UI preservation, documented validation, and checksummed downloads. This release does not deploy or upgrade contracts, change on-chain settings, or certify current mainnet readiness.

## Download and start

Download **`AGIJobManager-EmployerBurn-v0.3.0-COMPLETE.zip`**, extract it, and read **`START_HERE.md`**. The current burn-aware interface is **`agijobmanagerburnv2.html`**. The complete, unmodified source is in `source/`; earlier burn UI variants remain there for provenance.

The HTML file requires network access for its Web3 CDN dependency and blockchain access. It is not a fully offline application. Review the mainnet address, token, burn and wallet transaction details before signing.

## Changes since v0.2.0

- Added standalone EmployerBurn UI variants `v0`, `v1`, and `v2`.
- Shows payout escrow, create-time burn, total upfront cost, and required allowance together.
- Refreshes `employerBurnBps` before requesting approval; checks balance and allowance again before sending `createJob`.
- Displays burn snapshots in job details and includes burn economics in exported packets.
- Clarifies that the burn is charged at creation, separate from escrow, and non-refundable.
- Preserves existing protocol-state fields when `updateSummary()` refreshes the UI (PR #80).

The existing create-job-only burn contract semantics, token pinning, and settlement behavior from `v0.2.0` remain unchanged. No new deployment is required merely to obtain this source/UI snapshot. `v0.1.0` remains historical and unsuitable for new jobs requiring create-job-only burn semantics.

## Validation and provenance

- The exact source commit has successful [CI](https://github.com/MontrealAI/AGIJobManager-EmployerBurn/actions/runs/24054258867), [Docs Integrity](https://github.com/MontrealAI/AGIJobManager-EmployerBurn/actions/runs/24054258883), and [Security Verification](https://github.com/MontrealAI/AGIJobManager-EmployerBurn/actions/runs/24054258894) runs from April 2026, inspected for this release.
- [UI CI](https://github.com/MontrealAI/AGIJobManager-EmployerBurn/actions/runs/24052606787) passed on PR #80's head. The UI trees at that head and the released merge commit are identical. That workflow covers the broader Next.js UI and is not a complete wallet test of the new standalone burn UI.
- Fresh release checks: all three standalone files parse; 16 targeted checks exercise burn rounding, zero burn, large values, state preservation, refreshed approval amounts, insufficient balance/allowance, cancelled approval, and cached-rate fallback using mocked calls.
- Documentation, ENS documentation, and binary-policy checks pass locally. Solidity lint passes with four existing warnings.
- `VALIDATION.md` records limits and the strict successor metadata failure. Local full release readiness did not complete; historical CI is not represented as a fresh full-suite run.
- `RELEASE_MANIFEST.json` identifies the source commit/tree and SHA-256 of every packaged payload; `SHA256SUMS.txt` covers downloadable assets. Checksums are integrity checks, not signatures or an independent audit.

## Recorded successor addresses

These references come from the published `v0.2.0` release and its attached receipt, not a new live-chain verification.

| Component | Ethereum mainnet address |
| --- | --- |
| AGIJobManager | `0xBF6699c1F24BEBBFaBb515583e88a055BF2F9eC2` |
| EmployerBurnReadHelper | `0x8D22A1070d3BAA01dA77564df5fC0B6bff5fA399` |
| ENSJobPages | `0xFC1EE3B7DCD3B8643295CaC3150aA630c31190E5` |
| AGIALPHA | `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA` |

The original successor receipt and verification targets are included under `deployment-reference/`, byte-for-byte and checksum-verified against the original GitHub release assets.

## Known limitations preserved in this snapshot

1. **Deployment-record mismatch.** The source tree's `hardhat/deployments/mainnet/` still records the older manager `0xB3AAeb69b630f0299791679c063d68d6687481d1`, with no `EmployerBurnReadHelper` entry. The strict successor metadata check fails. Use the separately identified `v0.2.0` successor references for provenance; reconcile and independently verify deployment state before any new deployment or operational cutover.
2. **UI publication routing.** The existing Pages workflow publishes the broader console and the historical Genesis console; it does not publish `agijobmanagerburnv2.html`. Obtain the burn-aware file from this release. Existing README/Pages routing is preserved in the source snapshot.
3. **Burn-rate read failure.** If the pre-send burn read fails, the UI falls back to cached state. A changed burn rate warns and updates the amount without reopening review, and the rate can change again before mining. An unlimited allowance can expose an employer to a higher burn than the displayed estimate. This release makes no price-lock or fail-closed guarantee.
4. **Verification boundary.** No fresh browser-wallet end-to-end test, live-chain comparison, independent audit, or fresh dependency-vulnerability assessment is claimed. Existing security automation uses configured detector exclusions and retains owner/operator trust assumptions.
5. **Version identities.** `v0.3.0` identifies this repository/UI snapshot. Private root and Next.js package metadata remain `0.2.0`, and the Hardhat workspace remains `1.0.0`, exactly as in the frozen commit. This is not an npm package publication.

The release closes this development phase; it does not promise maintenance or declare the project abandoned. Future changes should use new commits and a new version. Do not move this tag or silently replace published assets.

**Full comparison:** [v0.2.0…cdf75e7](https://github.com/MontrealAI/AGIJobManager-EmployerBurn/compare/v0.2.0...cdf75e7a95afa0894be253a1929d3ca5e8c16ca1).
