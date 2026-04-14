const express = require('express');
const { supabaseFetch } = require('./supabase');
const pool = require('./db');

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

const normalizeText = (value) => String(value || '').trim().toLowerCase();

let assignmentColumnsCache = null;

const getAssignmentColumns = async () => {
  if (assignmentColumnsCache) {
    return assignmentColumnsCache;
  }

  const query = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'assignments'
  `;

  const result = await pool.query(query);
  assignmentColumnsCache = new Set((result.rows || []).map((row) => row.column_name));
  return assignmentColumnsCache;
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

const pgFetchAssignmentByKnownIdColumns = async (id) => {
  const idColumns = ['id', 'assignment_id', 'task_id'];
  const columns = await getAssignmentColumns();

  for (const idColumn of idColumns) {
    if (!columns.has(idColumn)) {
      continue;
    }

    const query = `SELECT * FROM assignments WHERE ${idColumn} = $1 LIMIT 1`;
    const result = await pool.query(query, [id]);
    if (result.rows && result.rows.length > 0) {
      return result.rows[0];
    }
  }

  return null;
};

const pgFindAssignmentByOriginalPayload = async (original) => {
  const lessonId = String(original?.lesson_id || '').trim();
  const originalTitle = String(original?.title || '').trim();
  const originalDueDate = String(original?.due_date || '').trim();
  if (!lessonId || !originalTitle) {
    return null;
  }

  const byTitle = await pool.query(
    'SELECT * FROM assignments WHERE lesson_id = $1 AND lower(trim(title)) = lower(trim($2)) LIMIT 1',
    [lessonId, originalTitle]
  );
  if (byTitle.rows && byTitle.rows.length > 0) {
    return byTitle.rows[0];
  }

  if (originalDueDate) {
    const byDueDate = await pool.query(
      'SELECT * FROM assignments WHERE lesson_id = $1 AND due_date::text = $2 LIMIT 1',
      [lessonId, originalDueDate]
    );
    if (byDueDate.rows && byDueDate.rows.length > 0) {
      return byDueDate.rows[0];
    }
  }

  return null;
};

const pgPatchAssignmentByWhere = async (whereColumn, whereValue, updates) => {
  const columns = await getAssignmentColumns();
  if (!columns.has(whereColumn)) {
    return null;
  }

  const allowed = ['title', 'description', 'due_date', 'status'];
  const patchEntries = Object.entries(updates || {}).filter(([key, value]) => allowed.includes(key) && value !== undefined);
  const filtered = patchEntries.filter(([key]) => columns.has(key));

  if (filtered.length === 0) {
    return null;
  }

  const setClause = filtered.map(([key], idx) => `${key} = $${idx + 1}`).join(', ');
  const params = filtered.map(([, value]) => value);
  params.push(whereValue);

  const query = `UPDATE assignments SET ${setClause} WHERE ${whereColumn} = $${params.length} RETURNING *`;
  const result = await pool.query(query, params);
  return result.rows && result.rows.length > 0 ? result.rows[0] : null;
};

const pgPatchAssignmentByKnownIdColumns = async (id, updates) => {
  const idColumns = ['id', 'assignment_id', 'task_id'];
  for (const idColumn of idColumns) {
    const updated = await pgPatchAssignmentByWhere(idColumn, id, updates);
    if (updated) {
      return updated;
    }
  }
  return null;
};

const pgPatchAssignmentByOriginalPayload = async (original, updates) => {
  const match = await pgFindAssignmentByOriginalPayload(original);
  const matchId = getAssignmentId(match);
  if (!matchId) {
    return null;
  }
  return pgPatchAssignmentByKnownIdColumns(matchId, updates);
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
  const originalTitle = normalizeText(original?.title);
  const originalDueDate = String(original?.due_date || '').trim();
  if (!lessonId || !originalTitle) {
    return null;
  }

  const result = await supabaseFetch(`/assignments?lesson_id=eq.${encodeURIComponent(lessonId)}`);
  if (!Array.isArray(result) || result.length === 0) {
    return null;
  }

  const exactTitle = result.find((item) => normalizeText(item?.title) === originalTitle);
  if (exactTitle) {
    return exactTitle;
  }

  if (originalDueDate) {
    const byDueDate = result.find((item) => String(item?.due_date || '').trim() === originalDueDate);
    if (byDueDate) {
      return byDueDate;
    }
  }

  return null;
};

const patchAssignmentByOriginalPayload = async (original, updates) => {
  const lessonId = String(original?.lesson_id || '').trim();
  const originalTitle = String(original?.title || '').trim();
  if (!lessonId || !originalTitle) {
    return null;
  }

  try {
    const result = await supabaseFetch(
      `/assignments?lesson_id=eq.${encodeURIComponent(lessonId)}&title=eq.${encodeURIComponent(originalTitle)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(updates),
      }
    );

    if (Array.isArray(result) && result.length > 0) {
      return result[0];
    }
  } catch (err) {
    if (isMissingColumnError(err, 'status')) {
      return null;
    }
    throw err;
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
      if (key === 'status') {
        updates[key] = normalizeStatus(req.body[key]);
      } else if (key === 'title' || key === 'description') {
        const value = req.body[key];
        updates[key] = value === null ? null : String(value).trim();
      } else {
        updates[key] = req.body[key];
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Žádná data k úpravě' });
  }

  try {
    const { status, ...nonStatusUpdates } = updates;
    let updated = null;
    let updateAttempted = false;
    const requestedNonStatusUpdate = Object.keys(nonStatusUpdates).length > 0;
    let targetAssignment = await fetchAssignmentByKnownIdColumns(id);

    if (!targetAssignment && original) {
      targetAssignment = await findAssignmentByOriginalPayload(original);
    }

    if (requestedNonStatusUpdate) {
      updateAttempted = true;
      updated = await patchAssignmentByKnownIdColumns(id, nonStatusUpdates);

      const targetId = getAssignmentId(targetAssignment);
      if (!updated && targetId) {
        updated = await patchAssignmentByKnownIdColumns(targetId, nonStatusUpdates);
      }

      if (!updated && original) {
        if (!updated) {
          updated = await patchAssignmentByOriginalPayload(original, nonStatusUpdates);
        }
      }

      if (!updated) {
        try {
          updated = await pgPatchAssignmentByKnownIdColumns(id, nonStatusUpdates);

          const targetId = getAssignmentId(targetAssignment);
          if (!updated && targetId) {
            updated = await pgPatchAssignmentByKnownIdColumns(targetId, nonStatusUpdates);
          }

          if (!updated && original) {
            updated = await pgPatchAssignmentByOriginalPayload(original, nonStatusUpdates);
          }
        } catch (pgErr) {
          console.warn('[ASSIGNMENTS] PG fallback (non-status) failed:', pgErr.message);
        }
      }
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);

      try {
        updateAttempted = true;
        const statusUpdateResult = await patchAssignmentByKnownIdColumns(id, { status: normalizedStatus });
        if (statusUpdateResult) {
          updated = statusUpdateResult;
        }

        const targetId = getAssignmentId(targetAssignment);
        if (!statusUpdateResult && targetId) {
          const fallbackByTargetId = await patchAssignmentByKnownIdColumns(targetId, { status: normalizedStatus });
          if (fallbackByTargetId) {
            updated = fallbackByTargetId;
          }
        }

        if (!statusUpdateResult && original) {
          if (!updated) {
            const fallbackByOriginal = await patchAssignmentByOriginalPayload(original, {
              status: normalizedStatus,
            });
            if (fallbackByOriginal) {
              updated = fallbackByOriginal;
            }
          }
        }

        if (!updated) {
          try {
            updated = await pgPatchAssignmentByKnownIdColumns(id, { status: normalizedStatus });

            const targetId = getAssignmentId(targetAssignment);
            if (!updated && targetId) {
              updated = await pgPatchAssignmentByKnownIdColumns(targetId, { status: normalizedStatus });
            }

            if (!updated && original) {
              updated = await pgPatchAssignmentByOriginalPayload(original, { status: normalizedStatus });
            }
          } catch (pgErr) {
            console.warn('[ASSIGNMENTS] PG fallback (status) failed:', pgErr.message);
          }
        }
      } catch (statusErr) {
        if (!isMissingColumnError(statusErr, 'status')) {
          throw statusErr;
        }
      }

    }

    if (!updated && targetAssignment) {
      updated = targetAssignment;
    }

    if (!updated) {
      updated = await fetchAssignmentByKnownIdColumns(id);
    }

    if (!updated) {
      try {
        updated = await pgFetchAssignmentByKnownIdColumns(id);
      } catch (pgErr) {
        console.warn('[ASSIGNMENTS] PG fallback fetch by id failed:', pgErr.message);
      }
    }

    if (!updated && original) {
      updated = await findAssignmentByOriginalPayload(original);
    }

    if (!updated && original) {
      try {
        updated = await pgFindAssignmentByOriginalPayload(original);
      } catch (pgErr) {
        console.warn('[ASSIGNMENTS] PG fallback fetch by original failed:', pgErr.message);
      }
    }

    if (!updated) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen nebo nelze upravit' });
    }

    const persistedId = getAssignmentId(updated);
    let persisted = updated;
    if (persistedId) {
      const refetched = await fetchAssignmentByKnownIdColumns(persistedId);
      if (refetched) {
        persisted = refetched;
      }
    }

    if (persistedId && (!persisted || persisted === updated)) {
      try {
        const pgRefetched = await pgFetchAssignmentByKnownIdColumns(persistedId);
        if (pgRefetched) {
          persisted = pgRefetched;
        }
      } catch (pgErr) {
        console.warn('[ASSIGNMENTS] PG fallback re-fetch failed:', pgErr.message);
      }
    }

    if (requestedNonStatusUpdate && updateAttempted) {
      const requestedDescription = nonStatusUpdates.description;
      if (requestedDescription !== undefined) {
        const persistedDescription =
          persisted.description === null || persisted.description === undefined
            ? null
            : String(persisted.description).trim();
        const expectedDescription = requestedDescription === null ? null : String(requestedDescription).trim();

        if (persistedDescription !== expectedDescription) {
          return res.status(409).json({
            error: 'Úprava komentáře se neuložila v databázi. Zkus to prosím znovu.',
          });
        }
      }
    }

    res.json({
      ...persisted,
      status: persisted?.status || 'probiha',
    });
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