# Enquiry operator workflow

`src/worker/operator-status.ts` implements forward-only status updates used by the authenticated operator API through `operator-route.ts` and `operator-api.ts`. The Worker entry point imports that route. Missing Access configuration fails closed; the default production Worker has no operator bindings or D1. There is no retention scheduler or deletion endpoint.

| Current status | Permitted next status |
| --- | --- |
| new | contacted, in_progress, booked |
| contacted | in_progress, booked |
| in_progress | booked |
| booked, unsuccessful, unknown | None through this primitive |

The caller supplies the status it reviewed. A single parameterized compare-and-set update rejects stale actions, missing records and records with an existing unsuccessful retention clock. Updates return only a boolean; customer payloads are neither read nor logged. Notifications and consent are unchanged.

An unsuccessful disposition must use the separate `markEnquiryUnsuccessful` primitive in `privacy.ts`, which requires the reviewed active status, rejects stale decisions and starts the approved 90-day clock once. This module never reopens a closed enquiry or resets that clock. Migration 0003 is required; no migration is executed here.

Staging Access configuration and exact operator identities are recorded below; do not repeat onboarding. Production use still requires applicable operator authority, authenticated end-to-end acceptance, pending-delivery handling and booked-client retention decisions. The helpers must never be exposed as unauthenticated endpoints.

Verification uses real in-memory SQLite and the committed migrations: allowed transitions, stale actions, terminal/unknown states, inconsistent clocks, malformed arguments, missing records and unchanged outbox rows. No live customer data is used.

Retention preview and bounded deletion require canonical UTC millisecond timestamps for both creation and unsuccessful disposition, with creation no later than disposition. Malformed or reversed stored clocks are held rather than interpreted as expired. The disposition write also rejects invalid creation clocks. These are defensive query predicates, not a migration or an automatic repair process; inconsistent records require authorised review.

## Implemented operator interface

`/operator/` (static mobile-first page in `public/operator/`) and `/api/operator/*` run through the Worker (`operator-route.ts`). They are **inactive by default**: without Access configuration every request gets a plain 404. Staging configuration was recorded as installed; default production and branch previews remain unconfigured. A configured route is not proof of completed runtime acceptance.

