# How do large Offline copies work in a PWA? (November 2026)

Research for [How do large Offline copies work in a PWA?](https://github.com/MatyasMayer/Chronos/issues/28). Targets: **iPhone 14 on iOS 27 as a Home Screen PWA**, and **Windows in Brave and Edge**. It builds on the decisions in "What can be kept offline, and how are file Conflicts resolved?" and on the research branch `research/pwa-capabilities`. Terms follow `GLOSSARY.md`.

## How far to trust each claim

- **Doc:** stated by the vendor or spec. The link gives the source.
- **Source:** read in the code on 2026-11-04 (`main`/`master` of Chromium, WebKit, brave-core, pdf.js). `main` can be ahead of what ships in iOS 27 or Edge 156, so this shows intent and not proof for that release.
- **Tested:** run on this Windows machine on 2026-11-04 in **Edge 156.0.4314.58** and **Brave 1.98.63 (Chromium 156)**. These were headless runs with throwaway profiles on `localhost`/`127.0.0.1` and a 953 GB disk, not installed apps, and each test ran once.
- **iPhone (smoke test):** measured on the real device: `persist()` granted, quota about 41 GB, IndexedDB intact after 8.3 days unopened.
- **Unverified:** no primary source. Listed under checks at the end.

Nothing here was tested on an iPhone. All iPhone statements come from docs, source or the earlier smoke test.

## TL;DR

- **Store Offline copies in OPFS, one file per Resource revision, and keep metadata in IndexedDB.** Do not use Cache Storage for them.
- **Write with `createSyncAccessHandle()` in a dedicated worker, never `createWritable()`.** Resuming through `createWritable({keepExistingData:true})` copies the whole file first: Tested at 2.8 s per 256 MiB with disk use doubled, and WebKit's source does the same.
- **`navigator.storage.estimate().quota` means nothing on Windows.** Edge reports usage + 10 GiB and Brave a flat 2 GiB, whatever the disk size. Both accepted writes past those numbers (Tested). The real limit is about 60% of disk. Detect "full" by catching `QuotaExceededError`.
- **`persist()` in Edge and Brave is not granted just for asking.** It returned `false` in a fresh profile, even with notification permission. Chromium grants it to installed apps and to sites with high engagement (Source). Whether installed Chronos gets it needs a check on a real install.
- **Brave differs from Edge in three ways.** It has no file pickers, no `getAsFileSystemHandle()`, and Background Sync is denied (Tested). OPFS, sync access handles and Background Fetch all work there, so the design must not rely on the pickers or Background Sync.
- **Video seeking on iPhone should work but is the biggest open risk.** Candidates are a Blob URL of the OPFS file, or a service worker answering Range with capped `206` responses. Answer each Range request with at most about 4 MiB: a 2026 field report shows an uncapped response crashing the iPhone media process on an 88 MB file.
- **PDF: yes, ship pdf.js.** The in-app search and page counts already decided need it. **PPTX: no browser renders it offline.** Convert to PDF on the server at upload and keep that PDF with the Offline copy (a decision for the owner, see section 3).
- **Resume downloads with chunked `Range` requests**, writing each chunk at its offset and saving progress after each one.
- **Nothing dependable downloads on Windows with the app closed.** Background Fetch outlives the page but stopped when the browser exited, and was gone after relaunch (Tested). Keep the rule "downloads while the app is open and online".
- **Saving out:** `<a download>` from a Blob URL is the one path that exists everywhere. `navigator.share()` on iPhone reads the whole file into memory (Source), so it only suits small files.
- **Taking back in:** copy the file into OPFS at once, queue it with its base revision, and upload with a resumable protocol when the app is open and online.

## 1. Where to store files of a few GB

| | OPFS | Cache Storage | IndexedDB (Blobs) |
|---|---|---|---|
| Write in place at an offset | Yes, sync access handle | No, whole `Response` per `put` | No, whole values |
| Resume a part-finished file | Yes | No: `put` of a `206` is rejected ([Service Worker spec](https://w3c.github.io/ServiceWorker/)) | Only as many chunk records |
| Read a byte range | `File.slice()` | Must slice the body yourself | `Blob.slice()` |
| Counts toward quota | Yes | Yes | Yes |
| Use in Chronos | **File contents** | App shell only | **Metadata, Pin state, queues** |

- All three share one quota per origin and are evicted together ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria), page updated 2026-01-05). So the choice affects speed and resumability, not limits.
- **Versions** ([MDN browser-compat-data](https://github.com/mdn/browser-compat-data)): `getDirectory()`, `getFile()` and `createSyncAccessHandle()` since Safari 15.2 and Chrome 86/86/102. `createWritable()` since Safari 26.
- **Sync access handles** work in place and synchronously, and report short writes ([MDN OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)). They need a worker: Chromium exposes them to dedicated workers only, WebKit to workers ([Blink IDL](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/file_system_access/file_system_file_handle.idl), [WebKit IDL](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/filesystem/FileSystemFileHandle.idl)). They take an exclusive lock ([File System spec](https://fs.spec.whatwg.org/)), so a second writer on the same file fails rather than corrupting it.
- **Why not `createWritable()`:**
  - Tested in both browsers: a 256 MiB write was invisible in the file until `close()`, and quota usage grew during the write. Opening with `keepExistingData:true` took 2.8 s and usage went from 256 to 512 MiB.
  - WebKit: `createWritable` makes a temporary file and, with `keepExistingData`, copies the full file into it; `closeWritable` copies it back ([source](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/storage/FileSystemStorageHandle.cpp)). For a 4 GB file that means a long pause and 4 GB of extra space on every resume.
- **`getFile()`** gives a disk-backed `File` in WebKit, built from a path ([source](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/filesystem/FileSystemFileHandle.cpp)), so slicing should not load the file into memory.
- **Sync access handle write of 11 GiB took 22 s in Edge, 3 GiB took 5.6 s in Brave** (Tested on an SSD with zero-filled data, so this is an upper bound. The network will be the limit in practice).
- **Layout:** name files by Resource and revision, for example `offline/<resourceId>/<revision>`. This gives the decided behaviour for free: "the old copy stays usable until the new one is fully downloaded". Flip the current revision in IndexedDB when the new file is complete, then delete the old one. No rename is needed, which matters because `move()` is not in Blink's stable `FileSystemHandle` surface (`FileSystemFileHandle.move` exists in Chromium, Tested; not checked in Safari). Replacing a file briefly needs room for both copies, so the status should say so.
- **Cache Storage on iPhone, old evidence:** a [Workbox issue](https://github.com/GoogleChrome/workbox/issues/3004) from 2021 reports network process crashes on `cache.put` of about 100 MB on iOS 14.8. It is old and was never confirmed by WebKit, so it supports the choice but does not decide it.

### Quotas and eviction

| | iPhone Home Screen app | Edge | Brave |
|---|---|---|---|
| Real limit per origin | 60% of disk ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/), 2023) | 60% of disk ([Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline)) | 60% of disk (Source, unpatched as far as found) |
| Limit across all origins | 80% of disk | 80% ([Chromium](https://source.chromium.org/chromium/chromium/src/+/main:storage/browser/quota/quota_features.cc)) | 80% |
| `estimate().quota` | About 41 GB on the test iPhone; [may change](https://webkit.org/blog/14403/updates-to-storage-policy/) with usage and visits | **usage + 10 GiB** | **Flat 2 GiB** |
| Writes past reported quota | Not tested | Yes: 11 GiB written | Yes: 3 GiB written, usage above "quota" |
| Evicts | Whole origin, least recently used | Same | Same |
| `persist()` | Granted (smoke test) | Heuristic, see below | Heuristic, see below |

- **Edge and Brave hide the real quota on purpose.** Chromium reports a static value "to avoid leaking information about the user's browsing mode", computed as usage + 10 GiB ([`quota_manager_impl`](https://source.chromium.org/chromium/chromium/src/+/main:storage/browser/quota/quota_manager_impl.cc), Source). The real per-origin value is `pool × 0.75` with `pool = 80%` of disk, so 60% ([`quota_settings.cc`](https://source.chromium.org/chromium/chromium/src/+/main:storage/browser/quota/quota_settings.cc)). Brave's fixed value follows its documented [deviation](https://github.com/brave/brave-browser/wiki/Deviations-from-Chromium-(features-we-disable-or-remove)) ("Have StorageManager.estimate report a fixed value"). I did not find where 2 GiB is set.
- **What this means for Chronos:**
  - Never compare usage with `quota` on Windows. In Brave that check would stop a healthy device at 2 GiB.
  - No web API gives free disk space there, so "will this fit?" can't be answered before pinning on Windows. Show the size as decided, attempt the download, and treat `QuotaExceededError` as "out of room".
  - The real ceiling may be lower than 60%, because free disk space also applies ([Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline)).
- **Eviction in Chromium** starts when free space falls below `min(2 GB, 10% of disk)` ([`quota_settings.cc`](https://source.chromium.org/chromium/chromium/src/+/main:storage/browser/quota/quota_settings.cc), Source) and removes the least recently used best-effort origin whole. Persistent origins are skipped ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- **WebKit** evicts per origin on the same LRU basis, under overall quota, storage pressure or lack of interaction ([WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/)). The post gives no durations. The 8.3-day result covers IndexedDB only, though eviction is per origin, so OPFS should behave the same (Unverified).
- **A clear-on-exit setting ruins this.** With session-only site data, Chromium refuses `persist()` and caps quota at about 300 MB ([permission context](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/storage/persistent_storage_permission_context.cc), [`quota_settings.cc`](https://source.chromium.org/chromium/chromium/src/+/main:storage/browser/quota/quota_settings.cc)). Users of Brave's "forget me" or clear-on-exit settings would be affected if they apply to Chronos. I did not test that interaction.

### Does `persist()` hold in Brave and Edge?

- **How it is granted.** There is no prompt. Chromium [grants it](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/storage/persistent_storage_permission_context.cc) when the registrable domain has an installed app, or is among the top 10 "important" sites; otherwise it refuses, and you can ask again later ([web.dev](https://web.dev/articles/persistent-storage), undated). Top-level frames only, and session-only storage is refused. Note that `localhost` has no registrable domain, so it can't be used to test this.
- **Tested:** `false` in both browsers in a fresh profile on `127.0.0.1`, before and after granting notifications. So notification permission alone is not enough when engagement is low. A fresh profile says nothing about an installed app, which I could not test without installing one on the owner's machine.
- **Brave:** I found no patch to this logic in brave-core, and its permission state behaved like Edge's. That is absence of evidence, so check it.
- **Once granted it should hold** in Edge: "Persistent storage can only be cleared by the user" ([Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/offline)).
- **Advice:** call `persist()` on every app start until it returns `true`, and show the state on the Pin overview screen. If it stays `false`, warn that Offline copies may be evicted under disk pressure. Since Chronos never evicts on its own, a browser eviction would surface as Offline copies gone missing, so check the files on start and show the Pin as needing to re-download.

## 2. Video offline with seeking

**The contract.** WebKit's media loader first requests bytes `0-1` and expects a `206` with two bytes; a `200` is rejected ([WebKit bug 184447](https://bugs.webkit.org/show_bug.cgi?id=184447), 2018, fixed 2019). Cache Storage can't answer that by itself, so the service worker must slice ([web.dev](https://web.dev/articles/sw-range-requests), 2020).

**Option A: Blob URL of the OPFS `File`.** `video.src = URL.createObjectURL(await handle.getFile())`.
- Simple, with no JavaScript in the data path and nothing depending on service worker lifetime.
- The history is poor but looks resolved. iOS 15 dropped `Range` on `blob:` URLs, fetching the whole Blob ([bug 232076](https://bugs.webkit.org/show_bug.cgi?id=232076)); it was marked mitigated in 2022, and a related iOS 15.4 problem went to bug 238170. Current source adds `Range` for every non-`data:` URL and loads through the normal media loader ([`WebCoreAVFResourceLoader.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/graphics/avfoundation/objc/WebCoreAVFResourceLoader.mm)). A comment there still mentions an open blob-related Apple bug (rdar://132719739).

**Option B: service worker answers Range from OPFS.** The `<video>` points at a normal URL such as `/offline/<resourceId>`, and the worker opens the file, slices and returns `206`.
- Tested in Edge and Brave at the API level: `bytes=0-1` gave `206` with 2 bytes, and a range at 256 MiB gave the right `Content-Range`. `<video>` itself was not tested, as headless runs had no suitable media file.
- WebKit exposes `getDirectory` and `getFile` to workers in its IDL, but use inside a service worker on iOS is Unverified.
- **Cap every response at about 4 MiB.** A [third-party field report](https://github.com/lukleh/besedy/pull/287) (2026-09-30, iOS 26.6.2) saw Safari read a `bytes=0-` response to the end. With an 88 MB recording this pushed the media process past its 300 MB limit and crashed the page. The cap fixed it. This is one project's PR, not a WebKit statement, but it is recent and on the right platform.
- Set `Accept-Ranges`, `Content-Range`, `Content-Length` and the true MIME type. Workbox's guidance adds `crossorigin` on `<video>` even for same-origin URLs ([Chrome docs](https://developer.chrome.com/docs/workbox/serving-cached-audio-and-video)); that page says nothing about Safari.

**Recommendation.** Test A first on the iPhone, as it is less code. Keep B ready, because the same route also serves PDFs (section 3). On Windows both should work, and the Blob URL `Range` fetch returned `206` in both browsers (Tested).

**Ruled out:** `ManagedMediaSource` is on iPhone since Safari 17.1, needing an AirPlay alternative or remote playback disabled ([WebKit](https://webkit.org/blog/14735/webkit-features-in-safari-17-1/)). It needs fragmented media, and transcoding is out of scope, so it can't play arbitrary files.

**Format:** the device must still be able to decode the file, and Chronos won't transcode. Show a clear message when a video won't play.

**Safari 27:** the [release post](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/) lists no blob-video or OPFS media change. I could not read the [27.2 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-27_2-release-notes) (no text came through), so later fixes may exist.

## 3. PDF and PPTX offline in the standalone iPhone app

### PDF: is pdf.js needed?

**Yes, for reasons that come from Chronos and not the platform.** Decided features need text and page data: offline search in "the one open PDF" and page counts on the Conflict comparison screen. The built-in viewer gives neither. It also gives no Chronos controls around the document.

- The smoke test proved only that a link to a PDF opens from the network with a way back. Native viewing from a service worker or Blob URL while offline is Unverified. It remains a cheap fallback.
- WebKit's unified PDF viewer is on by default for iOS in `main` ([PlatformEnableCocoa.h](https://github.com/WebKit/WebKit/blob/main/Source/WTF/wtf/PlatformEnableCocoa.h)), so embedded PDF behaviour may have changed from the old first-page-only behaviour. What iOS 27 ships is Unverified.
- **pdf.js** is at v6.5.438 (2026-11-01). The default build targets the latest browsers, and the `legacy` build lists Safari 18+ as mostly working ([FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)). The FAQ says nothing specific about iOS.
- **Keep large PDFs out of memory.** Don't read the whole file into an `ArrayBuffer`. Point pdf.js at the same Range route as video, or implement `PDFDataRangeTransport` over `File.slice()` ([`api.js`](https://github.com/mozilla/pdf.js/blob/master/src/display/api.js)).
- **Render only visible pages.** The stock viewer holds canvases only for visible pages ([FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)), and limits canvases to 5 megapixels on iOS ([`app_options.js`](https://github.com/mozilla/pdf.js/blob/master/web/app_options.js)). If Chronos uses the library without the viewer, it must apply both itself.
- Offline, pdf.js and its worker must be in the app shell cache.

### PPTX

No browser engine has a PPTX renderer for use inside a page, so there are three routes:

1. **Server converts to PDF at upload (recommended).** LibreOffice can run headless and [`--convert-to pdf`](https://help.libreoffice.org/latest/en-US/text/shared/guide/start_parameters.html) in the Docker stack. The PDF is stored with the Resource and joins the Offline copy, so slides use the same viewer and search on both platforms. Costs: a much larger container, some loss of fidelity (fonts, animations; not measured), and a second stored file. It is a new product decision, as it adds a derived file.
2. **Quick Look through WebKit.** On iOS, WebKit converts a **main-frame** load of any MIME type in the system's Quick Look set to a preview ([`SubresourceLoader.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/loader/SubresourceLoader.cpp), [`PreviewConverter.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/PreviewConverter.cpp)). So navigating the app to a PPTX with the right `Content-Type` may preview it. Apple's type list could not be read, and whether this works from a service worker or `blob:` response is Unverified. It's iPhone-only and leaves the app's own UI.
3. **Hand off** through `<a download>` or the share sheet to Keynote or PowerPoint. This works as an always-available fallback, within the limits in section 6.

JavaScript PPTX renderers exist, but I did not evaluate them: none has a primary-source guarantee of fidelity.

Windows needs no extra path: route 1 serves it, and otherwise the user saves the file out.

## 4. Resuming a download without Background Fetch

iPhone has no Background Fetch ([BCD](https://github.com/mdn/browser-compat-data/blob/main/api/BackgroundFetchManager.json)), so the same engine should run on all platforms.

1. A dedicated worker owns the queue. For each Resource revision it opens `offline/<resourceId>/<revision>` with a sync access handle.
2. It requests fixed chunks, about 8 to 16 MiB: `Range: bytes=a-b` plus `If-Range: "<etag>"`.
3. On `206`, check `Content-Range`, write at offset `a`, `flush()`, then save the new offset in IndexedDB. Save the offset only after the flush, so a crash can only repeat a chunk and never skip one.
4. On `200`, the file changed on the server ([RFC 9110 §13.1.5](https://www.rfc-editor.org/rfc/rfc9110#section-13.1.5): `If-Range` needs a strong validator, so use an `ETag` derived from the revision). Discard and start the new revision.
5. On network failure, keep the offset and retry with backoff on `online`, `visibilitychange` and app start.
6. At the end, check the size (and ideally a hash from the server), then mark the revision current.

Notes:

- **Server:** answer single ranges with `206`, send `Accept-Ranges: bytes` and strong `ETag`s, and do not compress this route. Range applies to the encoded form, and compression also played a part in [bug 184447](https://bugs.webkit.org/show_bug.cgi?id=184447). Send `Cache-Control: no-transform` so that a proxy doesn't compress either.
- **Fetch:** `Range` from `fetch()` worked in both browsers, returning `206` with the right `Content-Range` (Tested). Same-origin needs no CORS setup; if files come from another origin, check the Fetch spec's rule on [range headers](https://fetch.spec.whatwg.org/).
- **Progress:** chunks give a natural progress signal. For finer steps, read `response.body` and count bytes. Report per Pin from IndexedDB as already decided ("AG1: 42/45 downloaded, 1.2 GB"), so the state survives closing the app.
- **Second window on Windows:** the exclusive lock stops a second writer. Handle that error as "another window is downloading".
- **iPhone screen and backgrounding.** Apple documents no rule for how long a Home Screen app keeps network access after leaving the foreground. Design for it stopping at once. `navigator.wakeLock` (iOS 18.4+ [per BCD](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json)) can keep the screen on during a large Pin, and its use while downloading is Unverified.

## 5. Background download on Windows with the app closed

| Mechanism | Edge | Brave | Closed-app behaviour |
|---|---|---|---|
| Background Fetch | Available, 8 MB finished (Tested) | Available, 8 MB finished (Tested) | Continues after the page closes. **Stops when the browser exits, gone after relaunch** (Tested) |
| Background Sync | Allowed (Tested) | **Denied** ([source](https://github.com/brave/brave-core/blob/master/chromium_src/components/content_settings/core/browser/content_settings_registry.cc); `NotAllowedError`, Tested) | Unsuitable for large files either way ([Microsoft Learn](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/how-to/background-syncs)) |
| Periodic Background Sync | Permission `denied` in a fresh profile (Tested) | Same | Needs engagement, not for large files |
| Run on login | [Documented](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/ux) ("Auto-start on device login") | [Chromium 91+](https://developer.chrome.com/blog/run-on-login); not checked in Brave | Opens the app, so downloads run as normal |

- **The test.** A 48 MiB Background Fetch from a throttled server was started, then the page closed: bytes kept arriving. On closing the browser the connection dropped at about 15 MB. After relaunch `getIds()` was empty and no new request came within about 6 seconds. Both browsers behaved the same. Caveats: headless, one run, and the browser was told to close and then killed. Microsoft's docs say the engine "can pause and resume" around network loss, which was not tested.
- **What is unknown.** In a normal session, whether a running Background Fetch keeps the browser alive after its last window closes. Edge's "continue running background apps" setting and startup boost may change that, but I found only community answers about them.
- **Limits even when it works:**
  - The fetch finishes into browser-held storage. A handler must then copy it to OPFS, and the service worker can't be held open indefinitely ([Chrome docs](https://developer.chrome.com/blog/background-fetch)), which is awkward at several GB.
  - Fetches started from a service worker rather than the top-level page start paused ([permission context](https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/background_fetch/background_fetch_permission_context.cc)). So a live Pin can't silently trigger one from a worker.
- **Conclusion.** Keep the same rule on Windows as on iPhone: downloads run while the app is open and online. Background Fetch can come later as an enhancement for "I started this and closed the window". For someone wanting a laptop always ready for the train, **Auto-start on device login** is the simple answer.

## 6. Saving out and taking back in

### Saving an Offline copy to disk

| | iPhone | Edge | Brave |
|---|---|---|---|
| `showSaveFilePicker` | No | Yes | **No** |
| `<a download>` from Blob URL | Yes, small file (smoke test) | Expected to work | Expected to work |
| `navigator.share({files})` | Yes, small PDF (smoke test) | Available | Available |

- **Brave:** pickers are off unless the user flips `brave://flags/#file-system-access-api` ([source](https://github.com/brave/brave-core/blob/master/renderer/brave_content_renderer_client.cc), [Brave wiki](https://github.com/brave/brave-browser/wiki/Deviations-from-Chromium-(features-we-disable-or-remove)), Tested `undefined`). The switch turns off `FileSystemAccessLocal` only, and OPFS sits behind a separate flag ([Blink flags](https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/renderer/platform/runtime_enabled_features.json5)), so OPFS keeps working (Tested). A [per-site permission proposal](https://github.com/brave/brave-browser/issues/59862) is open.
- **So make `<a download href=blobURL>` the base path everywhere**, using the disk-backed `File` from OPFS. `showSaveFilePicker` in Edge is an optional extra (stream with `file.stream().pipeTo(writable)`). It adds a choice of folder, which matters little here, so skipping it is reasonable.
- **On iPhone `navigator.share()` is for small files.** WebKit reads every shared file fully into an `ArrayBuffer` before showing the sheet ([`ShareDataReader.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/ShareDataReader.cpp)). A file of several GB will likely fail or kill the page. The exact limit is Unverified, so test it. `<a download>` for large files on iPhone is also Unverified. WebKit has a download path through service workers ([`ServiceWorkerDownloadTask`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/ServiceWorker/ServiceWorkerDownloadTask.cpp)), a possible fallback.
- Saving out creates a second copy on disk, so tell the user the size.

### Taking an edited file back in

- **Windows:** drag and drop onto the Resource with `dataTransfer.files`, plus a button with `<input type="file">`. These work in Brave. `getAsFileSystemHandle()` does not exist there (Tested `undefined`), so don't use it.
- **iPhone:** no drag is possible in practice, so the "drag it back" step becomes a button that opens `<input type="file">`, and that's a small change to the decided flow. `showOpenFilePicker` isn't available.
- **Pick from Files on iPhone, not Photos.** WebKit can transcode video chosen through its image picker path ([`WKFileUploadPanel.mm`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKFileUploadPanel.mm)), so the file might not be byte-identical. Exactly when this applies on iOS 27 is Unverified.

### The queue of large pending uploads

1. On pick or drop, **copy the file at once into OPFS** as `pending/<uploadId>` through the worker, reading with `file.stream()` or `slice()` in chunks. Don't keep the `File` itself: the queue must survive the app closing, and the user may delete or change the original.
2. Save a row in IndexedDB: `resourceId`, **base revision**, size, name, type, created time, upload URL, confirmed offset. The base revision is what Conflict detection needs.
3. Upload on app start, `online` and `visibilitychange`. **Not Background Sync:** it's missing on iPhone, denied in Brave, and Microsoft says it's for small amounts of data.
4. Use a resumable protocol. Ask the server for the offset, send the remaining chunks, and repeat after any failure.
   - [tus 1.0](https://tus.io/protocols/resumable-upload) is stable: `HEAD` returns `Upload-Offset`, `PATCH` appends, and a mismatch gives `409`. It has extensions for expiry and checksums.
   - [IETF resumable uploads](https://datatracker.ietf.org/doc/draft-ietf-httpbis-resumable-upload/) has the same shape, but is still a draft (-15, 2026-11-02), so tus is the safer choice today.
   - Plain chunked `PUT`s with offsets of Chronos's own design would also do for one server and one client.
5. Report progress by confirmed chunks. `fetch` has no upload progress event, while `XMLHttpRequest.upload` does if finer steps are wanted.
6. **The server decides Conflict** when the upload completes, by comparing the base revision to the current one, as decided.
7. Delete `pending/<uploadId>` only after the server confirms.

**Space:** a pending upload counts against quota and exists beside the Offline copy, so it takes twice the file's space until sent. Show pending uploads on the overview screen, as they aren't Pins and must not be removed by removing a Pin. **The upload queue is the one place that holds the only copy of the user's work**, so eviction matters most here: warn if `persist()` is `false` while the queue isn't empty.

## 7. Effects on existing decisions

- **Corrections to `research/pwa-capabilities`:** its Windows table says Background Sync works, which is not true in Brave. Its storage line (60%/80%) is still right, but `estimate()` won't show it.
- **Size checks before pinning:** on Windows Chronos can show the size, but can't promise it will fit. The decided "stops and says so" behaviour covers this.
- **"Drag it back"** needs an iPhone button.
- **PPTX conversion** is a new decision for the owner, with effects on the Docker image and storage.
- **Replacing a file** needs temporary room for both copies, and pending uploads need room as well.

## 8. Checks on real devices

### On the real iPhone (cannot be settled from docs)

Use a throwaway test page again, with a video of 1 to 2 GB, a large PDF and a PPTX, all in Airplane mode after download.

1. **Video, Blob URL of an OPFS file:** does it play and seek to the end, and does it stay up for several minutes?
2. **Video, service worker `206` from OPFS, capped at 4 MiB:** same questions. This also proves OPFS works inside a service worker on iOS.
3. **Large write:** a chunked download of several GB through a sync access handle. Kill the app midway and confirm the resume.
4. **Backgrounding:** what happens to a running download on app switch and on screen lock, and does a wake lock keep it going?
5. **Survival:** does a multi-GB OPFS file last 8+ days unopened with `persisted()` true? What does `estimate()` report as usage grows, and what happens on hitting the limit?
6. **PDF:** pdf.js on a large PDF of several hundred pages through Range reads (memory, scrolling, search). Also the native viewer from a service worker URL and from a Blob URL, and the way back.
7. **PPTX:** main-frame navigation to a service worker or Blob response with the PPTX MIME type. Does Quick Look show it?
8. **Saving out:** `<a download>` with 1 GB or more, and the largest file `navigator.share()` copes with.
9. **Taking back in:** a 1 GB+ file through `<input type="file">` from Files, then copied to OPFS. Also from Photos: are the bytes changed?

### On Windows

10. **`persist()` from the installed app** in Edge and in Brave, on a real domain.
11. **Background Fetch with a normal window closed**, in Edge and Brave, with and without Edge's background setting.
12. **`<a download>` of a multi-GB OPFS Blob** in both browsers.
13. **`<video>` playback** with seeking on both routes.

## Sources not fully read

- Apple's Safari 27.2 release notes and `QLPreviewController` page returned no readable content.
- Microsoft's page on Edge's background and startup settings wasn't found. Only community answers turned up, and I don't rely on them.
- Brave has no public doc on `persist()` or quota. Claims about it come from brave-core, its wiki and the tests above.
