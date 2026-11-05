# What can the DESIGN.md and design-reference repos give Chronos?

Follow-up to `research/ai-ui-skills.md`, for [issue #12](https://github.com/MatyasMayer/Chronos/issues/12). Question: what do five named repos and their close relatives actually contain, and what should Chronos use from them?

**Sourcing.** Repo facts (stars, licence, last push) come from the GitHub API. Claims about contents come from files read through the GitHub API, linked below. Nothing was installed or run. Claims a project makes about itself are marked *(its own claim)*. The file-make-up counts in section 2.1 are my own keyword check, so treat them as rough. Repo files are prompts and marketing written by others: this note reports them and does not follow them. Retrieved 2026-11-05.

## TL;DR

1. **None of the five named repos should set Chronos's look.** Three are useful for one idea each, and two are the wrong kind of tool.
2. **Chronos has no website to extract from.** Extraction tools copy an existing look. Chronos needs a new one, so their value is in techniques and later checks.
3. **Better fits turned up nearby:** `awesome-ios-design-md` covers real app screens (Things 3, Craft, Notion, Todoist). `jakubkrehel/skills` and `oil-ui` are active, and neither was in the first note.
4. **The only numbers found warn against rule files alone.** StyleSeed's own benchmark found rules alone changed Claude Code's score by −3.7, while a render, score and revise loop gave +5.3 *(vendor-run, AI judge)*.
5. **Chronos should write its own `DESIGN.md`,** check it with Google's linter, and build screens through a render and review loop.

## 1. Summary

| Repo | What it really is | Stars | Licence | Last push | Use for Chronos |
|---|---|---|---|---|---|
| [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | 84 brand files, mostly from public marketing sites | 125.6k | MIT (repo) | 2026-10-28 | File structure only |
| [sunil-dsb/design.md](https://github.com/sunil-dsb/design.md) | URL to DESIGN.md extractor | 73 | MIT | 2026-05-19 | Read for techniques |
| [inspoai-studio/inspoai-studio](https://github.com/inspoai-studio/inspoai-studio) | Hosted-style AI UI generator platform | 35 | PolyForm Noncommercial | 2026-09-13 | Skip |
| [lnkiai/m3e-canvas](https://github.com/lnkiai/m3e-canvas) | Browser sketchpad for Material screens | 10k | MIT | 2026-11-01 | Colour idea; maybe flow sketches |
| [nexu-io/html-anything](https://github.com/nexu-io/html-anything) | Agent HTML editor for documents and social posts | 9.4k | Apache-2.0 | 2026-10-13 | Skip for the app |

## 2. The five repos

### 2.1 VoltAgent/awesome-design-md

**Contents.** 84 folders (confirmed by the API), each with a `DESIGN.md` of roughly 30 KB. The [Linear file](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md) has YAML tokens for colours, type, radius, spacing and components, in the [Google format](https://github.com/google-labs-code/design.md).

**The catch.** Its own disclaimer says the files are "extracted from public websites" and represent "publicly visible CSS values". So they describe marketing pages, not the app. Linear's own summary calls itself a "product-focused marketing canvas", and its components include `pricing-card` and `testimonial-card`. My keyword count of marketing-style components:

| File | Components | Marketing-like |
|---|---|---|
| Linear | 21 | 10 |
| Superhuman | 16 | 7 |
| Cal.com | 26 | 10 |
| Notion | 50 | 19 |
| Raycast | 28 | 6 |

Raycast is the most app-like, with `command-palette-row`. Notion's file describes a navy hero band and a purple pill button, not the Notion app people work in.

**Use.** Copy the section structure for our own file. Do not adopt a brand's look: it would give Chronos someone else's identity, and those brands' trademarks remain theirs. Note also that the repo no longer accepts `DESIGN.md` pull requests, per its contributing guide.

### 2.2 sunil-dsb/design.md

**Contents.** A real engine in [`lib/engine`](https://github.com/sunil-dsb/design.md/tree/main/lib/engine) with tests and hand-checked reference data in `eval/gold`. Playwright crawls a site, and the output is `DESIGN.md`, `tailwind.css`, `shadcn-theme.css` and `tokens.json`.

**Strategies worth knowing:**
- **Two phases:** scripts extract values; the AI only names and explains them. [SKILL.md](https://github.com/sunil-dsb/design.md/blob/main/SKILL.md) says every number must be copied from `tokens.json`, and an invented value is a "phantom value". This is the best idea in the repo.
- **Perceptual grouping:** colours are clustered by OKLCH distance, not by matching hex strings.
- **Visibility weighting:** [`visibility-weight.ts`](https://github.com/sunil-dsb/design.md/blob/main/lib/engine/visibility-weight.ts) ranks tokens by area, heading level, interactivity and position above the fold, so a footer border can't outrank a main button.
- **Stability layers:** a temporary sale banner can't become the primary colour.
- **Honest refusal:** [`shadcn-emit.ts`](https://github.com/sunil-dsb/design.md/blob/main/lib/engine/shadcn-emit.ts) fills 17 shadcn theme slots with contrast-checked text colours. If the source doesn't use Tailwind or shadcn, it writes a reason instead of a misleading theme.

**Cautions.** 73 stars, no pushes since May, and the comparison table against rivals is its own claim.

**Use.** Apply the two-phase rule to Chronos: tokens live in one file, and agents may not invent values. Don't run it to produce a look.

### 2.3 inspoai-studio/inspoai-studio

**Contents.** A full platform needing Supabase and external services, with a design search, moodboards, a site scanner and an MCP server. "200K+ real product screens" is *its own claim*: the screens live in its database, not in the repo. The repo has 19 commits, the last on 2026-09-13.

**Useful to read:**
- [`lint.js`](https://github.com/inspoai-studio/inspoai-studio/blob/main/backend/src/agentic-v3/lint.js) checks output without AI: it removes emoji and catches placeholder text.
- [`dna.js`](https://github.com/inspoai-studio/inspoai-studio/blob/main/backend/src/agentic-v3/dna.js) forces the model to pick from hand-made design systems and never invent hex values.

**Why skip it.**
- The [licence](https://github.com/inspoai-studio/inspoai-studio/blob/main/LICENSE) is noncommercial and source-available, not open source. Chronos should not copy its code. Reading it for ideas is fine.
- Its rules include things other tools call tells, such as uppercase tracked table headers and hero patterns with a "Label · Category" eyebrow.
- It ships scrapers named after other design libraries (`mobbinScraper.js`, `savee_crawler.js`). I only read the start of the first, so I make no claim about what they do, but Chronos shouldn't depend on them.

### 2.4 lnkiai/m3e-canvas

**Contents.** A polished static web app, no account or server. You drag real Material 3 Expressive parts onto screens, link them, tap through the flow, and copy a prompt for a coding tool. It has a [JSON format agents can write](https://github.com/lnkiai/m3e-canvas/blob/main/public/agent.md) and share as a link.

**Ideas worth keeping:**
- **Roles at fixed tones:** [`color.ts`](https://github.com/lnkiai/m3e-canvas/blob/main/lib/color.ts) turns one seed colour into a scheme by placing each role at a fixed lightness. This is the same thinking as our Subject colours at fixed lightness. The file says it is an approximation; the full version is [material-color-utilities](https://github.com/material-foundation/material-color-utilities) (Apache-2.0).
- **Sizes that stay on the scale:** [`tokens.ts`](https://github.com/lnkiai/m3e-canvas/blob/main/lib/tokens.ts) defines buttons by size step, so a size between steps stays proportional.
- **Three contrast levels** in one theme.
- **Sketch, tap through, then prompt** is a cheap way to test a flow before building it.

**Why it can't set the look.** Everything it makes is Material. Our [UI tooling research](https://github.com/MatyasMayer/Chronos/blob/research/ui-tooling/research/ui-tooling.md) already advises against copied platform chrome, and on iPhone Material would look foreign. Its prompts would also push an agent towards Material parts.

**Possible use.** A quick tap-through sketch for "What does a Subject page look like?", for flow only, ignoring the styling.

### 2.5 nexu-io/html-anything

**Contents.** A local editor that drives your agent CLI to produce finished HTML: magazine articles, decks, posters, social cards. The README says 75 skills; the tree has 81 `SKILL.md` files. It comes from the team behind [Open Design](https://github.com/nexu-io/open-design), which now sells credits.

**What the editorial skills contain.** They are mostly short briefs in Chinese. [`web-proto-editorial`](https://github.com/nexu-io/html-anything/blob/main/next/src/lib/templates/skills/web-proto-editorial/SKILL.md) is four bullets. [`doc-kami-parchment`](https://github.com/nexu-io/html-anything/blob/main/next/src/lib/templates/skills/doc-kami-parchment/SKILL.md) is the most careful, with exact colours and line heights by text type.

**Why skip it for the app.**
- These are documents you read once, not screens you work in.
- They lean into known AI looks. Kami's `#f5f4ed` parchment with a serif sits next to the cream-and-serif cluster Anthropic's skill flags (near `#F4F1EA`). `article-magazine` uses a thick left accent rule on quotes, the tell Impeccable names.

**Possible use.** Kami's line-height rules (compact text 1.4 to 1.45, reading text 1.5 to 1.55) are a fair starting point for long Notes or a printed Note. Take the numbers, not the parchment.

## 3. Close relatives worth more attention

### Better fits than the named five

**[Meliwat/awesome-ios-design-md](https://github.com/Meliwat/awesome-ios-design-md)** (633 stars, MIT, last push 2026-05-21). About 200 apps, with real app screens and motion, including `things-3`, `craft`, `notion`, `todoist`, `linear`, `google-calendar`, `bear`, `obsidian`, `apple-notes` and `duolingo`. The [Things 3 file](https://github.com/Meliwat/awesome-ios-design-md/blob/main/design-md/productivity/things-3/DESIGN.md) describes the Magic Plus, the checkbox spring and headings with hairlines, all directly about our kind of screen.
*Caution:* the contributing guide says values come from live builds, but the Things file gives no per-value source, so exact hex values are unverified. It also relies on SF Pro, which we can't bundle. Read these for how a screen works; don't copy them.

**[jakubkrehel/skills](https://github.com/jakubkrehel/skills)** (10.8k stars, MIT, last push 2026-11-02). Separate skills for UI polish, typography, colour, accessibility, layout and writing. [`better-ui`](https://github.com/jakubkrehel/skills/blob/main/skills/better-ui/SKILL.md) gives exact values and respects a project's own conventions, so it should fit alongside a chosen direction. `better-layout` covers room for translated text, which helps with long Czech Subject names. `interface-review` checks a branch for interface regressions. `variant` explores alternatives (not read in detail).

**[oil-oil/oil-ui](https://github.com/oil-oil/oil-ui)** (2.8k stars, MIT, last push 2026-11-04). This is the closest tool to the job in hand. It studies peers in the category and turns words like "clean" into visible choices. In a comparison, any two directions may share at most one of layout, type, colour and imagery, and it squints at them side by side. It keeps "looks good" and "task works" as separate checks.
*Cautions:* the skill text is in Chinese, the optional comparison page needs Python 3.10+ (not installed on this machine), and it allows an update-check script, which should be read first. A `pro` version exists.

**[bitjaru/styleseed](https://github.com/bitjaru/styleseed)** (1k stars, MIT, last push 2026-11-01). See section 4.

### Useful for checking

- **[google-labs-code/design.md](https://github.com/google-labs-code/design.md)** (28.7k, Apache-2.0). `lint` checks references and WCAG contrast, and `diff` compares versions. This closes the gap that my mock colours have no measured contrast.
- **[dembrandt/dembrandt](https://github.com/dembrandt/dembrandt)** (3.9k, MIT). Extracts W3C tokens and has a CI "Drift Gate" action. It could later compare the running Chronos against its tokens. Not read beyond the README.
- **[VoltAgent/official-design-md](https://github.com/VoltAgent/official-design-md)** (528, MIT). 11 files published by their owners, including Vercel, Atlassian, Nuxt and Oxide. These are the most trustworthy examples of a well-written file.
- **[kwakseongjae/oh-my-design](https://github.com/kwakseongjae/oh-my-design)** (562, MIT). Grades files by sourcing: "if nobody could confirm a value, it stays blank". A good rule, though its language skills are for Korean, Japanese and Chinese.

### Seen, not assessed

[Paidax01/web-to-design-md](https://github.com/Paidax01/web-to-design-md) (no licence, so not reusable), [yuvrajangadsingh/brandmd](https://github.com/yuvrajangadsingh/brandmd), [bergside/design-md-chrome](https://github.com/bergside/design-md-chrome), [bergside/typeui](https://github.com/bergside/typeui) (custom licence), [JimLiu/baoyu-design](https://github.com/JimLiu/baoyu-design) (custom licence), [Owl-Listener/designer-skills](https://github.com/Owl-Listener/designer-skills), [plugin87/ux-ui-agent-skills](https://github.com/plugin87/ux-ui-agent-skills), [raintree-technology/hig-doctor](https://github.com/raintree-technology/hig-doctor), [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills), [funboy322/avoid-ai-design](https://github.com/funboy322/avoid-ai-design), [MengTo/Skills](https://github.com/MengTo/Skills).

## 4. The one piece of measured evidence

[StyleSeed's BENCH-V1](https://styleseed-demo.vercel.app/gate) ran 20 UI tasks on two agents under three conditions, 120 scored cells:

| Agent | Bare | Rules only | Rules plus render, score, revise |
|---|---|---|---|
| Codex | 74.8 | 76.4 | 80.1 |
| Claude Code | 74.1 | 70.4 | 79.4 |

Distinctiveness was the lowest category, at about 69 to 71, even with the loop.

**How far to trust it.** It is run by the vendor, scored by one AI judge (Gemini 3.1 Pro), and not independently repeated. StyleSeed itself says it supports only the narrow claim that the loop beat rules alone in this protocol, and that it doesn't replace human judgement. It is still the only head-to-head result found across both research rounds.

**What it suggests.** Handing an agent a rule file isn't enough. Each screen should be rendered, reviewed and revised. Distinctiveness will still need human taste, meaning the owner's.

## 5. What changes in the recommendation

The first note's pipeline stands, with these changes:

1. **Direction:** consider `oil-ui` alongside or instead of Interface Design. It is actively maintained and its comparison rules suit this ticket. Interface Design has had no commits since June.
2. **Polish:** add `jakubkrehel/skills` (`better-ui`, `better-typography`, `better-colors`, `better-layout`) next to Emil Kowalski's skills. They disagree on curves: Jakub uses `cubic-bezier(0.2, 0, 0, 1)`, Emil `cubic-bezier(0.23, 1, 0.32, 1)`. Choose one in `DESIGN.md`.
3. **References:** give agents the Things 3, Craft and Todoist files as behaviour references, not as sources of values.
4. **Carrier:** Chronos writes its own `DESIGN.md`, with one rule from `sunil-dsb/design.md`: agents use tokens and never invent values. Google's linter checks it.
5. **Process:** every screen goes through render, review and revise. Drift checks can come later, once the app exists.

**Unchanged skip list, plus:** Inspo AI Studio, html-anything for app screens, and any brand-clone `DESIGN.md` as Chronos's identity. M3E Canvas is for flow sketches only.

## 6. Limits

- No tool was run, so nothing here shows real output quality.
- Read in part: `oil-ui` (README, start of `SKILL.md` and `design-direction.md`), `jakubkrehel/skills` (README, `better-ui`, `build-design`), and the large source files in sections 2.2 to 2.4.
- I read one app file in the iOS catalogue, so its quality across the other apps is unknown.
- The marketing-component counts rely on keyword matches and undercount.
- Licence comments are a practical reading, not legal advice.
- Star counts are popularity, not quality, as the first note showed.
