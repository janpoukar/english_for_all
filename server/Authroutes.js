const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const router = express.Router();

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Vyplň prosím jméno, email a heslo' });
    }

    const normalizedRole = role === 'tutor' ? 'tutor' : 'student';
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING *',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, normalizedRole]
    );

    const user = result.rows[0];
    res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(400).json({ error: 'Uživatel již existuje' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Vyplň prosím email a heslo' });
  }

  const result = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email.trim().toLowerCase()]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Neexistuje' });
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return res.status(400).json({ error: 'Špatné heslo' });
  }

  res.json({
    token: signToken(user),
    user: sanitizeUser(user),
  });
});

module.exports = router;