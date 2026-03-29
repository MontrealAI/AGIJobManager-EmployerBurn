# ADR: ENS root validation subset and `aijob` default prefix (2026-03)

## Status
Accepted.

## Decision
- Keep on-chain ENS root validation as a safe normalized subset: lowercase ASCII LDH labels separated by dots, non-empty labels, no leading/trailing hyphen per label, max label length 63.
- Recompute namehash on-chain for this subset and require strict equality with supplied `jobsRootNode` in constructor and `setJobsRoot`.
- Set default `jobLabelPrefix` to `aijob`.
- Keep `setJobLabelPrefix(string)` owner-only and block updates after `lockConfiguration()`.

## Rationale
- Prevent silent root-name/root-node mismatch.
- Keep bytecode growth bounded while rejecting ambiguous or malformed names.
- Preserve Etherscan-friendly owner operations before lock while freezing risk-prone config after lock.

## Consequences
- Full ENS normalization remains an off-chain deploy responsibility (`ethers.ensNormalize` in script).
- Prefix changes only affect unsnapshotted future jobs.
- Legacy migration path remains available via `migrateLegacyWrappedJobPage(jobId, exactLabel)`.
