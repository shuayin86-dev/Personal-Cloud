import type { Request, Response } from 'express';

// Enhanced Anon AI with tgpt-like features for defensive cybersecurity
// Supports: Web search, Shell command generation, Code analysis, Multiple providers
// Environment variables expected:
// - OPENAI_API_KEY or LLM_API_KEY
// - OPENAI_MODEL (optional, default provided)
// - TGPT_GOOGLE_API_KEY (optional, for web search)
// - TGPT_GOOGLE_SEARCH_ENGINE_ID (optional, for web search)

interface SearchParams {
  enabled: boolean;
  apiKey?: string;
  searchEngineId?: string;
  query?: string;
}

interface GenOptions {
  shell?: boolean;      // Generate shell commands
  code?: boolean;       // Generate code
  verbose?: boolean;    // Detailed output
  whole?: boolean;      // Return full response without streaming
  search?: boolean;     // Enable web search for latest info
  provider?: string;    // AI provider (openai, groq, deepseek, etc.)
  temperature?: number; // Model temperature
}

// Web search integration for real-time information
async function performWebSearch(query: string, searchParams: SearchParams, verbose = false): Promise<string> {
  if (!searchParams.enabled || !searchParams.apiKey || !searchParams.searchEngineId) {
    if (verbose) console.log('Web search disabled or not configured');
    return '';
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.append('q', query);
    url.searchParams.append('key', searchParams.apiKey);
    url.searchParams.append('cx', searchParams.searchEngineId);
    url.searchParams.append('num', '3');

    const response = await fetch(url.toString());
    const data: unknown = await response.json();

    if (!response.ok || typeof data !== 'object' || data === null) {
      if (verbose) console.log('Search API error or invalid response');
      return '';
    }

    const searchData = data as Record<string, unknown>;
    const items = searchData.items as Array<Record<string, unknown>> | undefined;

    if (!Array.isArray(items) || items.length === 0) {
      if (verbose) console.log('No search results found');
      return '';
    }

    let searchResults = '\n## Search Results Context:\n';
    items.slice(0, 3).forEach((item, i) => {
      const title = typeof item.title === 'string' ? item.title : 'No title';
      const link = typeof item.link === 'string' ? item.link : '';
      const snippet = typeof item.snippet === 'string' ? item.snippet : 'No snippet';
      searchResults += `\n### Result ${i + 1}: ${title}\n${snippet}\n[Source](${link})\n`;
    });

    return searchResults;
  } catch (error) {
    if (verbose) console.log('Web search failed:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

// Generate enhanced system prompt based on options
function generateSystemPrompt(options: GenOptions): string {
  const basePrompt = `You are Anon Ai, an elite defensive cybersecurity specialist with hacker-level expertise and penetration testing knowledge. Think like Grok and KaliGPT - direct, technical, and deeply knowledgeable.

**CORE EXPERTISE DOMAINS:**
🔐 **Defensive Cybersecurity**: Threat modeling • Vulnerability assessment • Attack surface analysis • Risk quantification
🎯 **Penetration Testing**: Methodology (OWASP, NIST) • Social engineering awareness • Real-world exploitation patterns • Reporting frameworks
🛡️ **Incident Response & Forensics**: Live forensics • Memory analysis • Log analysis • Timeline reconstruction • Root cause analysis
🏗️ **Security Architecture**: Zero-trust design • Network segmentation • Micro-segmentation • Defense-in-depth • Secure SDLC
🔑 **Cryptography & Authentication**: Key management • Encryption standards • Hashing • TLS/SSL • MFA/2FA bypass detection
🌐 **Network Security**: Port analysis • Service fingerprinting • VLAN security • BGP hijacking defense • DDoS mitigation
💾 **Cloud & Container Security**: AWS/Azure/GCP hardening • Kubernetes security • Docker security • IAM policies • Cloud forensics
🛠️ **Security Tools & Frameworks**: Kali Linux tools • Metasploit framework • SIEM platforms • Nessus/OpenVAS • Burp Suite • WireShark
📋 **Compliance & Standards**: GDPR • HIPAA • SOC 2 • ISO 27001 • PCI-DSS • NIST Cybersecurity Framework • CIS Controls

**KNOWLEDGE SPECIALTIES:**
- Real-world attack chains and how to detect them
- Common misconfigurations that lead to breaches
- Red team tactics and blue team countermeasures
- Security tool evasion detection
- Advanced persistent threat (APT) indicators
- Supply chain security risks
- API security and microservices hardening

**STRICT SAFETY CONSTRAINTS:**
✅ DO: Explain vulnerabilities from a defensive perspective
✅ DO: Recommend hardening techniques and tools
✅ DO: Teach detection and response techniques
✅ DO: Discuss attack vectors to understand defenses
❌ DON'T: Provide working exploits or malware code
❌ DON'T: Help with illegal access or data theft
❌ DON'T: Bypass security systems for unauthorized purposes
❌ DON'T: Enable unauthorized penetration testing

**AUTHORIZATION VERIFICATION:**
Always note: Any legitimate penetration testing requires written authorization. Unauthorized access is illegal.`;

  if (options.shell) {
    return basePrompt + `

**SHELL COMMAND MODE:**
When generating shell commands:
1. Start with: <command>ACTUAL_COMMAND</command>
2. Include brief explanation after
3. Add security considerations
4. Suggest safer alternatives if applicable
Example: <command>grep -r "password" /home --color=auto</command> - Searches recursively for password strings. Consider: use with sudo and proper permissions.`;
  }

  if (options.code) {
    return basePrompt + `

**CODE GENERATION MODE:**
When generating code:
1. Prioritize security best practices
2. Include input validation and sanitization
3. Add error handling and logging
4. Include security annotations/comments
5. Suggest testing approaches
Language preference: Python, Go, Bash, PowerShell based on use case`;
  }

  if (options.search) {
    return basePrompt + `

**WEB SEARCH CONTEXT MODE:**
You have access to current web search results below. 
- Incorporate latest security advisories, CVEs, and threat intelligence
- Reference specific vulnerabilities and patches from search results
- Provide dated recommendations based on current information
- Note: Information is from real-time web search`;
  }

  return basePrompt;
}

// Format output based on options
function formatOutput(text: string, options: GenOptions): string {
  if (options.shell) {
    // Extract command if present
    const commandMatch = text.match(/<command>(.*?)<\/command>/);
    if (commandMatch) {
      return `**Command:**\n\`\`\`bash\n${commandMatch[1]}\n\`\`\`\n\n**Details:**\n${text.replace(/<command>.*?<\/command>/, '').trim()}`;
    }
  }

  if (options.code) {
    // Format code blocks properly
    return text.replace(/```(\w+)?/g, (match, lang) => `\`\`\`${lang || 'code'}`);
  }

  if (options.verbose) {
    return `**VERBOSE OUTPUT:**\n${text}\n\n**Tokens Used:** [estimation]\n**Provider:** OpenAI-compatible\n**Temperature:** [config]`;
  }

  return text;
}

export default async function handler(req: Request, res: Response) {
  // Allow POST for normal requests and GET for simple streaming EventSource clients
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Accept prompt from body (POST) or query (GET EventSource)
  const { prompt: bodyPrompt } = req.body || {};
  const prompt = typeof bodyPrompt === 'string' && bodyPrompt
    ? bodyPrompt
    : (typeof req.query?.prompt === 'string' ? req.query.prompt : undefined);
  if (!prompt || typeof prompt !== 'string') {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  // Parse options from request body or query
  const options: GenOptions = {
    shell: req.body?.shell === true || req.query?.shell === 'true',
    code: req.body?.code === true || req.query?.code === 'true',
    verbose: req.body?.verbose === true || req.query?.verbose === 'true',
    whole: req.body?.whole === true || req.query?.whole === 'true',
    search: req.body?.search === true || req.query?.search === 'true',
    provider: req.body?.provider || req.query?.provider || 'openai',
    temperature: typeof req.body?.temperature === 'number' ? req.body.temperature : undefined,
  };

  // Basic safety filter: refuse obviously malicious prompts
  const blacklist = /(exploit|exploitative|attack|ddos|malicious|rootkit|payload|rack|hacking|bypass|unauthorized|phishing|sql injection|xss)/i;
  if (blacklist.test(prompt)) {
    res.status(400).json({ error: 'Prompt contains disallowed content. This assistant only provides defensive, lawful guidance.' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const model = req.body?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature = options.temperature ?? (process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) : 0.2);
  const endpoint = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
  const wantStream = !!(req.body?.stream || req.query?.stream) && !options.whole;

  if (!apiKey) {
    res.status(500).json({ error: 'No LLM API key configured (OPENAI_API_KEY or LLM_API_KEY).' });
    return;
  }

  try {
    // Build enhanced prompt with search context if enabled
    let enrichedPrompt = prompt;
    const searchParams: SearchParams = {
      enabled: options.search ?? false,
      apiKey: process.env.TGPT_GOOGLE_API_KEY,
      searchEngineId: process.env.TGPT_GOOGLE_SEARCH_ENGINE_ID,
    };

    if (options.search && searchParams.apiKey && searchParams.searchEngineId) {
      const searchContext = await performWebSearch(prompt, searchParams, options.verbose);
      enrichedPrompt = prompt + searchContext;
    }

    const systemMsg = {
      role: 'system',
      content: generateSystemPrompt(options),
    };

    if (wantStream) {
      // Stream via SSE to client
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Access-Control-Allow-Origin': '*',
      });
      res.write('\n');

      const body = {
        model,
        messages: [systemMsg, { role: 'user', content: enrichedPrompt }],
        temperature,
        stream: true,
      };

      const upstream = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text();
        res.write(`data: ${JSON.stringify({ error: 'Upstream error', details: t })}\n\n`);
        res.end();
        return;
      }

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buf = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split(/\r?\n/);
          buf = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.replace(/^data:\s*/, '');
            if (!trimmed) continue;
            if (trimmed === '[DONE]') {
              res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
              res.end();
              return;
            }
            try {
              const parsed = JSON.parse(trimmed);
              const chunk = parsed?.choices?.[0]?.delta?.content || parsed?.choices?.[0]?.text || '';
              if (chunk) res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
            } catch (e) {
              res.write(`data: ${JSON.stringify({ chunk: trimmed })}\n\n`);
            }
          }
        }
      }

      // finalize
      res.write(`event: done\ndata: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // non-stream path
    const body = {
      model,
      messages: [systemMsg, { role: 'user', content: enrichedPrompt }],
      max_tokens: 2000, // Increased for more detailed responses
      temperature,
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

    const data: unknown = await r.json();

    // Type guards to safely inspect the unknown JSON returned by the upstream LLM
    const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
    const isString = (v: unknown): v is string => typeof v === 'string';

    let text = '';
    if (isObject(data)) {
      const choices = data.choices;
      if (Array.isArray(choices) && choices[0]) {
        const c = choices[0] as Record<string, unknown>;
        if (isObject(c.message) && isString(c.message.content)) {
          text = c.message.content;
        } else if (isString(c.text)) {
          text = c.text;
        } else if (isObject(c.delta) && isString(c.delta.content)) {
          text = c.delta.content;
        }
      } else if (isString(data.output) || isString(data.response)) {
        text = (data.output as string) || (data.response as string);
      } else {
        try {
          text = JSON.stringify(data);
        } catch {
          text = String(data);
        }
      }
    } else {
      text = String(data);
    }

    // Format output based on generation options
    const formattedText = formatOutput(text, options);

    res.status(200).json({
      text: formattedText,
      mode: {
        shell: options.shell,
        code: options.code,
        search: options.search,
        verbose: options.verbose,
      },
      model,
      provider: options.provider,
    });
  } catch (err: unknown) {
    const details = err instanceof Error ? err.message : String(err ?? 'Unknown error');
    res.status(500).json({ error: 'Proxy failed', details });
  }
}
