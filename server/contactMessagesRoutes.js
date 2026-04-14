const express = require('express');
const authRoutes = require('./Authroutes');
const { supabaseFetch } = require('./supabase');

const router = express.Router();
const verifyAdmin = authRoutes.verifyAdmin;

// Store contact message in database
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, courseType } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Vyplň prosím jméno, e-mail, předmět a zprávu' });
    }

    // Insert into contact_messages table
    const response = await supabaseFetch('/contact_messages', {
      method: 'POST',
      body: JSON.stringify({
        name: String(name || '').substring(0, 255),
        email: String(email || '').toLowerCase().substring(0, 255),
        phone: String(phone || '').substring(0, 20),
        subject: String(subject || '').substring(0, 255),
        message: String(message || '').substring(0, 5000),
        course_type: String(courseType || '').substring(0, 255),
        read: false,
        created_at: new Date().toISOString(),
      }),
    });

    res.json({
      success: true,
      message: 'Zpráva byla zapsána. Brzy se vám ozveme!',
    });
  } catch (err) {
    console.error('Contact message store error:', err);
    res.status(500).json({
      error: err.message || 'Nepodařilo se uložit zprávu',
    });
  }
});

// Get all contact messages (admin only)
router.get('/', verifyAdmin, async (_req, res) => {
  try {
    const messages = await supabaseFetch('/contact_messages?order=created_at.desc');
    res.json(Array.isArray(messages) ? messages : []);
  } catch (err) {
    console.error('Contact messages fetch error:', err);
    res.status(500).json({ error: 'Nepodařilo se načíst zprávy' });
  }
});

// Mark message as read (admin only)
router.patch('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { read } = req.body;

    const response = await supabaseFetch(`/contact_messages?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: Boolean(read) }),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact message update error:', err);
    res.status(500).json({ error: 'Nepodařilo se aktualizovat zprávu' });
  }
});

// Delete message (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await supabaseFetch(`/contact_messages?id=eq.${id}`, {
      method: 'DELETE',
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact message delete error:', err);
    res.status(500).json({ error: 'Nepodařilo se smazat zprávu' });
  }
});

module.exports = router;
