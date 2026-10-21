# Which block editor for Notes?

Research for [issue #6](https://github.com/MatyasMayer/Chronos/issues/6). Checked on 2026-10-21 against official docs, licence files, package manifests and issue trackers. Star counts and release versions come from the GitHub API on that date.

## Answer

**Use BlockNote** (`@blocknote/react`, MPL-2.0). It is the only candidate that gives you Notion-style blocks, a slash menu, drag handles, formatting toolbars and Yjs collaboration for free, and it looks polished without extra work. Chronos is a React PWA (assumed), so BlockNote's React-only coupling costs nothing. For links to other items, use BlockNote's documented custom inline content plus a suggestion menu (the "mentions" pattern) and give it `@` or `[[` triggers.

**Two things to check first.** Before committing, build a spike on a real iPhone:

1. Custom React blocks can freeze iOS Safari ([BlockNote#2994](https://github.com/TypeCellOS/BlockNote/issues/2994), open, with an upstream fix proposed in [tiptap PR #8355](https://github.com/ueberdosis/tiptap/pull/8355)).
2. Touch drag on the block handle is unreliable ([BlockNote#1693](https://github.com/TypeCellOS/BlockNote/issues/1693), open).

**Fallback: Tiptap 3 core (MIT).** BlockNote is built on Tiptap and ProseMirror, so moving down a layer stays in the same ecosystem. The editor, drag handle, suggestion (slash/mention), collaboration and unique-ID extensions are all MIT. However, Tiptap's ready-made Notion-like UI template needs a paid plan, so you would build the UI yourself. **Plate** is the best non-ProseMirror alternative (MIT, shadcn look, first-party Yjs), but its premium components are paid and it is heavier to assemble.

## Comparison

| | BlockNote | Tiptap 3 | Plate | Lexical | Milkdown (Crepe) | Editor.js |
|---|---|---|---|---|---|---|
| Base | Tiptap/ProseMirror | ProseMirror | Slate | Own (Meta) | ProseMirror + remark | Own |
| Block UX out of the box | **Full Notion-style** | Headless. Build it yourself, or use the paid template | Good, via copy-in shadcn components | Playground only. Not a packaged UI | Good (Markdown-first) | Block-based, plainer |
| Slash menu | Built in | `suggestion` util (MIT). UI is yours to build | `slash-command` plugin | Build from the typeahead plugin | `plugin-slash`, Crepe `block-edit` | "+" toolbox, not a true `/` menu |
| Drag handles | Built in. Touch drag shaky ([#1693](https://github.com/TypeCellOS/BlockNote/issues/1693)) | `extension-drag-handle` (MIT) | `dnd` plugin | DIY (playground has one) | `plugin-block` | Block tunes / move up-down |
| Links/mentions to items | Custom inline content + `SuggestionMenuController` ([example](https://www.blocknotejs.org/examples/custom-schema/suggestion-menus-mentions)) | `extension-mention` | `mention` plugin | Custom node | Custom node | Custom inline tool |
| iOS Safari | Decent, actively fixed. Open freeze bug [#2994](https://github.com/TypeCellOS/BlockNote/issues/2994) | Mature core. Some open keyboard/scroll issues ([#7540](https://github.com/ueberdosis/tiptap/issues/7540), [#6571](https://github.com/ueberdosis/tiptap/issues/6571)) | Slate's mobile support is historically weakest (not verified here) | Good. Meta ships it on mobile web | ProseMirror-grade | Several long-open iOS bugs ([#2415](https://github.com/codex-team/editor.js/issues/2415), [#2902](https://github.com/codex-team/editor.js/issues/2902), [#2908](https://github.com/codex-team/editor.js/issues/2908)) |
| Yjs / offline | **First-party** ([docs](https://www.blocknotejs.org/docs/features/collaboration)). Any provider, including y-indexeddb | First-party, MIT (`@tiptap/y-tiptap`). Self-host Hocuspocus (MIT) | First-party `@platejs/yjs` (Hocuspocus, WebRTC, y-indexeddb deps) | First-party `@lexical/yjs`. Caveats on bootstrapping ([docs](https://lexical.dev/docs/collaboration/react)) | `plugin-collab` (y-prosemirror) | **None.** Requests open since 2019 ([#819](https://github.com/codex-team/editor.js/issues/819)) |
| Default look | **Most polished.** Mantine, shadcn or Ariakit UI | Unstyled | Polished (shadcn/Tailwind) | Unstyled | Nice themes | Clean but basic |
| Licence | Core MPL-2.0. `xl-*` GPL-3.0 or commercial | MIT core. Platform, Cloud and UI templates paid | MIT. Plate Plus paid | MIT | MIT | Apache-2.0 |
| Framework | React (UI) | Vanilla, React, Vue | React | Vanilla core, React bindings | Vanilla, with React/Vue wrappers | Vanilla |
| Maturity (stars / latest) | 10.3k / v0.56.0, pre-1.0 | 38.8k / v3.32.0 | 16.7k / v53.4.0 | 24.0k / v0.52.0, pre-1.0 | 12.0k / v7.22.3 | 32.0k / v2.31.7 |

## Notes per editor

### BlockNote

- Licence ([LICENSE.txt](https://github.com/TypeCellOS/BlockNote/blob/main/LICENSE.txt)): everything is MPL-2.0 except `packages/xl-*` (AI, multi-column, PDF/DOCX/ODT/email exporters), which are GPL-3.0 or commercial. Pricing ([pricing](https://www.blocknotejs.org/pricing)): the free Community tier includes "all blocks and UI components, drag-and-drop, slash commands, real-time collaboration, comments". XL packages are free for open-source projects under GPL-3.0. The Business tier ($195/month) only matters for closed-source use. Chronos is open source, so it pays nothing. If it uses XL packages (for example multi-column or PDF export), its own licence must be GPL-compatible.
- UI packages: `react`, `mantine`, `shadcn`, `ariakit` (from the [repo packages list](https://github.com/TypeCellOS/BlockNote/tree/main/packages)), so it can match a shadcn-based app shell.
- Collaboration ([docs](https://www.blocknotejs.org/docs/features/collaboration)): Yjs Y.Doc fragment plus any provider (Hocuspocus, y-websocket, y-webrtc, Y-Sweet, PartyKit, Liveblocks). y-indexeddb is listed "for offline storage". This fits single-user, multi-device offline sync: IndexedDB on each device plus a self-hosted Hocuspocus or y-websocket server.
- Mobile: many iOS/Android fixes landed in 2026 (for example [#3045](https://github.com/TypeCellOS/BlockNote/issues/3045) touch-drag scroll, [#2804](https://github.com/TypeCellOS/BlockNote/issues/2804), [#2889](https://github.com/TypeCellOS/BlockNote/issues/2889)). Still open:
  - [#2994](https://github.com/TypeCellOS/BlockNote/issues/2994): inserting any `createReactBlockSpec` block on iOS while focused freezes the tab. The root cause is Tiptap's `NodeView.ignoreMutation` mobile branch.
  - [#1693](https://github.com/TypeCellOS/BlockNote/issues/1693): dragging on mobile. A commenter reports that tap-and-hold first works.
  - The issue concerns custom *block* specs. Inline content (mentions) uses a different spec, but test it on a device anyway.
- Risks: pre-1.0 with frequent minor releases, so pin versions. It also inherits Tiptap's mobile bugs.

### Tiptap 3

- The editor is MIT ([pricing page](https://tiptap.dev/pricing): "open source (MIT) and free"). The following are MIT packages in the main repo: `extension-drag-handle` (+ `-react`/`-vue`), `suggestion`, `extension-mention`, `extension-collaboration`, `extension-collaboration-caret`, `extension-unique-id`, `extension-details`, `extension-table-of-contents`, `extension-file-handler`, `extension-emoji`, `extension-mathematics` (from the [repo packages list](https://github.com/ueberdosis/tiptap/tree/main/packages) and [drag-handle package.json](https://github.com/ueberdosis/tiptap/blob/main/packages/extension-drag-handle/package.json)).
- Paid: Tiptap Cloud/Platform plans from $49–59/month. The [Notion-like editor template](https://tiptap.dev/docs/ui-components/templates/notion-like-editor) "requires at least a Start plan subscription for production use". Hocuspocus, the Yjs server, is MIT ([repo](https://github.com/ueberdosis/hocuspocus)), so you can self-host for free.
- Choose it if BlockNote's opinions get in the way. You keep ProseMirror, Yjs and the same document model, but you own the slash menu UI, block menu and styling.

### Plate

- MIT root licence. Per-package LICENSE files exist for some packages ([LICENSE](https://github.com/udecode/plate/blob/main/LICENSE)). The plugin list includes `dnd`, `slash-command`, `mention`, `yjs`, `toggle`, `callout`, `toc`, `math`, `media` and more ([packages](https://github.com/udecode/plate/tree/main/packages)). `@platejs/yjs` depends on Hocuspocus, y-webrtc and y-indexeddb.
- UI comes as shadcn-style copy-in components and looks very good. [Plate Plus](https://pro.platejs.org/) costs €299 (personal) or €799 (team), one-time, for 100+ premium components and the "Potion" Notion-like template.
- Built on Slate. Slate has historically been less reliable on mobile/IME than ProseMirror (not verified in this pass). It also has more moving parts to assemble.

### Lexical

- MIT, from Meta, actively developed but still pre-1.0 (v0.52.0). Yjs is first-party, but the [docs](https://lexical.dev/docs/collaboration/react) warn that two clients bootstrapping content at once can corrupt it, so bootstrap on the server. V2 binding is experimental.
- There is no packaged Notion UI. The playground shows the components, but you would assemble and style everything yourself. That is the most work for a "looks extremely polished" goal.

### Milkdown (Crepe)

- MIT, built on ProseMirror and remark, so it is Markdown-first. Crepe features include `block-edit` (handle and slash), `toolbar`, `link-tooltip`, `image-block`, `latex`, `table` and `code-mirror` ([crepe/src/feature](https://github.com/Milkdown/milkdown/tree/main/packages/crepe/src/feature)). Yjs comes through `plugin-collab`.
- A good fit if Markdown files are the source of truth. It is a weaker fit for Notion-style rich blocks with item embeds.

### Editor.js

- Apache-2.0, block-JSON output. It has **no Yjs/CRDT support** ([#819](https://github.com/codex-team/editor.js/issues/819) open since 2019) and several long-open iOS bugs. Ruled out because of offline sync and iPhone quality.

### Others (not deeply evaluated)

- Novel (Tiptap-based Notion clone) and Yoopta (Slate-based): smaller projects with the same base trade-offs as Tiptap and Plate respectively.
- AFFiNE BlockSuite: a full app framework, too heavy to embed.

## Implications for Chronos

- **Item links:** model them as a custom inline content type (`itemRef { kind, id }`) inserted from a `[[`/`@` suggestion menu backed by the local DB. Item embeds (Task, Event cards) become custom block specs. Test those on iOS first because of #2994.
- **Sync:** store each Note as a Y.Doc. Persist it with y-indexeddb in the PWA and sync to a self-hosted Hocuspocus (MIT). This connects to the separate sync/offline research.
- **Licence:** if Chronos uses any `@blocknote/xl-*` package, Chronos's licence must be GPL-3.0-compatible. Otherwise MPL-2.0 core imposes almost nothing.
