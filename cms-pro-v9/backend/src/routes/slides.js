const { Router } = require('express');
const db = require('../db');
const router = Router();

// GET /api/slides
router.get('/', (req, res) => {
  const slides = db.prepare('SELECT * FROM slides ORDER BY position ASC').all();
  res.json(slides.map(s => ({ ...s, settings: JSON.parse(s.settings || '{}') })));
});

// POST /api/slides
router.post('/', (req, res) => {
  const { type, title, active, duration, tts_text, settings } = req.body;
  if (!type) return res.status(400).json({ error: 'Pole type jest wymagane' });

  const maxPos = db.prepare('SELECT COALESCE(MAX(position), -1) as m FROM slides').get().m;
  const result = db.prepare(
    'INSERT INTO slides (type, title, active, position, duration, tts_text, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(
    type,
    title || '',
    active !== undefined ? (active ? 1 : 0) : 1,
    maxPos + 1,
    duration || 0,
    tts_text || '',
    JSON.stringify(settings || {})
  );

  const slide = db.prepare('SELECT * FROM slides WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...slide, settings: JSON.parse(slide.settings || '{}') });
});

// PUT /api/slides/reorder
router.put('/reorder', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Oczekiwano tablicy ids' });

  const update = db.prepare('UPDATE slides SET position = ?, updated_at = datetime("now") WHERE id = ?');
  const reorder = db.transaction(() => {
    ids.forEach((id, index) => update.run(index, id));
  });
  reorder();
  res.json({ ok: true });
});

// PUT /api/slides/:id
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM slides WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Slajd nie znaleziony' });

  const { type, title, active, duration, tts_text, settings } = req.body;

  db.prepare(`
    UPDATE slides SET
      type = COALESCE(?, type),
      title = COALESCE(?, title),
      active = COALESCE(?, active),
      duration = COALESCE(?, duration),
      tts_text = COALESCE(?, tts_text),
      settings = COALESCE(?, settings),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    type || null,
    title !== undefined ? title : null,
    active !== undefined ? (active ? 1 : 0) : null,
    duration !== undefined ? duration : null,
    tts_text !== undefined ? tts_text : null,
    settings !== undefined ? JSON.stringify(settings) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM slides WHERE id = ?').get(id);
  res.json({ ...updated, settings: JSON.parse(updated.settings || '{}') });
});

// DELETE /api/slides/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM slides WHERE id = ?').run(id);
  if (result.changes === 0) return res.status(404).json({ error: 'Slajd nie znaleziony' });
  res.json({ ok: true });
});

module.exports = router;
