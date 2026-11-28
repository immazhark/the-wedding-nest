# AUDIT-0 — The Wedding Nest

Date: 28 November 2026 (India). Step 1 only: read-only assessment of the existing site.

## Scope and evidence

Binding brief: the complete attached `DIRECTIVE-wedding-nest.md`, particularly Parts 0, A, C and H1; the latest user instruction determines sequencing. The attached additional directives were also read. This report is the specifically requested documentation exception to the read-only scope. No application files, dependencies, configuration or deployment were changed. No branch, commit, PR or release was created.

GitHub main reference inspected: `f7848a88d1c41f7eff6c5be3bb3258b793a3a98c`. This pins source evidence; it is not proof that every browser-served asset matches that commit. Local working-tree cleanliness was not freshly verified.

Methods: source inspection; current manual desktop browser walkthrough of the planner, home hero and catering hero; read-only deployment configuration inspection. No build, test, Lighthouse, axe, npm audit, curl or performance diagnostics were executed. Mobile-device, assistive-technology, network and security measurements below remain **UNVERIFIED**. Prior passing checks are not fresh audit evidence.

Inspected preview: https://the-wedding-nest.mazharkhan-it.workers.dev/ . Cloudflare currently reports `ENQUIRIES_ENABLED=false` and no Workers custom-domain entries for this service. This does not prove that no alternate DNS route exists. Source canonical is `https://theweddingnest.in`; its live redirects, ownership, indexing and headers are **UNVERIFIED**. Do not make the preview indexable to improve a score.

The browser walkthrough used fictional planning choices only. No real contact information was entered, no enquiry was submitted, and no WhatsApp/email message was sent.

## Enquiry/quotation flow — inspected first

The planner is a guided enquiry, not a binding price quotation. Keep that distinction: no invented prices, instant-quote claims or implied availability.

Observed desktop journey: occasion → scope → optional style → details → contact → review. The preview clearly discloses that sending is unavailable and offers contact skipping. Entering `3.5` guests correctly prevented continuation and focused the guest input. The explanatory error was below the visible portion of the form at that viewport, requiring scrolling to read it. Replacing this with fictional `150` allowed continuation. Review rendered the choices; copying showed an explicit success status. External contact links were inspected but not opened.

| Area | Evidence and assessment | Remaining verification |
|---|---|---|
| Phone usability | Source uses single-column responsive stages, native controls and numeric guest keyboard hints. | Actual phones, keyboard obstruction, safe areas, 360px overflow, touch spacing and tap hitboxes: **UNVERIFIED**. Desktop cannot certify mobile usability. |
| Accessibility | Fieldsets/legends, native input choices, focus movement, a skip link, error associations and live feedback exist. | Screen reader announcements, focus visibility in all states, complete tab order and numeric contrast: **UNVERIFIED**. Consent checkbox labels lack an explicit 44px minimum in the reviewed CSS. |
| Validation | Whole-number guest rejection and focus were manually observed. Source maps server field errors and distinguishes verification, conflict, throttling and retryable failures. | No blur-validation listener found; validation primarily occurs on Continue/submit. Error placement needs improvement. Live server failures were not induced. |
| Sending | Deployment is deliberately disabled; source has bounded requests, Turnstile, response validation and guarded retry states. | Real submission, verification failure, success receipt, operator access and delivery: **UNVERIFIED**, launch gates rather than observed production failures. |
| WhatsApp/email | Preview review links open generic WhatsApp and mailto destinations. A separate copy-planning action works. | Choices are not automatically included in the hand-off. Clipboard fallback was not deliberately forced. Actual external-app routing/delivery: **UNVERIFIED**. |
| Saved state | `draft.ts` allowlists nonpersonal choices, expires them after seven days and rejects malformed/future/stale drafts. Contacts, venue and notes are excluded. | Reload resumes choices at the first occasion stage rather than the last completed stage. Fresh expiry/corruption/cross-tab/private-mode tests: **UNVERIFIED**. Existing restored choices were visible, but that is not an exhaustive persistence test. |
| Recovery | Source retains form state on failure and uses a 15-second submission deadline. Copy has a manual fallback. | Full offline/429/409/verification-retry paths: **UNVERIFIED**. Planner has no native action/method fallback and relies on JS; a noscript contact alternative exists. |

