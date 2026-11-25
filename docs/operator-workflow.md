# Enquiry operator workflow

`src/worker/operator-status.ts` prepares forward-only status updates for a future authenticated operator interface. It is not imported by the Worker entry point and exposes no route, credentials or scheduler. No production record is read or changed by this implementation.

| Current status | Permitted next status |
| --- | --- |
| new | contacted, in_progress, booked |
| contacted | in_progress, booked |
| in_progress | booked |
| booked, unsuccessful, unknown | None through this primitive |

The caller supplies the status it reviewed. A single parameterized compare-and-set update rejects stale actions, missing records and records with an existing unsuccessful retention clock. Updates return only a boolean; customer payloads are neither read nor logged. Notifications and consent are unchanged.

An unsuccessful disposition must use the separate `markEnquiryUnsuccessful` primitive in `privacy.ts`, which requires the reviewed active status, rejects stale decisions and starts the approved 90-day clock once. This module never reopens a closed enquiry or resets that clock. Migration 0003 is required; no migration is executed here.

Before activation, establish owner-approved operator/backup authority, authentication and authorization, access controls for customer details, audit records, conflict handling, pending-delivery handling and the booked-client retention policy. The operator interface and its end-to-end workflow remain unfinished. These helpers must not be exposed directly as unauthenticated endpoints.

Verification uses real in-memory SQLite and the committed migrations: allowed transitions, stale actions, terminal/unknown states, inconsistent clocks, malformed arguments, missing records and unchanged outbox rows. No live customer data is used.

Retention preview and bounded deletion require canonical UTC millisecond timestamps for both creation and unsuccessful disposition, with creation no later than disposition. Malformed or reversed stored clocks are held rather than interpreted as expired. The disposition write also rejects invalid creation clocks. These are defensive query predicates, not a migration or an automatic repair process; inconsistent records require authorised review.

## Operator interface (25 Nov 2026) — built, inactive until configured

`/operator/` (static mobile-first page in `public/operator/`) and `/api/operator/*` run through the Worker (`operator-route.ts`). They are **inactive by default**: with no Access configuration every request gets a plain 404, so production and previews expose nothing.

Authentication is Cloudflare Access plus a Worker re-check (`operator-auth.ts`): the `Cf-Access-Jwt-Assertion` RS256 signature (WebCrypto, keys from the team's `/cdn-cgi/access/certs`, cached 10 minutes), issuer, audience, `exp`/`nbf` and an explicit email allow-list. Every failure returns 404 and nothing from the token is logged.

Activation (owner-gated, staging first): create a Cloudflare Access self-hosted application covering `/operator*` and `/api/operator/*` with an allow policy for the owner and backup emails; then set Worker vars `OPERATOR_ACCESS_TEAM_DOMAIN` (`<team>.cloudflareaccess.com`), `OPERATOR_ACCESS_AUD` (application AUD tag) and `OPERATOR_EMAILS` (comma-separated). The three values are runtime bindings; use staging-only encrypted bindings to preserve them across deployments and keep the email allow-list out of source.

API: `GET /api/operator/enquiries` (newest first, stable keyset `before` plus `beforeId`, `status`, `limit` ≤ 100; returns `nextCursor` or null; summary only, no phone), `GET /api/operator/enquiries/:id` (full detail), `POST /api/operator/enquiries/:id/status` `{from, to}` (same-origin exact JSON media type, 1 KiB streaming byte limit and 10-second read deadline; `409` for a stale `from`; `unsuccessful` starts the 90-day clock once via `markEnquiryUnsuccessful`). Responses are `no-store`; the UI sends a strict no-inline CSP and `noindex`, and robots disallows `/operator/`.

Audit trail (migration `0005_operator_audit.sql`, verified applied to staging only): every successful status change records time, operator email, enquiry id and from/to status in `operator_audit` (no customer data, no foreign key, so it survives retention deletion); the detail view shows the last 20 entries. A failed audit read returns null rather than an empty list, logs a non-identifying failure, and disables UI status actions until the enquiry is reopened with available history. Status and audit insertion use one transactional D1 batch. A stale update produces no audit entry; an audit SQL failure rolls back the status and retention clock, returning 503 rather than claiming success. The database batch must still be exercised against isolated staging before live activation. The staging audit schema was verified before activation; production remains unconfigured.

Known limits: no pending-delivery override or booked-client retention (policy still owner-pending), no live-Access browser test (the page is covered by a mocked-API Playwright test), and no jump-to-page control beyond keyset "Load older".

## Staging activation prerequisites

On takeover (25 Nov), the connected Cloudflare account returned `access.api.error.not_enabled` for organisation, application and identity-provider reads. Owner must complete Zero Trust onboarding on the Free plan and confirm the specific authorised operator email(s); do not grant access by email domain or to all users. After onboarding, create one self-hosted application covering the staging host's exact operator paths and their descendants (not the entire brochure/planner), configure its email policy and Worker variables, and verify migration 0005 before enabling the dashboard. Verify unauthenticated, wrong-audience and non-allowlisted requests, and a fictional status change with matching audit entry. Do not attach the production domain, enable real intake or send live notifications.

### Verified staging configuration (25 Nov)

Zero Trust onboarding is complete. The owner approved three exact email identities; the staging application has one allow policy and an email one-time PIN provider. Migration 0005 and the transactional audit build (#162) were verified before the three encrypted Worker bindings were installed. Active staging version `5551c68e-8f95-459c-93b2-9541e38f60c4` received 100% traffic at read-back. No production DB, intake or operator bindings were enabled. The operator's real OTP login and fictional status/audit smoke test remain pending; do not equate configuration read-back with runtime acceptance. #163 merged as `affced0` after all four hosted checks passed.

List requests now reject obsolete filter responses and duplicate in-flight pagination attempts. The browser regression resolves mocked responses out of order and verifies the visible list, cursor and disabled pagination control. Hosted CI remains the acceptance gate.
