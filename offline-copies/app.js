// Throwaway test page for the wayfinder ticket "Do large Offline copies hold up on real devices?". Not part of Chronos.

const $ = (s) => document.querySelector(s);
const MiB = 1024 * 1024;
const fmt = (n) => n == null ? '?' : n >= 1024 * MiB ? `${(n / 1024 / MiB).toFixed(2)} GiB` : `${(n / MiB).toFixed(1)} MiB`;
const errText = (e) => `${e?.name || 'Error'}: ${e?.message || e}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- log (localStorage, so it survives a kill or a crash) ----------
const LOG_KEY = 'offline-copies-log';
let entries = [];
try { entries = JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch {}
const stamp = (t) => new Date(t).toISOString().replace('T', ' ').slice(0, 19) + 'Z';
function renderLog() {
  $('#log').textContent = entries.map((e) => `${stamp(e.t)}  ${e.text}`).join('\n');
  $('#log').scrollTop = $('#log').scrollHeight;
  $('#last').textContent = entries.at(-1)?.text ?? '';
}
function log(text, t = Date.now()) {
  entries.push({ t, text }); if (entries.length > 3000) entries = entries.slice(-3000);
  try { localStorage.setItem(LOG_KEY, JSON.stringify(entries)); } catch {}
  renderLog();
}
const progress = (text) => { $('#progress').textContent = text; };

// ---------- which window is this ----------
const ua = navigator.userAgent;
const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const browser = /Edg\//.test(ua) ? 'Edge' : navigator.brave ? 'Brave' : /FxiOS/.test(ua) ? 'Firefox iOS' : /CriOS/.test(ua) ? 'Chrome iOS' : /Chrome\//.test(ua) ? 'Chromium' : /Safari\//.test(ua) ? 'Safari' : 'unknown';
const device = /iPhone|iPad/.test(ua) ? 'iPhone' : /Windows/.test(ua) ? 'Windows' : 'other';
const context = `${device} ${browser} ${standalone ? 'installed app' : 'browser tab'}`;
$('#context').textContent = context;

// ---------- worker ----------
const worker = new Worker('worker.js');
let seq = 0; const pending = new Map(); const chunkTimes = [];
worker.onerror = (e) => log(`WORKER ERROR: ${e.message}`);
worker.onmessage = ({ data }) => {
  if (data.id) { const p = pending.get(data.id); pending.delete(data.id); return data.ok ? p.res(data.result) : p.rej(new Error(data.error)); }
  if (data.ev === 'progress') progress(`${data.label}: ${data.bytes ? `${fmt(data.done)} of ${fmt(data.total)}` : `${data.done} of ${data.total}`}`);
  if (data.ev === 'fill') log(`fill: written ${fmt(data.written)}, estimate usage ${fmt(data.usage)} quota ${fmt(data.quota)}${data.error ? `, STOPPED BY ${data.error}` : ''}`);
  if (data.ev === 'dl') onDownloadEvent(data);
};
const call = (op, args = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); worker.postMessage({ id, op, ...args }); });

// ---------- test files ----------
const asset = (u) => new URL(`assets/${u}`, location.href).href;
let video, specs = {};
async function loadSpecs() {
  video = await (await fetch('assets/video.json')).json();
  video.head.url = asset(video.head.url); video.loop.url = asset(video.loop.url);
  const count = 300;
  specs = { video, raw: { name: 'raw-4GiB.bin', type: 'application/octet-stream', size: count * video.loop.size, head: { url: video.head.url, size: 0 }, loop: { ...video.loop, count } } };
}
const PDF = 'test-300.pdf', PPTX = 'test-deck.pptx';
const root = () => navigator.storage.getDirectory();
const opfsFile = async (name) => (await (await root()).getFileHandle(name)).getFile();
const fileUrl = (name, q = '') => `file/${encodeURIComponent(name)}${q}`;

// ---------- this device ----------
async function refresh() {
  const lines = [`${context}`, ua];
  let persisted = '?', est = {};
  try { persisted = await navigator.storage.persisted(); est = await navigator.storage.estimate(); } catch (e) { lines.push(errText(e)); }
  lines.push(`persisted=${persisted}  usage=${fmt(est.usage)}  quota=${fmt(est.quota)}`);
  const has = { showSaveFilePicker: 'showSaveFilePicker' in window, backgroundFetch: 'BackgroundFetchManager' in window, backgroundSync: 'SyncManager' in window, wakeLock: 'wakeLock' in navigator, share: 'share' in navigator, serviceWorker: 'serviceWorker' in navigator };
  lines.push(Object.entries(has).map(([k, v]) => `${k}=${v ? 'yes' : 'no'}`).join('  '));
  $('#env').textContent = lines.join('\n');
  let files = [];
  try { files = await call('list'); } catch (e) { log(`list failed: ${errText(e)}`); }
  const box = $('#files'); box.textContent = files.length ? '' : '(none)';
  for (const f of files) {
    const row = document.createElement('div');
    const part = f.dl && !f.dl.done ? `  PARTIAL: ${fmt(f.dl.offset)} of ${fmt(f.dl.size)}` : f.dl?.done ? '  complete' : '';
    row.append(`${f.name}  ${fmt(f.size)}${part} `);
    const del = document.createElement('button'); del.className = 'quiet'; del.textContent = 'Delete';
    del.onclick = async () => { await call('remove', { name: f.name }); log(`deleted ${f.name}`); refresh(); };
    row.append(del); box.append(row);
  }
  return { persisted, est, files, lines };
}
$('#refresh').onclick = refresh;
$('#persist').onclick = async () => { try { log(`persist() returned ${await navigator.storage.persist()}`); } catch (e) { log(`persist() threw ${errText(e)}`); } refresh(); };

// ---------- 1. download ----------
let hiddenAt = null, dlRunning = null, dlStart = null, wakeLock = null;
function onDownloadEvent(d) {
  if (d.kind === 'chunk') {
    chunkTimes.push(d.t);
    const secs = (Date.now() - dlStart.t) / 1000;
    progress(`download ${d.name}: ${fmt(d.offset)} of ${fmt(d.size)} (${(100 * d.offset / d.size).toFixed(1)}%), ${((d.offset - dlStart.offset) / MiB / secs).toFixed(1)} MiB/s`);
  } else if (d.kind === 'start') { dlStart = { t: Date.now(), offset: d.offset }; log(`download ${d.name}: ${d.offset ? `RESUMING at ${fmt(d.offset)}` : 'starting from 0'} of ${fmt(d.size)}`); }
  else if (d.kind === 'etag') log(`download: ${d.key} etag=${d.etag || '(none)'} content-range=${d.contentRange}`);
  else if (d.kind === 'failing') log(`download: requests FAILING at ${fmt(d.offset)}: ${d.error} (retrying)`);
  else if (d.kind === 'recovered') log(`download: recovered, now at ${fmt(d.offset)}`);
}
$('#dl-start').onclick = async () => {
  const spec = specs[$('#dl-which').value]; dlRunning = spec.name;
  try {
    const r = await call('download', { name: spec.name, spec });
    const secs = (Date.now() - dlStart.t) / 1000;
    log(`download ${spec.name}: ${r.done ? 'FINISHED' : 'paused'} at ${fmt(r.offset)} of ${fmt(r.size)}; this run ${secs.toFixed(0)} s, ${((r.offset - dlStart.offset) / MiB / secs).toFixed(1)} MiB/s`);
  } catch (e) { log(`download ${spec.name} FAILED: ${errText(e)}`); }
  dlRunning = null; refresh();
};
$('#dl-stop').onclick = () => dlRunning && call('stop', { name: dlRunning });
$('#dl-verify').onclick = async () => {
  const spec = specs[$('#dl-which').value];
  try { logVerify(spec.name, await call('verify', { name: spec.name, spec })); } catch (e) { log(`check ${spec.name} failed: ${errText(e)}`); }
};
function logVerify(label, r) {
  log(`check ${label}: ${r.identical ? 'IDENTICAL to the test file' : 'DIFFERENT'}; size ${r.size} (expected ${r.expectedSize}); ${r.bad.length} of ${r.pieces} pieces differ${r.bad.length ? ` (first: ${r.bad.slice(0, 5).join(', ')})` : ''}; took ${(r.ms / 1000).toFixed(1)} s`);
  progress('');
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); if (dlRunning) log('went to background with a download running'); return; }
  const left = hiddenAt; hiddenAt = null;
  if ($('#wake').checked) acquireWake();
  if (!left || !dlRunning) return;
  setTimeout(() => { // let queued worker messages arrive; chunk times come from the worker's own clock
    const now = Date.now(), away = chunkTimes.filter((t) => t >= left && t <= now);
    let gap = 0, prev = left; for (const t of [...away, now]) { gap = Math.max(gap, t - prev); prev = t; }
    log(`back after ${((now - left) / 1000).toFixed(0)} s in background: ${away.length} chunks (about ${away.length * 8} MiB) completed while away${away.length ? `; last one ${((away.at(-1) - left) / 1000).toFixed(0)} s after leaving` : ''}; longest pause ${(gap / 1000).toFixed(0)} s`);
  }, 500);
});
for (const type of ['pagehide', 'pageshow', 'freeze', 'resume']) addEventListener(type, () => dlRunning && log(`event: ${type}`), true);
addEventListener('online', () => log('event: online')); addEventListener('offline', () => log('event: offline'));

async function acquireWake() {
  try {
    wakeLock = await navigator.wakeLock.request('screen'); log('wake lock acquired');
    wakeLock.addEventListener('release', () => log('wake lock released'));
  } catch (e) { log(`wake lock failed: ${errText(e)}`); }
}
$('#wake').onchange = (e) => e.target.checked ? acquireWake() : wakeLock?.release();

// ---------- 2. video ----------
const v = $('#video'); let route = null, blobUrl = null, swStats = null, beat = null;
const ROUTES = { blob: 'A Blob URL', sw4: 'B service worker 4 MiB cap', sw0: 'B service worker NO cap' };
function unloadVideo() {
  if (route && swStats?.count) log(`video route ${ROUTES[route]}: service worker answered ${swStats.count} range requests, largest ${fmt(swStats.max)}, total ${fmt(swStats.total)}`);
  clearInterval(beat); v.removeAttribute('src'); v.load(); if (blobUrl) URL.revokeObjectURL(blobUrl); blobUrl = null; route = null;
}
document.querySelectorAll('[data-route]').forEach((b) => b.onclick = async () => {
  unloadVideo(); route = b.dataset.route; swStats = { count: 0, max: 0, total: 0 };
  log(`video: loading through route ${ROUTES[route]} (online=${navigator.onLine})`);
  try {
    if (route === 'blob') v.src = blobUrl = URL.createObjectURL(await opfsFile(video.name));
    else v.src = fileUrl(video.name, route === 'sw4' ? '?cap=4' : '');
  } catch (e) { log(`video: could not open the file: ${errText(e)}`); }
  beat = setInterval(() => !v.paused && log(`video: still playing at ${v.currentTime.toFixed(0)} s`), 60000);
});
$('#video-unload').onclick = unloadVideo;
let lastWaiting = 0;
v.addEventListener('loadedmetadata', () => log(`video: loadedmetadata, duration ${v.duration.toFixed(1)} s, ${v.videoWidth}x${v.videoHeight}`));
v.addEventListener('error', () => log(`video: ERROR code=${v.error?.code} ${v.error?.message || ''}`));
v.addEventListener('playing', () => log(`video: playing at ${v.currentTime.toFixed(1)} s`));
v.addEventListener('ended', () => log('video: ended'));
v.addEventListener('stalled', () => log(`video: stalled at ${v.currentTime.toFixed(1)} s`));
v.addEventListener('waiting', () => { if (Date.now() - lastWaiting > 5000) log(`video: waiting at ${v.currentTime.toFixed(1)} s`); lastWaiting = Date.now(); });
$('#seek-test').onclick = async () => {
  if (!v.duration) return log('seek test: load a route and press play first');
  try { await v.play(); } catch (e) { log(`seek test: play() refused: ${errText(e)}`); }
  for (const pct of [50, 99, 1, 75, 25, 90]) {
    const target = v.duration * pct / 100, t0 = performance.now(); v.currentTime = target;
    let ok = false;
    while (performance.now() - t0 < 20000) { await sleep(50); if (!v.seeking && v.readyState >= 3 && Math.abs(v.currentTime - target) < 3) { ok = true; break; } }
    log(`seek test [${ROUTES[route]}]: to ${pct}% (${target.toFixed(0)} s) ${ok ? `ready in ${(performance.now() - t0).toFixed(0)} ms` : `NOT READY after 20 s (readyState=${v.readyState}, seeking=${v.seeking}, at ${v.currentTime.toFixed(0)} s)`}`);
    await sleep(1500);
    if (ok && v.currentTime <= target + 0.3 && !v.ended) log(`seek test: playback did not advance after seeking to ${pct}% (at ${v.currentTime.toFixed(1)} s)`);
  }
  log('seek test: done');
};

// ---------- 3. fill ----------
$('#fill-start').onclick = async () => {
  const capGiB = Number($('#fill-cap').value); log(`fill: starting, cap ${capGiB} GiB`);
  try { const r = await call('fill', { capGiB }); log(`fill: ended after ${fmt(r.written)}; ${r.error ? `error ${r.error}` : r.stopped ? 'stopped by hand' : 'reached the cap without an error'}`); }
  catch (e) { log(`fill FAILED: ${errText(e)}`); }
  refresh();
};
$('#fill-stop').onclick = () => call('stop', { name: 'filler' });
$('#fill-clear').onclick = async () => { log(`fill: deleted ${await call('clearFill')} filler files`); refresh(); };

// ---------- 4. PDF ----------
$('#pdf-make').onclick = async () => {
  try { const t0 = performance.now(); const r = await call('makePdf', { name: PDF, pages: 300, jpgUrl: asset('page.jpg'), jpgW: 1600, jpgH: 900 }); log(`PDF built: ${r.pages} pages, ${fmt(r.size)}, ${((performance.now() - t0) / 1000).toFixed(1)} s`); }
  catch (e) { log(`PDF build FAILED: ${errText(e)}`); }
  progress(''); refresh();
};
let pdfjs, pdfDoc, pdfTask, pdfHow, pdfBusy = false;
document.querySelectorAll('[data-pdf]').forEach((b) => b.onclick = async () => {
  pdfHow = b.dataset.pdf === 'sw' ? 'service worker' : 'direct file reads';
  try {
    pdfjs ??= await import('./pdfjs/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.mjs', location.href).href;
    await pdfTask?.destroy(); const t0 = performance.now(); swStats = { count: 0, max: 0, total: 0 };
    const common = { disableAutoFetch: true, disableStream: true, rangeChunkSize: 65536 };
    if (b.dataset.pdf === 'sw') pdfTask = pdfjs.getDocument({ url: new URL(fileUrl(PDF), location.href).href, ...common });
    else {
      const file = await opfsFile(PDF); let reads = 0, bytes = 0;
      class Transport extends pdfjs.PDFDataRangeTransport {
        requestDataRange(begin, end) { reads++; bytes += end - begin; swStats = { count: reads, max: 0, total: bytes }; file.slice(begin, end).arrayBuffer().then((buf) => this.onDataRange(begin, new Uint8Array(buf))); }
      }
      pdfTask = pdfjs.getDocument({ range: new Transport(file.size, null), ...common });
    }
    pdfDoc = await pdfTask.promise;
    log(`pdf.js [${pdfHow}]: opened ${pdfDoc.numPages} pages in ${(performance.now() - t0).toFixed(0)} ms (online=${navigator.onLine})`);
    $('#pdf-ui').hidden = false; await showPage(1, true);
  } catch (e) { log(`pdf.js [${pdfHow}] FAILED to open: ${errText(e)}`); }
});
async function showPage(n, verbose) {
  if (!pdfDoc || pdfBusy) return; pdfBusy = true;
  try {
    n = Math.max(1, Math.min(pdfDoc.numPages, n)); $('#pdf-page').value = n;
    const t0 = performance.now(), page = await pdfDoc.getPage(n), canvas = $('#pdf-canvas');
    const base = page.getViewport({ scale: 1 });
    let scale = (canvas.clientWidth || 600) * devicePixelRatio / base.width;
    scale = Math.min(scale, Math.sqrt(5e6 / (base.width * base.height))); // stay under 5 megapixels
    const viewport = page.getViewport({ scale });
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), canvas, viewport }).promise;
    page.cleanup();
    const ms = performance.now() - t0;
    if (verbose) log(`pdf.js [${pdfHow}]: page ${n} rendered in ${ms.toFixed(0)} ms at ${canvas.width}x${canvas.height}; ${swStats.count} range reads so far, ${fmt(swStats.total)}`);
    return ms;
  } catch (e) { log(`pdf.js [${pdfHow}]: page ${n} FAILED: ${errText(e)}`); } finally { pdfBusy = false; }
}
const curPage = () => Number($('#pdf-page').value) || 1;
$('#pdf-prev').onclick = () => showPage(curPage() - 1, true);
$('#pdf-next').onclick = () => showPage(curPage() + 1, true);
$('#pdf-go').onclick = () => showPage(curPage(), true);
$('#pdf-flip').onclick = async () => {
  const from = curPage(), times = [];
  for (let i = 0; i < 60; i++) { const ms = await showPage((from - 1 + i) % pdfDoc.numPages + 1); if (ms == null) break; times.push(ms); }
  times.sort((a, b) => a - b);
  log(`pdf.js [${pdfHow}]: flipped ${times.length} pages from ${from}: median ${times[times.length >> 1]?.toFixed(0)} ms, slowest ${times.at(-1)?.toFixed(0)} ms; ${swStats.count} range reads, ${fmt(swStats.total)}`);
};
$('#pdf-search').onclick = async () => {
  const term = 'zebra-287', t0 = performance.now(); let found = 0;
  try {
    for (let n = 1; n <= pdfDoc.numPages; n++) {
      const page = await pdfDoc.getPage(n); const text = (await page.getTextContent()).items.map((i) => i.str).join(' ');
      page.cleanup(); if (text.includes(term)) { found = n; }
      if (n % 20 === 0) progress(`search: page ${n} of ${pdfDoc.numPages}`);
    }
    log(`pdf.js [${pdfHow}]: searched all ${pdfDoc.numPages} pages for "${term}" in ${((performance.now() - t0) / 1000).toFixed(1)} s, ${found ? `found on page ${found}` : 'NOT FOUND'}; ${swStats.count} range reads, ${fmt(swStats.total)}`);
    if (found) showPage(found, true);
  } catch (e) { log(`pdf.js search FAILED: ${errText(e)}`); }
  progress('');
};

// ---------- 4 + 5. open with the built-in viewer / Quick Look ----------
$('#pptx-get').onclick = async () => {
  try {
    const blob = await (await fetch(asset(PPTX))).blob();
    const r = await call('importFile', { file: new File([blob], PPTX), name: PPTX }); log(`PPTX stored: ${fmt(r.size)}`);
  } catch (e) { log(`PPTX fetch FAILED: ${errText(e)}`); }
  progress(''); refresh();
};
document.querySelectorAll('[data-open]').forEach((b) => b.onclick = async () => {
  const [kind, how] = b.dataset.open.split(':'); const name = kind === 'pdf' ? PDF : PPTX;
  log(`open ${name} via ${how} (online=${navigator.onLine}); if the next line is a new launch, the page was replaced`);
  try {
    if (how === 'sw') location.href = fileUrl(name);
    else if (how === 'sw-tab') window.open(fileUrl(name), '_blank');
    else {
      const f = await opfsFile(name);
      const type = kind === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      location.href = URL.createObjectURL(new File([f], name, { type }));
    }
  } catch (e) { log(`open FAILED: ${errText(e)}`); }
});

// ---------- 6. saving out ----------
let videoFile = null; // fetched ahead of time so share() runs straight from the tap
async function primeVideoFile() { try { videoFile = await opfsFile(video.name); } catch { videoFile = null; } }
document.querySelectorAll('[data-save]').forEach((b) => b.onclick = async () => {
  const a = document.createElement('a'); a.download = video.name;
  try {
    if (b.dataset.save === 'blob') { await primeVideoFile(); a.href = URL.createObjectURL(new File([videoFile], video.name, { type: 'video/mp4' })); }
    else a.href = fileUrl(video.name, '?dl=1');
    log(`save out via ${b.dataset.save}: link clicked for ${fmt(videoFile?.size)}`);
    document.body.append(a); a.click(); a.remove();
  } catch (e) { log(`save out via ${b.dataset.save} FAILED: ${errText(e)}`); }
});
for (const mb of [10, 50, 100, 250, 500, 1000, 0]) {
  const b = document.createElement('button'); b.className = 'quiet'; b.textContent = mb ? `Share ${mb} MB` : 'Share all 1.4 GiB';
  b.onclick = async () => {
    if (!videoFile) { await primeVideoFile(); if (!videoFile) return log('share: the test video is not in storage'); }
    const size = mb ? Math.min(mb * 1e6, videoFile.size) : videoFile.size;
    const f = new File([videoFile.slice(0, size)], `share-${mb || 'full'}.mp4`, { type: 'video/mp4' });
    log(`share: opening the sheet with ${fmt(size)} (canShare=${navigator.canShare?.({ files: [f] })})`);
    try { await navigator.share({ files: [f] }); log(`share: ${fmt(size)} completed`); }
    catch (e) { log(`share: ${fmt(size)} ended with ${errText(e)}`); }
  };
  $('#share-buttons').append(b);
}

// ---------- 7. taking back in ----------
let picked = null;
$('#pick').onchange = (e) => {
  picked = e.target.files[0]; if (!picked) return;
  const d = `${picked.name}, ${picked.size} bytes (${fmt(picked.size)}), type "${picked.type}", modified ${stamp(picked.lastModified)}`;
  $('#picked').textContent = d; log(`picked: ${d}`);
  $('#pick-compare').disabled = $('#pick-import').disabled = false;
};
$('#pick-compare').onclick = async () => { try { logVerify(`picked file ${picked.name}`, await call('verify', { file: picked, spec: video })); } catch (e) { log(`compare FAILED: ${errText(e)}`); } };
$('#pick-import').onclick = async () => {
  try {
    const r = await call('importFile', { file: picked, name: `pending-${picked.name}` });
    log(`copy in: ${fmt(r.size)} in ${(r.ms / 1000).toFixed(1)} s (${(r.size / MiB / (r.ms / 1000)).toFixed(0)} MiB/s)`);
  } catch (e) { log(`copy in FAILED: ${errText(e)}`); }
  progress(''); refresh();
};

// ---------- 8. Background Fetch ----------
const swReg = () => navigator.serviceWorker.ready;
$('#bf-start').onclick = async () => {
  try {
    const n = Number($('#bf-count').value), reg = await swReg();
    const urls = Array.from({ length: n }, (_, i) => `assets/video-loop.bin?bf=${Date.now()}-${i}`);
    const bf = await reg.backgroundFetch.fetch(`bf-${Date.now()}`, urls, { title: 'Chronos test download', downloadTotal: n * video.loop.size });
    log(`background fetch ${bf.id}: started, ${n} pieces, ${fmt(n * video.loop.size)}`);
    bf.addEventListener('progress', () => progress(`background fetch: ${fmt(bf.downloaded)} of ${fmt(bf.downloadTotal)}`));
  } catch (e) { log(`background fetch FAILED to start: ${errText(e)}`); }
};
async function bfStatus(quiet) {
  try {
    const reg = await swReg(); if (!reg.backgroundFetch) return quiet || log('background fetch: not available here');
    const ids = await reg.backgroundFetch.getIds();
    if (!quiet || ids.length) log(`background fetch: ${ids.length} registered`);
    for (const id of ids) { const r = await reg.backgroundFetch.get(id); log(`background fetch ${id}: ${fmt(r.downloaded)} of ${fmt(r.downloadTotal)}, result=${r.result || 'still running'}, failureReason=${r.failureReason || '-'}`); }
  } catch (e) { log(`background fetch status FAILED: ${errText(e)}`); }
}
$('#bf-status').onclick = () => bfStatus(false);
$('#bf-abort').onclick = async () => { const reg = await swReg(); for (const id of await reg.backgroundFetch.getIds()) { await (await reg.backgroundFetch.get(id)).abort(); log(`background fetch ${id}: aborted`); } };

// ---------- service worker messages ----------
async function pullSwLog() {
  const d = await new Promise((res, rej) => { const r = indexedDB.open('offline-copies-test', 1); r.onupgradeneeded = () => { r.result.createObjectStore('dl'); r.result.createObjectStore('swlog', { autoIncrement: true }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const rows = await new Promise((res) => { const tx = d.transaction('swlog', 'readwrite'), s = tx.objectStore('swlog'), rq = s.getAll(); rq.onsuccess = () => { s.clear(); }; tx.oncomplete = () => res(rq.result); });
  for (const r of rows) log(`[service worker at ${stamp(r.t)}] ${r.text}`);
  d.close();
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', ({ data }) => {
    if (data.swlog) pullSwLog();
    if (data.sw === 'file') {
      if (data.error) return log(`service worker: OPFS read of ${data.name} FAILED: ${data.error}`);
      if (!swStats) swStats = { count: 0, max: 0, total: 0 };
      swStats.count++; swStats.max = Math.max(swStats.max, data.length); swStats.total += data.length;
      if (swStats.count <= 3) log(`service worker: ${data.name} ${data.range || 'no Range'} -> ${data.status}, ${fmt(data.length)}`);
    }
  });
}

// ---------- observations, notes, report ----------
document.querySelectorAll('.obs').forEach((box) => {
  box.append(`${box.dataset.q}? `);
  for (const answer of ['Yes', 'No', 'Not sure']) {
    const b = document.createElement('button'); b.className = 'quiet'; b.textContent = answer;
    b.onclick = () => { box.querySelectorAll('button').forEach((x) => x.classList.remove('picked')); b.classList.add('picked'); log(`OBSERVED: ${box.dataset.q} = ${answer.toUpperCase()}`); };
    box.append(b);
  }
});
$('#note-add').onclick = () => { const n = $('#note').value.trim(); if (n) { log(`NOTE: ${n}`); $('#note').value = ''; } };
const report = () => `Chronos Offline copies test report\n${$('#env').textContent}\n\n${$('#log').textContent}\n`;
$('#copy').onclick = async () => { try { await navigator.clipboard.writeText(report()); $('#last').textContent = 'Report copied.'; } catch (e) { $('#last').textContent = `Copy failed (${errText(e)}). Select the log by hand.`; } };
$('#share-report').onclick = async () => {
  const f = new File([report()], `offline-copies-${device}-${browser}.txt`.replace(/\s/g, '-'), { type: 'text/plain' });
  try { if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f] }); else { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; a.click(); } } catch {}
};
$('#clear').onclick = () => { if (confirm('Clear the whole log on this device?')) { entries = []; localStorage.removeItem(LOG_KEY); renderLog(); } };

// ---------- start ----------
renderLog();
(async () => {
  const lastSeen = Number(localStorage.getItem('offline-copies-last-seen') || 0);
  localStorage.setItem('offline-copies-last-seen', String(Date.now()));
  try { await loadSpecs(); } catch (e) { log(`could not load the test file list: ${errText(e)}`); }
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready; } catch (e) { log(`service worker registration FAILED: ${errText(e)}`); }
  }
  let caps = {}; try { caps = await call('caps'); } catch (e) { caps = { error: errText(e) }; }
  const { persisted, est, files } = await refresh();
  const since = lastSeen ? `${((Date.now() - lastSeen) / 86400000).toFixed(2)} days since the last launch` : 'first launch';
  log(`LAUNCH: ${context}; ${since}; persisted=${persisted} usage=${fmt(est.usage)} quota=${fmt(est.quota)}; OPFS=${caps.opfs} syncHandle=${caps.syncHandle}${caps.error ? ` (${caps.error})` : ''}; controlled by service worker=${!!navigator.serviceWorker?.controller}; files: ${files.map((f) => `${f.name} ${fmt(f.size)}${f.dl && !f.dl.done ? ` (partial, saved offset ${fmt(f.dl.offset)})` : ''}`).join(', ') || 'none'}; UA ${ua}`);
  await pullSwLog().catch(() => {});
  bfStatus(true);
  primeVideoFile();
})();
