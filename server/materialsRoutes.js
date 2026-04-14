const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const {
  supabaseFetch,
  supabaseResolvedUrl,
  supabaseResolvedApiKey,
  supabaseResolvedAuthToken,
} = require('./supabase');

const router = express.Router();

// Supabase Storage client (reuse resolved config from supabase.js)
const supabaseStorageKey = supabaseResolvedAuthToken || supabaseResolvedApiKey;
const supabase = supabaseResolvedUrl && supabaseStorageKey
  ? createClient(supabaseResolvedUrl, supabaseStorageKey)
  : null;

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

const extractStoragePath = (fileUrl = '') => {
  const value = String(fileUrl || '').trim();
  if (!value) return '';

  if (value.startsWith(`storage://${BUCKET_NAME}/`)) {
    return value.replace(`storage://${BUCKET_NAME}/`, '');
  }

  const publicMatch = value.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/i);
  if (publicMatch && publicMatch[1]) {
    return decodeURIComponent(publicMatch[1]);
  }

  return '';
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

    const fileUrl = `storage://${BUCKET_NAME}/${storagePath}`;

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

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await supabaseFetch(`/materials?id=eq.${encodeURIComponent(id)}&select=id,file_url&limit=1`);
    const material = Array.isArray(result) ? result[0] : null;

    if (!material) {
      return res.status(404).json({ error: 'Materiál nebyl nalezen' });
    }

    const storagePath = extractStoragePath(material.file_url);

    if (storagePath && supabase) {
      const { error: removeError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      // If file is already missing in storage, still remove DB record.
      if (removeError) {
        console.warn('[MATERIALS] Storage remove warning:', removeError.message);
      }
    }

    await supabaseFetch(`/materials?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('[MATERIALS] Delete material error:', err.message, err.code);
    return res.status(500).json({ error: `Chyba při mazání materiálu: ${err.message}` });
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

    const downloadFileName = displayFileName(material.file_name);
    const storagePath = extractStoragePath(material.file_url);

    if (storagePath) {
      if (!supabase) {
        return res.status(500).json({ error: 'Chyba: Storage není dostupný' });
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 120);

      if (signedError || !signedData?.signedUrl) {
        console.error('[MATERIALS] Signed URL error:', signedError);
        return res.status(404).json({ error: 'Soubor nebyl nalezen ve Storage' });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      return res.redirect(signedData.signedUrl);
    }

    if (/^https?:\/\//i.test(material.file_url)) {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
      return res.redirect(material.file_url);
    }

    return res.status(404).json({ error: 'Soubor není dostupný' });
  } catch (err) {
    console.error('[MATERIALS] Download material error:', err.message, err.code);
    return res.status(500).json({ error: `Chyba při stahování materiálu: ${err.message}` });
  }
});

module.exports = router;
