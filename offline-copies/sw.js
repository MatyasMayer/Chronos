// Throwaway test service worker for the wayfinder ticket "Do large Offline copies hold up on real devices?". Not part of Chronos.
// 1. Keeps the test page usable in Airplane mode. 2. Serves OPFS files under file/<name>, answering Range with 206.
// 3. Logs Background Fetch results.

const VERSION = 'v1';
const SHELL = ['./', 'index.html', 'app.js', 'worker.js', 'manifest.webmanifest', 'assets/video.json', 'pdfjs/pdf.min.mjs', 'pdfjs/pdf.worker.min.mjs'];
const TYPES = { mp4: 'video/mp4', mov: 'video/quicktime', pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', txt: 'text/plain', bin: 'application/octet-stream' };

self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
  await self.clients.claim();
})()));

async function tell(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }

function swlog(text) {
  return new Promise((res) => {
    const r = indexedDB.open('offline-copies-test', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('dl'); r.result.createObjectStore('swlog', { autoIncrement: true }); };
    r.onerror = () => res();
    r.onsuccess = () => { const tx = r.result.transaction('swlog', 'readwrite'); tx.objectStore('swlog').add({ t: Date.now(), text }); tx.oncomplete = tx.onerror = () => { tell({ swlog: true }); res(); }; };
  });
}

async function serveFile(request, url) {
  const name = decodeURIComponent(url.pathname.split('/file/')[1]);
  const capMiB = Number(url.searchParams.get('cap') || 0);
  let file;
  try { file = await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile(); }
  catch (e) { tell({ sw: 'file', name, error: `${e.name}: ${e.message}` }); return new Response(`OPFS in service worker failed: ${e.name}: ${e.message}`, { status: 404 }); }
  const type = TYPES[name.split('.').pop().toLowerCase()] || file.type || 'application/octet-stream';
  const headers = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  if (url.searchParams.has('dl')) headers['Content-Disposition'] = `attachment; filename="${name}"`;
  const m = /^bytes=(\d+)-(\d*)$/.exec(request.headers.get('range') || '');
  if (!m) {
    tell({ sw: 'file', name, range: null, status: 200, length: file.size });
    return new Response(file, { status: 200, headers: { ...headers, 'Content-Length': String(file.size) } });
  }
  const start = Number(m[1]);
  if (start >= file.size) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${file.size}` } });
  let end = m[2] === '' ? file.size - 1 : Math.min(Number(m[2]), file.size - 1);
  if (capMiB) end = Math.min(end, start + capMiB * 1024 * 1024 - 1);
  tell({ sw: 'file', name, range: request.headers.get('range'), status: 206, length: end - start + 1 });
  return new Response(file.slice(start, end + 1, type), { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${file.size}`, 'Content-Length': String(end - start + 1) } });
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;
  if (url.pathname.includes('/file/')) return e.respondWith(serveFile(e.request, url));
  if (url.pathname.includes('/assets/') && !url.pathname.endsWith('video.json')) return; // test downloads go straight to the network
  e.respondWith((async () => {
    try {
      const r = await fetch(e.request);
      if (r.ok && !e.request.headers.has('range')) (await caches.open(VERSION)).put(e.request, r.clone());
      return r;
    } catch (err) {
      const hit = await caches.match(e.request, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});

for (const type of ['backgroundfetchsuccess', 'backgroundfetchfail', 'backgroundfetchabort']) {
  self.addEventListener(type, (e) => e.waitUntil((async () => {
    const r = e.registration; let records = '?';
    try { records = (await r.matchAll()).length; } catch {}
    await swlog(`${type}: id=${r.id} downloaded=${r.downloaded} of ${r.downloadTotal} result=${r.result || '-'} failureReason=${r.failureReason || '-'} records=${records}`);
    try { if (e.updateUI) await e.updateUI({ title: `Chronos test: ${type.replace('backgroundfetch', '')}` }); } catch {}
  })()));
}
