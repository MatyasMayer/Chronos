// Generates the PWA icons and a sample PDF into public/ (no image tooling needed).
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

// Indigo square with a white ring: a stand-in "C" for Chronos.
function icon(size) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const c = size / 2, outer = size * 0.3, inner = size * 0.2;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      const ring = d < outer && d > inner && !(x > c && Math.abs(y - c) < size * 0.09);
      const [r, g, b] = ring ? [255, 255, 255] : [79, 70, 229];
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  writeFileSync(`public/${name}`, icon(size));
}

// Minimal one-page PDF with correct xref offsets.
const text = "Chronos smoke test - sample lecture PDF";
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  null,
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
];
const stream = `BT /F1 20 Tf 60 760 Td (${text}) Tj ET`;
objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
let pdf = "%PDF-1.4\n";
const offsets = objects.map((body, i) => {
  const at = pdf.length;
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  return at;
});
const xref = pdf.length;
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync("public/sample.pdf", pdf);
console.log("assets written");
