# Employer Guide

This guide is for job posters (employers). It shows how to safely create and manage a job, and how to handle disputes and NFTs.

## Prerequisites
- AGI tokens in your wallet.
- The AGIJobManager contract address.
- Confidence that the AGI token address is correct.

## Step‑by‑step (non‑technical, Etherscan-first)
> **Screenshot placeholder:** Etherscan “Write Contract” tab showing `createJob` inputs filled in.
### 1) Approve escrow amount
Use your wallet or Etherscan to approve AGIALPHA to the **AGIJobManager contract**.

- Minimum safe approval for EmployerBurn variant:
  - `approval >= payout + expectedBurn`
  - where `expectedBurn = payout * employerBurnBps / 10_000`.
- The extra burn approval is only consumed if settlement ends in an employer-win path.
- If burn policy is `0` bps, extra burn approval is not required.

### 2) Create a job
Generate/upload the **job spec metadata** JSON and call `createJob(jobSpecURI, payout, duration, details)`.
- **jobSpecURI**: ERC‑721 metadata URI (full `ipfs://...` or `https://...` is recommended)
- **payout**: token amount (18 decimals)
- **duration**: seconds (max `jobDurationLimit`)
- **details**: short plain text

**On‑chain results**
- Event: `JobCreated`
- Token movement: employer → contract (escrow)

### 3) Monitor applications and completion
Agents can apply and then request completion. You can monitor events:
- `JobApplied`
- `JobCompletionRequested`

### 4) Cancel (if no agent assigned)
If no agent has been assigned and the job is not completed, call `cancelJob(jobId)`.

### 5) Dispute (if needed)
Call `disputeJob(jobId)` if you disagree with the completion or validation direction.

### 6) Employer-burn preflight checks (recommended)
Use `EmployerBurnReadHelper` in Etherscan **Read Contract** before settlement:
- `quoteEmployerBurn(jobId)`
- `getEmployerBurnRequirements(jobId)`
- `getEmployerBurnReadiness(jobId)`
- `canFinalizeEmployerWinWithBurn(jobId)` (for `finalizeJob` path only)

### 7) Receive NFT receipt
When a job completes, an NFT is minted to your wallet.
- Event: `NFTIssued`
- Token URI: points to the **job completion metadata** (`jobCompletionURI`, with `baseIpfsUrl` fallback)

## Common mistakes
- **Insufficient allowance** → `TransferFailed`
- **Employer-win settlement revert after dispute/finalize** → usually missing employer burn allowance or wallet balance for `burnFrom`.
- **Job already assigned or completed** → `InvalidState`
- **Wrong jobId** → `JobNotFound`

## For developers
### Key functions
- `createJob` → escrows payout & emits `JobCreated`
- `cancelJob` → refunds if no agent
- `disputeJob` → triggers dispute mode

### State fields to inspect
- `getJobCore(jobId)` → assigned agent, completion/dispute flags
- `getJobValidation(jobId)` → completionRequested flag

### Events to index
`JobCreated`, `EmployerBurnChargedAtJobCreation`, `JobApplied`, `JobCompletionRequested`, `JobCompleted`, `NFTIssued`, `JobDisputed`, `DisputeResolvedWithCode`
