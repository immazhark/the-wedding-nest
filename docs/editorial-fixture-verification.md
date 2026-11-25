# Synthetic editorial-route CI verification

The approved service and event-story templates would otherwise never be
rendered in the full browser suite until real, permission-cleared source
material is supplied. This check proves the real Astro route generation,
image transformation, responsive layout, internal links and WCAG checks
without placing fictional stories or service claims into the repository.

`npm run test:editorial-fixtures` invokes
`scripts/verify-editorial-fixtures.mjs` and uses
`playwright.editorial.config.ts`. The script:

1. Refuses to overwrite any existing source file or existing output folder.
2. Creates **two clearly synthetic checkerboard PNGs** and dummy editorial
   metadata that is marked CI-only throughout. The generated names and
   approval references must never be confused with real approvals.
3. Builds only into `dist-editorial-fixtures`, with indexing, public release and enquiry
   submission forcibly off; serves that disposable build on a separate port.
4. Checks rendered service and story pages in desktop/mobile Chromium, including
   link destinations, noindex, media alt text, accessibility and overflow.
5. Deletes every created record, image and build output even on a failed test.
   Real original media and approved source files are never overwritten.

The normal production build and its unapproved-route 404 checks run in a
**separate parallel CI job**. It uses a different checkout/workspace from the
synthetic build, so neither job can mix real-preview outputs and fixture assets.
Only CI invokes the synthetic build by default; running it locally requires
explicit `TWN_ALLOW_LOCAL_FIXTURES=1`. This command is never part of
Cloudflare deployment, and fixture source files are never checked in.

**No sample service, photograph, review or customer is publication-approved by
this test.** Production-domain, indexing, photography and real-enquiry gates
remain entirely separate and require business-owner consent.
