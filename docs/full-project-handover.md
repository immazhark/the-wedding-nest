# The Wedding Nest — Complete Project Handover (Cloud-First, v5)

**Updated 16 November 2026.** This document consolidates the earlier Claude Chat / ChatGPT planning into GitHub for Claude Code Cloud and Codex. **This is a requirements brief, not proof that the site is implemented.** Where it conflicts with the live repository or verified infrastructure, inspect evidence and update the decision log.

## 1. Business, ownership and audience

- Brand: **The Wedding Nest** (TWN). Original domain twn.events is not owned/controlled; do not use it for production.
- Actual business owner: **Mohammed Ather Khan**. Technical administrator/product representative: his brother, using GitHub account **immazhark**. The product representative does **not code locally**; he guides, reviews, critiques, supplies assets and approves releases through browser-based AI workflows.
- Primary market: **Hyderabad, Telangana, India**. Existing identity associated with Zeba Bagh / Murad Nagar, but **do not publish an exact address** without business confirmation.
- Instagram: https://www.instagram.com/twn.events/
- Google Business profile/maps listing exists. Earlier reference: https://www.google.com/maps/place/The+Wedding+Nest/@17.3898158,78.4490999,106m/data=!3m1!1e3!4m6!3m5!1s0x3bcb9722d0819949:0xfffaa57907d4043d!8m2!3d17.390032!4d78.4492282!16s%2Fg%2F11y9zgk97t?entry=ttu
- Justdial: https://www.justdial.com/Hyderabad/The-Wedding-Nest-Zeba-Bagh/040PXX40-XX40-241224211015-X9Y1_BZDET (verify current public details).
- Business position: premium in creativity, aesthetics, thoughtfulness, trust and service; **not exclusively high-budget or luxury-only clients**.
- Special strength/intended focus: Hyderabad wedding traditions, including Nikah, Walima/Valima, Mehndi and Shaadi, while serving **all communities**, diverse celebrations and customers with different budgets. Respect cultural/religious needs; never assume practices or publish unverified halal, Qazi, privacy or legal certifications.

### Intended business offering — confirmation required before public claims

Customers may request full end-to-end event planning or individual services. Potential services include wedding planning, catering and custom menus, guest hospitality, floral/stage/venue décor, photography and cinematography, venue coordination, makeup and beauty, Mehndi artist, wedding cars/transport, trousseau packaging, gifts/favours, invitations and bespoke arrangements. Occasions include weddings, engagements, receptions, birthdays, anniversaries, corporate and private events. Availability, prices, vendor partners, service coverage, capacity and exact guarantees must be owner-approved.

Main users include families and couples, Muslim wedding specialists, single-service buyers (catering/décor/film etc.), value-conscious customers, NRI/remote planners and corporate/private hosts.

### Business outcomes

1. Exceptional, distinct, authentic photo-led website and intuitive mobile experience.
2. Visitors quickly find full-planning **or** à-la-carte help.
3. Guided event-enquiry experience and verified phone/WhatsApp alternative.
4. Genuine case studies, local SEO and trust signals.
5. Reliable, secure, consented qualified leads and human follow-up.
6. Sustainable low-cost infrastructure, not an expensive SaaS dependency stack.

## 2. Current verified infrastructure and code status

- Private GitHub repository: https://github.com/immazhark/the-wedding-nest; default branch main, squash merges. First README commit b99839ba845882c1b1f8721ab453a85675ef400a.
- PR #1, cloud tooling integration, **merged** with squash commit acc17ca9cf335e00a8a6869bf3a8b080d9faccd5 on 15 November 2026. It added root CLAUDE.md, AGENTS.md, three native project skills for Claude/Codex, docs and Claude plugin declarations.
- Repo currently has **instructions/configuration but no Astro application, package-lock.json, verified build, deployed Cloudflare Worker, lead database or live website**, at handover. Inspect GitHub at start as this may change.
- Domain: **theweddingnest.in**, purchased at Spaceship for 3 years. Cloudflare Free authoritative DNS, nameservers abdullah.ns.cloudflare.com and isla.ns.cloudflare.com; DNSSEC confirmed active in screenshots; Cloudflare Universal SSL active.
- Owner confirmed Always Use HTTPS, minimum TLS 1.2, TLS 1.3, Automatic HTTPS Rewrites, Certificate Transparency monitoring. HSTS intentionally off. These settings were user-confirmed after screenshots; do not assert live status without checking.
- Cloudflare had no web-origin DNS records and no deployed application at last check. **An active Cloudflare zone or edge certificate does not mean the website is live.**
- No production secrets or real enquiry/customer information may be committed or pasted into project instructions.

