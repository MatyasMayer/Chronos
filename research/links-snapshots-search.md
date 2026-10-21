# Link previews, page snapshots and full-text file search

Research for [#7](https://github.com/MatyasMayer/Chronos/issues/7). Researched 2026-10-21.

**Question:** How can Chronos show link previews (title, favicon, preview image), save page snapshots, and run full-text search inside PDFs and slides, on a free or nearly free host, used from an iPhone and Windows (PWA)?

## TL;DR

- **Previews:** fetch the page on the server with one plain HTTP GET. Parse Open Graph, Twitter Card, `<title>` and `<link rel=icon>`, and fall back to oEmbed for sites like YouTube. Download the image and favicon and keep local copies. This needs no headless browser and costs almost nothing. The fetcher must be guarded against SSRF.
- **Snapshots:** the cheap default is to store the fetched HTML plus a [Readability](https://github.com/mozilla/readability) "reader copy", which also gives clean text for search. [monolith](https://github.com/Y2Z/monolith) (a Rust binary with no JS engine) can add a self-contained single-file HTML. Headless Chrome ([SingleFile CLI](https://github.com/gildas-lormeau/single-file-cli), Puppeteer) gives the best fidelity but is too heavy for a free host. Make it optional, or offload it.
- **Pages behind login (Moodle):** the server cannot see them. Capture them on the client instead: the SingleFile browser extension on Windows, already logged in, uploads the page to Chronos. Otherwise download the file by hand and upload it. Don't store Moodle cookies or passwords on the server.
- **File text:** use [unpdf](https://github.com/unjs/unpdf) (pdf.js) for PDF and [officeparser](https://github.com/harshankur/officeParser) (or a small unzip plus XML read) for PPTX/DOCX/ODP. Extract once at upload and store the text per page or slide. OCR for scanned PDFs can come later.
- **Search:** use the full-text search built into whichever database Chronos picks. With SQLite that is **FTS5** using `unicode61 remove_diacritics 2`. With Postgres it is the **`simple` config + `unaccent`** (Postgres ships no Czech stemmer). Meilisearch and Typesense mean an extra always-on process and RAM, which is overkill for one user. Client-side MiniSearch or Orama suits offline search over titles and notes, not over all file text.

## 1. Link previews

### Metadata sources, in priority order

1. **Open Graph** `<meta property="og:*">`. The four required properties are `og:title`, `og:type`, `og:image` and `og:url`. `og:description` and `og:site_name` are optional ([ogp.me](https://ogp.me/)).
2. **oEmbed**. Pages advertise an endpoint with `<link rel="alternate" type="application/json+oembed">` or an HTTP `Link` header. The response can include `title`, `author_name`, `provider_name` and `thumbnail_url` (with `thumbnail_width`/`height`) ([oembed.com](https://oembed.com/)). A [providers.json](https://oembed.com/providers.json) registry exists, but the spec "strongly encourages" discovery over the registry. This is useful for YouTube, Vimeo and similar sites, where it also gives an embeddable player.
3. **Fallbacks:** the `<title>` element, `<meta name="description">`, and `<link rel="icon">` (or `apple-touch-icon`). If no icon link exists, browsers may fall back to `/favicon.ico` ([HTML Standard, rel=icon](https://html.spec.whatwg.org/multipage/links.html#rel-icon)).

### Where to fetch

- The fetch has to run on the **server**. A PWA can't read arbitrary cross-origin HTML because CORS blocks it.
- Library option: [open-graph-scraper](https://github.com/jshemas/openGraphScraper) (MIT, Node). It returns `ogTitle`, `ogImage`, `favicon` and more. It can fetch the page itself or parse HTML you pass in. Its default User-Agent (undici) gets blocked by some sites, so set a browser-like UA. A hand-written parser over the same fields is also small.
- **Copy the preview image and favicon into Chronos storage.** Remote image URLs rot, and hotlinking leaks your views to the third-party site.

### Security: SSRF

The server fetches user-supplied URLs. It is single-user, but it still must not reach internal services or cloud metadata endpoints. From the [OWASP SSRF cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html):

- Allow only `http` and `https`.
- Resolve DNS, reject private, loopback, link-local and metadata addresses (`169.254.169.254`), and connect to the IP you validated. This prevents DNS rebinding.
- Re-validate every redirect, or follow redirects manually.
- Also apply a timeout and a maximum response size.

### Getting URLs in from an iPhone

- `share_target` in the Web App Manifest lets an installed PWA show up in the OS share sheet. MDN compat data shows support in Chrome 89+, Chrome Android 76+ and Opera. **Safari (including iOS) and Firefox don't support it** ([MDN share_target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target), [browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/share_target.json)).
- So on iPhone, rely on paste-in-app, or on an iOS Shortcut that POSTs the URL to a Chronos API endpoint. This is a UX consequence, not a blocker.

## 2. Page snapshots ("open even if the site is down")

| Approach | Executes JS? | Fidelity | Runtime cost | Notes |
|---|---|---|---|---|
| **Raw HTML + Readability reader copy** | No | Article text, inline images (if copied) | Negligible (one GET + jsdom parse) | Firefox Reader View's engine. `parse()` returns `title`, `content` (HTML), `textContent`, `excerpt`, `byline`, `siteName`, `lang`, `publishedTime`. Needs jsdom in Node. **Output is not sanitized; run it through DOMPurify** ([readability](https://github.com/mozilla/readability)). Fails on JS-only SPAs. |
| **monolith** | No ("doesn't feature a JavaScript engine") | Whole page as one HTML file, assets inlined as data URLs | Low: a single native Rust binary, no browser | `-j` strips JS, `-I` isolates the document, `-C` takes a cookies file. For JS-heavy pages, the README suggests piping the DOM from headless Chromium into it ([monolith](https://github.com/Y2Z/monolith)). Karakeep uses it for "full page archival" ([Karakeep docs](https://docs.karakeep.app/)). |
| **SingleFile CLI** | Yes (real browser) | Best: the rendered page as one HTML file | High: drives Chrome/Chromium (or Firefox) through CDP / WebDriver BiDi | Supports `--browser-profile` for logged-in captures. Docker image `capsulecode/singlefile` ([single-file-cli](https://github.com/gildas-lormeau/single-file-cli)). |
| **Puppeteer/Playwright screenshot or PDF** | Yes | Visual copy, text not easily searchable | High: a full Chrome download plus Node 22.12+ ([Puppeteer requirements](https://pptr.dev/guides/system-requirements)) | Linkwarden stores a screenshot, a PDF and a single HTML file per link ([linkwarden](https://github.com/linkwarden/linkwarden)). |
| **Offloaded headless browser (Cloudflare Browser Rendering)** | Yes | Like Puppeteer | Free plan: **10 browser minutes/day**, 3 concurrent. Paid: 10 h/month included, then $0.09/h ([pricing](https://developers.cloudflare.com/browser-rendering/pricing/)) | Enough for a few dozen captures a day on the free plan. Ties you to Cloudflare. |
| **Client-side SingleFile browser extension → upload** | Yes (your own browser) | Best, including logged-in pages | Zero server CPU | Linkwarden supports an "Upload from SingleFile" flow ([linkwarden](https://github.com/linkwarden/linkwarden)). Works on Windows desktop browsers, not on iPhone. |

**Resource-cost note:** a headless Chromium needs hundreds of MB of RAM per instance. Free tiers with 256–512 MB of RAM can't comfortably keep one alive next to the app. This is an engineering estimate, not a vendor figure. Puppeteer's docs list no RAM requirement. The Readability and monolith tiers fit easily.

**Suggested v1 pipeline (per link):**
1. GET the page through the SSRF-safe fetcher. Extract the preview metadata.
2. Run Readability. Store the sanitized reader HTML and `textContent`. The text feeds search and later change detection.
3. Optionally run monolith on the same URL and store `snapshot.html`. Serve it from a sandboxed origin or with a strict CSP, because a captured page is untrusted HTML.
4. Let the SingleFile extension (on Windows) upload its own rendered snapshot to replace or augment the server one. This covers JS-heavy and logged-in pages.

## 3. Pages behind login (e.g. Moodle)

- **Server-side fetch sees only the login page.** The options:
  - **Store session cookies on the server** (monolith `-C`, SingleFile `--browser-profile`). This is possible, but sessions expire, it puts your university credentials on a free host, and with SSO (CTU uses central login) it is brittle. **Not recommended.**
  - **Moodle web services.** A client can request a token from `/login/token.php?username=…&password=…&service=moodle_mobile_app` ([Moodle dev docs](https://docs.moodle.org/dev/Creating_a_web_service_client)). That requires a password login. SSO sites go through a browser-based flow, the site admin must enable mobile/web services, and file downloads use a separate token ([Moodle app security](https://docs.moodle.org/en/Moodle_app_security)). This is a possible later "Moodle sync" feature, but it is out of scope for v1.
  - **Client-side capture (recommended).** Use the SingleFile extension in an already-logged-in Windows browser, or download the PDF/PPTX from Moodle and upload it as a file Resource. Store the Moodle URL alongside it as the "source" link, but don't try to preview or snapshot it on the server. Mark it as `requires login`.
- Detection heuristic: if the fetch redirects to a login URL (for example `/login/index.php`) or returns 401/403, set the Resource to "link only, needs manual capture".

## 4. Text extraction from files

- **PDF:** use [unpdf](https://github.com/unjs/unpdf), a serverless build of Mozilla's [pdf.js](https://github.com/mozilla/pdf.js) (Apache-2.0). `extractText()` returns per-page strings (or a merged string) plus `totalPages`. It runs on Node 22+, Bun, browsers and Cloudflare Workers. It is pure JS with no native dependencies, which helps on PaaS hosts. The native alternative is Poppler's `pdftotext`, if the host allows apt packages.
- **PPTX/DOCX/ODP/XLSX:** use [officeparser](https://github.com/harshankur/officeParser) (MIT, Node 22.13+, also runs in the browser). It parses `pptx`, `docx`, `odp`, `odt`, `xlsx`, `pdf`, `rtf` and others. It has optional Tesseract OCR for embedded images (`ocr: true` with `extractAttachments: true`). A PPTX is a ZIP of OOXML parts, so a minimal homegrown extractor (unzip, then read `<a:t>` text runs from `ppt/slides/slideN.xml`) is also feasible and lets you keep slide numbers.
- **Legacy binary `.ppt`/`.doc`:** officeparser doesn't list them. They would need LibreOffice headless conversion, which is heavy. Defer this, or ask the user to re-save as PPTX/PDF.
- **Scanned PDFs (no text layer):** these need OCR. [tesseract.js](https://github.com/naptha/tesseract.js) (Apache-2.0) supports 100+ languages and runs in Node or the browser, but **"does not support PDF files"** directly: you must render pages to images first. It is CPU-heavy. Defer it, or run it in the background or on the client.
- **Store text per page or per slide** (`resource_id, page_no, text`). Search hits can then deep-link to "slide 14", and chunks stay small (see the Postgres `tsvector` limit below).
- Extract **once at upload time**, in a background job, and keep the text in the database. Never re-parse at query time.

## 5. Search engines

Content is Czech and English, so diacritic-insensitive matching (`č` → `c`) matters more than stemming.

| Option | Extra process? | RAM / cost | Czech handling | Fit |
|---|---|---|---|---|
| **SQLite FTS5** | No (in-process) | Negligible | `unicode61 remove_diacritics 2` folds diacritics on all Latin characters (`1`, the default, misses some multi-diacritic codepoints). No Czech stemmer (`porter` is English-only). A `trigram` tokenizer gives substring matching (min 3 chars). `bm25()` ranking with per-column weights, `snippet()`/`highlight()`, prefix queries `thr*`, external-content tables ([SQLite FTS5](https://www.sqlite.org/fts5.html)) | **Best if Chronos uses SQLite.** |
| **Postgres FTS** | No (in the DB) | Negligible | No Czech Snowball stemmer is bundled. The Postgres source has `polish` but no `czech` ([libstemmer dir](https://github.com/postgres/postgres/tree/master/src/backend/snowball/libstemmer)), even though Snowball upstream has one ([snowballstem.org](https://snowballstem.org/algorithms/)). Use the `simple` config + the [`unaccent`](https://www.postgresql.org/docs/current/unaccent.html) filtering dictionary, or load a Czech Hunspell dictionary ([dictionaries](https://www.postgresql.org/docs/current/textsearch-dictionaries.html)). `websearch_to_tsquery` safely parses user input. `ts_headline` output is **not XSS-safe** ([controls](https://www.postgresql.org/docs/current/textsearch-controls.html)). `tsvector` must be **< 1 MB**, with positions ≤ 16,383 ([limitations](https://www.postgresql.org/docs/current/textsearch-limitations.html)), so chunk per page. | **Best if Chronos uses Postgres.** |
| **Meilisearch** | Yes | LMDB memory-mapped. "Works optimally when the full dataset fits in RAM." Their example: a 9.1 MB dataset used ~305 MB RAM and 224 MB disk. Disk doesn't shrink on delete ([storage](https://www.meilisearch.com/docs/learn/engine/storage)) | Typo tolerance. Latin alphabet supported. Community Edition is MIT ([repo](https://github.com/meilisearch/meilisearch)) | Great UX, but a second always-on service on a free host. Overkill for one user. |
| **Typesense** | Yes | Whole index in RAM: about 2–3× the searchable field size. **Requires ≥ 2 vCPUs** ([requirements](https://typesense.org/docs/guide/system-requirements.html)) | Typo tolerance | Free hosts rarely give 2 vCPUs. Not recommended. |
| **MiniSearch (client)** | No (in the browser) | Index in memory on the device | Prefix and fuzzy search, field boosting. No stemming or stop words by default; a custom `processTerm` can fold diacritics ([minisearch](https://github.com/lucaong/minisearch)) | Good for **offline search of titles, notes and tags in the PWA**. Not for all file text on an iPhone. |
| **Orama (client/edge)** | No | In memory. Full-text, vector and hybrid search. Persistence plugin. Apache-2.0. Stemming for 30 languages ([orama](https://github.com/oramasearch/orama)) | Czech not confirmed | Same role as MiniSearch, plus hybrid/vector search if semantic search is wanted later. |

**Recommendation:** use the database's own FTS: FTS5 for SQLite, or `simple` + `unaccent` for Postgres. Index one table that unifies notes, page blocks, Resource titles/descriptions, Readability text and file page/slide text, with a `kind` column and a deep-link target. Weight titles above body. If offline search in the PWA becomes a requirement, add MiniSearch over a small metadata index synced to the device.

## 6. Later: change detection for links

The pipeline above already provides what change detection needs:

- Store a hash of the normalized Readability `textContent`, plus the `ETag` / `Last-Modified` response headers.
- A daily cron job can do conditional GETs, re-extract the text when it changed, diff it against the last version, and save the new version as another snapshot.
- Text-level hashing avoids false alarms from ads and timestamps that a raw-HTML hash would trigger.

## Open questions for the spec

- Which database? This decides FTS5 vs Postgres FTS (tracked in another ticket).
- Is a Windows browser extension (SingleFile, already existing) acceptable as the "capture logged-in page" path, or does Chronos need its own?
- Is OCR for scanned slides needed in v1?
- What snapshot storage budget? Single-file HTML pages with inlined images are often several MB each, which affects which free storage tier fits.
