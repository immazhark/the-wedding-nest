# The Wedding Nest

Premium wedding and event experiences in Hyderabad, India.

**Status:** M0 foundation in review — Astro 7 + TypeScript + Tailwind 4 site shell, design-preview homepage, typed enquiry domain logic, tests and CI. **Not yet deployed** (see [docs/deployment.md](docs/deployment.md)).

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
| `npm run format:check` | Prettier |
| `npm run verify` | All of the above in order |

In Claude Code Cloud, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` for e2e tests; CI installs its own browser.

## Structure

- `src/pages/` — `index`, `plan-your-event` (no form until the secure backend exists), `404`
- `src/layouts/BaseLayout.astro` — metadata, canonical, robots, skip link, preview notice
- `src/components/` — header with accessible mobile menu, footer, wordmark, arch photo frame placeholder
- `src/lib/enquiry/` — typed 5-stage question tree, branching, server-grade validation, privacy-safe local draft
- `src/lib/site/config.ts` — verified public facts only
- `wrangler.jsonc`, `public/_headers` — Cloudflare Workers Static Assets config and security headers

## Next milestone

M1/M2: owner review of the design direction on a Cloudflare preview; interactive Plan Your Event UI built on `src/lib/enquiry`; then Worker API + D1 + Turnstile in a staging environment.
