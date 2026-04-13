const express = require('express');
const pool = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons ORDER BY date, start_time');
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch lessons error:', err);
    res.status(500).json({ error: 'Chyba při načítání lekcí' });
  }
});

router.post('/', async (req, res) => {
  const { title, description, date, start_time, end_time, tutor_id, status } = req.body;

  if (!title || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Chybí povinná data lekce' });
  }

  const normalizedStatus = ['free', 'booked', 'completed'].includes(status) ? status : 'free';

  try {
    const result = await pool.query(
      `INSERT INTO lessons (title,description,date,start_time,end_time,tutor_id,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [title, description || null, date, start_time, end_time, tutor_id || null, normalizedStatus]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create lesson error:', err);
    res.status(500).json({ error: 'Chyba při ukládání lekce' });
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
    const result = await pool.query(
      `UPDATE lessons SET ${setClause} WHERE id = $${updates.length + 1} RETURNING *`,
      [...values, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lekce nebyla nalezena' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update lesson error:', err);
    res.status(500).json({ error: 'Chyba při úpravě lekce' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM lessons WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lekce nebyla nalezena' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete lesson error:', err);
    res.status(500).json({ error: 'Chyba při mazání lekce' });
  }
});


module.exports = router;