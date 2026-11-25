# Search, answer-engine and AI-discovery plan

Verified 25 November 2026 against official documentation (links at the end). Rankings, snippets and AI citations are controlled by other companies and are never guaranteed. This plan builds the legitimate foundations and keeps every launch gate closed: the site stays noindex until the owner approves.

## What the platforms say (established facts)

- **Google Search and its AI features** (AI Overviews, AI Mode) need no special markup, files or schema types. A page is eligible when it is indexed and can show a snippet. Structured data must match the visible text. `llms.txt` and similar files are ignored by Google Search.
- **Google-Extended** limits use of content for training and grounding some Google generative products. It does not affect Search ranking or inclusion.
- **OpenAI** runs three independent crawlers: `OAI-SearchBot` (ChatGPT search results), `GPTBot` (model training) and `ChatGPT-User` (fetches triggered by a person's request; robots.txt may not apply). A robots.txt change can take about 24 hours to register.
- **Anthropic** runs `ClaudeBot` (training), `Claude-User` (user-initiated fetches) and `Claude-SearchBot` (search quality). All honour robots.txt. A machine-readable "no AI training" preference signal has been recognised since 30 Oct 2026; a rule naming `ClaudeBot` takes priority over it.

## Decision needed from the owner: AI training crawlers

Search and user-request crawlers stay allowed (that is how TWN gets found and recommended). Training crawlers are a separate choice: `GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`.

- **Recommended:** allow search and user-request crawlers; **opt out of training crawlers** to keep TWN's original photography and films out of model training, with no known cost to search visibility.
- **Today:** robots.txt (at launch) allows everything; nothing changes until the owner decides.
- **How:** the switch is built and tested (`AI_TRAINING_CRAWLERS`, build variable `PUBLIC_AI_TRAINING=disallow`). The preview stays `Disallow: /` for everyone regardless.
- Cloudflare bot protection must be reviewed at launch so approved search crawlers are not blocked by default rules; abuse protection is not weakened.

## Foundations already in place

Static HTML for all content (menus are real text), unique titles and descriptions, canonical URLs, launch-gated sitemap and robots, Organization and per-service `Service` JSON-LD from approved facts only, social images, accessible galleries, fast static delivery. The obsolete `twn.events` domain is never a destination.

## Next (executable now, no approval needed)

1. **Answer content on approved pages.** Catering now has a candidate "Before you choose" block with direct answers drawn verbatim from current approved copy. The answers disappear if their source text is withdrawn. Other services follow after individual approvals. No claim that the questions are frequently asked, no FAQ structured data, and no new price or availability promises.
2. **Entity consistency checklist** for the owner to verify against Google Business Profile, Instagram, Facebook (name, phone, address, hours, category, website URL). Added to `docs/launch-decisions.md` when the owner confirms the facts.
3. **Search Console and Bing Webmaster** verification files and sitemap submission prepared for launch day; no analytics added without a privacy decision.
4. **Guide content** (Hyderabadi wedding planning, choosing a catering menu, Nikah and Walima arrangements) only from the owner's real knowledge; drafts go to the owner first. No generated articles, no invented statistics or experience.
5. **Local area pages**: none until the owner confirms genuine service areas and each page can carry unique, useful information.

## Not doing

Keyword stuffing, doorway pages, fabricated reviews or ratings, FAQ markup for rich-result promises, `llms.txt` as a ranking tactic (Google ignores it; revisit only if a documented use case appears).

## Sources

- Google Search Central: AI features and your website; Control how your content is used for generative AI at Google; Optimizing your website for generative AI features (developers.google.com/search/docs).
- OpenAI: Overview of OpenAI crawlers (developers.openai.com/api/docs/bots); Publishers and Developers FAQ (help.openai.com).
- Anthropic: Does Anthropic crawl data from the web, and how can site owners block the crawler? (support.claude.com).
