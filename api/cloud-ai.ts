import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverless proxy for CloudAi. Keeps safety filters in place and uses env keys.
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

  // Reject clearly malicious or exploitative prompts
  const blacklist = /(exploit|ddos|malware|phishing|password cracking|unauthorized access|bypass)/i;
  if (blacklist.test(prompt)) {
    res.status(400).json({ error: 'Prompt contains disallowed content.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    res.status(500).json({ error: 'No LLM API key configured (OPENAI_API_KEY or LLM_API_KEY).' });
    return;
  }

  try {
    const body = {
      model,
      messages: [
        { role: 'system', content: 'You are CloudAi, a helpful assistant. Follow safety policies and refuse to provide instructions that enable illegal activity.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
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
