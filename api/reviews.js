import { getMem, cors, json } from './_store.js';

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'GET') return json(res, 405, { ok: false });
  const m = getMem();
  const n = m.reviews.length;
  const avg = n === 0 ? '-' : (m.reviews.reduce((a, v) => a + v.rating, 0) / n).toFixed(1);
  return json(res, 200, { reviews: m.reviews.slice(0, 100), count: n, avg });
}
