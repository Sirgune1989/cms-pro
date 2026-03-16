const { Router } = require('express');
const db = require('../db');
const router = Router();

// GET /api/screen/:room — assemble full JSON payload for TV screen
router.get('/:room', (req, res) => {
  // Build config object
  const configRows = db.prepare('SELECT key, value FROM config').all();
  const config = {};
  for (const row of configRows) config[row.key] = row.value;

  // Get slides
  const slides = db.prepare('SELECT * FROM slides WHERE active = 1 ORDER BY position ASC').all()
    .map(s => ({
      id: s.id,
      type: s.type,
      title: s.title,
      active: !!s.active,
      duration: s.duration,
      tts_text: s.tts_text,
      ...JSON.parse(s.settings || '{}')
    }));

  // Get ticker messages
  const ticker = db.prepare('SELECT text FROM ticker WHERE active = 1 ORDER BY position ASC').all()
    .map(t => t.text);

  // Get rooms
  const rooms = db.prepare('SELECT number, name, floor FROM rooms ORDER BY position ASC').all();

  // Get stat cards
  const statCards = db.prepare('SELECT * FROM stat_cards ORDER BY position ASC').all();

  // Get map data
  const mapRows = db.prepare('SELECT municipality, value FROM map_data').all();
  const mapData = {};
  for (const row of mapRows) mapData[row.municipality] = row.value;

  res.json({
    config: {
      theme: config.theme || 'light',
      accent: config.accent || '#00A651',
      tvFont: config.tvFont || 'system',
      slideTime: parseInt(config.slideTime) || 10,
      sidebarWidth: parseInt(config.sidebarWidth) || 380,
      tts: config.tts === 'true',
      fsTitleSlide: parseFloat(config.fsTitleSlide) || 3.1,
      fsBodySlide: parseFloat(config.fsBodySlide) || 2,
      fsTicker: parseFloat(config.fsTicker) || 1.05,
      fsClock: parseFloat(config.fsClock) || 2.1,
      headerH: parseInt(config.headerH) || 60,
      tickerH: parseInt(config.tickerH) || 74,
      stagePad: parseInt(config.stagePad) || 14,
      slideRadius: parseInt(config.slideRadius) || 20,
      wxIconSize: parseInt(config.wxIconSize) || 36,
      wxTempSize: parseFloat(config.wxTempSize) || 1.2
    },
    slides,
    ticker,
    rooms,
    statCards,
    mapData,
    mapUnit: config.mapUnit || 'os. bezrobotnych',
    contact: {
      phone: config.orgPhone || '',
      email: config.orgEmail || '',
      www: config.orgWww || '',
      hours: config.orgHours || ''
    },
    org: {
      name: config.orgName || '',
      sub: config.orgSub || ''
    },
    weather: {
      city: config.wxCity || 'Sztum',
      lat: parseFloat(config.wxLat) || 53.9167,
      lon: parseFloat(config.wxLon) || 19.05
    },
    logoUrl: config.logoMediaId
      ? `/api/uploads/${db.prepare('SELECT filename FROM media WHERE id = ?').get(config.logoMediaId)?.filename || ''}`
      : ''
  });
});

module.exports = router;
