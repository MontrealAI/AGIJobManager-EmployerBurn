# AGIJobManager EmployerBurn — v0.3.0

This is the final source/UI snapshot of the current development phase. Read `RELEASE_NOTES.md` for the scope and known limitations before using it.

## What to open

| Need | File or folder |
| --- | --- |
| Latest burn-aware standalone UI | `agijobmanagerburnv2.html` |
| Scope, changes, addresses and caveats | `RELEASE_NOTES.md` |
| Test evidence and unresolved items | `VALIDATION.md` |
| Complete original repository | `source/` |
| Original v0.2.0 successor deployment references | `deployment-reference/` |
| Payload identities and hashes | `RELEASE_MANIFEST.json` |

The standalone UI uses online Web3 and blockchain services. Opening it does not itself authorize transactions. Wallet connection and wallet confirmation are required for signed actions. This release was not freshly qualified with a real wallet.

If your browser or wallet does not support local HTML files, serve this extracted directory locally:

```sh
python3 -m http.server 8080 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8080/agijobmanagerburnv2.html`. On Windows, `py -m http.server 8080 --bind 127.0.0.1` is the equivalent command. Stop the server with Ctrl+C. Serving locally does not eliminate the online dependencies.

Before creating a job, check the manager address against the release notes and review **payout + non-refundable burn**. The burn-rate estimate is not locked through transaction mining. Check the wallet approval amount and transaction carefully.

## Verify your download

Download `SHA256SUMS.txt` alongside the release assets. In that download directory:

```sh
sha256sum -c SHA256SUMS.txt
```

On macOS use `shasum -a 256 -c SHA256SUMS.txt`. On Windows use `Get-FileHash .\AGIJobManager-EmployerBurn-v0.3.0-COMPLETE.zip -Algorithm SHA256` and compare the value to the checksum file. The checksum file lists all assets, so an all-files check requires all of them.

## Developers and operators

The `source/` directory contains the exact tracked files at commit `cdf75e7a95afa0894be253a1929d3ca5e8c16ca1`, including documentation, contracts, tests and historical artifacts. No dependencies, credentials or local build outputs have been added. Use Node 20 as in the repository's historical CI and lockfile-based installs. The source tree retains its original private package versions.

Start with `source/hardhat/README.md` for the canonical deployment tooling and `source/docs/OWNER_RUNBOOK.md` for operations. **Do not infer current deployment addresses from stale source records:** see the mismatch in `VALIDATION.md`. Publishing this release performs no on-chain operation.
