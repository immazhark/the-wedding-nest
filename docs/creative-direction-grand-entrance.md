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

## Round 2 (owner approved the direction on 18 November 2026): elevated motion

- **Scroll story (GSAP + ScrollTrigger, loaded after first paint):** the camera pushes toward the stage while the headline drifts away (pinned for 0.7 of a viewport on larger screens, unpinned on phones); the kitchen arch opens from a slit while its footage settles; the menu rail slides in; occasions are read out one line at a time on an emerald chapter; the work photographs unveil behind a curtain of crop.
- **Gold dust:** a small 2D canvas of slow motes in the hero light (22 on phones, 42 on larger screens), paused off screen and with reduced motion.
- **Page transitions:** a curtain wipe between pages (cross-document view transitions, progressive; ignored by browsers without support).
- **Colour rhythm:** dark kohl opening, garnet kitchen, ivory services, emerald occasions, ivory work, kohl planner invitation.
- **GSAP assessment:** licence is the GSAP "no charge" standard licence (commercial use allowed). Cost: about 113 KB raw (about 42 KB gzipped) in two chunks, fetched at idle after first paint, only on the home page, and only when motion is allowed. Lenis was rejected (it replaces native scrolling); OGL and dotLottie were not needed.
- **Layout stability:** the pinned push-in's space is reserved in CSS (`html.motion-ok .grand`), so pinning never shifts content (CLS 0.001 in the lab run). If GSAP fails to load, the reservation is removed.

## Round 3: the same register across the whole site

- **Services:** a row of nine jewel-toned doors (garnet, emerald, indigo, bronze, rose, teal, plum, kohl) of different sizes; catering and décor carry real photographs; a pool of light opens on hover.
- **Threshold arch:** the planner invitation now holds a real catering photograph instead of a placeholder.
- **Catering page:** a dark hero on the owner's hall photograph, outlined gold numerals for each menu, a three-photograph strip of the table, a closing invitation with call and WhatsApp.
- **Footer:** a closing invitation ("Your celebration begins here") above the contact columns, on a garnet-to-kohl gradient.
- **Plan page and 404:** the same dark chapter, with the next sequence rising over it in an arch.
- **Navigation:** the header is now dark on every page and persists through page changes while a curtain wipe reveals the next page (cross-document view transitions; verified to fire on forward and back/forward navigation). Internal links are prefetched on hover, focus or touch so pages land immediately.
- **Photographs:** five more owner-supplied catering photographs, release refs `TWN-REL-2026-T0005`–`T0009`, recorded in the private register.

## Round 4: the planner

- Selection tiles are rounded cards that lift on hover and fill garnet with a saffron mark when chosen; tiles rise in one by one when a step opens; the progress bar is a garnet-to-saffron line and the active step's numeral and title shift. CSS only: validation, privacy and accessibility logic are untouched.

## Performance and browsers (19 November 2026, lab, not real-user data)

- Home LCP element is the hero photograph. A 1440w image step (the browser was fetching the 1920w file, 211 KB, at a 1440px window) cut desktop LCP from about 2.7-3.4 s to 2.2-2.3 s (4x CPU, about 1.6 Mbps, 150 ms latency); mobile stays about 2.0-2.1 s; CLS at most 0.001.
- WebKit (desktop and mobile) passes all 60 planner tests; Firefox passes the site checks. Running all three engines at four workers on one laptop timed out on cold starts, so cross-browser runs use fewer workers.

## Still unapproved or open

- All copy remains draft. The preview banner still says "placeholder imagery" because some slots still use honest placeholders.
- The kitchen loop is a golden, saffron-streaked pot; the owner should confirm it is the clip they want and what to call it.
- The remaining sections have not been redesigned. That follows approval.
