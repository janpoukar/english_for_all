const express = require('express');
const { supabaseFetch } = require('./supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await supabaseFetch('/lessons?order=date.asc,start_time.asc');
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('Fetch lessons error:', err);
    res.status(500).json({ error: `Chyba při načítání lekcí: ${err.message}` });
  }
});

router.post('/', async (req, res) => {
  const { title, description, date, start_time, end_time, tutor_id, status } = req.body;

  if (!title || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Chybí povinná data lekce' });
  }

  const normalizedStatus = ['free', 'booked', 'completed'].includes(status) ? status : 'free';

  try {
    const result = await supabaseFetch('/lessons', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        title,
        description: description || null,
        date,
        start_time,
        end_time,
        tutor_id: tutor_id || null,
        status: normalizedStatus,
      }),
    });

    res.status(201).json(Array.isArray(result) ? result[0] : result);
  } catch (err) {
    console.error('Create lesson error:', err);
    res.status(500).json({ error: `Chyba při ukládání lekce: ${err.message}` });
  }
});

router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const allowedFields = ['title', 'description', 'date', 'start_time', 'end_time', 'status', 'tutor_id'];
  const updates = Object.entries(req.body || {}).filter(([key, value]) => allowedFields.includes(key) && value !== undefined);

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Žádná data k úpravě' });
  }

  const values = updates.map(([, value]) => value);
  const setClause = updates.map(([key], index) => `${key} = $${index + 1}`).join(', ');

  try {
    const updateObject = Object.fromEntries(updates);
    const result = await supabaseFetch(`/lessons?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(updateObject),
    });

    if (!Array.isArray(result) || result.length === 0) {
      return res.status(404).json({ error: 'Lekce nebyla nalezena' });
    }

    res.json(result[0]);
  } catch (err) {
    console.error('Update lesson error:', err);
    res.status(500).json({ error: `Chyba při úpravě lekce: ${err.message}` });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await supabaseFetch(`/lessons?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    if (result === null) {
      return res.status(404).json({ error: 'Lekce nebyla nalezena' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete lesson error:', err);
    res.status(500).json({ error: `Chyba při mazání lekce: ${err.message}` });
  }
});


module.exports = router;