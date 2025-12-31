import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';

const app = express();
const port = process.env.DEV_PROXY_PORT || 3001;
app.use(bodyParser.json());

const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const blacklist = /(exploit|ddos|malware|phishing|password cracking|unauthorized access|bypass)/i;

app.post('/api/anon-ai', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (blacklist.test(prompt)) return res.status(400).json({ error: 'Disallowed prompt' });
  if (!apiKey) return res.status(500).json({ error: 'No API key in env' });

  try {
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are Anon Ai, a defensive cybersecurity assistant. Provide high-level, lawful guidance only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 800,
      temperature: 0.2,
    };
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    let text = '';
    if (data.choices && data.choices[0]) {
      text = data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data);
    } else text = JSON.stringify(data);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
});

app.post('/api/cloud-ai', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (blacklist.test(prompt)) return res.status(400).json({ error: 'Disallowed prompt' });
  if (!apiKey) return res.status(500).json({ error: 'No API key in env' });

  try {
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are CloudAi, a helpful assistant. Follow safety policies.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    let text = '';
    if (data.choices && data.choices[0]) {
      text = data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data);
    } else text = JSON.stringify(data);
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
});

// SSE stream endpoint: calls LLM once, then streams chunks
app.post('/api/cloud-ai-stream', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (blacklist.test(prompt)) return res.status(400).json({ error: 'Disallowed prompt' });
  if (!apiKey) return res.status(500).json({ error: 'No API key in env' });

  try {
    // Use OpenAI-style streaming: request stream:true and proxy chunks to EventSource client
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are CloudAi, a helpful assistant. Follow safety policies.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'Upstream LLM error', details: txt });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    // stream NDJSON-like chunks from upstream and forward content diffs
    let buffer = '';
    r.body.on('data', (chunk) => {
      buffer += chunk.toString();
      let lines = buffer.split(/\n\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        const l = line.trim();
        if (!l) continue;
        // upstream lines may start with "data:"
        const dataLine = l.replace(/^data:\s*/i, '');
        if (dataLine === '[DONE]') {
          res.write('event: done\ndata: {}\n\n');
          res.end();
          return;
        }
        try {
          const parsed = JSON.parse(dataLine);
          // OpenAI chat streaming provides delta pieces
          const delta = parsed.choices?.[0]?.delta?.content || '';
          if (delta) {
            res.write(`data: ${JSON.stringify({ chunk: delta })}\n\n`);
          }
        } catch (e) {
          // if not JSON, forward raw
          res.write(`data: ${JSON.stringify({ chunk: dataLine })}\n\n`);
        }
      }
    });

    r.body.on('end', () => {
      try {
        res.write('event: done\ndata: {}\n\n');
      } catch (e) { console.debug('dev-server: error in handler', e); }
      res.end();
    });

    r.body.on('error', (err) => {
      try { res.write(`data: ${JSON.stringify({ chunk: '\n[stream error]' })}\n\n`); } catch (e) { console.debug('dev-server: failed to write stream error', e); }
      res.end();
    });
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
});

// Support GET for EventSource streaming (EventSource uses GET)
app.get('/api/cloud-ai-stream', async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
  if (blacklist.test(String(prompt))) return res.status(400).json({ error: 'Disallowed prompt' });
  if (!apiKey) return res.status(500).json({ error: 'No API key in env' });

  try {
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are CloudAi, a helpful assistant. Follow safety policies.' },
        { role: 'user', content: String(prompt) },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    };
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    let text = '';
    if (data.choices && data.choices[0]) {
      text = data.choices[0].message?.content || data.choices[0].text || JSON.stringify(data);
    } else text = JSON.stringify(data);

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const chunkSize = 120;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      await new Promise((r) => setTimeout(r, 80));
    }
    res.write('event: done\ndata: {}\n\n');
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Proxy failed', details: err.message });
  }
});

