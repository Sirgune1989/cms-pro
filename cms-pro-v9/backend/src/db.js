const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'db.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema ---
db.exec(`
  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS slides (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT NOT NULL,
    title      TEXT DEFAULT '',
    active     INTEGER DEFAULT 1,
    position   INTEGER DEFAULT 0,
    duration   INTEGER DEFAULT 0,
    tts_text   TEXT DEFAULT '',
    settings   TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stat_cards (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    title    TEXT NOT NULL,
    value    REAL DEFAULT 0,
    unit     TEXT DEFAULT 'szt.',
    change   REAL DEFAULT 0,
    icon     TEXT DEFAULT '',
    gradient TEXT DEFAULT 'blue',
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS ticker (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    text     TEXT NOT NULL,
    active   INTEGER DEFAULT 1,
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    number   TEXT NOT NULL,
    name     TEXT NOT NULL,
    floor    TEXT DEFAULT '',
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS map_data (
    municipality TEXT PRIMARY KEY,
    value        REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS icons (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    svg      TEXT NOT NULL,
    category TEXT DEFAULT 'custom'
  );

  CREATE TABLE IF NOT EXISTS media (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type     TEXT NOT NULL,
    size          INTEGER NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );
`);

// --- Seed defaults if empty ---
function seedDefaults() {
  const configCount = db.prepare('SELECT COUNT(*) as c FROM config').get().c;
  if (configCount > 0) return;

  const insertConfig = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
  const defaults = {
    theme: 'light',
    accent: '#00A651',
    tvFont: 'system',
    slideTime: '10',
    sidebarWidth: '380',
    orgName: 'Powiatowy Urząd Pracy w Sztumie',
    orgSub: 'POWIATOWY URZĄD PRACY',
    orgPhone: '55 640 25 10',
    orgEmail: 'gdst@praca.gov.pl',
    orgWww: 'sztum.praca.gov.pl',
    orgHours: 'Pn-Pt: 7:30–15:30',
    tts: 'false',
    logoMediaId: '',
    wxCity: 'Sztum',
    wxLat: '53.9167',
    wxLon: '19.05',
    fsTitleSlide: '3.1',
    fsBodySlide: '2',
    fsTicker: '1.05',
    fsClock: '2.1',
    headerH: '60',
    tickerH: '74',
    stagePad: '14',
    slideRadius: '20',
    wxIconSize: '36',
    wxTempSize: '1.2',
    mapUnit: 'os. bezrobotnych'
  };

  const insertMany = db.transaction(() => {
    for (const [key, value] of Object.entries(defaults)) {
      insertConfig.run(key, value);
    }
  });
  insertMany();

  // Seed default slides
  const insertSlide = db.prepare(
    'INSERT INTO slides (type, title, active, position, duration, tts_text, settings) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const seedSlides = db.transaction(() => {
    insertSlide.run('text', 'Witamy w Powiatowym Urzędzie Pracy', 1, 0, 0, '', JSON.stringify({
      body: 'Oferujemy bezpłatną pomoc w znalezieniu zatrudnienia.\nDoradztwo zawodowe, staże i szkolenia.\n\nZapraszamy — pokój nr 1 (Parter).',
      icon: '👋',
      svgIcon: ''
    }));
    insertSlide.run('stats', 'Statystyki PUP', 1, 1, 0, '', JSON.stringify({
      period: 'Luty 2026',
      total: 618,
      rate: '5,8%',
      sztum: 217,
      dzierzgon: 200,
      staryTarg: 90,
      staryDzierzgon: 57,
      mikolajki: 54,
      rateHistory: [
        { m: 'Wrz 25', v: 6.4 }, { m: 'Paź 25', v: 6.1 },
        { m: 'Lis 25', v: 6.0 }, { m: 'Gru 25', v: 5.9 },
        { m: 'Sty 26', v: 5.9 }, { m: 'Lut 26', v: 5.8 }
      ]
    }));
    insertSlide.run('statsCards', 'Statystyki PUP — Luty 2026', 1, 2, 0, '', JSON.stringify({}));
    insertSlide.run('mapSlide', 'Bezrobocie w powiecie sztumskim', 1, 3, 0, '', JSON.stringify({}));
    insertSlide.run('quote', 'Cytat', 1, 4, 0, '', JSON.stringify({
      quote: 'Praca to nie tylko zarobek — to część naszej tożsamości',
      author: '— Doradca zawodowy PUP Sztum'
    }));
  });
  seedSlides();

  // Seed stat cards
  const insertCard = db.prepare(
    'INSERT INTO stat_cards (title, value, unit, change, icon, gradient, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  const seedCards = db.transaction(() => {
    insertCard.run('Zarejestrowani bezrobotni', 1248, 'os.', -3.2, '👥', 'blue', 0);
    insertCard.run('Oferty pracy (aktywne)', 342, 'szt.', 8.5, '📋', 'green', 1);
    insertCard.run('Staże w toku', 87, 'os.', 12.1, '🎓', 'purple', 2);
    insertCard.run('Dotacje przyznane', 56, 'szt.', 5.3, '💰', 'orange', 3);
    insertCard.run('Szkolenia ukończone', 203, 'os.', 2.8, '📚', 'teal', 4);
    insertCard.run('Pośrednictwo pracy', 519, 'os.', -1.5, '🤝', 'red', 5);
  });
  seedCards();

  // Seed ticker
  const insertTicker = db.prepare('INSERT INTO ticker (text, active, position) VALUES (?, 1, ?)');
  const tickerTexts = [
    'Nabór wniosków na staże rusza od poniedziałku — zapraszamy do pokoju nr 15',
    'Trwają targi pracy w Dzierzgoniu — wejście bezpłatne',
    'Szkolenie komputerowe — zapisy w pokoju nr 2',
    'Dotacje na działalność gospodarczą — nowy nabór od marca 2026',
    'Oferty pracy na sztum.praca.gov.pl'
  ];
  const seedTicker = db.transaction(() => {
    tickerTexts.forEach((t, i) => insertTicker.run(t, i));
  });
  seedTicker();

  // Seed rooms
  const insertRoom = db.prepare('INSERT INTO rooms (number, name, floor, position) VALUES (?, ?, ?, ?)');
  const seedRooms = db.transaction(() => {
    insertRoom.run('1', 'Obsługa Bezrobotnych', 'Parter', 0);
    insertRoom.run('2', 'Doradca Zawodowy', 'Parter', 1);
    insertRoom.run('5', 'Kasa i Finanse', 'Parter', 2);
    insertRoom.run('10', 'Pośrednicy Pracy', 'Parter', 3);
    insertRoom.run('15', 'Staże i Szkolenia', 'I Piętro', 4);
    insertRoom.run('21', 'Kierownik', 'I Piętro', 5);
    insertRoom.run('25', 'Kadry i Płace', 'I Piętro', 6);
  });
  seedRooms();

  // Seed map data
  const insertMap = db.prepare('INSERT OR IGNORE INTO map_data (municipality, value) VALUES (?, ?)');
  const seedMap = db.transaction(() => {
    insertMap.run('sztum', 217);
    insertMap.run('dzierzgon', 200);
    insertMap.run('staryTarg', 90);
    insertMap.run('staryDzierzgon', 57);
    insertMap.run('mikolajki', 54);
  });
  seedMap();
}

seedDefaults();

module.exports = db;
