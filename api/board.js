import { board, cors, json } from './_store.js';

export default function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'GET') return json(res, 405, { ok: false });
  return json(res, 200, { board: board(), at: Date.now() });
}
