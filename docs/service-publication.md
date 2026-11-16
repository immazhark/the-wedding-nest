# Service landing pages — owner-gated publication

The source code contains **potential route slugs only**. These are not a
representation that The Wedding Nest currently supplies all these services.
No /services/ pages are emitted until their individual factual source files
are approved. The design preview remains globally noindex.

## Publication workflow

1. Confirm that the business actually offers the specific service, its current
   coverage, available team/vendors and all proposed copy.
2. Obtain an explicit business-owner sign-off, logged outside the repository.
3. Add one reviewed JSON file at
   `src/content/services/<approved-slug>.json`, with the matching
   `slug`, `publicationApproved: true`, an opaque private
   `approvalRef` (e.g. `TWN-PUB-2026-A001`), factual `title`,
   `description`, `introduction` and 2–5 useful `sections`.
   Follow `servicePageSchema` in `src/lib/services/publication.ts`.
4. Confirm the full page text, wording of commitments, planner link, accuracy
   and mobile layout on the noindex preview. Do not publish fabricated pricing,
   reviews, schedules, photos or claims.
5. Independently approve the production domain, indexing, real enquiries and
   any photography. A correctly shaped approval reference is **not itself
   evidence of permission or business verification**.

An unapproved, misnamed, malformed or unrecognized service source causes a
build failure instead of quietly publishing an unreviewed page. The route
allowlist is intentional; expanding it needs explicit review.
