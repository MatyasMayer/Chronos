// Throwaway test worker for the wayfinder ticket "Do large Offline copies hold up on real devices?". Not part of Chronos.
// Owns every OPFS write (sync access handles exist only in workers).

const MiB = 1024 * 1024;
const jobs = new Map(); // name -> { stop: boolean }

// ---- tiny IndexedDB key-value store (download offsets survive an app kill) ----
let dbp;
function db() {
  return dbp ??= new Promise((res, rej) => {
    const r = indexedDB.open('offline-copies-test', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('dl'); r.result.createObjectStore('swlog', { autoIncrement: true }); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function idb(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction('dl', mode); const rq = fn(tx.objectStore('dl'));
    tx.oncomplete = () => res(rq?.result); tx.onerror = tx.onabort = () => rej(tx.error);
  });
}
const getState = (name) => idb('readonly', (s) => s.get(name));
const putState = (name, v) => idb('readwrite', (s) => s.put(v, name));
const delState = (name) => idb('readwrite', (s) => s.delete(name));

const root = () => navigator.storage.getDirectory();
const ev = (type, data) => postMessage({ ev: type, ...data });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (buf) => hex(await crypto.subtle.digest('SHA-256', buf));
const errText = (e) => `${e?.name || 'Error'}: ${e?.message || e}`;

// A test file is a small head followed by one piece repeated `count` times. Map a file offset to its source.
function locate(spec, offset) {
  if (offset < spec.head.size) return { url: spec.head.url, key: 'head', pos: offset, left: spec.head.size - offset };
  const rel = (offset - spec.head.size) % spec.loop.size;
  return { url: spec.loop.url, key: 'loop', pos: rel, left: spec.loop.size - rel };
}

const ops = {
  async caps() {
    const out = { opfs: false, syncHandle: false };
    try {
      const dir = await root(); out.opfs = true;
      const fh = await dir.getFileHandle('.caps-probe', { create: true });
      const h = await fh.createSyncAccessHandle(); out.syncHandle = true; h.close();
      await dir.removeEntry('.caps-probe');
    } catch (e) { out.error = errText(e); }
    return out;
  },

  async list() {
    const dir = await root(); const out = [];
    for await (const [name, handle] of dir.entries()) {
      if (handle.kind !== 'file') continue;
      const f = await handle.getFile();
      out.push({ name, size: f.size, type: f.type, lastModified: f.lastModified, dl: await getState(name) });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },

  async remove({ name }) {
    jobs.get(name) && (jobs.get(name).stop = true);
    await (await root()).removeEntry(name).catch(() => {});
    await delState(name);
  },

  stop({ name }) { const j = jobs.get(name); if (j) j.stop = true; },

  // Chunked Range download into OPFS at an offset; the offset is saved only after flush().
  async download({ name, spec, chunkMiB = 8 }) {
    if (jobs.has(name)) throw new Error('already running');
    const job = { stop: false }; jobs.set(name, job);
    const fh = await (await root()).getFileHandle(name, { create: true });
    let h;
    try {
      h = await fh.createSyncAccessHandle();
      let st = await getState(name);
      if (!st || st.size !== spec.size) { st = { offset: 0, size: spec.size, etag: {}, startedAt: Date.now(), done: false }; h.truncate(0); }
      if (st.offset > h.getSize()) st.offset = 0; // file shorter than the saved offset: start again
      ev('dl', { name, kind: 'start', offset: st.offset, size: spec.size });
      let failing = false, wait = 1000;
      while (st.offset < spec.size && !job.stop) {
        const src = locate(spec, st.offset);
        const n = Math.min(chunkMiB * MiB, src.left);
        const headers = { Range: `bytes=${src.pos}-${src.pos + n - 1}` };
        const tag = st.etag[src.key];
        if (tag && !tag.startsWith('W/')) headers['If-Range'] = tag;
        try {
          const r = await fetch(src.url, { headers, cache: 'no-store' });
          if (r.status !== 206) throw new Error(`expected 206, got ${r.status} (${r.headers.get('content-length')} bytes)`);
          const buf = await r.arrayBuffer();
          if (buf.byteLength !== n) throw new Error(`short body: ${buf.byteLength} of ${n}`);
          if (!tag) { st.etag[src.key] = r.headers.get('etag') || ''; ev('dl', { name, kind: 'etag', key: src.key, etag: st.etag[src.key], contentRange: r.headers.get('content-range') }); }
          const w = h.write(buf, { at: st.offset });
          if (w !== n) throw new Error(`short write: ${w} of ${n}`);
          h.flush();
          st.offset += n;
          await putState(name, st);
          if (failing) { failing = false; wait = 1000; ev('dl', { name, kind: 'recovered', offset: st.offset }); }
          ev('dl', { name, kind: 'chunk', offset: st.offset, size: spec.size, n, t: Date.now() });
        } catch (e) {
          if (e?.name === 'QuotaExceededError') throw e;
          if (!failing) { failing = true; ev('dl', { name, kind: 'failing', offset: st.offset, error: errText(e) }); }
          await sleep(wait); wait = Math.min(wait * 2, 15000);
        }
      }
      if (st.offset >= spec.size) { st.done = true; st.finishedAt = Date.now(); await putState(name, st); }
      return { offset: st.offset, size: spec.size, done: st.done, stopped: job.stop };
    } finally { try { h?.close(); } catch {} jobs.delete(name); }
  },

  // Compare an OPFS file (by name) or a picked File with the spec, piece by piece. Reads through slice(), never the whole file.
  async verify({ name, file, spec }) {
    const f = file || await (await (await root()).getFileHandle(name)).getFile();
    const res = { size: f.size, expectedSize: spec.size, pieces: spec.loop.count + 1, bad: [], ms: 0 };
    const t0 = performance.now();
    if (f.size !== spec.size) res.sizeMismatch = true;
    const check = async (i, start, size, want) => {
      if (start + size > f.size) { res.bad.push(i); return; }
      if (await sha256(await f.slice(start, start + size).arrayBuffer()) !== want) res.bad.push(i);
    };
    if (spec.head.size) await check(0, 0, spec.head.size, spec.head.sha256);
    for (let i = 0; i < spec.loop.count; i++) {
      await check(i + 1, spec.head.size + i * spec.loop.size, spec.loop.size, spec.loop.sha256);
      if (i % 5 === 0) ev('progress', { label: 'verify', done: i + 1, total: spec.loop.count });
      if (res.bad.length > 20) break;
    }
    res.ms = Math.round(performance.now() - t0);
    res.identical = !res.sizeMismatch && res.bad.length === 0;
    return res;
  },

  // Copy a picked File into OPFS in chunks (the "pending upload" copy).
  async importFile({ file, name }) {
    const fh = await (await root()).getFileHandle(name, { create: true });
    const h = await fh.createSyncAccessHandle(); const t0 = performance.now();
    try {
      h.truncate(0); let at = 0;
      const reader = file.stream().getReader();
      for (;;) {
        const { done, value } = await reader.read(); if (done) break;
        const w = h.write(value, { at }); if (w !== value.byteLength) throw new Error(`short write at ${at}`);
        at += w;
        ev('progress', { label: 'copy in', done: at, total: file.size, bytes: true });
      }
      h.flush();
      return { size: at, ms: Math.round(performance.now() - t0) };
    } finally { h.close(); }
  },

  // Write a PDF of `pages` pages, each with its own copy of one JPEG and a line of searchable text.
  async makePdf({ name, pages, jpgUrl, jpgW, jpgH }) {
    const jpg = new Uint8Array(await (await fetch(jpgUrl)).arrayBuffer());
    const fh = await (await root()).getFileHandle(name, { create: true });
    const h = await fh.createSyncAccessHandle(); const enc = new TextEncoder();
    try {
      h.truncate(0); let at = 0; const offsets = [0];
      const put = (x) => { const b = typeof x === 'string' ? enc.encode(x) : x; at += h.write(b, { at }); };
      const obj = (id, body) => { offsets[id] = at; put(`${id} 0 obj\n${body}\nendobj\n`); };
      put('%PDF-1.4\n');
      obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
      obj(2, `<< /Type /Pages /Count ${pages} /Kids [${Array.from({ length: pages }, (_, i) => `${4 + 3 * i} 0 R`).join(' ')}] >>`);
      obj(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
      for (let i = 0; i < pages; i++) {
        const p = 4 + 3 * i;
        obj(p, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> /XObject << /Im0 ${p + 2} 0 R >> >> /Contents ${p + 1} 0 R >>`);
        const c = `q 800 0 0 450 21 60 cm /Im0 Do Q BT /F1 22 Tf 21 555 Td (Chronos test PDF, page ${i + 1} of ${pages}) Tj ET BT /F1 14 Tf 21 528 Td (keyword zebra-${i + 1}) Tj ET`;
        obj(p + 1, `<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
        offsets[p + 2] = at;
        put(`${p + 2} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${jpgW} /Height ${jpgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.byteLength} >>\nstream\n`);
        put(jpg); put('\nendstream\nendobj\n');
        if (i % 10 === 0) ev('progress', { label: 'make PDF', done: i + 1, total: pages });
      }
      const xref = at, count = offsets.length;
      put(`xref\n0 ${count}\n0000000000 65535 f \n`);
      for (let id = 1; id < count; id++) put(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`);
      put(`trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
      h.flush();
      return { size: at, pages };
    } finally { h.close(); }
  },

  // Fill storage with filler files of 1 GiB until the cap or QuotaExceededError.
  async fill({ capGiB }) {
    const name = 'filler'; if (jobs.has(name)) throw new Error('already running');
    const job = { stop: false }; jobs.set(name, job);
    const chunk = new Uint8Array(16 * MiB); for (let i = 0; i < chunk.length; i += 65536) crypto.getRandomValues(chunk.subarray(i, i + 65536));
    const dir = await root(); let written = 0, error = null, h;
    try {
      for (let g = 0; g < capGiB && !job.stop && !error; g++) {
        h = await (await dir.getFileHandle(`filler-${Date.now()}-${g}.bin`, { create: true })).createSyncAccessHandle();
        for (let at = 0; at < 1024 * MiB && !job.stop; at += chunk.length) {
          try {
            const w = h.write(chunk, { at });
            if (w !== chunk.length) { error = `short write: ${w} of ${chunk.length}`; break; }
            written += w;
          } catch (e) { error = errText(e); break; }
        }
        try { h.flush(); } catch (e) { error ??= errText(e); }
        h.close(); h = null;
        const est = await navigator.storage.estimate().catch(() => ({}));
        ev('fill', { written, usage: est.usage, quota: est.quota, error });
      }
    } finally { try { h?.close(); } catch {} jobs.delete(name); }
    return { written, error, stopped: job.stop };
  },

  async clearFill() {
    const dir = await root(); let n = 0;
    for await (const [name] of dir.entries()) if (name.startsWith('filler-')) { await dir.removeEntry(name); n++; }
    return n;
  },
};

onmessage = async ({ data }) => {
  const { id, op, ...args } = data;
  try { postMessage({ id, ok: true, result: await ops[op](args) }); }
  catch (e) { postMessage({ id, ok: false, error: errText(e) }); }
};
