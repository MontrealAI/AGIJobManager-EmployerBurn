# AGIALPHA External Token Verification Note

Date verified: 2026-03-29 (UTC)
Token: `0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA`
Sources:
- Etherscan verified contract page for `AGIAlphaToken`.
- Sourcify full-match metadata/source for chain 1.

## Findings relevant to EmployerBurn
- `burnFrom(address,uint256)` is available through OZ `ERC20Burnable` inheritance.
- `permit(...)` is available through OZ `ERC20Permit` inheritance.
- Token includes pause controls (`pause`, `unpause`) via `ERC20Pausable`; paused state can make transfer/burn paths revert.
- Access control uses `AccessControlEnumerable` roles (at least admin/minter/pauser), so operator role changes on token side can affect burn liveness.

## Integration impact
- `approve + finalize` remains primary Etherscan flow; permit is optional and not required.
- Employer-win settlement must revert if burn reverts due to pause/allowance/balance/token-level failure.
- Monitoring should include token pause state in incident triage for employer-win settlement failures.

## Verification links
- https://etherscan.io/address/0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA
- https://repo.sourcify.dev/contracts/full_match/1/0xA61a3B3a130a9c20768EEBF97E21515A6046a1fA/metadata.json
