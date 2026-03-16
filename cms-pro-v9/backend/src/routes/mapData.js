const { Router } = require('express');
const db = require('../db');
const router = Router();

// GET /api/map-data
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT municipality, value FROM map_data').all();
  const data = {};
  for (const row of rows) data[row.municipality] = row.value;
  res.json(data);
});

// PUT /api/map-data — bulk update
router.put('/', (req, res) => {
  const updates = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ error: 'Oczekiwano obiektu {gmina: wartość}' });
  }
  const upsert = db.prepare(
    'INSERT INTO map_data (municipality, value) VALUES (?, ?) ON CONFLICT(municipality) DO UPDATE SET value = excluded.value'
  );
  db.transaction(() => {
    for (const [municipality, value] of Object.entries(updates)) {
      upsert.run(municipality, Number(value) || 0);
    }
  })();
  res.json({ ok: true });
});

// POST /api/map-data/import-csv
router.post('/import-csv', (req, res) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'Pole csv jest wymagane' });

  const lines = csv.trim().split('\n').filter(Boolean);
  const upsert = db.prepare(
    'INSERT INTO map_data (municipality, value) VALUES (?, ?) ON CONFLICT(municipality) DO UPDATE SET value = excluded.value'
  );

  let imported = 0;
  db.transaction(() => {
    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map(s => s.trim());
      if (parts.length >= 2) {
        const key = parts[0].toLowerCase().replace(/\s+/g, '');
        const value = parseFloat(parts[1]) || 0;
        upsert.run(key, value);
        imported++;
      }
    }
  })();

  res.json({ ok: true, imported });
});

module.exports = router;
