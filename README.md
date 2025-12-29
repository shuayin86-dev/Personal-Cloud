# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b5057872-c375-44d9-9c78-05e0fa3cb76c

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b5057872-c375-44d9-9c78-05e0fa3cb76c) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b5057872-c375-44d9-9c78-05e0fa3cb76c) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Anon Ai / LLM proxy

This project includes a simple serverless proxy at `/api/anon-ai` that forwards prompts to an LLM. To use it set environment variables (copy `.env.example` to `.env`):

- `OPENAI_API_KEY` (or `LLM_API_KEY`) — your OpenAI-compatible API key
- `OPENAI_MODEL` — optional model name
- `OPENAI_API_URL` — optional custom endpoint

Local dev:

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

Note: the serverless function is written for Vercel-style deployments.

For pure Vite local dev you can run the included Express dev proxy which exposes `/api/anon-ai`, `/api/cloud-ai`, and `/api/cloud-ai-stream` (SSE):

```bash
# run dev proxy (separate terminal)
npm run dev:proxy

# in another terminal, run the app
npm run dev
```

The proxy reads `OPENAI_API_KEY` from your environment; the stream endpoint uses SSE (`/api/cloud-ai-stream?prompt=...`).

To disable the neon theme globally, remove the `neon-enabled` class from the app root in `src/App.tsx`.
