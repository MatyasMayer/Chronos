# Yellow Now

## The idea
The plate is a two-colour sign: a solid highlighter-yellow Now insert with a giant dark room code, held in the deep green plate that carries Next, so "where am I, where next" reads from across a room. Yellow means live now, so when no Event is live the insert is out, the dark socket shows and the slot reads "Free" (`?state=free`, or the Prototype links at the foot of the page).

## How it extends the brief
- **The slot is the clock.** The elapsed part of Now is a hard tonal edge inside the yellow, at 44.4% (40 of 90 minutes). "50 min left" says the same in words.
- **Green frame.** The yellow sits inside a 4 px green frame, which gives it a firm edge against the paper.
- **Slot Ruler.** It sits on the paper under the plate, flush with the plate's edges. Finished Events are hollow, the live one is yellow with the same tonal edge, later ones are green, and the exam is ink.
- **Staircase rules.** Each Event row's rule is the day at true scale with that Event inked in, so the list steps down across the page.

## The 12 fixes
1. **Checkbox only.** Only the 44 px box is a control. Row text is a separate inert link. Verified: clicking the title and link ticks nothing.
2. **Undo.** There is no floating bar, so nothing can be covered. A ticked row stays in place with its own Undo. Rows move to a "Done today" list 4 s after the last tick, all together, and keep their Undo and checkbox there. Verified: two stacked ticks, undo of one, and restore into the original order.
3. **Levels.** Overdue is a solid brick flag with a glyph and the word. Due today is bold with no fill. Later is regular weight, and Monday is muted. On the plate, overdue is a brick tab and "1 due today" is a calm green tab. A done Task loses its due cell and reads "Done at 11:40".
4. **Phone first view.** The ruler ends at y=517 of 844, and shows all four Events to scale. Three Task rows follow.
5. **Notes on phone.** Notes is in the dock, next to Today, Calendar, Subjects and Add.
6. **Desktop alignment.** The plate split and column gutter share one centre line (both 844 px). Room codes and section heads share left edges (304 px and 868 px). The date in the header starts on the same edge as the Now text.
7. **Now in the list.** The live row stays a normal row with a small yellow "Now" chip and a yellow segment on its rule.
8. **Lower half.** Green tabs on heavy rules, room codes as the row lead, staircase rules and the ink slab. Masked at 480 px it still reads as this product (`_work/out/mask.png`).
9. **Room codes fit.** The size comes from container width, a size-adjusted fallback face matches the set width, and a JS guard shrinks anything left over. With Google Fonts blocked: TH:A-1442 is 320 of 334 px on phone and 413 of 516 px on desktop. At 320 px wide with Barlow loaded it is 254 of 264 px.
10. **Add.** It is the plate again, grown out of the Add button with no scrim, on both phone and desktop. On desktop it stays inside the rail so it never covers a room code. There is no "Add" heading.
11. **Repetition.** B261 shows once per layout (header on phone, rail on desktop). The clock appears only as the ruler's now tag. Case is consistent: Lab, Lecture.
12. **Exam.** It is the one ink slab on the page, with a joined "Tomorrow, Friday" tab and a matching ink bar in the Friday lane. It uses no yellow and no red. In dark mode the slab flips to chalk.

## Measured contrast
Sampled in Brave from computed styles at three points per text node, through every painted layer. Run at 390 and 1440 px, both modes, live and free, on load, ticked and settled.

| Mode | Minimum | Where |
|---|---|---|
| Light | 5.89:1 | "Yesterday", brick text on paper |
| Dark | 5.42:1 | White on the brick tab and flag |

Calculated directly from the tokens rather than sampled:

| Pair | Light | Dark |
|---|---|---|
| Ink on yellow | 13.22 | 11.70 |
| Ink on elapsed yellow | 11.55 | 9.42 |
| Add menu description on green | 7.06 | 6.13 |

