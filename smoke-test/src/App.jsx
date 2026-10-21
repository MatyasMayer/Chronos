import { lazy, Suspense, useEffect, useState } from "react";
import { recordOpen, daysBetween } from "./storage.js";
import { VAPID_PUBLIC_KEY } from "./vapid.js";

const Editor = lazy(() => import("./Editor.jsx"));
const BASE = import.meta.env.BASE_URL;
const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

// Each check: what to do, and the question to answer with Works / Broken / Odd.
const CHECKS = [
  { id: "install", group: "Install", title: "Opened from the Home Screen icon", steps: "Safari → Share → Add to Home Screen, then open it from the icon. The banner at the top should say standalone." },
  { id: "persist", group: "Storage", title: "Persistent storage granted", steps: "Tap “Request persistent storage” below. Works = it says persisted: true." },
  { id: "survival", group: "Storage", title: "Data survives 8+ days unopened", steps: "Note the “first opened” date. Don't open the app for 8+ days, then open it: Works = first opened is still the old date. (Report today with this left blank; answer it later.)" },
  { id: "offline", group: "Storage", title: "Opens offline", steps: "Turn on Airplane mode, swipe the app away in the app switcher, reopen it from the icon. Works = this page loads." },
  { id: "swipe", group: "Navigation", title: "Swipe-back gesture", steps: "Tap “Go to second page”, then swipe right from the left screen edge. Works = you come back here smoothly." },
  { id: "pdf-open", group: "Files", title: "Open a PDF", steps: "Tap “Open PDF”. Works = it shows and you can get back into the app without getting stuck." },
  { id: "pdf-download", group: "Files", title: "Download a PDF", steps: "Tap “Download PDF”. Works = you can save it to Files (or it lands in Downloads)." },
  { id: "blob-download", group: "Files", title: "Download a generated file", steps: "Tap “Download generated file”. Works = a .txt file can be saved." },
  { id: "share-file", group: "Files", title: "Share sheet with a file", steps: "Tap “Share PDF”. Works = the iOS share sheet opens with the PDF (try Save to Files)." },
  { id: "local-notif", group: "Notifications", title: "Notification shown by the app", steps: "Tap “Enable notifications” then “Show a notification now”. Works = a banner appears." },
  { id: "push", group: "Notifications", title: "Push from the server (app closed)", steps: "After enabling notifications, copy the report (it includes the subscription) and send it to Claude. Close the app; Claude sends a push. Works = it arrives." },
  { id: "editor-typing", group: "Editor", title: "Typing, selecting, slash menu", steps: "Type in the editor below, select text, type / for the menu. Works = keyboard, cursor and menu behave." },
  { id: "editor-custom", group: "Editor", title: "Custom blocks don't freeze", steps: "Tap the checkboxes and “Tap me” buttons in the task cards, type around them, insert more. Works = no freezing or lag." },
  { id: "editor-drag", group: "Editor", title: "Drag a block by touch", steps: "Tap a block, then drag its ⋮⋮ handle to move it. Works = the block moves where you drop it." },
  { id: "haptic", group: "Feel", title: "Haptic tap from a switch", steps: "Flip the switch below. Works = you feel a light tap (needs iOS 18+ and haptics on)." },
  { id: "feel", group: "Feel", title: "Overall feel", steps: "Scroll fast, rubber-band at the top and bottom, rotate the phone. Does it feel like an app or like a webpage? Write a note." },
];

