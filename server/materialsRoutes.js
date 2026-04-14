const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

const fixMojibake = (value = '') => {
  const text = String(value || '');
  // If UTF-8 text was interpreted as latin1 (e.g. "Ä"), try to repair it.
  if (/[ÃÄÅ]/.test(text)) {
    try {
      return Buffer.from(text, 'latin1').toString('utf8');
    } catch {
      return text;
    }
  }
  return text;
};

const normalizeFileName = (value = '') => {
  const repaired = fixMojibake(value).trim();
  const lastDotIndex = repaired.lastIndexOf('.');
  const base = lastDotIndex > 0 ? repaired.slice(0, lastDotIndex) : repaired;
  const ext = lastDotIndex > 0 ? repaired.slice(lastDotIndex).toLowerCase() : '';

  const safeBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${safeBase || 'soubor'}${ext}`;
};

const displayFileName = (value = '') => {
  const repaired = fixMojibake(value).trim();
  return repaired || 'Soubor';
};

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, file, callback) => {
    const safeName = normalizeFileName(file.originalname);
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
    let result;

    try {
      result = await supabaseFetch(`/materials?lesson_id=eq.${encodeURIComponent(lessonId)}&order=created_at.desc`);
    } catch (orderError) {
      const message = String(orderError?.message || '').toLowerCase();
      if (!message.includes('created_at')) {
        throw orderError;
      }

      // Backward compatibility for schemas without created_at column.
      result = await supabaseFetch(`/materials?lesson_id=eq.${encodeURIComponent(lessonId)}`);
    }

    const materials = Array.isArray(result)
      ? result.map((material) => ({
          ...material,
          file_name: displayFileName(material.file_name),
        }))
      : [];
    console.log(`[MATERIALS] Found ${materials.length} materials for lesson ${lessonId}`);
    res.json(materials);
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

  const fileName = displayFileName(req.file.originalname);
  const fileUrl = `/uploads/${req.file.filename}`;

  try {
    console.log(`[MATERIALS] Saving material metadata to Supabase: ${fileName} for lesson ${lessonId}`);
    const result = await supabaseFetch('/materials', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ lesson_id: lessonId, file_name: fileName, file_url: fileUrl }),
    });

    const material = Array.isArray(result) ? result[0] : result;
    console.log(`[MATERIALS] Material saved successfully: ${material?.id}`);
    res.status(201).json(material);
  } catch (err) {
    console.error('[MATERIALS] Create material error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při ukládání materiálu: ${err.message}` });
  }
});

router.get('/:id/download', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await supabaseFetch(`/materials?id=eq.${encodeURIComponent(id)}&select=file_name,file_url`);
    const material = Array.isArray(result) ? result[0] : null;

    if (!material) {
      return res.status(404).json({ error: 'Materiál nebyl nalezen' });
    }

    if (!material.file_url || !material.file_url.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Materiál nelze stáhnout' });
    }

    const storedFileName = path.basename(material.file_url);
    const downloadFileName = displayFileName(material.file_name || storedFileName);
    const absoluteFilePath = path.join(uploadsDir, storedFileName);

    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({ error: 'Soubor nebyl nalezen' });
    }

    return res.download(absoluteFilePath, downloadFileName);
  } catch (err) {
    console.error('[MATERIALS] Download material error:', err.message, err.code);
    return res.status(500).json({ error: `Chyba při stahování materiálu: ${err.message}` });
  }
});

module.exports = router;