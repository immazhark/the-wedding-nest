# Project progress — updated 15 November 2026

Current state first; history at the end. Update after every meaningful merge.

## Current state of `main`

| Area                         | State                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages                        | `/`, `/services/`, `/weddings/`, `/nikah-and-walima/`, `/celebrations/`, `/plan-your-event/`, 404. Occasion and service pages link into the planner with choices preselected. All copy is an editorial draft. |
| Testimonials                 | Architecture ready (schema, editorial components, film player); content empty pending the owner's verified shortlist; Google listing link only. docs/customer-testimonials.md. |
| Site                         | Astro 7 + strict TS + Tailwind 4 static site: homepage, `/plan-your-event/` planner, 404. Creative pass 1 (PR pending owner visual approval) recomposes the homepage per docs/creative-excellence-standards.md. Proposed design, not an approved brand. |
| Planner                      | 5 stages + review, occasion-based branching, explicit consent. **Does not send**. Disclosure before step 1 asks visitors not to enter real contact details. Local draft keeps only occasion/service/style/date/guest-count/budget (7 days); never name, phone, venue/location or notes. |
| Enquiry backend              | `POST /api/enquiry` Worker implemented and tested (D1 + outbox, server-side Turnstile, idempotency, shared validation). **Off in production**; staging env defined, DB not yet created. Planner Send step wired behind `PUBLIC_ENQUIRIES_ENABLED` (off in production). See docs/enquiry-api.md.                                                      |
| Indexing                     | Off everywhere. `PUBLIC_ALLOW_INDEXING=true` (production build only, owner-gated) flips meta robots, generated `robots.txt` and `X-Robots-Tag` together.                                                                                                                                  |
| CI                           | GitHub Actions `verify`: format, astro check, unit, build, Playwright + axe on desktop/mobile against the static build **and** the local Workers runtime (`wrangler dev`: routing, live headers, API off).                                                                                 |
| Cloudflare                   | Workers Builds connected by the owner; latest `main` build reported successful by the owner. Runtime **not yet verified by an agent**: `*.workers.dev` is blocked by this cloud session's network policy. See docs/deployment.md.                                                         |
| Domain `theweddingnest.in`   | Not attached (owner-gated).                                                                                                                                                                                                                                                              |
| Business content and media   | None approved yet; placeholders are labelled.                                                                                                                                                                                                                                            |

## Merged PRs

- #1 tooling foundation · #2 handover docs
- #3 (c492537) M0 foundation + planner UI
- #4 (d63c44b) standing merge authorisation recorded in CLAUDE.md
- #8 (da53d1a) planner Send step behind switch · #9 testimonial sources (owner)
- Services/occasion pages + testimonial architecture (this PR)
- #6 (1e29a88) enquiry API · #7 (8502f6e) creative pass 1 + official logo (owner-approved)
- #5 (9c3a863) review follow-up: planner disclosure, draft privacy (no location), unified SEO switch, solid sticky header, live-URL test mode, docs reconciled
- Enquiry API PR (this one): Worker + D1 migration + staging env + runtime tests in CI

## Next

0. Owner visual review of creative pass 1 (screenshots in `docs/review/creative-pass-1/`). Photography: see docs/photography-brief.md.

1. Verify the deployed Worker URL: run `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e` from an environment that can reach it (needs the exact `*.workers.dev` host allowed, or run by the owner's reviewer).
2. Staging: create the D1 database + Turnstile widget (Cloudflare access needed), deploy `--env staging` with `PUBLIC_ENQUIRIES_ENABLED=true`, test end to end; production stays off until the owner approves.
3. Owner review: design direction, planner copy/options, budget bands, privacy wording.

## Tooling verified (first cloud session)

- Superpowers loaded; the three `twn-*` project skills discovered.
- Impeccable not loaded (marketplace unregistered; github.com/pbakaus blocked by proxy). rtk pilot blocked (crates.io/GitHub 403). Not blocking.
- Cloudflare API/MCP and `*.workers.dev` unreachable from the container.

## History

- 15 Nov 2026: repository, README (b99839b), tooling PR #1 (acc17ca), handover docs PR #2, domain on Cloudflare DNS with DNSSEC (owner-confirmed).