Routing needs a specific decision before live launch: source public business contact is `+91 99669 73113`, while the previously selected enquiry-routing number is `+91 86867 73095`. **[NEEDS CLIENT INPUT]** Confirm enquiry-only routing. Do not globally replace the public business number without checking approved identity records. Email is `theweddingnest.events@gmail.com`.

## Provisional rubric

Scores below are reviewer judgments out of ten for the inspected desktop subset and source, not automated results, whole-site grades or evidence of mobile compliance. An unmeasured performance score prevents a weighted total.

| Category | Brief weight | Provisional score | Basis |
|---|---:|---:|---|
| Design | 30% | 7 | Distinctive serif typography, regional copy, real photography and a deliberate catering composition. Full service galleries and responsive polish remain unverified/incomplete. |
| Usability | 25% | 6 | Coherent stages and optional steps; hand-off friction, error placement and restart-on-restore weaken conversion. |
| Creativity | 20% | 6 | Arch/curtain language and food-led layout have identity; motion repeats without proven restraint or a fully assessed signature experience. |
| Performance | 15% | **UNVERIFIED** | No current Lighthouse, transfer measurements or field vitals. Authored timings and loose test ceilings are concerns, not measured failures. |
| Content/trust | 10% | 7 | Honest preview state, real imagery and no fabricated price/testimonial in the captured pages. Wider content provenance, local entity consistency and launch operations need evidence. |

Agency-grade verdict: there is an identifiable visual direction worth preserving. The two captured desktop heroes are not enough to certify an agency-grade site across services and devices. No header overlap was observed in those captures; previously reported overlap is not declared fixed across breakpoints.

## Keep list

- Existing Astro/TypeScript architecture, route structure, build isolation and working components; do not rebuild the site or change framework.
- Real event and food photographs, Fraunces/Instrument Sans pairing, restrained gold/ink treatment and authentic Hyderabad language.
- Semantic planner choices, optional budget/style steps, focus management, clear preview disclosure and copy feedback.
- Nonpersonal draft allowlist, seven-day expiry, legacy sensitive-state scrubbing and review text that excludes contact/venue/notes.
- Server origin/JSON checks, bounded request body, strict validation, Turnstile deadline, normalized idempotency and atomic enquiry/outbox write.
- Access authentication, protected operator routes, intentional preview noindex, generated sitemap exclusion and release guards.
- Existing reduced-motion branches and shared loop controller visibility/preference guards. Consolidate weaker bespoke video handling into the stronger existing approach later.

## Twenty highest-impact gaps

This is a finding inventory, not the phased PR plan reserved for Step 2. Severity describes impact if the affected feature is released; an intentional approval gate is not a defect to bypass. Effort: S = local change, M = multiple components/tests, L = operational or broader design work. Ordering is provisional severity × reach × effort, not a promise to implement.

