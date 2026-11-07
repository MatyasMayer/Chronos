# What is the most beautiful way to animate Chronos?

Research for [What is the most beautiful way to animate Chronos?](https://github.com/MatyasMayer/Chronos/issues/37). Question: which animation engines and agent skills are worth using, and how should the five key moments move (ticking a Task, Undo, opening the Add sheet, the now marker, the plate changing to the next Event)?

**Sourcing.** Third-party repos were read through the GitHub API only (tree listings and raw files). Nothing was cloned, installed or run, and instructions found inside those files were treated as data. Repo facts (licence, stars, last push, commit counts) come from the GitHub API on 2026-11-07; commit SHAs are listed so the reading can be reproduced. Library docs (Motion, Base UI, Tailwind, MDN, GSAP licence) were fetched through a summarising fetch tool, so quotes are as that tool returned them and should be re-read on the page before they go into an ADR. Motion's behaviour was also checked in its source (`spring.ts`). GSAP's size comes from the bundlephobia API.

**Labels.** *Verified* = read in a primary source. *Judgement* = my choice. Every duration, easing value and spring value in sections 6 and 7 is judgement. *Not verified* = could not be checked. **Nothing here has been seen on a real iPhone or at 60 Hz.** Section 9 lists what needs a device.

---

## 1. Answer in brief

1. **All seven leads exist. None of them fits Chronos as an installed skill or engine.** Six are built for marketing pages, generated video, or standalone motion-graphics studios. `oil-oil/oil-motion` says in its own `SKILL.md` that it is not for UI transitions or micro-interactions. `greensock/gsap-skills` is genuine and official, but it is for GSAP, and GSAP is the wrong engine for this app (section 5). Details are in section 2.
2. **Emil Kowalski's and Jakub Krehel's skills are real, MIT-licensed, actively maintained, and fit.** They live at `emilkowalski/skills` and `jakubkrehel/skills`. They already say what Chronos's own principles say: do not animate frequent actions, use `ease-out`, keep transitions interruptible, and gate movement behind `prefers-reduced-motion`.
3. **Engine: CSS transitions first (Tailwind v4 plus Base UI's `data-starting-style` and `data-ending-style`), Motion as the escape hatch, no second engine.** None of the five key moments needs a timeline library, a physics engine, or scroll-driven animation. Motion stays installed for what CSS cannot do (list layout animation, velocity-carrying gestures), imported lazily.
4. **The prototype's motion has never been watched.** `today-notes.md` lists "the animations in motion" under "Not seen rendered". Its values (a `cubic-bezier(.2, 1.4, .4, 1)` overshoot on the tick, a 220 ms roll on the tab counts) are unreviewed starting points, not decisions. Section 7 proposes calmer values.
5. **Tokens:** keep `design-principles`' 120 / 200 / 280 ms scale, add an explicit "instant" tier for keyboard-triggered actions, swap in a stronger `ease-out`, and define reduced motion as token values that degrade (distance to 0, press scale to 1) rather than a global kill switch.

---

## 2. The seven leads

All data below was read on 2026-11-07. "Source" means the files I read, not the README.

| Lead | Exists? | What it actually is (source) | Licence | Last activity | Fits Chronos? |
|---|---|---|---|---|---|
| [`nexu-io/motion-anything`](https://github.com/nexu-io/motion-anything) (`b016900`) | Yes | **Not a bridge for agents. A standalone local web app** (`node cli/bin/motion.js serve 4399`) for generating animated pages and launch videos, plus a recipe library ([`PROGRESS.md`](https://github.com/nexu-io/motion-anything/blob/main/PROGRESS.md)). Recipes are folders with CSS/JS and a `recipe.motion.yaml`. | Apache-2.0 | 9 commits, all 2026-07-06/07; nothing since | **No** (see below) |
| [`anymotion-agent/anymotion`](https://github.com/anymotion-agent/anymotion) (`edbe38f`) | Yes | **A CLI that makes 1080p MP4 explainer videos.** The "checks its own output frame by frame" claim is true: `preview_frames` and `check_composition` drive Puppeteer through a `window.seek(t)` contract ([README](https://github.com/anymotion-agent/anymotion/blob/main/README.md), [`video-renderer.js`](https://github.com/anymotion-agent/anymotion/blob/main/src/render/video-renderer.js)). It needs FFmpeg, an API key and 7 runtime dependencies including Puppeteer ([`package.json`](https://github.com/anymotion-agent/anymotion/blob/main/package.json)). | MIT | 29 commits, 2026-08-08 to 2026-09-03; v1.1.2 | **No** |
| [`iart-ai/web-animation-skills`](https://github.com/iart-ai/web-animation-skills) (`b6dba3e`) | Yes | **Nine skills** (gsap-web, 60fps-animation, page-transition-animation, accessible-animation, micro-interaction, glassmorphism, svg-animation, lottie-animation, ascii-animation). "GSAP, SVG, Lottie, mobile micro-interactions" is accurate. The README funnels to a paid agent at iart.ai. | MIT | 19 commits, one author, all on 2026-06-22 | **Partly, but redundant** |
| [`greensock/gsap-skills`](https://github.com/greensock/gsap-skills) (`aed9cfd`) | Yes | **Eight GSAP skills** (core, timeline, ScrollTrigger, plugins, react, frameworks, performance, utils). Official: owned by the `greensock` org, and GSAP's author `jackdoyle` is the top contributor. | MIT (skills). GSAP itself is under the [Standard "No Charge" licence](https://gsap.com/standard-license/), effective 2025-04-30 | 24 commits, latest 2026-04-21 (repo pushed 2026-07-29); 18 k stars | **Good skill, wrong engine** |
| [`msrbuilds/animate-css-skill`](https://github.com/msrbuilds/animate-css-skill) (`35a8e22`) | Yes | One `SKILL.md` plus a bundled `animate.min.css` (Animate.css 4.1.1). Matches the "plain CSS and React, IntersectionObserver and reduced-motion" description. | **None** (no LICENSE file; the API reports `null`) | 4 commits, all on 2026-04-08 | **No** |
| [`oil-oil/oil-motion`](https://github.com/oil-oil/oil-motion) (`07e31f2`) | Yes | **Does not match the description.** It turns AI-generated video or sprite sequences into scroll, pointer or drag-controlled web animation. There is no "canvas particles" pipeline: the word "particle" does not appear in the README or `SKILL.md`. The drag/damping code (`smoothDamp` in `assets/interactive-motion.ts`) exists, but it scrubs video, not UI. Its pipeline needs Python, Pillow, FFmpeg and an image/video generation API behind a local credentials server. | MIT | 26 commits, 2026-08-07 to 2026-10-04; 2.8 k stars | **No** |
| [`musoyangrigor/scroll-video-website-skill`](https://github.com/musoyangrigor/scroll-video-website-skill) (`e61e534`) | Yes | Matches its description: video to a WebP frame sequence on a scroll-scrubbed full-viewport canvas ([`SKILL.md`](https://github.com/musoyangrigor/scroll-video-website-skill/blob/main/scroll-video-website/SKILL.md)). | MIT | 20 commits, 2026-08-21 to 2026-09-04 | **No** (as the issue guessed) |

### Per-lead notes

**motion-anything.** The "400+ recipes" claim is roughly true: the README says 403, and `recipes/` holds 355 folders, of which 134 are vendored copies under `recipes/imported/` (the README says those are react-bits components used "with the author's permission", per [`ATTRIBUTION.md`](https://github.com/nexu-io/motion-anything/blob/main/ATTRIBUTION.md); I did not verify that permission). I did not reconcile 403 against 355. Its [`MOTION-SPEC.md`](https://github.com/nexu-io/motion-anything/blob/main/MOTION-SPEC.md) is sensible (restraint budget, `transform` and `opacity` only, a reduced-motion fallback for every recipe). The recipes themselves are not: the two that matter here break that spec.
- [`checkbox-pop.css`](https://github.com/nexu-io/motion-anything/blob/main/recipes/app/checkbox-pop/checkbox-pop.css) transitions with `cubic-bezier(.34,1.6,.5,1)` (a strong overshoot), a 0.34 s stroke and a 0.3 s scale. Its YAML says `avoid_when: Slowing down a frequent action`, and then ships a 300 ms bouncy tick.
- [`bottom-sheet.css`](https://github.com/nexu-io/motion-anything/blob/main/recipes/app/bottom-sheet/bottom-sheet.css) uses a 0.46 s `cubic-bezier(.32,1.3,.5,1)`, again with overshoot. Its YAML declares `easing: spring`, but the file is a CSS curve, not a spring.
- `feedback-delight` is defined as 500 to 800 ms "celebratory" motion. That is the opposite of Chronos's register.
The value of the repo is a list of ideas, and the same ideas are in Emil's and Jakub's skills. Not worth installing. The 8.4 MB `reicon-icons.json` and the agent-engine launcher tell you what it is: a product, not a skill.

**anymotion.** The self-checking idea (screenshot N moments, audit overlaps) is the only transferable part, and Chronos can get it from Playwright, which the tech-stack decision already includes with a WebKit run. Playwright's WebKit is not an iPhone, so it will not settle feel. Its bundled `framer-motion` skill is competent but generic: it uses the `framer-motion` package name and handles reduced motion only by a manual `matchMedia` check, with no mention of `MotionConfig reducedMotion`. The 260 KB `saas-explainer-motion` skill is irrelevant.

**iart-ai.** Content quality is decent. `micro-interaction` already uses `motion/react`, `accessible-animation` has a useful three-tier model (remove, soften, keep), and `60fps-animation` is correct on `transform` and `opacity`. But it recommends an overshoot easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`) as "tasteful", pushes GSAP/ScrollTrigger/Lenis, and says "60/120fps". It adds nothing the two named authors do not say better, from a single-day, single-author repo whose README funnels to a paid product. Its tiered reduced-motion idea is worth borrowing as an idea.

**gsap-skills.** Genuine and high quality. But its README tells agents to "recommend GSAP" for animation unless the user has chosen another library. Installed next to Motion, that instruction competes with the project's choice, so I would not install it. GSAP 3.15.1 is 70.6 kB minified, 27.4 kB gzip for the main entry (bundlephobia API, not tree-shaken); Motion's own docs give 43 kB for the full `motion` component, or roughly 5 kB plus 24 kB with `LazyMotion` and `domAnimation` ([Motion bundle-size docs](https://motion.dev/docs/react-reduce-bundle-size); the sum is mine). The licence is free for commercial use, with a restriction on building competing visual animation builders ([GSAP standard licence](https://gsap.com/standard-license/)); fine for Chronos. The reason to reject it is fit, not cost: section 5.

**animate-css-skill.** No licence file means all rights reserved by default. It bundles Animate.css, which is under the Hippocratic License 2.1 (an ethical-use licence, not OSI-approved; read from the [LICENSE](https://github.com/animate-css/animate.css/blob/main/LICENSE)). Its mapping table is marketing-site motion: buttons get `pulse`, `bounceIn`, `tada`, modals get `zoomIn`/`bounceIn`/`flipInX`, errors get `shakeX`, and everything below the fold reveals on scroll. Animate.css itself was last pushed 2024-07-29. Reject.

**oil-motion.** The issue's description ("cursor physics, drag inertia and canvas particles") does not match the source. Its own `SKILL.md` says it is *not* for "interface transitions, button feedback, and layout motion that CSS, JavaScript, SVG, Lottie, or real-time 3D can handle", which is what Chronos needs. It also sets up a credentials flow, a local server and API-billed generation. Reject.

**scroll-video.** Out of scope. Chronos has no scroll-driven pages; the skill itself holds the first frame under reduced motion.

---

## 3. What we already have

### Motion (the library)

`motiondivision/motion` is MIT, was pushed on 2026-11-07, and its latest tag is v14.10.1 (2026-11-06). Facts that matter here:

- **Bundle** (from the [docs](https://motion.dev/docs/react-reduce-bundle-size)): full `motion` component 43 kB; `m` with `LazyMotion` just over 5 kB; `domAnimation` +24 kB (animations, variants, exit, tap/hover/focus); `domMax` +38 kB (adds layout animations and drag); `useAnimate` mini 3.3 kB (WAAPI only) or hybrid 23 kB.
- **Reduced motion** ([docs](https://motion.dev/docs/react-accessibility)): `<MotionConfig reducedMotion="user">` disables transform and layout animations and keeps `opacity` and `backgroundColor`. `useReducedMotion()` returns a boolean.
- **Springs** ([docs](https://motion.dev/docs/react-transitions)): `duration`/`bounce` springs are the easy API; setting `stiffness`/`damping`/`mass` overrides them.
- **A gotcha confirmed in source:** the code in [`spring.ts`](https://github.com/motiondivision/motion/blob/main/packages/motion-dom/src/animation/generators/spring.ts) says "Time-defined springs ignore inherited velocity. Velocity from interrupted animations causes massive oscillation on small-range animations." So a `duration`/`bounce` spring does *not* carry the finger's velocity or a mid-flight velocity when retargeted. Anything that must hand off velocity (a flicked sheet) needs the physics form (`stiffness`, `damping`, `mass`) or CSS plus Base UI's own release handling. Neither the Emil nor the Jakub skills mention this.
- **Base UI integrates with Motion** ([Base UI animation handbook](https://base-ui.com/react/handbook/animation)) through `render={<motion.div/>}`, `AnimatePresence` and `keepMounted`. But the handbook recommends CSS transitions first, because they "can be cancelled midway" and reverse smoothly.

### Emil Kowalski's skills

- **Where:** [`emilkowalski/skills`](https://github.com/emilkowalski/skills) (`c8a7962`), MIT, 54 k stars, pushed 2026-11-04, 60 commits, 58 by Emil. Install `npx skills@latest add emilkowalski/skills`.
- **17 skills:** `emil-design-eng` (the core), `animate`, `animate-expo`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `remove-animations`, `choreograph`, `animation-performance`, `animation-vocabulary`, `apple-design`, `mobile-native`, `pick-ui-library`, `prototype`, `break-ui`, `ask-sonner`, `write-swift`.
- **What the core says** ([`emil-design-eng`](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md)): a frequency table (100+ times a day: "No animation. Ever."; tens a day: remove or drastically reduce; occasional: standard; rare: delight); never animate keyboard-initiated actions; custom easings `cubic-bezier(0.23, 1, 0.32, 1)` and `cubic-bezier(0.32, 0.72, 0, 1)`; never `ease-in`; UI animations under 300 ms; press feedback `scale(0.97)` over 100 to 160 ms; transitions rather than keyframes for anything fired rapidly; springs with `bounce` 0.1 to 0.3 only for drag-to-dismiss and playful interactions.
- **`apple-design`:** default UI spring critically damped (`damping 1.0`, response 0.3 to 0.4); bounce (`~0.8`) only when a gesture carried momentum; always animate from the live value so grabs and reversals work.
- **`mobile-native`:** hover gated to `(hover: hover) and (pointer: fine)`, no tap highlight flash, `100dvh`, safe areas, `touch-action: manipulation`, "test on hardware", and "test as an installed PWA".
- **`remove-animations`:** an audit that only subtracts. It is the most Chronos-shaped skill in either set.
- Skills are prompts for agents. They contain instructions such as a fixed greeting on first invoke. Harmless, but they are untrusted text: read them at a pinned SHA before installing.

### Jakub Krehel's skills

- **Where:** [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills) (`f41f027`), MIT, 11.4 k stars, created 2026-07-10, pushed 2026-11-07, at least 100 commits (the API page I read was full). Install `npx skills add jakubkrehel/skills`; also a Claude Code plugin named `interfaces`. His older single-skill repo [`make-interfaces-feel-better`](https://github.com/jakubkrehel/make-interfaces-feel-better) (3.9 k stars, last pushed 2026-08-29) predates this suite. Other copies exist (`lucasness/design-kit` vendors eleven of his skills unmodified), so install from his repo, not a fork.
- **15 skills:** `better-interface`, `better-ui` (surfaces, icons, motion), `better-typography`, `better-colors`, `better-accessibility`, `better-layout`, `better-writing`, `interface-review`, `explain-interface`, `break`, `build-design`, `teardown`, `state-machine`, `variant`, `away`.
- **Motion rules** ([`better-ui`](https://github.com/jakubkrehel/skills/blob/main/skills/better-ui/SKILL.md), [`animations.md`](https://github.com/jakubkrehel/skills/blob/main/skills/better-ui/animations.md), [`enter-exit.md`](https://github.com/jakubkrehel/skills/blob/main/skills/better-ui/enter-exit.md)): press scales to exactly `0.96` over `150ms` `ease-out`; keystrokes, row hovers and tab switches get instant feedback or at most `150ms` on `opacity` or `background-color`; exits are `150ms`; springs always `bounce: 0` for icon swaps; transitions for interactive state, keyframes only for run-once sequences; `transition-property` named explicitly, never `all`; `will-change` only after you see first-frame stutter.
- **Reduced motion** ([`motion-and-zoom.md`](https://github.com/jakubkrehel/skills/blob/main/skills/better-accessibility/motion-and-zoom.md)): disable parallax and large travel, replace slides and scales with an opacity cross-fade, keep brief functional feedback; "Never put critical information only in a timed element. A vanished toast with the only link to an undo action is data loss on a schedule." That last line supports the prototype's choice to keep Undo on the row.
- **Where it clashes with Chronos:** the staggered entrance (300 ms, 100 ms stagger, 4 px blur, 12 px rise) is for infrequent hero-style entrances. Chronos has none and should not adopt it. His own skill says to match the project's motion language where no rule gives a value, so the Chronos spec wins.
- **Note on `overlay`:** `enter-exit.md` says the `overlay` transition property "is Chromium only", with other browsers showing and hiding instantly. The prototype's Add menu uses `display`/`overlay` with `allow-discrete`. Its exit animation may therefore not run on iPhone. This is not verified in Safari and goes on the device list (section 9).

### Overlap with the other research

The local-only branch `research/ai-ui-skills` (commit `9c577a4`, read with `git show`, not touched) already recommends Emil's skills "for motion and iPhone feel" and does not cover Jakub's. Nothing there conflicts with this finding. I did not read its worktree.

---

## 4. Do the five moments need a second engine?

| Need in the five moments | CSS (Tailwind v4 + Base UI hooks) | Motion | GSAP |
|---|---|---|---|
| Colour fill, stroke draw, press scale, small translate + fade | Yes | not needed | not needed |
| Row collapse after the 4 s settle | Yes, measured-height transition as in the prototype (`interpolate-size` is not Baseline per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size), so no `height: auto`) | `layout` if the list becomes complex | not needed |
| Popover enter/exit | Yes: `@starting-style`, `allow-discrete` (Baseline 2024, [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)), Base UI `data-*` hooks | not needed | not needed |
| Bottom sheet with swipe, snap points, release | Base UI `Drawer` provides swipe, `snapPoints`, `--drawer-swipe-movement-y`, `--drawer-swipe-strength` ([Drawer docs](https://base-ui.com/react/components/drawer)) | only if release feel needs real velocity handoff | not needed |
| Clock-driven marker and plate change | Yes: keyed swap with a one-shot keyframe | not needed | not needed |
| Timelines, scroll-linked motion, SVG morphing, text splitting | none required | none required | the only things GSAP adds, and Chronos wants none of them |

A second engine is **not justified**. Costs: 27 kB gzip (GSAP) on top of Motion, two mental models, agent skills that disagree on defaults, and a licence that Webflow can amend (clause: continued use counts as acceptance). Benefit for Chronos: none of the five moments.

---

## 5. Recommendation

**Engine**
1. **CSS transitions are the default.** Tailwind v4 utilities with explicit property lists, Base UI `data-starting-style`/`data-ending-style` for popups, `@starting-style` for new nodes. Avoid bare `transition`: Tailwind's compiled list includes `box-shadow`, `filter`, `backdrop-filter`, `display` and others ([Tailwind transition-property](https://tailwindcss.com/docs/transition-property)).
2. **Motion stays, loaded lazily, used only when CSS cannot do the job:** list layout animation (a Task moving between positions), swipe-to-complete if it is ever added (physics spring, not time-defined; `domMax` +38 kB), or an imperative one-off via mini `animate()` (3.3 kB). The five moments in section 7 need none of it. If Motion is used, set `<MotionConfig reducedMotion="user">` once at the root.
3. **Reject GSAP, Lottie, Anime.js and Animate.css.** No second engine.
4. Do not bring in a scroll-linked or View Transitions layer for routes. Route changes are the most frequent action in the app, so they get no transition by default. This narrows `ui-tooling`'s suggestion (View Transitions for route changes, "progressive enhancement") rather than contradicting it; it can be revisited per route.

**Agent skills**
- **Adopt, pinned to a reviewed commit, project-level:**
  - Emil: `emil-design-eng`, `animate`, `review-animations`, `remove-animations`, `mobile-native`. Use `apple-design` when a gesture or sheet is built.
  - Jakub: `better-ui` (motion and surfaces), `better-accessibility` (`motion-and-zoom.md`), `state-machine` (renders every state of a component on a throwaway page, which suits the plate's Live, Free and no-Event states).
- **Optional, on request only:** Emil's `find-animation-opportunities` and `improve-animations` (they push toward adding motion, against Chronos's frequency rule), `choreograph`, `animation-vocabulary`, Jakub's `interface-review`.
- **Skip:** all seven leads, Emil's `animate-expo`, `write-swift`, `ask-sonner` (Chronos has no toast; Undo stays on the row), Jakub's `teardown`, `away`, `build-design`.
- **Order of authority when they disagree:** the Chronos spec (this finding's section 6, once adopted), then Emil, then Jakub. Known differences: press scale 0.97 (Emil) or 0.96 (Jakub); I pick 0.96 at 120 ms (judgement, inside both authors' ranges).
- Skills are text that agents follow. Read each at the pinned SHA before installing, as `research/ai-ui-skills` also advises.

---

## 6. Motion principles and tokens

### Principles (judgement, built on the settled ones)

1. **Frequency decides.** Keyboard-triggered: no animation. Tens of times a day: colour, opacity and a few pixels at most. Occasional: standard. Rare: may delight. (Emil's table; `design-principles` §4; Apple HIG "avoid adding motion to UI interactions that occur frequently", as quoted in `design-principles`.)
2. **Nothing animates on load, on resume from background, or when the user navigates.** The app is opened many times a day; the first frame is the final frame. This is why the clock-driven changes below animate only when seen live.
3. **Only `transform`, `opacity` and colour move.** Two small exceptions, both paint-only or one-off: the stroke draw on the tick and the measured-height row collapse.
4. **Interruptible by default.** Transitions retarget; keyframes only for one-shot sequences that nobody can interrupt.
5. **Motion never carries information alone.** Every animated change leaves a static cue (a word, a colour, an icon). This follows ADR-0003 ("Overdue always carries a word and an icon") and Jakub's rule.
6. **Yellow means live now (ADR-0003).** Yellow is never used for feedback, attention or a flash. No pulsing, no pinging. A looping animation would also be an ambient loop that needs a pause control (WCAG 2.2.2, as Jakub's skill notes) and would cost battery.
7. **No overshoot on frequent actions.** Overshoot is allowed only when a gesture carried momentum (Emil, `apple-design`), which in v1 means at most a flicked sheet.

### Reconciliation with `design-principles` §4

`design-principles` proposed `fast 120 ms`, `base 200 ms`, `slow 280 ms`, `ease-out`, "transform and opacity only", no animation on keyboard actions, and "one satisfying check animation of about 200 ms" for the tick. I keep all of it except two things:
- **Tick length.** I propose a combined beat of about 140 ms with no overshoot, not 200 ms, because ticking is a tens-a-day action and the prototype's 220 ms overshoot has not been seen. Reopen if a real-device look says it feels flat.
- **Tier names.** I add `instant` (0) and give the exit rule "one token faster than the enter".

### Proposed tokens (CSS; Tailwind v4)

Tailwind v4 has a `--ease-*` namespace that creates `ease-*` utilities, but no `--duration-*` namespace; non-utility variables belong in `:root` ([Tailwind theme docs](https://tailwindcss.com/docs/theme)). Defining `--ease-out` inside `@theme` overrides Tailwind's default `ease-out`, which is intended.

```css
@theme {
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);        /* enters, responses (Emil) */
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);    /* on-screen moves (Emil) */
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);     /* sheets (Emil, from Ionic) */
}

:root {
  --dur-instant: 0ms;     /* keyboard-initiated, 100+/day */
  --dur-fast: 120ms;      /* press, colour, check draw, popover exit */
  --dur-base: 200ms;      /* popover enter, row collapse, plate roll, sheet exit */
  --dur-slow: 280ms;      /* sheet enter */

  --press-scale: 0.96;
  --travel: 8px;          /* small translate for enters */
  --collapse-dur: var(--dur-base);

  --settle-delay: 4000ms; /* behaviour (prototype), not a motion value */
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --press-scale: 1;     /* no scale */
    --travel: 0px;        /* no translate; opacity cross-fade remains */
    --collapse-dur: 0ms;  /* rows leave by opacity only */
  }
}
```

In markup this reads as `duration-(--dur-fast) ease-out` (arbitrary-value shorthand; syntax is the v4 pattern but I did not confirm this exact form). Under reduced motion the durations stay, so the opacity and colour cross-fades remain, while distance and scale go to nothing. This is the tiered model from Jakub's skill and the HIG, implemented through tokens rather than a global `transition: none !important`, which the prototype uses (`today.html` lines 395 to 397) and which removes the colour feedback too.

Spring tokens, only if Motion is used (not needed for the five moments). Derived by my arithmetic from Emil's `apple-design` table (default `damping 1.0`, response 0.3; momentum `damping ~0.8`) using stiffness = (2π / response)² and damping = 2 · ratio · √stiffness with mass 1. Motion's physics form defines the ratio as `damping / (2·√(stiffness·mass))` (confirmed in `spring.ts`); the response-to-stiffness mapping is the usual SwiftUI convention and I did not verify it against Apple's page.
- `spring-settle`: `{ type: "spring", stiffness: 440, damping: 42, mass: 1 }` (critically damped, no overshoot)
- `spring-flick`: `{ type: "spring", stiffness: 440, damping: 34, mass: 1 }` (ratio about 0.8; only after a flick)

---

## 7. The five moments

All values are judgement. Frequency figures are my estimates, not measurements. "Prototype" means `prototypes/visual-identity/today.html` on `main`. Glossary words follow `GLOSSARY.md`; "plate", "Now insert" and "Done today" are used as ADR-0003 and the prototype use them (see section 8).

### 7.1 Ticking a Task

Frequency: roughly 5 to 20 a day, from a thumb or a pointer. That is "tens a day", so it barely animates.

| | Spec |
|---|---|
| Properties | Box `background-color` and `border-color` to plate green; check `stroke-dashoffset`; press `scale`; title strike `background-size`; later, row `height` and `opacity` |
| Press | `scale(var(--press-scale))` on the 28 px box while pressed, `--dur-fast`, `ease-out`. The 44 px target is unchanged |
| Fill + check | Colour fill `--dur-fast` `ease-out`; stroke draw 24 to 0 over `--dur-fast`, no delay. **No overshoot, no scale-up "seat".** Whole beat about 140 ms |
| Row text | The strike draws left to right over `--dur-fast` with the check. "Done at 11:40" swaps instantly. The row does not move (prototype fix 2) |
| Counts | The "N overdue" and "N due today" tab text changes with a `--dur-fast` opacity cross-fade (the prototype rolls it 220 ms with translateY); a tab that reaches zero retracts over `--dur-base` as in the prototype |
| Settle | 4 s after the last tick, ticked rows collapse into "Done today": measured `height` to 0 over `--collapse-dur` with `ease-out`, `opacity` out over `--dur-fast`, then they are moved in the DOM. Do not start while a pointer is down in the list or focus is inside it (the prototype handles focus only); this addresses its known "list can shift under a thumb" weakness |
| Interruption | All CSS transitions, so un-ticking mid-draw or mid-collapse reverses from the current state. The prototype's `setTimeout` DOM move re-checks the `leaving` class, which is the right guard. Another tick resets the 4 s timer |
| Reduced motion | `--press-scale: 1`; stroke appears already drawn (no draw); strike appears instantly; the colour fill still transitions (a state cue, not motion); collapse uses opacity only (`--collapse-dur: 0`); counts swap with no travel |
| Not to do | No confetti, no bounce, no sound, no yellow (yellow is live now). The only haptic available on iPhone is the native checkbox `switch` tap (ADR-0001), so never add a visual that tries to match it |

*Change from the prototype:* drop `--click: cubic-bezier(.2, 1.4, .4, 1)` and the 220 ms `seat` keyframe (lines 82, 222 to 224). Keep the stroke draw but shorten it from 160 ms plus 40 ms delay to 120 ms.

### 7.2 Undo

Frequency: occasional. It follows a tick, so it must feel like the tick in reverse.

| | Spec |
|---|---|
| Properties | Same as the tick, reversed; Undo button `scale` on press; for a row already in "Done today": `height` and `opacity` in both lists |
| While the row is still in Tasks | Fill and check reverse in `--dur-fast` (the exit is one tier faster than the enter, so I allow 100 ms for the stroke if it looks sluggish). The strike clears instantly with the text swap back. No other movement |
| After the row has moved to Done today | The row leaves Done today and re-enters Tasks at its original position (prototype `restore`, by `data-i`). Both lists change height over `--dur-base` at the same time, no stagger. This is the only motion in the app that explains where something went, so it is worth a short move. If it looks like a jump on the device, add a `--dur-fast` opacity highlight on the restored row (neutral, not yellow) |
| Focus and announcement | Focus returns to the checkbox and the change is announced (the prototype's `#say`) |
| Interruption | A second Undo or tick during the move reverses it (transitions). Undo has no timer: it stays on the row (prototype fix 2; Jakub's skill gives the reason) |
| Reduced motion | Instant swap; the row appears or leaves with an opacity fade only |
| Not to do | No toast, no floating bar, no timeout on the Undo control. If other Undo cases arrive later (deleting a Note, say), use the same in-place pattern |

### 7.3 Opening the Add sheet

The prototype's Add is a three-choice **menu shaped as the plate, grown out of the Add button, with no scrim**, built as a native `popover`. A form sheet would follow after a choice. I spec both.

| | Spec |
|---|---|
| Frequency | Roughly 2 to 10 a day: occasional, standard animation |
| Menu properties | `opacity` and `translate` (the prototype's 10 px, I use `--travel` 8 px). The button's corner radius joins the plate over 120 ms (prototype lines 298 to 300), kept |
| Menu timing | Enter `--dur-base` (200 ms) `ease-out`, from `translate: 0 var(--travel)` and `opacity: 0`; exit `--dur-fast` (120 ms). Origin is the Add button, so the menu reads as growing from it. The prototype uses 180 ms and a weaker curve (`--slide`); the stronger `--ease-out` is the change |
| Keyboard or shortcut open | **No animation** (`--dur-instant`): the `C` shortcut on desktop and the command palette. This needs a way to tell how the menu was opened (an `openMethod` or event type); I did not verify what Base UI exposes, so an agent must check before relying on it |
| Form sheet properties | `translate` on Y from 100% to 0 on a Base UI `Drawer`. Release and snap come from Base UI's `--drawer-swipe-movement-y` and `--drawer-swipe-strength` |
| Form sheet timing | Enter `--dur-slow` (280 ms) `--ease-drawer`; exit `--dur-base` (200 ms). Tap-open has **no overshoot**. A flick-dismiss uses Base UI's release scaling. A scrim, if the sheet is modal, fades `opacity` over the same time and is a design call for the owner (the prototype's "no scrim" decision was about the menu) |
| Interruption | CSS transitions retarget: closing mid-open reverses from the current position, and re-tapping Add mid-close reopens (Base UI: transitions "can be cancelled midway"). The drag follows the finger 1:1 while `data-swiping` |
| Reduced motion | `--travel: 0` and no slide: the menu or sheet cross-fades in place over `--dur-fast`. Dragging still follows the finger, since that is direct manipulation |
| Not to do | No spring overshoot on tap-open. If real velocity handoff is wanted later, use the physics form of Motion's spring because time-defined springs ignore velocity (section 3) |

*Open question for the device:* whether the Add menu's exit animation runs in Safari (see the `overlay` note in section 3), and how the sheet behaves with the iOS keyboard (Base UI's `Drawer.VirtualKeyboardProvider` exists for this; not tested).

### 7.4 The now marker

This covers the line and tag on the Slot Ruler and the calendar's week view (`.nowl`, `.nowt` in `calendar.html`), and the elapsed part of the Now insert (the hard tonal edge at 44.4 % in the prototype). In the prototypes the clock is fixed, so nothing here has been built.

| | Spec |
|---|---|
| Properties | Position of the marker (`transform`), width of the elapsed overlay (`transform: scaleX`, origin left, on a flat-colour layer so nothing distorts) |
| Rule | **It does not glide.** The marker moves about a pixel a minute on a phone ruler (a 480-minute span, from `--span: 480` at `today.html` line 84, across a phone width: roughly 0.7 px per minute at about 340 px, my arithmetic, width not measured), so animating the step would be invisible work. Update once, on the minute boundary, with `--dur-instant` |
| On open or resume | Always set to the correct place with no animation. Listen to `visibilitychange` and `pageshow`, because iOS may suspend timers while the PWA is in the background (I did not verify iOS 27's suspension behaviour) |
| Boundary | When the Now Event ends and the next begins, the elapsed overlay resets from 100 % to 0 **instantly**; never scrub it backwards |
| Interruption | None possible: there is no animation to interrupt |
| Reduced motion | Identical, because nothing moves. No variant needed |
| Not to do | No pulse, no ping, no glow, no live-dot blink. Yellow means live now (ADR-0003); a looping effect on it would dilute that, would need a pause control, and would keep the GPU active for no information |

### 7.5 The plate changing to the next Event

The plate is the green frame holding the yellow Now insert (room code) and Next. Cases: Event A ends and the insert goes dark to "Free"; the next Event starts and the insert returns with a new room code; back-to-back Events swap directly; Next moves up one.

| | Spec |
|---|---|
| Frequency | A few times a day, and **rarely seen**: it happens at a clock boundary, and most opens of the app land between boundaries. That is why it can have a little character, and why it must never replay on open |
| Properties | Outgoing and incoming room code: `opacity` and `translate` on Y; the insert's `background-color` (yellow to socket and back); text of Next changes by opacity cross-fade |
| Timing | Old code leaves over `--dur-fast`: `translate: 0 -0.3em` and `opacity` to 0, `ease-out`. New code enters over `--dur-base`: from `translate: 0 0.3em` and `opacity: 0`, `ease-out`, starting at the same moment. The insert colour transitions over `--dur-base`. Total about 200 ms. Large text travels only a fraction of its height, which is smaller than the prototype's `roll` (`-.7em`, 220 ms, lines 150 to 151) |
| Implementation | A keyed swap with a one-shot keyframe is enough (the content is replaced, nobody can interrupt it mid-flight in normal use). No Motion or shared-element transition: the Now code and the Next code are different sizes (container-query font sizing), so a shared-element move would scale text |
| Only when witnessed | Run the animation only if the change happens while the app is visible and the change came from the clock tick. On open, resume, route entry or theme switch, render the new state with no animation |
| Interruption | If a second change lands during the animation (a clock jump), snap to the final state and skip the animation |
| Elapsed edge | Resets instantly, as in 7.4 |
| Reduced motion | `--travel: 0`: the room code cross-fades over `--dur-fast`. The insert's colour change stays |
| Accessibility | The plate is the sign: announce the change politely once, for example "Now: BI-PSI in T9:350" (judgement; screen-reader behaviour not tested) |
| Not to do | No flip-board or departure-board flap (it would look like a gimmick on the one screen opened constantly), no confetti, no stagger |

### Cross-cutting

- **Hover** styles only under `(hover: hover)`; Tailwind v4's `hover:` already compiles to that media query ([Tailwind docs](https://tailwindcss.com/docs/hover-focus-and-other-states)). No `hover` animations on rows.
- **Lists, pages, load:** no entrance, no stagger, no blur, no scroll reveal.
- **`will-change`:** none by default; add only after seeing first-frame stutter on the device and name the property (Jakub's rule).
- **Settings:** the prototype's global `prefers-reduced-motion` kill switch should become the token-based form. I recommend Chronos follows the system setting only (iOS: Settings, Accessibility, Motion; Windows 11: Settings, Accessibility, Visual effects, Animation effects, per [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)) and does not add its own "reduce motion" switch in v1. Motion's `reducedMotion="always"` exists if that changes.

---

## 8. Conflicts, glossary gaps and the open stack question

- **No ADR is contradicted.** ADR-0001 (haptics only from the checkbox switch) and ADR-0003 (yellow means live now; colour carries meaning; an Event's kind is a word) are respected. ADR-0004 does not concern animation.
- **Divergence from earlier research (both are proposals, not contradictions):** `design-principles` §4 wanted a ~200 ms tick, and `ui-tooling` listed Motion springs for press feedback, list reordering and sheet gestures plus View Transitions for routes. Section 7 gives a ~140 ms tick, CSS for press and sheets, and no route transition by default.
- **Glossary gap.** `GLOSSARY.md` does not define **plate** (ADR-0003 and the prototypes use it), nor the **Now insert** or **Done today**. The motion spec depends on all three. I propose adding at least **Plate** (the green sign that holds the yellow Now insert and Next) so agents do not drift to "card" or "banner". "Sheet" is not a glossary term either; the prototype's Add is a menu shaped as the plate, and the issue's "Add sheet" is the form that follows. Name which one the spec means.
- **"Which editor and UI kit?" (still open).** Its stated kit is Tailwind v4, shadcn/ui on Base UI, Motion and Lucide: the stack assumption I used. Nothing there changes this finding, but two things depend on how it resolves. (1) The CSS-first approach leans on Base UI's `data-starting-style`/`data-ending-style` and Drawer variables; if the kit moved to Radix, those hooks become `data-state` and the Drawer is a different component. (2) BlockNote's or Tiptap's slash menu, side menu and toolbars bring their own animations; the `/` menu is keyboard-initiated and used often, so it should get `--dur-instant`. Flag this when that ticket resolves.

---

## 9. Not verified, and what needs a real device

**Could not verify**
- The Safari 27 release notes. Search returned only secondary summaries, so iOS 27 specifics are untested assumptions.
- That Base UI exposes a reliable "opened by keyboard" signal; the exact `Drawer` release behaviour and its velocity handling.
- The exact Tailwind v4 `duration-(--var)` form; the response-to-stiffness mapping for the spring tokens.
- Safari support for `overlay` transitions (Jakub's docs say Chromium only).
- motion-anything's permission for vendored react-bits code; the gap between its 403 and the 355 recipe folders.
- Whether the Motion `layout` cost matters for the Task list; no benchmark was run.
- The owner's actual frequency of ticks, Adds and Undos. Counts here are estimates.

**Needs checking on the iPhone 14 (iOS 27, 60 Hz) as an installed PWA, and on Windows in Brave**
1. The tick beat: is about 140 ms with no overshoot satisfying or flat? Does `:active` press feedback appear on pointer-down, and does it line up with the native `switch` haptic if that is used?
2. The Done-today collapse: any jitter, and any list shift under a thumb. Compare measured-height with Motion `layout`.
3. The Add menu exit in Safari (the `overlay` question), then the sheet with the iOS keyboard open, and the left-edge swipe-back conflict (`ui-tooling`: keep the left 20 px free).
4. The plate swap: text blur or shimmer on large Barlow Condensed text during a translate; interaction with the `fit()` font-shrink script (do not run it mid-animation).
5. The yellow-to-socket colour change on pure black (OLED) and on paper.
6. Resume from background: the marker and plate are correct on the first frame with no animation.
7. Reduced motion on: iOS Settings, Accessibility, Motion, then Windows Animation effects off. Confirm the tiers behave as written.
8. Anything that looks fine at 100 % speed but wrong at 10 % in the animation inspector. Both authors recommend replaying at slow speed and looking again the next day.
9. Playwright with WebKit can screenshot states in CI, but it does not stand in for any item above.

---

## 10. Proposed conclusions

| # | Type | Conclusion |
|---|---|---|
| 1 | **ADR** | Chronos animates with CSS first (Tailwind v4, Base UI data attributes, `@starting-style`); Motion is the lazily loaded escape hatch for layout animation and velocity-carrying gestures; no second animation engine (GSAP, Lottie, Anime.js, Animate.css rejected, with the bundle and fit reasons above). |
| 2 | **ADR** | Agents use a pinned subset of Emil Kowalski's skills (`emil-design-eng`, `animate`, `review-animations`, `remove-animations`, `mobile-native`, `apple-design` for gestures) and Jakub Krehel's (`better-ui`, `better-accessibility`, `state-machine`); the Chronos motion spec outranks both; none of the seven third-party leads is installed. |
| 3 | **Spec change** | A motion section: the frequency rule; nothing animates on load, resume or navigation; `transform`, `opacity` and colour only; the tokens in section 6 (120 / 200 / 280 ms, `instant`, three easings, `--press-scale`, `--travel`) with reduced motion expressed as token values; follow the system setting only; no overshoot except after a flick. |
| 4 | **Spec change** | The five moment specs in section 7, including: clock-driven changes animate only when witnessed, the marker never glides, no looping effect on yellow, Undo stays on the row with no timer, keyboard-opened Add is instant, and the prototype changes (drop the overshoot and the tab-count roll, strengthen the easing, defer the settle while a pointer is down). |
| 5 | **Glossary term** | **Plate** (the green sign holding the yellow Now insert and Next), plus clear names for the Now insert and Done today, and a decision on whether "sheet" is a term. |
| 6 | **Spec change** | A real-device motion check (section 9, items 1 to 9) as acceptance criteria for the screens that use these moments. |

---

## Sources

**Repos (GitHub API, 2026-11-07; SHA at HEAD)**
- [`nexu-io/motion-anything`](https://github.com/nexu-io/motion-anything) `b016900`; [`anymotion-agent/anymotion`](https://github.com/anymotion-agent/anymotion) `edbe38f`; [`iart-ai/web-animation-skills`](https://github.com/iart-ai/web-animation-skills) `b6dba3e`; [`greensock/gsap-skills`](https://github.com/greensock/gsap-skills) `aed9cfd`; [`msrbuilds/animate-css-skill`](https://github.com/msrbuilds/animate-css-skill) `35a8e22`; [`oil-oil/oil-motion`](https://github.com/oil-oil/oil-motion) `07e31f2`; [`musoyangrigor/scroll-video-website-skill`](https://github.com/musoyangrigor/scroll-video-website-skill) `e61e534`
- [`emilkowalski/skills`](https://github.com/emilkowalski/skills) `c8a7962`; [`jakubkrehel/skills`](https://github.com/jakubkrehel/skills) `f41f027`; [`motiondivision/motion`](https://github.com/motiondivision/motion) `78f3ff5` (v14.10.1)
- [`animate-css/animate.css` LICENSE](https://github.com/animate-css/animate.css/blob/main/LICENSE)

**Docs**
- Motion: [bundle size](https://motion.dev/docs/react-reduce-bundle-size), [accessibility](https://motion.dev/docs/react-accessibility), [transitions and springs](https://motion.dev/docs/react-transitions)
- Base UI: [animation handbook](https://base-ui.com/react/handbook/animation), [Drawer](https://base-ui.com/react/components/drawer)
- Tailwind v4: [theme](https://tailwindcss.com/docs/theme), [transition-property](https://tailwindcss.com/docs/transition-property), [states and variants](https://tailwindcss.com/docs/hover-focus-and-other-states)
- MDN: [prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [@starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style), [`linear()`](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear), [`interpolate-size`](https://developer.mozilla.org/en-US/docs/Web/CSS/interpolate-size)
- [GSAP Standard "No Charge" licence](https://gsap.com/standard-license/); GSAP size from the bundlephobia API (gsap 3.15.1)

**In this repo**
- `GLOSSARY.md`; `docs/adr/0001` (PWA only, haptics), `0003` (Yellow Now identity), `0004`
- `prototypes/visual-identity/today.html` and `today-notes.md`; `prototypes/calendar-dashboard/calendar.html`
- `origin/research/design-principles` §4; `origin/research/ui-tooling` (Motion, Base UI Drawer, 60 fps); local `research/ai-ui-skills` at `9c577a4` (read only)
- Issues read: the stack decision (closed) and "Which editor and UI kit?" (open)
