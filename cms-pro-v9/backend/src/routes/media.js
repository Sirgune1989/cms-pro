const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = Router();
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|ogg|mp3|wav|pdf)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Niedozwolony typ pliku'));
    }
  }
});

// GET /api/media
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
  res.json(items.map(m => ({
    ...m,
    url: `/api/uploads/${m.filename}`
  })));
});

// POST /api/media
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Brak pliku' });

  const result = db.prepare(
    'INSERT INTO media (filename, original_name, mime_type, size) VALUES (?, ?, ?, ?)'
  ).run(req.file.filename, req.file.originalname, req.file.mimetype, req.file.size);

  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...item, url: `/api/uploads/${item.filename}` });
});

// DELETE /api/media/:id
router.delete('/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono' });

  // Delete file from disk
  const filePath = path.join(uploadsDir, item.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
