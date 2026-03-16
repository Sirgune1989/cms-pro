#!/usr/bin/env node
/**
 * Migration script: v8.1 JSON backup → CMS Pro v9 SQLite
 *
 * Usage: node src/utils/migrate-v81.js path/to/backup.json
 *
 * Reads the v8.1 state object (S) exported from IndexedDB and imports
 * all data into the v9 SQLite database.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Uzycie: node src/utils/migrate-v81.js <sciezka-do-backup.json>');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error('Plik nie istnieje:', inputFile);
  process.exit(1);
}

// Initialize DB
const db = require('../db');

const raw = fs.readFileSync(inputFile, 'utf-8');
let S;
try {
  S = JSON.parse(raw);
} catch (e) {
  console.error('Nieprawidlowy JSON:', e.message);
  process.exit(1);
}

// If the backup is wrapped in {cfg: {...}} format (IndexedDB export)
if (S.cfg && typeof S.cfg === 'object') {
  S = S.cfg;
}

console.log('Migracja v8.1 → v9...');

db.transaction(() => {
  // --- Clear existing data ---
  db.prepare('DELETE FROM config').run();
  db.prepare('DELETE FROM slides').run();
  db.prepare('DELETE FROM stat_cards').run();
  db.prepare('DELETE FROM ticker').run();
  db.prepare('DELETE FROM rooms').run();
  db.prepare('DELETE FROM map_data').run();
  db.prepare('DELETE FROM icons').run();

  // --- Config ---
  const insertConfig = db.prepare('INSERT INTO config (key, value) VALUES (?, ?)');
  const configMap = {
    theme: S.theme || 'light',
    accent: S.accent || '#00A651',
    tvFont: S.tvFont || 'system',
    slideTime: String(S.slideTime || 10),
    sidebarWidth: String(S.sw || 380),
    orgName: S.oName || '',
    orgSub: S.oSub || '',
    orgPhone: S.oPhone || '',
    orgEmail: S.oEmail || '',
    orgWww: S.oWww || '',
    orgHours: S.oHours || '',
    tts: S.tts ? 'true' : 'false',
    logoMediaId: '',
    wxCity: S.wxCity || 'Sztum',
    wxLat: String(S.wxLat || 53.9167),
    wxLon: String(S.wxLon || 19.05),
    fsTitleSlide: String(S.fsTitleSlide || 3.1),
    fsBodySlide: String(S.fsBodySlide || 2),
    fsTicker: String(S.fsTicker || 1.05),
    fsClock: String(S.fsClock || 2.1),
    headerH: String(S.headerH || 60),
    tickerH: String(S.tickerH || 74),
    stagePad: String(S.stagePad || 14),
    slideRadius: String(S.slideRadius || 20),
    wxIconSize: String(S.wxIconSize || 36),
    wxTempSize: String(S.wxTempSize || 1.2),
    mapUnit: S.mapUnit || 'os. bezrobotnych',
  };

  for (const [key, value] of Object.entries(configMap)) {
    insertConfig.run(key, value);
  }
  console.log('  Config: ' + Object.keys(configMap).length + ' kluczy');

  // --- Handle logo (Base64 → file) ---
  if (S.logo && S.logo.startsWith('data:')) {
    const match = S.logo.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const ext = match[1].split('/')[1] || 'png';
      const buffer = Buffer.from(match[2], 'base64');
      const filename = 'logo-migrated.' + ext;
      const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);

      const mediaResult = db.prepare(
        'INSERT INTO media (filename, original_name, mime_type, size) VALUES (?, ?, ?, ?)'
      ).run(filename, 'logo.' + ext, match[1], buffer.length);

      db.prepare('UPDATE config SET value = ? WHERE key = ?').run(String(mediaResult.lastInsertRowid), 'logoMediaId');
      console.log('  Logo: zapisane jako ' + filename + ' (' + buffer.length + ' bytes)');
    }
  }

  // --- Slides ---
  const insertSlide = db.prepare(
    'INSERT INTO slides (type, title, active, position, duration, tts_text, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const slides = S.slides || [];
  slides.forEach((s, i) => {
    const type = s.type || 'text';
    const title = s.title || s.jobTitle || '';
    const active = s.on !== false ? 1 : 0;
    const duration = s.dur || 0;
    const tts_text = s.tts || '';

    // Extract type-specific settings
    const settings = {};
    if (type === 'text') {
      settings.body = s.body || '';
      settings.icon = s.icon || '📌';
      settings.svgIcon = s.svgIcon || '';
    } else if (type === 'media' || type === 'video') {
      settings.mmode = s.mmode || 'embed';
      settings.mdata = s.mdata || '';
      settings.mpath = s.mpath || '';
      settings.murl = s.murl || '';
      settings.objectFit = s.objectFit || 'cover';
      if (type === 'video') settings.volume = s.volume || 50;
    } else if (type === 'split') {
      settings.body = s.body || '';
      settings.mmode = s.mmode || 'embed';
      settings.mdata = s.mdata || '';
      settings.mpath = s.mpath || '';
      settings.murl = s.murl || '';
      settings.objectFit = s.objectFit || 'cover';
    } else if (type === 'stats') {
      settings.period = s.period || '';
      settings.total = s.total || 0;
      settings.rate = s.rate || '';
      settings.sztum = s.sztum || 0;
      settings.dzierzgon = s.dzierzgon || 0;
      settings.staryTarg = s.staryTarg || 0;
      settings.staryDzierzgon = s.staryDzierzgon || 0;
      settings.mikolajki = s.mikolajki || 0;
      settings.rateHistory = s.rateHistory || [];
    } else if (type === 'quote') {
      settings.quote = s.quote || '';
      settings.author = s.author || '';
    } else if (type === 'calendar') {
      settings.calYear = s.calYear || 2026;
      settings.calMonth = s.calMonth || 1;
      settings.events = s.events || '';
    } else if (type === 'statsCards') {
      // No extra settings — references global statCards
    } else if (type === 'mapSlide') {
      // No extra settings — references global mapData
    } else if (type === 'job') {
      settings.jobTitle = s.jobTitle || '';
      settings.jobCompany = s.jobCompany || '';
      settings.jobLocation = s.jobLocation || '';
      settings.jobRequirements = s.jobRequirements || '';
      settings.jobContact = s.jobContact || '';
      settings.jobUrl = s.jobUrl || '';
    }

    insertSlide.run(type, title, active, i, duration, tts_text, JSON.stringify(settings));
  });
  console.log('  Slajdy: ' + slides.length);

  // --- Stat Cards ---
  const insertCard = db.prepare(
    'INSERT INTO stat_cards (title, value, unit, change, icon, gradient, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const statCards = S.statCards || [];
  statCards.forEach((c, i) => {
    insertCard.run(c.title || '', c.value || 0, c.unit || 'szt.', c.change || 0, c.icon || '📊', c.gradient || 'blue', i);
  });
  console.log('  Karty stat.: ' + statCards.length);

  // --- Ticker ---
  const insertTicker = db.prepare('INSERT INTO ticker (text, active, position) VALUES (?, 1, ?)');
  const tickerLines = (S.ticker || '').trim().split('\n').filter(Boolean);
  tickerLines.forEach((text, i) => {
    insertTicker.run(text.trim(), i);
  });
  console.log('  Ticker: ' + tickerLines.length + ' wiadomosci');

  // --- Rooms ---
  const insertRoom = db.prepare('INSERT INTO rooms (number, name, floor, position) VALUES (?, ?, ?, ?)');
  const roomLines = (S.rooms || '').trim().split('\n').filter(Boolean);
  roomLines.forEach((line, i) => {
    const parts = line.split('|');
    insertRoom.run(
      (parts[0] || '').trim(),
      (parts[1] || '').trim(),
      (parts[2] || '').trim(),
      i
    );
  });
  console.log('  Pokoje: ' + roomLines.length);

  // --- Map Data ---
  const insertMap = db.prepare('INSERT OR REPLACE INTO map_data (municipality, value) VALUES (?, ?)');
  const md = S.mapData || {};
  for (const [key, value] of Object.entries(md)) {
    insertMap.run(key, Number(value) || 0);
  }
  console.log('  Mapa: ' + Object.keys(md).length + ' gmin');

  // --- SVG Icons ---
  const insertIcon = db.prepare('INSERT INTO icons (name, svg, category) VALUES (?, ?, ?)');
  const icons = S.svgIcons || [];
  icons.forEach(ic => {
    insertIcon.run(ic.name || 'icon', ic.svg || '', 'custom');
  });
  console.log('  Ikony SVG: ' + icons.length);

})();

console.log('\nMigracja zakonczona pomyslnie!');
console.log('Uruchom backend: npm run dev');
