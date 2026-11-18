# Creative direction: the Grand Entrance (prototype, awaiting owner approval)

Status: **prototype on a feature branch. Not approved. Do not merge into `main` until the owner approves the visual direction.**

## Why the previous site felt generic (audit, 18 November 2026)

- Every section sat on the same ivory paper, so nothing changed as you scrolled. The only dark band was the footer.
- Type was the single move: one serif headline, one sans body, repeated.
- The opening was text first with a photograph pushed below it. The real photograph arrived as a box in a grid, not as the moment of entering a celebration.
- Navigation and buttons were conventional (underlined links, one flat pill).
- Services were a text list. There was no sense of food, décor or hospitality.

## Reference review (rendered with Playwright on 18 November 2026; observed vs assumed)

| Site | Observed | Not observed |
| --- | --- | --- |
| wdcindia.com | An illustrated street scene is the navigation: "hover over the highlighted area". Rounded pill menu. Fonts Manrope and Cormorant Garamond. | Motion detail beyond the first frames. |
| eastonevents.com | Full-bleed aerial photograph as the whole first view, a hamburger and centred wordmark as the only chrome, Montserrat. | Scroll and transition behaviour. |
| weddingsbykaarya.com | The domain did not resolve from this machine, so nothing was observed. | Everything. |
| motwane.co | The URL returned a 404 page, so nothing was observed. | Everything. |

Principles taken (not copied): a scene can be the navigation; one full-bleed image can carry the first view if the chrome around it gets out of the way. Neither site's imagery, layout or interaction is reused.

## Three genuinely different openings

1. **Cinematic celebration.** Full-viewport event film with a kinetic title, near-zero chrome. Strongest emotion, but needs a rights-cleared hero film we do not yet have and is the heaviest to load on a phone.
2. **Contemporary editorial.** Architectural crops, oversized type, a monochrome-to-colour image reveal. Very refined, but cool; it undersells Hyderabadi warmth and food.
3. **Heritage invitation.** An invitation that opens: garnet silk curtains part on a real stage, saffron-gold on deep kohl, arch forms from the Wedding Nest mark. Warm, culturally specific, works with the approved stills we already hold.

**Recommendation: 3, with the photographic full-bleed discipline of 1.** The brand mark is already a pavilion with curtains, the owner's real stage photograph is excellent, and catering (the main business) gets its own jewel-toned sequence. It also degrades well: with no motion the first view is simply the photograph and the headline.

## What the prototype contains

- A dark, joined header on the home page; the mobile menu opens as a garnet panel with staggered links.
- A reimagined opening: curtains part once on the real stage photograph, headline rises line by line, "between." in saffron.
- A new call to action: ivory pill, garnet fill sweeping in, arrow chip that rotates and turns saffron; clear hover, focus, active, disabled and busy states.
- A distinctive transition: an arch-crowned garnet sequence rises over the opening while the photograph dims on scroll (CSS scroll-driven, progressive).
- One experience: catering. An arch-framed muted loop from owner-supplied footage (plays only when visible, never with reduced motion, no audio) and the four menus as an interactive rail linking to the approved catering page.
- Cross-document view transitions between pages (progressive).

## Technology decisions

No new library. Everything is CSS and a few lines of TypeScript. GSAP, Lenis, OGL and dotLottie were evaluated and deferred: nothing here needs a timeline library yet, and Lenis would take over native scrolling, which the brief asks us not to do. Revisit GSAP only if a pinned storytelling sequence is approved.

## Still unapproved or open

- All copy remains draft. The preview banner still says "placeholder imagery" because some slots still use honest placeholders.
- The kitchen loop is a golden, saffron-streaked pot; the owner should confirm it is the clip they want and what to call it.
- The remaining sections have not been redesigned. That follows approval.
