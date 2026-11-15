# Start development in Claude Code Cloud

This repo has project guidelines/skills and declared plugins but **no website implementation**.

1. Open https://claude.ai/code and select this **single GitHub repository** (not a multi-repo project thread); authenticate only with scoped repository access.
2. Ask Claude to read README.md, CLAUDE.md, AGENTS.md and docs/*.md and inspect project skill availability.
3. Test that the Superpowers and Impeccable commands are actually available. If not, inspect plugin manager and ask for marketplace trust/install; do not report success merely from settings.json.
4. Verify the three `twn-*` project skills are discoverable. If the cloud surface does not discover them, read their files directly and report the limitation.
5. Scaffold smallest tested Astro + TypeScript + Tailwind app on a feature branch. Produce lockfile and working commands; prove build/test results.
6. Connect to GitHub CI and Cloudflare Worker preview deployment once app builds; do not attach production custom domain before owner visual review.
7. Develop premium visual homepage and enquiry flow with scoped PRs, preview URLs and verified mobile/desktop inspection.

## First cloud agent prompt
"Read the project instructions. Confirm the actual status of both plugin declarations and the 3 project skills; show evidence of what loads. Then propose and implement a minimal Astro scaffold with a verified build and a reviewable PR. No local laptop work or claims of deployment without proof."

Do not install heavy GPU media generators, memory daemons, router proxies or broad penetration-test agents in the TWN application.
