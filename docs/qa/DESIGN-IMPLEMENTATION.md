# Design and engineering — living implementation matrix

28 November 2026 · source baseline `f7848a8` · current phase: directive persistence.

Application measurements are deliberately deferred by the owner. This document does not mark them waived or substitute source presence for runtime evidence.

**Motion/resource phase checkpoint:** `fix/home-loop-lifecycle` reuses the shared controller for the home kitchen and adds a native Pause/Play control. Shared loops stop for hidden documents and Save-Data where supported; reduced-motion/live preference and stale-play guards remain. Two regression failures reproduced before implementation;10 focused loop tests and full369-unit suite now pass with clean type check. Browser/rendered playback, byte/CWV savings and device acceptance remain UNVERIFIED. No measured performance benefit or final programme completion is claimed.

**Accessibility/enquiry phase checkpoint:** branch `fix/planner-inline-validation` follows security PR #180; persistence #179 is merged (`3fe1df6`, four hosted checks green). Field-local errors, independent after-blur validation/correction, preserved help IDs, guarded first-error focus and44px consent-label sizing are implemented. Three new unit cases failed before helper implementation; full366-unit suite and clean Astro/type check now pass. Five browser regressions were added but not executed locally because Chromium binary is absent. Inline rendered visibility/focus announcements/touch geometry remain Implemented—UNVERIFIED until those tests/manual checks run. No new overall design/a11y/performance score is assigned.

**Latest authorization/checkpoint:** owner's subsequent “Continue autonomous execution” instruction authorizes source implementation passes; earlier pending plan-approval entries describe the persistence checkpoint. Phase1 `fix/enquiry-verification-response` adds a Siteverify HTTP-success guard. Four new regressions reproduced201 instead of503 on upstream400/429/500/503; full unit suite now363/363 passes, type check clean, format and standard build pass. This is unit/build evidence only; real provider/runtime/measurement acceptance remains UNVERIFIED. No change to held limiter #64 or production gates. Update affected row09.4/13.4 evidence by this checkpoint without asserting all security requirements are verified.

Read [the full directive](../directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md), [reconciliation](../directives/EXECUTION.md), [DESIGN](../../DESIGN.md), [audit](AUDIT-0.md) and [phase plan](IMPLEMENTATION-PLAN-1.md). This is the shared implementation register, not another audit.

**Status vocabulary:** Verified = named evidence actually inspected/executed for the stated scope; Implemented—UNVERIFIED = source/document exists without required acceptance; Partial = some requirements implemented; Missing = source gap identified; Pending = not executed; Blocked = named prerequisite; Conditional = apply only if justified; N/A = explicit exclusion. Document checks never certify app behavior. Prior CI is historical evidence, not a fresh run.

**Priority:** P0 safety/truth/release blockers; P1 primary journey, accessibility, reliability; P2 visual/product quality; P3 optional enhancement. Locations without full paths refer to existing repo components or documentation listed in the audit; an intended location is not an implementation assertion.

## Requirement register

