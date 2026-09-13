// Shared store untuk Vercel Functions — persisten via Vercel Blob (private store).
// Pola: load (get by URL/pathname) -> mutasi -> save (put overwrite).
// Token dari env BLOB_READ_WRITE_TOKEN (otomatis ter-link ke project).

import crypto from 'node:crypto';
import { put, get, head } from '@vercel/blob';

const COURSES = new Set(['tde', 'alj', 'stat', 'rl', 'elka', 'digi', 'prog', 'atom', 'listrik', 'aljP1', 'aljP2', 'aljP3', 'aljP4', 'aljP5', 'aljP7']);
const PATH = 'electroquest/data.json';

// ---- blob io ----

function token() { return process.env.BLOB_READ_WRITE_TOKEN || ''; }

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

async function blobLoad() {
  try {
    const t = token();
    if (!t) return null;
    try { await head(PATH, { token: t }); } catch { return null; } // belum ada file
    const r = await get(PATH, { access: 'private', useCache: false, token: t });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    const txt = await streamToText(r.stream);
    const j = JSON.parse(txt);
    if (!j || typeof j !== 'object') return null;
    return j;
  } catch {
    return null;
  }
}

async function blobSave(obj) {
  const t = token();
  if (!t) return;
  await put(PATH, JSON.stringify(obj), { access: 'private', addRandomSuffix: false, allowOverwrite: true, token: t, contentType: 'application/json' });
}

function toMem(raw) {
  if (!raw || typeof raw !== 'object') return { scores: new Map(), reviews: [], users: new Map(), tokens: new Map() };
  return {
    scores: new Map(Object.entries(raw.scores || {})),
    reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
    users: new Map(Object.entries(raw.users || {})),
    tokens: new Map(Object.entries(raw.tokens || {})),
  };
}

function fromMem(m) {
  return { scores: Object.fromEntries(m.scores), reviews: m.reviews, users: Object.fromEntries(m.users), tokens: Object.fromEntries(m.tokens) };
}

/** Jalankan fn dengan state terbaru (load dulu biar tidak overwrite antar instance). */
async function withStore(fn) {
  const m = toMem(await blobLoad());
  const out = await fn(m);
  await blobSave(fromMem(m));
  return out;
}

/** Baca agregat papan tanpa nulis. */
async function readBoard() {
  const m = toMem(await blobLoad());
  return boardOf(m);
}

/** Baca daftar review tanpa nulis. */
async function readReviews() {
  const m = toMem(await blobLoad());
  const n = m.reviews.length;
  const avg = n === 0 ? '-' : (m.reviews.reduce((a, v) => a + v.rating, 0) / n).toFixed(1);
  return { reviews: m.reviews.slice(0, 100), count: n, avg };
}

function boardOf(m) {
  const per = new Map();
  for (const s of m.scores.values()) {
    const cur = per.get(s.username) || { name: s.username, fullname: '', stars: 0, levels: 0, at: 0 };
    const uk = m.users.get(s.username.toLowerCase());
    if (uk) cur.fullname = uk.fullname;
    cur.stars += s.stars;
    cur.levels += 1;
    cur.at = Math.max(cur.at, s.at);
    per.set(s.username, cur);
  }
  return [...per.values()].sort((a, b) => b.stars - a.stars || a.name.localeCompare(b.name)).slice(0, 100);
}

// ---- validasi & util ----

function cleanStr(v, max) {
  const s = String(v || '');
  let out = '';
  for (const ch of s) {
    const c = ch.codePointAt(0) || 0;
    if (c >= 32 && c !== 127) out += ch;
  }
  return out.trim().slice(0, max);
}
function validUsername(v) { return /^[a-zA-Z0-9._-]{3,16}$/.test(String(v || '')); }
function validEmail(v) { return /^\S+@\S+\.\S+$/.test(String(v || '')) && String(v).length <= 64; }
function newToken() { return crypto.randomBytes(24).toString('hex'); }
function hashPass(pass, salt) { return crypto.scryptSync(pass, salt, 32).toString('hex'); }
function sameHash(a, b) {
  try { return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch { return false; }
}

// ---- http helpers ----

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
function json(res, code, obj) {
  cors(res);
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
async function readJson(req) {
  let s = '';
  for await (const c of req) { s += c; if (s.length > 8192) break; }
  try { return JSON.parse(s || '{}'); } catch { return null; }
}

export { COURSES, withStore, readBoard, readReviews, boardOf, cleanStr, validUsername, validEmail, newToken, hashPass, sameHash, cors, json, readJson };
