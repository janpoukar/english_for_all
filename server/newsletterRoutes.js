const express = require('express');
const pool = require('./db');
const authRoutes = require('./Authroutes');
const nodemailer = require('nodemailer');

const router = express.Router();
const verifyAdmin = authRoutes.verifyAdmin;

const DEFAULT_SETTINGS = {
  title: 'Přihlaste se k Newsletteru',
  subtitle: 'Dostávejte aktuální tipy na učení angličtiny a nové kurzy',
  buttonText: 'Přihlásit',
};

const sanitizeUrl = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  try {
    const parsed = new URL(text);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : '';
  } catch {
    return '';
  }
};

const createTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('Chybí SMTP konfigurace (SMTP_HOST, SMTP_USER, SMTP_PASS)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user, pass },
  });
};

const buildNewsletterHtml = ({ subject, preheader, imageUrl, imageAlt, body, ctaText, ctaUrl }) => {
  const safeImageUrl = sanitizeUrl(imageUrl);
  const safeCtaUrl = sanitizeUrl(ctaUrl);
  const escapedSubject = String(subject || '').trim();
  const escapedPreheader = String(preheader || '').trim();
  const escapedBody = String(body || '').trim().replace(/\n/g, '<br>');
  const escapedImageAlt = String(imageAlt || 'Newsletter image').trim();
  const escapedCtaText = String(ctaText || '').trim();

  return `
    <div style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapedPreheader}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="680" cellpadding="0" cellspacing="0" style="width:680px;max-width:92vw;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(15,23,42,0.12);">
              <tr>
                <td style="background:linear-gradient(135deg,#0f172a,#1d4ed8,#b91c1c);padding:36px 40px;color:#fff;">
                  <div style="font-size:14px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.85;margin-bottom:10px;">English for All</div>
                  <div style="font-size:30px;line-height:1.2;font-weight:800;">${escapedSubject}</div>
                  ${escapedPreheader ? `<div style="margin-top:10px;font-size:15px;line-height:1.6;opacity:0.9;">${escapedPreheader}</div>` : ''}
                </td>
              </tr>
              ${safeImageUrl ? `
              <tr>
                <td>
                  <img src="${safeImageUrl}" alt="${escapedImageAlt}" style="display:block;width:100%;max-width:100%;height:auto;border:0;" />
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding:36px 40px;color:#111827;font-size:16px;line-height:1.75;">
                  ${escapedBody}
                  ${safeCtaUrl && escapedCtaText ? `
                    <div style="margin-top:28px;">
                      <a href="${safeCtaUrl}" style="display:inline-block;background:#1d4ed8;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700;">${escapedCtaText}</a>
                    </div>` : ''}
                </td>
              </tr>
              <tr>
                <td style="padding:0 40px 36px 40px;color:#6b7280;font-size:13px;line-height:1.6;">
                  Tento e-mail byl vytvořen v administraci English for All.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
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
    const preheader = String(req.body?.preheader || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const imageAlt = String(req.body?.imageAlt || '').trim();
    const body = String(req.body?.body || '').trim();
    const ctaText = String(req.body?.ctaText || '').trim();
    const ctaUrl = String(req.body?.ctaUrl || '').trim();

    if (!subject || !body) {
      return res.status(400).json({ error: 'Vyplň prosím předmět i text newsletteru' });
    }

    const recipientsResult = await pool.query(
      `SELECT DISTINCT email FROM users
       WHERE email IS NOT NULL AND email <> ''
       ORDER BY email ASC`
    );
    const recipients = recipientsResult.rows.map((row) => row.email).filter(Boolean);

    if (recipients.length === 0) {
      return res.status(400).json({ error: 'V databázi nejsou žádní uživatelé s e-mailem' });
    }

    const transport = createTransport();
    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    const html = buildNewsletterHtml({ subject, preheader, imageUrl, imageAlt, body, ctaText, ctaUrl });

    const sendResults = [];
    const sendErrors = [];
    for (const email of recipients) {
      try {
        const info = await transport.sendMail({
          from: fromAddress,
          to: email,
          subject,
          text: [preheader, body, ctaUrl ? `${ctaText || 'Otevřít odkaz'}: ${ctaUrl}` : '']
            .filter(Boolean)
            .join('\n\n'),
          html,
        });

        sendResults.push({ email, messageId: info.messageId });
      } catch (sendError) {
        console.error(`Newsletter send failed for ${email}:`, sendError.message);
        sendErrors.push({ email, error: sendError.message });
      }
    }

    await pool.query(
      `INSERT INTO newsletter_campaigns (subject, body, subscriber_count)
       VALUES ($1, $2, $3)`,
      [subject, body, recipients.length]
    );

    res.json({
      success: true,
      message: sendErrors.length
        ? `Newsletter odeslán ${sendResults.length} uživatelům, ${sendErrors.length} se nepodařilo doručit.`
        : `Newsletter odeslán ${sendResults.length} uživatelům.`,
      subscriberCount: recipients.length,
      sentCount: sendResults.length,
      failedCount: sendErrors.length,
      failures: sendErrors,
    });
  } catch (err) {
    console.error('Newsletter send error:', err);
    res.status(500).json({ error: err.message || 'Nepodařilo se odeslat newsletter' });
  }
});

module.exports = router;