const express = require('express');
const pool = require('./db');

const router = express.Router();

router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM lessons ORDER BY date');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { title, description, date, start_time, end_time, tutor_id } = req.body;

  const result = await pool.query(
    `INSERT INTO lessons (title,description,date,start_time,end_time,tutor_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [title, description, date, start_time, end_time, tutor_id]
  );

  res.json(result.rows[0]);
});

module.exports = router;