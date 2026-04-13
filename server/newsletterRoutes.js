const express = require('express');
const pool = require('./db');
const authRoutes = require('./Authroutes');

const router = express.Router();
const verifyAdmin = authRoutes.verifyAdmin;

const DEFAULT_SETTINGS = {
  title: 'Přihlaste se k Newsletteru',
  subtitle: 'Dostávejte aktuální tipy na učení angličtiny a nové kurzy',
  buttonText: 'Přihlásit',
};

const ensureTablesPromise = (async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      button_text TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS newsletter_campaigns (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      subscriber_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
})().catch((err) => {
  console.error('Newsletter table initialization failed:', err);
});

async function getSettingsRow() {
  await ensureTablesPromise;
  const result = await pool.query('SELECT * FROM newsletter_settings WHERE id = 1');

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  const inserted = await pool.query(
    `INSERT INTO newsletter_settings (id, title, subtitle, button_text)
     VALUES (1, $1, $2, $3)
     RETURNING *`,
    [DEFAULT_SETTINGS.title, DEFAULT_SETTINGS.subtitle, DEFAULT_SETTINGS.buttonText]
  );

  return inserted.rows[0];
}

router.get('/settings', async (req, res) => {
  try {
    const row = await getSettingsRow();
    res.json({
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
    });
  } catch (err) {
    console.error('Fetch newsletter settings error:', err);
    res.status(500).json({ error: 'Nepodařilo se načíst newsletter nastavení' });
  }
});

router.put('/settings', verifyAdmin, async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const subtitle = String(req.body?.subtitle || '').trim();
    const buttonText = String(req.body?.buttonText || '').trim();

    if (!title || !subtitle || !buttonText) {
      return res.status(400).json({ error: 'Vyplň prosím všechna newsletter pole' });
    }

    const result = await pool.query(
      `INSERT INTO newsletter_settings (id, title, subtitle, button_text, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id)
       DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, button_text = EXCLUDED.button_text, updated_at = NOW()
       RETURNING *`,
      [title, subtitle, buttonText]
    );

    const row = result.rows[0];
    res.json({
      title: row.title,
      subtitle: row.subtitle,
      buttonText: row.button_text,
    });
  } catch (err) {
    console.error('Save newsletter settings error:', err);
    res.status(500).json({ error: 'Nepodařilo se uložit newsletter nastavení' });
  }
});

router.post('/subscribe', async (req, res) => {
  try {
    await ensureTablesPromise;
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Vyplň prosím email' });
    }

    await pool.query(
      `INSERT INTO newsletter_subscribers (email)
       VALUES ($1)
       ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    res.json({ success: true, message: 'Děkujeme za přihlášení k newsletteru.' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Nepodařilo se zapsat odběr' });
  }
});

router.get('/subscribers', verifyAdmin, async (req, res) => {
  try {
    await ensureTablesPromise;
    const result = await pool.query(
      'SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Newsletter subscribers error:', err);
    res.status(500).json({ error: 'Nepodařilo se načíst odběratele' });
  }
});

router.post('/send', verifyAdmin, async (req, res) => {
  try {
    await ensureTablesPromise;
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '').trim();

    if (!subject || !body) {
      return res.status(400).json({ error: 'Vyplň prosím předmět i text newsletteru' });
    }

    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM newsletter_subscribers');
    const subscriberCount = countResult.rows[0]?.count || 0;

    await pool.query(
      `INSERT INTO newsletter_campaigns (subject, body, subscriber_count)
       VALUES ($1, $2, $3)`,
      [subject, body, subscriberCount]
    );

    res.json({
      success: true,
      message: `Newsletter uložen pro ${subscriberCount} odběratelů.`,
      subscriberCount,
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    res.status(500).json({ error: 'Nepodařilo se připravit newsletter k odeslání' });
  }
});

module.exports = router;