# Calendar and Today

Throwaway prototype for [What do the calendar and dashboard look like?](https://github.com/MatyasMayer/Chronos/issues/14). Open `calendar.html` in a browser. It starts on the chosen design, and the dock or side rail switches between Calendar and Today.

## The verdict

**Calendar**

- **Week:** days run down the left and time runs across. One line with a time tag shows the clock through all seven days. Tasks sit under their day's lane.
- **Day:** Focus. The lane zooms to the hours that day uses and acts as a picker. Tapping a block shows that Event in a card below, with the next one like it and that Subject's Tasks. Free gaps of 90 minutes or more are written in the lane.
- **Month:** Grid. Weekly classes shrink to "3 classes", so exams and deadlines stand out. On a phone, the month has marks only and the chosen day is listed below it.
- **Little calendar:** the date title opens it. Arrows change the year, a month button changes the month, the Wk column opens a week, and a day jumps to that day. Today returns to now. It shows teaching week numbers, and a dot outside the Semester.
- **Event kinds:** the word only. No shape, colour or icon.

**Today**

- **No timeline.** The Slot Ruler is gone, along with the small time bars in the week section. The plate and the Tasks and Events lists stay.
- **This week:** a section called Next 7 days under Tasks and Events. It rolls forward from today. Tapping a day opens it in the calendar.
- **Quiet states:** Folded. After the last Event, or with no Events, the Now slot folds into one line ("Done, 4 Events finished" or "Free, No Events today"), and the plate shows the next Event.

**Libraries**

- **Calendar view:** custom-built. Schedule-X can't do the rotated Week or Focus.
- **Dates:** Temporal through `temporal-polyfill`. Stable Safari support was not confirmed.
- **Recurrence:** `rrule-temporal`. It only serves the owner's own repeating Events, because Sirius sends each one dated. Its compliance claim is the project's own, so test it across a clock change.

## How it got here

| Round | Tried | What the owner said |
|---|---|---|
| 1 | Calendar `#round=1&v=a` Grid, `b` Lanes, `c` Board; Today `#v=a` Week below, `b` Today and Week, `c` Week strip | Grid for Week and Month, Lanes for Day, and asked for different Days and a way to jump to any date |
| 2 | Day `#dv=a` Lanes, `b` Focus, `c` Parts, `d` Neighbours; the little calendar | Focus. Turn the Week so days are on the left with a line of the time through all of them. No timeline on Today |
| 3 | Rotated Week, Today without the Slot Ruler | Week below, Folded, the word for kinds; leave Next 7 days as it is on a phone |

Earlier options stay reachable by hash, including `#q=socket` on Today and `#kinds=shape` on the calendar.

## What the build has to carry over

- **Yellow still means live now.** The clock line is ink. Today's date uses a Leaf chip, and the Today column or row uses the `--card` surface.
- **A square box always means a Task.** Tasks are not placed on the time scale, because a deadline is a moment, not a span.
- **Finished Events are hollow,** coming ones green, live yellow with the elapsed part darker, and exams ink. A Cancelled Event is a faint outline with its name struck through.
- **An exam shows once on Today:** in the plate when it is next, otherwise as the slab. Its Next slot turns into the ink block, to match ADR 0003.
- **The Week scale must follow the clock.** The prototype runs 08:00 to 20:00, and the line disappears outside that.
- **The prototype's Today differs from `today.html`.** The Slot Ruler in `prototypes/visual-identity/` is no longer part of the design.

## Still open

- **Prep Tasks and the exam countdown** are shown but arrive in Cut 5. A Task that prepares for an Event has no place in the domain model yet.
- **The short Subject label.** Phones show `OSY` for `BI-OSY`, which is a stopgap. A Subject that has only a name needs a rule.
- **Next 7 days sits low on a phone,** about 1,350 px down on a busy morning. The owner chose to leave it.
- **The clock line crosses text** in Event blocks. The owner hasn't objected, but it can be dimmed on other days.
- **Teaching week numbers** in the little calendar are worked out from sample dates, and need the Semester data from the Import.

## Checked, and not checked

496 combinations of view, Day option, time of day, theme and date ran at 1400 and 390 px with no errors, no sideways overflow and no missing values. An earlier build also passed at 320 px, but that width wasn't rerun after the final rounds. A scripted run clicked through the little calendar, picked a block in Focus, confirmed no timeline on Today, and confirmed the clock line sits at the right time and crosses all seven days.

Sample items are invented. Swiping, dragging and adding items aren't built. It hasn't been run on a real iPhone, and no contrast was measured.
