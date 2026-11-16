# Deployment — Cloudflare Workers Static Assets

**Status (16 Nov 2026):** Cloudflare MCP is connected. Main and branch previews work with intake disabled; the separate staging Worker accepts fictional test submissions only. Main includes #10–#12 (latest baseline `79f9e42`), with successful Cloudflare deployment and real desktop/mobile staging checks. Production domain, indexing and live enquiry gates remain unchanged.

### Verifying the live preview

Run the full suite against the deployed URL (pages, routing, axe, responsive, live headers):

```bash
PLAYWRIGHT_BASE_URL=https://the-wedding-nest.mazharkhan-it.workers.dev npm run test:e2e
```

In a Claude Code Cloud session this needs that exact host allowed in the environment's network settings.

## Chosen approach: Cloudflare Workers Builds (GitHub integration)

Cloudflare builds directly from GitHub, so no Cloudflare API token is stored in GitHub or shared with agents. Each pull request branch gets its own preview URL, posted on the PR.

### One-time owner action (Cloudflare dashboard, about 5 minutes)

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
- Production launch (later, owner-gated): set `PUBLIC_ALLOW_INDEXING=true` as a build variable for the production build only. That single switch changes `<meta name="robots">`, the generated `robots.txt` and removes `X-Robots-Tag` together (unit tested in `tests/unit/seo-files.test.ts`). Add a sitemap and attach the custom domain in the same release.

## Security headers

- `astro.config.mjs` → `security.csp: true` generates a hash-based CSP `<meta>` for scripts and styles on each page. No inline `style=""` attributes are used (the CSP would block them).
- `_headers` is generated at build time by `src/lib/site/seo-files.ts` (via the integration in `astro.config.mjs`): `frame-ancestors 'none'`, `nosniff`, referrer and permissions policies, COOP, immutable caching for hashed `/_astro/*` assets, plus `X-Robots-Tag` while not indexable.
- HSTS stays off (see the decisions log) until the live site and redirects are verified.
