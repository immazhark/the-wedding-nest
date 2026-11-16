# The Wedding Nest

Premium wedding and event experiences in Hyderabad, India.

**Status:** Astro 7 + TypeScript + Tailwind 4 editorial site and five-step planner on a Cloudflare Workers design preview. Public enquiries are **disabled** and search indexing is off. An isolated staging Worker accepts fictional test submissions with Turnstile and a separate D1 database. No custom production domain is attached. Current state: [docs/progress.md](docs/progress.md), [docs/deployment.md](docs/deployment.md).

- Domain: https://theweddingnest.in (registered; production site not yet deployed)
- Product owner workflow: Claude Code Cloud for implementation, GitHub for source control, ChatGPT/Codex for independent review.
- Proposed stack (to validate during initial scaffold): Astro, TypeScript, Tailwind CSS, GSAP selectively, Cloudflare Workers Static Assets, D1 for enquiry leads.
- Business facts, contact details, testimonials, event photos, service coverage and legal claims require approval before publication.

## For coding agents

Read [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md), and [docs/engineering-tooling.md](docs/engineering-tooling.md) after the tooling PR lands. Avoid installing unreviewed tools, runtime hooks or services. Follow the minimal, cloud-first workflow.

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

- `src/pages/` — homepage, guided `plan-your-event`, and 404; contextual occasion/service links begin a safe preselected plan
- `src/components/planner/`, `src/scripts/planner.ts` — planner UI and client controller
- `src/layouts/BaseLayout.astro` — metadata, canonical, robots, skip link, preview notice
- `src/components/` — header with accessible mobile menu, footer, wordmark, arch photo frame placeholder
- `src/lib/enquiry/` — typed 5-stage question tree, branching, server-grade validation, privacy-safe local draft
- `src/lib/site/config.ts` — verified public facts only
- `wrangler.jsonc` — Workers Static Assets + `/api/*` Worker; isolated `staging` env with its own D1
- `src/worker/` — `POST /api/enquiry` (off in production; see docs/enquiry-api.md); `migrations/` — D1 schema
- `src/lib/site/seo-files.ts` — generates `_headers` (security + noindex) and `robots.txt` at build time from `PUBLIC_ALLOW_INDEXING`

## Next milestone

Review the current responsive preview, then add only original owner-approved event photographs, approved testimonials, verified contact/service coverage and a legally reviewed privacy contact. Lead notifications, retention policy and production Turnstile require explicit business decisions before enabling real enquiries. Production domain attachment and indexing remain separate owner approval gates.
