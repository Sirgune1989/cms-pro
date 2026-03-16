const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM rooms ORDER BY position ASC').all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { number, name, floor } = req.body;
  if (!number || !name) return res.status(400).json({ error: 'Pola number i name są wymagane' });

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM rooms').get().m;
  const result = db.prepare('INSERT INTO rooms (number, name, floor, position) VALUES (?, ?, ?, ?)').run(
    number, name, floor || '', maxPos + 1
  );
  const item = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Oczekiwano tablicy ids' });
  const update = db.prepare('UPDATE rooms SET position = ? WHERE id = ?');
  db.transaction(() => { ids.forEach((id, i) => update.run(i, id)); })();
  res.json({ ok: true });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { number, name, floor } = req.body;
  db.prepare('UPDATE rooms SET number = COALESCE(?, number), name = COALESCE(?, name), floor = COALESCE(?, floor) WHERE id = ?').run(
    number !== undefined ? number : null,
    name !== undefined ? name : null,
    floor !== undefined ? floor : null,
    id
  );
  const item = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

module.exports = router;
