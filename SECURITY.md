# Security Policy

## Supported versions

Security fixes are maintained on the current default branch and active security maintenance branches. Older tags and snapshots are not supported unless explicitly stated.

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner or maintainer. Include the affected file or route, impact, reproduction steps, and any proposed mitigation. Do not include real credentials or personal data in a report, issue, or reproduction.

Do not open a public issue for an unpatched vulnerability. A maintainer should acknowledge the report, assess severity and reachability, and coordinate disclosure after a fix is available.

## Local verification

Use the repository's pinned lockfile and run the documented lint, test, and build commands locally. Dependency checks should use `npm audit` with lifecycle scripts disabled where appropriate. Never use production secrets or production service endpoints for verification.

## Source publication versus internet deployment

Publishing this source on GitHub does not itself deploy an internet-facing service. Anyone deploying it must separately configure HTTPS, trusted host and proxy settings, secrets, logging, rate limits where applicable, and platform-level security headers. Review deployment-specific risks before exposing an instance to the internet.
