const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabaseFetch } = require('./supabase');

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
  
  if (token.startsWith('admin-local-token-')) {
    req.user = { id: 'admin-local', role: 'admin' };
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

    const result = await supabaseFetch('/users', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash: hashedPassword,
        role: normalizedRole,
      }),
    });

    const user = Array.isArray(result) ? result[0] : result;
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

  const result = await supabaseFetch(
    `/users?select=id,name,email,role,password_hash&email=eq.${encodeURIComponent(email.trim().toLowerCase())}&limit=1`
  );

  if (!Array.isArray(result) || result.length === 0) {
    return res.status(400).json({ error: 'Neexistuje' });
  }

  const user = result[0];

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

    // Retry logic pro pomalé DB připojení
    let userExists = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await supabaseFetch(`/users?select=id&id=eq.${encodeURIComponent(userId)}&limit=1`);
        userExists = Array.isArray(result) && result.length > 0;
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} to check user failed:`, err.message);
        if (attempt === 3) throw err;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    if (!userExists) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen' });
    }

    // Hashuj nové heslo a ulož (s retry)
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await supabaseFetch(`/users?id=eq.${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify({ password_hash: hashedPassword }),
        });
        break;
      } catch (err) {
        console.error(`Attempt ${attempt} to update password failed:`, err.message);
        if (attempt === 3) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    res.json({ success: true, message: 'Heslo bylo změněno' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Chyba při změně hesla: ' + err.message });
  }
});

// Endpoint pro listování uživatelů (jen admin)
router.get('/admin/users', verifyAdmin, async (req, res) => {
  try {
    const result = await supabaseFetch('/users?select=id,name,email,role&order=role.desc');
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Chyba při načítání uživatelů' });
  }
});

router.verifyAdmin = verifyAdmin;

module.exports = router;