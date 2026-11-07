# Subject page

Throwaway prototype for [What does a Subject page look like?](https://github.com/MatyasMayer/Chronos/issues/13). Open `subject.html` in a browser. It starts on the chosen variant, `#r` Cards.

## The verdict

The owner chose Tabs with an Overview, a side panel, and each Overview block on its own card.

- **Head:** the Subject's code leads, with its name beside it and one status line under it. Nothing else sits above the tabs.
- **Tabs:** Overview, Tasks, Events, Resources, Notes, Projects. Each tab after Overview shows one kind as a plain list.
- **Overview:** one card per kind, with a link to that kind's tab. It shows the three nearest Tasks, the live or next Event, the next one-off Event, the two newest Resources, the newest Note, and the Projects.
- **Side panel:** About (a line of the owner's own), Links, and the Semester line. On a desktop it stays on the right on every tab. On a phone it closes the Overview tab and doesn't appear on the others.
- **Items** open in a drawer, so the page stays where it was.
- **Self-study:** a Subject with only a name shows no Semester line and no Links, and offers to add the About line and a first item.

## How it got here

| Round | Tried | What the owner said |
|---|---|---|
| 1 | `#a` One scroll, `#b` Tabs, `#c` Semester line, `#d` Page | B points the right way; the others look too much like Today |
| 2 | `#e` Menu, `#f` Thumb tabs, `#g` Columns | Thumb tabs was closest, but the eye had nowhere to land |
| 3 | `#h` Cards, `#i` Lead, `#j` Shapes | Asked to see B again, and preferred it |
| 4 | `#k` Overview, `#l` Semester, `#m` About, `#n` all three | Liked all three, but they piled up above the tabs |
| 5 | `#o` In place, `#p` Side panel, `#q` Tiles | Side panel, but headings alone did not separate the blocks |
| 6 | `#r` Cards, `#s` Rules, `#t` Bars, `#u` Side labels | Cards |

Every variant stays reachable by its hash, and `-live`, `-free` or `-new` picks the state.

## What the build has to carry over

- **One new surface.** Cards use `--card`, `#FFFFFF` in Light and `#141C18` in Black, with a 1 px `--line` edge. ADR 0003 doesn't list it. Its contrast hasn't been measured.
- **Exam stays an ink block** inside its card. Yellow still means live now, and brick still has its word and icon.
- **The phone's tab strip scrolls.** Six tabs don't fit at 390 px, so the strip keeps the selected tab in view.

## Still open

- **The About line has no place in the domain model yet.** A Subject has no free text of its own.
- **Links in the panel.** Moodle and Course pages are link Resources here, and nothing yet says how a link gets picked for the panel.
- **Projects** arrive in Cut 2, so Cut 1 has no Projects card or tab.
- **The Semester line** shows the next one-off Event. Which one it shows when there are several is undecided.

## Checked, and not checked

Rendered in headless Chrome at 390 and 1440 px, in Black and Light. Opening an item, the Add menu, tab changes and the New state ran by script. Sample items are invented. It hasn't been run on a real iPhone, and no contrast was measured.
