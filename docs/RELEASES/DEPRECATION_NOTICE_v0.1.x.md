# Deprecation Notice — v0.1.x EmployerBurn semantics

v0.1.x is semantically deprecated for deployments requiring completion-only burn policy.

Reason:
- v0.1.x enforces burn on Employer-win / Employer-refund settlement paths.
- Correct policy requires burn only on successful completion.

Action:
- Do not use v0.1.x for new deployments requiring completion-only burn semantics.
- Use v0.2.0 successor deployment.
