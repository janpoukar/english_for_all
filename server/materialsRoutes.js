const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

// Supabase Storage client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// In-memory storage for multer to get file in memory first
const storage = multer.memoryStorage();
const upload = multer({ storage });

const BUCKET_NAME = 'lesson-materials';

const fixMojibake = (value = '') => {
  const text = String(value || '');
  if (/[ÃÄÅ]/.test(text)) {
    try {
      return Buffer.from(text, 'latin1').toString('utf8');
    } catch {
      return text;
    }
  }
  return text;
};

const displayFileName = (value = '') => {
  const repaired = fixMojibake(value).trim();
  return repaired || 'Soubor';
};

const generateStorageFileName = (originalName) => {
  const repaired = fixMojibake(originalName).trim();
  const lastDotIndex = repaired.lastIndexOf('.');
  const base = lastDotIndex > 0 ? repaired.slice(0, lastDotIndex) : repaired;
  const ext = lastDotIndex > 0 ? repaired.slice(lastDotIndex).toLowerCase() : '';

  const safeBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${Date.now()}-${safeBase || 'soubor'}${ext}`;
};

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

  console.log(`[MATERIALS] POST / - lesson_id: ${lessonId}, file: ${req.file?.originalname || 'None'}`);

  if (!lessonId) {
    console.warn('[MATERIALS] POST / missing lesson_id');
    return res.status(400).json({ error: 'Chybí lesson_id' });
  }

  if (!req.file) {
    console.warn('[MATERIALS] POST / missing file');
    return res.status(400).json({ error: 'Nebyl nahrán žádný soubor' });
  }

  if (!supabase) {
    console.error('[MATERIALS] POST / Supabase not configured');
    return res.status(500).json({ error: 'Chyba: Storage není dostupný' });
  }

  const displayName = displayFileName(req.file.originalname);
  const storageName = generateStorageFileName(req.file.originalname);
  const storagePath = `${lessonId}/${storageName}`;

  try {
    console.log(`[MATERIALS] Uploading file to Storage: ${storagePath}`);
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error('[MATERIALS] Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const fileUrl = publicUrlData?.publicUrl || '';

    console.log(`[MATERIALS] Saving material metadata to Supabase: ${displayName} for lesson ${lessonId}`);
    const result = await supabaseFetch('/materials', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ 
        lesson_id: lessonId, 
        file_name: displayName, 
        file_url: fileUrl 
      }),
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

    if (!material.file_url) {
      return res.status(400).json({ error: 'Materiál nelze stáhnout' });
    }

    // Redirect to Supabase Storage public URL or proxy the download
    const downloadFileName = displayFileName(material.file_name);
    
    // Set content disposition header for download
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    
    // Redirect to the file URL (browser will download it)
    return res.redirect(material.file_url);
  } catch (err) {
    console.error('[MATERIALS] Download material error:', err.message, err.code);
    return res.status(500).json({ error: `Chyba při stahování materiálu: ${err.message}` });
  }
});

module.exports = router;
