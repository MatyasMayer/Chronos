# What makes polished productivity apps look great?

Research for [issue #8](https://github.com/MatyasMayer/Chronos/issues/8). Question: what makes the best productivity and calendar apps look and feel polished, and what should Chronos borrow?

**Sourcing.** Each claim links to its source. Primary sources come first: Apple HIG, Linear's own design posts, Raycast's blog, Cultured Code's feature page, Inter's site and Notion's help centre. Designers' own write-ups come next (Rauno Freiberg, Emil Kowalski, Refactoring UI by Wathan and Schoger), then NN/g. Reputable reviews (MacStories, TechCrunch) are used only where a vendor publishes nothing. A few points come from hands-on use of the apps rather than a published source; they are marked *(observation)* and should be checked against the real app before they are relied on. Retrieved 2026-10-21.

---

## TL;DR: the ten principles

1. **Content first, chrome recedes.** Navigation and sidebars get dimmed and quietened so the work stands out. Linear: "Don't compete for attention you haven't earned." ([Linear, refresh](https://linear.app/now/behind-the-latest-design-refresh))
2. **One neutral palette plus one accent, built in a perceptual colour space.** Linear builds whole themes from 3 inputs (base, accent, contrast) in LCH, down from 98 hand-picked variables ([Linear, redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)). Greys do most of the work. Colour carries meaning (subject, overdue), not decoration.
3. **Remove borders.** Separate things with spacing, background tint and soft shadows. Linear found borders had "quietly proliferated" and cut them, so structure is "felt not seen" ([Linear, refresh](https://linear.app/now/behind-the-latest-design-refresh)). Refactoring UI says the same: "use fewer borders" ([Refactoring UI](https://www.refactoringui.com/)).
4. **One typeface family, a small type scale, hierarchy from weight and colour.** Linear uses Inter, with Inter Display for headings ([Linear, redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)). Apple warns that mixing typefaces "can obscure your information hierarchy" and says to avoid Ultralight, Thin and Light weights ([HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
5. **Strict alignment and a spacing system.** Linear aligned every label, icon and button on the sidebar, saying users will "feel" it within minutes ([Linear, redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)). Refactoring UI says to start with too much whitespace, then use a defined spacing and sizing scale.
6. **Motion must be fast, purposeful and interruptible, and rare on frequent actions.** Keep animations under 300 ms. Animate only `transform` and `opacity`. Never animate keyboard-triggered actions ([Emil Kowalski](https://emilkowal.ski/ui/great-animations)). Apple: "generally avoid adding motion to UI interactions that occur frequently" ([HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion)).
7. **Keyboard-first on desktop, thumb-first on phone, same mental model on both.** Desktop gets ⌘K, single-key shortcuts, and shortcuts shown next to actions (Raycast, Notion Calendar). Phone gets 44×44 pt targets and a reachable bottom-right primary action (Things' Magic Plus).
8. **Mix time-bound and undated items in one calm agenda.** Things puts calendar events "neatly grouped at the top" of Today, past events turn grey, and Upcoming shows 7 days individually and then groups later items by week or month ([Things features](https://culturedcode.com/things/features/), [MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/)). This is the model for Chronos' Today/This week view.
9. **Fast capture with natural language.** Fantastical parses "Coffee with Chris tomorrow from 6 to 7" into an event ([MacStories](https://www.macstories.net/reviews/fantastical-for-iphone-review/)). Things understands "Tom", "Sat" and "Wed 8pm" ([Things features](https://culturedcode.com/things/features/)). Todoist: thought-to-task "should be mere seconds" ([Adobe XD interview](https://xd.adobe.com/ideas/perspectives/interviews/reimagining-an-app-from-the-ground-up-behind-the-scenes-of-todoists-redesign)).
10. **Every empty state is designed.** Say what goes here, why it is empty, and give a button to fix it ([NN/g](https://www.nngroup.com/articles/empty-state-interface-design/)). Dark mode, contrast and Reduce Motion are first-class from day one, not a later port ([HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).

---

## 1. Typography

| Finding | Source |
|---|---|
| Linear uses **Inter Display for headings** ("expression while staying readable") and **regular Inter for everything else**. | [Linear, How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) |
| Inter is a free, open UI typeface. It has a variable font (weights 100 to 900), optical sizes from "text" to "display", and OpenType features: `tnum` (tabular numbers, "useful for tabular data"), `cv11` (single-storey a), `ss01` (alternate digits), slashed zero, and `ss02` (disambiguation). | [rsms.me/inter](https://rsms.me/inter/) |
| Apple's default and minimum text sizes: iOS **17 pt default, 11 pt minimum**. macOS **13 pt default, 10 pt minimum**. | [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Prefer Regular, Medium, Semibold or Bold. Avoid Ultralight, Thin and Light. Too many typefaces "make an interface feel internally inconsistent or poorly designed." Keep hierarchy intact when people resize text. Let users enlarge text to at least 200%. | [HIG Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |
| Notion offers only three page fonts (Default, Serif, Mono) plus a Small text toggle. Restraint is part of the look. | [Notion Help, Customize & style](https://www.notion.com/help/customize-and-style-your-content) |
| Refactoring UI: set up a type scale, keep line length under control, align baselines rather than centres, scale line height with font size, and don't rely on size alone for hierarchy. Balance weight and contrast, and de-emphasise secondary text. | [Refactoring UI](https://www.refactoringui.com/) |

**For Chronos**
- Use **Inter (variable)** everywhere, with display optical sizes for headings. Self-host it; it's free. Turn on `font-feature-settings: "tnum"` for times, dates and counters so columns of times line up in agenda and calendar views. Alternative: the system stack (`-apple-system, "Segoe UI Variable", …`), which looks native on both iPhone and Windows but differs between them. Inter keeps the look identical across both of the user's devices, which suits a PWA.
- Use a small scale of about 6 steps, for example 12 / 13 / 14 / 16 / 20 / 28 px. Body text is 14 px on desktop (dense, Linear-like). On iPhone, body text should be **at least 16 px**: Apple's 17 pt is the native default, and iOS Safari zooms into inputs below 16 px *(observation, well known)*. Never go below 11 px.
- Show hierarchy with **weight (400/500/600) and text colour (primary, secondary, tertiary)** rather than many sizes.

## 2. Spacing and density

| Finding | Source |
|---|---|
| Linear tested spacing "from very condensed to more spacious". It tuned sidebar, tabs, headers and panels to "reduce visual noise, maintain alignment, and increase the hierarchy and density of navigation". The 2024+ refresh made tab bars compact and reduced icon and text sizes in tabs. | [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui), [Linear refresh](https://linear.app/now/behind-the-latest-design-refresh) |
| Linear "keeps information density without overwhelming": "surface exactly what you need, when you need it." | [Linear refresh](https://linear.app/now/behind-the-latest-design-refresh) |
| Raycast offers an optional **Compact Mode** that blends "all other elements for a minimal appearance". | [Raycast, A fresh look and feel](https://raycast.com/blog/a-fresh-look-and-feel) |
| Things: "The app is dominated by white space." | [MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) |
| Refactoring UI: start with too much whitespace and remove it. Use a spacing system. Don't stretch content to fill the screen. Avoid ambiguous spacing (gaps between groups must be clearly larger than gaps within them). | [Refactoring UI](https://www.refactoringui.com/) |
| Apple: align elements and use indentation for hierarchy ("people perceive indented items as subordinate"). Put the most important items top and leading. Pad about **12 pt around bezelled controls and about 24 pt around bezel-less ones**. Touch targets default to **44×44 pt** (28×28 minimum). macOS uses 28×28 default and 20×20 minimum. | [HIG Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |

**For Chronos**
- Use a **4 px base grid** with the scale 4 / 8 / 12 / 16 / 24 / 32 / 48. Pick tokens from it and nothing else.
- Use two densities from one component set: **comfortable on touch** (rows of at least 44 px) and **compact on desktop** (rows of 32 to 36 px, Linear-like). Switch with a pointer media query (`@media (pointer: coarse)`), not by device sniffing.
- Cap reading width for Notes (about 65 to 75 characters). Don't stretch subject pages full-bleed on a wide Windows monitor. Notion's narrow default and optional full width is the pattern to copy ([Notion Help](https://www.notion.com/help/customize-and-style-your-content)).

## 3. Colour system and dark mode

| Finding | Source |
|---|---|
| Linear generates themes in **LCH** ("perceptually uniform") from **3 variables: base, accent and contrast**, instead of 98 per theme. Elevation levels (background, panel, dialog, modal) are derived the same way. A contrast slider produces high-contrast themes. | [Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui) |
| Linear moved from "a cool, blue-ish hue" to "a warmer gray that still feels crisp, but less saturated". Too warm "risks looking muddy". | [Linear refresh](https://linear.app/now/behind-the-latest-design-refresh) |
| Refactoring UI: use **8 to 10 greys**, 5 to 10 shades of the primary colour, and sparing semantic accents (red for destructive, yellow for warning, green for positive). Use 9 steps (100 to 900) with 500 as the base. Avoid pure black. Define shades up front and don't keep adding new ones. | [Refactoring UI, Building your color palette](https://www.refactoringui.com/previews/building-your-color-palette) |
| Apple: "Avoid using the same color to mean different things". Never rely on colour alone (pair it with shape or text). Make every colour work in light, dark and increased contrast. Test in bright and dim light. | [HIG Color](https://developer.apple.com/design/human-interface-guidelines/color) |
| Apple dark mode: respect the system setting and don't force an in-app-only toggle. Dark colours "aren't necessarily inversions". Contrast must be **≥ 4.5:1, ideally 7:1 for small text**. Use adaptive semantic colours (primary to quaternary label). Slightly darken white-background images. | [HIG Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) |
| Todoist's red is a single saturated accent on warm neutral surfaces *(observation; no first-party doc found)*. Apple Calendar and Fantastical colour each event by its calendar's colour ([MacStories on Things showing events in "that calendar's assigned color"](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/)). | as noted |

**For Chronos**
- Build the palette in **OKLCH** (CSS `oklch()`, the modern equivalent of Linear's LCH approach). Use a neutral scale of about 10 steps with a slight warm or cool tint, plus **one brand accent** for primary actions, focus and the "now" line.
- **Subject colours** are the one place where many hues are allowed, because they carry meaning. Derive them in OKLCH at a fixed lightness and chroma so no subject shouts louder than another. Use them as small marks (a dot, a left bar, a soft tint), never as large saturated fills. Always pair colour with the subject code text (BI-XXX) so it never relies on colour alone, per the HIG.
- Reserve **red for overdue or destructive only**. Don't reuse it for an exam-type colour.
- Write semantic tokens (`--bg`, `--bg-elevated`, `--text-secondary`, `--border-subtle`, `--accent`), with light and dark values via `prefers-color-scheme`. Default to following the system.

## 4. Motion and micro-interactions

| Finding | Source |
|---|---|
| Animations "usually shorter than 300ms". Use `ease-out` for responsiveness. Animate only `transform` and `opacity`, at 60 fps. **Never animate keyboard-initiated actions.** Animations must be interruptible. Respect `prefers-reduced-motion`. | [Emil Kowalski, Great animations](https://emilkowal.ski/ui/great-animations) |
| Match frequency to novelty: things used "hundreds of times a day" (command menus, context menus) should barely animate. The author removed list animations because they felt sluggish. Use interruptible, physics-based gestures. Destructive gestures commit on release; light ones can fire mid-gesture. Use screen corners and edges as easy targets (Fitts's law). | [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) |
| Apple: add motion purposefully. Never make motion the only carrier of information. Make it realistic and gesture-following. Avoid motion on frequent interactions. | [HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion) |
| Things: tapping a task makes it "pop out into a card-like form while the rest of the list fades". Long-press lifts it for dragging. Haptics accompany drag, Magic Plus and pull-to-search. | [MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) |

**For Chronos**
- Use motion tokens: `fast 120ms`, `base 200ms`, `slow 280ms`, `ease-out`. Ticking a task off gets one satisfying check animation of about 200 ms, which is the delight moment. Opening ⌘K is instant.
- Drag-to-reschedule on the calendar and drag from the task list to a time slot (as in Amie and Things Upcoming) must follow the pointer 1:1 and snap on release.
- Use optimistic UI: every action shows its result immediately. Speed is the biggest part of what feels polished.

## 5. Keyboard-first vs touch-first

| Finding | Source |
|---|---|
| Raycast: a bottom **action bar** shows contextual actions **with their shortcut**, "so users learn shortcuts over time". ⌘K opens all actions. The app icon is a keycap. | [Raycast, A fresh look and feel](https://raycast.com/blog/a-fresh-look-and-feel) |
| Notion Calendar (formerly Cron, "the fastest keyboard-friendly calendar"): `?` opens a searchable shortcut list, and there are system-wide shortcuts. Single keys such as `C` (create) and `T` (today) *(per third-party guides)*. | [Notion Help, Notion Calendar shortcuts](https://www.notion.com/help/notion-calendar-keyboard-shortcuts) |
| Things on Mac: **Type Travel**, "You just start typing where you want to go". On iOS: the **Magic Plus** button sits bottom-right; tap to add, or drag to insert at an exact spot, make a heading or send to the Inbox. | [Things features](https://culturedcode.com/things/features/) |
| Apple: 44×44 pt touch targets, spacing between controls "as important as size". | [HIG Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) |

**For Chronos**
- **Desktop (Windows):** ⌘K/Ctrl+K command palette as the hub (navigate to a subject, create a task or event, jump to a date). Single-key shortcuts such as `C` create, `T` today, `J/K` move, `X` complete and `?` cheat sheet. Show the shortcut hint in menus and tooltips, Raycast-style. Visible focus rings.
- **iPhone:** a bottom tab bar (Today, Calendar, Subjects, Search) plus a floating **add** button bottom-right for thumb reach. Swipe a task row to complete or reschedule. No hover-only affordances.
- Use one data model and one set of verbs, with two input dialects.

## 6. Information hierarchy

- **Emphasise by de-emphasising.** Make secondary text grey (a lighter weight is the second tool), so the title and due date stand out without making them bigger ([Refactoring UI](https://www.refactoringui.com/)). Linear dimmed the sidebar "a few notches" so the main content wins ([Linear refresh](https://linear.app/now/behind-the-latest-design-refresh)).
- **Fewer icons.** Linear cut icon usage, scaled icons down and removed coloured icon backgrounds ([Linear refresh](https://linear.app/now/behind-the-latest-design-refresh)). Raycast keeps icons consistent: one outline style, the same stroke width and corner radii ([Raycast](https://raycast.com/blog/a-fresh-look-and-feel)). Chronos should use **one icon set**, for example Lucide or Phosphor, at one stroke weight.
- **Consistent placement.** Linear put header actions (share, copy link) in the same spot on every view ([Linear refresh](https://linear.app/now/behind-the-latest-design-refresh)). Every Chronos Subject page should have the same skeleton: header (code, name, colour), then Next up (nearest deadline and event), then tabs or sections for Tasks, Events, Resources, Notes and Projects.
- **Labels are a last resort.** Format data so it explains itself, for example "Fri 14:30 · TH:A-1242" rather than "Date: … Room: …" ([Refactoring UI](https://www.refactoringui.com/)).

## 7. Showing many deadlines and events without clutter

| Pattern | Who | Source |
|---|---|---|
| Events grouped at the top of Today, tasks below. Past events turn grey. | Things | [Things features](https://culturedcode.com/things/features/), [MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) |
| Upcoming: next 7 days as individual sections, then grouped **by week, then month** (progressive compression of the far future). | Things | [MacStories](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) |
| "This Evening" sub-bucket splits a day without adding times. | Things | [Things features](https://culturedcode.com/things/features/) |
| **DayTicker**: a compact horizontal strip of days synced with a scrolling list below. Scrolling the list snaps the ticker to the day. | Fantastical (iOS) | [MacStories, Fantastical for iPhone](https://www.macstories.net/reviews/fantastical-for-iphone-review/) |
| Sidebar of upcoming events and reminders next to the Day/Week/Month/Year grid. | Fantastical (Mac) | [MacStories, Fantastical 2 for Mac](https://www.macstories.net/reviews/fantastical-2-for-mac-review-reinvented/) |
| Unscheduled to-dos in a left column, dragged onto the calendar to time-block. | Amie | [TechCrunch](https://techcrunch.com/2022/03/17/amie-is-a-new-calendar-app-with-a-social-twist) |
| Events tinted with their calendar's colour. All-day items pinned in a strip above the time grid. Month view shows dots or "+N more" rather than overflowing *(observation: Apple Calendar, Notion Calendar)*. | Apple Calendar, Notion Calendar | (observation) |

**For Chronos (a semester can have 6 to 8 subjects × weekly lectures and labs + deadlines)**
- **Today/This week dashboard:** a "Now/Next" card at the top (current or next event with time and room), then **Due soon** (tasks due in 7 days or less, sorted by date, with overdue in red at the very top), then today's events as a compact timeline. Show 7 days individually, then group "Later this month" and "Later" collapsed, which is the Things compression model.
- **Separate recurring noise from rare signal.** Weekly lectures and labs repeat and are low-information, so render them quietly (outline or light tint). Exams, presentations and deadlines are rare and high-stakes, so render them solid or with a badge. This one rule removes most calendar clutter.
- **Deadlines are not events.** Show task deadlines as markers (an all-day strip or a flag on the day) rather than fake time blocks.
- Month view: subject-coloured dots plus "+N". Week view: a time grid with a "now" line in the accent colour. Phone: an agenda list plus a DayTicker-style strip.
- **Progressive disclosure:** the subject page shows "next 3" plus a "show all" link. Collapse completed tasks.

## 8. Empty states

- NN/g: (1) communicate status, which means not showing "nothing here" while content is still loading; (2) teach what the area is for; (3) give a direct action button ([NN/g, Designing empty states in complex applications](https://www.nngroup.com/articles/empty-state-interface-design/)). Refactoring UI lists "design empty states" as a finishing touch ([Refactoring UI](https://www.refactoringui.com/)).
- **For Chronos:** a new Subject shows one line per section ("No tasks yet. Add the first assignment, or press C") with an inline add field. Today with nothing due says something positive and calm ("Nothing due today") plus a peek at the next item. Use a muted icon at most; skip big illustrations that age badly. Show skeleton rows while loading, never an empty message.

## 9. Process lessons (how the polished teams get there)

- Linear: hundreds of Figma explorations, then **stress tests across every view type**, then shipping behind feature flags with an internal toggle to compare old and new, all in about 6 weeks with designers and engineers pairing daily ([Linear redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)). Linear also built an internal colour tool to iterate tokens quickly ([Linear refresh](https://linear.app/now/behind-the-latest-design-refresh)).
- Emil Kowalski: review animations the next day with fresh eyes ([Great animations](https://emilkowal.ski/ui/great-animations)).
- **For Chronos:** build the design tokens (colour, type, space, motion) and a tiny component sheet *before* screens. Build one "stress page" with a subject that has 30 tasks, long names, overlapping events, dark mode and a phone width, and check every change against it.

---

## Curated references: what to borrow from each

| App | Borrow this | Read or look at |
|---|---|---|
| **Linear** | 3-variable LCH theme generation, warm neutral greys, near-zero borders, dimmed sidebar, Inter and Inter Display, strict alignment, compact density, consistent header actions. | [How we redesigned the Linear UI](https://linear.app/now/how-we-redesigned-the-linear-ui) · [Behind the latest design refresh](https://linear.app/now/behind-the-latest-design-refresh) |
| **Things 3** | Today with events on top, This Evening, Upcoming compression (days, then weeks, then months), Magic Plus drag-to-insert, Type Travel, task-opens-as-card animation, white space. Apple Design Award winner. | [Things features](https://culturedcode.com/things/features/) · [MacStories review](https://www.macstories.net/reviews/things-3-beauty-and-delight-in-a-task-manager/) |
| **Notion** | Restraint: 3 fonts, page icon plus optional cover, narrow default width, slash command for blocks, `/color` on blocks. Subject pages should feel like Notion pages. | [Customize & style your content](https://www.notion.com/help/customize-and-style-your-content) |
| **Notion Calendar (Cron)** | Keyboard-first calendar (`?` cheat sheet, single-key commands, ⌘K), menu-bar or global shortcuts, linking events to pages, which matches Chronos' event-to-subject link. | [Notion Calendar shortcuts](https://www.notion.com/help/notion-calendar-keyboard-shortcuts) |
| **Raycast** | ⌘K action palette with shortcut hints, an action bar that teaches shortcuts, a consistent outline icon set (same stroke and radii), optional compact mode. | [A fresh look and feel](https://raycast.com/blog/a-fresh-look-and-feel) |
| **Fantastical** | Natural-language event entry ("Lab every Tue 9:15 TH:A-1247"), DayTicker strip synced with the list on phone, list sidebar next to the grid on desktop. | [MacStories iPhone review](https://www.macstories.net/reviews/fantastical-for-iphone-review/) · [Fantastical 2 for Mac](https://www.macstories.net/reviews/fantastical-2-for-mac-review-reinvented/) |
| **Amie** | Tasks and calendar side by side; drag a to-do into a time slot. "Joyful" small delights. Caution: reviews cite sync reliability, so polish must not come before correctness. | [TechCrunch](https://techcrunch.com/2022/03/17/amie-is-a-new-calendar-app-with-a-social-twist) · [Inverse interview](https://inverse.com/tech/amie-calendar-app-dennis-muller-ceo-interview) |
| **Todoist** | Quick add with natural language, "thought to task in seconds", a single-accent warm palette, priority shown as coloured flags *and* p1 to p4 text. | [Adobe XD interview](https://xd.adobe.com/ideas/perspectives/interviews/reimagining-an-app-from-the-ground-up-behind-the-scenes-of-todoists-redesign) |
| **Craft** | Native-feeling documents that work well on both mobile and desktop (started mobile-first). Mac App of the Year 2021. Model for Notes and Resources pages that look good on iPhone. | [Mac App of the Year 2021 coverage](https://www.01net.it/craft-docs-wins-mac-app-of-the-year-for-apples-2021-app-store-awards/) |
| **Apple Calendar** | Platform conventions on iPhone: calendar-colour tinting, all-day strip, month dots, red "now" line *(observation)*. Pair with the HIG for sizes and contrast. | [HIG](https://developer.apple.com/design/human-interface-guidelines) |
| **Arc** | A vertical sidebar that holds navigation and pinned items, and per-Space colour theming. This maps to "pinned subjects" in the Chronos sidebar, each tinted with its subject colour. *(Secondary sources only.)* | [lifeintech review](https://www.lifeintech.com/2023/03/23/arc-browser) |

**Craft and theory reading**

- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines): [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility). The source for the numbers in this file.
- [Refactoring UI](https://www.refactoringui.com/), especially [Building your color palette](https://www.refactoringui.com/previews/building-your-color-palette). Tactics over talent: hierarchy, spacing systems, fewer borders, empty states.
- [Rauno Freiberg, Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design). Frequency vs novelty, interruptibility, gesture intent.
- [Emil Kowalski, Great animations](https://emilkowal.ski/ui/great-animations). Concrete web animation rules.
- [NN/g, Empty states in complex applications](https://www.nngroup.com/articles/empty-state-interface-design/).
- [Inter typeface](https://rsms.me/inter/). Features worth turning on (`tnum`, `cv11`, `ss02`).

---

## Starter token sheet for Chronos (derived from the above)

```
Type     Inter var; scale 12/13/14/16/20/28; weights 400/500/600; tnum for times
Space    4px grid: 4 8 12 16 24 32 48
Radius   6 (controls) / 10 (cards) / 14 (sheets)
Rows     44px touch, 32-36px pointer
Colour   OKLCH neutrals x10 (slight tint), 1 accent, subject hues at fixed L/C,
         red = overdue/destructive only; light+dark via prefers-color-scheme
Contrast >= 4.5:1 text, aim 7:1 small text
Motion   120/200/280ms ease-out; transform+opacity only; none on keyboard actions;
         honour prefers-reduced-motion
Icons    one outline set, one stroke width
```

## Open questions (for later tickets)

- Inter vs native system font stack: decide when the stack is chosen. A PWA favours Inter for identical rendering on iPhone and Windows.
- Should Chronos offer a theme or contrast setting (Linear-style), or only follow the system light/dark? The HIG argues for following the system.
- Subject colour assignment: automatic from an OKLCH wheel, or user-picked from a curated set of about 10?