// Contact form endpoint - tries SendGrid, falls back to SMTP/sendmail via nodemailer
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing name, email or message' });

  const recipient = process.env.CONTACT_RECIPIENT || 'bobclein1@gmail.com';
  const sendGridKey = process.env.SENDGRID_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  const plain = `Contact form message from ${name} <${email}>:\n\n${message}`;
  const html = `<p><strong>From:</strong> ${name} &lt;${email}&gt;</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br/>')}</p>`;

  try {
    // Try SendGrid first
    if (sendGridKey) {
      const payload = {
        personalizations: [{ to: [{ email: recipient }] }],
        from: { email: process.env.SENDGRID_FROM || 'no-reply@personalcloud.local', name: 'PersonalCloud Contact' },
        subject: `New contact message from ${name}`,
        content: [
          { type: 'text/plain', value: plain },
          { type: 'text/html', value: html },
        ],
      };

      const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sendGridKey}` },
        body: JSON.stringify(payload),
      });

      if (r.status >= 200 && r.status < 300) {
        console.log('Contact: sent via SendGrid');
        return res.json({ ok: true, via: 'sendgrid' });
      }

      const txt = await r.text();
      console.error('SendGrid send failed', r.status, txt);
      // continue to fallback
    }

    // Fallback: SMTP via nodemailer
    if (smtpHost || process.env.SMTP_SENDMAIL === 'true') {
      let transporter;
      if (smtpHost) {
        transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort || 587,
          secure: !!smtpSecure,
          auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
        });
      } else {
        transporter = nodemailer.createTransport({ sendmail: true, newline: 'unix', path: process.env.SENDMAIL_PATH || '/usr/sbin/sendmail' });
      }

      const mail = {
        from: process.env.SMTP_FROM || 'PersonalCloud <no-reply@personalcloud.local>',
        to: recipient,
        subject: `New contact message from ${name}`,
        text: plain,
        html,
      };

      const info = await transporter.sendMail(mail);
      console.log('Contact: sent via SMTP/sendmail', info && info.messageId ? { messageId: info.messageId } : info);
      // If using Ethereal-like transport, include preview URL when available
      const preview = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : undefined;
      return res.json({ ok: true, via: smtpHost ? 'smtp' : 'sendmail', preview });
    }

    // Development fallback: create Ethereal test account to simulate delivery
    if (process.env.NODE_ENV !== 'production') {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const mail = {
          from: `Ethereal Test <${testAccount.user}>`,
          to: recipient,
          subject: `New contact message from ${name}`,
          text: plain,
          html,
        };

        const info = await transporter.sendMail(mail);
        const preview = nodemailer.getTestMessageUrl(info);
        console.log('Contact: sent via Ethereal test account, preview URL:', preview);
        return res.json({ ok: true, via: 'ethereal', preview });
      } catch (err) {
        console.error('Ethereal send failed', err);
        // continue to error below
      }
    }

    // Nothing configured
    return res.status(500).json({ error: 'No mailer configured. Set SENDGRID_API_KEY or SMTP_HOST/SMTP_SENDMAIL to enable sending emails, or run in dev mode to use a test Ethereal account.' });
  } catch (err) {
    console.error('Contact send error', err);
    return res.status(500).json({ error: 'Internal error', details: err.message });
  }
});

// Health and root endpoints to avoid "Cannot GET /" when visiting the proxy
app.get('/health', (req, res) => res.json({ ok: true, version: process.env.npm_package_version || 'dev' }));

app.get('/', (req, res) => {
  res.send(`<html><body style="font-family:system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;">
    <h2>Dev Proxy Running</h2>
    <p>Available API endpoints:</p>
    <ul>
      <li><code>/api/contact</code></li>
      <li><code>/api/cloud-ai</code> (POST proxy)</li>
      <li><code>/api/anon-ai</code> (POST proxy)</li>
      <li><code>/api/cloud-ai-stream</code> (POST/GET streaming proxy)</li>
    </ul>
    <p>Frontend (Vite) typically runs on port 8080; this proxy is for API calls on port ${port}.</p>
  </body></html>`);
});

app.listen(port, () => console.log(`Dev proxy listening on ${port}`));
