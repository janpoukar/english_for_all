const express = require('express');
const authRoutes = require('./Authroutes');
const nodemailer = require('nodemailer');
const { supabaseFetch } = require('./supabase');

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

async function getSettingsRow() {
  const result = await supabaseFetch('/newsletter_settings?id=eq.1&limit=1');

  if (Array.isArray(result) && result.length > 0) {
    return result[0];
  }

  const inserted = await supabaseFetch('/newsletter_settings', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ id: 1, title: DEFAULT_SETTINGS.title, subtitle: DEFAULT_SETTINGS.subtitle, button_text: DEFAULT_SETTINGS.buttonText }),
  });

  return Array.isArray(inserted) ? inserted[0] : inserted;
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
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ error: 'Vyplň prosím email' });
    }

    await supabaseFetch('/newsletter_subscribers', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ email }),
    });

    res.json({ success: true, message: 'Děkujeme za přihlášení k newsletteru.' });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    res.status(500).json({ error: 'Nepodařilo se zapsat odběr' });
  }
});

router.get('/subscribers', verifyAdmin, async (req, res) => {
  try {
    const result = await supabaseFetch('/newsletter_subscribers?select=id,email,created_at&order=created_at.desc');
    res.json(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error('Newsletter subscribers error:', err);
    res.status(500).json({ error: 'Nepodařilo se načíst odběratele' });
  }
});

router.post('/send', verifyAdmin, async (req, res) => {
  try {
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

    const usersResult = await supabaseFetch('/users?select=email');
    const recipients = [...new Set((Array.isArray(usersResult) ? usersResult : []).map((row) => String(row.email || '').trim()).filter(Boolean))];

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

    await supabaseFetch('/newsletter_campaigns', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ subject, body, subscriber_count: recipients.length }),
    });

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