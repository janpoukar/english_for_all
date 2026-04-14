const express = require('express');
const fs = require('fs');
const path = require('path');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

const DATA_DIR = path.join(__dirname, 'data');
const ASSIGNMENT_STATUS_STORE_PATH = path.join(DATA_DIR, 'assignment-status.json');

const ensureStatusStore = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(ASSIGNMENT_STATUS_STORE_PATH)) {
    fs.writeFileSync(ASSIGNMENT_STATUS_STORE_PATH, JSON.stringify({ statuses: {} }, null, 2));
  }
};

const readStatusStore = () => {
  ensureStatusStore();
  try {
    const parsed = JSON.parse(fs.readFileSync(ASSIGNMENT_STATUS_STORE_PATH, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : { statuses: {} };
  } catch {
    return { statuses: {} };
  }
};

const writeStatusStore = (store) => {
  ensureStatusStore();
  fs.writeFileSync(ASSIGNMENT_STATUS_STORE_PATH, JSON.stringify(store, null, 2));
};

const getAssignmentId = (assignment) =>
  assignment?.id || assignment?.assignment_id || assignment?.task_id || null;

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
      const message = String(err?.message || '').toLowerCase();
      if (message.includes('column') && message.includes(idColumn)) {
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

const mergeStatusFallback = (assignment) => {
  if (!assignment) return assignment;

  const assignmentId = getAssignmentId(assignment);
  const statusStore = readStatusStore();
  const storedStatus = assignmentId ? statusStore.statuses?.[assignmentId] : null;

  return {
    ...assignment,
    status: assignment.status || storedStatus || 'probiha',
  };
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

    const normalized = (Array.isArray(result) ? result : []).map(mergeStatusFallback);
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
    const createdId = getAssignmentId(created);

    if (createdId && status) {
      const statusStore = readStatusStore();
      statusStore.statuses[createdId] = normalizeStatus(status);
      writeStatusStore(statusStore);
    }

    res.status(201).json(mergeStatusFallback(created));
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
    const { status, ...nonStatusUpdates } = updates;
    let updated = null;

    if (Object.keys(nonStatusUpdates).length > 0) {
      updated = await patchAssignmentByKnownIdColumns(id, nonStatusUpdates);
    }

    if (status !== undefined) {
      const normalizedStatus = normalizeStatus(status);

      try {
        const statusUpdateResult = await patchAssignmentByKnownIdColumns(id, { status: normalizedStatus });
        if (statusUpdateResult) {
          updated = statusUpdateResult;
        }
      } catch (statusErr) {
        if (!isMissingColumnError(statusErr, 'status')) {
          throw statusErr;
        }
      }

      const assignmentRef = updated || (await fetchAssignmentByKnownIdColumns(id));
      const assignmentId = getAssignmentId(assignmentRef) || id;
      const statusStore = readStatusStore();
      statusStore.statuses[assignmentId] = normalizedStatus;
      writeStatusStore(statusStore);
    }

    if (!updated) {
      updated = await fetchAssignmentByKnownIdColumns(id);
    }

    if (!updated) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen' });
    }

    res.json(mergeStatusFallback(updated));
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