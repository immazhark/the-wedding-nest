# Approved event stories — publication contract

No portfolio pages are emitted from a clean checkout because no private client
content, event narrative or original photographs has yet been approved.
The route `/stories/[slug]/` exists only as a source-code template.

## Requirements for a real story

1. Verify that TWN really performed the described work. Review each narrative
   sentence, event identity, date, location (if mentioned), claims and credits.
   The public title and URL slug must not expose a family or guest identity
   unless individually authorised.
2. Obtain explicit signed/captured consent from the family and photographer for
   every individual photograph, text, likeness, attribution and intended use;
   keep source records outside the public repository.
3. Add released original images and corresponding entries to
   `src/assets/events/<category>/<neutral-event-slug>/` and
   `src/content/media/<event-slug>.json` following
   [photography-brief.md](photography-brief.md). The media manifest's exact file
   paths must match the actual local files, each with `permission: true`
   and a separate opaque `releaseRef`.
4. Add `src/content/stories/<neutral-event-slug>.json`, following
   `storySchema` in `src/lib/stories/publication.ts`: use the matching
   `slug` and `occasion`, two or more released `images` from that
   exact event directory, verified `title`, `introduction`, `brief`
   and `contribution`, `publicationApproved: true` and a private
   `approvalRef` such as `TWN-STORY-2026-A001`.
5. Approve the composed desktop/mobile page with the real crops and alt text.
   Add a portfolio navigation link only after at least one story is published.
   Indexing and the production domain still require separate owner approval.

An approvalRef only validates shape. It is not independent proof that the
business or family gave permission. Missing, mismatched or unreviewed photo
bindings fail the build. Do not invent sample customer stories or event assets
to make empty templates appear populated.
