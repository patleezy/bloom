# Security

## Reporting a vulnerability
Please report security issues privately through
[GitHub private vulnerability reporting](https://github.com/patleezy/bloom/security/advisories/new).
Don't open a public issue. We aim to respond within 7 days.

## How Bloom protects users today
Bloom has no backend, accounts, or analytics by default. All data stays in the user's browser.

| OWASP Top 10 (2021) | How it's handled |
|---|---|
| A01 Broken access control | No server-side data or accounts. |
| A02 Cryptographic failures | HTTPS only with HSTS (`vercel.json`). No secrets or API keys in the app. |
| A03 Injection / XSS | User text is only ever inserted as text nodes (`src/dom.ts`), never as HTML. Stored data and backup files are parsed as untrusted, validated, and size-limited (`src/state/localRepository.ts`). |
| A04 Insecure design | Privacy by default: local-only storage, no third-party requests. |
| A05 Security misconfiguration | Strict Content-Security-Policy, `nosniff`, `no-referrer`, `frame-ancestors 'none'`, restrictive Permissions-Policy. |
| A06 Vulnerable components | Two runtime dependencies (bundled fonts). `npm audit` runs in CI; Dependabot opens update PRs weekly. |
| A07 Identification & auth failures | No authentication yet. |
| A08 Software & data integrity | No third-party scripts or CDNs. CI tests and builds every PR with read-only permissions. |
| A09 Logging & monitoring | Not applicable without a backend. |
| A10 SSRF | Not applicable without a backend. |

## Checklist before adding a backend
- Auth via a well-tested provider; short-lived sessions; httpOnly, Secure, SameSite cookies.
- Validate every request server-side with a schema; never trust client-computed growth or streaks.
- Authorize every record by owner (no ID-guessing across users).
- Rate-limit writes and auth endpoints.
- Keep secrets in environment variables only; never in the client bundle.
- Add the API origin to CSP `connect-src` and nothing broader.
- Structured logging without personal data; alerting on auth anomalies.
- Data export and deletion for users; document retention.
