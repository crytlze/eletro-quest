import { withStore, hashPass, sameHash, newToken, json, readJson, cors } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false });
  const username = String(d.username || '').trim();
  try {
    const out = await withStore((m) => {
      const key = username.toLowerCase();
      const user = m.users.get(key);
      if (!user) return { err: 'Username belum terdaftar.', code: 401 };
      if (!sameHash(hashPass(String(d.pass || ''), user.salt), user.hash)) return { err: 'Password salah.', code: 401 };
      const token = newToken();
      m.tokens.set(token, key);
      return { ok: true, token, username: user.username, fullname: user.fullname, email: user.email };
    });
    if ('err' in out) return json(res, out.code, { ok: false, err: out.err });
    return json(res, 200, out);
  } catch {
    return json(res, 500, { ok: false, err: 'Server sibuk, coba lagi.' });
  }
}
