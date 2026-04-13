const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabaseFetch = async (endpoint, options = {}) => {
  const url = `${SUPABASE_URL}/rest/v1${endpoint}`;
  const headers = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    const errorText = await response.text();
    let message = `HTTP ${response.status}`;

    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        message = parsed?.message || parsed?.error || message;
      } catch {
        message = errorText;
      }
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
};

router.get('/', async (req, res) => {
  const { lesson_id: lessonId } = req.query;

  if (!lessonId) {
    console.warn('[MATERIALS] GET / missing lesson_id');
    return res.status(400).json({ error: 'Chybí lesson_id' });
  }

  try {
    console.log(`[MATERIALS] Fetching materials for lesson: ${lessonId}`);
    const result = await supabaseFetch(`/materials?lesson_id=eq.${encodeURIComponent(lessonId)}&order=created_at.desc`);
    const materials = Array.isArray(result) ? result : [];
    console.log(`[MATERIALS] Found ${materials.length} materials for lesson ${lessonId}`);
    res.json(materials);
  } catch (err) {
    console.error('[MATERIALS] Fetch materials error:', err.message);
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
    console.log(`[MATERIALS] Saving material metadata to Supabase: ${fileName} for lesson ${lessonId}`);
    const result = await supabaseFetch('/materials', {
      method: "POST",
      headers: {
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        lesson_id: lessonId,
        file_name: fileName,
        file_url: fileUrl,
      })
    });

    const material = Array.isArray(result) ? result[0] : result;
    console.log(`[MATERIALS] Material saved successfully: ${material?.id}`);
    res.status(201).json(material);
  } catch (err) {
    console.error('[MATERIALS] Create material error:', err.message);
    res.status(500).json({ error: `Chyba při ukládání materiálu: ${err.message}` });
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await supabaseFetch(`/materials?id=eq.${encodeURIComponent(id)}`);
    const material = Array.isArray(result) ? result[0] : null;

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
    console.error('[MATERIALS] Download material error:', err.message);
    return res.status(500).json({ error: `Chyba při stahování materiálu: ${err.message}` });
  }
});

module.exports = router;