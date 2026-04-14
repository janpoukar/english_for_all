const express = require('express');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

const getAssignmentId = (assignment) => {
  if (!assignment || typeof assignment !== 'object') return null;

  const known = assignment.id || assignment.assignment_id || assignment.task_id;
  if (known) return known;

  const discovered = Object.entries(assignment).find(([key, value]) => {
    if (value === null || value === undefined || value === '') return false;
    const normalizedKey = String(key || '').toLowerCase();
    if (normalizedKey === 'lesson_id') return false;
    return normalizedKey.endsWith('id');
  });

  return discovered ? discovered[1] : null;
};

const isMissingColumnError = (err, columnName) => {
  const message = String(err?.message || '').toLowerCase();
  return message.includes('column') && message.includes(String(columnName || '').toLowerCase());
};

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
      if (isMissingColumnError(err, idColumn)) {
        continue;
      }
      throw err;
    }
  }

  return null;
};

const fetchAssignmentByKnownIdColumns = async (id) => {
  const idColumns = ['id', 'assignment_id', 'task_id'];

  for (const idColumn of idColumns) {
    try {
      const result = await supabaseFetch(`/assignments?${idColumn}=eq.${encodeURIComponent(id)}&limit=1`);
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
    } catch (err) {
      if (isMissingColumnError(err, idColumn)) {
        continue;
      }
      throw err;
    }
  }

  return null;
};

const findAssignmentByOriginalPayload = async (original) => {
  const lessonId = original?.lesson_id;
  const originalTitle = String(original?.title || '').trim();
  if (!lessonId || !originalTitle) {
    return null;
  }

  const result = await supabaseFetch(`/assignments?lesson_id=eq.${encodeURIComponent(lessonId)}`);
  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  return result.find((item) => String(item?.title || '').trim() === originalTitle) || null;
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

    const normalized = (Array.isArray(result) ? result : []).map((assignment) => ({
      ...assignment,
      status: assignment.status || 'probiha',
    }));
    res.json(normalized);
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

    const created = Array.isArray(result) ? result[0] : result;

    const normalizedCreated = {
      ...created,
      status: created?.status || normalizeStatus(status),
    };

    res.status(201).json(normalizedCreated);
  } catch (err) {
    console.error('[ASSIGNMENTS] Create error:', err.message, err.code);
    res.status(500).json({ error: `Chyba při ukládání úkolu: ${err.message}` });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const original = req.body?._original || null;

  for (const key of ['title', 'description', 'due_date', 'status']) {
    if (req.body?.[key] !== undefined) {
      updates[key] = key === 'status' ? normalizeStatus(req.body[key]) : req.body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Žádná data k úpravě' });
  }

  try {
    const { status, ...nonStatusUpdates } = updates;
    let updated = null;
    const requestedNonStatusUpdate = Object.keys(nonStatusUpdates).length > 0;

    if (requestedNonStatusUpdate) {
      updated = await patchAssignmentByKnownIdColumns(id, nonStatusUpdates);

      if (!updated && original) {
        const originalMatch = await findAssignmentByOriginalPayload(original);
        const originalMatchId = getAssignmentId(originalMatch);
        if (originalMatchId) {
          updated = await patchAssignmentByKnownIdColumns(originalMatchId, nonStatusUpdates);
        }
      }
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);

      try {
        const statusUpdateResult = await patchAssignmentByKnownIdColumns(id, { status: normalizedStatus });
        if (statusUpdateResult) {
          updated = statusUpdateResult;
        }

        if (!statusUpdateResult && original) {
          const originalMatch = await findAssignmentByOriginalPayload(original);
          const originalMatchId = getAssignmentId(originalMatch);
          if (originalMatchId) {
            const fallbackStatusResult = await patchAssignmentByKnownIdColumns(originalMatchId, {
              status: normalizedStatus,
            });
            if (fallbackStatusResult) {
              updated = fallbackStatusResult;
            }
          }
        }
      } catch (statusErr) {
        if (!isMissingColumnError(statusErr, 'status')) {
          throw statusErr;
        }
      }

    }

    if (!updated) {
      updated = await fetchAssignmentByKnownIdColumns(id);
    }

    if (!updated && original) {
      updated = await findAssignmentByOriginalPayload(original);
    }

    if (!updated) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen nebo nelze upravit' });
    }

    const merged = {
      ...updated,
      ...nonStatusUpdates,
      ...(status !== undefined ? { status } : {}),
      status: (status !== undefined ? status : updated.status) || 'probiha',
    };

    res.json(merged);
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