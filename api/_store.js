// Shared store untuk Vercel Functions (Node, tanpa deps).
// Di Vercel, filesystem hanya writable di /tmp. Kita coba /tmp dulu, fallback ke ./data.
// Untuk persistensi beneran di produksi, ganti ke DB (Vercel KV / Postgres / Supabase).
// File ini dipakai semua endpoint api/*.js

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

const COURSES = new Set(['tde', 'alj', 'stat', 'rl', 'elka', 'digi', 'prog', 'atom', 'listrik', 'aljP1', 'aljP2', 'aljP3', 'aljP4', 'aljP5', 'aljP7']);

function dataPath() {
  // Vercel: /tmp writable. Lokal: ./api / ./data
  try {
    fs.accessSync('/tmp', fs.constants.W_OK);
    return path.join('/tmp', 'electroquest-data.json');
  } catch {
    return path.join(process.cwd(), 'data', 'electroquest-data.json');
  }
}

function loadRaw() {
  const p = dataPath();
  try {
    const s = fs.readFileSync(p, 'utf8');
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function saveRaw(obj) {
  const p = dataPath();
  try {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj), 'utf8');
  } catch {
    // Vercel read-only di sebagian path = abaikan, tetap pakai memory untuk request ini
  }
}

// In-memory cache (hot lambda reuse). Load sekali per cold start.
let mem = null;
function getMem() {
  if (mem) return mem;
  const raw = loadRaw();
  if (raw && typeof raw === 'object') {
    mem = {
      scores: new Map(Object.entries(raw.scores || {})),
      reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
      users: new Map(Object.entries(raw.users || {})),
      tokens: new Map(Object.entries(raw.tokens || {})),
    };
  } else {
    mem = { scores: new Map(), reviews: [], users: new Map(), tokens: new Map() };
  }
  return mem;
}

function persist() {
  const m = getMem();
  saveRaw({
    scores: Object.fromEntries(m.scores),
    reviews: m.reviews,
    users: Object.fromEntries(m.users),
    tokens: Object.fromEntries(m.tokens),
  });
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
function validUsername(v) { return /^[a-zA-Z0-9._-]{3,16}$/.test(String(v || '')); }
function validEmail(v) { return /^\S+@\S+\.\S+$/.test(String(v || '')) && String(v).length <= 64; }
function newToken() { return crypto.randomBytes(24).toString('hex'); }
function hashPass(pass, salt) { return crypto.scryptSync(pass, salt, 32).toString('hex'); }
function sameHash(a, b) {
  try { return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex')); } catch { return false; }
}
function board() {
  const m = getMem();
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

export { COURSES, getMem, persist, cleanStr, validUsername, validEmail, newToken, hashPass, sameHash, board, cors, json, readJson };
