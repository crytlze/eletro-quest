// Server KELAS all-in-one (Node bawaan, tanpa dependensi):
//  - file statis dist/ (gamenya)
//  - POST /api/score  {name, course, level, stars}
//  - GET  /api/board  peringkat agregat (JSON)
//  - GET  /papan      halaman peringkat buat proyektor
// Jalankan: npm run kelas
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const PORT = 4173;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, '..', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const COURSES = new Set(['tde', 'alj', 'stat', 'rl', 'elka', 'digi', 'prog', 'atom', 'listrik', 'aljP1', 'aljP2', 'aljP3', 'aljP4', 'aljP5', 'aljP7']);
const scores = new Map();
const reviews = []; // { username, fullname, rating, text, at } terbaru dulu, max 500
const users = new Map(); // lower(username) -> { username, fullname, email, salt, hash }
const tokens = new Map(); // token -> lower(username)

function newToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hashPass(pass, salt) {
  return crypto.scryptSync(pass, salt, 32).toString('hex');
}

function sameHash(a, b) {
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

function cleanStr(v, max) {
  const s = String(v || '');
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0) || 0;
    if (c >= 32 && c !== 127) out += ch;
  }
  return out.trim().slice(0, max);
}

function validUsername(v) {
  return /^[a-zA-Z0-9._-]{3,16}$/.test(String(v || ''));
}

function validEmail(v) {
  return /^\S+@\S+\.\S+$/.test(String(v || '')) && String(v).length <= 64;
}

function board() {
  const per = new Map();
  for (const s of scores.values()) {
    const cur = per.get(s.username) || { name: s.username, fullname: '', stars: 0, levels: 0, at: 0 };
    const uk = users.get(s.username.toLowerCase());
    if (uk !== undefined) cur.fullname = uk.fullname;
    cur.stars += s.stars;
    cur.levels += 1;
    cur.at = Math.max(cur.at, s.at);
    per.set(s.username, cur);
  }
  return [...per.values()]
    .sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name))
    .slice(0, 100);
}

const BOARD_HTML = `<!doctype html>
<html lang="id"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Papan Peringkat — Eletro Quest</title>
<style>
body{margin:0;background:#050914;color:#e2e8f0;font-family:system-ui,sans-serif;text-align:center}
h1{color:#fcd34d;margin:18px 0 2px;font-size:34px}
.sub{color:#67e8f9;margin-bottom:14px}
table{margin:0 auto;border-collapse:collapse;min-width:min(640px,92vw)}
td,th{padding:10px 14px;border-bottom:1px solid #1e3a5f;font-size:20px}
tr.top td{background:rgba(34,211,238,.08);font-weight:bold}
.rank{font-size:24px}.stars{color:#facc15}.meta{color:#64748b;margin-top:12px}
.kl{color:#67e8f9;font-size:15px}
</style></head><body>
<h1>🏆 PAPAN PERINGKAT</h1><div class="sub">Eletro Quest • update tiap 3 detik</div>
<table><tbody id="b"></tbody></table>
<div class="meta" id="m"></div>
<div style="margin:16px"><a href="/ulasan" style="color:#67e8f9;font-size:20px">💬 Lihat saran &amp; review murid →</a></div>
<script>
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function go(){
  try{
    const r=await fetch('api/board',{cache:'no-store'});
    const j=await r.json();
    const medals=['🥇','🥈','🥉'];
    document.getElementById('b').innerHTML=j.board.map((p,i)=>
      '<tr class="'+(i<3?'top':'')+'"><td class="rank">'+(medals[i]||(i+1))+'</td><td>'+esc(p.name)+
      '<br><span class="kl">'+esc(p.fullname||'')+'</span></td><td class="stars">★ '+p.stars+'</td><td>'+p.levels+' level</td></tr>').join('')
      ||'<tr><td>Belum ada skor — murid main dulu! 🎮</td></tr>';
    document.getElementById('m').textContent=j.board.length+' murid • '+new Date(j.at).toLocaleTimeString('id-ID');
  }catch(e){/* coba lagi */}
}
go();setInterval(go,3000);
</script></body></html>`;

