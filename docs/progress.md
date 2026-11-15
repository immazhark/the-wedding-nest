# Project progress — updated 15 November 2026

Current state first; history at the end. Update after every meaningful merge.

## Current state of `main`

| Area                         | State                                                                                                                                                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site                         | Astro 7 + strict TS + Tailwind 4 static site: homepage (design preview), `/plan-your-event/` planner, 404. Proposed editorial design, not an approved brand.                                                                                                                                |
| Planner                      | 5 stages + review, occasion-based branching, explicit consent. **Does not send**. Disclosure before step 1 asks visitors not to enter real contact details. Local draft keeps only occasion/service/style/date/guest-count/budget (7 days); never name, phone, venue/location or notes. |
| Enquiry backend              | Not built. Validation (`src/lib/enquiry/validate.ts`) is ready for server reuse. Next PR.                                                                                                                                                                                                 |
| Indexing                     | Off everywhere. `PUBLIC_ALLOW_INDEXING=true` (production build only, owner-gated) flips meta robots, generated `robots.txt` and `X-Robots-Tag` together.                                                                                                                                  |
| CI                           | GitHub Actions `verify` (format, astro check, unit, build, Playwright + axe on desktop/mobile) — green on `main`.                                                                                                                                                                         |
| Cloudflare                   | Workers Builds connected by the owner; latest `main` build reported successful by the owner. Runtime **not yet verified by an agent**: `*.workers.dev` is blocked by this cloud session's network policy. See docs/deployment.md.                                                         |
| Domain `theweddingnest.in`   | Not attached (owner-gated).                                                                                                                                                                                                                                                              |
| Business content and media   | None approved yet; placeholders are labelled.                                                                                                                                                                                                                                            |

## Merged PRs

- #1 tooling foundation · #2 handover docs
- #3 (c492537) M0 foundation + planner UI
- #4 (d63c44b) standing merge authorisation recorded in CLAUDE.md
- Review follow-up (this PR): planner disclosure, draft privacy (no location), unified SEO switch, solid sticky header, live-URL test mode, docs reconciled

## Next

1. Verify the deployed Worker URL: run `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e` from an environment that can reach it (needs the exact `*.workers.dev` host allowed, or run by the owner's reviewer).
2. Worker `POST /api/enquiry` + D1 + server-side Turnstile, test-first, staging-only bindings; live submission stays owner-gated.
3. Owner review: design direction, planner copy/options, budget bands, privacy wording.

## Tooling verified (first cloud session)

- Superpowers loaded; the three `twn-*` project skills discovered.
- Impeccable not loaded (marketplace unregistered; github.com/pbakaus blocked by proxy). rtk pilot blocked (crates.io/GitHub 403). Not blocking.
- Cloudflare API/MCP and `*.workers.dev` unreachable from the container.

## History

- 15 Nov 2026: repository, README (b99839b), tooling PR #1 (acc17ca), handover docs PR #2, domain on Cloudflare DNS with DNSSEC (owner-confirmed).
