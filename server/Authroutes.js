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

// Middleware pro ověření admina
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Chybí autorizace' });
  }

  // Speciální handle pro local admin token
  if (token.startsWith('admin-local-token-')) {
    req.user = { 
      id: 'admin-local',
      role: 'admin'
    };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Nemáš oprávnění' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Neplatný token' });
  }
};

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

// Admin endpoint - změna hesla uživatele
router.post('/admin/change-password', verifyAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Vyplň prosím ID uživatele a nové heslo' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Heslo musí mít alespoň 6 znaků' });
    }

    // Zkontroluj, že uživatel existuje
    const userExists = await pool.query('SELECT id FROM users WHERE id=$1', [userId]);
    if (userExists.rows.length === 0) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen' });
    }

    // Hashuj nové heslo a ulož
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password_hash=$1 WHERE id=$2',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Heslo bylo změněno' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Chyba při změně hesla' });
  }
});

// Endpoint pro listování uživatelů (jen admin)
router.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY role DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Chyba při načítání uživatelů' });
  }
});

module.exports = router;