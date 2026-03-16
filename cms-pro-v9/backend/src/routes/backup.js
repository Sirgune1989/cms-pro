const { Router } = require('express');
const db = require('../db');
const router = Router();

// GET /api/backup — export everything
router.get('/', (req, res) => {
  const configRows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  for (const row of configRows) config[row.key] = row.value;

  const backup = {
    version: '9.0.0',
    timestamp: new Date().toISOString(),
    config,
    slides: db.prepare('SELECT * FROM slides ORDER BY position ASC').all()
      .map(s => ({ ...s, settings: JSON.parse(s.settings || '{}') })),
    statCards: db.prepare('SELECT * FROM stat_cards ORDER BY position ASC').all(),
    ticker: db.prepare('SELECT * FROM ticker ORDER BY position ASC').all(),
    rooms: db.prepare('SELECT * FROM rooms ORDER BY position ASC').all(),
    mapData: (() => {
      const rows = db.prepare('SELECT municipality, value FROM map_data').all();
      const data = {};
      for (const row of rows) data[row.municipality] = row.value;
      return data;
    })(),
    icons: db.prepare('SELECT * FROM icons').all()
  };

  res.json(backup);
});

// POST /api/backup — import (replaces all data)
router.post('/', (req, res) => {
  const data = req.body;
  if (!data || !data.config) {
    return res.status(400).json({ error: 'Nieprawidłowy format backup' });
  }

  db.transaction(() => {
    // Clear all tables
    db.prepare('DELETE FROM config').run();
    db.prepare('DELETE FROM slides').run();
    db.prepare('DELETE FROM stat_cards').run();
    db.prepare('DELETE FROM ticker').run();
    db.prepare('DELETE FROM rooms').run();
    db.prepare('DELETE FROM map_data').run();
    db.prepare('DELETE FROM icons').run();

    // Import config
    const insertConfig = db.prepare('INSERT INTO config (key, value) VALUES (?, ?)');
    for (const [key, value] of Object.entries(data.config)) {
      insertConfig.run(key, String(value));
    }

    // Import slides
    if (data.slides) {
      const insertSlide = db.prepare(
        'INSERT INTO slides (type, title, active, position, duration, tts_text, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      data.slides.forEach((s, i) => {
        const { type, title, active, duration, tts_text, settings, ...rest } = s;
        insertSlide.run(
          type || 'text', title || '', active !== undefined ? (active ? 1 : 0) : 1,
          i, duration || 0, tts_text || '',
          JSON.stringify(settings || rest || {})
        );
      });
    }

    // Import stat cards
    if (data.statCards) {
      const insertCard = db.prepare(
        'INSERT INTO stat_cards (title, value, unit, change, icon, gradient, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      data.statCards.forEach((c, i) => {
        insertCard.run(c.title, c.value || 0, c.unit || 'szt.', c.change || 0, c.icon || '📊', c.gradient || 'blue', i);
      });
    }

    // Import ticker
    if (data.ticker) {
      const insertTicker = db.prepare('INSERT INTO ticker (text, active, position) VALUES (?, ?, ?)');
      data.ticker.forEach((t, i) => {
        if (typeof t === 'string') {
          insertTicker.run(t, 1, i);
        } else {
          insertTicker.run(t.text, t.active !== undefined ? (t.active ? 1 : 0) : 1, i);
        }
      });
    }

    // Import rooms
    if (data.rooms) {
      const insertRoom = db.prepare('INSERT INTO rooms (number, name, floor, position) VALUES (?, ?, ?, ?)');
      data.rooms.forEach((r, i) => {
        insertRoom.run(r.number || '', r.name || '', r.floor || '', i);
      });
    }

    // Import map data
    if (data.mapData) {
      const insertMap = db.prepare('INSERT INTO map_data (municipality, value) VALUES (?, ?)');
      for (const [key, value] of Object.entries(data.mapData)) {
        insertMap.run(key, Number(value) || 0);
      }
    }

    // Import icons
    if (data.icons) {
      const insertIcon = db.prepare('INSERT INTO icons (name, svg, category) VALUES (?, ?, ?)');
      data.icons.forEach(ic => {
        insertIcon.run(ic.name, ic.svg, ic.category || 'custom');
      });
    }
  })();

  res.json({ ok: true, message: 'Dane zaimportowane' });
});

module.exports = router;
