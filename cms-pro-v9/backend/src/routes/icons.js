const { Router } = require('express');
const db = require('../db');
const router = Router();

router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM icons ORDER BY id ASC').all();
  res.json(items);
});

router.post('/', (req, res) => {
  const { name, svg, category } = req.body;
  if (!name || !svg) return res.status(400).json({ error: 'Pola name i svg są wymagane' });

  const result = db.prepare('INSERT INTO icons (name, svg, category) VALUES (?, ?, ?)').run(
    name, svg, category || 'custom'
  );
  const item = db.prepare('SELECT * FROM icons WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM icons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Nie znaleziono' });
  res.json({ ok: true });
});

module.exports = router;
