# What can a PWA do on iPhone and Windows? (late 2026)

Research for [issue #3](https://github.com/MatyasMayer/Chronos/issues/3). Current baseline: **iOS / Safari 26.x–27.0** and **Edge/Chrome (Chromium) on Windows 11**.

Support data comes from [MDN browser-compat-data](https://github.com/mdn/browser-compat-data) (the data behind MDN's compatibility tables), which I read directly. Narrative claims link to the vendor that owns them. Anything marked **(unverified)** could not be traced to a primary source and should be tested on a real device.

## TL;DR

- **A PWA covers Chronos v1 on both platforms.** iOS supports standard Web Push to Home Screen web apps (iOS 16.4+), badging, offline storage via IndexedDB/Cache/OPFS, and `persist()`. Windows Edge/Chrome support all of that plus share targets, file handlers, background sync and Store publishing.
- **The biggest iOS gap is reminders.** iOS has no background sync, no periodic sync, no background fetch and no scheduled local notifications. **Every reminder must be a server-sent Web Push.** So Chronos needs a small always-on backend (or a scheduled function) that holds push subscriptions and fires pushes at due times.
- **Other iOS gaps:** no share target (Chronos can't appear in the iOS share sheet), no file handlers, no `showSaveFilePicker`/`showOpenFilePicker`, no Vibration API, and no app shortcuts.
- **Wrappers can't build for iOS from Windows directly.** Capacitor needs Xcode, and Tauri states outright that "iOS development … is only available on macOS". Workarounds are CI macOS runners (free for public repos on GitHub Actions) plus either the Apple Developer Program at **$99/yr**, or a free Apple Account whose builds **expire every 7 days** (3 apps per device).
- **Recommendation:** go PWA-first, with a server-push reminder service. Treat Capacitor as an escape hatch only if iOS share-sheet, local notifications or widgets become must-haves. Tauri adds little on Windows over an installed Edge PWA.

## 1. iPhone (iOS Safari, Home Screen web app)

### Installation
- Since iOS 26, **every site added to the Home Screen opens as a web app by default**. A manifest or `apple-mobile-web-app-capable` is no longer required, though manifest icons and `display` are still respected. Users can toggle "Open as Web App" off. ([WebKit, Safari 26](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/))
- Installation is still manual (Share → Add to Home Screen). There is no install prompt API. Ship a manifest anyway, with `id`, icons, `display: standalone` and `theme_color`, because push requires the manifest `display` to be standalone/fullscreen ([WebKit, Web Push for iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).

### Web Push and notifications
- **Supported since iOS/iPadOS 16.4, only for Home Screen web apps.** It uses standard Push API + Notifications API + Service Worker. Notifications appear on the Lock Screen, in Notification Center and on Apple Watch, and they respect Focus. ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/))
- Permission must be requested from a **direct user gesture** (e.g. a "Enable reminders" button). **No Apple Developer account is needed.** Allow `*.push.apple.com` if you filter endpoints. ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/))
- In Safari on iOS, `Notification` is undefined unless the page is a Home Screen web app, and notifications can only be shown from a service worker ([MDN BCD: api/Notification](https://github.com/mdn/browser-compat-data/blob/main/api/Notification.json)).
- **Declarative Web Push** (iOS 18.4+, macOS 15.5+) lets a push message carry its own notification JSON (`title`, `body`, `navigate` URL, `app_badge`). It shows without running service-worker JS, which saves battery and survives the service-worker deletion caused by Intelligent Tracking Prevention. A server is still required to send it. ([WebKit](https://webkit.org/blog/16535/meet-declarative-web-push/))
- **Badging API:** supported for Home Screen web apps since 16.4. Showing the badge requires notification permission. ([WebKit badging](https://webkit.org/blog/14112/badging-for-home-screen-web-apps/), [MDN BCD setAppBadge](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json))
- **No scheduled/local notifications.** There is no Notification Triggers API, and nothing in WebKit's posts offers one. Combined with the missing background APIs below, a reminder can only fire if the server pushes it.

### Background execution
| API | iOS Safari | Source |
|---|---|---|
| Background Sync (`SyncManager`) | No | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/SyncManager.json) |
| Periodic Background Sync | No | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/PeriodicSyncManager.json) |
| Background Fetch | No | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/BackgroundFetchManager.json) |
| Push event in SW | Yes (16.4+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/PushManager.json) |

What this means: sync queued offline edits **when the app is next opened or foregrounded** (on `online`/`visibilitychange`), not in the background.

### Offline storage, quotas and eviction
- WebKit's policy (Safari 17+): a **browser app** (Safari) gets up to **60% of disk per origin** and 80% total. **Other apps** (WKWebView embedders) get 15% per origin and 20% total. Exceeding the limit throws `QuotaExceededError`. ([WebKit, storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/))
- Home Screen web apps have the same quotas as the browser ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)). Each installed web app gets its **own storage container, separate from Safari**, so data doesn't carry over between Safari and the installed app ([web.dev](https://web.dev/articles/storage-for-the-web)).
- **Eviction** is per origin, least-recently-used first. It is triggered by the overall quota, by storage pressure, or by long non-use. The default mode is "best-effort". `navigator.storage.persist()` can request persistent mode, and WebKit grants it heuristically, citing "opened as a Home Screen Web App" as an example signal. ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/), BCD: `persist` since Safari 15.2, `estimate` since 17)
- The **7-day cap on script-writable storage** (ITP) **does not apply to installed Home Screen web apps** ([web.dev](https://web.dev/articles/storage-for-the-web)).
- **OPFS** (`navigator.storage.getDirectory`) is available since Safari 15.2. `FileSystemWritableFileStream` arrived in Safari 26. ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json), [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/FileSystemWritableFileStream.json))
- Implications for Chronos: IndexedDB (or SQLite-WASM on OPFS) as the local store, call `persist()` after install, and **treat the server as the source of truth**. Local data is a cache that could be evicted.

