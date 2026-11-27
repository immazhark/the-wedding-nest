# Deployment — Cloudflare Workers Static Assets

**Current deployment contract (27 Nov 2026):** Astro/TypeScript static assets and Worker enquiry/operator routes are implemented. Main and branch previews retain intake-off/noindex configuration; isolated staging has its own D1 and fictional intake. Prior provider read-backs record migrations 0002–0005 and staging Access bindings as installed. These records are historical evidence, not a fresh deployment verification; consult [progress.md](progress.md) and current build/version provenance before claiming a particular commit is deployed. Production domain attachment, public display, indexing, real intake and notification activation remain separate gates.

### Verifying the live preview

Run the full suite against the deployed URL (pages, routing, axe, responsive, live headers):

```bash
PLAYWRIGHT_BASE_URL=https://the-wedding-nest.mazharkhan-it.workers.dev npm run test:e2e
```

In a Claude Code Cloud session this needs that exact host allowed in the environment's network settings.

## Chosen approach: Cloudflare Workers Builds (GitHub integration)

Cloudflare builds directly from GitHub, so no Cloudflare API token is stored in GitHub or shared with agents. Each pull request branch gets its own preview URL, posted on the PR.

### Historical setup reference — already established

Workers Builds and the staging trigger already exist. Reverify their current settings rather than recreate them. The following procedure is for a genuinely new environment only.

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Import a repository**.
2. Connect GitHub and grant access to **only** `immazhark/the-wedding-nest`.
3. Settings:
   - Worker name: `the-wedding-nest` (must match `name` in `wrangler.jsonc`)
   - Production branch: `main`
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Preview command: `npx wrangler preview` (requires the `previews` block in `wrangler.jsonc`)
   - Enable **builds for non-production branches** (this gives PR preview URLs).
4. Do **not** add a custom domain or route for `theweddingnest.in` yet.

Result: `main` deploys to `the-wedding-nest.<account-subdomain>.workers.dev`; each PR branch gets an isolated Worker Preview URL.

## Staging build continuity

The separate `the-wedding-nest-staging` build configuration watches `main`, rather than a temporary PR branch. Its command builds with the public Turnstile dummy site key and `PUBLIC_ENQUIRIES_ENABLED=true`, then runs `npx wrangler deploy --env staging`. Only staging receives its isolated D1 and dummy secret binding. Runtime build-path filters avoid redeploying for documentation-only changes. Branch previews and main continue using disabled intake.

After a staging deployment, run the synthetic HTTP script or the manually runnable `Deployed staging verification` workflow. Those tests write fictional records and do not send messages or notifications.

## Node version

`.nvmrc` pins **Node 24.18.0**, which Workers Builds preinstalls (its image ships 22.23.2 and 24.18.0; Astro 7 needs >=22.23.4, so 22.23.2 fails). GitHub CI reads the same file. If a build log ever shows a Node mismatch, set `NODE_VERSION` in the Workers Builds settings to match `.nvmrc`.

## Indexing and access

- Every build ships `X-Robots-Tag: noindex, nofollow`, `<meta name="robots" content="noindex, nofollow">` and a disallow-all `robots.txt`.
- noindex is **not access control**. If previews must be private, add Cloudflare Access to the workers.dev / preview hostnames (owner decision).
- `PUBLIC_SITE_RELEASED=true` controls only the approved public display state. It does not enable indexing or enquiry intake. Dummy-key submission builds always retain their fictional-data warning.
- Public indexing remains a separate owner-gated release: set `PUBLIC_ALLOW_INDEXING=true` only after domain/redirect/host-policy approval. The build now refuses indexing unless `PUBLIC_SITE_RELEASED=true` and root `wrangler.jsonc` explicitly declares both `workers_dev: false` and `preview_urls: false`. It also refuses an indexable dummy-key test environment. Current preview configuration stays unchanged and noindex.
- The root-host guard protects the default deployment contract; it does not inspect Cloudflare live routes or overrides. Verify actual custom-domain TLS, apex/www redirects and every old preview host at release. If previews remain needed, use a separate protected/nonindexable deployment; never reuse indexable production assets there.
- Once the guard and owner-approved deployment conditions are satisfied, the existing indexing switch changes robots meta, robots.txt, X-Robots-Tag and sitemap together. No flags, domains or provider settings are activated by committing this code.

## Security headers

- `astro.config.mjs` → `security.csp: true` generates a hash-based CSP `<meta>` for scripts and styles on each page. No inline `style=""` attributes are used (the CSP would block them).
- `_headers` is generated at build time by `src/lib/site/seo-files.ts` (via the integration in `astro.config.mjs`): `frame-ancestors 'none'`, `nosniff`, referrer and permissions policies, COOP, immutable caching for hashed `/_astro/*` assets, plus `X-Robots-Tag` while not indexable.
- HSTS stays off (see the decisions log) until the live site and redirects are verified.

## Configuration boundaries

Build-time public flags are documented in [../.env.example](../.env.example); they are embedded in generated assets and cannot carry secrets. Runtime intake/origin values and the staging `DB` resource binding live in `wrangler.jsonc`. `TURNSTILE_SECRET` belongs in the environment-specific Cloudflare Worker secret store. Staging `OPERATOR_ACCESS_TEAM_DOMAIN`, `OPERATOR_ACCESS_AUD` and `OPERATOR_EMAILS` were installed as encrypted Worker bindings and must stay out of source, especially the email allow-list. Default/preview configuration must not inherit staging credentials or D1.

The manual provider probe uses the protected GitHub environment `twn-email-receipt` and secret `TWN_RESEND_STAGING_API_KEY`; that secret is not a Worker credential. The deployed Worker has no email-consumer import, send route or scheduler, and no Worker email binding name is implemented. See [email-notifications.md](email-notifications.md) before preparing any integration.
