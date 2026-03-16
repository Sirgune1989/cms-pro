const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM stat_cards ORDER BY position ASC').all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { title, value, unit, change, icon, gradient } = req.body;
  if (!title) return res.status(400).json({ error: 'Pole title jest wymagane' });

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM stat_cards').get().m;
  const result = db.prepare(
    'INSERT INTO stat_cards (title, value, unit, change, icon, gradient, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(title, value || 0, unit || 'szt.', change || 0, icon || '📊', gradient || 'blue', maxPos + 1);

  const item = db.prepare('SELECT * FROM stat_cards WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, value, unit, change, icon, gradient } = req.body;
  db.prepare(`
    UPDATE stat_cards SET
      title = COALESCE(?, title), value = COALESCE(?, value), unit = COALESCE(?, unit),
      change = COALESCE(?, change), icon = COALESCE(?, icon), gradient = COALESCE(?, gradient)
    WHERE id = ?
  `).run(
    title !== undefined ? title : null,
    value !== undefined ? value : null,
    unit !== undefined ? unit : null,
    change !== undefined ? change : null,
    icon !== undefined ? icon : null,
    gradient !== undefined ? gradient : null,
    id
  );
  const item = db.prepare('SELECT * FROM stat_cards WHERE id = ?').get(id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json(item);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM stat_cards WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

module.exports = router;
