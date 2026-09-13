// Lihat isi database Blob (private) dari terminal.
// Pakai: npm run data
// Baca token dari .env.local (dibuat otomatis oleh `vercel blob create-store`).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const PATH = 'electroquest/data.json';

function loadToken() {
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = fs.readFileSync(path.join(ROOT, f), 'utf8');
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*BLOB_READ_WRITE_TOKEN\s*=\s*"?([^"\r\n]+)"?\s*$/);
        if (m) return m[1].trim();
      }
    } catch { /* lanjut */ }
  }
  return process.env.BLOB_READ_WRITE_TOKEN || '';
}

async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const all = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
  let off = 0;
  for (const c of chunks) { all.set(c, off); off += c.length; }
  return new TextDecoder().decode(all);
}

const mode = process.argv[2] || 'semua'; // semua | user | skor | review | json
const tok = loadToken();
if (!tok) {
  console.error('Token Blob tidak ketemu. Jalankan `npx vercel env pull .env.local` dulu.');
  process.exit(1);
}
const { get, head } = await import('@vercel/blob');
try { await head(PATH, { token: tok }); }
catch { console.log('Belum ada data (file electroquest/data.json belum dibuat). Daftar 1 user dulu.'); process.exit(0); }

const r = await get(PATH, { access: 'private', useCache: false, token: tok });
const raw = JSON.parse(await streamToText(r.stream));
const users = Object.values(raw.users || {});
const scores = Object.values(raw.scores || {});
const reviews = raw.reviews || [];

if (mode === 'json') { console.log(JSON.stringify(raw, null, 2)); process.exit(0); }

// agregat papan
const per = new Map();
for (const s of scores) {
  const cur = per.get(s.username) || { username: s.username, stars: 0, levels: 0 };
  cur.stars += s.stars; cur.levels += 1;
  per.set(s.username, cur);
}
const board = [...per.values()].sort((a, b) => b.stars - a.stars || a.username.localeCompare(b.username));

if (mode === 'semua' || mode === 'user') {
  console.log(`\n=== USER (${users.length}) ===`);
  console.table(users.map((u) => ({ username: u.username, nama: u.fullname, email: u.email })));
}
if (mode === 'semua' || mode === 'skor') {
  console.log(`\n=== PAPAN (${board.length} pemain, ${scores.length} entri skor) ===`);
  console.table(board.map((b, i) => ({ rank: i + 1, username: b.username, stars: b.stars, levels: b.levels })));
}
if (mode === 'semua' || mode === 'review') {
  console.log(`\n=== REVIEW (${reviews.length}) ===`);
  console.table(reviews.slice(0, 20).map((v) => ({
    user: v.username, rating: v.rating,
    teks: String(v.text || '').slice(0, 60),
    waktu: new Date(v.at).toLocaleString('id-ID'),
  })));
}
console.log('\nTips: npm run data user | skor | review | json');
