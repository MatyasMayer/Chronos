# Research: UI tooling for a polished, native-feeling web app

Ticket: [#9](https://github.com/MatyasMayer/Chronos/issues/9). Researched 2026-10-21.

**Question:** Which tooling gives Chronos a sharp, polished web UI that feels native on both iPhone (as a Home Screen web app) and Windows?

## TL;DR / recommendation

- **Foundation:** React + Tailwind CSS v4 + **shadcn/ui on Base UI** (the default since July 2026). You own the component code, so you can tune every pixel. You get accessible headless behaviour and the largest ecosystem: blocks, calendar, drawer, toast.
- **Don't use an iOS-mimicking kit** (Ionic, Konsta UI, Framework7) as the base. These kits copy iOS or Material chrome. That looks good on iPhone but foreign on Windows, and it lands in the uncanny valley whenever the copy lags Apple's current design (iOS 26). Build one neutral, crisp design language of your own. Adapt *behaviour* per platform (bottom sheets and a tab bar on touch, a sidebar and hover on desktop), not *skin*.
- **Animation:** Motion (springs, layout animations, gestures) for interactive UI. Use the **View Transitions API** for page and route changes. It works in Safari 18+, Chrome 111+ and Firefox 144+, so treat it as progressive enhancement.
- **Calendar:** build a **custom** day/week/month view on top of a date library and an RRULE library. It is the core screen and has to match the rest of the design. **Schedule-X** (MIT core) is the best off-the-shelf fallback. FullCalendar is the solid, heavier choice. Avoid react-big-calendar for a polish-first app.
- **Bottom sheets:** Base UI `Drawer` (swipe-to-dismiss and snap points). Vaul is officially unmaintained.
- **Icons/fonts:** Lucide (shadcn default) or Phosphor for icons. For text, use the `system-ui` stack: it renders SF Pro on iPhone and Segoe UI on Windows. Alternatively, bundle Inter or Geist for a single identical look on both platforms. Never self-host SF Pro or SF Symbols: Apple's license forbids it.
- **iOS polish:** `viewport-fit=cover` + `env(safe-area-inset-*)`, `overscroll-behavior`, switch-based haptics (the only haptics available), `apple-touch-startup-image`, and Motion/Base UI for gestures. Expect 60 fps by default on ProMotion iPhones.

## 1. UI foundations

| Option | What it is | Frameworks | Status (Oct 2026) | Fit for Chronos |
|---|---|---|---|---|
| **Tailwind CSS v4** | Utility CSS | any | v4.3.3 (2026-07-16) [^tw] | Yes. The base layer under shadcn/Konsta. |
| **shadcn/ui** | Copy-in components (you own the code) on a headless library + Tailwind | React (ports: shadcn-svelte, shadcn-vue) | Base UI is the default since Jul 2026. Radix is still supported, not deprecated. React Aria variants added Jul 2026. CLI v4 (Mar 2026). Calendar component (Jun 2025). [^shadcn-cl] [^shadcn-base] | **Best.** Maximum control over the look, huge ecosystem. |
| **Base UI** | Headless, unstyled primitives from the MUI / Radix authors | React | v1.0 stable 2025-12-11, v1.9.0 on 2026-10-09 [^baseui-rel]. 37 components including Drawer, Toast, Menu, Context Menu, Combobox. No calendar or date picker. [^baseui-qs] | Use via shadcn. |
| **Radix UI** | Headless primitives | React | Still supported by shadcn, but no longer the default [^shadcn-base] | Fine. Base UI is where momentum is. |
| **Ark UI / Park UI** | Headless (Zag state machines); Park adds styling | React, Vue, Solid, Svelte | Active (`@ark-ui/vue` 5.39.3 released 2026-10-05) [^ark] | Good if you pick Solid or Vue. Smaller ecosystem. |
| **Mantine** | Batteries-included styled library | React | v9.7.3 (2026-10-17) [^mantine] | Productive, but its look is recognisable and harder to make unique. Has its own dates/calendar package. |
| **Ionic Framework** | Mobile UI kit with iOS/MD "modes" | Angular, React, Vue | v9.0.0 (2026-08-19) [^ionic] | Strong iOS mimicry, but it has no Windows look, and its component model fights a desktop-dense layout. |
| **Konsta UI** | Tailwind-based iOS / Material component kit | React, Vue, Svelte | v5.5.0 (2026-09-28), "updated iOS 26 and Material Design 2025 look", MIT [^konsta] | Nice for a phone-only app. Looks alien on Windows. |
| **Framework7** | Full iOS/MD mobile app framework | Vanilla, React, Vue, Svelte | v9.2.0 (2026-09-28) [^f7] | Same problem as Ionic, plus its own router and app model. |

**Framework choice.** React has by far the deepest ecosystem for this exact stack: shadcn, Base UI, Motion's richest API, and every calendar library. Svelte is a close second: shadcn-svelte is built on Bits UI (`bits-ui@2.20.0`, 2026-10-20) and includes Calendar, Drawer and Sonner [^shadcn-svelte]. Motion has a Svelte section, and Schedule-X supports Svelte. Vue works via shadcn-vue and Ark. Solid is the thinnest (Ark/Kobalte), so it means more do-it-yourself work. For a C/C++/Java developer, React + TypeScript has the most learning material. This decision really belongs to the stack ticket.

### Why not an iOS-imitation kit

"Native-feeling" on two very different platforms comes from **behaviour and craft**, not copied chrome:

- Instant feedback and press states.
- Spring physics.
- Correct safe areas and no rubber-band glitches.
- Sheets you can swipe away.
- Crisp typography (the system font).
- Keyboard and hover affordances on Windows.

Ionic, Konsta and Framework7 nail iPhone chrome. On Windows, though, an iOS navbar or a Material ripple looks like a phone app in a window. Also, every Apple redesign (Liquid Glass in iOS 26) makes the copies look dated until the kit catches up. A tasteful custom design system built with shadcn/Tailwind looks deliberate on both platforms. This is the approach polished cross-platform products such as Linear and Notion take.

## 2. Animation

- **Motion** (formerly Framer Motion, MIT) supports React, vanilla JS, Vue and Svelte. It has spring physics and React layout animations [^motion] [^motion-gh]. Use it for press feedback, list reordering, sheet and drag gestures, and shared-element transitions within a screen. Prefer animating `transform`/`opacity`: those run on the compositor.
- **View Transitions API.** Support for same-document transitions (`document.startViewTransition`, which suits an SPA):
  - Chrome/Edge 111
  - Safari/iOS 18
  - Firefox 144

  Cross-document `@view-transition` works in Chrome 126 and Safari 18.2, but not yet in Firefox [^bcd-vt] [^bcd-vt-at]. Safari 18.4 added `view-transition-name: match-element`, and it no longer runs view transitions during a swipe-back navigation (so it doesn't double-animate) [^safari184]. Use it for route changes (Dashboard → Subject → Note, or switching calendar views), always feature-detected.
- **Spring physics** is what makes iOS feel like iOS. Use Motion springs (or the CSS `linear()` easing to approximate springs) instead of `ease-in-out`.
- **Scroll-driven animations** (`animation-timeline: view()`) and **anchor positioning** shipped in Safari 26 [^safari26b]. Both are useful for collapsing large titles and popovers without JS.

## 3. Calendar components

| Option | License / cost | Notes |
|---|---|---|
| **Custom** (date-fns/Temporal + `rrule`) | free | Full design control. Day/week/month grids are mostly CSS grid plus overlap layout. You build drag/resize yourself (Motion or pointer events). This is the most work, but the calendar is Chronos's signature screen. **Recommended**, ideally with Schedule-X as a reference. |
| **Schedule-X** | Core MIT [^sx-gh]. Premium €479/yr or €999 lifetime: Gantt, event modal with form, drag-to-create, resource view, draw, sidebar [^sx-prem] | Modern, good-looking defaults. Month grid, week, day and month-agenda views. Event-recurrence plugin. Drag-and-drop and resize plugins. React, Vue, Angular, Svelte and Preact adapters [^sx-docs]. Best off-the-shelf choice. |
| **FullCalendar** | Standard is MIT (all standard views). Premium from $480 for timeline/resource views [^fc] | v7.1.3 (2026-10-15). Mature, RRULE plugin. Heavier and more "web-app" looking, and needs deep CSS overriding to look bespoke. |
| **react-big-calendar** | MIT | v1.20.0 (2026-06-01) [^rbc]. Functional but dated look, React-only. Not recommended for polish. |
| **shadcn Calendar** | MIT | A date *picker* (react-day-picker), not a scheduler [^shadcn-cl]. Use it for due-date inputs. |

## 4. Icons and fonts

- **Icons:** Lucide (ISC; shadcn's default; consistent 24px stroke icons) or Phosphor (MIT; six weights, so a "fill" weight suits active tab-bar icons like iOS). Pick one set and stick to it.
- **SF Pro / SF Symbols:** Apple's font license limits use to UI mock-ups for Apple platforms. It forbids embedding, website content and non-Apple OSs [^apple-fonts]. So don't bundle SF Pro or SF Symbols. Instead:
- **System stack:** `font-family: system-ui, -apple-system, "Segoe UI Variable", "Segoe UI", sans-serif;`. Safari then uses the installed San Francisco, and Windows 11 uses Segoe UI Variable. Each platform gets *its own* native font without any font files being shipped. (This mapping is common practice, not stated on the Apple page.) **Alternative:** self-host **Inter** (OFL, has `font-feature-settings` for tabular numbers, which helps calendars) or **Geist** for a single identical brand look. Use `font-variant-numeric: tabular-nums` for times and dates either way.

## 5. iOS PWA polish checklist

- **Installation (iOS 26):** every site added to the Home Screen now opens as a web app by default, and no manifest is required. Safari still honours the manifest, and SVG icons are supported [^safari26]. Still ship a manifest (`display: standalone`, `theme_color`) plus `apple-touch-icon`.
- **Safe areas:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`, then pad your bars with `max(12px, env(safe-area-inset-bottom))` and similar [^webkit-safe]. Status bar: `apple-mobile-web-app-status-bar-style` `black-translucent` lets content run under it [^apple-webapp].
- **Overscroll / rubber-banding:**
  - Put `overscroll-behavior: none` on `html, body` and `contain` on inner scrollers. This stops scroll chaining and background bounce under sheets. Safari supports it since 16 (marked partial); Chrome got full support in 144 [^bcd-osb].
  - Make the app shell `position: fixed; inset: 0`, with internal scroll containers, so the whole UI never rubber-bands.
  - Use `100dvh`, not `100vh`.
  - Add `-webkit-tap-highlight-color: transparent`, plus `user-select: none` and `-webkit-touch-callout: none` on chrome elements.
  - Set `touch-action: manipulation` to remove double-tap zoom.
- **Haptics:** `navigator.vibrate` is not available in Safari, and the Vibration API is not Baseline [^mdn-vibrate]. The only web haptic on iOS is the native **`<input type="checkbox" switch>`**, which gives a tap when toggled (Safari 18+) [^safari18]. A known trick is to programmatically click a hidden switch's `<label>` inside a user gesture to fire a haptic. That is undocumented and could break. Real haptics need a native wrapper (Capacitor Haptics plugin).
- **Splash screen:** by default iOS shows a screenshot of the last launch. `<link rel="apple-touch-startup-image" media="...">` sets per-device launch images [^apple-webapp]. Generate them with a tool (e.g. `pwa-asset-generator`), or just keep the first paint instant and matching `theme_color`.
- **Swipe gestures:** Motion `drag` / pan gestures for swipe-to-complete Tasks and swiping between days/weeks. Keep the left 20px edge free so it doesn't fight the system back gesture. Note that standalone PWAs have no browser back-swipe, so give every screen a visible back affordance.
- **Bottom sheets:** Base UI `Drawer` has swipe-to-dismiss, `snapPoints` and a bottom-sheet default [^baseui-drawer]. shadcn's Drawer historically wrapped **Vaul, which is now unmaintained** per its README [^vaul].
- **Push and other APIs:** Declarative Web Push (no Service Worker needed) and Screen Wake Lock work in Home Screen web apps on iOS 18.4+ [^safari184].
- **60/120 fps:**
  - On ProMotion iPhones, Safari defaults to rendering page updates "near 60fps". Users can turn this off with a Safari feature flag; it isn't a site-controllable setting. Native scrolling itself runs at full rate.
  - Home Screen web apps reportedly hit 120 fps on iOS 26 only with the flag off.
  - WKWebView, and therefore **Capacitor / Tauri wrappers, stays capped at 60 fps**: there is no public API (WebKit bug 294338, still open) [^webkit-120].

  So design animations to look great at 60 fps:
  - Animate only `transform`/`opacity`.
  - Avoid large `backdrop-filter` areas while scrolling.
  - Virtualise long lists.
  - Use native `overflow: auto` scrolling, never JS scroll hijacking.
- **Wrappers:** Tauri v2 and Capacitor iOS builds require Xcode on macOS [^tauri-prereq], which you don't have (cloud macOS CI is the only route). Wrappers also get no frame-rate advantage. A plain PWA on iPhone plus a Windows PWA install (or Tauri for Windows only) is the practical path.

## Open items / caveats

- I didn't verify Ionic 9's design changes (release notes only link to the migration guide).
- Some Schedule-X plugins (drag-and-drop, resize) are starred in the docs navigation, but the premium page lists only drag-*to-create*. Check the licence boundary before relying on drag-and-drop.
- The switch-haptic trick and the 120 fps behaviour are community-observed, not Apple-documented.

## Sources

[^tw]: Tailwind CSS releases: https://github.com/tailwindlabs/tailwindcss/releases
[^shadcn-cl]: shadcn/ui changelog: https://ui.shadcn.com/docs/changelog
[^shadcn-base]: shadcn/ui "Base UI as the Default" (Jul 2026): https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default
[^baseui-rel]: Base UI releases: https://base-ui.com/react/overview/releases
[^baseui-qs]: Base UI quick start / component list: https://base-ui.com/react/overview/quick-start
[^baseui-drawer]: Base UI Drawer: https://base-ui.com/react/components/drawer
[^ark]: Ark UI releases: https://github.com/chakra-ui/ark/releases
[^mantine]: Mantine releases: https://github.com/mantinedev/mantine/releases
[^ionic]: Ionic Framework v9.0.0 release: https://github.com/ionic-team/ionic-framework/releases/tag/v9.0.0
[^konsta]: Konsta UI: https://konstaui.com/
[^f7]: Framework7 releases: https://github.com/framework7io/framework7/releases
[^shadcn-svelte]: shadcn-svelte docs: https://www.shadcn-svelte.com/docs ; Bits UI releases: https://github.com/huntabyte/bits-ui/releases
[^motion]: Motion docs: https://motion.dev/docs
[^motion-gh]: Motion repo (MIT): https://github.com/motiondivision/motion
[^bcd-vt]: MDN browser-compat-data, ViewTransition: https://github.com/mdn/browser-compat-data/blob/main/api/ViewTransition.json
[^bcd-vt-at]: MDN browser-compat-data, @view-transition: https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/view-transition.json
[^bcd-osb]: MDN browser-compat-data, overscroll-behavior: https://github.com/mdn/browser-compat-data/blob/main/css/properties/overscroll-behavior.json ; MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior
[^safari18]: WebKit, Safari 18.0 features (switch haptics, View Transitions): https://webkit.org/blog/15865/webkit-features-in-safari-18-0/
[^safari184]: WebKit, Safari 18.4 features (Declarative Web Push, Wake Lock, VT): https://webkit.org/blog/16574/webkit-features-in-safari-18-4/
[^safari26]: WebKit, Safari 26.0 (Home Screen web apps): https://webkit.org/blog/17333/webkit-features-in-safari-26-0/
[^safari26b]: WebKit, Safari 26.0 features (scroll-driven animations, anchor positioning): https://webkit.org/blog/17394/webkit-features-in-safari-26-0/
[^sx-docs]: Schedule-X calendar docs: https://schedule-x.dev/docs/calendar
[^sx-prem]: Schedule-X premium: https://schedule-x.dev/premium
[^sx-gh]: Schedule-X repo (MIT): https://github.com/schedule-x/schedule-x
[^fc]: FullCalendar pricing: https://fullcalendar.io/pricing
[^rbc]: react-big-calendar releases: https://github.com/jquense/react-big-calendar/releases
[^apple-fonts]: Apple Fonts (license): https://developer.apple.com/fonts/
[^webkit-safe]: WebKit, Designing Websites for iPhone X: https://webkit.org/blog/7929/designing-websites-for-iphone-x/
[^apple-webapp]: Apple, Configuring Web Applications: https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
[^mdn-vibrate]: MDN, Navigator.vibrate(): https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
[^vaul]: Vaul README (unmaintained): https://github.com/emilkowalski/vaul
[^webkit-120]: WebKit bug 294338 (120Hz in WKWebView): https://bugs.webkit.org/show_bug.cgi?id=294338
[^tauri-prereq]: Tauri v2 prerequisites: https://v2.tauri.app/start/prerequisites/
