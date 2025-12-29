import type { VercelRequest, VercelResponse } from '@vercel/node';

// SSE streaming proxy to OpenAI (Chat Completions streaming)
export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  const prompt = (req.query && (req.query.prompt || req.body?.prompt)) || '';
  const model = (req.query && req.query.model) || req.body?.model || process.env.OPENAI_MODEL || 'gpt-4o';
  const temperature = Number((req.query && req.query.temperature) || req.body?.temperature || 0.2);
  const sophistication = (req.query && req.query.sophistication) || req.body?.sophistication || 'very-high';

  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const blacklist = /(exploit|ddos|malware|phishing|password cracking|unauthorized access|bypass)/i;
  if (blacklist.test(String(prompt))) {
    res.status(400).json({ error: 'Prompt contains disallowed content.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

  if (!apiKey) {
    res.status(500).json({ error: 'No LLM API key configured.' });
    return;
  }

  // Set SSE headers
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('\n');

  try {
    const body = {
      model,
      messages: [
        { role: 'system', content: `Sophistication:${sophistication}. You are CloudAi, a helpful assistant. Follow safety policies.` },
        { role: 'user', content: prompt },
      ],
      temperature: temperature || 0.2,
      stream: true,
    } as any;

    const openaiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!openaiRes.ok || !openaiRes.body) {
      const t = await openaiRes.text();
      res.write(`data: ${JSON.stringify({ error: 'Upstream error', details: t })}\n\n`);
      res.end();
      return;
    }

    // Stream chunks from OpenAI to client as SSE `data: {chunk:...}` events
    const reader = openaiRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let buf = '';

    while (!done) {
      const { value, done: d } = await reader.read();
      done = !!d;
      if (value) {
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split(/\r?\n/);
        buf = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.replace(/^data:\s*/, '');
          if (!trimmed) continue;
          if (trimmed === '[DONE]') {
            // signal done and close
            res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
            res.end();
            return;
          }
          try {
            const parsed = JSON.parse(trimmed);
            // OpenAI streaming format: choices[].delta.content
            const chunk = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.text || '';
            if (chunk) {
              res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            }
          } catch (e) {
            // not JSON, forward raw
            res.write(`data: ${JSON.stringify({ chunk: trimmed })}\n\n`);
          }
        }
      }
    }

    // finished
    res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: any) {
    try {
      res.write(`data: ${JSON.stringify({ error: err?.message || String(err) })}\n\n`);
    } catch (e) {}
    res.end();
  }
}