const ULASAN_HTML = `<!doctype html>
<html lang="id"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Saran &amp; Review — Eletro Quest</title>
<style>
body{margin:0;background:#050914;color:#e2e8f0;font-family:system-ui,sans-serif;text-align:center}
h1{color:#fcd34d;margin:18px 0 2px;font-size:32px}
.sub{color:#67e8f9;margin-bottom:14px}
.card{margin:10px auto;padding:12px 16px;max-width:min(640px,92vw);background:#0b1628;border:1px solid #1e3a5f;border-radius:12px;text-align:left}
.nm{color:#a5f3fc;font-weight:bold}.st{color:#facc15}.tm{color:#64748b;font-size:14px}
.kl{color:#67e8f9;font-size:14px;border:1px solid #1e3a5f;border-radius:8px;padding:0 8px}
.tx{margin-top:6px;font-size:18px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word}
.meta{color:#64748b;margin:12px}
a{color:#67e8f9}
</style></head><body>
<h1>💬 SARAN &amp; REVIEW</h1><div class="sub" id="s"></div>
<div id="l"></div>
<div class="meta"><a href="/papan">🏆 Kembali ke papan peringkat</a></div>
<script>
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function go(){
  try{
    const r=await fetch('api/reviews',{cache:'no-store'});
    const j=await r.json();
    document.getElementById('s').textContent=j.count+' ulasan • rata-rata '+j.avg+'★';
    document.getElementById('l').innerHTML=j.reviews.map(v=>
      '<div class="card"><span class="nm">'+esc(v.username)+'</span> <span class="kl">'+esc(v.fullname||'')+'</span> <span class="st">'+'★'.repeat(v.rating)+
      '</span> <span class="tm">'+new Date(v.at).toLocaleString('id-ID')+'</span><div class="tx">'+esc(v.text)+'</div></div>'
    ).join('')||'<p>Belum ada ulasan.</p>';
  }catch(e){/* coba lagi */}
}
go();setInterval(go,5000);
</script></body></html>`;

