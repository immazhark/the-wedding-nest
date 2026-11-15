---
name: twn-enquiry-security
description: Design, implement or review The Wedding Nest's enquiry journey, privacy handling, Cloudflare Worker API, D1 database and consent boundaries.
---
# TWN enquiry security review

Read docs/decisions.md and docs/product-direction.md; inspect actual code. Do not assume a database or API exists.

1. Start with typed event questionnaire states, explicit optional fields and a keyboard/screen-reader friendly alternative to visual controls.
2. Determine required data minimization, lawful consent and purpose. Do not track or persist abandoned contact details without explicit permission.
3. Model server-side schema validation, length limits, escaping, abuse controls, Turnstile verification on the server, method restrictions, idempotency and safe error messages.
4. Store only required lead details in D1 when available. Design retention, deletion, access restrictions and audit trails before production; no PII in logs or analytics.
5. Prevent false success: only acknowledge after durable storage; delivery notifications are asynchronous with retry/outbox if introduced.
6. Write tests for invalid inputs, spam, duplicate submissions, failure/retry behavior and privacy edge cases before implementation.
7. Run a scoped security review of staging or the codebase; never pentest third-party properties or production customer data.

When the API exists, evaluate Cloudflare security-audit-skill, Trivy and focused tests. No unreviewed autonomous scanners or powerful external agents.
