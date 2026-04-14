const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const router = express.Router();

const DATA_DIR = path.join(__dirname, 'data');
const NEWSLETTER_STORE_PATH = path.join(DATA_DIR, 'newsletter.json');

const contactEmail = 'efa.anglictina@gmail.com';

const DEFAULT_SMTP = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'efa.anglictina@gmail.com',
  pass: 'bfnpmiwfcftlmzdi',
  from: 'efa.anglictina@gmail.com',
};

const getSmtpSettings = () => {
  try {
    if (fs.existsSync(NEWSLETTER_STORE_PATH)) {
      const raw = fs.readFileSync(NEWSLETTER_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SMTP,
        ...(parsed.smtp || {}),
      };
    }
  } catch (err) {
    console.error('Error reading SMTP settings:', err.message);
  }
  return DEFAULT_SMTP;
};

const createTransport = (smtpConfig = {}) => {
  const host = smtpConfig.host || DEFAULT_SMTP.host;
  const port = Number(smtpConfig.port || DEFAULT_SMTP.port || 587);
  const user = smtpConfig.user || DEFAULT_SMTP.user;
  const pass = smtpConfig.pass || DEFAULT_SMTP.pass;
  const secure = typeof smtpConfig.secure === 'boolean' ? smtpConfig.secure : false;

  if (!host || !user || !pass) {
    throw new Error('Chybí SMTP konfigurace (host, user, pass)');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
};

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message, courseType } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Vyplň prosím jméno, e-mail, předmět a zprávu' });
    }

    const smtpSettings = getSmtpSettings();
    const transport = createTransport(smtpSettings);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        <h2 style="color: #1e3a8a; margin-bottom: 20px;">Nová zpráva z webu</h2>
        
        <div style="background-color: white; padding: 15px; margin-bottom: 15px; border-radius: 5px;">
          <p style="margin: 5px 0;"><strong>Jméno:</strong> ${String(name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <p style="margin: 5px 0;"><strong>E-mail:</strong> ${String(email || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <p style="margin: 5px 0;"><strong>Telefon:</strong> ${String(phone || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'Neuvedeno'}</p>
          <p style="margin: 5px 0;"><strong>Typ kurzu:</strong> ${String(courseType || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') || 'Neuvedeno'}</p>
          <p style="margin: 5px 0;"><strong>Předmět:</strong> ${String(subject || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>

        <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #1e3a8a;">
          <h3 style="color: #1e3a8a; margin-top: 0;">Zpráva:</h3>
          <p style="white-space: pre-wrap; color: #333;">${String(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
        </div>

        <p style="margin-top: 20px; font-size: 12px; color: #666; text-align: center;">Tato zpráva byla odeslána z webu English for All</p>
      </div>
    `;

    const info = await transport.sendMail({
      from: smtpSettings.from || smtpSettings.user,
      to: contactEmail,
      replyTo: email,
      subject: `[English for All] ${subject}`,
      html: htmlContent,
    });

    console.log(`Contact form email sent:`, info.messageId);

    res.json({
      success: true,
      message: 'Zpráva byla úspěšně odeslána. Brzy se vám ozveme!',
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({
      error: err.message || 'Nepodařilo se odeslat zprávu',
    });
  }
});

module.exports = router;