Authentication is Cloudflare Access plus a Worker re-check (`operator-auth.ts`): the `Cf-Access-Jwt-Assertion` RS256 signature (WebCrypto, keys from the team's `/cdn-cgi/access/certs`, cached 10 minutes), issuer, audience, `exp`/`nbf` and an explicit email allow-list. Every failure returns 404 and nothing from the token is logged.

Configuration contract (already recorded for staging; new/production activation remains owner-gated): a Cloudflare Access self-hosted application must cover `/operator*` and `/api/operator/*` with an exact-email allow policy for approved operators; Worker bindings are `OPERATOR_ACCESS_TEAM_DOMAIN` (`<team>.cloudflareaccess.com`), `OPERATOR_ACCESS_AUD` (application AUD tag) and `OPERATOR_EMAILS` (comma-separated). The three values are runtime bindings; use staging-only encrypted bindings to preserve them across deployments and keep the email allow-list out of source.

API: `GET /api/operator/enquiries` (newest first, stable keyset `before` plus `beforeId`, `status`, `limit` ≤ 100; returns `nextCursor` or null; summary only, no phone), `GET /api/operator/enquiries/:id` (full detail), `POST /api/operator/enquiries/:id/status` `{from, to}` (same-origin exact JSON media type, 1 KiB streaming byte limit and 10-second read deadline; `409` for a stale `from`; `unsuccessful` starts the 90-day clock once via `markEnquiryUnsuccessful`). Responses are `no-store`; the UI sends a strict no-inline CSP and `noindex`, and robots disallows `/operator/`.

Audit trail (migration `0005_operator_audit.sql`, verified applied to staging only): every successful status change records time, operator email, enquiry id and from/to status in `operator_audit` (linkable operational data, with no foreign key, so it survives enquiry retention deletion); the detail view shows the last 20 entries. A failed audit read returns null rather than an empty list, logs a non-identifying failure, and disables UI status actions until the enquiry is reopened with available history. Status and audit insertion use one transactional D1 batch. A stale update produces no audit entry; an audit SQL failure rolls back the status and retention clock, returning 503 rather than claiming success. Local workerd D1 transaction regression coverage exists; a fictional authenticated status/audit acceptance on deployed staging must be evidenced separately before live activation. The staging audit schema was verified before activation; production remains unconfigured.

The authenticated `GET /api/operator/delivery-overview` exposes aggregate queue states. `GET /api/operator/delivery-held` adds metadata-only review, oldest first: event reference, creation time, attempts, normalized hold reason and a separate 23-hour send-window warning. Keyset pagination uses paired `after`/`afterId`, defaults to 25 and caps at 100. These read-only views do not dispatch, replay, release holds or confirm inbox receipt. Event references remain linkable operational data, visible only inside the existing authenticated boundary; no enquiry identifier, notice snapshot, recipient, provider identifier or claim token is returned. An active final-attempt lease stays in processing, while age warnings never reset clocks or remove a hold. Known limits: no pending-delivery override or booked-client retention execution (policy unresolved), no recorded full authenticated fictional-data transaction acceptance, and no jump-to-page control beyond keyset "Load older". Mocked-API browser coverage does not substitute for deployed Access acceptance.

## Historical onboarding blocker — resolved by the configuration below

On takeover (25 Nov), the connected Cloudflare account returned `access.api.error.not_enabled` for organisation, application and identity-provider reads. Zero Trust onboarding and exact-identity configuration were the blocker at that time; the subsequent record below supersedes it. The access contract remains narrow: exact approved emails, operator paths and descendants rather than the entire brochure/planner, and isolated staging schema. Remaining acceptance must verify unauthenticated, wrong-audience and non-allowlisted rejection plus a fictional status change with matching audit entry. No production domain, real intake or live notification gate follows from this setup.

### Verified staging configuration (25 Nov)

Zero Trust onboarding is complete. The owner approved three exact email identities; the staging application has one allow policy and an email one-time PIN provider. Migration 0005 and the transactional audit build (#162) were verified before the three encrypted Worker bindings were installed. Active staging version `5551c68e-8f95-459c-93b2-9541e38f60c4` received 100% traffic at read-back. No production DB, intake or operator bindings were enabled. The owner subsequently reported entering credentials and an email OTP and reaching the admin page. This supports that login path only; fictional enquiry/status/audit acceptance is not established by that report. Do not request a new OTP just because this historical record predates that login, or equate configuration read-back with transaction acceptance. #163 merged as `affced0` after all four hosted checks passed.

List requests now reject obsolete filter responses and duplicate in-flight pagination attempts. The browser regression resolves mocked responses out of order and verifies the visible list, cursor and disabled pagination control. Hosted CI remains the acceptance gate.

## Audit and log privacy lifecycle

`operator_audit` stores operator email and enquiry identifiers to attribute status decisions and diagnose conflicts. These are linkable personal/operational identifiers, not anonymous data. Only authenticated allow-listed operators may read the last 20 entries for an enquiry; provider/database administrators may also have access under their assigned account permissions. Enquiry deletion cascades outbox rows and frozen notices, but intentionally does not delete these independent audit rows. It cannot recall an accepted or in-flight email.

Worker observability is enabled in `wrangler.jsonc`. Application log messages must avoid enquiry IDs, operator emails, tokens and payloads; historical logs may contain enquiry IDs and require restricted provider access. Cloudflare request/platform metadata is separate from application log fields. No provider log retention duration or purge has been verified by this documentation change.

Audit/log durations are not approved and no cleanup is installed. See [privacy-retention.md](privacy-retention.md) for the concrete proposed durations, hold rules, evidence boundaries and pre-activation decisions. That proposal is separate from the approved 90-day unsuccessful-enquiry eligibility clock.
