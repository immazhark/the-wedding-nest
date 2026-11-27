# Project progress — reconciled 26 November 2026

## Current state — 27 November 2026

**Active writer: ChatGPT Work**, authorised by the uploaded execution directive. Baseline main read back as `fc3f940` (#175); no unrelated checkout changes or stashes existed in this workspace. Other machines' local files/stashes remain inaccessible and untouched. Branch `work/operator-retention-details-20261127` prepares operator detail/retention wording, log privacy and photo/film fixture coverage. No production activation gate changed.

| Evidence class | Current boundary |
| --- | --- |
| Implemented | Authenticated operator list/detail/status/audit and aggregate delivery overview. Notification consumer and unsuccessful retention primitives remain dormant, with no scheduler/cleanup route. Candidate restores scope/styles/budget and planner labels, recorded consent/disposition times, accurate eligibility wording and identifier-free status logs. |
| Locally verified | Candidate: 345 unit tests passed, Astro check zero diagnostics, standard/submission builds passed. Node 24.18.0 acquired for pinned verification. Browser execution unavailable: download returns 403 and system Chromium wrapper has no binary. Hosted browser acceptance required. |
| CI verified | Baseline historical green reports are preserved below; candidate CI must be read from its own commit checks before merge. |
| Deployed | Fresh Cloudflare read-back 27 Nov: default version `a0f4509d-7e85-4c90-adbd-fccafae79108`, staging `d00d3c8c-b000-496e-9b13-a6e93aec748d`, each 100%. API version annotations do not establish a Git SHA. Candidate not deployed at this record. Default bindings: ASSETS and intake false only; staging has isolated D1, fictional intake, Turnstile and three encrypted operator bindings, no sending credential. |
| Runtime accepted | Owner reported OTP login reaching admin. Full fictional enquiry/status/audit transaction and Worker-integrated inbox receipt remain unproven; do not request another login solely from stale history. |
| Owner-gated | Exact unpublished service copy/coverage, testimonial permissions, genuine makeup media, booked-client/pending-delivery/audit policy, training-crawler choice, secure sending credential and send approval, retention activation, public release/domain/indexing/real intake. |

**PR reconciliation:** #161's old progress snapshot is superseded by integrated history and this current summary; it should be closed rather than merged backwards. #64 remains held for rate-limit entitlement/cost evidence. Read current GitHub before changing either state.

**Remaining preparation boundaries:** photography media/composition already exists; candidate adds isolated five-width/short-height, accessibility, CSP and keyboard/lightbox coverage without publication. Cars have one reviewed still and silent no-plate door clip in Git; additional originals needing plate treatment are inventory references, unavailable in this checkout. No substitute imagery or approval references were created. Held-notification resolution needs an approved disposition policy, and no replay or deletion override was introduced. Audit/log retention recommendation is explicitly unapproved in [privacy-retention.md](privacy-retention.md).

**Historical Claude evidence (25 Nov; preserved from PR #161, not independently repeated).** #159 addressed two visual defects; Claude reported rendered home/catering reviews at 390 and 1440 px without header/hero or footer overlap or clipped arches. All 11 distinct HEIC originals decoded with ffmpeg; selection/privacy review remained for branded goods M017 and personal names on M134 favour labels. The primary OneDrive checkout reportedly held stale uncommitted files already present on main and two stash entries. These local files are inaccessible to ChatGPT; preserve them. #156–#160 and #130 subsequently merged, superseding the historical pending-merge and inactive-operator claims. #64 remains held pending verified rate-limit cost/plan eligibility or an alternative. The source history in #161 remains available.

**Owner gates outstanding.** Five service-page approvals, testimonial permissions, genuine bridal makeup media, booked-client retention and pending-delivery policy, AI training-crawler choice, secure staging receipt-test credential and explicit send approval, plus the separate public release/domain/indexing/real-intake/notification approvals. Do not publish or send before approval.

## Historical execution records (superseded by the current state above)

**Latest integration — 25 November.** ChatGPT is the owner-authorized implementation writer; no existing branches were overwritten. PR #149 (dormant operator status, CI `45541232974`) merged as `e0ad1ec`; #150 (progressive gallery, CI `45541271522`) merged as `ae07167`. Both passed verify, editorial fixtures and Workers Builds before squash merging. PR #151 adds cross-browser layout/catering review evidence; its hosted checks must pass before integration. This branch adds the corresponding compare-and-set protection for unsuccessful disposition, without activating a route or retention job. Isolated SQLite reproduction confirmed the old statement could close a lead after its status changed, while the candidate statement rejects that stale action. Full branch CI is required; local repository checkout/browser verification is unavailable in this chat. #64 and #130 remain draft holds. No public release, live intake, indexing, notification or production migration was authorized or activated.

**Execution queue — ChatGPT Work takeover continuation.** GitHub integration is restored. PR #147 is merged as `af100d7` after successful CI `45539566164` (including 82 editorial browser tests); PR #148 is merged as `b7bdafe` after successful CI `45539914960`. PR [#147](https://github.com/immazhark/the-wedding-nest/pull/147) delivers gallery announcements and four-look regression coverage (`b2c9413`, CI `45539566164`); PR [#148](https://github.com/immazhark/the-wedding-nest/pull/148) fixes film visibility/play races/reduced-motion changes (`7a2730f`, CI `45539914960`); PR [#149](https://github.com/immazhark/the-wedding-nest/pull/149) prepares dormant operator status transitions (see `docs/operator-workflow.md`). Check GitHub for their current merge/check state before resuming. Required CI must pass and review threads must be resolved before integration.

**Combined local verification.** All three changes were cherry-picked into `work/combined-verification-20261125`: 269/269 unit tests, zero Astro/TypeScript diagnostics, formatting, standard build and submission-test build passed. Film changes reproduced three baseline failures and add seven regressions. Operator changes add twenty real-SQLite tests and passed independent security review. Browser execution remains unavailable locally; hosted CI must establish browser/runtime acceptance. No production gate, live route, migration or notification was activated.


**Repository.** Verified GitHub `main` at `c73404e6fd127cb499ea47f8bb9a844ed675020c` (#145, category-specific compositions). #142 (CSP fixes), #143 (progress reconciliation), #144 (Service structured data) and #145 are merged. GitHub CI run `45535164729` completed successfully. Only #64 and #130 remain open, both drafts. The earlier audit baseline is superseded.

**Active development writer — ChatGPT Work, 25 Nov 2026.** Dedicated branch `work/service-look-regressions-20261125`, based on `c73404e`; no existing branches overwritten. No repository writer lock was found; unpushed Claude changes cannot be inspected. GitHub connector access is restored using the repository-owner account; terminal GitHub authentication remains unavailable. Repository-backed integration now uses the authenticated GitHub connector.

**Cloudflare reconciliation.** Both deployed builds report commit `c73404e` and successful outcomes: main version `2dd324d7-b940-47b1-932c-8ba4bfa5d848` (build `a2046500-4eb2-45df-92f6-5c5db0fa9772`), staging version `f9193701-42a6-4340-a1ea-3f86cbb1012c` (build `8fc6e4a1-5f51-4f43-afc8-24bd535de22e`). Main has assets plus `ENQUIRIES_ENABLED=false`, no D1; staging has its separate D1 and enabled fictional intake. No infrastructure changes or customer-data reads. Read-only staging schema inspection also confirms the columns/indexes from migrations 0002–0004 and the `outbox_freeze_email_notice` trigger; `PRAGMA foreign_key_check` returns no violations. These migrations are already applied in staging, contrary to older historical notes. Staging planner GET returned HTTP 200 on this takeover (this does not verify submission or email delivery). PR #130 still needs authenticated environment/CI review before integration.

**Site state.** Main preview https://the-wedding-nest.mazharkhan-it.workers.dev/ is noindex with enquiry intake off and no custom domain. Only one service page is published (catering, owner-attested `TWN-PUB-2026-C0001`). Décor, Mehndi, Trousseau and Hospitality gallery pages are built and tested but **unpublished**: they need the owner's approval of the copy in `docs/service-page-drafts.md` and an approval reference for each. Home service doors play short silent category films on hover or focus (desktop only).

**Inherited verification state (before this branch).** Technically verified: unit (236), Playwright desktop and mobile, axe, console/CSP, overflow, and a 13-size x 5-page viewport sweep (320 to 1920, short laptops, landscape phones). Visually verified by screenshot: home, catering and the five planner stages at 390 and 1440. Not verified: real-time video playback and audio (all published clips are silent), slow-network behaviour, browser zoom beyond the 320 px width, cross-browser visuals on Firefox/WebKit.

**Media.** `docs/media-inventory.md` is the source of truth: 373 files (9 converted JPEGs M365-M373), 53 distinct videos probed with ffmpeg. Two HEIC originals still have no JPEG (`1000002088.heic`, `Floral/IMG_1540.HEIC`). Cars need a licence-plate blur before plated footage or photographs go live.

**Owner decisions outstanding.** (1) Approve or edit the four service pages' copy and issue approval references; (2) booked-client data retention; (3) testimonial quotes and permissions; (4) the production gates: domain attachment, public release, indexing, real intake, notification activation. Cleared on 25 Nov: faces, client names on invitations, plate blur, `twn.events` overlays ignored, no raw-meat imagery.

**Next executable priorities.** Publish approved service pages; cars (plate blur) and photography/film pages; Makeup (needs genuine photography); service-page SEO/structured data from verified facts only; operator enquiry workflow and email receipt test (owner-gated); cross-browser visual pass.

## Current staging readiness — 24 November 2026

- Source implementation through #129 is merged; main at this check is `710b1fbbbde5476ee0429dbfb039d4690dbd1684`. #124/#125 contain release/privacy/retention preparation; #127/#128 contain the dormant email adapter/consumer; #129 contains the offline-default manual provider receipt probe. Latest functional validation: 226 unit/component tests, build/type/format checks and full GitHub browser/runtime CI passed for #129.
- Under the owner's continued implementation authorisation, applied migrations **0002, 0003 and 0004** only to the verified isolated `twn-enquiries-staging` database (`7a2c8b44-f24d-48e6-ba95-56aa039d60e8`). Schema read-back confirmed every new column, both added indexes and the notice immutability trigger. Foreign-key check returned no violations. No enquiry payload was read, classified, backfilled, deleted or dispatched; no cleanup was scheduled. These additive schema changes do not activate their dormant callers.
- Created GitHub environment **twn-email-receipt** and visibly verified required reviewer **immazhark**, administrator bypass **disabled**, exactly branch **main** allowed and **zero tags** allowed. Prevent-self-review remains off so the sole owner can approve their own manually initiated workflow. This is an approval gate, not separation between the owner and an agent using the same account. No environment secret or variable exists; no credential was created or entered.
- Public Worker recheck: intake disabled and no D1 binding. Isolated staging still points only to the named test database and exact staging Origin. No live delivery, real messages, public domain attachment, indexing or real intake was activated.
- Post-migration HTTP GET checks of the staging homepage and `/api/enquiry` both returned 403 from this execution environment. This does not establish an application regression or a successful intake check; no real submission was attempted. Schema and binding verification above succeeded independently.
- Remaining secure owner step: create a domain-restricted sending-only key and put it directly in the protected environment as `TWN_RESEND_STAGING_API_KEY` (never in chat). The real fictional receipt probe remains unrun and must be separately approved; its result would prove only the provider path until inbox receipt is confirmed. Deployed Worker/consumer integration and live operator/retention procedures remain outstanding.

The implementation snapshots below retain the status and test counts at the time they were written; their old "not applied" or unmerged statements are superseded by this current section.

## Historical retention implementation snapshot — 24 November 2026

Older entries below are historical. Sections marked "(not yet merged)" were written before their branches merged (#124, #125 and later).

## Retention and privacy follow-up — 24 November 2026 (historical; merged as #125)

Branch `feat/unsuccessful-enquiry-retention-20261124` follows the release-readiness candidate. Adds migration 0003 (not applied), explicit unsuccessful disposition/90-day clock, aggregate preview and bounded guarded deletion primitives. Active/booked/unknown-clock records are protected; pending deliveries are counted and held for review. No deletion job, API route, sender or migration execution is enabled. Adds an honest pre-launch privacy notice, linked from footer and planner; this is not a final operational/legal approval.

Focused real-SQLite retention tests pass (14 tests in worker-sqlite suite). Full branch unit/component suite: 194 passed; Astro check: zero errors, warnings or hints; formatting passes. GitHub build/browser/runtime CI remains required. No customer database was read or modified.

## Execution update — 24 November 2026 (historical; merged as #124)

Branch: `feat/prelaunch-release-readiness-20261124`, based on `e2f76d8a77a3fd8bdee31fced2bb00cbdce89fb5`. Scope: default-off public-display flag with test warning precedence, official-logo OG/Twitter sharing image, and a build-time indexing guard requiring explicit public release plus disabled default workers.dev/version previews. Current Wrangler flags and Cloudflare settings are unchanged. Main remains noindex with intake disabled.

Owner confirmed notification destinations WhatsApp +91 86867 73095 and theweddingnest.events@gmail.com, privacy contact at that email, and 90 days for unsuccessful enquiries. Owner subsequently confirmed the clock starts when marked unsuccessful. Booked-client retention, pending-delivery handling and authenticated deletion process still need definition. No sender, retention job, migration or live intake is activated.

Checks: 21 focused release/host/component tests pass. Prepared candidate previously passed 177 unit/component tests, three static build variants and six direct HTTP metadata/image checks; that is not a browser pass. Current full branch verification is in progress. This execution environment blocks browser sockets and local Workerd network enumeration; GitHub CI must establish those checks before acceptance. Existing owner-review PRs #114/#120, testimonial PR #122, rate-limit hold #64 and docs PR #123 remain open and are not duplicated.

The following reconciliation is historical; the execution update above is newer.

Current state first. GitHub and Cloudflare live records remain authoritative for commits, checks and exact deployed versions. This snapshot is not a production-launch approval.

**Repository baseline at this update:** `main` at `4bf9612` (#118), CI green (run 44843967280). Open PRs, both drafts: #114 (lighter hero scrim, awaiting owner creative approval) and #64 (staging rate limiting, held for Cloudflare entitlement/cost review). Governance checked 21 Nov: no rulesets, `main` not branch-protected (owner decision, no change made). The repo is **public** although early docs said private: owner decision pending (founder's personal number, team photo and portrait film are in public view). Cloudflare deployment provenance was last confirmed 19 Nov; re-check before relying on it.

## Creative direction (approved by the owner and merged in #104)

"The Grand Entrance": dark royal register (kohl, garnet, emerald, saffron), cinematic opening with a muted film loop on large screens, GSAP scroll story (idle-loaded, home only), gold dust, jewel-toned service doors with real photographs, kitchen arch, two owner films (download only on play), cinematic catering and story page templates, royal planner styling, persistent dark header with curtain page transitions and link prefetch. Full rationale, measurements and open items: `docs/creative-direction-grand-entrance.md`.

- Checks on the latest push: `verify`, `editorial-fixtures` and Workers Builds pass. Chromium desktop/mobile e2e, WebKit and Firefox film/home checks pass.
- Lab (4x CPU, ~1.6 Mbps): mobile LCP ~1.9-2.3 s, desktop ~2.3-2.4 s, CLS <= 0.001; planner interactions <= ~96 ms; mobile menu open/close ~100-200 ms / <= ~120 ms after the page lock was moved to the frame after the menu paints (it was 170-340 ms). Lab only; no real-user data.
- Owner media: private register outside the repo (`TWN-REL-2026-T0001`-`T0018`). Number plate blurred before use. People are identifiable in the team photo and portrait film; owner to confirm comfort. Film audio unverified for speech (captions may be needed).
- Merged to `main` on 19 Nov 2026 after the owner said "merge it". Previews remain noindex; no domain, indexing or live enquiries.

- **19 Nov follow-up (branch `feat/luxury-photo-hero`):** owner removed the hero film loop (photograph only); gallery section and footer invitation restyled to the dark royal register. Remaining sections and copy still to refine.
- **19 Nov (feat/services-occasions-luxury):** services get a faint jaali ground, a saffron-diamond ornament divider and chip links; occasions get large outlined numerals and pill links for other celebrations. 
- **19 Nov (feat/planner-luxury):** plan page hero gains the nested-arch ornament; the planner stage gets the jaali ground; selection tiles get brass hairlines and a diamond mark; the active step carries a saffron diamond. Visual only: validation, privacy and accessibility logic untouched. 
- **19 Nov (feat/catering-flagship):** the four catering menus render as menu cards (tagline, labelled courses, dishes marked with saffron diamonds) via a presentation-only parser, `src/lib/services/menu.ts`, which never changes the approved words (a test proves no word is lost). Add-ons stay prose and no prices were added. Story template check and copy review are next.
- **19 Nov (fix/mobile-review):** reviewed home, plan, catering and 404 at 390px. Fixed published phone numbers wrapping mid-number (nowrap, with e2e regression) and made the door numerals legible over photographs (dark pill).

## Visual review, 21 November 2026 (local dev, Chromium; 320/360/390/768/1024/1440)

Evidence: viewport screenshots at 390 and 1440, programmatic sweep of all six widths on home, plan and catering pages. Not yet reviewed: real touch devices, WebKit/Firefox visuals, tablet screenshots, planner step screens, story template.

- **No horizontal overflow** at any width on the three pages. No content stuck hidden after a full scroll; reduced-motion shows content and hides the kitchen video. Astro dev-toolbar at the bottom of local screenshots is not part of the site.
- **Fixed (#112):** mobile hero lede clipped by the arch overlap.
- **Open, art direction (needs owner preview before merge):** (1) the hero scrim leaves the lower ~40% murky and hides the floral stage, especially on mobile; (2) the catering arch loop is a flat saffron close-up that does not read as food, in the biggest catering moment; (3) the "Makeup & beauty" door uses a mehndi-hands photo, so the image implies a service it does not show; (4) the hall-stage photo repeats across hero, décor door and gallery; (5) the preview banner still says "placeholder imagery" though the photographs are real.
- **Story template (checked locally with fictional text and real approved photos, files removed afterwards):** layout, type rhythm and mobile reading width are good and ready for real content. Nit: a few thin gold vertical lines hang under the hero image and look accidental. Real content still needed: approved story facts, attribution and permissions.
- **Catering journey (390px):** menu cards are well made and the planner hand-off is clear. Gaps: the page hero is a blurred chandelier (décor, not food); four menus stack for about 1,500px per menu, so comparing them means long scrolling (a compact compare strip or menu switcher would help, owner preview first); the planner's "preview, enquiries can't be sent yet" notice fills the first mobile screen until intake is switched on.
- **Low severity:** standalone phone/WhatsApp links are 20-25px tall on mobile and desktop nav links 19px tall. Inline or spaced, so not a WCAG 2.5.8 failure, but larger hit areas are worth adding when the footer is next touched.

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

- Event story template: jaali ground, arch crown on the hero and a hairline ornament before the gallery, so a future story matches the rest of the site. Not visually reviewed: no story is published and no fixture renders the page.

### Follow-up, 21 November 2026 (later)

- Merged #116: story hero arches now end with the headline block, so no stray gold lines under the photo. Merged #117: footer link tap areas extended to the 32px row pitch (no visual change).
- Hero checked in Firefox and WebKit at 390 and 1440: no horizontal overflow, copy clears the arch, layout matches Chromium.
- Planner at 390: every field has a label; all planner buttons are 44px or taller. Remaining small targets are inline header and footer text links, which meet WCAG 2.5.8 through spacing.
- Still awaiting owner: #114 scrim approval, catering hero and arch-loop imagery, makeup door photo, banner wording, repo visibility, and all production gates.
- **#114 evidence (21 Nov):** compared the #114 preview with the main preview at 1440 and 390. Floral stage, sofas and stage floor are clearly visible on #114; headline, lede and CTA stay legible on both. Branch changes only `src/styles/global.css`, mergeable and clean against current `main`. Superseded and merged on 25 Nov (rebased replacement of #114).

### 22 November 2026

- **Merged #121:** editorial fixtures now sweep 320/768/820/1024/1280px on the synthetic service and story pages (no overflow, no image past the viewport). Story template is therefore covered at tablet widths; it still has no real content.
- **Draft #120 (owner review):** catering "Choose a menu" jump bar (no JS; name + approved tagline linking to each menu card). CI green. Needs owner visual approval.
- **#122 (testimonial framework):** zero-by-default, owner-gated quote model (`src/lib/testimonials/`, content in `src/content/testimonials/`), editorial quote section on home that renders only when approved records exist. No ratings, counts or Google text by design. Needs real, permissioned quotes to show anything.
- **Still awaiting owner:** #114, #120, catering hero and arch-loop imagery, makeup door photo, banner wording, repo visibility/branch protection, first real story facts, quote shortlist and permissions, all production gates.

### Email delivery preparation, 24 November 2026

- #124 release/share/indexing safeguards and #125 draft privacy/unsuccessful retention are merged; main `096b846` was verified against its tested tree and successful Cloudflare preview build.
- Owner approved the four email-authentication DNS records; added DNS-only and read back without replacing existing records. Provider subsequently verified the domain and all four records.
- Added a dormant single-attempt email adapter with a fixed operator recipient, event idempotency key, conservative age cutoff, timeout and safe result classifications. No Worker import, cron, credentials, live sends or migrations. See [email-notifications.md](email-notifications.md) for consumer/credential/receipt gates.

### Durable email consumer preparation, 24 November 2026

- Merged #127 after all GitHub checks succeeded, including verify, editorial fixtures and Workers Builds; merge commit `1fe3849`.
- Added a dormant single-event consumer and unapplied migration 0004: immutable validated notice snapshots, guarded live leases, bounded retries, operator-review holds, atomic provider-acceptance acknowledgement and cascade deletion. No customer record was read, no migration applied, no secret created and no email sent. All new delivery tests use real in-memory SQLite with a mocked provider.
- Public launch, indexing and real intake remain off; secure credentials, isolated staging migration/receipt test, operator/backup and held-record procedures remain activation gates. Owner-facing design PRs remain separately reviewable.

### Manual receipt-test controls, 24 November 2026

- #128 merged as `f4ac1d4` after full GitHub verify/editorial/Workers checks. Its migration and consumer remain inactive at the provider.
- Prepared a manual-only fictional receipt workflow with an offline default, fixed test-labelled message, separate test idempotency namespace, explicit confirmation and protected-environment secret boundary. No new packages. Node 24 offline script and receipt gates are tested; no real send or key provisioning.
- Secure owner-only setup and the exact fictional message are in [email-notifications.md](email-notifications.md). Environment protections and a domain-restricted sending-only secret must be configured directly in provider/GitHub dashboards before a separately approved real probe. The provider probe does not prove Worker/D1 delivery.

### 25 November 2026: home catering loop from the new media

- Owner cleared faces, client names, plate blur, `twn.events` (ignore) and no raw-meat imagery for the new collection (`docs/media-inventory.md`, #132).
- Home kitchen arch now plays a silent 6.6 s plating clip (M081; 720x900, 0.9 MB, no audio, poster from the plated dish) instead of the flat saffron pot. Checked at 390 and 1440: plays, no horizontal overflow. Catering-page hero and Makeup door stay with #126.
### 25 November 2026: media collection inventory

- `docs/media-inventory.md`: 364 files in TWNMedia (308 images, 56 videos), 26 exact duplicates, 11 distinct HEIC files blocked (HEVC), all decodable images viewed on contact sheets, all videos frame-sampled but **none reviewed in full**. Nothing integrated yet. Owner decisions on faces, client names on cards, plates and overlays are listed there.
- #123 conflicted with `main`; replaced by #131 (merged). #133 (merged) swaps the home catering loop for a real plating clip.

### 25 November 2026: gallery reel (new media, first still-photo integration)

- Home gallery gains a seven-frame mosaic below the original three (`src/content/media/tranche-four.json`, refs `TWN-REL-2026-T0019`-`T0025`, owner-attested 25 Nov): night garden seating, groom in a doorway, couple holding hands, nikah signing, gold place settings, saffron biryani, henna hands. Derivatives 1200-2400 px, 248-408 KB, EXIF stripped. Portraits sit in arches; desktop rows end level; one column on phones.
- Checked on a production build at 1440, 820 and 390: all seven load, no horizontal overflow. New guard test `tests/unit/media-manifests.test.ts` (unique release refs and alts, files exist).
- Still not integrated: décor/home-event backdrops, cars (plates need blur), favours beyond existing, more videos.

### 25 November 2026: décor door no longer repeats the hall stage

- The "Décor, florals & staging" door on home now uses the marigold-and-jasmine lattice backdrop (`M154`, `T0026`, 1300 px, 375 KB) instead of the stage-seating photo that also appears in the gallery and hero. Closes open item 4 from the 21 Nov visual review. Checked on a production build at 1440 and 390: title legible over the scrim, no overflow.

### 25 November 2026: hero clipped on short windows (fix)

- Owner reported overlap in the hero/header. Reproduced on the live preview: on windows shorter than the hero copy (about 1366x650 laptops, 1280x600, landscape phones) the stage was a fixed height with the copy pinned to its bottom and `overflow: hidden`, so the first headline line slid under the sticky header and was cut off. The stage now uses a `min-height` floor and grows with its copy.
- Regression test `tests/e2e/hero-fit.spec.ts` (five viewport sizes): failed on main for four of them (headline top 1-80 px vs 106 px header), passes after the fix. Desktop and mobile e2e for site, visual-review and performance specs all pass locally (96).

### 25 November 2026: catering recovery (owner-reported defects, reproduced and fixed)

Reproduced from the owner's laptop screenshots (about 1900x870 Chrome) and Playwright captures of every page. Causes and fixes:

- **Hero headline under the header:** fixed-height stage + bottom-pinned copy + `overflow: hidden` (fixed in #137, regression test `hero-fit.spec.ts`).
- **Duplicate closing band and arches poking into the section above:** the footer always rendered its own "Begin planning" band, even right under a page's own closing invitation and on the planner page itself; its decorative arches had a fixed 3:4 aspect and grew taller than the band, so they rose 183 px into the previous section (on the plan page they were clipped by the hero). The band is now opt-out (`invite={false}` on service pages and the planner) and the arches are sized from the host, so they always fit. Tests fail on live main, pass here.
- **Catering photographs "random between menus":** a hard-coded `index === 1` dropped a three-photo strip into the menu list; small derivatives (2000 px at about 150 KB) were upscaled into 580 px columns. Replaced by a composed page: split hero (crisp biryani/hall photograph beside the title, no scrim, no blur, `quality=80`), one fresh derivative per menu card (Deccani platter, Nawabi biryani, Daawat grill, Shahi haleem) paired in menu order, a "From the pot to the plate" kitchen film (silent, poster, visible-only autoplay, real Pause button, poster under reduced motion), a saffron-dessert arch composition listing only dessert names already approved in the menus, add-ons, the team and one closing invitation. The menu jump bar from #120 is folded in.
- **Service journey:** the hero's primary action now goes to the menus (see the service first); planning stays as a secondary link and in the closing invitation.
- New media: `src/content/media/tranche-five.json` (T0027-T0032), `public/media/catering-pot-to-plate*.{mp4,jpg}` (M107, 0.3-11 s). Supersedes #126 (hero swap) and #120 (jump bar); both can be closed.

### 25 November 2026: service gallery template (pages awaiting owner approval)

- Shared gallery primitives: `Gallery.astro` (mosaic that keeps each photograph's own proportions; native `<dialog>` lightbox with Escape, arrow keys, previous/next, focus returned to the tile) and `LoopFilm.astro` (silent film, poster first, visible-only autoplay, Pause control, poster under reduced motion), reused by catering. Gallery-first services open on a wide photograph, then the mosaic, then the particulars (see the work before planning).
- Media prepared: `tranche-six.json` (T0033-T0058, 26 photographs: floral/décor, henna, trousseau trays and gift packaging, table settings), `public/media/trousseau-packing*.{mp4,jpg}` (M230, 0.9-14.5 s, silent), plus per-service selection and order in `src/lib/services/photos.ts` for décor, Mehndi, trousseau and hospitality.
- **No service page is published.** Each page needs the owner's approval of its exact copy and an approval reference (`docs/service-publication.md`). Draft copy for four pages is in `docs/service-page-drafts.md`. I did not create approval references myself. Until records exist the site keeps linking those services to the planner.
- CI coverage without publishing anything: the synthetic editorial fixture page (guest-hospitality slug, CI-only build) now renders the real gallery, and a new editorial test opens the lightbox, steps with the arrow key, closes with Escape and checks focus return; unit test `service-media.test.ts` checks every requested photograph is declared in a manifest and never repeated.
- Cars (licence plates need blur), photography/film and makeup (no photography supplied) are not yet built.

### 25 November 2026: lighter hero scrim (supersedes #114)

- #114's scrim, rebased onto the current hero (after #137): the floral stage and floor now read as the subject; headline, lede and CTA stay legible (compared against main at 1440x900 and 390x844, same capture method). CSS only (`.grand-scrim`, plus a soft text shadow on hero copy). #114 closed as superseded.

### 25 November 2026: living doors, converted photographs, real video review

- ffmpeg 9.1 (winget `Gyan.FFmpeg`, local only, no uploads) now gives a real review toolchain: every video probed, scene cuts and audio levels measured, timestamped sheets at 1-2 s spacing (see `docs/media-inventory.md`). Playback and listening are still not done, so published clips stay silent.
- The nine converted JPEGs (M365-M373, `Packing/`) are in: tulle-wrapped baskets, suitcases, satin pouches and henna cones. `tranche-seven.json` (T0059-T0065) feeds the trousseau and Mehndi galleries (pages still awaiting approval) and the home Gifting door photograph. Two HEIC originals (`1000002088.heic`, `Floral/IMG_1540.HEIC`) still have no JPEG.
- Home service doors wake a short silent film on pointer hover or keyboard focus (desktop, fine pointer, no reduced motion, no Save-Data; nothing downloads before that): Catering, Décor, Photo & film, Cars. Four e2e tests (`living-doors.spec.ts`).
- Cars loop uses M029 (decorated hood, no plate visible); plate blur is still required before any car footage with a visible plate (M362).

### 25 November 2026: Service structured data

- Service pages now emit schema.org `Service` JSON-LD (name, description, canonical URL, provider linked to the Organization `@id`, area served = Hyderabad, Telangana), built only from the owner-approved page record. It never carries prices, ratings, reviews, offers or availability (unit and e2e tests assert this). Applies automatically to every service page that is later approved.

### 25 November 2026: CSP inline-style defect and test gap (fixed)

- A full viewport sweep (13 sizes x 5 pages, including 320 px, short laptops and landscape phones) found one real defect: the film frame and gallery tiles set `aspect-ratio` through an inline `style` attribute, which the site's Content-Security-Policy blocks. On the live site the gallery tiles would have collapsed once service pages publish. Both now use the image's own width/height (gallery) and a CSS ratio (film).
- Why it was missed: the real catering page was not in the site-wide axe/console/overflow/metadata tests, and the editorial fixture test only clicked the lightbox. The catering page is now in `PAGES`, and the fixture service page has a no-console-or-CSP-error test.

### 25 November 2026: service looks (category-specific compositions)

- The four prepared service pages no longer share one recipe. Each service declares a `look` in `src/lib/services/photos.ts` (shared accessible gallery and lightbox, different composition): Décor opens full-bleed and uses an editorial grid of fixed row proportions; Mehndi sits on saffron paper in two large columns; Trousseau on ivory in three columns with the packing film; Hospitality opens split on the banquet photograph and uses justified rows of equal height (a horizontal rail was rejected: it fails the "every photograph stays inside the viewport" fixture check, which stays unchanged). Catering is unchanged. A light chapter breaks the dark-and-gold sameness the audit flagged.
- Reviewed as rendered pages at 1440 and 390 using throwaway local drafts (deleted); the pages themselves remain unpublished pending approval of `docs/service-page-drafts.md`.

### 25 November 2026: search, answer-engine and AI-discovery foundations

- `docs/search-visibility-plan.md`: verified (25 Nov, official sources) what Google, OpenAI and Anthropic document about search, user-request and training crawlers; what stays gated; what is executable next.
- robots.txt now has an owner-decision switch for model-training crawlers (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`; build variable `PUBLIC_AI_TRAINING=disallow`). Default unchanged; the preview stays `Disallow: /` for everyone; search and user-request crawlers are never listed. **Owner decision:** recommended to opt out of training crawlers.

### 25 November 2026: Work takeover — gallery accessibility and regression matrix

- Implemented on `work/service-look-regressions-20261125`: polite, atomic lightbox-caption announcements so assistive technology can announce photograph changes; CI-only fixtures for all four service looks, with narrow/short viewport containment, header clearance, axe, CSP/console, lightbox wraparound and focus checks. No service publication records are committed.
- Fixture collision protection and finally cleanup cover all added records. Synthetic photographs now have distinct release references. Generated editorial/submission outputs are excluded from TypeScript diagnostics; disposable editorial output is ignored by Git.
- Independent source review found no blocking issues. Type check passed with zero errors/warnings/hints; mock receipt harness passed without any network send. Browser and final clean-source verification results are recorded below when available.
- Production approval gates are unchanged. The earlier GitHub connector blocker is resolved. Re-fetch main, reconcile concurrent changes and require the full GitHub checks before merging. No background continuation is scheduled.

**Final local evidence for this branch:** `npm test` — 242/242 passed (30 files); `npm run check` — zero errors/warnings/hints; `npm run format:check` — passed; `npm run build` — passed (5 pages). Isolated fixture build generated all four service compositions (10 pages total), and static HTML checks confirmed each expected gallery/hero class and noindex. Its browser phase failed before page execution: Chromium binary is absent and Playwright browser download returns HTTP 403. No browser/axe/visual PASS is claimed for this branch. Disposable fixture sources/output were removed by the runner's `finally`; the final standard build contains none of the four unapproved service routes. The first unit run overlapped generated fixtures and rejected their old duplicate synthetic release reference; the runner now assigns distinct references and the clean-source rerun passed all 242 tests. Main-preview HTTP headers and robots remain noindex; existing deployed homepage inspected in the cloud browser at its default desktop viewport only, not this unpublished patch.

### Next executable tasks after integrating the takeover PRs

- Use current GitHub CI and review state, never the historical open-PR lists, before merging eligible changes. Re-check both Cloudflare build provenances after integration.
- Extend the authenticated operator interface and audit trail only behind the documented activation prerequisites; the new core is not a functioning CRM or authenticated API.
- Continue remaining service/media experiences and cross-browser acceptance while service-copy, testimonials, booked-client retention and production approvals remain outstanding. Do not manufacture approval references or re-open completed service looks.

### Gallery fallback and retained visual evidence — takeover continuation

- Gallery tiles are real approved-image links without JavaScript or native-dialog support; ordinary clicks still open the accessible lightbox, while modified clicks preserve native browser behavior. Eight unit regressions cover enhancement/fallback behavior; seven reproduced failures on the earlier implementation. A JavaScript-disabled browser regression verifies actual image navigation and response type.
- CI now retains editorial composition PNGs as the `editorial-compositions` artifact for seven days, including failure screenshots where available. These are test evidence, not creative owner approval. No synthetic content is deployed.
- Combined local candidate (gallery, film and dormant operator changes): 277 unit tests passed; type/format and both build variants were verified before integration (see current GitHub checks for the final branch tree). Local Chromium remains unavailable, so hosted browser acceptance is mandatory.
- Main preview build `8523c8e9-78e0-4233-83cb-395fe5609a72`, version `8abc4300-64e8-4fa1-bf53-9e18ccd3782f`, independently verified successful at commit `af100d7`; main retains intake-off and no D1. Staging retained its isolated D1 and fictional intake. Later deployments must be rechecked rather than assumed.
