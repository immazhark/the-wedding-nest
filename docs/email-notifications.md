# Email notification preparation

24 November 2026. This is a dormant transport, not an active delivery pipeline.

## Implemented boundary

`src/worker/notification-email.ts` performs one bounded Resend HTTP attempt only when explicitly enabled and supplied a server-side credential plus a verified-domain assertion. It is not imported by the Worker entry point. A separate dormant consumer now reads and freezes records only when explicitly invoked and enabled; no cron, route, credential binding, migration execution or sender activation is included.

The prepared sender is `The Wedding Nest <enquiries@theweddingnest.in>`; the owner-approved operator recipient and reply address are `theweddingnest.events@gmail.com`. The sender mailbox is a proposed sending identity, not an inbox. No customer autoresponder, CC/BCC, HTML, attachments or WhatsApp automation is installed. The caller cannot override the recipient or provider URL.

The plain-text notice must originate from the existing server validator/content builder. The consumer freezes the notice and contract version before its first attempt; changing the body on retry can cause an idempotency conflict. Never render private enquiry details in logs, browser bundles, analytics or PR evidence.

## Acceptance, retry and holds

- A successful provider response must contain a UUID message reference. `accepted` means provider acceptance, not inbox delivery. The existing outbox column named `delivered_at` must not be presented as recipient receipt.
- Network/timeout failures, HTTP 429/5xx and malformed successful responses return a safe retry classification. The adapter never loops; the dormant consumer composes the existing outbox backoff/lease primitives.
- Other HTTP failures, including idempotency conflicts, are held for review. No automatic key changes, recipient changes or fallback channel sends.
- The immutable outbox UUID supplies the provider key. Events are blocked at 23 hours from original creation, including delayed first attempts, conservatively inside the provider's 24-hour key retention. This is bounded duplicate protection, not unlimited exactly-once delivery. Stale/unknown events require manual reconciliation; never reset their timestamp to bypass this guard.
- Missing configuration, malformed events and disabled delivery cause no network access. The network target is fixed, redirects rejected and requests have a 10-second abort signal.

Official references checked on 24 November 2026:
- https://resend.com/docs/dashboard/emails/idempotency-keys
- https://resend.com/docs/api-reference/emails/send-email

## DNS and remaining activation work

The owner approved the four prepared email-authentication DNS records on 24 November. They were added DNS-only with Auto TTL, and Cloudflare read-back matched their content. All four records and the sending domain were subsequently provider-verified. Recheck provider status before any activation; DNS configuration alone does not enable this adapter.

Before live delivery:
1. Complete provider verification and approve the exact sender identity and operating handler/backup.
2. Provision a domain-scoped sending-only key directly into the Worker secret store through a secure owner-controlled flow. No key has been created/exported here; do not paste credentials into chat or repository files.
3. Approve/apply required outbox migrations to isolated staging and review the dormant consumer's immutable snapshots, bounded retries and acknowledgement semantics. Add authenticated operator handling before activation. This adapter alone does not read or change outbox rows.
4. Separately approve a fictional staging receipt test; confirm inbox receipt and failure handling before approving real delivery.
5. Resolve pending-delivery retention holds and booked-client retention before live intake/cleanup. Preserve public launch, indexing and real-enquiry approval gates.

## Dormant consumer implementation

The single-event consumer in `notification-consumer.ts` now composes the existing lease/backoff core and email adapter. Migration `0004_email_delivery_state.sql` adds a frozen notice, transport version, provider-acceptance reference and operator-hold reason to each outbox row. It has not been applied to Cloudflare.

Configuration is checked before any claim or private-data read. The consumer renders server-validated details once, persists the winning snapshot before the first network call, and reuses it on every retry. Database triggers prevent subsequent snapshot/identity changes; deletion still cascades with the parent enquiry. Frozen content is additional private data in the same retention boundary and must never be exported to monitoring. Existing records have no snapshot and will be checked against the conservative event-age cutoff; do not replay historical events automatically.

Permanent failures, invalid/old snapshots and exhausted attempts are held by exhausting claim eligibility and recording a bounded reason. Provider acceptance and lease acknowledgement are recorded in one conditional database update. A failed ACK leaves the event unacknowledged: a later eligible retry reuses the identical provider key and payload within the age window. A transport-contract version change blocks old snapshots for review rather than silently sending a changed payload.

There is still no Worker import, scheduler, HTTP trigger, secret or live consumer. No migration or real send was performed. Staging activation requires separate migration/credential/receipt-test approval. Before live operation, provide an authenticated operator workflow for held/exhausted/expired events and distinguish provider acceptance from inbox receipt. Deleting a lead cannot recall an email already accepted or in flight; provider-side retention/access and this race need inclusion in the operating/privacy procedure. No inbox webhook or automated resend/replay endpoint is introduced here.