## 3. Technical direction

**Validate current versions and exact APIs against official docs before scaffolding.**

- Astro (current stable compatible release) + strict TypeScript + Tailwind CSS + bespoke tokens/CSS.
- Pre-rendered semantic pages by default; minimal JavaScript; accessible interactive islands only for components needing state.
- Cloudflare Workers Static Assets for hosting, with GitHub-connected preview builds.
- For enquiries: later Worker API (POST /api/enquiry), Cloudflare D1 durable lead storage, Turnstile verified server-side, schema validation, idempotency, transaction/outbox event, safe notifications and retries.
- Motion: CSS/native primitives first; **GSAP** only for intentional cinematic sequencing/scroll storytelling when justified. No autoplay audio, heavy WebGL by default, forced scroll hijack or motion that blocks the content.
- Media: authentic approved originals, responsive formats, rights/consent recorded. Use non-claiming temporary placeholders if assets unavailable; **never fabricate real event portfolio photography**.
- Git-based Astro content collections initially; CMS and CRM deferred until the workflow clearly needs them. No Next.js/Next Forge swap, monorepo, ORM or hosted queue merely because it is popular.
- Deployment: Cloudflare Worker preview / protected staging; custom domain and indexing only after approved content and technical verification. Noindex alone does not protect staging from access.

## 4. Visual identity and UX

North star: **extraordinary bespoke wedding / event editorial site**, equal in craft to a leading design studio, fast on real Hyderabad mobile networks. Reject generic gradient/glass/card templates and repetitive AI-design conventions.

Proposed—not final/approved—art direction: Hyderabad heritage × international editorial refinement; warm ivory/stone, ink/charcoal, restrained antique brass, striking serif paired with functional sans, asymmetric authentic imagery, elegant whitespace, contemporary layout and fine typography. Do not confuse proposal with official brand identity.

Visual requirements:
- Photography/film-led high-impact home hero, but no fake work; suitable media-neutral composition until originals exist.
- Meaningful transitions, expressive yet restrained motion; preserve legibility and interaction for reduced-motion users.
- Custom mobile nav, keyboard/focus visibility, pointer/touch affordances, fluid type and reliable 360px–desktop layouts.
- Respect WCAG 2.2 AA target, semantic HTML, captions/alt text, real responsive-image dimensions and mobile performance.
- Performance targets where measured: LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75; these are **targets not current measurements**.
- Real browser screenshots and independent design critique required. A passing build does not mean a design is approved.

Proposed information architecture to validate from available content: Home, Weddings, Nikah & Walima, Services, individual proven services, Celebrations, Our Work, About, Plan Your Event, Contact, Privacy. Do not generate dozens of thin SEO pages.

## 5. Signature feature: Plan Your Event enquiry canvas

**This is a core early product, not a generic long form or delayed plugin.** Build a visual 5-stage journey with a typed question definition, branching and accessible nonvisual controls:

1. **Occasion** — Nikah, Walima, Mehndi, Shaadi/wedding, engagement, reception, Sangeet, birthday/anniversary, corporate, private, other; allow related occasions.
2. **Scope** — end-to-end planning or specific services; conditionally ask event-specific needs: guest hospitality, catering, ceremony coordination, decor, AV, etc. Showing an option does not promise availability.
3. **Style** — editorial mood direction and catering interest where relevant, using *licensed* illustrative material only; clearly conceptual, not claimed delivered work.
4. **Logistics** — date or undecided, guest count editable without slider, venue/location, optional budget and 'discuss with us', special notes.
5. **Contact and review** — name, phone/WhatsApp, preferred contact channel, plain-language privacy statement and explicit consent. Display a clear summary and accessible submit/retry states.

Duration target 2–3 min is a design hypothesis, not an SLA. Save non-sensitive local selections only if useful, with expiry/reset, and **do not silently send or persist abandoned name/phone/email**.

Server must validate every field independently of frontend TypeScript. Turnstile Siteverify on server, abuse/rate protections, max payload sizes, safe logs, idempotent retries, D1 durable lead insert + outbox transaction. A success response means DB accepted the enquiry, not that email/WhatsApp already delivered. Respect privacy retention, least privilege and separate marketing consent. Don't launch fake-working submit CTA.

An earlier draft exists outside the codebase as TWN-enquiry-question-tree-v1.ts; it is **optional design reference**, not tested or production code. Implement final typed schema after validating choices with the owner.

