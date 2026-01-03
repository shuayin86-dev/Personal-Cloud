# Anon Ai & Cloud Ai - TGPT Features Implementation

## Overview
Both Anon Ai and Cloud Ai have been enhanced with powerful features from the `aandrew-me/tgpt` project, providing:
- **Multi-provider support** (OpenAI, Groq, Gemini, Deepseek)
- **Multiple operation modes** (code, shell, search, quiet, whole, normal)
- **Conversation history** management
- **Streaming & buffered responses**
- **Advanced prompt engineering** for specialized tasks

---

## 1. Multi-Provider Support

### Supported Providers

| Provider | API Key Env | Model Env | Endpoint | Speed | Cost |
|----------|-------------|-----------|----------|-------|------|
| **OpenAI** | `OPENAI_API_KEY` | `OPENAI_MODEL` | Custom via `OPENAI_URL` | Medium | Paid |
| **Groq** | `GROQ_API_KEY` | `GROQ_MODEL` | api.groq.com | ⚡ Fast | Freemium |
| **Gemini** | `GEMINI_API_KEY` | `OPENAI_MODEL` | generativelanguage.googleapis.com | Medium | Freemium |
| **Deepseek** | `DEEPSEEK_API_KEY` | `DEEPSEEK_MODEL` | api.deepseek.com | Medium | Paid |

### Switching Providers

**Request Body**:
```json
{
  "prompt": "Your question",
  "provider": "groq",
  "model": "mixtral-8x7b-32768"
}
```

**Environment Variable**:
```bash
export AI_PROVIDER=groq
```

**Default Fallback**: OpenAI (if provider not specified)

---

## 2. Operation Modes

Each mode uses specialized system prompts for optimal output:

### Mode: `normal` (Default)
**Use**: General conversation, explanations, guidance
```json
{
  "prompt": "Explain how firewalls work",
  "mode": "normal"
}
```

**System Prompt Focus**: Expert guidance, security best practices, real-world scenarios

---

### Mode: `code`
**Use**: Code generation without markdown formatting
```json
{
  "prompt": "Write a secure password hasher in Python",
  "mode": "code"
}
```

**System Prompt Specialization**:
- Outputs plain code without backticks or markdown
- No descriptions or explanations
- Assumes logical defaults for missing details
- Focus on security best practices

**Example Output**:
```
import hashlib
import os

def hash_password(password):
    salt = os.urandom(32)
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return salt + hashed
```

---

### Mode: `shell`
**Use**: Shell command generation
```json
{
  "prompt": "List all open ports on this system",
  "mode": "shell",
  "shell": true
}
```

**System Prompt Specialization**:
- Outputs single shell command without formatting
- No descriptions or warnings
- Combines multiple steps with `&&` or pipes
- OS-aware (assumes Linux/Unix)
- Valid commands only

**Example Output**:
```
sudo netstat -tulpn | grep LISTEN
```

---

### Mode: `search`
**Use**: Research, current information, synthesis
```json
{
  "prompt": "Latest zero-day vulnerabilities in 2025",
  "mode": "search",
  "find": true
}
```

**System Prompt Specialization**:
- Focuses on factual accuracy
- Encourages research-oriented responses
- Proper citation of sources
- Comprehensive explanations

---

### Mode: `quiet`
**Use**: No loading animations, direct response
```json
{
  "prompt": "Your question",
  "quiet": true
}
```

**Behavior**: Returns response without SSE streaming markers

---

### Mode: `whole`
**Use**: Buffer entire response before display
```json
{
  "prompt": "Your question",
  "whole": true
}
```

**Behavior**: Waits for complete response, returns all at once

---

## 3. Conversation History Management

### Sending Previous Messages

Include conversation context to maintain context across turns:

```json
{
  "prompt": "What are his major companies?",
  "prevMessages": [
    {
      "role": "user",
      "content": "Who is Elon Musk?"
    },
    {
      "role": "assistant",
      "content": "Elon Musk is an entrepreneur and technology executive born in South Africa..."
    }
  ]
}
```

### Implementation Pattern

1. **First Turn**: Send initial prompt with system message
2. **Subsequent Turns**: Include `prevMessages` array with prior conversation
3. **Storage**: Client stores conversation history for reuse

