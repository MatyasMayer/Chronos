# Chronos uses the Yellow Now identity with Leaf green

Chronos looks like a station sign: a Leaf green plate (`#00612E`) holds a yellow insert (`#F4E52E`) for what is live now, set in Barlow and Barlow Condensed with 6 px corners and square tick boxes. Black mode sits on pure black, for the owner's OLED iPhone, and Light mode on a soft paper (`#F0F2EC`). The theme follows the system, with a setting to fix it to Black or Light.

The owner chose this by eye and confirmed it on an iPhone 14. A colour study recommended deep blue (`#173F70`), mainly because it stays apart from brick for colour-blind viewers. The owner kept green and accepted that, since "Overdue" always carries a word and an icon. Leaf replaced the earlier `#0F4A3D`, which looked dirty rather than fresh. Pure white was too bright, and bordered panels around the blocks in Light mode were tried and dropped.

## Consequences

- Colour carries meaning and nothing else does the same job: yellow means live now, and brick (`#B8432A` on black, `#A5371F` on paper) means overdue.
- Subjects and Event kinds get no colour or icon of their own. An Event's kind is a word beside its room. An exam is the one exception and stands out as a heavy block.
- Yellow nearly vanishes on paper (1.16:1), so outside the plate it keeps a thin green outline in Light mode.
- The calendar must tell Event kinds apart without colour, if it needs to at all, by shape or a short label.
- A theme setting exists, so Settings needs a System, Black and Light choice.

The prototype is `prototypes/visual-identity/today.html` on the `prototype/visual-identity` branch, and the colour study is `research/plate-colour.md` on the `research/plate-colour` branch.
