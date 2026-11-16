# Project progress — reconciled 16 November 2026

Current state first. GitHub and Cloudflare live records remain authoritative for commits, checks and exact deployed versions. This snapshot is not a production-launch approval.

**Repository baseline at this update:** `main` at `7a5a63423f5ebdfb0c941c7645ec844d6e6b0aa4` (PR #37), preceded by `890476e8e6be0449e3083c723d14aeec36bc3ccb` (PR #38). Both PR heads passed the complete CI suite before merging. Post-merge runs may still be in progress; check Actions before claiming a passing `main`.

## Current implementation

| Area | State |
| --- | --- |
| Website | Astro 7, strict TypeScript and Tailwind 4. Homepage, five-stage planner, review/confirmation and 404. Creative pass 1 and official logo approved; photography and public claims remain gated. |
| Main preview | https://the-wedding-nest.mazharkhan-it.workers.dev/ — intake disabled, no D1 binding, noindex, no custom domain. |
| Branch previews | Fixed in #11. Wrangler declares explicit preview-safe variables; enquiry intake stays off. Branch URLs are temporary and may disappear after merge. |
| Isolated staging | https://the-wedding-nest-staging.mazharkhan-it.workers.dev/ — isolated APAC D1, public Turnstile test keys, exact staging Origin allow-list and fictional-data-only notice. |
| Enquiry reliability | Server-side Turnstile fetch and JSON consumption have a 10-second deadline; timeout returns retryable 503 before any write. Browser script loading also has a 10-second deadline, cleans failed scripts and retries through Back → Review. Late script loads cannot render hidden review widgets. |
| Privacy | Browser drafts exclude names, numbers, locations, notes and consent. Enquiries and an outbox event are stored atomically. No lead notifications or marketing are sent. Production retention and recipient decisions remain open. |
| CI | Formatting, strict type checks, unit tests, production/test builds, desktop/mobile Playwright and axe, and the local Cloudflare Workers runtime. Separate deployed staging browser tests use real dummy-key verification and the live API without mocks. |
| Release gates | Production domain, indexing, real enquiry intake and unapproved business content remain owner-gated. |
**Authentic media:** Build-time exact photo/manifest pairing with permission and private release references. PR #37 rejects unreviewed files of normally enumerated types from the event directory; no approved event originals are yet published.

**SEO foundation:** Canonicals, robots, launch-gated sitemap and verified Organization JSON-LD (#38). Unapproved LocalBusiness details, reviews, ratings and contact facts are not added.

## Latest work

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

1. Verify post-merge `main` CI and the actual Cloudflare worker versions, then check the noindex/intake-off gates. The main and staging workers have separate bindings; keep production intake disabled.
2. Obtain exact business-owner approval of original event photographs, usage permissions and individual testimonials before publishing any of them. Existing image placeholders are deliberately honest.
3. Resolve [launch-decisions.md](launch-decisions.md): named lead-response owner, notification destination, privacy contact, data retention policy and verified service/contact details. Until then, the outbox remains unsent and production lead collection disabled.
4. Independently review the final responsive/cinematic creative result using approved photography, measurable accessibility/performance, and the Cloudflare preview before permitting any domain, indexing or real-enquiry activation.

## Verification commands

- `npm run verify`: full project checks, including local browser and Workers-runtime suites.
- `python scripts/verify_staging.py`: Python 3 + curl; fictional data only, live HTTP guards, durable creation and duplicate retry.
- `npx playwright test --config playwright.staging.config.ts`: real deployed desktop/mobile submission against the separate staging Worker.

The cloud browser previously reached staging review but could not complete loading the external verification script. GitHub's actual deployed desktop/mobile tests passed; the browser deadline now prevents an endless wait in that failure mode.

## Earlier milestones

#1 tooling; #2 handover; #3 scaffold/planner; #4 standing merge authorisation; #5 review follow-up; #6 enquiry API; #7 approved creative pass/logo; #8 gated Send step; #9 authentic testimonial policy.

Initial tooling restrictions and scaffold-only handover reports are historical. Cloudflare MCP is connected; no Cloudflare credentials are committed to GitHub.
