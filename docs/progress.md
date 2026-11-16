# Project progress — updated 16 November 2026

Current state first; history at the end. Update after every meaningful merge.

## Current state of `main`

| Area                         | State                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site                         | Astro 7 + strict TS + Tailwind 4 static site: homepage, `/plan-your-event/` planner, 404. Owner-approved creative pass 1 (#7) recomposes the homepage per docs/creative-excellence-standards.md. Creative direction and placement-dependent logo variants approved; content remains gated. |
| Planner                      | 5 stages + review, occasion-based branching, explicit consent. **Does not send**. Disclosure before step 1 asks visitors not to enter real contact details. Local draft keeps only occasion/service/style/date/guest-count/budget (7 days); never name, phone, venue/location or notes. |
| Enquiry backend              | `POST /api/enquiry` Worker implemented and tested (D1 + outbox, server-side Turnstile, idempotency, shared validation). **Off in production**; isolated staging D1 created and schema applied, staging intake enabled only in the separate test Worker with an exact staging Origin allow-list and public Turnstile dummy keys. Planner Send step wired behind `PUBLIC_ENQUIRIES_ENABLED` (off in production). See docs/enquiry-api.md.                                                      |
| Indexing                     | Off everywhere. `PUBLIC_ALLOW_INDEXING=true` (production build only, owner-gated) flips meta robots, generated `robots.txt` and `X-Robots-Tag` together.                                                                                                                                  |
| CI                           | GitHub Actions `verify`: format, astro check, unit, build, Playwright + axe on desktop/mobile against the static build **and** the local Workers runtime (`wrangler dev`: routing, live headers, API off).                                                                                 |
| Cloudflare | Cloudflare MCP connected. Main `2417182` deployed successfully at https://the-wedding-nest.mazharkhan-it.workers.dev. Branch preview failure traced to missing Wrangler `previews` block; config fix produced successful build `1e8dbbff-a21a-41bb-93d4-2e2632d73c76`. Live HTTP noindex/security headers verified. Deployed branch homepage and planner navigation verified in the cloud browser; staging planner verified through review in the cloud browser; real deployed desktop/mobile submission passed in GitHub's `staging-browser` job. |
| Domain `theweddingnest.in`   | Not attached (owner-gated).                                                                                                                                                                                                                                                              |
| Business content and media   | Official logo approved in #7; event photography, testimonials and business claims still require approval.                                                                                                                                                                                                                                            |

## Merged PRs

- #1 tooling foundation · #2 handover docs
- #3 (c492537) M0 foundation + planner UI
- #4 (d63c44b) standing merge authorisation recorded in CLAUDE.md
- #6 (1e29a88) enquiry API · #7 (8502f6e) creative pass 1 + official logo (owner-approved)
- #5 (9c3a863) review follow-up: planner disclosure, draft privacy (no location), unified SEO switch, solid sticky header, live-URL test mode, docs reconciled
- #8 (da53d1a) gated planner Send step; #9 (4c2ba65) authentic testimonial source policy

## Next

0. Creative pass 1 and logo are approved (#7). Supply permission-cleared photography per docs/photography-brief.md.

1. Preview fix merged in #11 as `8e24166` after full GitHub verify and successful Cloudflare branch build. Working review URL: https://codex-cloudflare-previews-staging-the-wedding-nest.mazharkhan-it.workers.dev/.
2. Staging D1 `twn-enquiries-staging` created in APAC; committed schema applied through the Cloudflare API. Separate staging Worker deployed successfully at https://the-wedding-nest-staging.mazharkhan-it.workers.dev with public Turnstile test keys, submission-enabled assets and an explicit fictional-data-only notice. Run `python scripts/verify_staging.py` (Python 3 + curl) for HTTP guards, durable writes and idempotency; confirm paired rows in D1. The real deployed desktop and mobile browser submissions passed in GitHub Actions (run `43778044811`, job `133008733553`). The separate cloud browser could not finish loading the third-party verification script. Production stays off until the owner approves.
3. Owner review: design direction, planner copy/options, budget bands, privacy wording.

## Tooling verified (first cloud session)

- Superpowers loaded; the three `twn-*` project skills discovered.
- Impeccable not loaded (marketplace unregistered; github.com/pbakaus blocked by proxy). rtk pilot blocked (crates.io/GitHub 403). Not blocking.
- Initial session lacked Cloudflare access; superseded on 16 Nov by the connected Cloudflare MCP and successful live HTTP requests.

## History

- 15 Nov 2026: repository, README (b99839b), tooling PR #1 (acc17ca), handover docs PR #2, domain on Cloudflare DNS with DNSSEC (owner-confirmed).

## Codex takeover — 16 November 2026

- Reconstructed current state from main `da53d1a`, commits #1–#9, open PR search (none), live CI and Cloudflare GitHub check records; older scaffold-only handover status is historical.
- Parallel API and planner reviews found and fixed bounded-body consumption, missing-Origin allow-list handling, limiter outage handling, false duplicate acknowledgement, malformed submission responses, stalled requests and navigation during sending. Added focused unit/browser regressions.
- Production gates preserved: no domain attachment, indexing, live submissions or unapproved business content. Staging D1/Turnstile still needs Cloudflare access and isolated test configuration.

## Isolated staging verification — 16 Nov 2026

- `python scripts/verify_staging.py` passed against the deployed Worker: main intake off; staging noindex/test notice; method, Origin, missing verification and consent guards; 201 durable submission and 200 idempotent retry with the same id.
- Synthetic test reference: `97185358-0179-4aab-90d2-ca52fd838e46`. D1 confirmed one enquiry and exactly one matching outbox row; no notifications are configured.
- Real deployed desktop and mobile submissions passed in GitHub Actions with the actual test widget and API (run `43778044811`, job `133008733553`); no mocks. The cloud browser independently rendered the planner and advanced all five stages to review, but its third-party script stayed pending.
