const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM ticker ORDER BY position ASC').all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { text, active } = req.body;
  if (!text) return res.status(400).json({ error: 'Pole text jest wymagane' });

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM ticker').get().m;
  const result = db.prepare('INSERT INTO ticker (text, active, position) VALUES (?, ?, ?)').run(
    text, active !== undefined ? (active ? 1 : 0) : 1, maxPos + 1
  );
  const item = db.prepare('SELECT * FROM ticker WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Oczekiwano tablicy ids' });
  const update = db.prepare('UPDATE ticker SET position = ? WHERE id = ?');
  db.transaction(() => { ids.forEach((id, i) => update.run(i, id)); })();
  res.json({ ok: true });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { text, active } = req.body;
  db.prepare('UPDATE ticker SET text = COALESCE(?, text), active = COALESCE(?, active) WHERE id = ?').run(
    text !== undefined ? text : null,
    active !== undefined ? (active ? 1 : 0) : null,
    id
  );
  const item = db.prepare('SELECT * FROM ticker WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM ticker WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

module.exports = router;
