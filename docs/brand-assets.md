# Brand assets — official TWN logo

**Source:** owner-supplied `TWN_Logo.ai` (Illustrator 26.1, vector, 3 artboards: gold-on-black, black-on-gold, designer contact slip — the slip is not used). Supplied 15 Nov 2026.

## What is in the repository (`src/assets/brand/`)

Vector paths extracted unchanged from artboard 1; only the background was removed and coordinates rounded to 0.01 pt (visually identical). All files use `currentColor` unless noted.

| File | Use |
| --- | --- |
| `twn-logo-horizontal.svg` | Site header. Official emblem + official "THE / WEDDING NEST" wordmark placed side by side (wordmark scaled ×2 relative to the stacked lockup so it stays legible at 36–44 px). Adaptation of the official lockup — **approved by the owner (15 Nov 2026), along with using different logo variations depending on placement.** |
| `twn-lockup.svg` / `twn-lockup-ivory.svg` | Official stacked lockup with tagline (footer, large uses; ivory version for dark grounds). |
| `twn-lockup-compact.svg` | Stacked lockup without tagline (for sizes where the tagline would be < ~6 px tall). |
| `twn-emblem.svg` | Emblem only; source of `public/favicon.svg` (ink, ivory in dark mode) and `public/apple-touch-icon.png`. |

## Usage rules

- On the website the logo uses the **official single-colour variant** (ink on light, ivory on dark). The gold-gradient versions remain for print and social, where they were designed to be used.
- Minimum sizes: horizontal lockup 32 px tall; stacked lockup with tagline 160 px tall; emblem 24 px (16 px favicon is a silhouette only).
- Keep clear space of at least the height of "THE" around the logo. Don't recolour into gradients, outline, stretch or add effects.
- The tagline "Where Tradition Meets Elegance" appears only inside the official lockup; it is brand property, not page copy (see docs/creative-excellence-standards.md).

## Business card QR (`BC_Final`)

The supplied card's QR encoded `https://twn.events/contact` (domain not controlled by TWN). Replacement QR files encode `https://theweddingnest.in/` and are delivered outside the repo (they belong to print, not the website). The `.ai` contains Illustrator private data, so its QR must be swapped in Illustrator; the print PDF was updated directly. **Don't print until the domain serves the live site** (owner: cards are not urgent; wait for launch).
