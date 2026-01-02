# Personal Cloud - Advanced Desktop Environment

A modern, feature-rich personal cloud desktop environment built with React, TypeScript, and Tailwind CSS.

## Project Overview

Personal Cloud is an advanced web-based desktop environment with integrated AI assistants, file management, code editing, and security tools.

## Technologies Used

This project is built with:

- **Vite** - Ultra-fast build tool
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - High-quality UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend and authentication
- **Framer Motion** - Smooth animations

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd Personal-cloud

# Step 3: Install dependencies
npm i

# Step 4: Start the development server
npm run dev
```

## Development Options

### Local Development with IDE
Clone the repo and use your preferred IDE. Any pushed changes will be reflected in the repository.

### GitHub Codespaces
1. Navigate to the main page of your repository
2. Click "Code" (green button) near the top right
3. Select "Codespaces" tab and click "New codespace"
4. Edit files and commit your changes

### Direct GitHub Editing
- Navigate to any file
- Click the "Edit" button (pencil icon)
- Make changes and commit

## Features

- **Advanced AI Assistants**
  - CloudAi: ChatGPT/Grok-level general intelligence
  - AnonAi: KaliGPT-level cybersecurity expertise
  - KaliGPT: Penetration testing terminal

- **Desktop Environment**
  - File Manager with drag-and-drop
  - Code Editor
  - Notes Application
  - Web Browser
  - Terminal Emulator
  - Music Player
  - Photo Gallery
  - Calculator & More

- **Admin Features**
  - User management dashboard
  - Points system management
  - User statistics and analytics

- **Security & Privacy**
  - Supabase authentication
  - End-to-end encryption ready
  - Profile management
  - Activity history

## AI & LLM Integration

This project includes serverless proxies for LLM integration at:
- `/api/cloud-ai` - Cloud AI endpoint
- `/api/anon-ai` - Anonymous/Security AI endpoint
- `/api/cloud-ai-stream` - Streaming endpoint (SSE)

### Configuration

Copy `.env.example` to `.env` and set:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
```

Alternatively, use compatible endpoints:
- `LLM_API_KEY` - Alternative API key variable
- `OPENAI_API_URL` - Custom endpoint URL

### Local Development with Proxy

For local development with API access:

```bash
# Terminal 1: Start the dev proxy
npm run dev:proxy

# Terminal 2: Start the app
npm run dev
```

The proxy reads from `OPENAI_API_KEY` and exposes the streaming endpoints via SSE.

## Customization

### Disable Neon Theme

To disable the neon theme globally, remove the `neon-enabled` class from the app root in `src/App.tsx`.

## Deployment

### Vercel

The project is optimized for Vercel serverless deployments. Simply push to your connected repository and Vercel will auto-deploy.

### Other Platforms

The project can be deployed to any platform that supports Node.js:
- GitHub Pages (static build)
- Netlify
- AWS
- Google Cloud
- Azure
- Any Docker-compatible environment

## Project Structure

```
src/
├── components/
│   ├── desktop/          # Desktop environment components
│   ├── ui/               # shadcn-ui components
│   └── ...
├── pages/                # Page components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── integrations/         # External service integrations
└── App.tsx              # Root component

api/                      # Serverless API functions
public/                   # Static assets
supabase/                # Database migrations
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

