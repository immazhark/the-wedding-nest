# Outbox lease / retry primitives — NOT activated

`src/worker/outbox.ts` contains a **dormant** database-only delivery state
machine with a real-SQLite test suite and additive
`migrations/0002_outbox_leases.sql`.

What is implemented:

- Selects only opaque event metadata, not lead `payload_json`.
- Uses conditional atomic updates so concurrent workers cannot both claim the
  same event. If a worker loses the compare-and-swap race, it retries selection
  at most three more times to claim another ready event without spinning
  indefinitely. A worker still returns null when no claimable event remains.
  Leases expire after two minutes and are guarded by a fresh UUID token and
  attempt count. Old claim tokens cannot acknowledge a re-claimed event.
- Marks an event delivered **only when a future approved caller explicitly
  invokes acknowledgement**; there is no actual transport currently.
- Releases failures with bounded exponential backoff, retaining undelivered
  events. Automatically stops claiming after eight attempts for manual review.
- Private data, retry errors and destination credentials are never included in
  claim metadata or logs.

No API route, scheduled task, worker hook, provider secret, recipient address,
external HTTP request, queue consumer or automatic send is installed.
`migrations/0002_outbox_leases.sql` is committed but **not automatically
applied** to the staging D1 database by the deployment. The existing site and
staging intake continue to use the v1 schema safely.

**Future required approval:** verified lead-response owner, channel,
recipient, access/privacy basis, retention rules, and provider credentials.
A future consumer must obtain a provider's idempotent delivery guarantee
using the stable outbox event ID. Delivery is otherwise at least once: a
provider could accept a message just before a lease expires, and another
worker could retry. Do not enable without this safeguard and audited tests.

Before staging testing of a dispatcher, apply the additive v2 migration to
isolated staging with explicit change review, then test with fictional leads.
Never automatically run schema changes against production or enable a
scheduler as part of this groundwork.
