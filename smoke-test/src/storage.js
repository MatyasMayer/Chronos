// Tiny IndexedDB helpers: record every open so data survival across days can be judged.
const DB = "chronos-smoke";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function get(key) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = db.transaction("kv").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function set(key, value) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Returns { firstSeen, previousOpen, opens } after recording this open.
export async function recordOpen() {
  const now = new Date().toISOString();
  const firstSeen = (await get("firstSeen")) ?? now;
  const opens = (await get("opens")) ?? [];
  const previousOpen = opens.at(-1) ?? null;
  await set("firstSeen", firstSeen);
  await set("opens", [...opens, now].slice(-50));
  if (!localStorage.getItem("firstSeen")) localStorage.setItem("firstSeen", firstSeen);
  return { firstSeen, previousOpen, opens: opens.length + 1 };
}

export const daysBetween = (a, b) => ((new Date(b) - new Date(a)) / 86_400_000).toFixed(1);
