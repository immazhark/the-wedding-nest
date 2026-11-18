# Project progress — reconciled 19 November 2026

Current state first. GitHub and Cloudflare live records remain authoritative for commits, checks and exact deployed versions. This snapshot is not a production-launch approval.

**Repository baseline at this update:** `main` at `774cfc5` (#103: owner contact details, catering page published, media pipeline). Check the newest combined `main` CI and Cloudflare deployments live, not this snapshot; this is not launch approval.

## Creative direction (approved by the owner and merged in #104)

"The Grand Entrance": dark royal register (kohl, garnet, emerald, saffron), cinematic opening with a muted film loop on large screens, GSAP scroll story (idle-loaded, home only), gold dust, jewel-toned service doors with real photographs, kitchen arch, two owner films (download only on play), cinematic catering and story page templates, royal planner styling, persistent dark header with curtain page transitions and link prefetch. Full rationale, measurements and open items: `docs/creative-direction-grand-entrance.md`.

- Checks on the latest push: `verify`, `editorial-fixtures` and Workers Builds pass. Chromium desktop/mobile e2e, WebKit and Firefox film/home checks pass.
- Lab (4x CPU, ~1.6 Mbps): mobile LCP ~1.9-2.3 s, desktop ~2.3-2.4 s, CLS <= 0.001; planner interactions <= ~96 ms; mobile menu open/close ~100-200 ms / <= ~120 ms after the page lock was moved to the frame after the menu paints (it was 170-340 ms). Lab only; no real-user data.
- Owner media: private register outside the repo (`TWN-REL-2026-T0001`-`T0018`). Number plate blurred before use. People are identifiable in the team photo and portrait film; owner to confirm comfort. Film audio unverified for speech (captions may be needed).
- Merged to `main` on 19 Nov 2026 after the owner said "merge it". Previews remain noindex; no domain, indexing or live enquiries.

- **19 Nov follow-up (branch `feat/luxury-photo-hero`):** owner removed the hero film loop (photograph only); gallery section and footer invitation restyled to the dark royal register. Remaining sections and copy still to refine.
- **19 Nov (feat/services-occasions-luxury):** services get a faint jaali ground, a saffron-diamond ornament divider and chip links; occasions get large outlined numerals and pill links for other celebrations. Planner and plan page polish is next.

## Current implementation

| Area | State |
| --- | --- |
| Website | Astro 7, strict TypeScript and Tailwind 4. Homepage, five-stage planner, review/confirmation and 404. Creative pass 1 and official logo approved; photography and public claims remain gated. |
| Main preview | https://the-wedding-nest.mazharkhan-it.workers.dev/ — intake disabled, no D1 binding, noindex, no custom domain. |
| Branch previews | Fixed in #11. Wrangler declares explicit preview-safe variables; enquiry intake stays off. Branch URLs are temporary and may disappear after merge. |
| Isolated staging | https://the-wedding-nest-staging.mazharkhan-it.workers.dev/ — isolated APAC D1, public Turnstile test keys, exact staging Origin allow-list and fictional-data-only notice. |
| Enquiry reliability | Server-side Turnstile fetch and JSON consumption have a 10-second deadline; timeout returns retryable 503 before any write. Browser script loading also has a 10-second deadline, cleans failed scripts and retries through Back → Review. Late script loads cannot render hidden review widgets. |
| Privacy | Browser drafts exclude names, numbers, locations, notes and consent. Enquiries and an outbox event are stored atomically. A separate read-only impact estimator (#49) returns only retention counts; no deletion job or agreed production retention. |
| Enquiry correctness | Reused idempotency keys acknowledge only identical validated details, including the concurrent-key race (#48). Changed details yield a conflict and a visitor-initiated fresh-send path, preserving answers. |
| Notification foundation | #50 adds a dormant outbox lease/claim/ACK/retry core and additive v2 migration, **not applied** to Cloudflare. #51 adds a validated plain-text internal notice renderer. No recipient, provider, scheduler or send endpoint is configured; outbox events remain unsent. |
| CI | Formatting, strict type checks, unit tests, production/test builds, desktop/mobile Playwright and axe, local Workers runtime, plus a separate disposable synthetic-content editorial browser job (#46). Separate deployed staging browser tests use real dummy-key verification and the live API without mocks. |
| Conversion | Homepage occasions and listed service interests open the planner with allow-listed preselected choices (#41). Hidden specific services are cleared and rejected when full planning is chosen (#40). |
| Editorial publishing | #43 adds consent-paired, owner-gated event story pages; #44 adds owner-gated service detail pages. Neither publishes a page without approved source records. #45 links pages from the homepage only after such records exist. |
| Release gates | Production domain, indexing, real enquiry intake and unapproved business content remain owner-gated. |
**Authentic media:** Build-time exact photo/manifest pairing with permission and private release references. PR #37 rejects unreviewed files of normally enumerated types from the event directory; no approved event originals are yet published.

**SEO foundation:** Canonicals, robots, launch-gated sitemap and verified Organization JSON-LD (#38). Unapproved LocalBusiness details, reviews, ratings and contact facts are not added.

## Since the 16 November reconciliation (PRs #52–#94, merged 16–18 November 2026)

Verified against GitHub on 18 November 2026 (India): `main` at `8a56997` (#94). #64 is the only open PR (draft, on hold). Do not repeat any of the fixes below.

- **Planner validation and accessibility (#54–#63):** malformed or duplicate selections, guest counts and date fields are rejected or scrubbed; field errors are focused, ARIA-associated, cleared when answers become valid and kept until the rejected answer changes; stale error descriptions and reset state are fixed.
- **Draft and privacy hardening (#65–#71, #73):** durable enquiry IDs kept out of logs; saved drafts allow-list scalar values and sanitise selections; hidden services are not persisted; contact autofill disabled while intake is off.
- **Preview planner (#72, #74–#85):** first question fits the initial mobile viewport; screen-reader step announcements; preview plans can be reviewed and copied without contact details, with manual copy fallback and stale-confirmation clearing; contextual occasion/service links preserve compatibility; non-wedding celebrations have direct links; Instagram fallback readable without JavaScript.
- **Enquiry intake and notifications (#86, #87, #89):** malformed explicit marketing consent rejected; dormant notification claims keep moving under contention; malformed phone grouping rejected while ordinary international formats (`+91`, `(040) …`, `+44 (0)20 …`) remain valid. One shared validator serves browser and Worker.
- **Navigation (#88):** primary navigation stays visible, in-header and free of horizontal overflow at 360px without JavaScript; covered by an e2e regression.
- **Operating instructions (#90):** root `CLAUDE.md` now records verified commands, `docs/progress.md` as canonical task state, and operating rules; `AGENTS.md` stack wording reconciled with the implemented stack.
- **Live check (18 November):** both Workers return `x-robots-tag: noindex, nofollow` and a robots meta tag with a restrictive CSP. Bindings and deployed-commit provenance were not re-audited this session; use Cloudflare builds-by-version before relying on them.
- **Hardening and polish (#91–#94):** #91 reconciled this file; #92 (`d03e59a`) makes the Worker entry return a generic JSON 500 for unexpected enquiry-handler throws, never logging request data; #93 (`5c8712a`) gives the header home link an explicit `aria-label` because WebKit does not name a link from inline SVG `<title>` (axe failures in WebKit); #94 (`8a56997`) preloads the two critical latin variable fonts, cutting throttled mobile home LCP from about 2.0–2.6 s to 1.3–1.7 s, with a once-only-fetch e2e test.
- **Cross-browser check (18 November, local, not in CI):** Firefox and WebKit (desktop and mobile) ran the full e2e suite. Real defects were the WebKit logo-link name (fixed in #93). Remaining failures were environmental: Playwright WebKit does not Tab to links (skip-link test), mobile WebKit lacks `mouse.wheel` (sticky-header test), and load-related Firefox timeouts that pass in isolation. Opt-in `npm run test:e2e:cross` (Git Bash; one-off `npx playwright install firefox webkit`) now runs Firefox, desktop WebKit and iPhone WebKit, skipping those two undrivable tests; Chromium desktop/mobile remains the CI gate.
- **INP (18 November, Pixel 7 emulation, 4x CPU throttle, planner taps and Continue):** worst interaction 104 ms, under the 200 ms good threshold. Single-machine lab data, not field data; no change needed.
- **Owner contact details (18 November):** phone, email and Facebook supplied by the owner now appear in the footer, planner fallback and Organization JSON-LD; WhatsApp (same number), address and hours were added the same day; opening days stay unclaimed and hours are not in JSON-LD. twn.events is a former domain the business does not own; never reference it. Canonical domain remains theweddingnest.in; previews stay noindex.
- **First photography (18 November):** the owner stated permission exists for every uploaded image and video. Four originals (hall stage hero, stage seating, groom portrait, favour box) are in `src/assets/events/` with `src/content/media/tranche-one.json`; resized to 1500–3200 px with metadata stripped. Release refs `TWN-REL-2026-T0001`–`T0004` are opaque batch references backed by that owner statement; the private register is kept outside the repo, and the owner should keep a matching record. Catering is the owner's main business and is not yet on the site; a catering page, other photos, videos and number-plate blurring are next.
- **Catering page and contacts (18 November):** catering is the owner's main business. `src/content/services/hyderabadi-wedding-catering.json` publishes the four packages (Deccani Delight, Nawabi Zaiqa, Daawat-E-Khaas, Shahi Dastarkhwaan) and add-ons from the owner's deck, with customisation and no prices; approval ref `TWN-PUB-2026-C0001` is an owner-attested batch reference. Business line 9966973113 (calls and WhatsApp Business); founder Mohammed Ather Khan's personal 8686773095 is published at his direction; open every day 9 am to 12 midnight. CI editorial fixtures moved to the `guest-hospitality-hyderabad` slug so they no longer collide with the real page.
- **Dependency alert:** Dependabot #1, picomatch <= 4.0.7 (ReDoS), has no patched release and is a build-time transitive dependency of astro, vite and vitest. Not reachable from the deployed Worker; revisit when upstream ships a fix.
- **Open:** #64 (staging enquiry rate limiting) stays draft until Cloudflare entitlement, pricing and approvals are verified. It must not be merged or activated before then.
- **Local note:** `npm run build:submit` uses POSIX env syntax and fails under the Windows npm shell; run it from Git Bash or let CI do it.

## Earlier merged work

- #51 (`777cfe39`): private, validated, plain-text operational notice contract, no transport or recipients.
- #50 (`de479d8`): dormant outbox leases, stale-token fencing, bounded retries and v2 SQL migration; not applied or activated.
- #49 (`27f11e80`): read-only, aggregate-only retention assessment, no deletion route/cron.
- #48 (`e2364a8e`): stored-payload-bound idempotency, conflict recovery and browser/SQLite regressions.
- #47 (`1cd06e8b`): preserve approved story occasion in five-stage planner.
- #46 (`c0235bb5`): disposable synthetic CI pages exercise approved editorial route layouts without public mock content.
- #45: approved-only homepage discovery for portfolio stories and service details; fallback continues to the planner.
- #44 (`ad0cf8e`): strictly approved service-detail page generation and an editorial template; no source records yet.
- #43 (`f249258`): case-study routes tied to owner-reviewed stories and exact released original event images; zero public stories.
- #41 (`f79aaf6`): contextual homepage occasion/service links with safe URL intent, privacy-respecting draft merging, and browser/unit coverage.
- #40 (`7461d33`): clear specific-service selections on scope changes, cleanse restored drafts and reject inconsistent full-planning payloads.
- #38 (`890476e`): minimal safe Organization structured data with verified name, registered domain and Instagram profile, unit/browser tests; no invented address, phone, reviews or price information.
- #37 (`7a5a634`): fail-closed all-file scan for staged event assets beyond importable photo extensions; no images published.
- #36 (`d170bf4`): reject duplicate occasion, service and style selections in submitted enquiry data.
- #35 (`e237736`): deterministic simulated Turnstile readiness in desktop/mobile submission tests; previous flaky `main` CI was repaired.
- #34 (`e0a7882`): only acknowledge stored enquiries for HTTP 200/201 plus valid UUID.
- #33 (`562661e`): exact image-to-approved-manifest pairing in the homepage catalog.
- #32 (`a8b381d`): dormant privacy-safe single-lead deletion core, without an exposed route or automatic deletion.
- #10 (`2417182`): intake/storage failure handling, malformed or stalled submission responses and navigation locking.
- #11 (`8e24166`): missing Wrangler `previews` block fixed; isolated staging D1 created and schema applied.
- #12 (`79f9e42`): isolated staging deployed and verified. Real desktop/mobile submissions passed in GitHub Actions; HTTP tests confirmed 201 creation, 200 idempotent retry and one matching outbox row.
- Verification reliability follow-up: regressions reproduced stalled backend fetch/body consumption and indefinite/poisoned browser script loads before the fixes. Added deadlines, abort/cleanup, retry recovery and late-load browser regressions.
- Cloudflare staging build configuration now watches `main`, replacing the deleted `codex/staging-enquiry-validation` branch. It still deploys only `--env staging` with test-only build variables.

## Next work

1. Verify current merged `main`, the combined CI run, and Cloudflare Workers bindings on every takeover. The public Worker must stay noindex with intake disabled and no D1, while staging remains fictional-data-only.
2. Obtain exact business-owner approval of original event photographs, usage permissions and individual testimonials before publishing any of them. Existing image placeholders are deliberately honest.
3. Resolve [launch-decisions.md](launch-decisions.md): named lead-response owner, recipient/channel, privacy contact, retention and verified business details. The notification contract and v2 migration are **not deployed as a delivery pipeline**. Before any sender, explicitly approve and apply the migration in isolated staging, require provider-side idempotency, and test fictional records. Outbox events remain unsent, production lead collection disabled.
4. Independently review the final responsive/cinematic creative result using approved photography, measurable accessibility/performance, and the Cloudflare preview before permitting any domain, indexing or real-enquiry activation.

## Verification commands

- `npm run verify`: full project checks, including local browser and Workers-runtime suites.
- `python scripts/verify_staging.py`: Python 3 + curl; fictional data only, live HTTP guards, durable creation and duplicate retry.
- `npx playwright test --config playwright.staging.config.ts`: real deployed desktop/mobile submission against the separate staging Worker.

The cloud browser previously reached staging review but could not complete loading the external verification script. GitHub's actual deployed desktop/mobile tests passed; the browser deadline now prevents an endless wait in that failure mode.

## Earlier milestones

#1 tooling; #2 handover; #3 scaffold/planner; #4 standing merge authorisation; #5 review follow-up; #6 enquiry API; #7 approved creative pass/logo; #8 gated Send step; #9 authentic testimonial policy.

Initial tooling restrictions and scaffold-only handover reports are historical. Cloudflare MCP is connected; no Cloudflare credentials are committed to GitHub.
