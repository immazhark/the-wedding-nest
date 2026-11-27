# Enquiry API — `POST /api/enquiry`

**Status:** implemented and tested; **switched off** in production (`ENQUIRIES_ENABLED="false"`, no database bound). The planner's Send step is wired to it but only appears in builds with `PUBLIC_ENQUIRIES_ENABLED=true`. Production builds keep the preview disclosure and send nothing. Turning on live submission is owner-gated.

## Contract

Request: `POST /api/enquiry`, `Content-Type: application/json`, `Origin` on the allow-list, `Idempotency-Key: <uuid v4>`, body ≤ 16 KB:

```json
{ "turnstileToken": "<token from the widget>", "enquiry": { "...": "EnquiryState (src/lib/enquiry/schema.ts)" } }
```

| Status | Body                                                    | Meaning                                                                       |
| ------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 201    | `{ "id" }`                                              | Stored in D1 with its outbox event (one transaction). Not "notification sent". |
| 200    | `{ "id" }`                                              | Exact normalized payload retry for the same key; original id returned.       |
| 400    | `invalid_json` / `invalid_idempotency_key`              | Malformed request.                                                            |
| 408    | `request_timeout`                                       | Request body did not finish within 10 seconds; no enquiry was stored.         |
| 409    | `idempotency_conflict`                                  | Same key with changed valid details: original stored enquiry remains intact. |
| 403    | `forbidden_origin` / `verification_failed`              | Origin not allowed, or Turnstile failed/missing.                              |
| 405    | `method_not_allowed` (+ `Allow: POST`)                  | Not POST.                                                                     |
| 413    | `payload_too_large`                                     | Body > 16 KB.                                                                 |
| 415    | `unsupported_media_type`                                | Not JSON.                                                                     |
| 422    | `invalid_enquiry` + `errors: { field: code }`           | Server-side validation (same rules as the planner). Input is never echoed.    |
| 429    | `rate_limited` (+ `Retry-After`)                        | Only if a rate-limit binding is configured.                                   |
| 503    | `enquiries_disabled` / `not_configured` / `*_unavailable` | Off, misconfigured, or Turnstile/D1 unreachable — safe to retry.              |

