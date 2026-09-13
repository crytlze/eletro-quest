import { COURSES, getMem, persist, validUsername, json, readJson, cors } from './_store.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.end('');
  if (req.method !== 'POST') return json(res, 405, { ok: false });
  const d = await readJson(req);
  if (!d) return json(res, 400, { ok: false });
  const username = String(d.username || '').trim();
  const course = String(d.course || '');
  const level = Number(d.level);
  const stars = Number(d.stars);
  const valid = validUsername(username) && COURSES.has(course) && Number.isInteger(level) && level >= 1 && level <= 30 && (stars === 1 || stars === 2 || stars === 3);
  if (!valid) return json(res, 400, { ok: false });
  const m = getMem();
  const key = username + '\t' + course + '\t' + level;
  const prev = m.scores.get(key);
  if (prev === undefined || stars > prev.stars) m.scores.set(key, { username, course, level, stars, at: Date.now() });
  if (m.scores.size > 2000) { const first = m.scores.keys().next(); if (!first.done) m.scores.delete(first.value); }
  persist();
  return json(res, 200, { ok: true });
}
