# Local-first / offline sync approaches for Chronos

Ticket: [#5 Which local-first sync approaches fit?](https://github.com/MatyasMayer/Chronos/issues/5)
Researched: 2026-10-21

## Question

Which local-first / offline sync approaches fit a **single-user** app used on **iPhone (PWA in Safari/WebKit) and Windows**, that edits rich-text Notes, Tasks and Events offline and syncs later? Must be self-hostable / free on a student budget.

## Short answer

- **Notes (rich text): use Yjs.** It is the only option here with mature, first-party bindings for the block editors Chronos is likely to use (BlockNote, Tiptap, Lexical), plus an IndexedDB persistence provider for offline editing and several self-hostable servers. All MIT.
- **Structured data (Subjects, Tasks, Events, Tags…): a plain local store plus an outbox (offline queue) of mutations, sent to your own REST endpoint, with per-field last-write-wins.** With one user, real conflicts only happen when the same field is edited on two devices while both are offline, so last-write-wins on each field is enough. This adds no vendor dependency and costs nothing.
- **If you'd rather not hand-roll the structured side, PowerSync (self-hosted Open Edition) is the best packaged option.** It gives you SQLite in the browser, an upload queue, and you write the backend endpoint. Most of the others are ruled out: Zero has no offline writes, Electric syncs reads only, Replicache is in maintenance mode, Jazz 2 is alpha, RxDB's good browser storages are paid, and Triplit's future is unclear.
- **iOS storage:** the app must be installed to the Home Screen. Call `navigator.storage.persist()`, and treat the server as the durable copy. Push the outbox as soon as the device is online, because unsynced local edits are the only data that eviction can actually destroy.

## Comparison

| Option | What syncs | Conflict model | Rich text | Maturity | Self-host / cost | Fit |
|---|---|---|---|---|---|---|
| **Yjs** | CRDT docs | CRDT, automatic merge | **Best**: y-prosemirror (Tiptap, BlockNote), native Lexical binding | Very mature (23k stars), MIT | y-websocket / Hocuspocus / y-sweet, all self-hostable, free | **Notes: yes** |
| **Automerge 3** | CRDT docs (JSON-like) | CRDT, automatic merge | Rich text exists; the ProseMirror binding is "beta quality" | Core is mature (3.0 in Jul 2025, 10x less memory) | automerge-repo sync server, free | Possible, but behind Yjs for editors |
| **PowerSync** | Postgres/Mongo/MySQL/MSSQL to SQLite on the client | Server-authoritative; client upload queue, your `uploadData()` endpoint decides | None (store Yjs blobs in a column if needed) | Production, commercial backing | Open Edition self-host is free (source-available); Cloud free tier deactivates idle projects | **Structured data: good packaged option** |
| **ElectricSQL** | Postgres to client (**read path only**) | You build the write path yourself | None | Production (read sync) | Self-host, Apache | Partial: still need your own write path |
| **RxDB** | Documents, any backend via pull/push handlers | Git-like: push rejected if master changed, client `conflictHandler` | None | Mature | Core free; **IndexedDB/OPFS/SQLite storages are paid ($99/mo+)**, free tier uses Dexie storage | Works, but the licensing is awkward |
| **Replicache** | KV + mutators | Server-authoritative rebase | None | **Maintenance mode** | Free, open source | No (dead end) |
| **Zero** | Postgres queries | Server-authoritative | None | Active | Self-host zero-cache + Postgres | **No: "does not support offline writes"** |
| **Triplit** | Relational DB | Not verified here | None | Unclear: company reportedly absorbed by Supabase in 2025 (unconfirmed) | AGPL-3.0, self-host server | Risky |
| **Jazz** | CoValues / relational (v2) | CRDT | Classic Jazz had CoRichText; Jazz 2 docs do not mention it | **Jazz 2.0 is alpha**, classic is a separate product | MIT, self-host server | Too unstable for now |
| **REST + offline queue** | Whatever you design | You choose (per-field LWW is enough for one user) | Pair with Yjs for notes | N/A: your code | Free, no lock-in | **Structured data: yes** |

## Findings per option

### Yjs
- A CRDT that exposes shared types (Map, Array, Text, XmlFragment) which merge without conflicts. [docs.yjs.dev](https://docs.yjs.dev/)
- MIT licensed. Lists bindings for **BlockNote and Tiptap via y-prosemirror** and a **native Lexical binding**, with cursor support. Providers include **y-websocket**, **y-indexeddb** (persists updates in browser IndexedDB), **Hocuspocus** (standalone server with SQLite persistence, webhooks, auth) and **y-sweet** (server with S3/filesystem persistence). [github.com/yjs/yjs](https://github.com/yjs/yjs)
- y-indexeddb (MIT) stores the document locally, "minimizes the amount of data exchanged between server and client" and enables offline editing. [github.com/yjs/y-indexeddb](https://github.com/yjs/y-indexeddb)
- BlockNote's collaboration support is built on Yjs (`withCollaboration`, a provider, and a Y.Doc fragment). It lists Hocuspocus and y-websocket as self-hosted options and y-indexeddb "for offline storage". [blocknotejs.org collaboration](https://www.blocknotejs.org/docs/features/collaboration)
- Implication for Chronos: one Y.Doc per Note. Persist it locally with y-indexeddb, and sync with a small self-hosted Hocuspocus or y-websocket server when online. CRDT merging makes offline edits on both devices safe without any custom conflict code.

### Automerge
- Automerge 3.0 (July 2025) keeps the compressed columnar format in memory: "over 10x" less memory, for example about 700 MB down to about 1.3 MB for Moby Dick. automerge-repo 2.1 uses it by default. [automerge.org/blog/automerge-3](https://automerge.org/blog/automerge-3/)
- The `automerge-prosemirror` binding is self-described as "beta quality software", and "The API will probably change a bit before a stable release". [github.com/automerge/automerge-prosemirror](https://github.com/automerge/automerge-prosemirror)
- Implication: a credible CRDT, but its editor ecosystem is thinner than Yjs's, and BlockNote/Tiptap are built for Yjs.

### PowerSync
- The client keeps an **upload queue** of PUT/PATCH/DELETE operations. Your `uploadData()` sends them to **your own backend endpoint**, and that endpoint must apply writes synchronously. Return 5xx only for transient errors. For validation errors or conflicts, return 2xx and report the problem, because a 4xx "will block the PowerSync client's upload queue". [docs.powersync.com – writing client changes](https://docs.powersync.com/usage/installation/app-backend-setup/writing-client-changes)
- The web SDK runs SQLite in the browser. IndexedDB (IDBBatchAtomicVFS) is the default. OPFSCoopSyncVFS is "recommended for applications requiring multi-tab support, especially on Safari/iOS". Shared workers are disabled by default on iOS/Safari, and OPFS has known issues in Safari incognito. [docs.powersync.com – JS web SDK](https://docs.powersync.com/client-sdks/reference/javascript-web)
- Backends: Postgres, MongoDB, MySQL, SQL Server. The self-hosted **Open Edition** is a "free source-available edition". On the Cloud free tier (2 GB synced/mo, 500 MB hosted), free projects are deactivated after 1–2 weeks of inactivity (the pricing page gives both figures). [powersync.com/pricing](https://www.powersync.com/pricing)
- Implication: a good fit for structured data if you want SQL queries on the client. Self-hosting it means running Postgres, the PowerSync service, and your API, which is heavier than a hand-rolled outbox.

### ElectricSQL
- "Electric does not do write-path sync." The docs describe four write patterns: online REST, `useOptimistic`, a shared persistent optimistic store, and through-the-database sync with PGlite. Only the last two survive going offline, and with all of them you build the rollback and merge logic yourself. [electric.ax/docs/guides/writes](https://electric.ax/docs/guides/writes)
- Implication: you would still write the outbox, so Electric only adds value for read fan-out, which a single user doesn't need.

### RxDB
- Replication uses pullHandler, pushHandler and pullStream$ against **any** backend (HTTP, CouchDB, GraphQL, Supabase, etc.). A push is rejected if the master changed since the last pull. By default the client keeps the master state, and you can override this with a `conflictHandler`. [rxdb.info/replication](https://rxdb.info/replication.html)
- The free tier includes core, replication, and the Dexie/Memory/LokiJS storages. The **IndexedDB, OPFS and SQLite storages require Pro ($99/mo billed annually)**. [rxdb.info/premium](https://rxdb.info/premium/)
- Implication: the replication protocol is a good model to copy for a hand-rolled outbox. Using the product itself, though, pushes you onto the Dexie storage or paid plans.

### Replicache / Zero
- "Replicache is now in maintenance mode … Existing users should migrate to Zero." [replicache.dev](https://replicache.dev/)
- "Zero does not support offline writes." While disconnected, "writes are rejected", and "Zero is not designed for long periods offline." [zero.rocicorp.dev/docs/offline](https://zero.rocicorp.dev/docs/offline)
- Implication: both are ruled out, since offline writes are a hard requirement.

### Triplit
- The repo is AGPL-3.0 with a Node sync server package, 3.1k stars, and no archive notice. [github.com/aspen-cloud/triplit](https://github.com/aspen-cloud/triplit)
- A secondary source claims Supabase absorbed the company in 2025 and that hosting ended. I found no first-party confirmation, and triplit.dev returned no content when fetched. Treat its future as uncertain.
- Implication: avoid unless its status is confirmed.

### Jazz
- The current repo is **Jazz 2.0 alpha**, "an entirely new API", MIT licensed. "Classic Jazz" (CoValues, CoRichText) lives at classic.jazz.tools as a separate product. [github.com/garden-co/jazz](https://github.com/garden-co/jazz), [jazz.tools/docs](https://jazz.tools/docs)
- Implication: the API is changing under you. Not suitable for something that has to work offline from day one.

### Plain REST + offline queue
- Design: keep entities in IndexedDB (via Dexie or similar), and append every mutation to an `outbox` table in the same transaction as the write. A service worker or online listener drains the outbox to `POST /mutations`, and the client pulls changes since its last checkpoint. This mirrors RxDB's checkpoint/push model ([rxdb.info/replication](https://rxdb.info/replication.html)) and PowerSync's upload-queue semantics ([PowerSync docs](https://docs.powersync.com/usage/installation/app-backend-setup/writing-client-changes)).
- Conflicts: with a single user, store `updatedAt` (or a hybrid logical clock) per field and apply last-write-wins. Recurring Event exceptions should be stored as their own rows, so that edits to one occurrence never collide with edits to the series.
- Note bodies are kept out of this path: they stay Yjs docs, and the server stores the Yjs update blobs.

## iOS Safari storage constraints (PWA)

- **Quota:** a browser-app origin can use about 60% of disk, and all origins together about 80%. A Home Screen web app gets the same quota. Exceeding it throws `QuotaExceededError`. [WebKit: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), [MDN: storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- **Eviction:** WebKit evicts whole origins in least-recently-used order under storage pressure. Origins in persistent mode or with an active page may be excluded. `navigator.storage.persist()` is granted by heuristics (for example, being opened as a Home Screen web app), with no prompt. [WebKit](https://webkit.org/blog/14403/updates-to-storage-policy/), [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- **7-day rule:** in Safari, script-writable storage (IndexedDB, localStorage, SW caches) is deleted after 7 days of Safari use without user interaction with the site. However, "Web applications added to the home screen are not part of Safari and thus have their own counter of days of use", so an installed PWA that you actually use is not expected to lose data. [WebKit: Full third-party cookie blocking and more](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
- **OPFS / workers:** OPFS is available, but shared workers are off by default on iOS. PowerSync recommends OPFSCoopSyncVFS on Safari. [PowerSync web SDK](https://docs.powersync.com/client-sdks/reference/javascript-web)
- **Rules for Chronos:**
  1. Require installing the app to the Home Screen on iPhone.
  2. Call `persist()` on startup.
  3. Treat the server as the source of truth, so eviction costs only a re-sync.
  4. Drain the outbox and Yjs updates promptly.
  5. Keep large Resources (files) out of IndexedDB except as an opt-in offline cache.

## Recommendation

1. **Notes:** BlockNote or Tiptap on top of **Yjs**, with **y-indexeddb** locally and a self-hosted **Hocuspocus** (or y-websocket) server persisting to the main DB. All free and MIT.
2. **Tasks, Events, Subjects and other structured data:** **IndexedDB plus an outbox of mutations**, synced to the app's own REST endpoint with per-field last-write-wins and checkpoint pulls. If writing this by hand turns out too costly, **PowerSync Open Edition** is the fallback that fits the same shape (Postgres, an upload queue, your endpoint).
3. **Rejected:** Zero (no offline writes), Replicache (maintenance mode), Electric (no write path), Jazz 2 (alpha), Triplit (uncertain status), and RxDB (its useful storages are paid).

## Open points / not verified
- Triplit's corporate status: no first-party source found.
- Whether a granted `persist()` also exempts an origin from Safari's 7-day rule. MDN doesn't say, but the Home Screen exemption covers the PWA case anyway.
- Zero's license and the version of its self-hosted zero-cache were not checked, because Zero was already ruled out.