function send(res, code, type, body) {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let s = '';
    req.on('data', (c) => {
      s += c;
      if (s.length > 4096) req.destroy();
    });
    req.on('end', () => resolve(s));
    req.on('error', () => resolve(''));
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url || '/', 'http://x');
    if (req.method === 'GET' && u.pathname === '/api/board') {
      return send(res, 200, 'application/json', JSON.stringify({ board: board(), at: Date.now() }));
    }
    if (req.method === 'POST' && u.pathname === '/api/score') {
      const raw = await readBody(req);
      try {
        const d = JSON.parse(raw);
        const username = String(d.username || '').trim();
        const course = String(d.course || '');
        const level = Number(d.level);
        const stars = Number(d.stars);
        const valid =
          validUsername(username) && COURSES.has(course) && Number.isInteger(level) &&
          level >= 1 && level <= 30 && (stars === 1 || stars === 2 || stars === 3);
        if (!valid) return send(res, 400, 'application/json', '{"ok":false}');
        const key = username + '	' + course + '	' + level;
        const prev = scores.get(key);
        if (prev === undefined || stars > prev.stars) {
          scores.set(key, { username, course, level, stars, at: Date.now() });
        }
        if (scores.size > 2000) {
          const first = scores.keys().next();
          if (!first.done) scores.delete(first.value);
        }
        return send(res, 200, 'application/json', '{"ok":true}');
      } catch {
        return send(res, 400, 'application/json', '{"ok":false}');
      }
    }
    if (req.method === 'GET' && u.pathname === '/papan') {
      return send(res, 200, 'text/html; charset=utf-8', BOARD_HTML);
    }
    if (req.method === 'GET' && u.pathname === '/ulasan') {
      return send(res, 200, 'text/html; charset=utf-8', ULASAN_HTML);
    }
    if (req.method === 'GET' && u.pathname === '/api/reviews') {
      const n = reviews.length;
      const avg = n === 0 ? '-' : (reviews.reduce((a, v) => a + v.rating, 0) / n).toFixed(1);
      return send(res, 200, 'application/json', JSON.stringify({ reviews: reviews.slice(0, 100), count: n, avg }));
    }
    if (req.method === 'POST' && u.pathname === '/api/daftar') {
      const raw = await readBody(req);
      try {
        const d = JSON.parse(raw);
        const username = String(d.username || '').trim();
        const fullname = cleanStr(d.fullname, 32);
        const email = String(d.email || '').trim().toLowerCase();
        const pass = String(d.pass || '');
        if (!validUsername(username) || fullname === '' || !validEmail(email) || pass.length < 4 || pass.length > 64) {
          return send(res, 400, 'application/json', '{"ok":false,"err":"Username 3-16 karakter; nama & email wajib valid; password min. 4 karakter."}');
        }
        const key = username.toLowerCase();
        if (users.has(key)) {
          return send(res, 409, 'application/json', '{"ok":false,"err":"Username sudah dipakai, pilih yang lain."}');
        }
        const salt = crypto.randomBytes(16).toString('hex');
        users.set(key, { username, fullname, email, salt, hash: hashPass(pass, salt) });
        const token = newToken();
        tokens.set(token, key);
        return send(res, 200, 'application/json', JSON.stringify({ ok: true, token, username, fullname, email }));
      } catch {
        return send(res, 400, 'application/json', '{"ok":false}');
      }
    }
    if (req.method === 'POST' && u.pathname === '/api/masuk') {
      const raw = await readBody(req);
      try {
        const d = JSON.parse(raw);
        const key = String(d.username || '').trim().toLowerCase();
        const u2 = users.get(key);
        if (!u2) return send(res, 401, 'application/json', '{"ok":false,"err":"Username belum terdaftar."}');
        if (!sameHash(hashPass(String(d.pass || ''), u2.salt), u2.hash)) {
          return send(res, 401, 'application/json', '{"ok":false,"err":"Password salah."}');
        }
        const token = newToken();
        tokens.set(token, key);
        return send(res, 200, 'application/json', JSON.stringify({ ok: true, token, username: u2.username, fullname: u2.fullname, email: u2.email }));
      } catch {
        return send(res, 400, 'application/json', '{"ok":false}');
      }
    }
    if (req.method === 'POST' && u.pathname === '/api/review') {
      const raw = await readBody(req);
      try {
        const d = JSON.parse(raw);
        const key = tokens.get(String(d.token || ''));
        const u2 = key !== undefined ? users.get(key) : undefined;
        if (!u2) return send(res, 401, 'application/json', '{"ok":false,"err":"Daftar/masuk dulu ya."}');
        const text = cleanStr(d.text, 300).trim();
        const rating = Number(d.rating);
        const valid = text !== '' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
        if (!valid) return send(res, 400, 'application/json', '{"ok":false}');
        reviews.unshift({ username: u2.username, fullname: u2.fullname, rating, text, at: Date.now() });
        if (reviews.length > 500) reviews.length = 500;
        return send(res, 200, 'application/json', '{"ok":true}');
      } catch {
        return send(res, 400, 'application/json', '{"ok":false}');
      }
    }
    if (req.method !== 'GET') return send(res, 405, 'text/plain', '?');
    let p = decodeURIComponent(u.pathname);
    if (p === '/') p = '/index.html';
    const file = path.normalize(path.join(DIST, p));
    if (!file.startsWith(DIST)) return send(res, 403, 'text/plain', 'no');
    fs.readFile(file, (err, data) => {
      if (err) return send(res, 404, 'text/plain', 'tidak ketemu');
      const ext = path.extname(file).toLowerCase();
      send(res, 200, MIME[ext] || 'application/octet-stream', data);
    });
  } catch {
    try {
      send(res, 500, 'text/plain', 'err');
    } catch {
      /* abaikan */
    }
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`READY http://localhost:${PORT}/`);
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal && !String(n.address).startsWith('169.254.')) {
        console.log(`READY http://${n.address}:${PORT}/`);
      }
    }
  }
  console.log('Papan peringkat (proyektor): /papan');
});
