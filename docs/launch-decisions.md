# Launch decisions — owner review required

The site remains a noindex design preview. Staging accepts fictional data only. These decisions
must be recorded before connecting the production domain or enabling real customer enquiries.

| Decision | Current position | Needed from the business |
| --- | --- | --- |
| Enquiry handling | D1 stores the enquiry and its outbox event; no notifications are sent. Owner selected WhatsApp +91 86867 73095 and email theweddingnest.events@gmail.com on 24 November 2026. | Confirm the operating handler/backup, routing between channels and provider/cost before activation. |
| Privacy contact | Owner approved theweddingnest.events@gmail.com on 24 November 2026 for access, correction and deletion requests. | Implement and review the full notice and authenticated handling process before live intake. |
| Retention | Owner approved 90 days after an enquiry is explicitly marked unsuccessful on 24 November 2026. No production cleanup is active. | Migration 0003 and dormant primitives implement the explicit unsuccessful clock. Review pending-delivery holds, operator authority and booked-client rules before activation. |
| Marketing | Optional consent is separate; no marketing delivery exists. | Confirm whether marketing is needed at launch. Default remains no marketing. |
| Public business details | Logo, Instagram, Facebook (facebook.com/twn.events), phone +91 99669 73113 and email theweddingnest.events@gmail.com were supplied by the owner on 18 November 2026 and are shown in the footer, planner fallback and Organization JSON-LD. Canonical domain is theweddingnest.in. twn.events was an earlier domain that the business no longer uses and does not own: never use it as a website or link target (the Instagram and Facebook handles are unaffected). WhatsApp (same number as the phone), address 12-2-1/D/68, Zeba Bagh, Asif Nagar, Hyderabad, Telangana 500028 and hours 9 am to 12 midnight (days unspecified) were supplied 18 November 2026 and are shown in the footer; address is also in Organization JSON-LD. | Owner confirmed open all days, 9 am to 12 midnight; 9966973113 is the registered business line (calls and WhatsApp Business) and 8686773095 is founder Mohammed Ather Khan's personal number, published at his direction. Still to confirm: service coverage, whether visitors may call in at the address, and any legal business name. |
| Photography and reviews | Authentic assets only; placeholders stay labelled. | Supply permission-cleared originals and approve specific quotes, names and likenesses. |
| Production launch | Domain, indexing and real enquiry intake remain off. | Review the release preview and give explicit approval for each launch gate. |

Only the explicit owner decisions above are recorded; no booked-client retention, service claim
or unimplemented privacy promise is assumed. Implementation still needs production Turnstile,
abuse controls, notification delivery/retries, retention/deletion handling and a final release check.
