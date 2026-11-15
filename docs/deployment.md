# Deployment — Cloudflare Workers Static Assets

**Status (M0):** configuration committed (`wrangler.jsonc`, `public/_headers`); **not yet deployed**. The Claude Code Cloud container cannot reach the Cloudflare API (its outbound proxy returns 403) and holds no Cloudflare login, so the first deployment link must be made by the owner in the Cloudflare dashboard.

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
   - Non-production branch deploy command: `npx wrangler versions upload`
   - Enable **builds for non-production branches** (this gives PR preview URLs).
4. Do **not** add a custom domain or route for `theweddingnest.in` yet.

Result: `main` deploys to `the-wedding-nest.<account-subdomain>.workers.dev`; each PR branch gets a versioned preview URL.

## Node version

`.nvmrc` pins **Node 24.18.0**, which Workers Builds preinstalls (its image ships 22.23.2 and 24.18.0; Astro 7 needs >=22.23.4, so 22.23.2 fails). GitHub CI reads the same file. If a build log ever shows a Node mismatch, set `NODE_VERSION` in the Workers Builds settings to match `.nvmrc`.

## Indexing and access

- Every build ships `X-Robots-Tag: noindex, nofollow`, `<meta name="robots" content="noindex, nofollow">` and a disallow-all `robots.txt`.
- noindex is **not access control**. If previews must be private, add Cloudflare Access to the workers.dev / preview hostnames (owner decision).
- Production launch (later, with owner approval): set `PUBLIC_ALLOW_INDEXING=true` for the production build only, replace `public/robots.txt` and the `X-Robots-Tag` header, add a sitemap, then attach the custom domain.

## Security headers

- `astro.config.mjs` → `security.csp: true` generates a hash-based CSP `<meta>` for scripts and styles on each page. No inline `style=""` attributes are used (the CSP would block them).
- `public/_headers` adds `frame-ancestors 'none'`, `nosniff`, referrer and permissions policies, COOP, and immutable caching for hashed `/_astro/*` assets.
- HSTS stays off (see the decisions log) until the live site and redirects are verified.
