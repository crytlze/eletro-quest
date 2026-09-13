import { getMem, persist, cleanStr, json, readJson, cors } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false });
  const m = getMem();
  const key = m.tokens.get(String(d.token || ''));
  const u = key ? m.users.get(key) : undefined;
  if (!u) return json(res, 401, { ok: false, err: 'Daftar/masuk dulu ya.' });
  const text = cleanStr(d.text, 300).trim();
  const rating = Number(d.rating);
  const valid = text !== '' && Number.isInteger(rating) && rating >= 1 && rating <= 5;
  if (!valid) return json(res, 400, { ok: false });
  m.reviews.unshift({ username: u.username, fullname: u.fullname, rating, text, at: Date.now() });
  if (m.reviews.length > 500) m.reviews.length = 500;
  persist();
  return json(res, 200, { ok: true });
}
