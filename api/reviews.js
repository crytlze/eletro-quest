import { readReviews, cors, json } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'GET') return json(res, 405, { ok: false });
  try {
    return json(res, 200, await readReviews());
  } catch {
    return json(res, 500, { ok: false });
  }
}
