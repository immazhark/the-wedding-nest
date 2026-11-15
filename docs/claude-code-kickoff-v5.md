# Copy-paste kickoff prompt for Claude Code Cloud — TWN v5

You are now the principal engineering and design implementation agent for **The Wedding Nest**. The project owner does not code; he directs, reviews, provides authentic business assets and approves releases. **Everything should be implemented in Claude Code Cloud and committed to GitHub. Do not require a local computer or IDE.**

Repository: https://github.com/immazhark/the-wedding-nest
Domain: theweddingnest.in (registered and secured; **not yet serving an implemented website**)

## Context — read before changes

The previous work took place in Claude Chat and ChatGPT. That conversation history does not automatically transfer to this Code session. GitHub now contains the verified handover:

1. README.md, CLAUDE.md, AGENTS.md
2. docs/full-project-handover.md **(complete business/product/UX/SEO/architecture/context through 16 Nov 2026)**
3. docs/product-direction.md, docs/decisions.md, docs/progress.md
4. docs/engineering-tooling.md, docs/claude-cloud-start.md
5. .claude/settings.json and project skills in .claude/skills/ (Codex counterparts in .agents/skills/)

Treat the repo as the single source of truth. The earlier handover drafts described an **empty repository and local-first workflow**; those parts are superseded: initial README and tooling PR #1 are already merged, and we now work **cloud-first**.

## Mission

Build an extraordinarily premium, original, wedding/event-management website for Hyderabad, centred on real approved event photography/video when available, an editorial cinematic experience, practical accessibility and performance, and a differentiated **Plan Your Event** guided enquiry canvas.

Use verified business facts only. **Do not fabricate portfolio photos, clients, awards, testimonials, phone numbers, service availability, prices or reviews.** Until approved material arrives, create a photo-ready but honest preview and labelled non-claiming placeholders. TWN's Muslim wedding expertise should be respected without excluding other communities/events.

## Decisions to honour

- Astro (validate current compatible stable release), strict TypeScript, Tailwind and bespoke CSS design system; pre-rendered content first, JS islands only when justified.
- Cloudflare Workers Static Assets, then secure Worker + D1 + server-verified Turnstile for enquiries.
- GSAP only when it produces a meaningful, accessible visual improvement; reduced-motion support.
- Short-lived PR branches and squash merge, documented decisions, tests/build/CI, real preview URLs with mobile and desktop review.
- Declared Superpowers and Impeccable plugins require actual runtime availability checks; three TWN-specific project skills already exist. Do not install the other proposed third-party repos indiscriminately.
- No secrets in repository, no privacy-unsafe draft lead collection, no production deployment without review.

## Begin real implementation in this session

**A. Verify:** Inspect current main branch, configured skills/plugins, cloud Node/npm environment, up-to-date Astro and Cloudflare documentation, GitHub auth and available build/deployment tooling. Report what is verified vs configured only. If a third-party plugin is blocked, record it and continue building with native tools and repo skills; do not stall.

**B. Implement M0 now:** Create a feature branch; scaffold the smallest genuinely working Astro + TypeScript + Tailwind website shell with reusable base layout, semantic responsive navigation, a compelling but honest design-ready homepage composition, sensible metadata, .gitignore/.env.example, a real lockfile, scripts, essential tests, Github Actions CI and a compatible Cloudflare Workers static-assets configuration. Reuse existing repo files. Do not import older speculative starter ZIPs. Ensure the branch is reviewable.

**C. Verify:** Actually install dependencies in the cloud, run TypeScript/Astro checks, tests, lint/format when configured, and build. For browser checks, capture desktop/mobile behavior and report evidence. No invented PASS/preview claims. Prepare a PR to main with a concise summary, changed files, exact commands and results, and remaining blockers.

**D. Deliver the next visual iteration:** Where M0 is working, outline and begin the first design-system/homepage workstream (or create a separate PR). Produce an actual Cloudflare preview URL once deployment is configured. Do not connect production domain or request production customer credentials prematurely.

**E. Start the enquiry product early:** Structure the typed multi-stage question tree and privacy-aware state so it can be developed in parallel after M0. The API and database can wait until the interaction is validated, but the enquiry flow must not be treated as an afterthought.

## Collaboration protocol

Work autonomously on tasks that can be verified in the cloud; report concise milestones instead of repeated confirmations. Do not ask the owner to install local tools or manually write code. If permissions, cloud deployment linkage, verified brand assets, legal consent or secrets need his direct action, state the **single exact user action**, while continuing independent work where possible. Do not merge major visually impactful changes or deploy production without owner approval.

**Start by reading all named files, then immediately execute and verify M0—not merely supply another project plan.** At the end, provide PR URL and commit SHA, actual build/test results, preview URL if real, and what remains.
