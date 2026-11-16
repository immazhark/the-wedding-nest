# Dormant enquiry notification content contract

The event-outbox record is saved atomically alongside a validated enquiry.
`src/worker/notification-content.ts` now provides
`buildOperatorNotice(enquiryId, storedEnquiry)`, a **pure** presenter for a future
owner-approved notification integration.

- It validates the persisted payload again using the Worker/browser shared
  schema and refuses unconsented or malformed records.
- The subject uses only an opaque reference. There is no customer name, phone
  or untrusted text in its subject.
- Its message is plain text. Customer-supplied CR/LF, control, bidirectional
  and angle-bracket delimiters are neutralised within individual value lines
  to prevent forged header-like or HTML-like content. Never treat the result
  as HTML or copy it into transport headers.
- The body **does** contain contact details. It must never be logged, added to
  CI/artifacts, published, stored in an analytics event, or sent to an unknown
  destination. It contains no secret, service credentials or marketing copy.
- No provider, recipient, API integration, worker route, cron, notification
  permission or send action is present. No marketing messages can be sent.

Before integrating an actual notification service, the owner must choose and
verify the recipient, channel, legal/privacy basis, access rights and retention.
A future adapter must use a vetted API, secret bindings, bounded timeouts,
idempotent delivery and error-safe logging. The delivery lease must be retained
until provider acceptance is confirmed; a generated message is NOT delivery.
