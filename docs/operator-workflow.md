# Enquiry operator workflow — dormant foundation

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
