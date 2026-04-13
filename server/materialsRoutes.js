const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const pool = require('./db');

const router = express.Router();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

router.get('/', async (req, res) => {
  const { lesson_id: lessonId } = req.query;

  if (!lessonId) {
    console.warn('[MATERIALS] GET / missing lesson_id');
    return res.status(400).json({ error: 'Chybí lesson_id' });
  }

  try {
    console.log(`[MATERIALS] Fetching materials for lesson: ${lessonId}`);
    const result = await pool.query(
      'SELECT id, lesson_id, file_name, file_url, created_at FROM materials WHERE lesson_id = $1 ORDER BY created_at DESC',
      [lessonId]
    );
    console.log(`[MATERIALS] Found ${result.rows.length} materials for lesson ${lessonId}`);
    res.json(result.rows);
  } catch (err) {
    console.error('[MATERIALS] Fetch materials error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při načítání materiálů: ${err.message}` });
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  const { lesson_id: lessonId } = req.body;

  console.log(`[MATERIALS] POST / - lesson_id: ${lessonId}, file: ${req.file?.filename || 'None'}`);

  if (!lessonId) {
    console.warn('[MATERIALS] POST / missing lesson_id');
    return res.status(400).json({ error: 'Chybí lesson_id' });
  }

  if (!req.file) {
    console.warn('[MATERIALS] POST / missing file');
    return res.status(400).json({ error: 'Nebyl nahrán žádný soubor' });
  }

  const fileName = req.file.originalname;
  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    console.log(`[MATERIALS] Saving material: ${fileName} for lesson ${lessonId}`);
    const result = await pool.query(
      'INSERT INTO materials (lesson_id, file_name, file_url) VALUES ($1, $2, $3) RETURNING id, lesson_id, file_name, file_url, created_at',
      [lessonId, fileName, fileUrl]
    );

    console.log(`[MATERIALS] Material saved successfully: ${result.rows[0].id}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[MATERIALS] Create material error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při ukládání materiálu: ${err.message}` });
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT file_name, file_url FROM materials WHERE id = $1 LIMIT 1',
      [id]
    );

    const material = result.rows[0];
    if (!material) {
      return res.status(404).json({ error: 'Materiál nebyl nalezen' });
    }

    if (!material.file_url || !material.file_url.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Materiál nelze stáhnout' });
    }

    const storedFileName = path.basename(material.file_url);
    const absoluteFilePath = path.join(uploadsDir, storedFileName);

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ error: 'Soubor nebyl nalezen' });
    }

    return res.download(absoluteFilePath, material.file_name || storedFileName);
  } catch (err) {
    console.error('Download material error:', err);
    return res.status(500).json({ error: 'Chyba při stahování materiálu' });
  }
});

module.exports = router;