| # | Finding / evidence status | Severity / effort | Relevant paths and consequence |
|---:|---|---|---|
| 1 | Live intake is disabled — verified configuration, intentional gate. | High / L | `src/components/planner/Planner.astro`, `wrangler.jsonc`. Conversion ends in preview until end-to-end acceptance and release approval. Do not simply flip the flag. |
| 2 | Review contact links do not carry the planning summary; routing needs confirmation. | High / M | `Planner.astro`, `src/lib/enquiry/share.ts`, `src/lib/site/config.ts`. Manual copy/paste creates friction and loses context. |
| 3 | Planner depends on JS; form has no native POST action/method. | High / M | `Planner.astro`, `src/scripts/planner.ts`. Noscript contact fallback is useful but does not preserve the guided transaction. Partial-script failure behavior is **UNVERIFIED**. |
| 4 | Error explanation was off-screen after invalid guest count; no blur validation found. | High / M | `Planner.astro` global alert after stages; `planner.ts`. Put understandable feedback with the field and retain accessible announcements. |
| 5 | Draft restore restarts at occasion. | Medium / S | `planner.ts`, `src/lib/enquiry/draft.ts`. Preserve safe choices and make resumption understandable; never persist personal fields just to resume. |
| 6 | Summary appears at review rather than helping users throughout. | Medium / M | `planner.ts` `renderSummary`, `Planner.astro`. Long journeys provide limited confirmation of prior choices. A persistent summary must remain unobtrusive on phones. |
| 7 | Consent target dimensions are not explicitly enforced. | Medium / S | `Planner.astro` `.check` and 1.15rem checkbox. Actual label hitboxes and 8px separation are **UNVERIFIED**; source concern, not a measured WCAG failure. |
| 8 | Home kitchen auto-loop lacks an explicit pause control/live preference handling. | High / M | `src/pages/index.astro` kitchen observer. Playback beyond five seconds and real reduced-motion changes require verification. |
| 9 | Bespoke door-film play promises lack the shared controller's stale-operation guards. | Medium / M | `index.astro` door handlers versus `src/scripts/loop.ts`. Pointer leave or preference changes can race async play; reproduction **UNVERIFIED**. |
| 10 | Optional application rate-limit binding is not demonstrated as installed. | High / M | `src/worker/enquiry.ts`, `wrangler.jsonc`. Provider-level controls are **UNVERIFIED**; do not claim all abuse protection is absent. Resolve before enabling public intake. |
| 11 | Email notification worker/consumer and held-item recovery are not an accepted live service. | High / L | `src/worker/index.ts`, `docs/email-notifications.md`, operator documentation. A stored enquiry/outbox row does not prove an email reached an inbox. |
| 12 | Retention execution, held-item policy and notice-version traceability remain incomplete. | High / L | `docs/privacy-retention.md`, `src/pages/privacy.astro`, worker retention helpers/migrations. Eligibility is not deletion; approved durations and scheduling need evidence. No legal-violation conclusion is made. |
| 13 | Performance gates do not enforce the attached budgets. | High / M | `tests/e2e/performance.spec.ts`: JS 180KiB/CSS 350KiB ceilings, differing accounting, limited routes. Missing hero/first-view/CWV gates. Actual budget compliance **UNVERIFIED**. |
| 14 | Possible third above-fold font face and no metric-matched fallback found. | Medium / M | `src/styles/global.css`, `src/layouts/BaseLayout.astro`, `index.astro`. Two normal faces are preloaded; italic Fraunces is also used. Actual requests/bytes and layout shift **UNVERIFIED**. |
| 15 | Hero entrance delays and optional animation scheduling need scrutiny. | High / M | `global.css`: curtain/headline/CTA authored timings exceed two seconds; `src/scripts/motion.ts` idle GSAP loading is not gated on hero decode/LCP and has no Save-Data gate. These are source timings, not measured LCP. |
| 16 | Several binding design-system requirements are absent from reviewed global styles. | Medium / L | `global.css`: hex tokens/light colour scheme; no OKLCH semantic implementation, designed dark-mode switch, forced-colors/contrast or safe-area rules found. Whole-site runtime behavior **UNVERIFIED**. Preserve current visual identity when addressing these. |
| 17 | Gallery-first journeys are not complete across offered services. | High / L | Published service catalogue/routes and service content. Catering exists; other service releases remain gated. Use approved real assets and category-specific compositions, not invented portfolio work. |
| 18 | Metadata exists, but richer page-specific/local consistency remains to verify. | Medium / M | `BaseLayout.astro`, `config.ts`, `src/lib/site/seo-files.ts`. Global social image, no reviewed WebSite/Breadcrumb helpers; live canonical/GBP consistency **UNVERIFIED**. Add only applicable truthful schema. |
| 19 | Fresh security and dead-code/dependency evidence is absent. | High / M | `package.json`, `.github/workflows/ci.yml`. No reviewed npm-audit/Lighthouse/unused-code gates. Vulnerabilities and unused packages are **UNVERIFIED**, not presumed present. GSAP is actively imported. |
| 20 | Device and assistive-technology acceptance is missing from this audit. | High / M | Planner, navigation, service media and existing e2e suite. Phone, keyboard/SR, no-JS, forced-colors, reduced-motion and failure-state execution remain **UNVERIFIED**. |

## Performance and motion budget

