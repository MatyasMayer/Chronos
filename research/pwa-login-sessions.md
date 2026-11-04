# How do passkeys and sessions work in an installed PWA? (November 2026)

Research for [How do passkeys and sessions work in an installed PWA?](https://github.com/MatyasMayer/Chronos/issues/32), which feeds the decision [How does the owner log in?](https://github.com/MatyasMayer/Chronos/issues/22). Targets: **iPhone 14 on iOS 27 as a Home Screen PWA**, and **Windows installs in Edge and Brave**. It builds on `research/pwa-capabilities` and `research/large-offline-copies`. Terms follow `GLOSSARY.md`. "Session" here always means a login session, not an Event.

This document surfaces facts and a recommendation. The decision stays with the owner in issue 22.

## How far to trust each claim

- **Doc:** stated by the vendor or spec. The link gives the source.
- **Source:** read in the code on 2026-11-05 (`main`/`master` of WebKit, Chromium, brave-core, Hocuspocus). `main` can be ahead of what ships in iOS 27, so this shows intent and not proof for that release.
- **Tested:** run on this Windows machine on 2026-11-05 in **Edge 156.0.4314.58** and **Brave 1.98.63 (Chromium 156)**. These were headless runs with throwaway profiles, a virtual authenticator (no real Windows Hello), and `--app` windows, not real installs. Each test ran once.
- **Inferred:** my reasoning from the above. No source says it directly.
- **Unverified:** no primary source. Listed in section 8.

**Nothing here was tested on an iPhone.** The iPhone smoke test did not measure cookies or passkeys. Apple's and WebKit's notes for Safari 26.0 to 27.3 beta were all scanned for WebAuthn, cookie, web app and WebSocket entries. Unless a line names iOS 26 or 27, the iPhone fact is from an older version and I found nothing newer that changes or confirms it.

## TL;DR

- **Passkeys are the best fit, but the one fact that matters most is not documented.** No Apple source says plainly that WebAuthn works in an iOS Home Screen app. The nearest is a WWDC23 statement about web apps. It is a five-minute test on the real iPhone, and it should happen before issue 22 is decided.
- **A passkey needs a real, stable domain and trusted HTTPS.** A bare IP fails with `SecurityError` (Tested, and the spec says so). A domain change orphans every passkey. This makes "own a domain" a hard requirement for each instance, and it affects the hosting decision.
- **Passkeys do not span the owner's devices by themselves.** An iCloud passkey never reaches Windows Hello. Register one per device, or use the iPhone by QR code from Windows, or use one cross-platform manager such as Bitwarden.
- **A server-set `HttpOnly` cookie is outside the 7-day rule, with one exception that can hit a self-hosted instance.** WebKit caps server-set cookies to **7 days** when a same-site request looks cloaked: its CNAME goes to another registrable domain, or its IP differs from the page's in the first 16 bits (or the address family differs). This is live in iOS 27: Safari 27.2 and 27.3 beta both fix false positives. Point the domain straight at the host with an `A` record and keep app, API and WebSocket on one origin.
- **The cookie jar of a Home Screen app is separate from Safari's**, apart from one copy when the icon is added (iOS 17.2+). Edge and Brave installs share the browser profile's jar (Tested).
- **Real caps:** Edge 400 days, Brave **180 days** (Tested, Source). Both clamp, neither rejects. A cookie with no `Max-Age` died on browser restart (Tested), and a WebKit bug shows such cookies misbehaving in Home Screen apps. Always set `Max-Age`.
- **Cookies reach everything Chronos needs.** Service worker fetches and same-origin WebSockets carried the `HttpOnly` cookie in both browsers (Tested). WebSockets bypass the service worker by spec. The iPhone needs one check.
- **Session expiry while offline must never touch local data.** Treat it as "sign in when you are back online". Keep the queue of edits and flush it after signing in.
- **Magic links are a poor fit.** Apple itself says a mail link opens in the default browser and will not sign in the web app. Each instance would also need working email.
- **Password plus TOTP works, and it is the fallback if the iPhone test fails.** It needs no domain rules, but it is phishable, and it opens a guessable login on a public host.
- **Libraries:** use `@simplewebauthn/server` and `/browser` directly in a small Nest module. Keep login sessions in a Prisma table.
- **Recommendation:** passkeys only, a fixed 30-day session, a passkey prompt again before showing feed URLs, recovery codes plus a server command as recovery. Details in section 7.

## 1. Passkeys

### Does WebAuthn work in the installed app?

| | iPhone Home Screen app | Edge installed | Brave installed |
|---|---|---|---|
| Registration and sign-in | **Likely, undocumented** | Yes (Tested, virtual authenticator, tab) | Yes (same) |
| In a standalone window | Not tested | `--app` window reports `standalone`; WebAuthn there not run | Same |
| Conditional UI (autofill) | **Unknown, field reports of AutoFill trouble** | API says yes (Tested) | API says yes (Tested) |
| Real authenticator UI | Not tested | Not tested | Not tested |

- **What Apple has said:** in WWDC23, "Web apps work with AutoFill credentials from iCloud Keychain and from third-party apps that have adopted the Credential Provider Extension API", followed by advice to adopt passkeys ([WWDC23 10120](https://developer.apple.com/videos/play/wwdc2023/10120/)). That section is about web apps on Mac, so it does not settle iOS.
- **What is not there:** [passkeys.dev's iOS page](https://passkeys.dev/docs/reference/ios/) covers Safari and in-app browsers and is silent on Home Screen apps. I found no WebKit post, Apple doc, WebKit bug or solid field report either way. The WebView problems often quoted concern `WKWebView` inside native apps, which is not the same thing.
- **iOS 26/27:** no release note from 26.0 to 27.3 beta mentions passkeys in web apps. WebAuthn work did continue: Signal API in [26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), and PRF and PIN protocol 2 for security keys in [26.4](https://webkit.org/blog/17862/webkit-features-for-safari-26-4/). [Safari 27.0](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) keeps the `AbortSignal` reason on `create()` and `get()`, which helps a clean cancel of a pending autofill request.
- **AutoFill warning:** an [Apple Community thread](https://discussions.apple.com/thread/256199786) reports AutoFill failing in web apps on iOS 26.1, across several users with no fix. It is a community report about passwords, not a confirmed bug, but it means **autofill must not be the only way in**. Offer a plain "Sign in with passkey" button.
- **User gesture:** Safari needs a user gesture for the platform authenticator. A gesture survives a `fetch` for 10 seconds, not other async work ([WebKit, 2020](https://webkit.org/blog/11312/meet-face-id-and-touch-id-for-the-web/)). Call WebAuthn straight from the tap, ideally with the challenge fetched before it. Whether this is unchanged in 27 is unverified.
- **Version detection:** feature-detect. The iOS 26+ user agent says `iPhone OS 18_x`, so only `Version/27.0` tells the truth.
- **API versions** ([MDN browser-compat-data](https://github.com/mdn/browser-compat-data)): `isConditionalMediationAvailable` Safari 16, Chrome 108. `getClientCapabilities` Safari 17.4, Chrome 133. `parseCreationOptionsFromJSON` Safari 18.4, Chrome 129. Signal API Safari 26, Chrome 132. All are present on the iOS 27 target. Conditional UI needs `autocomplete="username webauthn"` on the field ([web.dev](https://web.dev/articles/passkey-form-autofill)).
- **Tested on Windows:** `create()` and `get()` with a resident key and required user verification worked in both browsers. Both reported `conditionalGet`, `conditionalCreate`, `hybridTransport`, `relatedOrigins`, `passkeyPlatformAuthenticator` and `extension:prf` as true.

### Where the passkey lives

| Authenticator | Stored in | Syncs to | Needs an account? |
|---|---|---|---|
| iPhone default | Apple Passwords / iCloud Keychain, [end-to-end encrypted](https://support.apple.com/en-us/102195) | Apple devices only | Apple Account with 2FA |
| iPhone third party | A credential provider app such as Bitwarden or 1Password ([iOS 17+](https://passkeys.dev/device-support/)) | Wherever that manager runs | That manager's |
| Windows Hello | [Local, in the TPM](https://learn.microsoft.com/en-us/windows/security/book/identity-protection-passwordless-sign-in) | **Nowhere, device-bound** | None |
| Microsoft Password Manager | [Microsoft account, encrypted](https://blogs.windows.com/msedgedev/2025/11/03/microsoft-edge-introduces-passkey-saving-and-syncing-with-microsoft-password-manager/), Edge 142+ | Windows only, no mobile yet | Microsoft account |
| Windows third party | [Plugin, November 2025 update](https://techcommunity.microsoft.com/blog/windows-itpro-blog/windows-11-expands-passkey-manager-support/4467572), starting with 1Password and Bitwarden | Wherever that manager runs | That manager's |
| Security key (YubiKey) | On the key | Nowhere | None |

- **Brave:** I found no Brave statement that Brave Sync carries passkeys. A vendor write-up says Brave uses the OS authenticator ([Corbado](https://www.corbado.com/blog/passkeys-brave-browser), secondary). Treat "Brave stores passkeys in Windows Hello and Sync does not move them" as **unverified**.
- **A Windows Hello passkey made in Edge should also work in Brave**, since both talk to the same Windows authenticator (Inferred, needs a check).
- **Microsoft's own wording on Edge passkeys is rolling out.** Newer pages say the manager works in other browsers through a Windows plugin, while community reports show failures. Not relevant if the owner picks Windows Hello.
- **A Home Screen app and Safari should share a passkey.** A passkey belongs to the credential manager and the RP ID, not to the app's storage. So the per-app storage rule from `research/pwa-capabilities` should not apply, and deleting the icon should leave the passkey in place (Inferred).

### With no Apple or Google account sync

- **iPhone:** Apple Staff said "[Passkeys on Apple platforms require iCloud Keychain](https://developer.apple.com/forums/thread/707539)" (2022), and Apple's support page says a user without 2FA who registers a passkey is [prompted to turn it on](https://support.apple.com/en-us/102195). If Keychain is later turned off, passkeys [stay on the device](https://support.apple.com/en-us/109016) and stop syncing. There is no supported device-only mode. Without an Apple Account the routes are a third-party manager or a security key. Security keys on iOS are covered by [passkeys.dev](https://passkeys.dev/docs/reference/ios/); their behaviour in a Home Screen app is unverified.
- **Windows:** Windows Hello needs no account, and that is also its weakness: losing the PC or resetting Hello loses the passkey.
- **Between devices:** iPhone passkeys work on Windows through [cross-device sign-in](https://support.microsoft.com/en-us/accounts-billing/security/passkeys-frequently-asked-questions-faq), by scanning a QR code, with a proximity check. [Windows 23H2+ is a client](https://passkeys.dev/device-support/). This needs Bluetooth on the PC and works only while the phone is at hand.
- **Moving passkeys:** iOS 26 can [move passkeys between participating managers](https://developer.apple.com/videos/play/wwdc2025/279/), so a first choice of manager is not final.

## 2. Relying party: what a self-hosted instance needs

| Setup | Result | Basis |
|---|---|---|
| `https://chronos.example.com`, public cert | Works | Spec |
| `http://localhost` (dev) | Works, HTTP allowed | [Spec](https://www.w3.org/TR/webauthn-3/#rp-id), Tested |
| Bare IP (`127.0.0.1`), even as a secure context | **`SecurityError`: "This is an invalid domain."** | Spec: "Only the domain format of host is allowed", Tested in both |
| Private name (`chronos.lan`, single label `chronos`) | Accepted as an RP ID | Tested with certificate checks bypassed |
| Any name with a self-signed or untrusted cert | **Blocked in Chromium** | Source, see below |
| Domain changes | **All passkeys stop working** | Spec |

- **Spec status:** [WebAuthn Level 3](https://www.w3.org/TR/webauthn-3/) is a W3C Recommendation of 25 August 2026. The RP ID must equal the origin's effective domain or be a registrable domain suffix of it. The scheme must be `https`, with `http://localhost` the exception. The port does not matter.
- **Certificates:** Chromium accepts WebAuthn only at security level `SECURE`, or on localhost ([`chrome_content_browser_client.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/chrome/browser/chrome_content_browser_client.cc)). Clicking through a warning is not enough ([issue 40896115](https://issues.chromium.org/issues/40896115)). My click-through run in Edge passed, but it proves nothing: the same code skips the check for virtual authenticators ([`authenticator_common_impl.cc`](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/content/browser/webauth/authenticator_common_impl.cc)). So the LAN rows above show only that the *name* is valid.
- **LAN-only use:** the simple route is a real domain pointing at a private address, with a certificate from a DNS challenge. A private CA means installing and trusting a profile on the iPhone. Safari's behaviour on a private name is unverified.
- **Free hosting impact:** an Oracle VM with only its IP cannot do passkeys. It needs a domain. `research/free-hosting` mentions free one-year domains from the Student Pack: **a domain that lapses after a year is a passkey outage**, so it must be renewed or avoided. A dynamic DNS name works if its provider is permanent. Random Cloudflare quick-tunnel names cannot work. A Tailscale `*.ts.net` name should work (Inferred).
- **RP ID choice:** use the exact host, or the parent domain to allow moving between subdomains. A subdomain move still changes the origin, so the PWA reinstalls and its local data starts empty. Keep `RP_ID` and `ORIGIN` in instance config, as each instance has its own domain.
- **When the domain changes:** [Related Origin Requests](https://passkeys.dev/docs/advanced/related-origins/) let the new origin use old passkeys if the *old* domain keeps serving `/.well-known/webauthn` ([iOS 18+, Chrome 128+](https://passkeys.dev/device-support/)). That needs the old domain alive, so it suits a planned move only. The plain procedure: run both names, sign in at the new one with a recovery method, register new passkeys, retire the old name.
- **First run:** a fresh public instance has no owner. Anyone who finds the URL first could register. Setup must need a one-time token printed in the server log or set in the environment.

### Recovery after losing every passkey

Passkeys sync, so true total loss is rare on iPhone: [iCloud Keychain escrow](https://support.apple.com/en-us/102195) can restore them. It is still a design requirement, and there is no vendor to call. Options:

1. **At least two passkeys** from separate vaults, for example iPhone and Windows Hello or a security key.
2. **Saved recovery codes.** [NIST SP 800-63B-4 §4.2](https://pages.nist.gov/800-63-4/sp800-63b.html): at least 64 random bits, stored hashed, invalid after use, throttled, and every recovery notifies the owner. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html) also lists single-use recovery codes.
3. **A server command.** `docker compose exec` a command that prints a short-lived, one-time enrolment link. Shell access to the host already means full control of the data, so this adds no new trust. It is specific to self-hosting, and it needs no email. No external source covers this; it is my proposal.

Recovery should end with sessions revoked and a passkey registered, and it should be logged and pushed to the owner.

## 3. Session lifetime

### iPhone Home Screen app

**Is the jar shared with Safari? No, except once.**

- "Home Screen web apps have a standalone, app-like experience on iOS, with separate cookies and storage from the browser" ([WWDC23](https://developer.apple.com/videos/play/wwdc2023/10120/)). [WebKit](https://webkit.org/tracking-prevention/) says the same.
- Since **iOS 17.2**, Add to Home Screen [copies cookies, including login state](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/), and no other storage. After that the two are separate. Not reconfirmed for iOS 26/27, and iOS 26's "any site becomes a web app" is a [new path](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/) worth checking.
- **Consequences:** signing in within Safari before adding the icon should carry over, so Safari and the app then hold the *same* session cookie (Inferred). Signing out of one leaves the other's cookie in place unless the server revokes the session. Keep the whole auth state in the cookie, as Apple advises, not partly in `localStorage`.

**Does iOS clear it?**

| Mechanism | Hits a server-set `HttpOnly` cookie? | Basis |
|---|---|---|
| 7-day cap on script-writable storage | No. It covers cookies made in JavaScript, and Home Screen apps are exempt | [WebKit](https://webkit.org/tracking-prevention/); [ITP 2.1](https://webkit.org/blog/8613/intelligent-tracking-prevention-2-1/): "authentication cookies should not be affected" |
| **7-day cap on cloaked requests** | **Yes, if the request looks cloaked. See below** | [WebKit](https://webkit.org/tracking-prevention/), Source, release notes |
| 30-day rule on classified domains | Not for this case: it targets classified trackers, and Safari's classifications [do not affect](https://webkit.org/tracking-prevention/) Home Screen data | Doc |
| Storage eviction | "[cookies and HTTP cache are currently not subject to the policy](https://webkit.org/blog/14403/updates-to-storage-policy/)" (2023) | Doc |
| Removing the icon | Expected to delete the data | **Unverified** |
| Settings > Clear History and Website Data | Unknown for web apps | **Unverified** |

No Apple document promises that a cookie lasts its full `Max-Age` in a Home Screen app. Nothing found says it does not, either. The only real measure is a device test. Whether WebKit applies a 400-day style clamp I did not find, and a 30-day cookie would not care.

**The cloaking cap, in detail.** WebKit caps cookies "set in the HTTP response to 7 days" for third-party CNAME and IP cloaking ([WebKit](https://webkit.org/tracking-prevention/)). It was built against trackers, but its logic looks only at DNS and addresses ([`NetworkTaskCocoa.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/cocoa/NetworkTaskCocoa.mm)):

- It applies to **same-site subresources**, so to a `fetch()` login. Top-level navigations are exempt.
- **CNAME branch:** capped if the request's last CNAME is on another registrable domain and differs from the CNAME recorded for the page's host.
- **IP branch:** used when there is no CNAME, and only if an address is on record for the page. Capped if the address shares fewer than 16 leading bits with that record (64 for IPv6). A mix of IPv4 and IPv6 [counts as 0 matching bits](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/network/DNS.cpp), so it is capped.
- The page's CNAME and IP are recorded **only from network top-level navigations** ([`NetworkDataTaskCocoa.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/cocoa/NetworkDataTaskCocoa.mm)).

What this means for Chronos (Inferred from Source):

- **Direct `A` record to one VM, one origin:** same address every time, no CNAME. Not capped. This is the lead hosting setup.
- **CNAME to another domain, with a service worker serving the app shell:** a shell served from cache is not a network navigation, so no CNAME may be on record, and a `fetch()` login gets capped to 7 days. Note that WebKit has a list of [exempted CNAME targets](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/cocoa/NetworkTaskCocoa.mm) per site for such false positives, which an unknown self-hosted domain would not be on.
- **Both `A` and `AAAA`:** if the page came over IPv4 and the login over IPv6, capped.
- **Cloudflare proxy or tunnel:** several anycast addresses, possibly in different /16 blocks, plus both families. It looks exposed to the IP branch.
- **Split hosts** (`app.` and `api.` on different machines): exposed.

**It is live in iOS 27.** Safari 27.2 [fixed](https://developer.apple.com/documentation/safari-release-notes/safari-27_2-release-notes) "cookies set by a top-level navigation's own response being capped to a seven day lifetime when the site's hostname is CNAMEd to a different registrable domain", and 27.3 beta [fixed](https://developer.apple.com/documentation/safari-release-notes/safari-27_3-release-notes) the IP defence "capping the lifetime of cookies set by google.com subdomains". So until 27.2, even a form login on a CNAMEd host was hit. What I could not establish is whether a Home Screen app's network session has tracking prevention on. The code gates on `trackingPreventionEnabled`, and the web app's setup is closed source. The [public page](https://webkit.org/tracking-prevention/) exempts these apps only from the script-writable cap, so assume the cloaking cap applies until a device test says otherwise.

**A known bug to design around:** [WebKit bug 272325](https://bugs.webkit.org/show_bug.cgi?id=272325), "Session cookies being reset randomly in a Home Screen web app", is open at P2. Cookies with no `Max-Age` reverted to old values after a relaunch, so the `Cookie` header went stale. A WebKit engineer reproduced it on iOS 17.5, and a commenter saw it on 18.1. Not confirmed on 26/27. So: use a persistent cookie, and avoid rewriting its value on every response.

### Edge and Brave installs

| Tested | Edge 156 | Brave 1.98 |
|---|---|---|
| `Max-Age` of 2 years becomes | **400 days** | **180 days** |
| `Max-Age` of 30 days | 30 days | 30 days |
| No `Max-Age` | Lost on restart | Lost on restart |
| Same jar for tab and `--app` window | Yes | Yes |
| `__Host-`, `HttpOnly`, `Secure` on `http://localhost` | Accepted | Accepted |

- The 400 days is [Chrome's limit](https://developer.chrome.com/blog/cookie-max-age-expires). Brave's is `base::Days(30 * 6)` for all cookies ([source](https://github.com/brave/brave-core/blob/master/chromium_src/net/cookies/canonical_cookie.cc)). Older pages saying 7 days are out of date: Brave [removed](https://github.com/brave/brave-browser/issues/48063) its JavaScript cookie cap in August 2025.
- **One jar:** a cookie set in a tab was sent from an `--app` window on a later launch of the same profile (Tested). So signing in within Edge also signs in the installed app. Edge and Brave are different profiles and share nothing. The `--app` window reported `display-mode: standalone`, but it is not a real install.
- **Brave Shields:** default Shields left first-party cookies alone in every test, all on `localhost`. Shields [blocks third-party cookies and storage](https://brave.com/shields/), which a same-origin Chronos does not use. Shields' behaviour inside an installed window specifically is undocumented.
- **What would break it, all opt-in:** Brave's [Forget me when I close this site](https://brave.com/privacy-updates/25-forgetful-browsing/), which clears first-party cookies, and Edge's [clear on close](https://learn.microsoft.com/en-us/troubleshoot/microsoft-edge/security/cookies-sessions-not-persisting). Whether either treats an app window as a "tab" or as the browser closing is unverified.

## 4. Offline and service workers

### Do cookies reach them?

| Tested, Edge and Brave | Cookie sent? |
|---|---|
| Page `fetch()`, same origin | Yes |
| Passed through the service worker with `fetch(event.request)` | Yes |
| Service worker's own `fetch('/x')` | Yes (default credentials are same-origin) |
| Service worker `fetch` with `credentials: 'omit'` | No |
| Same-origin `WebSocket` | Yes, with `Origin` |
| Cross-site `WebSocket` with `SameSite=Strict` and `Lax` cookies | **No**, but the handshake still reached the server |

- **WebSockets never pass through a service worker.** The handshake request has service-workers mode "none" and credentials mode "include" ([WebSockets spec](https://websockets.spec.whatwg.org/)).
- **`HttpOnly` means no JavaScript can read the cookie**, in a page or a worker: `document.cookie` was empty (Tested). The browser attaches it. So JavaScript learns the expiry only if the server tells it.
- **iPhone:** I found no primary source confirming either path in a Home Screen app. A 2018 [forum post](https://developer.apple.com/forums/thread/104488) claims Safari dropped `HttpOnly` cookies that were set *in the WebSocket's 101 response*, with no reply from Apple. Chronos would set the cookie over HTTP, so it should not apply. Needs a device check.
- **Safari 26+ WebSocket over HTTP/2:** Safari 26.0 [added it](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes), and [community reports](https://discussions.apple.com/thread/256142477) describe upgrades failing behind Caddy, Cloudflare and others on iOS 26. Not confirmed by Apple. If Notes will not connect on the iPhone, check this first. Forcing HTTP/1.1 for the WebSocket path was the reported workaround.

### Hocuspocus

- The server gets headers at connect: `onConnect` and `onAuthenticate` receive `requestHeaders`, and `onAuthenticate` runs [even with an empty token](https://tiptap.dev/docs/hocuspocus/server/hooks). So the cookie alone can authenticate, with no token in JavaScript.
- **Check `Origin`** against an allowlist on every handshake, because cookies make Cross-Site WebSocket Hijacking possible ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html)). `SameSite` helps, as tested, but the cross-site handshake still arrived, so the server must reject it.
- **Long-lived sockets outlast sessions.** A check at connect is not enough. OWASP says to close on expiry and to revalidate, commonly every 30 minutes. In Hocuspocus, [throw from `beforeHandleMessage`](https://tiptap.dev/docs/hocuspocus/server/hooks) with an expiry held in `context`. On sign-out or revocation, close that session's sockets from the server.
- **Same server:** v4 is built on crossws, and [`handleConnection`](https://tiptap.dev/docs/hocuspocus/server/examples) takes a web-standard `Request`. The docs show Express and raw `node:http`. **No verified NestJS example exists**, so treat it as a small spike. Confirm that the `Cookie` header survives the conversion to `Request`.

### How expiry while offline should behave

No standard covers this. This is my proposal, following from the facts above and the decision that the server is the source of truth with offline edits syncing on open.

- **The app shell and local data need no session.** The shell is public, so the service worker can serve it with no cookie. Reading IndexedDB and OPFS works whatever the cookie's state.
- **Offline and logged-out are different states.** Failed network means offline. Only a `401` from the server means the session ended. Never read a lost connection as a sign-out.
- **The server sends `expiresAt`** with the session check, saved in IndexedDB, so the app can warn in advance.
- **Expired while offline:** nothing happens. The app works and edits queue. On reconnect the first `401` pauses sync, shows a sign-in sheet over the current screen and keeps the queue. After signing in, the queue flushes.
- **Never delete queued edits or Offline copies on a `401`.** Only an explicit sign-out with a "remove local data" choice does that. Notes are safe by nature: Yjs state stays in `y-indexeddb` and merges after reconnect.
- **The service worker must not cache `/api` or auth responses,** and must leave `401`s untouched. Send `Cache-Control: no-store` as [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) advises.
- **A passkey cannot unlock anything offline,** since sign-in needs a server challenge. Local data is protected only by the device lock, and a cookie's expiry does not protect it. Encrypting it with the WebAuthn PRF extension is possible but out of scope for v1.
- **Web Push does not depend on the cookie,** so reminders continue after a session expires. Revoking a device should also delete its push subscription.
- **Sign-out:** revoke on the server, then `Clear-Site-Data` as [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) lists. Careful: `"storage"` wipes IndexedDB, OPFS and the service worker, so with unsynced edits send only `"cookies"`, or warn first.

## 5. Alternatives

| | Passkeys | Password + TOTP | Magic link | Emailed code |
|---|---|---|---|---|
| Lands in the Home Screen app | Expected, needs test | Yes | **No** | Yes |
| Phishing-resistant | **Yes** | No | No | No |
| Needs a stable domain | **Yes** | Only for the cookie | Yes | Only for the cookie |
| Needs email on each instance | No | No | **Yes** | **Yes** |
| Guessable endpoint on the internet | No | **Yes** | No | Somewhat |
| Server breach reveals | Public keys only | Hashes and TOTP secrets | Tokens in flight | Tokens in flight |
| Works on iPhone with no account | Third-party manager or key | Yes | Yes | Yes |

### Password plus TOTP

- **Rules:** [NIST §3.1.1](https://pages.nist.gov/800-63-4/sp800-63b.html): at least 15 characters if single-factor, 8 as part of MFA, at least 64 allowed, a blocklist, no composition rules, no forced rotation, and paste and managers allowed. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html): Argon2id with at least 19 MiB, 2 iterations, parallelism 1.
- **Weak spots:** TOTP is [not phishing-resistant](https://pages.nist.gov/800-63-4/sp800-63b.html), and the server must keep the TOTP secret in recoverable form, next to other secrets. Limit attempts per account, [not per IP](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Note that a lockout on a single-user system can lock out the owner, so prefer delays.
- **iPhone:** [Apple Passwords stores TOTP codes](https://support.apple.com/en-us/120758) and fills them above the keyboard, with copy and paste as the fallback. The iOS 26.1 AutoFill reports above may apply here too, so never block paste.
- **Where it wins:** no RP ID rules, so it survives a domain change and works through every proxy. If passkeys fail in the Home Screen app, this is the fallback. Keeping it *alongside* passkeys, though, makes the password the weakest door for the whole instance.

### Magic links

- Apple answers this directly: "Since links from email will open in the default browser, this will not automatically sign users in to the web app that they already have. You may want to provide an alternative one-time code in the email" ([WWDC23](https://developer.apple.com/videos/play/wwdc2023/10120/)). The session would land in Safari's jar, not the app's.
- **No way round it on iOS:** `launch_handler`, `scope_extensions` and `protocol_handlers` are all unsupported in Safari ([BCD](https://github.com/mdn/browser-compat-data)). Links inside the app stay in scope, but a link from Mail goes to the default browser by Apple's statement above, so it could also be Brave.
- **Email is a per-instance burden.** Oracle [blocks outbound port 25](https://docs.oracle.com/en-us/iaas/releasenotes/changes/f7e95770-9844-43db-916c-6ccbaf2cfe24/index.htm) on newer tenancies, though [its Email Delivery](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm) gives 3000 mails a month free on other ports. Each self-hoster must set up a sender, and the mailbox becomes the key to the instance.
- **NIST:** [email SHALL NOT be used for out-of-band authentication](https://pages.nist.gov/800-63-4/sp800-63b.html), though recovery codes by email are allowed (valid 24 hours).
- **An emailed one-time code** typed into the app fixes the wrong-browser problem but keeps the rest. It suits recovery at best, and the server command already covers that without email.

## 6. Libraries and guidance

### Libraries (npm, 2026-11-05)

| Package | Version | Fit |
|---|---|---|
| [`@simplewebauthn/server`](https://simplewebauthn.dev/docs/packages/server) | 14.0.3 (2026-09-25) | **Use it.** MIT, active, ESM and CJS builds. Docs say Node 22+, `package.json` says 20+ |
| [`@simplewebauthn/browser`](https://simplewebauthn.dev/docs/packages/browser) | 14.0.0 | Pairs with it, covers conditional UI |
| `better-auth` + `@better-auth/passkey` | 1.7.17 | Whole auth framework, built for many users. Its passkey plugin pins SimpleWebAuthn 13.3, a major behind. More than one user needs |
| `fido2-lib` | 4.0.1 | Maintained, lower level. No gain here |
| `@nestjs/throttler` | 6.7.1 | Rate limits for login and recovery routes |
| `connect-pg-simple` | 10.0.0 (2024) | Stale. A small Prisma table is simpler than `express-session` here |
| `otplib` / `otpauth` | 13.6.0 / 9.6.0 | Only if TOTP is chosen |
| `argon2` / `@node-rs/argon2` | 0.45.2 / 2.2.2 | Only if a password is chosen |
| `@hocuspocus/server` | 4.8.0 | Needs Node 22+, ESM. Nest is 12.3.3, also ESM |

- There is **no official Nest passkey module and none is needed.** SimpleWebAuthn is four plain functions, called from a service behind a controller.
- **Settings** ([docs](https://simplewebauthn.dev/docs/advanced/passkeys)): `residentKey: 'required'`. Set `userVerification: 'required'` and `requireUserVerification: true`, since the passkey is the only factor. Docs default to `'preferred'`, so this is a deliberate change. `attestation: 'none'` is enough for one owner. BCD lists `residentKey` as unsupported in Safari. Apple's passkeys are discoverable anyway, but confirm it in the device test.
- **Store** per passkey: credential ID, public key, counter, transports, device type, backed-up flag, a label and last-used date. Counters can stay `0` on [some authenticators](https://simplewebauthn.dev/docs/packages/server), so never treat that as a clone.
- **Keep the challenge on the server,** single use with a short life.

### OWASP and NIST for a single-user app

- **Cookie:** both agree on `Secure`, `HttpOnly`, `SameSite`, `__Host-` prefix, `Path=/`, no `Domain`, opaque value ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [NIST §5.1](https://pages.nist.gov/800-63-4/sp800-63b.html)). OWASP prefers `Strict`. Enforce expiry on the server, not through the cookie. Tokens stay out of `localStorage`.
- **Token:** at least 64 bits by NIST and 128 by OWASP for self-made IDs. Use 256 bits and store only its hash. New token at login.
- **NIST timeouts** ([final Rev. 4](https://pages.nist.gov/800-63-4/sp800-63b.html), July 2025): AAL1 SHOULD be at most 30 days overall, with no inactivity limit needed. AAL2 SHOULD be at most 24 hours overall and 1 hour inactive.
- **OWASP timeouts:** idle of 15 to 30 minutes for low-risk apps, and an example absolute limit of 4 to 8 hours.
- **Where the guidance does not fit, stated plainly:** NIST also says bearer session secrets "SHOULD NOT be persistent", meaning they should not survive an app restart. An app that asks for Face ID at every launch is what strict compliance looks like. These are enterprise and federal defaults, not requirements for a personal app, but any long-lived cookie is a **conscious departure**, and the owner should accept it as such. What offsets it: the device lock, a server-side revocation list, and a fresh passkey check for the real secrets.
- **Passkeys and NIST:** synced passkeys can reach AAL2, not AAL3, and verifiers must check the UV flag ([Appendix B](https://pages.nist.gov/800-63-4/sp800-63b.html)). The sync-fabric controls in that appendix are federal-only.
- **Sensitive actions:** OWASP says to [require a fresh authenticator](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) for them, and for changing factors not to [rely on the session alone](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html), and to notify the user.

## 7. Recommendation

For the owner to accept or change in issue 22. **Step 1 gates the rest.**

1. **Run the iPhone checks first** (section 8, checks 1 to 4). If WebAuthn fails in the Home Screen app, the fallback is password plus TOTP, with the rest unchanged.
2. **Sign-in: passkeys only, with no password.** Each passkey is proof of device plus Face ID or Windows Hello. Offer a plain button, and add conditional UI only as an extra.
3. **Enrol at least two passkeys:** iPhone (iCloud Keychain, or a third-party manager if the owner wants one vault for both devices), and Windows Hello or a security key. iPhone by QR covers a new PC.
4. **Recovery: printed recovery codes plus a server command.** No email anywhere. First run needs a setup token.
5. **Session: one fixed 30-day session per device.** That is a Face ID tap a month, and it meets NIST AAL1.
   - No sliding renewal. The cookie is set once at sign-in with `Max-Age` of 30 days, which sidesteps bug 272325's stale values, Brave's cap and renewal through `fetch()`.
   - `__Host-` name, `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/`. Value is 256 random bits, hash in Postgres. Sessions listed in settings and revocable.
   - The trade-off: a sign-in can land at a bad moment. If the owner prefers fewer prompts, a longer fixed session is a small change and a conscious step past the NIST number. It should stay under Brave's 180 days.
6. **Protect secrets with a fresh passkey prompt.** Showing or changing Sirius and Moodle feed URLs, managing passkeys, and revoking sessions all need user verification within the last few minutes, whatever the session's age. This does most of the real protection.
7. **Deployment rules, from the cloaking cap:** one origin for app, API and WebSocket. A direct `A` record, no CNAME to another domain. Hold off on `AAAA` until check 6 passes. Finish sign-in as a top-level form `POST` with a redirect, not a `fetch()`, which is exempt from the cap by the code above and costs nothing. Make sure the service worker does not intercept that route.
8. **An owned domain is a requirement** for any instance, stated in the setup docs. Keep `RP_ID` and `ORIGIN` as config. This should go into the hosting decision.
9. **Build:** a small Nest auth module on SimpleWebAuthn, a Prisma table for sessions, `@nestjs/throttler`, cookie plus `Origin` checks on the Hocuspocus handshake, expiry checks in `beforeHandleMessage`.

**Options the owner may want to weigh:**

| Choice | Gain | Cost |
|---|---|---|
| Add password + TOTP as a second way in | Survives a domain loss or a passkey failure | A phishable, guessable door on the internet |
| Sliding session instead of fixed | Fewer prompts | Cookie rewritten often, exposed to the cloaking cap when renewed by `fetch()` |
| Third-party manager for all passkeys | One passkey on both devices | Depends on that manager, and its Home Screen behaviour is untested |
| Cloudflare Tunnel instead of a direct `A` record | No open ports | May trigger the 7-day cap. A weekly sign-in at worst, until tested |

## 8. Open checks

### On the real iPhone (Home Screen app, HTTPS, real domain)

The `task/iphone-smoke-test` page could host these. The owner has no Mac, so results must show on the page. Log `Version/` from the UA, not `iPhone OS`.

1. **Registration:** `navigator.credentials.create()` from a button tap, with Face ID, in the Home Screen app.
2. **Sign-in:** `get()` in the app, with a passkey made in the app and one made in Safari. Does one passkey serve both?
3. **Discoverable login:** `get()` with an empty `allowCredentials`.
4. **Conditional UI:** `isConditionalMediationAvailable()`, `getClientCapabilities()`, and whether the passkey shows above the keyboard in the app. Same for a saved password and a TOTP code, given the iOS 26.1 reports.
5. **Cookie lifetime:** server-set test cookies, one `HttpOnly` and one readable twin, with `Max-Age` of 30 days and no `Max-Age`. Check after a force quit, a reboot, then 8 and 31 days unopened. The readable twin's expiry shows through `cookieStore.get()` (Safari 18.4+), so no Mac is needed.
6. **Cloaking cap:** does the readable twin come back with about 7 days of expiry on a `fetch()` response in each of these setups: direct `A`, `A` plus `AAAA`, a CNAME to another domain, app shell from the service worker, and Cloudflare if it is in play? Then the same with a top-level form `POST`.
7. **Copy at install:** sign in within Safari, add the icon (iOS 26+ path, manifest present), and see if the app starts signed in. Then sign out in one and see the other.
8. **Service worker and WebSocket:** does the `HttpOnly` cookie arrive on service worker fetches and on `wss://` in the app, through the real reverse proxy, and does HTTP/2 upgrade work?
9. **Clearing:** does Settings > Clear History and Website Data affect the app? Does removing and re-adding the icon wipe the cookie? Does the passkey survive?
10. **Sign-in flow from a push:** open the app from a notification. Is the `SameSite=Strict` cookie present on the first API call?
11. **No Apple sync (only if it matters):** with iCloud Keychain off, what does registration do, and does a third-party manager appear in the app? Does a security key work?

### On Windows (real installs)

12. **Real authenticator:** register and sign in with Windows Hello in installed Edge and Brave apps. Which option does each offer first? Does Edge default to Microsoft Password Manager?
13. **Sharing:** does a Windows Hello passkey made in Edge work in Brave?
14. **Conditional UI** in the app window with real passkeys, and **QR sign-in** from the iPhone in both.
15. **Cookies in a real install:** same jar as a tab, and survives closing and reboot. Do Brave's "Forget me" and Edge's clear on close treat the app window as a site or browser close?
16. **Brave Shields:** with Shields set to aggressive, do sign-in and Notes still work in the app window?

### Not device checks, but open

- **NestJS with Hocuspocus 4:** a small spike for the shared server, and for the `Cookie` header reaching `onAuthenticate`.
- **LAN-only use:** whether Safari accepts WebAuthn on a private name with a private CA.

## Facts I could not verify

- That WebAuthn works in an iOS Home Screen app at all, on any version, from a primary source.
- Whether tracking prevention, and so the 7-day cloaking cap, runs in a Home Screen app's network session.
- The cloaking logic in the shipped iOS 27, as opposed to WebKit `main`.
- That the iOS 17.2 cookie copy still holds on iOS 26/27.
- That bug 272325 still occurs on iOS 26/27.
- What removing the icon or clearing website data does to the cookie jar.
- Whether Safari's 10-second gesture rule, from 2020, still holds.
- Whether Brave Sync carries passkeys, and exactly how Brave stores them on Windows.
- Whether Microsoft's plugin works in Brave today. Sources conflict.
- How Shields, Forget me and Edge's clear on close act on an installed window.
- Whether WebKit clamps very long cookie lifetimes. It does not matter for a 30-day cookie.
