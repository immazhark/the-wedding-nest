# TWN creative excellence standards

The working standard for every design, motion and copy decision. Owner directive of 15 Nov 2026, condensed. Read before any visual or copy work.

## The bar

An original, ultra-premium editorial experience for a Hyderabad wedding and events business, welcoming to every budget. It must never read as AI-generated or templated. Clean or green CI is not the same as approved: judge the rendered result.

## Reject

- Template sequences (hero → cards → testimonials → CTA), uniform grids, repeated rectangular cards.
- Glassmorphism, gradients for their own sake, blobs, decorative floating shapes, default Tailwind look, gold-on-black "luxury".
- One recipe repeated in every section (eyebrow + headline + italic half). Vary composition with purpose.
- The same scroll animation on everything; parallax or motion with no narrative job.
- Generic copy: "dream wedding", "unforgettable memories", "bring your vision to life", "where X meets Y", "elevate", "curated", "bespoke", "seamless", "timeless", triads of adjectives, superlatives. Prefer specific, true detail.

## Art direction (current, PROPOSED — not an approved brand)

- **Palette:** ivory/paper/stone grounds, ink text, kohl for deep sections; brass is an accent (≤ a few touches per view), never a fill.
- **Type:** Fraunces (display, optical sizes, light weights; italic for at most one accent per section) + Instrument Sans (text/UI). Compose line breaks deliberately (`<br>` / balanced wrapping); display size serves hierarchy, not volume.
- **Composition:** 12-column editorial grid, intentional asymmetry, overlap and layering where it tells the story; generous but purposeful whitespace; mobile gets its own composition, not a squeezed desktop.
- **Logo:** official TWN logo per docs/brand-assets.md (single-colour on the site). Its tagline is brand property and appears only inside the lockup.
- **Signature motif:** the Qutb Shahi arch + jaali appears **once per page at most**, where it means "threshold / invitation" (the planner invitation). Photographs are otherwise framed by their own aspect ratio.
- **Photography leads.** Layouts adapt to the real image (portrait, landscape, panorama, detail), never one forced crop. See docs/photography-brief.md.

## Motion

- Native CSS first: choreographed opening (line-mask type reveal, image mask reveal), CSS scroll-driven animations (`animation-timeline: view()`) as progressive enhancement, considered micro-interactions. GSAP only when sequencing genuinely needs it — storyboard first, clean up instances.
- Durations ~0.6–1.2 s with `--ease-editorial`; the opening finishes in < 1.6 s. Never hijack scroll, never hide content behind animation, never animate layout.
- `prefers-reduced-motion: reduce` → no movement; everything is fully visible and composed without motion.

## Copy

All AI-assisted copy is an editorial draft until the owner approves it. Write like a thoughtful human editor: plain, specific, warm, culturally aware, no invented facts. Each headline, CTA and caption must earn its place. Re-read for generic phrasing before presenting.

## Integrity (non-negotiable)

No fabricated photos, venues, clients, stories, testimonials, prices, awards or contact details. Placeholders are labelled as such. Real photos only with recorded permission.

## Process per section/feature

Role → concept (composition, type, imagery, responsive, motion) → challenge the obvious version → implement in the design system → inspect real renders at phone/tablet/laptop/desktop → critique and fix → verify (build, tests, axe, perf) → present with screenshots and preview URL. Major creative-direction changes need owner visual approval before merge.

## Engineering targets (measure, don't claim)

LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (p75) · WCAG 2.2 AA · strict TS · no unnecessary third-party scripts or heavy dependencies.
