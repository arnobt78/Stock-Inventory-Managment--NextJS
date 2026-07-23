# Security Policy

This repository is a **personal open-source showcase** (Stockly — warehouse / inventory demo). It is not a commercial product with a paid bug-bounty program.

## Supported versions

| Version | Supported |
| ------- | --------- |
| Latest `main` | Yes |
| Live demo ([stockly-inventory.vercel.app](https://stockly-inventory.vercel.app/)) | Best-effort |
| Older forks / tags | No |

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Email a private report to: **[contact@arnobmahmud.com](mailto:contact@arnobmahmud.com)**

Please include:

- Short summary and potential impact
- Steps to reproduce (or a proof of concept)
- Affected path, commit SHA, or demo URL if known
- Your preferred contact for follow-up

**Do not** include production secrets, `.env` files, API keys, or credentials in the report.

## Out of scope

- Abuse of published demo / test accounts
- Denial-of-service or volumetric attacks against the live demo
- Social engineering, phishing, or physical attacks
- Issues solely in third-party services (Stripe, Shippo, Brevo, ImageKit, Upstash, Sentry, MongoDB Atlas, Vercel, Google OAuth, etc.) unless caused by clear misconfiguration in this repo
- Findings that require already-compromised admin credentials with no additional bug

## Response

Reports are handled **best-effort** for a personal OSS project. Prefer coordinated disclosure: private report → fix on `main` (when applicable) → optional public discussion after a fix is available.

There is no SLA and no commitment to assign CVEs. Thank you for helping keep the project safer for learners and operators.
