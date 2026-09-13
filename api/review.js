import { withStore, cleanStr, json, readJson, cors } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false });
  try {
    const out = await withStore((m) => {
      const key = m.tokens.get(String(d.token || ''));
      const u = key ? m.users.get(key) : undefined;
      if (!u) return { err: 'Daftar/masuk dulu ya.', code: 401 };
      const text = cleanStr(d.text, 300).trim();
      const rating = Number(d.rating);
      const valid = text !== '' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
      if (!valid) return { err: 'Bad review.', code: 400 };
      m.reviews.unshift({ username: u.username, fullname: u.fullname, rating, text, at: Date.now() });
      if (m.reviews.length > 500) m.reviews.length = 500;
      return { ok: true };
    });
    if ('err' in out) return json(res, out.code, { ok: false, err: out.err });
    return json(res, 200, out);
  } catch {
    return json(res, 500, { ok: false });
  }
}
