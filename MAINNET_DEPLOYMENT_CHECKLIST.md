# Mainnet Deployment Checklist

## EmployerBurn-specific preflight

- Confirm the AGIALPHA mainnet token address is `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`.
- Confirm `employerBurnBps` policy is decided and documented before production traffic.
- Confirm employer guidance includes separate burn allowance/balance requirements beyond payout escrow.
- Confirm event monitoring includes `EmployerBurnEnforced` for employer-win burn observability.
- Confirm `npm run size` passes EIP-170 runtime cap (24,576 bytes) for `AGIJobManager` before deploying on Ethereum mainnet.

- Transfer contract ownership to a multisig (e.g., Safe), not an EOA.
- Decide whether to keep `useEnsJobTokenURI` disabled at launch; if enabling, confirm `ensJobPages` is the intended contract.
- ENS configuration verification:
  - Jobs root node is owned or wrapped by the expected entity.
  - Resolver is set correctly for the root and job subdomains.
  - Job manager address is configured in the ENS job pages contract (if used).
  - ENS job pages address is non-zero and has contract code when enabled.
- Run Slither and unit tests; include at least one invariant-style test focused on solvency
  (contract balance >= lockedEscrow + locked*Bonds) and settlement flows.
- Obtain an external audit or review before deploying funds at scale.
