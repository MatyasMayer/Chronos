# Motion

Throwaway prototype for [Does Chronos's motion feel right on a real iPhone?](https://github.com/MatyasMayer/Chronos/issues/49). Open `today.html` in a browser. The panel at the bottom has one speed slider per animation, and each starts at the speed the owner settled on.

## The verdict

The owner chose the character "Tichý přístroj" (quiet instrument): short, eased, no bounce apart from the tick seating into its box.

**Durations.** The owner tuned each animation by eye, in a desktop browser. They came out slower than the research proposed for almost everything small.

| Animation | Chosen | Research proposed |
|---|---|---|
| Tick and Undo (fill, check mark, strike) | 514 ms, 343 ms, 400 ms | 180, 120, 140 ms |
| Row moves to Done today | 333 ms | 200 ms |
| Counts in the tabs ("1 overdue") | 640 ms | 160 ms |
| Plate: Next moves up into Now, then lights | 857 ms, 571 ms | 300, 200 ms |
| Add menu, open and close | 250 ms, 150 ms | 200, 120 ms |
| Drawer, open and close | 311 ms, 222 ms | 280, 200 ms |
| Dock page | 90 ms out, then 210 ms in | not specified |
| Row grows into its page | 300 ms | not specified |
| Subject tabs | 333 ms | not specified |
| Calendar content swap | 160 ms | not specified |
| Markers and toggles (dock mark, segment thumb, tab underline) | 286 ms | 200 ms |
| Done today folding | 400 ms | 200 ms |
| New row highlight | 2 s | 600 ms |
| Theme change | 100 ms | 200 ms |

**Navigation.** Three kinds, three moves. This follows Material's motion patterns, and the owner agreed after trying slides first.

- **Dock pages** (Today, Calendar, Subjects, Notes) fade through: the old page is gone before the new one appears, in place, with the new one growing from 98 %. Nothing crosses the screen.
- **Subject tabs** shift 30 px along the row with a fade, in the direction of the tab.
- **A row opens into its page.** The Subject or Note row grows into the page and its name travels as part of it. Going back, the page closes into the row.

**Other moments**

- **Tick:** the box fills, the check draws, the title is struck, and after a pause the row moves to Done today.
- **Plate:** Next slides up into Now.
- **Add menu:** grows out of the Add button. The highlight of a row spans the full width, so it meets the button edge to edge.

**Calendar look.** The owner disliked how the calendar looked here and chose "Rozvrh" over a list-based "Agenda". It keeps the structure from the calendar prototype (days down, time across, Focus for Day, a grid for Month) and changes the dress: each day is a panel, an hour scale sits above, today's date sits in a Leaf block, free days are short and say "Free", each bar shows its start time, and Month uses tiles with one mark per Event.

## How it got here

| Round | Tried | What the owner said |
|---|---|---|
| 1 | Three characters A, B, C at 1×, ¼× and ⅒× | A, and everything is pleasant at ¼×; add page switching |
| 2 | Pages and tabs that fade; a name that flies to the title | Pages must arrive from the side; the name lands in the wrong place |
| 3 | Pages on a strip; one speed slider | A jump of two must run through the page between; one slider per animation |
| 4 | Cards dealt one after another, then all pages flying at once, then the old page staying put | Did not like any slide; asked for research |
| 5 | Fade through, shared axis, row grows into page | Agreed |
| 6 | Add menu joined to its button; calendar looks Rozvrh and Agenda | Rozvrh; sent the final speeds |
| 7 | The result on the iPhone 14, in the Claude app | Right, apart from an empty band at the top, which was the notch space added twice inside the app's frame |

## What the build has to carry over

- **The durations above are the owner's, not the research's.** `research/animation.md` on the `research/animation` branch proposes 120, 200 and 280 ms tokens. Those don't fit what was chosen.
- **A shared name must be measured before anything moves** and placed in document coordinates, or it lands in the wrong place and drifts when the page scrolls.
- **The Add button keeps its shape while the menu is open.** It dims on press instead of shrinking, squares its corners at once, and rounds them only after the menu has closed.
- **The pause before a ticked row leaves** is 4 s here and is a wait, not an animation.
- **Reduced motion** is only an off switch in the prototype. The research asks for a quieter version instead.

## Still open

- **Seen on the iPhone 14 only inside the Claude app.** The owner tuned every speed in a desktop browser, then watched the result on the phone and found it right. It has not been run as an installed PWA or in Brave on Windows.
- **The six proposed conclusions of the research** (two ADRs, three spec changes, the glossary terms) are not decided.
- **The now marker** is one of the five key moments and has no motion here.
- **Calendar arrows** still use a 16 px shift with a fade, unlike the Subject tabs.
- **A 45-minute Event is clipped** in the week on a phone, at about 27 px wide.
- **Not built:** the iOS swipe back, the keyboard with the bottom sheet, and Add → Event, which only switches to Calendar.

## Checked, and not checked

A script in headless Chrome ran at 390 and 1280 px with no errors and no sideways overflow: dock switches, an interrupted switch, opening and closing a Subject, tab changes, an interrupted tab change, and the three calendar views. While a row opens, the name stays within 4 px of its place in the page and ends on it.

The motion itself was judged only by the owner, by eye. Sample items are invented.
