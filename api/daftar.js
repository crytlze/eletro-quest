import { getMem, persist, cleanStr, validUsername, validEmail, newToken, hashPass, json, readJson, cors } from './_store.js';

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
  const m = getMem();
  const key = username.toLowerCase();
  if (m.users.has(key)) return json(res, 409, { ok: false, err: 'Username sudah dipakai, pilih yang lain.' });
  const salt = (await import('node:crypto')).randomBytes(16).toString('hex');
  // cek email unik (opsional tapi bagus)
  for (const u of m.users.values()) if (u.email.toLowerCase() === email) return json(res, 409, { ok: false, err: 'Email sudah terdaftar.' });
  m.users.set(key, { username, fullname, email, salt, hash: hashPass(pass, salt) });
  const token = newToken();
  m.tokens.set(token, key);
  persist();
  return json(res, 200, { ok: true, token, username, fullname, email });
}
