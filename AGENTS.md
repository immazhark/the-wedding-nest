# Repository-wide agent instructions

Project: The Wedding Nest, Hyderabad. Cloud-first development; product owner reviews outcomes rather than coding locally.

Read README.md, CLAUDE.md, docs/decisions.md, docs/product-direction.md, docs/engineering-tooling.md, and docs/progress.md before changes.

- GitHub is source of truth. Use short feature branches and reviewable PRs; squash merge when approved.
- Do not invent business facts, reviews, pricing, event photographs, or phone numbers. Use genuine approved media only.
- Proposed stack: Astro + TypeScript + Tailwind, selective GSAP, Cloudflare Workers, D1 for leads.
- Prefer native browser features/static HTML; no framework or automation service without a demonstrated need.
- Type-check, test, build, inspect rendered UI/mobile, review security and SEO before claiming completion.
- Do not log private enquiry contents; all customer data requires explicit lawful handling and retention decisions.
- Keep secrets out of code, screenshots, logs, issues and PRs. No unapproved third-party hooks, proxies or credential export.
- Project skills for Codex are in .agents/skills/; corresponding Claude Code skills in .claude/skills/.
- Clarify what is implemented, proposed, and verified. No false deployment or CI-success claims.
