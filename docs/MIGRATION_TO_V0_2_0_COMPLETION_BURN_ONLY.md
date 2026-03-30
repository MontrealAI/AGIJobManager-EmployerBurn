# Migration / Cutover to v0.2.0 (Completion-Only Burn)

1. Deploy successor `AGIJobManager` + `EmployerBurnReadHelper`.
2. Verify contracts on Etherscan.
3. Configure successor owner parameters (burn bps, review windows, validator thresholds, AGI types, roles).
4. ENS cutover:
   - call `ENSJobPages.setJobManager(newManager)` on existing ENSJobPages,
   - call `newManager.setEnsJobPages(existingEnsJobPages)`.
5. Freeze old deployment for new intake (pause/ops policy) and announce deprecation.
6. Route all new jobs to successor manager only.

Note: immutable old jobs remain governed by old contract semantics.