const urlB64ToUint8 = (b64) => {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

function useSaved(key, initial) {
  const [value, setValue] = useState(() => JSON.parse(localStorage.getItem(key) ?? "null") ?? initial);
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

export default function App() {
  const [page, setPage] = useState(new URLSearchParams(location.search).get("page") ?? "home");
  const [opens, setOpens] = useState(null);
  const [storage, setStorage] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [log, setLog] = useState([]);
  const [results, setResults] = useSaved("results", {});
  const [copied, setCopied] = useState(false);

  const note = (msg) => setLog((l) => [`${new Date().toLocaleTimeString()} ${msg}`, ...l].slice(0, 20));

  const refreshStorage = async () => {
    const persisted = await navigator.storage?.persisted?.();
    const est = await navigator.storage?.estimate?.();
    setStorage({ persisted, usageMB: est && (est.usage / 1e6).toFixed(1), quotaMB: est && (est.quota / 1e6).toFixed(0) });
  };

  useEffect(() => {
    recordOpen().then(setOpens);
    refreshStorage();
    navigator.serviceWorker?.ready.then((reg) => reg.pushManager?.getSubscription()).then((s) => s && setSubscription(s.toJSON()));
    const onPop = () => setPage(new URLSearchParams(location.search).get("page") ?? "home");
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);

  const go = (p) => {
    history.pushState({}, "", p === "home" ? BASE : `${BASE}?page=${p}`);
    setPage(p);
    scrollTo(0, 0);
  };

  const requestPersist = async () => {
    const granted = await navigator.storage?.persist?.();
    note(`persist() returned ${granted}`);
    refreshStorage();
  };

  const enableNotifications = async () => {
    try {
      const perm = await Notification.requestPermission();
      note(`permission: ${perm}`);
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(VAPID_PUBLIC_KEY) });
      setSubscription(sub.toJSON());
      note("push subscription created");
    } catch (e) {
      note(`notifications failed: ${e.message}`);
    }
  };

  const showNow = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("Chronos smoke test", { body: "Shown by the app itself", icon: `${BASE}icon-192.png` });
      note("showNotification called");
    } catch (e) {
      note(`showNotification failed: ${e.message}`);
    }
  };

  const downloadBlob = () => {
    const url = URL.createObjectURL(new Blob([`Generated by Chronos smoke test at ${new Date().toISOString()}\n`], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "chronos-test.txt" });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const sharePdf = async () => {
    try {
      const blob = await (await fetch(`${BASE}sample.pdf`)).blob();
      const file = new File([blob], "lecture-5.pdf", { type: "application/pdf" });
      if (!navigator.canShare?.({ files: [file] })) return note("canShare(files) is false");
      await navigator.share({ files: [file], title: "Lecture 5" });
      note("share completed");
    } catch (e) {
      note(`share failed: ${e.message}`);
    }
  };

  const setResult = (id, patch) => setResults((r) => ({ ...r, [id]: { ...r[id], ...patch } }));

  const report = () =>
    [
      "Chronos iPhone smoke test report",
      `when: ${new Date().toISOString()}`,
      `ua: ${navigator.userAgent}`,
      `standalone: ${standalone}`,
      `storage: persisted=${storage.persisted} usage=${storage.usageMB}MB quota=${storage.quotaMB}MB`,
      `first opened: ${opens?.firstSeen} · opens: ${opens?.opens} · previous open: ${opens?.previousOpen}`,
      `push support: ${"PushManager" in window} · notification permission: ${window.Notification?.permission}`,
      "",
      ...CHECKS.map((c) => `[${results[c.id]?.status ?? "not tried"}] ${c.title}${results[c.id]?.note ? ` — ${results[c.id].note}` : ""}`),
      "",
      "log:",
      ...log,
      "",
      `subscription: ${subscription ? JSON.stringify(subscription) : "none"}`,
    ].join("\n");

  const copyReport = async () => {
    await navigator.clipboard.writeText(report());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (page === "second") {
    return (
      <main>
        <h1>Second page</h1>
        <p>Now swipe right from the left edge of the screen to go back. If nothing happens, use the button.</p>
        <button onClick={() => history.back()}>Back</button>
        <div style={{ height: "120vh" }} />
      </main>
    );
  }

  const groups = [...new Set(CHECKS.map((c) => c.group))];
  return (
    <main>
      <header className={standalone ? "ok" : "warn"}>
        {standalone ? "✓ Running standalone (from the Home Screen)" : "⚠ Running in a browser tab: add to Home Screen and open from the icon"}
      </header>
      <h1>Chronos · iPhone smoke test</h1>
      <p className="muted">Try each check, mark it, then copy the report and send it back.</p>

      <section className="facts">
        <div><b>First opened</b><span>{opens ? new Date(opens.firstSeen).toLocaleString() : "…"}</span></div>
        <div><b>Days since</b><span>{opens ? daysBetween(opens.firstSeen, new Date()) : "…"}</span></div>
        <div><b>Gap since last open</b><span>{opens?.previousOpen ? `${daysBetween(opens.previousOpen, new Date())} days` : "first open"}</span></div>
        <div><b>Persisted</b><span>{String(storage.persisted)}</span></div>
        <div><b>Usage / quota</b><span>{storage.usageMB} / {storage.quotaMB} MB</span></div>
      </section>

      <section className="actions">
        <button onClick={requestPersist}>Request persistent storage</button>
        <button onClick={() => go("second")}>Go to second page</button>
        <a className="button" href={`${BASE}sample.pdf`}>Open PDF</a>
        <a className="button" href={`${BASE}sample.pdf`} download="lecture-5.pdf">Download PDF</a>
        <button onClick={downloadBlob}>Download generated file</button>
        <button onClick={sharePdf}>Share PDF</button>
        <button onClick={enableNotifications}>Enable notifications</button>
        <button onClick={showNow}>Show a notification now</button>
        <label className="switch-row">
          <input type="checkbox" switch="" /> Haptic switch
        </label>
      </section>

      {groups.map((g) => (
        <section key={g}>
          <h2>{g}</h2>
          {CHECKS.filter((c) => c.group === g).map((c) => (
            <article key={c.id} className={`check ${results[c.id]?.status ?? ""}`}>
              <h3>{c.title}</h3>
              <p>{c.steps}</p>
              <div className="verdict">
                {["works", "broken", "odd"].map((s) => (
                  <button key={s} className={results[c.id]?.status === s ? `on ${s}` : "secondary"} onClick={() => setResult(c.id, { status: s })}>
                    {s === "works" ? "Works" : s === "broken" ? "Broken" : "Odd"}
                  </button>
                ))}
              </div>
              <input placeholder="Note (optional)" value={results[c.id]?.note ?? ""} onChange={(e) => setResult(c.id, { note: e.target.value })} />
            </article>
          ))}
          {g === "Editor" && (
            <Suspense fallback={<p>Loading editor…</p>}>
              <Editor />
            </Suspense>
          )}
        </section>
      ))}

      <section>
        <h2>Log</h2>
        <pre className="log">{log.join("\n") || "Nothing yet."}</pre>
      </section>

      <div className="sticky">
        <button onClick={copyReport}>{copied ? "Copied ✓" : "Copy report"}</button>
      </div>
    </main>
  );
}
