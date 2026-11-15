# Engineering and AI tooling — approved integration policy

**Scope:** TWN cloud-first project. This file is a truthful inventory and install plan, not proof of runtime activation.

## Enabled declarations in this repository
- Superpowers `superpowers@claude-plugins-official`: enabled in `.claude/settings.json` from Anthropic's official marketplace; [upstream](https://github.com/obra/superpowers), MIT.
- Impeccable `impeccable@impeccable`: enabled in `.claude/settings.json`; marketplace source `pbakaus/impeccable`, auto-update off pending review; [upstream](https://github.com/pbakaus/impeccable), Apache-2.0. Its published marketplace manifest identifies the plugin and marketplace as `impeccable`.
- Local TWN-specific skills: twn-design-review, twn-enquiry-security, twn-release-review. Available in both `.claude/skills` and `.agents/skills` with identical content; authored for this project, no executable code, hooks or external dependencies.

**Verification status (first Cloud session, 15 Nov 2026):** Superpowers loaded and callable. Impeccable **not** loaded: marketplace not registered, and github.com/pbakaus blocked by the session proxy (HTTP 403). The three `twn-*` project skills were discovered. Note: some synced user-level plugins in this environment run PreToolUse hooks (e.g. one blocks any shell command mentioning `.env`); these are not project-declared.

## Cloud compatibility nuances
- Use **one-repository Claude Code Cloud sessions**, outside multi-repository project threads, to maximize applicability of the shared `.claude/settings.json`.
- Anthropic's cloud settings support varies by session type. Project threads can ignore hooks/permission rules/env, and some multi-repo sessions cannot load declared marketplaces/plugins. Project skills and CLAUDE.md come from cloned files, but test discovery rather than assuming.
- If project plugin auto-loading fails, install the two plugins from the interactive Claude Code plugin manager, using their documented upstream publishers, then verify actual skill commands. Do not silently switch to privileged/untrusted scripts.
- Codex will read AGENTS.md and project skills under `.agents/skills`; Claude's external plugins are **not** magically installed in Codex or normal ChatGPT Chat.

## Approved adoption roadmap
| Milestone | Tool | Decision and caveat |
| --- | --- | --- |
| Tooling bootstrap | Superpowers | Primary development method; configured, verify in cloud |
| First designed page | Impeccable | Primary visual-quality skill; configured, verify in cloud |
| Initial Astro scaffold | TypeScript + Tailwind + Astro | Install runtime deps with actual lockfile |
| Animation implementation | GSAP | Install as actual app dependency only if used; review standard license |
| Early engineering | Addy Osmani agent-skills / Matt Pocock skills | Read/review and install only nonoverlapping targeted skills; not entire frameworks |
| First security-sensitive API | Cloudflare security-audit-skill; Trivy | Add on proven need, pin versions, limit CI permissions, use staging/test data |
| Broader codebase | Graphify | Optional Python CLI architecture analysis; no benefit on empty repository |
| Conversion copy and SEO | Corey Haines Marketing Skills; OpenSEO | Select targeted skills; OpenSEO data-provider/subscription costs are separate |
| Additional art-direction alternatives | Taste Skill / Hallmark | A/B compare with Impeccable, don't stack overlapping default directives |
| Lead operations later | n8n | Only if workflow complexity justifies infrastructure and licensing |
| Authentic media production later | Remotion | Separate tool/workspace; review commercial licensing and rights to footage |

## Defer or exclude for now
- Full ECC, gstack, BMAD, GSD and large agent stacks: overlapping governance and hooks.
- RTK, Caveman, Headroom, FreeLLMAPI and model routers/proxies: can change output/telemetry/credential routing; benchmark in isolation before considering.
- Claude-Mem and Trail-Code persistent memory: GitHub docs/PRs are sufficient at this size; assess privacy/telemetry and persistence if needed.
- Strix/Pentagi autonomous security testing: only on expressly authorised isolated staging with explicit scope; never configure with real leads or broad prod credentials.
- OpenMontage/AI-video suites, GPU models, voice cloning, avatar systems: do not bundle into public website; use separate approved media workflows if genuine business demand.
- Magic MCP is now 21st MCP: no default paid key/subscription.
- Archived GSD repo and any unclear/licence-unverified repos: do not install by default.

## Before installing a new dependency, plugin, hook or agent
1. Verify exact owner, tag/commit, maintenance, legal license and permissions from upstream.
2. Inspect manifest, startup scripts, network behavior, model/telemetry routing, credential access; run a reputable skill scanner when available.
3. Prefer an isolated cloud test with no production tokens, leads or customer assets.
4. Pin release/version, record rationale/rollback, and test in a fresh session.
5. Never paste credentials into repo content; use secret stores with least privilege.

References:
- Anthropic cloud settings: https://code.claude.com/docs/en/settings
- Claude Superpowers: https://github.com/obra/superpowers
- Impeccable install: https://impeccable.style/docs/
- OpenAI Codex skills: https://developers.openai.com/api/reference/cli
