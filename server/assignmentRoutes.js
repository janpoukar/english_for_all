const express = require('express');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

const normalizeStatus = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (['probiha', 'hotovo', 'dokonceno'].includes(normalized)) {
    return normalized;
  }
  return 'probiha';
};

const patchAssignmentByKnownIdColumns = async (id, updates) => {
  const idColumns = ['id', 'assignment_id', 'task_id'];

  for (const idColumn of idColumns) {
    try {
      const result = await supabaseFetch(`/assignments?${idColumn}=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(updates),
      });

      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
    } catch (err) {
      const message = String(err?.message || '').toLowerCase();
      if (message.includes('column') && message.includes(idColumn)) {
        continue;
      }
      throw err;
    }
  }

  return null;
};

router.get('/', async (req, res) => {
  const { lesson_id: lessonId } = req.query;

  if (!lessonId) {
    return res.status(400).json({ error: 'Chybí lesson_id' });
  }

  try {
    let result;

    try {
      result = await supabaseFetch(`/assignments?lesson_id=eq.${encodeURIComponent(lessonId)}&order=created_at.desc`);
    } catch (orderError) {
      const message = String(orderError?.message || '').toLowerCase();
      if (!message.includes('created_at')) {
        throw orderError;
      }

      result = await supabaseFetch(`/assignments?lesson_id=eq.${encodeURIComponent(lessonId)}`);
    }

    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('[ASSIGNMENTS] Fetch error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při načítání úkolů: ${err.message}` });
  }
});

router.post('/', async (req, res) => {
  const { lesson_id: lessonId, title, description, due_date: dueDate, status } = req.body || {};

  if (!lessonId || !title) {
    return res.status(400).json({ error: 'Chybí lesson_id nebo název úkolu' });
  }

  try {
    const payloadWithStatus = {
      lesson_id: lessonId,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      due_date: dueDate || null,
      status: normalizeStatus(status),
    };

    let result;
    try {
      result = await supabaseFetch('/assignments', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payloadWithStatus),
      });
    } catch (insertError) {
      const message = String(insertError?.message || '').toLowerCase();
      if (!message.includes('status')) {
        throw insertError;
      }

      const payloadWithoutStatus = {
        lesson_id: lessonId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        due_date: dueDate || null,
      };

      result = await supabaseFetch('/assignments', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payloadWithoutStatus),
      });
    }

    res.status(201).json(Array.isArray(result) ? result[0] : result);
  } catch (err) {
    console.error('[ASSIGNMENTS] Create error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při ukládání úkolu: ${err.message}` });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = {};

  for (const key of ['title', 'description', 'due_date', 'status']) {
    if (req.body?.[key] !== undefined) {
      updates[key] = key === 'status' ? normalizeStatus(req.body[key]) : req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Žádná data k úpravě' });
  }

  try {
    let updated = await patchAssignmentByKnownIdColumns(id, updates);

    if (!updated && updates.status) {
      const { status: _ignored, ...withoutStatus } = updates;
      if (Object.keys(withoutStatus).length > 0) {
        updated = await patchAssignmentByKnownIdColumns(id, withoutStatus);
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen' });
    }

    res.json(updated);
  } catch (err) {
    console.error('[ASSIGNMENTS] Update error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při úpravě úkolu: ${err.message}` });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await supabaseFetch(`/assignments?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[ASSIGNMENTS] Delete error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při mazání úkolu: ${err.message}` });
  }
});

module.exports = router;