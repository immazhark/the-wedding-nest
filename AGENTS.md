# Repository-wide agent instructions

Project: The Wedding Nest, Hyderabad. Cloud-first development; product owner reviews outcomes rather than coding locally.

## Permanent instructions — every session, every agent

Before any development, read and follow [the complete Master Design & Engineering Directive](docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md) (sections 1–19), [the binding site rulebook](docs/directives/ELITE-SITE-DIRECTIVE-WEDDING-NEST.md), and [the reconciliation and execution prompt](docs/directives/EXECUTION.md). These apply to ChatGPT Work, Codex, Claude Code and future agents. Preserve both directives; material amendments require documented owner authorization.

Then read [DESIGN.md](DESIGN.md), [the living requirement matrix](docs/qa/DESIGN-IMPLEMENTATION.md), `docs/progress.md` and `docs/HANDOFF.md`. Synchronize safely with authorized main, preserve local/concurrent work, use one branch/PR per phase, and resume the last evidenced milestone. Unavailable measurements never become a PASS or permission to bypass a gate. Follow the narrower current owner scope and existing release/creative approval gates.

Read README.md, CLAUDE.md, docs/decisions.md, docs/product-direction.md, docs/engineering-tooling.md, and docs/progress.md before changes.

- GitHub is source of truth. Use short feature branches and reviewable PRs; squash merge when approved.
- Do not invent business facts, reviews, pricing, event photographs, or phone numbers. Use genuine approved media only.
- Implemented stack (see CLAUDE.md; no migration implied): Astro + TypeScript + Tailwind, selective GSAP, Cloudflare Workers, D1 for leads.
- Prefer native browser features/static HTML; no framework or automation service without a demonstrated need.
- Type-check, test, build, inspect rendered UI/mobile, review security and SEO before claiming completion.
- Do not log private enquiry contents; all customer data requires explicit lawful handling and retention decisions.
- Keep secrets out of code, screenshots, logs, issues and PRs. No unapproved third-party hooks, proxies or credential export.
- Project skills for Codex are in .agents/skills/; corresponding Claude Code skills in .claude/skills/.
- Clarify what is implemented, proposed, and verified. No false deployment or CI-success claims.
