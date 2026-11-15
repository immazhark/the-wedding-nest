# Project progress — updated 15 November 2026 (M0)

## Verified in GitHub
- Private repository immazhark/the-wedding-nest exists and uses main.
- Initial README commit b99839ba845882c1b1f8721ab453a85675ef400a completed.
- **PR #1 merged**: Claude Code and Codex tooling foundation, squash commit acc17ca9cf335e00a8a6869bf3a8b080d9faccd5.
- Project instructions, .claude/settings.json, 3 Claude project skills and corresponding Codex skills have been committed.
- Complete business/UX/architecture/SEO handover and cloud kickoff prompt are being added in the current docs PR.
- Domain/DNSSEC/edge certificate activation supported by earlier owner screenshots; some TLS toggles subsequently owner-confirmed.

## Configured, not verified in a Claude Code Cloud runtime
- Superpowers and Impeccable external plugins in .claude/settings.json (declarations alone do not prove installation).
- Whether each cloud session discovers all three project skills, and any marketplace/trust prompts.

## M0 — implemented on branch `claude/serene-maxwell-ywyjat` (PR pending review)
- Astro 7 + strict TypeScript + Tailwind 4 static site with real `package-lock.json`.
- Base layout (metadata, canonical, robots noindex, skip link, visible design-preview notice), accessible header with mobile menu, footer.
- Design-preview homepage (proposed editorial direction, honest "photograph to come" frames), Plan Your Event information page (no form), 404.
- Typed 5-stage enquiry question tree, branching, server-grade validation and privacy-safe draft — unit tested.
- Vitest unit tests, Playwright e2e (desktop + mobile) incl. axe WCAG 2.2 AA, link, CSP-console, overflow and nav tests.
- GitHub Actions CI workflow (format, check, unit, build, e2e). Its first run on GitHub is the evidence; local cloud runs pass.
- `wrangler.jsonc` + `public/_headers`; deployment blocked on one owner action (docs/deployment.md).

## M2 (part 1) — interactive Plan Your Event planner, same branch/PR
- `/plan-your-event/` is now a working 5-stage planner + review step: native checkbox/radio tiles, occasion-based service branching, optional style/budget, editable guest count, explicit consent, separate optional marketing consent.
- **Sends nothing**: no backend yet; the review step says so plainly. Name/phone/notes live only in the open page; the localStorage draft holds non-sensitive choices only (7-day expiry, "Start again" clears it).
- Tests: unit (stage messages, summary) + Playwright planner flows on desktop and mobile (branching, validation, keyboard, reload/draft privacy, no non-GET requests, axe per stage).
- Screenshots: `docs/review/m2/`.
- Next: owner review of planner copy/options; then Worker `POST /api/enquiry` + D1 + Turnstile in a staging environment (separate PR, using `validateEnquiry` server-side).

## Verified tooling in the first Claude Code Cloud session (15 Nov 2026)
- Superpowers: **loaded** (session-start hook ran; `superpowers:*` skills listed and used).
- Impeccable: **not loaded**. Its marketplace is not registered in this container and github.com/pbakaus is blocked by the session's outbound proxy (403). Needs install via the Claude Code plugin manager or an environment allowing that host.
- Project skills `twn-design-review`, `twn-enquiry-security`, `twn-release-review`: **discovered** and listed by the cloud session.
- Cloudflare API and Cloudflare MCP: unreachable from the container (proxy 403); no deployment possible from the agent.

## Not yet implemented or verified
- Cloudflare Workers preview deployment (needs owner dashboard action) and its URL.
- Authentic, owner-approved visual portfolio content.
- Guided enquiry UI, secure Worker API, Turnstile, D1 and actual lead notification delivery.
- Public production website, Search Console setup or real visitor performance metrics.

## Next engineering action
1. Start a single-repository Claude Code Cloud session for this repo.
2. Read CLAUDE.md, docs/full-project-handover.md and docs/claude-code-kickoff-v5.md.
3. Verify tools/skills as possible without blocking work, scaffold Astro/TypeScript/Tailwind on a feature branch, install dependencies, run checks and submit PR.
4. Establish CI/Cloudflare previews; iterate on bespoke photography-ready design and typed enquiry canvas. Do not attach production domain before owner approval.
5. Record verified outcome and links here after each meaningful merge.
