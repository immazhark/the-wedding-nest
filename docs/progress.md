# Project progress — reconciled 16 November 2026

Current state first. GitHub and Cloudflare live records remain authoritative for commits, checks and exact deployed versions. This snapshot is not a production-launch approval.

**Repository baseline at this update:** `main` at `777cfe391afba52519d2504415e971b81f23cb0f` (PR #51), following `de479d8d4a7dc7fb974856d1e84ff63cef86eda1` (PR #50). Both PR heads passed full CI, including the production-site and disposable editorial-fixture jobs. Check the newest combined `main` CI and Cloudflare deployments live, not this snapshot; this is not launch approval.

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

## Takeover follow-up — 17 November 2026 (India)

- Latest takeover baseline: `607aacbc` (#58), with no open PRs before this session. #53–#58 are already merged; do not repeat those planner and notification fixes.
- #59 rejects explicit non-array service/style collections while preserving omitted/null optional selections. Regression-first CI `43943150239` reproduced the defect (one expected failing unit test); implementation and API/retry regressions require green final-head CI before merge.
- Cloudflare live audit confirms both Workers remain noindex, no custom Worker domains, public intake off with no D1, and isolated staging intake on with test-only bindings. Cloudflare builds-by-version records independently confirm both current deployments were built from `607aacbc` (#58). Version annotations alone do not establish source provenance.
- Production release gates and unresolved owner inputs below remain unchanged.

## Latest work

- #62: browser draft date serialization/restoration now reconstructs only approved date keys and restores only string date values. Unit regressions cover contaminated runtime objects, legacy rewrite and coercible malformed values; the browser regression checks reload scrubbing without changing the valid event date or expiry. A direct Node runtime reproduction confirmed nested private fields survived before the fix. Final CI must pass before merge; release gates are unchanged.

- #61: server-rejected field feedback stays visible across unrelated edits. Its memory-only answer snapshot clears on navigation/reset; correction must change that answer and pass shared field validation before the error clears. Regression-first CI `43947853218` reproduced the disappearing message on desktop and mobile; final CI must pass before merge. No production launch gate changed.

- #60: server validation feedback now identifies and focuses the exact visible rejected control, including field-level ARIA error association. The new browser regression failed on desktop and mobile before implementation (CI run `43943270721`); final CI remains to be checked before merge. Intake and launch gates are unchanged.

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
