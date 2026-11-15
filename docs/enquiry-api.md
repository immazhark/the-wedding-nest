# Enquiry API — `POST /api/enquiry`

**Status:** implemented and tested; **switched off** in production (`ENQUIRIES_ENABLED="false"`, no database bound). The planner does not call it yet. Turning on live submission is owner-gated.

## Contract

Request: `POST /api/enquiry`, `Content-Type: application/json`, `Origin` on the allow-list, `Idempotency-Key: <uuid v4>`, body ≤ 16 KB:

```json
{ "turnstileToken": "<token from the widget>", "enquiry": { "...": "EnquiryState (src/lib/enquiry/schema.ts)" } }
```

| Status | Body                                                    | Meaning                                                                       |
| ------ | ------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 201    | `{ "id" }`                                              | Stored in D1 with its outbox event (one transaction). Not "notification sent". |
| 200    | `{ "id" }`                                              | Same `Idempotency-Key` seen before; original id returned, nothing duplicated. |
| 400    | `invalid_json` / `invalid_idempotency_key`              | Malformed request.                                                            |
| 403    | `forbidden_origin` / `verification_failed`              | Origin not allowed, or Turnstile failed/missing.                              |
| 405    | `method_not_allowed` (+ `Allow: POST`)                  | Not POST.                                                                     |
| 413    | `payload_too_large`                                     | Body > 16 KB.                                                                 |
| 415    | `unsupported_media_type`                                | Not JSON.                                                                     |
| 422    | `invalid_enquiry` + `errors: { field: code }`           | Server-side validation (same rules as the planner). Input is never echoed.    |
| 429    | `rate_limited` (+ `Retry-After`)                        | Only if a rate-limit binding is configured.                                   |
| 503    | `enquiries_disabled` / `not_configured` / `*_unavailable` | Off, misconfigured, or Turnstile/D1 unreachable — safe to retry.              |

Every response: `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`. Logs contain only event, outcome, status and enquiry id: never names, numbers, IPs or payloads.

## Data

`migrations/0001_enquiries.sql`: `enquiries` (id, unique idempotency_key, created_at, payload_json = validated enquiry, consent_at, marketing_consent, status) and `outbox` (one `enquiry.created` row per enquiry for later asynchronous notification).

## Staging (isolated, test data only)

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

## Before enabling in production (owner-gated)

Privacy notice and retention period agreed; production D1 + Turnstile widget/secret created; lead inbox owner and notification channel chosen (outbox consumer, separate PR); planner wired to the API with Turnstile; end-to-end test on staging.

## Tests

- `tests/unit/worker-enquiry.test.ts`: every status path, idempotency, Turnstile, logging privacy, normalisation.
- `tests/unit/worker-sqlite.test.ts`: the real SQL against the real migration on SQLite.
- `npm run test:runtime`: the full browser suite on the local Workers runtime, including "API is off in production config".