| Requirement | Current measurement | Source evidence / needed check |
|---|---|---|
| Mobile LCP ≤1.8s | **UNVERIFIED** | Responsive eager high-priority hero exists; animation timing is not LCP evidence. |
| INP ≤100ms | **UNVERIFIED** | Requires interaction/field evidence; a Lighthouse navigation score cannot certify INP. |
| CLS ≤0.02 | **UNVERIFIED** | Check font swap, media dimensions and stage transitions. |
| TBT ≤150ms | **UNVERIFIED** | Lighthouse lab metric; not interchangeable with INP. |
| Cached TTFB ≤400ms | **UNVERIFIED** | Repeated comparable requests/cache evidence needed; one curl timing is a sample. |
| Lighthouse Performance/Accessibility/Best Practices/SEO 100 | **UNVERIFIED** | Intentional preview noindex can affect SEO; do not weaken indexing safeguards for a score. |
| First-load JS gzip ≤90KB | **UNVERIFIED** | Current resource accounting/180KiB gate is not an equivalent gzip budget. |
| Critical inline CSS ≤14KB; total CSS ≤60KB | **UNVERIFIED** | Existing CSS ceiling is much looser. |
| Hero image ≤90KB; first view ≤500KB | **UNVERIFIED** | AVIF/WebP responsive generation and quality settings do not prove transferred sizes. |
| Above-fold fonts ≤2 files / ≤60KB | **UNVERIFIED** | Two preloads do not prove only two font downloads. |
| Reduced motion / pause after >5s | **UNVERIFIED** end to end | Source has substantial support, but bespoke home loops need attention. |

Progress-bar width is animated rather than transform-only. This is a small source-level efficiency issue, not a measured performance bottleneck. Dust animation already pauses off-screen and when hidden/reduced; keep those guards.

## SEO, content and trust

Canonical, title, description, social metadata, Organization and applicable Service JSON-LD already exist. The document declares `en-IN`. Preview robots exclusion and operator route exclusion are intentional. Source contains approved local business facts; fresh consistency with the public Google Business Profile, canonical host and real service availability is **UNVERIFIED**.

Check Hyderabad wedding catering and other genuinely offered service intents without thin cloned locality pages. Verify each published service has specific factual content, real category imagery, relevant internal links and a useful enquiry destination. Do not publish gated services or anonymized events as completed portfolio work without approval. No fake testimonials, awards, ratings, package prices or schema reviews. Multilingual copy and corresponding hreflang require approved translations/routes **[NEEDS CLIENT INPUT]**. Missing optional AI files are not evidence of a ranking defect; search visibility cannot be guaranteed.

Actual robots.txt, sitemap.xml, HTTP response headers, canonical redirects, rich-result validity and indexing status are **UNVERIFIED**. Source security headers are promising; live HSTS and other edge headers are not established. Do not enable HSTS preload without verified domain/subdomain readiness.

Dead-code inventory: **UNVERIFIED**. No package is nominated for removal from this read-only audit. Unused-dependency analysis needs the complete import graph, build integration and tests, not a name-based guess. Existing CI includes formatting, Astro/type checks, unit tests, isolated builds and browser/runtime checks; it does not establish fresh accessibility, security or budget compliance here.

## Commands for you to run

Run these yourself from the repository root in **Bash/WSL**, not unmodified PowerShell. They were not executed for this audit. Use the repository-pinned Node `24.18.0`, Chrome and npm; retain the lockfile. `npx` below fetches diagnostic tools without adding project dependencies. Never use `npm audit fix` as an audit step. Run only against the public preview shown below; do not submit real enquiries or expose credentials.

### 1. Record checkout and install locked dependencies

```bash
TWN_EVIDENCE="docs/qa/evidence/audit-0-2026-11-28"
TWN_AUDIT_URL="https://the-wedding-nest.mazharkhan-it.workers.dev"
mkdir -p "$TWN_EVIDENCE"
git status --short > "$TWN_EVIDENCE/git-status.txt"
git rev-parse HEAD > "$TWN_EVIDENCE/commit.txt"
node --version > "$TWN_EVIDENCE/node-version.txt"
npm --version > "$TWN_EVIDENCE/npm-version.txt"
npm ci
TWN_LH_VERSION="$(npm view lighthouse version)"
TWN_AXE_VERSION="$(npm view @axe-core/cli version)"
printf 'lighthouse=%s\naxe-cli=%s\n' "$TWN_LH_VERSION" "$TWN_AXE_VERSION" > "$TWN_EVIDENCE/tool-versions.txt"
```

The diagnostic tool versions are resolved once and then pinned for the run. If resolution or installation fails, paste the error; do not treat missing results as a pass. Do not overwrite unrelated local changes to match the audit commit.

### 2. Lighthouse mobile and desktop

