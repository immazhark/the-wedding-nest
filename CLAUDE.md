# The Wedding Nest — Claude Code project instructions

This is a real premium wedding and event services business in Hyderabad, India. The product owner directs and reviews work without writing code. **Claude Code Cloud is the default engineering environment.** GitHub is the source of truth. Do not require local laptop tooling.

## Before work
- Every session, every contributing agent must read and follow `docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md` in full (sections 1–19), `docs/directives/ELITE-SITE-DIRECTIVE-WEDDING-NEST.md`, and their reconciliation in `docs/directives/EXECUTION.md`. Read `DESIGN.md`, the living `docs/qa/DESIGN-IMPLEMENTATION.md`, and `docs/HANDOFF.md` before implementation. Preserve directives; material amendments require recorded owner authorization. Continue from actual verified progress, not a historical summary. Stricter budgets, truth rules, branch isolation and current phase/production/creative gates remain binding.
- Read AGENTS.md and docs/progress.md, then only the docs relevant to the task (e.g. docs/decisions.md for architecture, docs/product-direction.md for design/copy, docs/deployment.md for Cloudflare). Read docs/full-project-handover.md only for onboarding or a business/product question it answers; never re-read it by default.
- For any design, motion or copy work, follow docs/creative-excellence-standards.md (and docs/photography-brief.md for media). For reviews, proof, customer quotes and video testimonials, follow docs/customer-testimonials.md.
- Ground claims in files or current external evidence; do not invent business services, rates, testimonials, portfolio imagery, awards or contact information.
- First inspect repository state. If application code does not exist yet, establish a lean, tested scaffold; do not pretend it is built or deployed.
- Prefer existing code and smallest sufficient dependencies. Preserve accessibility, security, SEO, performance and an editorial visual identity.

## Architecture (implemented stack is authoritative; earlier proposals authorise no migration; validate against current docs)
Astro + TypeScript + Tailwind CSS, static-first; progressive islands only where necessary; GSAP selectively for deliberate motion; Cloudflare Workers Static Assets; verified server-side Worker enquiry endpoint and D1 when the form is ready. Avoid a CMS, job queue or automation platform until justified.

## Workflow
- Small scoped branches/PRs and squash merging; do not modify other agents' branches. Keep PR changes reviewable.
- **Standing owner authorisation (15 Nov 2026):** Claude may make production-grade engineering decisions and squash-merge its own PRs into `main` once GitHub CI `verify` passes and there are no conflicts or unresolved review comments. Report each merge. Still owner-gated: attaching the production domain, enabling search indexing, switching on live enquiry submission, and publishing business facts, media or claims.
- For behavior changes, write failing tests before implementation, then run focused and full checks. No false PASS claims; report exact commands and outcomes.
- Give the owner a working **Cloudflare preview URL**, plus mobile/desktop screenshots or explicit blockers, for every meaningful visual deliverable.
- Never publish unapproved customer/event photos, personal information, real-looking synthetic portfolio imagery or unverified marketing claims.
- Never commit credentials or customer lead data. Do not grant broad external plugin access to production secrets.
- Verify executable third-party plugins before enabling hooks. Use only verified project plugins, and inspect actual availability in each cloud environment.

## Efficiency (Claude Pro usage)
- Read specific files/sections, not the whole repo; use compact command output and relevant error excerpts only.
- Plan multi-file changes briefly before editing; make the smallest change that meets the need; no new dependencies, agents or automation without demonstrated need.
- Run focused tests while iterating and the full `npm run verify` once before proposing a merge; don't re-run unchanged expensive checks.
- Report per task: changes, commit SHA/PR, commands and outcomes, preview URL, blockers/next action. No long narration or code dumps.
- Update docs/progress.md (and docs/decisions.md if a decision was made) after meaningful work so a fresh session can resume; start a fresh session for unrelated follow-on work.
- Token-saving tools (rtk etc.) are trial-only, without global hooks/proxies, and are kept only if they don't hide diagnostics (see docs/engineering-tooling.md).

## Verified commands and paths
- Canonical task state: `docs/progress.md` (update at meaningful boundaries; keep branch, decisions, last checks, holds and next action current). Repo remote: `immazhark/the-wedding-nest`.
- Focused while iterating: `npm test` (Vitest), `npm run check` (astro check), `npm run format:check`. Full gate once before merge: `npm run verify` (adds build, `build:submit`, Playwright e2e, workerd runtime e2e).

## Operating rules
- Default to one implementation writer; delegate only a bounded independent question. One specialist skill per concrete gap; native tools are a valid choice.
- Resume the last verified action; search the named symbol/route/diff/failing test first and re-read only on change, lost detail or concurrency. After two identical failures, change the hypothesis or name the missing prerequisite.
- Keep model/effort stable within a task; Sonnet at medium effort for routine work, higher effort or Opus for hard diagnosis. No paid overage, alternative API billing or model fallback without owner approval.
- Compact at a useful boundary in the same task; start a fresh session for unrelated work. Personal settings stay in ignored `.claude/settings.local.json`.

## Tooling
Shared project plugin declarations are in .claude/settings.json; they are **not proof of runtime installation**. See docs/engineering-tooling.md for cloud restrictions, license/security reviews, approved phases, and verification. Project skills are in .claude/skills/ (Claude) and .agents/skills/ (Codex).

Owner's decisions supersede earlier handover drafts when they conflict with the repo.
