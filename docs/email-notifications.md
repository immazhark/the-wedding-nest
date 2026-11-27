# Email notification preparation

Current source boundary (27 November 2026): the transport and durable consumer are implemented but remain dormant. Historical provider configuration evidence below must be rechecked before activation; it does not establish sends, receipt or deployed Worker delivery.

## Implemented boundary

`src/worker/notification-email.ts` performs one bounded Resend HTTP attempt only when explicitly enabled and supplied a server-side credential plus a verified-domain assertion. It is not imported by the Worker entry point. A separate dormant consumer now reads and freezes records only when explicitly invoked and enabled; no cron, route, credential binding, migration execution or sender activation is included.

The prepared sender is `The Wedding Nest <enquiries@theweddingnest.in>`; the owner-approved operator recipient and reply address are `theweddingnest.events@gmail.com`. The sender mailbox is a proposed sending identity, not an inbox. No customer autoresponder, CC/BCC, HTML, attachments or WhatsApp automation is installed. The caller cannot override the recipient or provider URL.

The plain-text notice must originate from the existing server validator/content builder. The consumer freezes the notice and contract version before its first attempt; changing the body on retry can cause an idempotency conflict. Never render private enquiry details in logs, browser bundles, analytics or PR evidence.

## Acceptance, retry and holds

- A successful provider response must contain a UUID message reference. `accepted` means provider acceptance, not inbox delivery. The existing outbox column named `delivered_at` must not be presented as recipient receipt.
- Network/timeout failures, HTTP 429/5xx and malformed successful responses return a safe retry classification. The adapter never loops; the dormant consumer composes the existing outbox backoff/lease primitives.
- Other HTTP failures, including idempotency conflicts, are held for review. No automatic key changes, recipient changes or fallback channel sends.
- The immutable outbox UUID supplies the provider key. Events are blocked at 23 hours from original creation, including delayed first attempts, conservatively inside the provider's 24-hour key retention. This is bounded duplicate protection, not unlimited exactly-once delivery. Stale/unknown events require manual reconciliation; never reset their timestamp to bypass this guard.
- Missing configuration, malformed events and disabled delivery cause no network access. The network target is fixed, redirects rejected and one attempt has a 10-second total deadline across fetch and response parsing, with best-effort abort; a late response cannot acknowledge the event.

Official references checked on 24 November 2026:
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://resend.com/docs/api-reference/emails/send-email

## DNS and remaining activation work

The owner approved the four prepared email-authentication DNS records on 24 November. They were added DNS-only with Auto TTL, and Cloudflare read-back matched their content. All four records and the sending domain were subsequently provider-verified. Recheck provider status before any activation; DNS configuration alone does not enable this adapter.

Before live delivery:
1. Reverify the already-recorded domain/DNS verification; confirm the exact sender identity and operating handler/backup. Do not repeat completed DNS/account setup.
2. Provision a domain-scoped sending-only key directly into the Worker secret store through a secure owner-controlled flow. No key has been created/exported here; do not paste credentials into chat or repository files.
3. Reverify the already-applied isolated staging migrations (0002–0004) and review the dormant consumer's immutable snapshots, bounded retries and acknowledgement semantics. The authenticated aggregate delivery overview is implemented; held-event resolution and operating authority remain prerequisites before activation. This adapter alone does not read or change outbox rows.
4. Separately approve a fictional staging receipt test; confirm inbox receipt and failure handling before approving real delivery.
5. Resolve pending-delivery retention holds and booked-client retention before live intake/cleanup. Preserve public launch, indexing and real-enquiry approval gates.

## Dormant consumer implementation

The single-event consumer in `notification-consumer.ts` now composes the existing lease/backoff core and email adapter. Migration `0004_email_delivery_state.sql` adds a frozen notice, transport version, provider-acceptance reference and operator-hold reason to each outbox row. It was applied to the verified isolated staging D1 on 24 November 2026, together with migrations 0002 and 0003; schema objects were read back and foreign-key verification passed. No production database is configured.

Configuration is checked before any claim or private-data read. The consumer renders server-validated details once, persists the winning snapshot before the first network call, and reuses it on every retry. Database triggers prevent subsequent snapshot/identity changes; deletion still cascades with the parent enquiry. Frozen content is additional private data in the same retention boundary and must never be exported to monitoring. Existing records have no snapshot and will be checked against the conservative event-age cutoff; do not replay historical events automatically.

