# Bytecode size guardrails & job getters

## Why the `jobs` mapping is not public

`jobs` is intentionally **not** public to avoid Solidity generating a massive auto-getter for the full `Job` struct. That auto-getter previously triggered legacy (non-viaIR) **stack-too-deep** compilation failures. Instead, we expose compact view helpers that keep the ABI small and the stack usage within limits.

Use these getters instead:

- `getJobCore(jobId)` for core job fields (employer, assigned agent, payout, duration, assignment data, completion/dispute/expiry state, and agent payout percentage).
- `getJobValidation(jobId)` for validation-related fields (completion request state and validator counts/timestamps).
- `getJobSpecURI(jobId)` for the job specification URI.
- `getJobCompletionURI(jobId)` for the completion URI (when provided).
- `getJobValidatorCount(jobId)` / `getJobValidatorAt(jobId, index)` for validator lists.
- `getJobVote(jobId, validator)` for validator votes (0 = none, 1 = approved, 2 = disapproved).

## Runtime + initcode size limits (EIP-170 / EIP-3860)

Ethereum mainnet enforces:

- **Runtime bytecode cap:** 24,576 bytes (EIP‑170)
- **Initcode cap:** 49,152 bytes (EIP‑3860)

The repository now checks both hard limits and also reports preferred internal budgets:

- Preferred runtime budget: <= 23,000 bytes
- Preferred initcode budget: <= 46,000 bytes

### How to measure locally

Compile and check size limits:

```bash
npx truffle compile --all
node scripts/check-bytecode-size.js
```

We also enforce these checks in tests (`test/bytecodeSize.test.js`) and in the contract-size script used by `npm test` (`scripts/check-contract-sizes.js`) so CI fails on EIP hard-limit violations.

## Validator payout rule (approvers-only)

When a job completes on an **agent win**, validator rewards are paid **only to approvers**. Validators who disapproved do **not** receive payouts or reputation. If validators participated but **no approvals** were recorded, the validator reward share is redirected to the agent so escrowed funds are still fully distributed.

## Compiler settings and warning cleanup

- **Solidity version:** pinned to `0.8.23` in `truffle-config.js` (contract pragma is `^0.8.19`).
- **OpenZeppelin contracts:** kept at `@openzeppelin/contracts@4.9.6` (same major version).
- **Optimizer:** enabled with **runs = 50** to balance deploy size and runtime gas (viaIR stays off).

If you change compiler settings for a new deployment, keep the version and optimizer runs consistent for reproducible verification.

## Ops notes

- Reward pool contributions add to the contract balance and are **not escrow-locked**. The owner can withdraw only surplus via `withdrawAGI` (pause-independent, always bounded by `withdrawableAGI()`).  
- `additionalAgentPayoutPercentage` is currently **not used** in payout math and remains reserved/legacy configuration.