**Example Flow**:
```typescript
// Turn 1
const response1 = await fetch('/api/anon-ai', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "What is Zero Trust Architecture?",
    mode: "normal"
  })
});

// Turn 2 - Reference previous context
const response2 = await fetch('/api/anon-ai', {
  method: 'POST',
  body: JSON.stringify({
    prompt: "How do we implement it?",
    prevMessages: [
      { role: "user", content: "What is Zero Trust Architecture?" },
      { role: "assistant", content: "Zero Trust is..." }
    ]
  })
});
```

---

## 4. Streaming vs Buffered Responses

### Streaming (SSE)
**When**: Large responses, real-time display needed
```json
{
  "prompt": "Your question",
  "stream": true
}
```

**Response Format**:
```
data: {"chunk": "First "}
data: {"chunk": "part "}
data: {"chunk": "of "}
data: {"chunk": "response"}
event: done
data: {"done": true}
```

**Client Implementation**:
```typescript
const eventSource = new EventSource('/api/anon-ai?prompt=Your+question&stream=true');
eventSource.onmessage = (e) => {
  const data = JSON.parse(e.data);
  if (data.done) eventSource.close();
  else displayChunk(data.chunk);
};
```

---

### Buffered (Non-Streaming)
**When**: Complete response needed at once, simpler processing
```json
{
  "prompt": "Your question"
}
```

**Response Format**:
```json
{
  "text": "Complete response here",
  "mode": "normal"
}
```

---

## 5. Request Parameters Reference

### Core Parameters

| Parameter | Type | Required | Default | Example |
|-----------|------|----------|---------|---------|
| `prompt` | string | ✅ Yes | - | `"Explain XSS attacks"` |
| `mode` | string | ❌ No | `"normal"` | `"code"`, `"shell"`, `"search"` |
| `provider` | string | ❌ No | `"openai"` | `"groq"`, `"gemini"` |
| `model` | string | ❌ No | Provider default | `"mixtral-8x7b-32768"` |
| `temperature` | number | ❌ No | 0.2 (Anon), 0.7 (Cloud) | `0.5` |
| `top_p` | number | ❌ No | - | `0.9` |
| `stream` | boolean | ❌ No | `false` | `true` |
| `prevMessages` | array | ❌ No | `[]` | See conversation history |
| `preprompt` | string | ❌ No | Mode-specific | Custom system message |
| `quiet` | boolean | ❌ No | `false` | `true` |
| `whole` | boolean | ❌ No | `false` | `true` |
| `code` | boolean | ❌ No | `false` | `true` |
| `shell` | boolean | ❌ No | `false` | `true` |
| `find` | boolean | ❌ No | `false` | `true` |

---

## 6. Environment Variables

### LLM Configuration

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
OPENAI_URL=https://api.openai.com/v1/chat/completions

# Alternative: Generic LLM Key
LLM_API_KEY=your-key

# Provider Selection
AI_PROVIDER=openai  # Default provider

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=mixtral-8x7b-32768

# Gemini
GEMINI_API_KEY=AIza...

# Deepseek
DEEPSEEK_API_KEY=sk_...
DEEPSEEK_MODEL=deepseek-chat

# Model Behavior
TGPT_TEMPERATURE=0.7
TGPT_TOP_P=0.9
```

---

## 7. API Endpoints

### Anon Ai
**Endpoint**: `/api/anon-ai`
**Purpose**: Defensive cybersecurity expertise, hacker mindset, penetration testing
**System Prompt**: Elite defensive specialist with deep security knowledge

### Cloud Ai
**Endpoint**: `/api/cloud-ai`
**Purpose**: General assistance, coding, research, creative tasks
**System Prompt**: Helpful, knowledgeable, versatile assistant

---

## 8. Complete Request Examples

### Example 1: Generate Secure Code
```bash
curl -X POST http://localhost:3001/api/anon-ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a secure session token generator",
    "mode": "code",
    "provider": "groq"
  }'
```

### Example 2: Shell Command with History
```bash
curl -X POST http://localhost:3001/api/anon-ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "How do I set firewall rules for that?",
    "mode": "shell",
    "prevMessages": [
      {"role": "user", "content": "How to find open ports?"},
      {"role": "assistant", "content": "sudo netstat -tulpn | grep LISTEN"}
    ]
  }'
