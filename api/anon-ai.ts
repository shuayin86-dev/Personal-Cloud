import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple Vercel-compatible serverless function that proxies to an LLM.
// Environment variables expected:
// - OPENAI_API_KEY or LLM_API_KEY
// - OPENAI_MODEL (optional, default provided)

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  // Basic safety filter: refuse obviously malicious prompts
  const blacklist = /(exploit|exploitative|attack|ddos|malware|rootkit|payload|crack|password cracking|bypass|unauthorized|phishing|sql injection|xss)/i;
  if (blacklist.test(prompt)) {
    res.status(400).json({ error: 'Prompt contains disallowed content. This assistant only provides defensive, lawful guidance.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const model = req.body?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = typeof req.body?.temperature === 'number' ? req.body.temperature : (process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) : 0.2);
  const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    res.status(500).json({ error: 'No LLM API key configured (OPENAI_API_KEY or LLM_API_KEY).' });
    return;
  }

  try {
    const body = {
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are Anon Ai, a defensive cybersecurity assistant. Provide high-level, lawful, ethical guidance only. Refuse to provide steps that enable illegal activity, exploitation, or unauthorized access. Provide tool recommendations and defensive best practices.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: temperature,
    };

    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!r.ok) {
      const text = await r.text();
      res.status(502).json({ error: 'Upstream LLM error', details: text });
      return;
    }

    const data = await r.json();
    // try to extract sensible text depending on provider
    let text = '';
    if (data.choices && Array.isArray(data.choices) && data.choices[0]) {
      const c = data.choices[0];
      if (c.message && c.message.content) text = c.message.content;
      else if (c.text) text = c.text;
    } else if (data.output || data.response) {
      text = data.output || data.response;
    } else {
      text = JSON.stringify(data);
    }

    res.status(200).json({ text });
  } catch (err: any) {
    res.status(500).json({ error: 'Proxy failed', details: err?.message || String(err) });
  }
}
