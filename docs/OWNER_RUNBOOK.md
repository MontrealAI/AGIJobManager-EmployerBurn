# Owner Runbook (v0.2.0)

## Semantics baseline
- Burn is completion-only.
- Burn reserve is employer-funded at job creation.
- Refund paths never burn and must refund reserve.

## Deployment/cutover sequence
1. Deploy successor manager + helper.
2. Verify on Etherscan.
3. Set governance parameters.
4. ENS cutover:
   - `ENSJobPages.setJobManager(newManager)`
   - `newManager.setEnsJobPages(existingEnsJobPages)`
5. Route new jobs only to successor manager.
6. Publish deprecation notice for v0.1.x.

## Owner safety checks
- `lockedBurnReserve` must be included in solvency checks (`withdrawableAGI`).
- Confirm completion path emits `CompletionBurnExecuted`.
- Confirm employer refund paths emit `CompletionBurnReserveRefunded` and no burn event.