Permanent failures, invalid/old snapshots and exhausted attempts are held by exhausting claim eligibility and recording a bounded reason. Provider acceptance and lease acknowledgement are recorded in one conditional database update. A failed ACK leaves the event unacknowledged: a later eligible retry reuses the identical provider key and payload within the age window. A transport-contract version change blocks old snapshots for review rather than silently sending a changed payload.

There is still no deployed Worker consumer import, scheduler, HTTP send trigger or implemented Worker email credential binding. The additive staging schema is applied, but no real send was performed. Staging delivery still needs secure credentials and receipt-test approval. The authenticated delivery overview provides read-only aggregate visibility, not held-event resolution. Before live operation, complete an approved resolution workflow for held/exhausted/expired events and distinguish provider acceptance from inbox receipt. Deleting a lead cannot recall an email already accepted or in flight; provider-side retention/access and this race need inclusion in the operating/privacy procedure. No inbox webhook or automated resend/replay endpoint is introduced here.

## Manual fictional provider receipt workflow

`Manual fictional email receipt test` is a manual-only GitHub Actions workflow. It has no push, schedule, pull-request or webhook trigger. Its default `mock` job runs offline and has no credentials. Ordinary CI also runs the offline probe. The Node 24 script uses native TypeScript stripping and requires no new dependency.

The optional `send` job runs only from `main`, with mode `send`, exact confirmation `SEND ONE FICTIONAL RECEIPT`, a confirmed current domain-verification flag, a valid stable UUID and an original UTC timestamp within the adapter's age window. It uses the `twn-email-receipt` GitHub environment and its `TWN_RESEND_STAGING_API_KEY` secret. The environment is now configured with required reviewer `immazhark`, administrator bypass disabled, and exactly branch `main` allowed (zero tags). Self-review is not prevented because the sole owner must be able to approve a manually initiated run; do not treat this as independent actor separation. No environment secret or variable has been added. Reverify these protections before adding the key. If a plan cannot enforce environment protection, leave its secret unset and keep real sends blocked.

The probe sends at most one HTTP request per invocation. It does not poll the inbox, read/write D1, dispatch queued leads or activate a Worker. It only proves the provider sending path when the recipient separately confirms receipt. All logs contain a bounded status, never a key, message content or private provider error. `accepted` is not inbox receipt.

### Secure owner setup (dashboard only; no laptop required)

1. Approve sender `The Wedding Nest <enquiries@theweddingnest.in>` and one fictional receipt message to `theweddingnest.events@gmail.com`.
2. In GitHub repository Settings → Environments, verify the already-configured `twn-email-receipt` protections: required owner review, administrator bypass off, branch `main` only and no tags. Do not add a secret before confirming these restrictions.
3. In Resend, create a **sending-access-only** key restricted to `theweddingnest.in`. Copy it directly into that environment's `TWN_RESEND_STAGING_API_KEY` secret. Never paste it in chat, issue/PR text, a repository file or workflow input. No API key has been created or exported by the agent.
4. Recheck the provider domain is verified. Run the workflow in `mock` mode first. For the separately approved real probe, choose `send`, enter the exact confirmation, and record a fresh UUID plus its original ISO UTC timestamp with milliseconds. Keep both unchanged for any same-test retry. Never refresh the timestamp or change reference just to bypass a hold/unknown result; reconcile first.
5. Confirm receipt of the clearly marked test email, then remove the temporary environment key or revoke it once receipt testing is finished. No Worker sending key is installed by this workflow.

### Exact receipt message contract

Sender and recipient are fixed as above. Subject is `[TEST] The Wedding Nest | New enquiry <first eight reference characters>`. Test idempotency keys use a separate `twn-receipt/` namespace; real enquiry keys stay `twn-enquiry/`.

Body (the only variable is the non-personal test UUID):

```text
FICTIONAL STAGING RECEIPT TEST — THE WEDDING NEST
No customer enquiry. No booking or response to a customer is required.
Test reference: <UUID>
This checks the email provider path only, not the deployed Worker or database.
Please confirm inbox receipt to the project owner using the test reference.
```

The repository records this workflow as prepared and mock-tested only. This documentation change does not inspect current environment-secret presence or establish a real send, inbox confirmation or public activation. Reconcile current protected workflow runs and owner receipt evidence before repeating any probe. Hosted staging migrations 0002–0004 have been applied separately; this receipt probe itself has no database access. A later Worker integration test still needs its own isolated staging setup and explicit receipt authorisation.
