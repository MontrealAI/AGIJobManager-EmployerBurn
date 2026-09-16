# Repository releases

`v0.3.0` closes the current source/UI development phase at commit `cdf75e7a95afa0894be253a1929d3ca5e8c16ca1`. See [`v0.3.0/RELEASE_NOTES.md`](v0.3.0/RELEASE_NOTES.md) and [`v0.3.0/VALIDATION.md`](v0.3.0/VALIDATION.md).

## Release mechanics

The application tag points at the frozen, previously validated source commit. This release-preparation change adds only documentation, packaging checks, and publication tooling; it does not change application code or private npm package versions.

The `Current-State Release v0.3.0` workflow validates on pull requests. A push to `main` that changes `docs/releases/v0.3.0/release.json` runs validation and publication. Merging the preparation PR therefore authorizes publication of this specific pinned release. The workflow requires the recorded CI runs to be successful, checks the source/tree identity and UI delta, runs the 16 focused UI checks, and compares two builds byte-for-byte.

Publication uses a separate job with `contents: write`, creates a draft, uploads assets, checks their GitHub SHA-256 digests, then publishes. It refuses to modify an already published release or replace differing draft assets. No deploy command, wallet key or on-chain transaction is involved. There is no npm publication or Pages cutover. The normal contract/security workflows are unchanged.

Build locally from the release-tooling checkout with complete Git history:

```sh
node scripts/release/verify-employerburn-ui.mjs
python3 scripts/release/package-release.py
```

Artifacts appear in `build/release/v0.3.0/`; the output directory must be empty. The downloadable ZIP includes the original application source under `source/`, separate release references, documentation, and copies of the packaging/validation scripts for inspection. Reproduction requires this release-tooling checkout, not just the original application tag.

GitHub creates the `v0.3.0` tag at the configured full commit SHA. The source tag and SHA-256 files are not cryptographic signatures. Preserve existing tags and published assets. Use a new version for subsequent changes; do not reuse this one-shot manifest as a general release switch.

If publication is interrupted, rerun the failed workflow. A matching draft can resume without replacing assets. A conflicting tag, draft or asset requires investigation; the workflow fails instead of overwriting it. Once publication succeeds, rerunning publication intentionally fails closed.
