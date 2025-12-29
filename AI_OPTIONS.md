AI Options (new)

- Model selector: In the AI modals you can now choose the model (gpt-4o, gpt-4, gpt-3.5). This is sent to the backend proxy as `model`.
- Temperature: Use the slider to control response randomness (0.00 — 1.00). This is sent as `temperature`.
- Sophistication: A presentation-level `sophistication` prop is exposed (`low|medium|high|very-high`) and forwarded to the proxy.
- Floating Cloud AI: A floating Cloud AI button sits at the bottom-right of the chat UI for quick access.

These options are UI-only controls that get forwarded to the serverless proxy endpoints (`/api/anon-ai` and `/api/cloud-ai-stream`). Ensure your backend proxy handles `model` and `temperature` fields if you want them applied to the LLM calls.