```

### Example 3: Streaming Response
```bash
curl -X POST http://localhost:3001/api/anon-ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain defense-in-depth strategy",
    "stream": true,
    "temperature": 0.5
  }' \
  --no-buffer
```

### Example 4: Multi-turn Conversation
```json
{
  "prompt": "How can organizations implement it effectively?",
  "mode": "normal",
  "prevMessages": [
    {
      "role": "user",
      "content": "What is incident response?"
    },
    {
      "role": "assistant",
      "content": "Incident response is a structured process for managing security events..."
    },
    {
      "role": "user",
      "content": "What are the key phases?"
    },
    {
      "role": "assistant",
      "content": "The key phases are: Detection, Analysis, Containment, Eradication, Recovery, Post-Incident"
    }
  ]
}
```

---

## 9. Error Handling

### Common Error Responses

**Missing Prompt**:
```json
{
  "error": "Missing prompt"
}
```

**Invalid API Key**:
```json
{
  "error": "No LLM API key configured. Set OPENAI_API_KEY, GROQ_API_KEY, GEMINI_API_KEY, or DEEPSEEK_API_KEY."
}
```

**Disallowed Content**:
```json
{
  "error": "Prompt contains disallowed content. This assistant only provides defensive, lawful guidance."
}
```

**Upstream Error**:
```json
{
  "error": "Upstream LLM error",
  "details": "Provider-specific error message"
}
```

---

## 10. Response Examples

### Normal Mode Response
```json
{
  "text": "Zero Trust Architecture is a security model that assumes no trust by default...",
  "mode": "normal"
}
```

### Code Mode Response
```json
{
  "text": "import hashlib\nimport secrets\n\ndef generate_session_token():\n    return secrets.token_urlsafe(32)",
  "mode": "code"
}
```

### Shell Mode Response
```json
{
  "text": "sudo nmap -sV -p- localhost | grep open",
  "mode": "shell"
}
```

---

## 11. Performance Tips

1. **Use Groq for Speed**: Fastest inference, freemium pricing
2. **Use OpenAI for Quality**: Best reasoning and instruction following
3. **Batch Similar Requests**: Group conversations to reuse context
4. **Stream for Large Responses**: Better UX for long outputs
5. **Set Temperature Appropriately**:
   - `0.2-0.3`: Deterministic (code, commands)
   - `0.5-0.7`: Balanced (general queries)
   - `0.8+`: Creative (brainstorming)

---

## 12. Feature Comparison: Anon Ai vs Cloud Ai

| Feature | Anon Ai | Cloud Ai |
|---------|---------|----------|
| **Domain Focus** | Cybersecurity | General Purpose |
| **Default Temp** | 0.2 (precise) | 0.7 (balanced) |
| **System Prompt** | Defensive security | Helpful assistant |
| **Code Generation** | Security-focused | General-purpose |
| **Shell Commands** | Linux-aware | General |
| **Multi-Provider** | ✅ Yes | ✅ Yes |
| **Streaming** | ✅ Yes | ✅ Yes |
| **Conversation History** | ✅ Yes | ✅ Yes |
| **Custom Prompts** | ✅ Yes | ✅ Yes |

---

## Changelog: TGPT Features Implementation

**Added Features**:
- ✅ Multi-provider support (OpenAI, Groq, Gemini, Deepseek)
- ✅ Operation modes (code, shell, search, quiet, whole, normal)
- ✅ Conversation history via `prevMessages`
- ✅ Streaming via Server-Sent Events (SSE)
- ✅ Specialized system prompts for each mode
- ✅ Temperature & top_p control
- ✅ Custom preprompt support
- ✅ Enhanced error handling
- ✅ Provider-specific body modifiers (for Gemini)
- ✅ Request body type safety with TypeScript interfaces

**Commits**:
- `bf89ebe` - Enhance anon-ai with tgpt features
- `6017751` - Enhance cloud-ai with tgpt features

---

## Next Steps

1. **Test Multi-Provider**: Try different providers to find optimal performance
2. **Implement UI**: Add mode selector buttons in AnonAiModal and CloudAiModal
3. **Persist History**: Store conversation history in localStorage or database
4. **Add Web Search**: Implement actual web search for search mode
5. **Image Generation**: Add image generation endpoints (Pollinations, Arta)
6. **Rate Limiting**: Implement rate limiting for production
7. **Caching**: Cache common queries to reduce API calls
