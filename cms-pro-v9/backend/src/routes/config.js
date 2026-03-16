const { Router } = require('express');
const db = require('../db');
const router = Router();

// GET /api/config — return all config as object
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  res.json(config);
});

// PUT /api/config — bulk update config keys
router.put('/', (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Oczekiwano obiektu {klucz: wartość}' });
  }

  const upsert = db.prepare(
    'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );

  const updateAll = db.transaction(() => {
    for (const [key, value] of Object.entries(updates)) {
      upsert.run(key, String(value));
    }
  });

  updateAll();
  res.json({ ok: true });
});

module.exports = router;
