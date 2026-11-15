# Project progress — updated 16 November 2026

Current state first; history at the end. Update after every meaningful merge.

## Current state of `main`

| Area                         | State                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site                         | Astro 7 + strict TS + Tailwind 4 static site: homepage, `/plan-your-event/` planner, 404. Owner-approved creative pass 1 (#7) recomposes the homepage per docs/creative-excellence-standards.md. Creative direction and placement-dependent logo variants approved; content remains gated. |
| Planner                      | 5 stages + review, occasion-based branching, explicit consent. **Does not send**. Disclosure before step 1 asks visitors not to enter real contact details. Local draft keeps only occasion/service/style/date/guest-count/budget (7 days); never name, phone, venue/location or notes. |
| Enquiry backend              | `POST /api/enquiry` Worker implemented and tested (D1 + outbox, server-side Turnstile, idempotency, shared validation). **Off in production**; staging env defined, DB not yet created. Planner Send step wired behind `PUBLIC_ENQUIRIES_ENABLED` (off in production). See docs/enquiry-api.md.                                                      |
| Indexing                     | Off everywhere. `PUBLIC_ALLOW_INDEXING=true` (production build only, owner-gated) flips meta robots, generated `robots.txt` and `X-Robots-Tag` together.                                                                                                                                  |
| CI                           | GitHub Actions `verify`: format, astro check, unit, build, Playwright + axe on desktop/mobile against the static build **and** the local Workers runtime (`wrangler dev`: routing, live headers, API off).                                                                                 |
| Cloudflare                   | Workers Builds connected by the owner; GitHub checks confirm `verify` and Workers Builds **success** at `da53d1a` (15 Nov, 22:09 UTC). Deployed browser runtime remains unverified; no exact preview hostname or authenticated Cloudflare management capability is available in this session. See docs/deployment.md.                                                         |
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

1. Correct the Cloudflare non-production branch build setting (branch builds #4–#8 failed; main builds succeed), then verify the deployed Worker URL: run `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e` from an environment that can reach it (needs the exact `*.workers.dev` host allowed, or run by the owner's reviewer).
2. Staging: create the D1 database + Turnstile widget (Cloudflare access needed), deploy `--env staging` with `PUBLIC_ENQUIRIES_ENABLED=true`, test end to end; production stays off until the owner approves.
3. Owner review: design direction, planner copy/options, budget bands, privacy wording.

## Tooling verified (first cloud session)

- Superpowers loaded; the three `twn-*` project skills discovered.
- Impeccable not loaded (marketplace unregistered; github.com/pbakaus blocked by proxy). rtk pilot blocked (crates.io/GitHub 403). Not blocking.
- Cloudflare API/MCP and `*.workers.dev` unreachable from the container.

## History

- 15 Nov 2026: repository, README (b99839b), tooling PR #1 (acc17ca), handover docs PR #2, domain on Cloudflare DNS with DNSSEC (owner-confirmed).

## Codex takeover — 16 November 2026

- Reconstructed current state from main `da53d1a`, commits #1–#9, open PR search (none), live CI and Cloudflare GitHub check records; older scaffold-only handover status is historical.
- Parallel API and planner reviews found and fixed bounded-body consumption, missing-Origin allow-list handling, limiter outage handling, false duplicate acknowledgement, malformed submission responses, stalled requests and navigation during sending. Added focused unit/browser regressions.
- Production gates preserved: no domain attachment, indexing, live submissions or unapproved business content. Staging D1/Turnstile still needs Cloudflare access and isolated test configuration.
