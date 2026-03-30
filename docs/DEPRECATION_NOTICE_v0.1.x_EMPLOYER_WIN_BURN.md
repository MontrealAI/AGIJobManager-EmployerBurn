# Deprecation Notice — v0.1.x Employer-Win Burn Semantics

**Status:** Deprecated for deployments requiring completion-only burn semantics.

Prior release line (`v0.1.x`) burns AGIALPHA on employer-win refund paths. That behavior is semantically wrong for the corrected requirement.

Use successor release line **v0.2.0+** where:
- burn occurs only on successful completion settlement,
- burn reserve is employer-funded upfront,
- non-success outcomes refund the reserve.

Do not deploy v0.1.x for completion-only burn requirements.

This behavior is wrong for completion-only requirement enforcement.
