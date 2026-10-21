# Chronos ships as a PWA only, with no native wrapper

Chronos is one installable PWA on iPhone (Home Screen) and Windows (installed from a Chromium browser such as Brave or Edge). We rejected Capacitor and Tauri: building for iOS needs Xcode and so a Mac, which the owner doesn't have, and the fixes cost $99/yr or a weekly re-sign on top of a CI Mac. An iPhone 14 smoke test showed the PWA risks (persistent storage, offline, swipe-back, file download and share, Web Push with the app closed) are cleared.

## Consequences

- iPhone reminders are server-sent Web Push only: there are no on-device scheduled notifications, so Chronos needs an always-on backend or scheduler.
- Accepted gaps on iPhone: no share-sheet capture, no widgets, no haptics beyond the checkbox-switch tap, no background sync (offline edits sync when the app is next opened).
- Brave's Web Push worked in the Windows smoke test; the "Use Google services for push messaging" setting is where to look if it ever breaks.
- A native wrapper returns only as a new effort, if widgets, the share sheet or on-device reminders become hard requirements.