| ID | Actionable requirement | Applicability / location | Priority | Status | Evidence / next verification |
|---|---|---|---|---|---|
| 01.1 | Brownfield preservation: functionality, business rules, security, accessibility, maintainability | All | P0 | Partial | Existing Astro/Worker architecture; per-change regression proof required |
| 01.2 | Execute reconciled authorized work rather than repeat planning | Current persistence phase | P1 | Implemented—UNVERIFIED | Directive/entrypoint changes prepared; commit and remote PR pending |
| 02.1 | Inspect branch/main/tree/commits/open PRs and synchronize safely | Git/GitHub | P0 | Verified | main f7848a8; ff-only pull up to date; only held draft #64 returned; prior untracked docs preserved |
| 02.2 | Read agent, README, product/design, tooling, QA and handoff context | Agent files; docs/directives/EXECUTION.md | P0 | Verified | Attachment1–17, owner18–19, prior rulebook/audit/plan, entrypoints, README, decisions, product/tooling, current progress, creative/Grand Entrance/launch docs inspected |
| 02.3 | Classify requirements and preserve stricter instructions | This matrix; EXECUTION.md | P0 | Partial | Initial matrix established; application acceptance remains pending |
| 02.4 | Preserve completed work, approved facts and concurrent changes | All diffs | P0 | Partial | No application changes in this phase; no resets/overwrites |
| 02.5 | Synchronize and isolate branches; never reset others | Git/PR workflow | P0 | Verified | Dedicated docs/master-design-directive branch from current main |
| 03.1 | Pivot blockers with one integration owner | HANDOFF; progress | P1 | Partial | Root integration writer; rate-limit entitlement stays held; authorized persistence advanced |
| 03.2 | Parallel independent specialists; avoid repeated questions and excessive administration | Collaboration | P2 | Verified | One bounded read-only traceability specialist; root sole writer |
| 03.3 | Batch safe changes and avoid unnecessary cost/deploys | PR/deployment workflow | P1 | Partial | No paid tool, new dependency or deployment requested; future phases must follow |
| 03.4 | Truthful tests/scores/deployment/completion | QA records | P0 | Partial | Fresh LH/axe/runtime deferred; no new PASS/score/deployment claimed |
| 03.5 | Respect merge/security/release/acceptance gates | EXECUTION; CLAUDE; launch decisions | P0 | Implemented—UNVERIFIED | Rules preserved in entrypoints; future agent compliance not mechanically guaranteed |
| 04.1 | Research relevant visual references before significant visual changes | Creative research/Grand Entrance record | P2 | Pending | Prior competitor observations retained; no new public design implemented this phase |
| 04.2 | Use authoritative UX/accessibility/platform references | EXECUTION research record | P1 | Partial | Current MDN corner-shape/speculation and GOV.UK errors researched; rendered applicability pending |
| 04.3 | Evaluate relevant approved skills and repository tools | engineering-tooling; project skills | P2 | Partial | Existing project design review and process skills read; declarations are not runtime proof |
| 04.4 | Review existing libraries before adoption; prefer native | package/lockfile; tooling policy | P1 | Partial | No new dependency; existing selective GSAP remains |
| 04.5 | Review source/licence/security/maintenance/compatibility/bytes before addition | Dependency decisions | P0 | Pending | No adoption proposed; prerequisite for future additions |
| 04.6 | Extract principles without copying brand/assets | DESIGN; asset permissions | P0 | Pending | No new visual composition or third-party assets added |
| 05.1 | Independent TWN cinematic Hyderabadi editorial art direction | DESIGN; Grand Entrance | P1 | Partial | Approved Grand Entrance retained; proposed refinement not approved |
| 05.2 | Semantic colour tokens and functional accents | global.css; DESIGN | P1 | Partial | Hex palette exists; OKLCH/theme refinements pending |
| 05.3 | Responsive typography scale | global.css | P1 | Partial | Fluid typography exists; all widths UNVERIFIED |
| 05.4 | Grid, widths, spacing rhythm | global.css; page components | P1 | Partial | Existing editorial layout; all-page consistency UNVERIFIED |
| 05.5 | Iconography, borders, shadows, radii | Shared components; DESIGN | P2 | Pending | Per-component inventory and render critique required |
| 05.6 | Real photography/illustration direction | photography-brief; media inventory | P1 | Partial | Approved assets and permission gates exist; new material requires approval |
| 05.7 | Component variants and all applicable states | Planner/nav/gallery/operator components | P1 | Partial | Existing states; comprehensive inventory pending |
| 05.8 | Motion durations/easings/reduced-motion rules | global.css; motion.ts; loop.ts | P1 | Partial | Home kitchen now shares guarded loops/pause control; hidden/Save-Data lifecycle unit-verified; service-door handlers and rendered acceptance remain pending |
| 05.9 | Mobile/tablet/desktop behavior and content tone | DESIGN; product direction | P1 | Partial | Documented; fresh responsive acceptance UNVERIFIED |
| 05.10 | Persist brand language without same visual skin across four sites | DESIGN | P1 | Implemented—UNVERIFIED | Index and constraints written; future rendering not established |
| 06.1 | Audit public and administrative surfaces for generic patterns | AUDIT-0; public/operator routes | P2 | Partial | Current manual sample home/catering/planner desktop; admin visual audit pending |
| 06.2 | Remove redundant badges/labels/vague headlines/decorative icons and filler | Affected components only | P2 | Pending | Do not remove legitimate information by style preference |
| 06.3 | Avoid gradients/glow/glass/card grids/excess wrappers/centered monotony | Page art direction | P2 | Pending | Evidence-based critique before local changes; preserve approved direction |
| 06.4 | Hierarchy/proximity/whitespace/contrast/optical alignment/authentic imagery | Shared layout and pages | P1 | Partial | Existing subset inspected; full visual/contrast evidence missing |
| 06.5 | Concentric radii, balanced headlines, mixed-size/numeric alignment | Typography/component tokens | P2 | Partial | Headline balancing exists; rest evaluated in technique register |
| 06.6 | Every decoration has a defensible purpose | DESIGN; critique | P2 | Pending | One-signature/three-delight policy; inventory actual effects before edits |
| 07.1 | Real mobile journey at 320/360/375/390/414/430/768/1024/1440 plus existing1280/1920 | e2e/manual device QA | P1 | Pending | Historical tests exist; fresh run UNVERIFIED |
| 07.2 | 44–48px targets, 8px spacing, thumb reach | Planner/nav/CTAs | P1 | Partial | Consent label44px minimum and padding added; new browser geometry regression unrun locally; other target geometry UNVERIFIED |
| 07.3 | Safe area/dynamic viewport handling | Global/sticky controls | P1 | Missing | No safe-area rules in reviewed global styles; actual device acceptance UNVERIFIED |
| 07.4 | Correct type/inputmode/autocomplete/enterkeyhint and keyboard-friendly forms | Planner.astro | P1 | Partial | Native controls and some hints exist; field inventory pending |
| 07.5 | Sticky controls never obscure content/focus/browser keyboard | Header/planner/mobile actions | P0 | Pending | Full viewport/keyboard acceptance UNVERIFIED |
| 07.6 | Native scroll/back/navigation/dialog/scroll restoration | Nav/planner/gallery | P1 | Partial | Existing native behaviors; complete acceptance pending |
| 07.7 | Never disable pinch zoom | BaseLayout viewport contract | P0 | Pending | Per-phase source/device check required; no change authorized to restrict zoom |
| 07.8 | Alternatives for hover/drag/swipe/gestures | Gallery/nav/media | P1 | Partial | Gallery buttons/keyboard support exist; full parity pending |
| 07.9 | Accessible OTP autofill where application owns auth | Cloudflare Access | P2 | N/A | No application-owned OTP field; do not replace hosted auth to satisfy checklist |
| 07.10 | Slow-network/low-power usable journey | Critical path/planner/media | P1 | Pending | Fresh network/device measurements UNVERIFIED |
| 08.1 | Approved fonts, line height, semantics and contrast | Global typography/layout | P1 | Partial | Two families exist; measured contrast UNVERIFIED |
| 08.2 | Fluid balanced type/localized numbers/currency/tabular data | Planner/operator/styles | P2 | Partial | Balance/fluid rules exist; numeric/localization inventory pending |
| 08.3 | Precise labels/copy; restrained capitals/italics/readability | Content and components | P1 | Partial | Some real regional copy exists; full review pending |
| 08.4 | Font subsets/formats/loading/fallback metrics | BaseLayout/global.css | P1 | Partial | Self-host/preloads; actual file count/bytes and metric fallbacks pending |
| 08.5 | No invented reviews/facts/prices/availability/owner content | All content/schema | P0 | Partial | Publication gates exist; per-content provenance remains required |
| 09.1 | All applicable interactive states | Planner/nav/gallery/operator | P1 | Partial | State inventory pending; no artificial states for noninteractive elements |
| 09.2 | Fast truthful feedback/skeletons/stable placeholders/error recovery/retries | Planner/media/operator | P1 | Partial | Field-local after-blur errors and independent correction added; unit logic verified; browser/SR acceptance pending. Existing copy/submission states retained |
| 09.3 | Optimistic changes only reversible/low-risk with reconciliation/rollback | Local planner state | P1 | Conditional | No optimistic enquiry/booking/payment/delivery confirmation; see technique register |
| 09.4 | Prevent duplicates; idempotency/server validation | enquiry.ts; submit.ts | P0 | Implemented—UNVERIFIED | Existing safeguards; current isolated runtime tests deferred |
| 09.5 | Persist only safe non-sensitive progress | draft.ts; share.ts | P0 | Implemented—UNVERIFIED | Allowlist/expiry source; full current storage/expiry test execution deferred |
| 09.6 | Appropriate SWR/static rendering/cache/prefetch | Astro/headers/navigation | P1 | Partial | Static-first exists; never cache private enquiry/operator responses |
| 09.7 | Evaluate shortcuts/palette/undo/sheets/advanced menu interactions | Technique register | P2 | Verified | Applicability decisions recorded, not implementation claims |
| 10.1 | Motion explains state/hierarchy/causality/story | Motion inventory | P2 | Partial | Existing choreography; fresh critique pending |
| 10.2 | Shared durations/easings; interruptible/reversible motion | Global tokens/controllers | P1 | Partial | Home kitchen consolidated onto shared generation guards; hidden/Save-Data regressions pass; no universal or rendered guarantee |
| 10.3 | Opacity/transform; avoid thrash/loops/excess layers | global.css/motion handlers | P1 | Partial | Progress width animation and home loops need targeted work |
| 10.4 | CSS/native transitions with support/static fallback | Global/motion/gallery | P1 | Partial | Existing progressive transitions; current browser acceptance UNVERIFIED |
| 10.5 | GSAP only justified; no redundant animation stack | motion.ts; dependency policy | P1 | Partial | Existing GSAP use; current byte and interaction budget unmeasured |
| 10.6 | Evaluate Motion for React only when architecture warrants | Dependency decision | P2 | N/A | No new React island need established |
| 10.7 | Reduced motion throughout CSS/JS, all content usable | Home/shared media/styles | P0 | Partial | Home kitchen uses shared live reduced-motion guard and poster; loop unit cases pass; browser/SR and other home media acceptance pending |
| 10.8 | No scroll hijack/forced splash/hidden content/navigation delay/transaction spectacle | Home/nav/planner | P0 | Partial | Hero authored visibility delay is a finding; do not introduce more |
| 11A | Amaana-specific donations/identity/financial rules | Other repository | P0 | N/A | Preserve original directive text; no Amaana changes in TWN |
| 11B | Cakeopedia options/pricing/allergens/enquiries | Other repository | P0 | N/A | No Cakeopedia changes in TWN |
| 11C | Moin commerce/cart/weight/strict speed | Other repository | P0 | N/A | No Moin changes in TWN |
| 11D.1 | Guided enquiry as primary conversion, no invented instant quote | Planner/contact | P1 | Partial | Existing guided flow; intake intentionally off; hand-off friction |
| 11D.2 | Elevate home/hero/services/portfolio/stories/testimonials/consultation/mobile | Public routes | P2 | Partial | Catering published; other gallery source exists but approvals pending |
| 11D.3 | Authentic photos and approved positioning/routing/privacy/service facts | Content/config/policy | P0 | Partial | Owner decisions recorded; no synthetic substitutions |
| 11D.4 | Ambitious original compositions/masks/spatial/media/scroll story within limits | DESIGN/Grand Entrance | P2 | Pending | Substantial creative changes require reviewable preview and approval |
| 12.1 | Stricter TWN byte/CWV/Lighthouse targets; distinguish lab/field | DESIGN; AUDIT-0; performance tests | P0 | Partial | Enforcement mismatches identified; all fresh metrics UNVERIFIED |
| 12.2 | WCAG2.2AA semantics/names/focus/contrast/keyboard/errors/announcements/alternatives | Public/operator UI | P0 | Partial | No fresh compliance claim |
| 12.3 | Responsive images/dimensions/LCP priority/lazy loading | Frame/BaseLayout/home | P1 | Partial | Good source patterns; transfers and LCP UNVERIFIED |
| 12.4 | Fonts/splitting/hydration/cache/query/third-party efficiency | Build/layout/Worker | P1 | Partial | Profile and preserve working optimizations |
| 12.5 | Remove only proven redundant dependencies; avoid duplicate libraries | Import graph/package/lockfile | P2 | Pending | Unused-code scan UNVERIFIED; no speculative deletion |
| 12.6 | Slow connection/partial-feature fallback | Planner/static content | P1 | Partial | Noscript contacts; native form POST gap remains |
| 13.1 | Defensive type-safe modular efficient production code | Application changes | P0 | Pending | No application code changed in persistence phase |
| 13.2 | Avoid quadratic work/repeated queries/recomputation/leaks/async races | Worker/controllers | P1 | Partial | Bounded data paths exist; bespoke async risks noted |
| 13.3 | No TODO/fake/silent suppression/unnecessary abstractions | Changed-file review | P0 | Pending | Apply to each implementation diff |
| 13.4 | Preserve auth/privacy/validation/transaction/SEO/schema/analytics/business logic | Existing architecture | P0 | Partial | Documentation phase preserves application tree |
| 13.5 | Focused regression tests/TDD where practical; never weaken guarantees | Existing unit/e2e suite | P1 | Pending | Application phase not started; docs verified separately |
| 14.1 | Reconcile/prioritize P0/P1/P2/extend foundations | Matrix/plan | P1 | Partial | Initial priority and stage reconciliation recorded |
| 14.2 | Primary journey/mobile/a11y/perf/composition/delight/critique sequence | IMPLEMENTATION-PLAN-1 | P1 | Pending | Earlier stricter security-first sequence retained; approval boundary intact |
| 14.3 | Incremental work/no rewrite/continue independent work if diagnostics unavailable | All phases | P0 | Partial | Immediate persistence work performed; diagnostics stay deferred |
| 14.4 | Evidence and release under authorization | Release gates | P0 | Blocked | Fresh acceptance and separate owner release approvals outstanding |
| 15.1 | Actual rendered before/after mobile/desktop captures | Browser QA | P1 | Pending | Prior audit desktop before captures only; no new visual change to capture here |
| 15.2 | Primary/edge/duplicate/network/keyboard/motion/recovery tests | Unit/e2e/manual | P0 | Pending | Fresh application runtime execution deferred |
| 15.3 | Build/lint/types/unit/integration/Playwright/axe/audit/Lighthouse | Existing checks/QA | P1 | Pending | Run applicable commands per phase; no inferred pass |
| 15.4 | Nine-category weighted95 target and originalB3≥9/category | QA critique | P2 | Pending | No unsupported score; stricter thresholds preserved |
| 15.5 | Security/functional/a11y blockers trump visual score | Release gate | P0 | Implemented—UNVERIFIED | Explicit permanent rule; execution enforcement remains procedural |
| 15.6 | Critique/refine first render | Each visual phase | P1 | Pending | No public visual implementation this phase |
| 16.1 | Use existing equivalents for design/audit/status/handoff | DESIGN; AUDIT-0; matrix; HANDOFF | P1 | Partial | Additive index/matrix; avoid a second redundant audit document |
| 16.2 | Record decisions/adoptions/rejections/budgets/evidence/blockers | decisions; EXECUTION; matrix | P1 | Partial | Initial record written; living updates required |
| 16.3 | Accurate PR/commit/deployment reports | Progress/handoff/final | P0 | Pending | Remote persistence and required checks must be confirmed |
| 17.1 | Immediate authorized execution rather than theory-only response | Persistence branch | P1 | Partial | Files changed; application phases remain subject to explicit gates |
| 18.1 | Every requirement traceable: applicability/location/priority/status/evidence | This matrix | P1 | Partial | Initial granular section register; no blanket coverage acceptance claimed |
| 18.2 | Evaluate named techniques/value/exclusions | Technique register | P1 | Verified | All named techniques evaluated below; implementation status separate |
| 18.3 | Independent research beyond fixed list | EXECUTION research record | P2 | Partial | Platform/UX primary references researched; broader creative research waits for visual task |
| 18.4 | Research→design→implement→render→critique→refine→optimize→verify | Each visual phase | P1 | Pending | Mandatory workflow; not all steps performed for application yet |
| 18.5 | Creative director/UX/architect/mobile critique | QA evidence | P1 | Pending | Specialist matrix review only; not rendered creative approval |
| 18.6 | Preserve approved rules/work; no bypass/fake completion | Entire programme | P0 | Partial | Precedence and evidence boundaries explicit |
| 19.1 | Persist complete directive1–19 | docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md | P0 | Partial | Local exact source preservation and ordered1–19 assertions passed; remote integration pending |
| 19.2 | Both agent entrypoints mandate full session-start read | AGENTS.md; CLAUDE.md | P0 | Verified | Both entrypoint reference/link assertions passed; future agent adherence remains procedural |
| 19.3 | Integrate design/engineering/architecture/QA without duplication | DESIGN; tooling; decisions; matrix | P1 | Implemented—UNVERIFIED | Additive pointers and scoped decision; no app architecture replaced |
| 19.4 | Session sync/progress/verified milestone/standards/no regressions | Entry files; HANDOFF | P0 | Partial | Current session reconciled; future session compliance procedural |
| 19.5 | All agents share canonical truth | Directive; matrix; progress | P0 | Implemented—UNVERIFIED | Shared paths; remote persistence pending |
| 19.6 | Protect directive; authorize/log material amendments; controlled nonweakening improvements | EXECUTION; decisions | P0 | Implemented—UNVERIFIED | Amendment policy explicit; owner-controlled process |
| 19.7 | Living statuses and institutional knowledge without repeated owner pasting | Matrix; HANDOFF; progress | P1 | Partial | Initial checkpoint; future meaningful updates required |

