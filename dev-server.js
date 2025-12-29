import express from 'express';
import bodyParser from 'body-parser';

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
      } catch (e) {}
      res.end();
    });

    r.body.on('error', (err) => {
      try { res.write(`data: ${JSON.stringify({ chunk: '\n[stream error]' })}\n\n`); } catch (e) {}
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

app.listen(port, () => console.log(`Dev proxy listening on ${port}`));
