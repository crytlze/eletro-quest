import { getMem, hashPass, sameHash, newToken, persist, json, readJson, cors } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false });
  const key = String(d.username || '').trim().toLowerCase();
  const m = getMem();
  const user = m.users.get(key);
  if (!user) return json(res, 401, { ok: false, err: 'Username belum terdaftar.' });
  if (!sameHash(hashPass(String(d.pass || ''), user.salt), user.hash)) return json(res, 401, { ok: false, err: 'Password salah.' });
  const token = newToken();
  m.tokens.set(token, key);
  persist();
  return json(res, 200, { ok: true, token, username: user.username, fullname: user.fullname, email: user.email });
}