### Files and downloads
- `showOpenFilePicker` / `showSaveFilePicker` / `showDirectoryPicker`: **not supported** in Safari ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json)). Use `<input type="file">` to pick files (camera and Photos included) and Blob + `<a download>` or `navigator.share({files})` to export.
- Manifest `file_handlers`: not supported ([BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/file_handlers.json)).
- **Web Share (sending)** works (`navigator.share`, Safari 12.1+), files included ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)).
- **Web Share Target (receiving)** is not supported, so Chronos **can't appear in the iOS share sheet** to save a link or file as a Resource ([BCD share_target](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/share_target.json), WebKit bug [194593](https://webkit.org/b/194593)).
- Downloads inside a standalone web app open a preview or the Files app rather than a desktop-style downloads bar **(unverified, test on device)**.

### Gestures and native feel
- Available: View Transitions (Safari 18+) and the Navigation API (26.2+), which allow native-style page transitions ([BCD ViewTransition](https://github.com/mdn/browser-compat-data/blob/main/api/ViewTransition.json), [BCD NavigateEvent](https://github.com/mdn/browser-compat-data/blob/main/api/NavigateEvent.json)). Also scroll anchoring and service-worker static routing in Safari 27 ([WebKit, Safari 27](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)), SVG icons (26), and `light-dark()` / `prefers-color-scheme` for dark mode.
- Not available: **Vibration API**, so no haptics from the web ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json)); manifest `shortcuts` (long-press icon menu) on iOS ([BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/shortcuts.json)); widgets; Live Activities; Siri/Shortcuts integration.
- Standard practice: use `viewport-fit=cover` + `env(safe-area-inset-*)`, `overscroll-behavior`, and `touch-action`, and build your own sheets and swipe gestures (e.g. swipe-to-complete a task). In standalone mode there is no browser chrome, so the app must provide its own back navigation. Whether the iOS edge-swipe-back gesture works in standalone mode is **(unverified)**.

## 2. Windows (Edge / Chrome installed PWA)

Chromium on Windows is the strong platform. Everything iOS supports works here, plus the following:

| Capability | Edge/Chrome on Windows | Source |
|---|---|---|
| Web Push + notifications (Windows Action Center) | Yes | [BCD PushManager](https://github.com/mdn/browser-compat-data/blob/main/api/PushManager.json) |
| Badging on taskbar icon | Yes (81+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json) |
| Background Sync / Periodic Sync / Background Fetch | Yes | BCD (links above) |
| Share target (appears in Windows Share dialog) | Yes, installed PWAs only | [Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/share) |
| Web Share (sending) | Yes (Edge 93+, Chrome 128+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json) |
| File handlers (open `.ics`, `.md` with Chronos) | Yes (102+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/file_handlers.json) |
| Protocol handlers (`web+chronos:`) | Yes (96+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/protocol_handlers.json) |
| Shortcuts (jump list) | Yes (96+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/shortcuts.json) |
| File System Access pickers | Yes (86+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/api/Window.json) |
| `display_override` (e.g. window-controls-overlay) | Yes (89+) | [BCD](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/display_override.json) |
| Run on OS login | Yes | [Microsoft Learn overview](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/) |

- **Storage:** Chromium allows up to 60% of disk per origin and 80% total, with LRU whole-origin eviction under pressure. `persist()` exempts an origin from eviction. ([web.dev](https://web.dev/articles/storage-for-the-web))
- **Microsoft Store:** you can package the PWA with PWABuilder (MSIX) with no code changes. Only manifest changes need a resubmission, since web code updates itself. ([Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/microsoft-store)) **Registering as an individual developer is free** (since 2025) ([Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/)). For a single user this is optional, because installing from Edge is enough.
- Caveat: these extras are Chromium-only. If the browser on Windows is Firefox, most of the table above falls away.

## 3. What wrappers add

### Capacitor (iOS)
- **Adds:** native local notifications (scheduled on-device, so they work offline with no server), the iOS share extension (receiving shares), widgets, haptics, Keychain, and access to native plugins.
- **Requires Xcode 26+** (Capacitor targets iOS 15+) ([Capacitor iOS docs](https://capacitorjs.com/docs/ios)). Xcode runs only on macOS, so **from Windows you need a remote/CI Mac**. GitHub Actions standard hosted runners (macOS included) are **free for public repositories** ([GitHub billing docs](https://docs.github.com/en/billing/concepts/product-billing/github-actions)). Chronos is open source, so a public repo qualifies. "Larger" runners are always billed.
- **Signing and distribution costs:**
  - **Free Apple Account (Personal Team):** apps, App IDs, devices and profiles **expire after 7 days**, with at most 3 devices and 3 apps per device ([Apple, compare memberships](https://developer.apple.com/support/compare-memberships/)). You would need to re-sign and reinstall weekly, and the official flow assumes Xcode on a Mac. Third-party Windows sideloading tools exist but are outside Apple's docs. Push via APNs and TestFlight require the paid program.
  - **Apple Developer Program: 99 USD/year.** Fee waivers exist only for nonprofits, accredited educational institutions and government entities, not individual students. ([Apple](https://developer.apple.com/programs/whats-included/)) This unlocks TestFlight, App Store, APNs and certificates.
  - **EU alternative distribution** (Czechia is in the EU): Web Distribution needs Apple authorization and eligibility criteria such as financial-stability scoring or 1M installs, and every app still needs notarization. It is unrealistic for a personal project. ([Apple DMA page](https://developer.apple.com/support/dma-and-apps-in-the-eu/))

### Tauri
- **Windows desktop:** a first-class target. It renders with WebView2 (preinstalled on Windows 10 1803+ and 11) and builds with MSVC build tools and Rust ([Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)). Compared with an installed Edge PWA, it adds a tray icon, true background processes, native menus, filesystem access without pickers, and OS-scheduled notifications. The cost is a Rust toolchain, code signing for SmartScreen, and an update channel.
- **Mobile:** Tauri 2 supports iOS and Android, but "iOS development requires Xcode and is only available on macOS" ([Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)), so it hits the same Mac and Apple-fee wall as Capacitor. Android can be built on Windows but isn't a Chronos target.

## 4. Implications for Chronos

1. **Ship a PWA first.** Reminders become a backend job: store the `PushSubscription` per device, and have a cron or queue send a (declarative) Web Push at each Task due time or Event reminder offset. Free hosting must therefore include a scheduler (cron trigger or scheduled function) and VAPID keys.
2. **Offline-first data layer:** IndexedDB/OPFS on the client, sync on open, foreground and `online`, plus Background Sync as a Windows-only progressive enhancement. Request `persist()` and show the result in settings.
3. **Resources (files):** on iOS, use `<input type=file>` to upload and Blob download or Web Share to export. On Windows, progressively enhance with the File System Access API, `file_handlers` and `share_target`.
4. **Native feel is achievable on the web** with View Transitions, the Navigation API, safe-area handling and custom gestures. Don't plan on haptics, widgets or the iOS share sheet.
5. **Revisit Capacitor** only if on-device scheduled reminders (no server), the iOS share extension, or widgets become hard requirements. Budget $99/yr plus a CI macOS runner for that.

## Open questions / to test on a real iPhone
- Whether the edge-swipe-back gesture and `<a download>` behave well in standalone mode on iOS 26/27.
- Push delivery latency and reliability on iOS under Low Power Mode and Focus.
- Whether `persist()` returns `true` for a Home Screen app in practice.
