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

- **Virtual Pet Companion AI** ✨ NEW
  - Interactive AI character on your desktop
  - Mood system with dynamic reactions
  - Task reminders and congratulations
  - Auto-ticking lifecycle system
  - Audio feedback and animations
  - State persistence

- **Customizable 3D Desktop Environment** ✨ NEW
  - 5 unique visual themes (Space, Ocean, Forest, Neon, Abstract)
  - Mouse-interactive 3D objects
  - Real-time GPU-accelerated rendering
  - Responsive design for all screen sizes
  - Smooth animations and effects

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

## New Features (Virtual Pet & 3D Desktop)

### Virtual Pet Companion AI

Meet your personal AI companion that lives on your desktop!

- **Interactive Interactions**: Pet, feed, talk, or play with your companion
- **Mood System**: Your pet's mood changes based on stats (energy, happiness, hunger)
- **Task Management**: Pet reminds you of tasks and celebrates completions
- **Persistent State**: Your pet remembers everything across sessions
- **Audio Feedback**: Satisfying sounds for all interactions

**Quick Start**:
```tsx
import { VirtualPet } from "@/components/desktop/VirtualPet";

<VirtualPet isFloating={true} onClose={() => setShowPet(false)} />
```

**Learn More**: See [VIRTUAL_PET_3D_GUIDE.md](./VIRTUAL_PET_3D_GUIDE.md)

### Customizable 3D Desktop Environment

Transform your desktop with stunning interactive 3D visualizations!

**5 Unique Themes**:
- 🌌 **Space**: Dark cosmic environment with stars and nebula
- 🌊 **Ocean**: Serene underwater atmosphere
- 🌲 **Forest**: Natural green environment with trees
- ⚡ **Neon**: Cyberpunk grid pattern
- 🎨 **Abstract**: Colorful geometric shapes

**Features**:
- Real-time 3D rendering (60 FPS)
- Mouse-interactive objects
- Responsive to all screen sizes
- Smooth animations and lighting
- Full-screen immersion mode

**Quick Start**:
```tsx
import { Desktop3D } from "@/components/desktop/Desktop3D";

<Desktop3D theme="space" onCustomize={() => setShowCustomization(true)} />
```

**Learn More**: See [VIRTUAL_PET_3D_QUICKREF.md](./VIRTUAL_PET_3D_QUICKREF.md)

### Documentation & Examples

- **[VIRTUAL_PET_3D_GUIDE.md](./VIRTUAL_PET_3D_GUIDE.md)** - Comprehensive feature guide
- **[VIRTUAL_PET_3D_QUICKREF.md](./VIRTUAL_PET_3D_QUICKREF.md)** - Quick reference & cheatsheet
- **[VIRTUAL_PET_3D_EXAMPLES.tsx](./VIRTUAL_PET_3D_EXAMPLES.tsx)** - 10 working examples
- **[VIRTUAL_PET_3D_COMPLETION.md](./VIRTUAL_PET_3D_COMPLETION.md)** - Implementation summary

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

