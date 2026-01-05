# Virtual Pet Companion & 3D Desktop Features Guide

## Overview

This document provides a comprehensive guide to the newly implemented Virtual Pet Companion AI and Customizable 3D Desktop Environment features in the Personal Cloud application.

## Features

### 1. Virtual Pet Companion AI

A playful AI character that lives on your desktop and interacts with you throughout your workflow.

#### Key Components

**File**: `src/lib/virtual-pet-service.ts`
**Component**: `src/components/desktop/VirtualPet.tsx`
**Styles**: `src/components/desktop/VirtualPet.css`

#### Features

- **Pet Moods**: The pet has 5 different mood states based on its internal stats
  - Happy: When happiness and energy are high
  - Excited: When happiness is very high and energy is good
  - Neutral: Default state
  - Tired: When energy is low
  - Sad: When hunger is high or happiness is low

- **Stats System**
  - Energy (0-100): Decreases over time and with play
  - Happiness (0-100): Increases with interactions, decreases over time
  - Hunger (0-100): Increases over time, decreases with feeding
  - Uptime: Tracks total time pet is active

- **Interactive Actions**
  ```typescript
  - Pet: Brief affectionate interaction (+15 happiness)
  - Feed: Reduce hunger (-40 hunger, +10 energy)
  - Talk: Chat with your pet (+20 happiness)
  - Play: Energetic interaction (-30 energy, +40 happiness)
  ```

- **Task Management**
  - **Remind Task**: Pet reminds you of important tasks
  - **Congratulate**: Pet celebrates when you complete tasks
  - Each interaction generates unique responses from the pet

- **Auto-Tick System**: Pet stats decay naturally over time
  - Runs every 10 seconds (adjustable)
  - Creates a living, dynamic companion experience

#### Usage

```tsx
import { VirtualPet } from "@/components/desktop/VirtualPet";

<VirtualPet
  isFloating={true}
  onClose={() => setShowVirtualPet(false)}
  onTaskReminder={(taskName) => {
    toast.info(`🐾 Companion: Don't forget about "${taskName}"!`);
  }}
/>
```

#### VirtualPetService API

```typescript
// Create a pet
const petService = new VirtualPetService("Companion");

// Get current state
const state = petService.getPetState();

// Interactions
petService.interact("pet"); // Returns PetResponse
petService.remindTask("Task Name");
petService.congratulateTask("Task Name");

// Time management
petService.tickTime(1); // Tick 1 minute
petService.startAutoTick(10000); // Auto-tick every 10 seconds
petService.stopAutoTick();

// Persistence
const saved = petService.savePetState(); // Get JSON string
petService.loadPetState(saved); // Load from JSON string
```

### 2. Customizable 3D Desktop Environment

An interactive 3D visualization powered by Three.js that transforms your desktop background.

#### Key Components

**Component**: `src/components/desktop/Desktop3D.tsx`
**Customization Modal**: `src/components/desktop/Desktop3DCustomization.tsx`

#### Features

- **5 Unique Themes**

  1. **Space**
     - Dark cosmic environment
     - Thousands of twinkling stars
     - Nebula effects with purple/blue gradients
     - Perfect for focus and concentration

  2. **Ocean**
     - Serene underwater atmosphere
     - Blue gradient background
     - Floating cyan particles
     - Calming and peaceful

  3. **Forest**
     - Natural green environment
     - Procedural trees
     - Green and brown color palette
     - Organic and earthy feel

  4. **Neon**
     - Cyberpunk aesthetic
     - Glowing grid pattern
     - Dark background with bright accents
     - Futuristic vibe

  5. **Abstract**
     - Colorful geometric shapes
     - Various 3D geometries (cubes, spheres, toruses)
     - Dynamic colors
     - Modern and playful

- **Interactive Features**
  - Mouse tracking: 3D objects follow your cursor
  - Real-time rendering at 60 FPS
  - Responsive to window resizing
  - Smooth animations and transitions
  - Dynamic lighting and shadows

- **Customization Modal**
  - Visual theme previews
  - Display settings toggle
  - Theme information and descriptions

#### Usage

```tsx
import { Desktop3D } from "@/components/desktop/Desktop3D";
import Desktop3DCustomization from "@/components/desktop/Desktop3DCustomization";

// Display 3D Desktop
<Desktop3D 
  theme="space"
  onCustomize={() => setShowCustomization(true)}
/>

// Customization Dialog
<Desktop3DCustomization
  currentTheme={currentTheme}
  onThemeChange={setCurrentTheme}
  isOpen={isOpen}
  onOpenChange={setIsOpen}
/>
```

#### Theme Management

```typescript
type Desktop3DTheme = "space" | "ocean" | "forest" | "neon" | "abstract";

const themeConfigs = {
  space: { name: "Space", description: "...", icon: "🌌" },
  ocean: { name: "Ocean", description: "...", icon: "🌊" },
  // ...
};
```

## Integration with Desktop Page

Both features are integrated into the main Desktop page (`src/pages/Desktop.tsx`):

### Virtual Pet Integration

```tsx
// State management
const [showVirtualPet, setShowVirtualPet] = useState(true);

