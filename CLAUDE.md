# The Wedding Nest — Claude Code project instructions

This is a real premium wedding and event services business in Hyderabad, India. The product owner directs and reviews work without writing code. **Claude Code Cloud is the default engineering environment.** GitHub is the source of truth. Do not require local laptop tooling.

## Before work
- Read README.md, AGENTS.md, docs/decisions.md, docs/product-direction.md, docs/engineering-tooling.md and docs/progress.md.
- Ground claims in files or current external evidence; do not invent business services, rates, testimonials, portfolio imagery, awards or contact information.
- First inspect repository state. If application code does not exist yet, establish a lean, tested scaffold; do not pretend it is built or deployed.
- Prefer existing code and smallest sufficient dependencies. Preserve accessibility, security, SEO, performance and an editorial visual identity.

## Proposed architecture (validate against current docs)
Astro + TypeScript + Tailwind CSS, static-first; progressive islands only where necessary; GSAP selectively for deliberate motion; Cloudflare Workers Static Assets; verified server-side Worker enquiry endpoint and D1 when the form is ready. Avoid a CMS, job queue or automation platform until justified.

## Workflow
- Small scoped branches/PRs and squash merging; do not modify other agents' branches. Keep PR changes reviewable. No production merge of major design changes without owner approval.
- For behavior changes, write failing tests before implementation, then run focused and full checks. No false PASS claims; report exact commands and outcomes.
- Give the owner a working **Cloudflare preview URL**, plus mobile/desktop screenshots or explicit blockers, for every meaningful visual deliverable.
- Never publish unapproved customer/event photos, personal information, real-looking synthetic portfolio imagery or unverified marketing claims.
- Never commit credentials or customer lead data. Do not grant broad external plugin access to production secrets.
- Verify executable third-party plugins before enabling hooks. Use only verified project plugins, and inspect actual availability in each cloud environment.

## Tooling
Shared project plugin declarations are in .claude/settings.json; they are **not proof of runtime installation**. See docs/engineering-tooling.md for cloud restrictions, license/security reviews, approved phases, and verification. Project skills are in .claude/skills/ (Claude) and .agents/skills/ (Codex).

Owner's decisions supersede earlier handover drafts when they conflict with the repo.
