---
name: twn-release-review
description: Verify The Wedding Nest code changes and releases with tests, builds, security, accessibility, performance, SEO and traceable deployment evidence.
---
# TWN release review

Before touching code, discover package scripts and CI as actually committed. Do not invent commands or passing results.

1. For a functional change, reproduce expected behavior with a failing test; implement minimally and rerun focused + full suites.
2. Verify Astro build, TypeScript, lint, tests and dependency/secret scans once these scripts exist; label anything unavailable clearly.
3. Check images for responsive sizes/alt text; headings/canonical/metadata/local-business facts; accessibility and reduced motion.
4. For enquiries, test durable submission, consent, validation, abuse controls, idempotency and failure behavior against an isolated test environment.
5. Inspect the actual preview URL and capture desktop/mobile and keyboard navigation results. noindex/protection for previews.
6. Summarise commit SHA, changed files, test commands/results, deploy preview URL and review status. Avoid merging owner-facing design changes without approval.

Source precedents: selected Addy Osmani Agent Skills, Matt Pocock engineering skills and Cloudflare security audit; do not imply their full third-party plugins are installed.