```bash
for TWN_PAGE in home catering planner privacy; do
  case "$TWN_PAGE" in
    home) TWN_PATH=/ ;;
    catering) TWN_PATH=/services/hyderabadi-wedding-catering/ ;;
    planner) TWN_PATH=/plan-your-event/ ;;
    privacy) TWN_PATH=/privacy/ ;;
  esac
  npx --yes "lighthouse@$TWN_LH_VERSION" "$TWN_AUDIT_URL$TWN_PATH" \
    --form-factor=mobile --screenEmulation.mobile=true \
    --screenEmulation.width=360 --screenEmulation.height=800 \
    --screenEmulation.deviceScaleFactor=2 --throttling-method=simulate \
    --throttling.rttMs=150 --throttling.throughputKbps=1638.4 \
    --throttling.cpuSlowdownMultiplier=4 --chrome-flags="--headless=new" \
    --output=json --output=html \
    --output-path="$TWN_EVIDENCE/lighthouse-$TWN_PAGE-mobile"
  npx --yes "lighthouse@$TWN_LH_VERSION" "$TWN_AUDIT_URL$TWN_PATH" \
    --preset=desktop --chrome-flags="--headless=new" \
    --output=json --output=html \
    --output-path="$TWN_EVIDENCE/lighthouse-$TWN_PAGE-desktop"
done
```

Keep the run profile with the results. These explicit mobile settings are a reproducible lab approximation, not a physical midrange phone or field p75. For borderline results repeat three times into separately named files and report all three plus the median. Do not report Lighthouse TBT as INP. First-view bytes, gzip JS, font requests and hero size also need the network/resource details, not just the category score.

### 3. axe accessibility scan

```bash
for TWN_PAGE in home catering planner privacy; do
  case "$TWN_PAGE" in
    home) TWN_PATH=/ ;;
    catering) TWN_PATH=/services/hyderabadi-wedding-catering/ ;;
    planner) TWN_PATH=/plan-your-event/ ;;
    privacy) TWN_PATH=/privacy/ ;;
  esac
  npx --yes "@axe-core/cli@$TWN_AXE_VERSION" "$TWN_AUDIT_URL$TWN_PATH" \
    --tags wcag2a,wcag2aa,wcag21a,wcag21aa,wcag22aa \
    --dir "$TWN_EVIDENCE" --save "axe-$TWN_PAGE.json" --exit
  TWN_AXE_EXIT=$?
  printf '%s exit=%s\n' "$TWN_PAGE" "$TWN_AXE_EXIT" >> "$TWN_EVIDENCE/axe-exits.txt"
done
```

Chrome/WebDriver must be available. A driver failure is **UNVERIFIED**, not zero violations. This scans initial page states, not all planner stages, mobile states or screen-reader behavior. Review `incomplete` checks manually as well as violations; do not suppress rules to obtain green output.

### 4. Dependency audit

```bash
npm audit --json > "$TWN_EVIDENCE/npm-audit-all.json"
TWN_AUDIT_EXIT=$?
printf 'all exit=%s\n' "$TWN_AUDIT_EXIT" > "$TWN_EVIDENCE/npm-audit-exits.txt"
npm audit --omit=dev --json > "$TWN_EVIDENCE/npm-audit-production.json"
TWN_AUDIT_EXIT=$?
printf 'production exit=%s\n' "$TWN_AUDIT_EXIT" >> "$TWN_EVIDENCE/npm-audit-exits.txt"
```

Nonzero audit status may mean findings or a registry/network failure; inspect the JSON. Assess actual reachable impact, dependency path and fix compatibility before any upgrade.

### 5. Deployed headers, robots, sitemap and timing samples