- **Sampler gap:** on phone in the live state the sampler could not hit-test "until 12:30" and two of the three points on "50 min left". I did not find out why. Both are ink on yellow, so the table above covers them, and they read clearly in the renders.
- **Tab retraction:** one early reading of 1.02 was a tab caught mid-retraction. It is gone when sampled after the animation ends.
- **Other checks:** smallest text is 16 px, no target is under 44 px, and there is no horizontal overflow at 320, 390 or 1440 px.

## Known weaknesses
- **Bright yellow is a lot of colour.** It is calmed by flat fills and a slightly lower yellow in dark mode, but only real use over days will show if it stays comfortable, especially at night.
- **Desktop Now slot.** T9:350 leaves empty yellow to its right, because both codes share one size.
- **Free state socket.** The all-green plate is calm, but the socket is only a little darker than the plate, so the word "Free" and the missing yellow do most of the work, especially in dark mode.
- **Dark exam slab.** It is the brightest thing after the yellow, which is intended, though it may be too strong for a whole day before an exam.
- **Phone ruler.** The BI-SP1 label is right-aligned to the screen edge, not to its bar's start, because the bar is too narrow.
- **Row movement.** Done rows leave 4 s after the last tick, so the list can shift under a thumb that is about to tap.
- **Done today has no end.** It does not say when it clears, and ticks are not saved on reload.
- **Clock is fixed.** 11:40, or 13:05 in `?state=free`. Other plate states (after the last Event, no Events) are not built.
- **Not seen rendered:** hover, press and focus states, and the animations in motion. iPhone safe areas were not emulated. By calculation the ruler ends at about y=564 with the 47 px inset, above the dock.
- **Sample data oddity:** the BI-SP1 presentation is today but "Finish the slides" is due Friday. Shown as given.

## Full black (OLED)

Added after the owner picked this variant, on 2026-11-06. Two modes join light and dark:

- `?mode=oled` (Full black): the page is `#000`, the plate is a thin green outline, and yellow Now is the one large lit area. The exam is a chalk outline instead of a filled slab, because a filled slab would be the second brightest area.
- `?mode=oled-green` (Black with green): same black ground, but the plate, list tabs and exam keep their fills.

Yellow rises to `#F4E52E` on black. Calculated contrast: ink on yellow 14.79, ink on the elapsed part 11.24, muted on black 9.99, white on brick 5.42 (the minimum). These are token pairs, not a full audit of computed styles.

## Plate colour trial

The owner chose Black with Green but wants a different colour than the green. `plate-colour-research.md` holds the evidence. Two candidates are switchable: `?mode=oled-blue` (deep blue, plate `#173F70`) and `?mode=oled-slate` (cool slate, plate `#35404F`). `?mode=oled-green` stays as the reference. Not yet viewed on a real iPhone.

The owner dropped the blue and slate idea and found the green too dirty, not fresh enough. Blue and slate are out of the switcher. Three fresher greens replace them: `?mode=oled-emerald` (`#015F43`), `?mode=oled-jade` (`#006152`), `?mode=oled-leaf` (`#00612E`).

The owner chose Leaf as Chronos's identity: `?mode=oled-leaf` on black. `?mode=white-leaf` is the white counterpart, with the same plate on pure white. Emerald and Jade are removed.
Pure white was too white for the owner. `?mode=white-leaf`, `white-leaf-2` and `white-leaf-3` are three softer papers: `#F0F2EC`, `#E7EBE3`, `#DDE2D9`.
Light mode looked lost, so three frames are on trial with Paper 2: `&frame=panels`, `&frame=outline` (timeline hangs from the plate, lists share its green edge), `&frame=shelf` (darker band above, lighter list field below). Black is unchanged.
Frames and Papers 2 and 3 are removed: the owner chose plain Paper 1 (`#F0F2EC`) with no borders. Light is `?mode=white-leaf`.
Final: the theme follows the system, with System, Black and Light in the switcher. Black is Leaf on `#000`, Light is Leaf on `#F0F2EC`. All other themes are removed from `today.html`, so older sections above describe earlier rounds. `#free` shows the gap between Events.