## Advanced-technique decisions

These decisions evaluate usefulness; they are not evidence that every technique is implemented. Revisit a conditional/excluded decision only when a concrete user task or architecture change justifies it.

| Technique | Applicability / decision | Implementation location | Priority / status | Verification evidence or next check |
|---|---|---|---|---|
| BlurHash / equivalent placeholders | Use the lightest stable dominant-colour/poster treatment that suits real assets; no decoder dependency by default. | `src/components/media/Frame.astro`, media styles | P2 / Conditional | Audit current placeholder behavior, slow-image layout and bytes; UNVERIFIED. |
| Continuous corners | Optional CSS enhancement only; ordinary radius fallback is sufficient and readable. Limited browser availability is not a reason for a polyfill. | Shared control styles | P3 / Deferred | MDN reference in execution record; browser/render/forced-colors checks pending. |
| Concentric radii | Apply where controls/panels are genuinely nested, subtracting padding for inner radius; do not add card wrappers to use it. | Component radius tokens | P2 / Pending | Optical alignment snapshots at actual sizes. |
| Balanced headlines | Preserve existing balance/fluid rules and tune real copy at narrow widths. | `src/styles/global.css`, page headings | P2 / Partial | Source presence; current 320–1920 wrapping UNVERIFIED. |
| Tabular numbers | Useful for guest counts and operator numeric columns; use locale-aware presentation where needed. Never invent prices. | Planner/operator typography | P2 / Conditional | Compare readability/alignment with real fixture data. |
| Interruptible animations | Required for rapidly changing selection/hover states and asynchronous video playback. Reuse stronger shared lifecycle guards. | `src/scripts/loop.ts`, home handlers, motion tokens | P1 / Partial | Rapid enter/leave, preference/visibility toggles, stale promise tests pending. |
| Optimistic updates | Local planning choices may update immediately; network operations require reversal/reconciliation. Never optimistically confirm intake, booking, payment, provider receipt or authoritative operator status. | Planner local state; operator actions | P0 / Conditional | Test rollback/server truth before any network optimism. |
| Undo feedback | Consider only reversible local reset; clear confirmation may be simpler. Server deletion, sends and retention are not UI-undo candidates. | Planner reset | P2 / Deferred | Establish accidental-reset problem, privacy-safe restore and keyboard behavior first. |
| Safe-area insets | Apply to actual fixed/sticky phone controls without adding unnecessary padding everywhere. | Header/mobile action styles | P1 / Missing reviewed source support | Real iPhone notch/orientation/keyboard acceptance UNVERIFIED. |
| Expanded touch targets | Required across primary controls; preserve native semantics and ≥8px separation. | Planner choices/consent/nav/CTAs | P1 / Partial | Measure ≥44px hit regions and focus clearance. |
| OTP autofill | N/A to app-owned public fields: authentication is Cloudflare Access-hosted. Do not create a replacement OTP form. | Hosted Access boundary | P2 / N/A | If app-owned OTP is later approved, require `autocomplete=one-time-code`, paste and accessible input. |
| Predictive navigation | Existing intent prefetch should be assessed first. Same-origin public GET routes only; respect constrained connections. No sensitive, operator, transaction or external message speculation. | `src/scripts/arrive.ts`, public nav | P3 / Partial | Existing prefetch source; current bytes/usefulness/connection behavior UNVERIFIED. |
| Accessible gesture alternatives | Required if hover/drag/swipe is offered; existing gallery buttons and keyboard path are the baseline. | Gallery/nav/media | P1 / Partial | Touch/keyboard/click parity, focus return and no-JS fallback checks. |
| View transitions | Existing cross-document progression must keep native links/back and reduced-motion/static fallback. New gallery transitions optional. | Global/navigation/gallery | P2 / Partial | Existing source/history; current browser behavior UNVERIFIED. |
| Idempotency keys | Existing enquiry server protection must remain; no repeat-submission workaround that changes server truth. | `src/worker/enquiry.ts`, submit helpers | P0 / Implemented—UNVERIFIED | Current duplicate/retry integration execution deferred; source protection exists. |
| Stale-while-revalidate | Conditional on public cache semantics; never serve stale private enquiries/operator/auth responses or cache errors with sensitive data. | Generated asset headers/Worker routes | P1 / Conditional | Live cache/status/header behavior UNVERIFIED; immutable hashed assets are a different policy. |
| Pre-rendering | Preserve Astro build-time static pages. Browser speculative prerender is a separate optional technique, not required for this label. | `astro.config.mjs`, routes | P1 / Implemented—UNVERIFIED | Existing static configuration; fresh build not run for documentation. |
| Keyboard shortcuts | Keep browser shortcuts and gallery arrows/Escape. No public command palette or global printable-key interception. Operator shortcuts only for proven repetitive tasks, discoverable and conflict-free. | Gallery/operator, if needed | P3 / Conditional | SR/IME/focus conflicts and repeated-task evidence required. |
| Safe-triangle submenu | No demonstrated diagonal pointer flyout task. Exclude implementation; do not redesign simple navigation to justify a library. | Navigation | P3 / N/A current task | Reassess if a genuine multi-level flyout is approved; keyboard/touch equivalents mandatory. |
| Command palette | Public marketing/enquiry journey does not justify one. Operator use needs task evidence. | Operator, if later justified | P3 / Deferred | No new feature or dependency. |
| Bottom sheets | Not required; enhance only a proven mobile task with native dialog and complete focus/keyboard behavior. | Planner/gallery overlay, if justified | P2 / Conditional | Keyboard viewport, Escape, focus return, scroll and targets must pass. |

## Phase checkpoint / next action

This phase persists instructions and planning/evidence lineage only. Earlier application phases have not silently become approved, implemented or verified. Local documentation source checks and remote PR details are recorded in `docs/HANDOFF.md`; no app visual “after” screenshot is appropriate for a documentation-only diff. The initial matrix is intentionally honest about incomplete programme coverage; update rows as each requirement gains specific evidence. A merged documentation PR would establish the shared references, not prove future agent adherence or production quality.

Next application phase requires the existing plan-approval boundary. Once authorized, inspect held rate-limit PR #64 before any duplicate implementation and take the highest-value unblocked item within the approved phase. Do not broaden to another phase merely because one item is blocked.
