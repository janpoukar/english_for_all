const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, hashedPassword, role]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Uživatel již existuje' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Neexistuje' });
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(400).json({ error: 'Špatné heslo' });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

module.exports = router;