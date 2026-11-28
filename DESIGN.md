# The Wedding Nest — design source of truth

Permanent requirements: [Master directive, sections 1–19](docs/directives/MASTER-DESIGN-ENGINEERING-DIRECTIVE.md), [site rulebook](docs/directives/ELITE-SITE-DIRECTIVE-WEDDING-NEST.md). Read [reconciliation](docs/directives/EXECUTION.md) before changing the experience. Existing detailed standards and approval history remain in [creative excellence](docs/creative-excellence-standards.md) and [Grand Entrance](docs/creative-direction-grand-entrance.md); this index does not supersede them.

## Preserve and refine

The owner-approved Grand Entrance is a heritage invitation expressed through real Hyderabadi celebration photography, editorial typography and hospitality. Keep Fraunces/Instrument Sans, existing logo rules and working routes. Ivory/stone, kohl, garnet/emerald chapters and sparing saffron/brass are the current language; proposed OKLCH semantic refinements must preserve perceived brand colours and measured contrast. Do not impose another project's palette.

One hero signature, three micro-delights maximum. The earlier Step 2 700–900ms invitation refinement remains a proposal, not owner visual approval. No new hero film: the owner removed it on 19 November. No content, input or navigation can wait for choreography. Reduced-motion/static output must be composed and usable. Changes to major creative direction require a preview and owner approval before merge.

Use photography's intrinsic proportions, deliberate editorial asymmetry and a service-specific composition. Preserve current category gallery work rather than rebuilding it. Content publication approval is separate from source/fixture implementation. Current unpublished galleries must stay gated. No fake events, claims, prices, reviews or approval references.

## Component and responsive contract

- Extend `src/styles/global.css` and existing components; no replacement framework or duplicate design system. Semantic colour/spacing/type/motion tokens should be the common source. Missing dark/forced-colors/preference behavior is backlog, not implemented by this document.
- Define applicable default, hover, focus, press, selection, disabled, busy, empty, error and success states. Stable button width, always-visible labels, inline explanatory errors and non-obscured focus take priority over decoration.
- Design at 320/360px; inspect 375/390/414/430/768/1024/1440 plus the existing 1280/1920 visual gates. Add safe-area padding and dynamic viewport behavior where an actual fixed control needs it. Never disable zoom or native scroll.
- Prefer 44–48px targets with at least 8px separation. Touch/keyboard alternatives are required for hover, drag and gesture features. Keep browser back, anchors, find-in-page and modified links working.
- Balanced headlines, readable line lengths, tabular numbers for quantities/money, coherent inner/outer radii, real SVG icons and purposeful whitespace. No generic badge/card/icon filler or repeated identical section rhythm.
- Responsive AVIF/WebP with dimensions, deliberate crops, stable low-cost placeholders and priority only for the LCP image. No added BlurHash runtime solely for fashion.
- CSS/native motion first: shared feedback/component/page durations, interruptible transitions and guarded asynchronous playback. No autonomous endless decorative loops. Pause controls for motion beyond five seconds. Existing GSAP must earn its cost; no added Motion/Lenis stack by default.

## Acceptance

The stricter site budgets apply: LCP≤1.8s, INP≤100ms, CLS≤0.02, TBT≤150ms, cached TTFB≤400ms; first-load gzip JS≤90KB; critical CSS≤14KB, total CSS≤60KB; hero≤90KB; first view≤500KB; above-fold fonts≤2 files/60KB. Lighthouse target remains 100 in four categories, with intentional preview noindex explained rather than weakened. These are targets, not measured results. Current fresh measurements are **UNVERIFIED**.

Keep both critique rubrics: the original B3 requires each category≥9; the master directive's nine-category weighted target is 95/100. Neither compensates for functional, security or accessibility failures. No unsupported total or passing score. Run Research → Design → Implement → Render → Critique → Refine → Optimize → Verify on each visual phase; capture actual evidence, report limitations and update the living matrix.
