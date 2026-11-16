# Responsive visual review — evidence and approval

The Wedding Nest uses an editorial, photography-led design. Automated code checks
cannot determine whether it feels distinctive, premium, or authentic.

## Reproducible review captures

`tests/e2e/visual-review.spec.ts` renders the built preview in desktop Chromium
at four fixed CSS viewport widths: **360, 768, 1024, and 1440 pixels**, for
both the homepage and Plan Your Event page (eight full-page captures).

The test loads local/self-hosted assets, waits for fonts, disables animation
for deterministic evidence, verifies the main heading and no horizontal
overflow, and checks the intended mobile/desktop navigation presentation.

On each GitHub pull request, the CI workflow publishes the Playwright HTML
report as the **responsive-review** artifact. Open the PR's Actions run,
download that artifact, open `index.html` and inspect the attached screenshots.
The report is retained for 14 days. No screenshots, real client images or
private enquiries are committed to source control.

Review especially the header, top fold, typography, mobile text wrapping,
placeholder honesty, CTA discoverability, planner controls, footer and spacing.

**This is review evidence, not visual approval.** Automated assertions cannot
replace the owner's aesthetic acceptance, and a screenshot cannot verify the
rights to event imagery. The existing owner gates still govern photography,
business claims, domain activation, indexing and real enquiry submission.
