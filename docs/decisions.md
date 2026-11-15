# Architecture decision log

- 2026-11-15: Project source: private GitHub repository immazhark/the-wedding-nest.
- 2026-11-15: Development workflow: browser/Claude Code Cloud first, with ChatGPT Work and Codex as complementary review/implementation tools. Local Windows development is optional, not required.
- 2026-11-15: Domain theweddingnest.in; registration at Spaceship, Cloudflare DNS, active DNSSEC, managed SSL/TLS certificate. Website not yet deployed.
- 2026-11-15: Preferred stack for validation at scaffold: Astro, TypeScript, Tailwind CSS, GSAP only for animation needing it, Cloudflare Workers Static Assets.
- 2026-11-15: Future enquiry: progressive visual questionnaire, typed branching states, server-side validation and Turnstile, D1 durable store; transactional/outbox notifications to be implemented only when needed.
- 2026-11-15: Adopt repository-declared Superpowers and Impeccable plugins for single-repo Claude Code Cloud, subject to first-session verification/trust. Bespoke repo skills apply in Claude and Codex. Avoid full ECC/gstack/BMAD/automated proxies until justified.
- 2026-11-15: No HSTS or other irreversible transport change without verifying live site. Production deployment is gated by user review and verified SSL/redirect behavior.
