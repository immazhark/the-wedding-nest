# The Wedding Nest

Premium wedding and event experiences in Hyderabad, India.

**Status:** Astro 7 + TypeScript + Tailwind 4 editorial site and five-step planner on a Cloudflare Workers design preview. Public enquiries are **disabled** and search indexing is off. An isolated staging Worker accepts fictional test submissions with Turnstile and a separate D1 database. No custom production domain is attached. Current state: [docs/progress.md](docs/progress.md), [docs/deployment.md](docs/deployment.md).

- Domain: https://theweddingnest.in (registered; production site not yet deployed)
- Product owner workflow: authorised cloud implementation with GitHub as source of truth; see `docs/progress.md` for the current writer and verified state.
- Implemented stack: Astro, TypeScript, Tailwind CSS, GSAP selectively, Cloudflare Workers Static Assets, D1 for enquiry leads.
- Business facts, contact details, testimonials, event photos, service coverage and legal claims require approval before publication.

## For coding agents

Read [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md), and [docs/engineering-tooling.md](docs/engineering-tooling.md) before changing source. Avoid installing unreviewed tools, runtime hooks or services. Follow the minimal, cloud-first workflow.

## Project commands (run by agents/CI — the owner never needs to)

| Command | Purpose |
| --- | --- |
| `npm ci` | Install exact locked dependencies |
| `npm run dev` | Local dev server |
| `npm run check` | Astro + strict TypeScript diagnostics |
| `npm test` | Unit tests (Vitest) — enquiry logic, SEO helpers |
| `npm run build` | Static production build to `dist/` |
| `npm run test:e2e` | Playwright on the built site, desktop + mobile, incl. axe WCAG 2.2 AA |
| `PLAYWRIGHT_BASE_URL=<url> npm run test:e2e` | Same suite against a deployed Cloudflare URL (also checks live HTTP headers) |
| `npm run test:runtime` | Same e2e suite on the local Cloudflare Workers runtime (`wrangler dev`) |
| `npm run format:check` | Prettier |
| `npm run verify` | All of the above in order |

In Claude Code Cloud, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` for e2e tests; CI installs its own browser.

## Structure

- `src/pages/` — homepage, guided `plan-your-event`, 404, and approval-only `services/[slug]` and `stories/[slug]` templates
- `src/components/planner/`, `src/scripts/planner.ts` — planner UI and client controller
- `src/layouts/BaseLayout.astro` — metadata, canonical, robots, skip link, preview notice
- `src/components/` — header with accessible mobile menu, footer, wordmark, arch photo frame placeholder
- `src/lib/enquiry/` — typed 5-stage question tree, branching, server-grade validation, privacy-safe local draft
- `src/lib/site/config.ts` — verified public facts only
- `wrangler.jsonc` — Workers Static Assets + `/api/*` Worker; isolated `staging` env with its own D1
- `src/worker/` — `POST /api/enquiry` (off in production; see docs/enquiry-api.md); `migrations/` — D1 schema
- `src/lib/site/seo-files.ts` — generates `_headers` (security + noindex) and `robots.txt` at build time from `PUBLIC_ALLOW_INDEXING`
- `src/lib/services/publication.ts` and `src/lib/stories/publication.ts` — fail-closed factual approval, consent-paired media and conditional homepage discovery; only individually approved records create public pages (catering is currently approved)

## Next milestone

Complete remaining operator, service/media and staging acceptance work from [docs/progress.md](docs/progress.md), reusing existing owner decisions. The privacy contact, notification destination and 90-day unsuccessful eligibility clock are already recorded. Booked-client/pending-delivery procedures, email send/receipt acceptance and production Turnstile remain live-operation prerequisites. Public display, production domain attachment, indexing and real intake remain separate owner gates.