Every response: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Enquiry application logs contain only event, outcome and status: never enquiry IDs, names, numbers, IPs or payloads. Provider request metadata is separate; see [operator-workflow.md](operator-workflow.md#audit-and-log-privacy-lifecycle) for the audit/log privacy boundary.

## Data

`migrations/0001_enquiries.sql`: `enquiries` (id, unique idempotency_key, created_at, payload_json = validated enquiry, consent_at, marketing_consent, status) and `outbox` (one `enquiry.created` row per enquiry for later asynchronous notification).

## Privacy deletion building block (not enabled)

`src/worker/privacy.ts` contains a strictly parameterised,
single-enquiry deletion helper (for a separately authorised privacy request, not the age-based retention policy). The migration's foreign-key cascade removes
its associated outbox event as well, so a deleted lead cannot trigger a
future notification. A real-SQLite regression verifies that other leads,
their associated outbox events, and malformed IDs are protected.

**This helper is not exposed by any HTTP route, UI or scheduled job, and
is not run automatically.**

The same module now includes `previewRetentionImpact(db, cutoffIso)`, which
queries only aggregate counts for enquiries before an explicitly provided
UTC timestamp: total candidates, non-new status candidates, and candidates
with pending outbox notifications. It does not select personal details or
mutate any record, and a cutoff **must not** be interpreted as a business-approved
deletion policy. It is intentionally internal with no route, cron, batch delete
or public reporting surface. Its SQLite regression verifies no rows change. The approved unsuccessful clock and privacy contact do not make this generic created-at preview a deletion policy. Before any real-data use, establish applicable authority, identity verification and approved audit/retention procedures; authenticated operator routes exist separately.
No customer records are deleted merely by deploying this code.

## Staging (isolated, test data only)

**16 Nov 2026:** D1 `twn-enquiries-staging` created in APAC and schema applied. The separate Worker is deployed at https://the-wedding-nest-staging.mazharkhan-it.workers.dev. Its dedicated Workers Builds trigger watches `main`, builds with `PUBLIC_ENQUIRIES_ENABLED=true` and Cloudflare's public dummy site key, then deploys `--env staging`. The matching public dummy secret is stored in the staging Worker's secret binding; no production widget or secret is used. A persistent test-environment notice requires fictional details only.

Repeatable HTTP verification: `python scripts/verify_staging.py` (Python 3 and curl). It writes one fictional record per run and checks idempotent retries; inspect the D1 enquiry/outbox rows for durability. It does not send WhatsApp messages or notifications. Real desktop/mobile browser submission also passed in GitHub Actions (`staging-browser`, run `43778044811`); the workflow is repeatable via manual dispatch. Production intake remains off.

The commands below are the setup procedure for a fresh environment; do not recreate the existing database.

Run by someone with Cloudflare access:

```bash
npx wrangler d1 create twn-enquiries-staging
```

Put the printed id into `env.staging.d1_databases[0].database_id` in `wrangler.jsonc`, then:

```bash
npx wrangler d1 migrations apply twn-enquiries-staging --env staging --remote
```

```bash
npx wrangler secret put TURNSTILE_SECRET --env staging
```

Set `ALLOWED_ORIGINS` (staging URL) and `ENQUIRIES_ENABLED="true"` under `env.staging.vars`, then:

```bash
npx wrangler deploy --env staging
```

Use Cloudflare's Turnstile **test** keys in staging. Never point staging at production data.

## Verification deadlines

- Inbound uploads: the entire streamed JSON body must arrive within 10 seconds. Stalled or deliberately slow streams receive `408 request_timeout` and never reach Turnstile or D1. Stream cancellation is best effort and cannot stall the rejection; the existing 16 KiB cap remains unchanged.
- Server: Siteverify fetch and response-body consumption share a 10-second deadline. Timeout aborts the request and returns `verification_unavailable` (503) before D1 writes, even if the transport ignores abort. Late completion is not acknowledged as success.
- Browser: a stalled or failed Turnstile script is removed after 10 seconds and produces a clear recovery message. Back → Review starts a fresh load; late loads cannot render a widget in a hidden review panel. Verification is never bypassed.

## Planner integration (browser)

- Build switch: `PUBLIC_ENQUIRIES_ENABLED=true` + `PUBLIC_TURNSTILE_SITE_KEY=<site key>`. Without them the planner is the non-sending preview. With them, the CSP adds Turnstile (`script-src`/`frame-src https://challenges.cloudflare.com`) and the review step shows the human check and **Send enquiry**.
- `src/lib/enquiry/submit.ts`: one idempotency key per reviewed payload, so retries reuse it and edits get a new one. 201/200 with an id → confirmation; 422 → back to the right step with a plain message; 403 verification → fresh check; 429/5xx/offline → "try again", keeping the answers. Never a success without a stored id.
- On success the local draft is cleared and a short reference (first 8 characters of the id) is shown.
- Tests: `tests/unit/submit.test.ts`; `tests/e2e/planner-submit.spec.ts` runs against `npm run build:submit` (Cloudflare's public Turnstile **test** key) with the API and Turnstile mocked, on desktop and mobile.

## Before enabling in production (owner-gated)

The privacy contact, notification recipient/channel and unsuccessful eligibility clock are already recorded; the planner/API and dormant outbox consumer are implemented. Remaining gates include approved live privacy/operating procedures, booked-client and pending-delivery decisions, production D1 and real Turnstile configuration, authenticated staging transaction acceptance, separately authorised Worker delivery/receipt acceptance and explicit real-intake activation. Do not repeat account setup or infer activation from implemented code.

## Tests

- `tests/unit/worker-enquiry.test.ts`: every status path, idempotency, Turnstile, logging privacy, normalisation.
- `tests/unit/worker-sqlite.test.ts`: the real SQL against the real migration on SQLite.
- `npm run test:runtime`: the full browser suite on the local Workers runtime, including "API is off in production config".

## Unsuccessful-enquiry retention — cleanup dormant, disposition routed

Owner decision (24 Nov 2026): unsuccessful enquiries become retention candidates 90 days after they are explicitly marked unsuccessful, not 90 days after intake. The approved privacy contact is theweddingnest.events@gmail.com. Booked-client retention remains separate.

`migrations/0003_unsuccessful_retention.sql` adds a nullable, validated UTC `unsuccessful_at` and a partial index. It does not classify or backfill any record. `src/worker/privacy.ts` adds a controlled status transition, aggregate-only preview and a bounded deletion primitive (at most 100 rows), tested against the real SQLite migration. Only known active states (`new`, `contacted`, `in_progress`) may be marked unsuccessful; repeated marking does not reset the date. Active, booked and unknown-clock records never qualify. The DELETE rechecks state and age atomically, and cascades associated delivered outbox rows.

Pending deliveries are reported separately and held instead of silently discarded. That hold can extend storage beyond the selected 90-day eligibility point; its resolution/escalation must be approved before promising a hard deletion deadline in a live notice. The pre-launch `/privacy/` page states this work is not operational.

The authenticated operator status route can explicitly mark an active enquiry unsuccessful and start its clock. Migration 0003 is recorded as already applied to isolated staging; it is not auto-applied by a request. **No cleanup route or cron is installed:** eligibility is not scheduled or guaranteed deletion. Before production use, settle booked-client and pending-delivery handling, verify the authenticated closure workflow, backups and fictional-data acceptance. Retention deletion cascades outbox snapshots but leaves independent `operator_audit` history; its separate privacy policy is documented in [privacy-retention.md](privacy-retention.md). Never infer unsuccessful status from age alone.