```bash
curl -sS -I -L --max-redirs 5 --compressed "$TWN_AUDIT_URL/" > "$TWN_EVIDENCE/headers-home.txt"
curl -sS -I -L --max-redirs 5 --compressed "$TWN_AUDIT_URL/plan-your-event/" > "$TWN_EVIDENCE/headers-planner.txt"
curl -sS -D "$TWN_EVIDENCE/headers-robots.txt" "$TWN_AUDIT_URL/robots.txt" -o "$TWN_EVIDENCE/robots.txt"
curl -sS -D "$TWN_EVIDENCE/headers-sitemap.txt" "$TWN_AUDIT_URL/sitemap.xml" -o "$TWN_EVIDENCE/sitemap.xml"
curl -sS -I -L --max-redirs 5 https://theweddingnest.in/ > "$TWN_EVIDENCE/headers-canonical.txt"
curl -sS -I -L --max-redirs 5 https://www.theweddingnest.in/ > "$TWN_EVIDENCE/headers-www.txt"
curl -sS -I -L --max-redirs 5 http://theweddingnest.in/ > "$TWN_EVIDENCE/headers-http.txt"
for TWN_RUN in 1 2 3; do
  curl -sS --compressed -o /dev/null \
    -w 'http=%{http_code} ttfb=%{time_starttransfer} total=%{time_total} effective=%{url_effective}\n' \
    "$TWN_AUDIT_URL/" >> "$TWN_EVIDENCE/timing-home.txt"
done
```

Do not add `-k` to bypass certificate failures. Preserve errors and redirect chains. HEAD can differ from GET; robots/sitemap commands therefore capture GET headers too. These timing samples do not certify cached TTFB or field performance. A canonical-host failure is useful evidence, not authorization to alter DNS.

### 6. Existing project verification, separately from deployed measurements

```bash
npm run format:check
npm run check
npm test
npm run build
npm run build:submit
npm run test:e2e
npm run test:runtime
npm run test:editorial-fixtures
npm run test:e2e:cross
```

Use the existing isolated/local test configuration and fictional data. If Playwright browsers or runtime prerequisites are missing, paste that specific failure; do not run submission tests against production. These commands are verification instructions, not a claim they passed here. Secret scanning, broader security scanning, unused-code analysis and full Part E acceptance remain **UNVERIFIED**; do not infer completion from npm audit alone.

## Manual verification and what to paste back

1. Attach Lighthouse JSON/HTML reports, tool versions, checkout SHA and any command errors. At minimum paste four category scores, LCP, CLS, TBT, resource totals and run profile per page. INP remains **UNVERIFIED** until genuine interaction/field evidence exists.
2. Attach axe JSON and exit codes; include rule IDs, affected elements, impact and incomplete checks. Initial-page passes do not clear later planner stages.
3. Paste npm audit vulnerability summaries, affected dependency paths and whether proposed fixes are breaking. Include registry errors. Do not paste credentials, environment files, tokens or customer data.
4. Paste curl output after redacting `Set-Cookie` values and other private identifiers; include status, redirect Location, cache headers, compression, content type, CSP, HSTS, robots and sitemap results. Include failures, not only successful responses.
5. On a real phone, walk every planner stage with fictional data: narrow viewport/keyboard, back/edit, invalid guest count, consent, review, copy and external app opening without sending. Test nonpersonal draft reload/reset; confirm contact, venue and notes never reappear from storage. Record browser/device, viewport and exact failing step. Check 360/768/1280/1920 widths, keyboard-only and screen-reader operation, reduced motion enabled before load and toggled while media plays, forced colors, 200% text/zoom, no-JS fallback and offline recovery. Larger/4K views and actual low-end/iPhone devices remain pending until inspected.

Live submission/Turnstile failures, authenticated operator create/list/detail/status/audit, email receipt, notification recovery and retention execution need a separately authorized isolated acceptance run. Do not send real customer enquiries merely to generate evidence.

## Evidence appendix and stop point

Current desktop captures were inspected during this audit: planner entry, guest-validation state, review/copy success, home hero and catering hero. They demonstrate only those states. Internal capture names: `01-planner-entry.jpg`, `02-guest-validation.jpg`, `03-review-copy.jpg`, `04-home-hero.jpg`, `05-catering-hero.jpg`; stored in `/workspace/shared/TWN_AUDIT0/` for this workspace, not committed as repository assets. No mobile screenshots or measured visual-diff baseline exists for this run.

Official reference points: [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse/blob/main/readme.md), [axe CLI](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/cli), [Web Vitals measurement](https://web.dev/articles/vitals), [Google Search AI features guidance](https://developers.google.com/search/docs/appearance/ai-features). Lab, manual and field evidence are distinct.

**Stop here.** Step 2's ranked phased PR plan, ten-detail wow-gap list and signature-moment proposal are intentionally deferred to preserve the user's step boundary. No implementation is approved by this audit. Remaining client inputs: enquiry-only routing, approved service/gallery materials, any multilingual scope and operational retention/notification decisions. No fabricated content will fill those gaps.