## 6. SEO, search and marketing

Aim for qualified Hyderabad enquiries and bookings, not impossible 'rank #1' promises. Deliver real semantic HTML, crawlable pre-rendered pages, correct canonicals/metadata/OpenGraph, working robots/sitemap, schema.org LocalBusiness/Service only with confirmed business facts, distinct valuable service pages, accessibility, image optimization and Core Web Vitals. Add Google Search Console and Bing Webmaster Tools after production.

Align Google Business, Justdial and Instagram names/addresses/contact only after verification. Publish authentic project stories, permission-cleared film and images, useful locally relevant FAQs. Never invent backlinks, ratings, review counts, case studies, pricing, third-party venues or certificates. Keep previews **non-indexed** and, when needed, access-controlled.

AI discovery: allow search-purpose crawlers as agreed; don't conflate search bots with model-training bots. No 'llms.txt guarantees AI ranking' claims.

Measure meaningful events: service CTA, enquiry starts/completions, WhatsApp clicks, accepted leads and qualified bookings; analytics must respect consent/privacy.

## 7. AI engineering framework decisions already made

- User prefers **Claude Code Cloud via claude.ai/code or Claude Desktop Code > Cloud**, not local terminal. ChatGPT Work / Codex Cloud provide complementary work and independent review.
- GitHub is source of truth. One main, short-lived branches, cohesive PRs, squash merges, no speculative bureaucracy. Do not run agents editing the same files independently.
- Repo root .claude/settings.json **declares** Superpowers (official marketplace) and Impeccable (reviewed upstream marketplace). It does **not** prove they were actually installed; verify in a fresh single-repo Cloud session and handle trust prompts.
- Native project skills: .claude/skills/twn-design-review, twn-enquiry-security and twn-release-review; Codex equivalents in .agents/skills/. Read docs/engineering-tooling.md.
- Prior researched candidates include Addy Osmani's agent-skills, Matt Pocock's skills, Corey Haines's marketing skills, NVIDIA SkillSpector, Cloudflare security-audit-skill, Trivy, Graphify, Taste Skill and GSAP. **Only add tool binaries/skills when needed**; do not install the entire 89-repository list.
- Superpowers for engineering, Impeccable for bespoke design; some tools overlap or need cloud-specific setup, licences, permissions, cost or security review. Do not install full ECC, gstack, BMAD, Strix, paid MCP services, memory daemons, GPU video generators or model-routing proxies as initial prerequisites.
- Security and test discipline: test-first behavior for logic, npm lockfile generated by real install, real Astro check/build, formatting, focused tests, GitHub CI, browser + axe + Lighthouse where relevant, no unsupported 'passed' claims.

## 8. Open business inputs (not blockers for development)

- Official logo and brand approvals; exact colors/type if chosen.
- Contact phone/WhatsApp, public email, approved address/service area and hours.
- Actual service list and sourcing/vendor operations; any religious/food/regulatory claims.
- Original photography/films with permissions and music rights; genuine project stories.
- Verified testimonials and permission to quote.
- Privacy notice text, retention policy, lead inbox owner, email provider and enquiry response procedures.
- Domain release timing and production-indexing approval.

**Proceed with the functioning software foundation, authentic media-neutral preview, and safe enquiry product structure even when these assets are not yet provided. Do not manufacture their contents.**

## 9. Execution milestones

**M0:** Read this and existing repo docs; inspect actual environment and plugin loading; add minimal Astro scaffold with accurate package scripts, generated lockfile, automated tests and CI in a reviewable PR. Run and report real checks. Avoid direct production release.

**M1:** Build a bespoke, responsive photo-ready design system, compelling home shell/navigation, purposeful selective GSAP, live preview + screenshots, owner critiques. The mockup is not an approved brand.

**M2 (early, in parallel after stable M0):** Implement guided typed enquiry UI and accessible conditional branches; test. Then create secure Worker + D1 + Turnstile backend in separate scoped implementation steps and staging environment. Never say leads are being captured until verified end to end.

**M3:** Approved media/copy, portfolio and service pages, SEO metadata/schema/sitemap, Cloudflare preview QA, real mobile tests, domain go-live with owner approval.

## 10. Reporting to the non-coding owner

Keep responses concise: **What was actually done? What is demonstrably working? Which PR and preview URL? What did tests prove? What remains/needs owner input?** Never bury the owner in CI noise; don't skip actual quality gates. No fixed deadline claims or unseen future work.
