# Site generator

- `python3 src/build.py` (run from the repo root) regenerates every service page, `insights/*.html`, the home page Insights section, footer and `sitemap.xml`.
- Service pages: `src/build.py` and `src/more.py`.
- Articles: one JSON file per article in `src/posts/` (see the existing file for the fields: slug, date, title, summary, tags, body (HTML using p, h2, ul, li, b), sources [{title,url}], related [service slugs]).
- Live HMRC / Companies House feed: `functions/api/updates.js` (Cloudflare Pages Function) + `updates.js`.

## Weekly article rules
- Byline is Sheryar Ahmed ACA FCCA. Write in plain UK English, 400 to 700 words, useful to small business owners, landlords and individuals.
- Every figure, rate and date must come from a GOV.UK page read that day, and that page must be listed in `sources`.
- Never invent quotes, client stories, statistics or reviews. No opinions on politics.
- Do not repeat a topic already covered in `src/posts/`.
