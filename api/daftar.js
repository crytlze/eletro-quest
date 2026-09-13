import { withStore, cleanStr, validUsername, validEmail, newToken, hashPass, json, readJson, cors } from './_store.js';
import crypto from 'node:crypto';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false, err: 'Method not allowed' });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false, err: 'Bad JSON' });
  const username = String(d.username || '').trim();
  const fullname = cleanStr(d.fullname, 32);
  const email = String(d.email || '').trim().toLowerCase();
  const pass = String(d.pass || '');
  if (!validUsername(username) || fullname === '' || !validEmail(email) || pass.length < 4 || pass.length > 64) {
    return json(res, 400, { ok: false, err: 'Username 3-16 karakter; nama & email wajib valid; password min. 4 karakter.' });
  }
  try {
    const out = await withStore((m) => {
      const key = username.toLowerCase();
      if (m.users.has(key)) return { err: 'Username sudah dipakai, pilih yang lain.', code: 409 };
      for (const u of m.users.values()) if (u.email.toLowerCase() === email) return { err: 'Email sudah terdaftar.', code: 409 };
      const salt = crypto.randomBytes(16).toString('hex');
      m.users.set(key, { username, fullname, email, salt, hash: hashPass(pass, salt) });
      const token = newToken();
      m.tokens.set(token, key);
      return { ok: true, token, username, fullname, email };
    });
    if ('err' in out) return json(res, out.code, { ok: false, err: out.err });
    return json(res, 200, out);
  } catch {
    return json(res, 500, { ok: false, err: 'Server sibuk, coba lagi.' });
  }
}