// Component
{showVirtualPet && (
  <VirtualPet
    isFloating={true}
    onClose={() => setShowVirtualPet(false)}
    onTaskReminder={(taskName) => {
      toast.info(`🐾 Companion: Don't forget about "${taskName}"!`);
    }}
  />
)}

// Show button when pet is hidden
{!showVirtualPet && (
  <button onClick={() => setShowVirtualPet(true)}>
    🐾 Pet
  </button>
)}
```

### 3D Desktop Integration

```tsx
// State management
const [show3DDesktop, setShow3DDesktop] = useState(false);
const [current3DTheme, setCurrent3DTheme] = useState<Desktop3DTheme>("space");

// Fullscreen 3D environment
{show3DDesktop && (
  <div className="fixed inset-0 z-40 bg-black/80 flex items-center justify-center">
    <Desktop3D 
      theme={current3DTheme}
      onCustomize={() => setShow3DCustomization(true)}
    />
  </div>
)}

// Customization modal
<Desktop3DCustomization
  currentTheme={current3DTheme}
  onThemeChange={setCurrent3DTheme}
  isOpen={show3DCustomization}
  onOpenChange={setShow3DCustomization}
/>

// Toggle button
<button onClick={() => setShow3DDesktop(!show3DDesktop)}>
  ✨ 3D Environment
</button>
```

## Persistence & Storage

### Virtual Pet State

The pet state can be saved and restored:

```typescript
// Save to localStorage
const petData = petService.savePetState();
localStorage.setItem('pet-state', petData);

// Load from localStorage
const savedData = localStorage.getItem('pet-state');
if (savedData) {
  petService.loadPetState(savedData);
}
```

### 3D Theme Preference

```typescript
// Save theme preference
localStorage.setItem('3d-theme', currentTheme);

// Load theme preference
const savedTheme = localStorage.getItem('3d-theme') || "space";
setCurrent3DTheme(savedTheme as Desktop3DTheme);
```

## Performance Considerations

### Virtual Pet
- Lightweight state management
- Minimal DOM updates via React.memo and motion animations
- Efficient stat decay calculations
- Audio feedback uses Web Audio API for low overhead

### 3D Desktop
- Three.js renderer optimizations
- Shadow mapping for realistic lighting
- Efficient particle systems
- GPU-accelerated rendering
- Responsive canvas sizing

## Browser Compatibility

- Modern browsers with WebGL support
- Chrome/Chromium 90+
- Firefox 88+
- Safari 15+
- Edge 90+

## Dependencies

```json
{
  "three": "^r128+",
  "framer-motion": "^12.23.26",
  "lucide-react": "^0.462.0"
}
```

## Future Enhancements

1. **Pet Customization**
   - Custom pet appearances
   - Pet naming and personality traits
   - Pet skill development

2. **3D Desktop Enhancements**
   - Custom object creation
   - Physics-based interactions
   - Multiplayer shared environments
   - Custom theme builder

3. **Integration Features**
   - Pet notifications for important events
   - 3D desktop shortcuts
   - Workflow-based pet reactions
   - Achievement system

4. **Cloud Sync**
   - Save pet state to cloud
   - Sync 3D preferences across devices
   - Pet visit history

## Troubleshooting

### Virtual Pet not responding
- Check that VirtualPetService is initialized
- Ensure auto-tick is running
- Check browser console for errors

### 3D Desktop rendering issues
- Verify WebGL support in browser
- Check that Three.js is properly imported
- Clear browser cache and reload
- Update graphics drivers

### Performance issues
- Reduce number of interactive objects in 3D scene
- Lower particle count in ocean theme
- Disable shadow mapping for older devices
- Reduce animation frame rate

## Code Examples

### Creating a custom interaction

```typescript
// Add to VirtualPetService
customInteract(type: string): PetResponse {
  const interaction = {
    message: "Custom interaction!",
    energyChange: -10,
    happinessChange: 25,
    hungerChange: 0,
  };
  
  this.petState.energy += interaction.energyChange;
  this.petState.happiness += interaction.happinessChange;
  this.updateMood();
  
  return {
    message: interaction.message,
    reaction: this.getMoodReaction(),
    moodChange: 0,
    energyChange: interaction.energyChange,
    happinessChange: interaction.happinessChange,
    hungerChange: interaction.hungerChange,
  };
}
```

### Adding a new 3D theme

```typescript
// In Desktop3D.tsx
function createCustomEnvironment(scene: THREE.Scene) {
  // Create your custom environment
  const geometry = new THREE.BoxGeometry(10, 10, 10);
  const material = new THREE.MeshPhongMaterial({ color: 0xFF0000 });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

// Add to createEnvironment switch
case "custom":
  createCustomEnvironment(scene);
  break;
```

## Files Overview

```
src/
├── lib/
│   └── virtual-pet-service.ts          # Pet logic and state
├── components/desktop/
│   ├── VirtualPet.tsx                  # Pet UI component
│   ├── VirtualPet.css                  # Pet animations
│   ├── Desktop3D.tsx                   # 3D environment
│   └── Desktop3DCustomization.tsx       # Theme customization
└── pages/
    └── Desktop.tsx                     # Main desktop integration
```

## License

These features are part of the Personal Cloud project and follow the same license terms.
