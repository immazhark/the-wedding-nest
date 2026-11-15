# The Wedding Nest

Premium wedding and event experiences in Hyderabad, India.

**Status:** Initial repository onboarding. The website has not yet been implemented or deployed.

- Domain: https://theweddingnest.in (registered; production site not yet deployed)
- Product owner workflow: Claude Code Cloud for implementation, GitHub for source control, ChatGPT/Codex for independent review.
- Proposed stack (to validate during initial scaffold): Astro, TypeScript, Tailwind CSS, GSAP selectively, Cloudflare Workers Static Assets, D1 for enquiry leads.
- Business facts, contact details, testimonials, event photos, service coverage and legal claims require approval before publication.

## For coding agents

Read [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md), and [docs/engineering-tooling.md](docs/engineering-tooling.md) after the tooling PR lands. Avoid installing unreviewed tools, runtime hooks or services. Follow the minimal, cloud-first workflow.

## Next milestone

Create a lean Astro foundation with a real lockfile, repeatable build/test commands, CI, and Cloudflare preview deployment. Build the visual system and guided enquiry product on reviewed short-lived branches; no production deployment without verification.
