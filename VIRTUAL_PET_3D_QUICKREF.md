# Virtual Pet & 3D Desktop - Quick Reference

## Quick Start

### Show Virtual Pet
```tsx
import { VirtualPet } from "@/components/desktop/VirtualPet";

<VirtualPet isFloating={true} onClose={() => setShowVirtualPet(false)} />
```

### Show 3D Desktop
```tsx
import { Desktop3D } from "@/components/desktop/Desktop3D";

<Desktop3D theme="space" onCustomize={() => setShowCustomization(true)} />
```

## Virtual Pet API Cheatsheet

### Initialize
```typescript
import { VirtualPetService } from "@/lib/virtual-pet-service";
const pet = new VirtualPetService("MyPet");
```

### Pet State
```typescript
pet.getPetState();              // Get current pet state
pet.getPetState().mood;         // happy|neutral|tired|excited|sad
pet.getPetState().energy;       // 0-100
pet.getPetState().happiness;    // 0-100
pet.getPetState().hunger;       // 0-100
```

### Interactions
```typescript
pet.interact("pet");            // Gentle affection
pet.interact("feed");           // Feed the pet
pet.interact("talk");           // Have a conversation
pet.interact("play");           // Energetic play session
```

### Task Management
```typescript
pet.remindTask("Study React");  // Set a task reminder
pet.congratulateTask("Study React"); // Celebrate completion
```

### Pet Communication
```typescript
pet.getMoodMessage();           // Get a mood-based message
pet.getMoodReaction();          // Get emoji reaction
pet.getHealthStatus();          // Get health description
```

### Lifecycle
```typescript
pet.startAutoTick(10000);       // Start automatic stat decay
pet.tickTime(1);                // Manual tick
pet.stopAutoTick();             // Stop auto-ticking
```

### Persistence
```typescript
const saved = pet.savePetState();       // Serialize to JSON
pet.loadPetState(saved);                // Deserialize from JSON
```

## 3D Desktop Theme Reference

| Theme | Icon | Feel | Best For |
|-------|------|------|----------|
| Space | 🌌 | Cosmic & dark | Focus, deep work |
| Ocean | 🌊 | Calm & serene | Relaxation, creativity |
| Forest | 🌲 | Natural & organic | Nature lovers |
| Neon | ⚡ | Cyberpunk & edgy | Hacker aesthetic |
| Abstract | 🎨 | Colorful & playful | Fun, dynamic work |

## Component Props

### VirtualPet
```typescript
interface VirtualPetProps {
  onTaskReminder?: (taskName: string) => void;
  onTaskComplete?: (taskName: string) => void;
  isFloating?: boolean;          // Default: true
  onClose?: () => void;
}
```

### Desktop3D
```typescript
interface Desktop3DProps {
  onCustomize?: () => void;
  theme?: Desktop3DTheme;        // Default: "space"
}
```

### Desktop3DCustomization
```typescript
interface Desktop3DCustomizationProps {
  currentTheme: Desktop3DTheme;
  onThemeChange: (theme: Desktop3DTheme) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
```

## Pet Stat Changes

| Action | Energy | Happiness | Hunger |
|--------|--------|-----------|--------|
| Pet | +5 | +15 | 0 |
| Feed | +10 | +10 | -40 |
| Talk | -5 | +20 | +5 |
| Play | -30 | +40 | +15 |
| Idle (per min) | -0.1 | -0.05 | +0.2 |

## Mood Triggers

```
Happy:   happiness > 60 && energy > 60
Excited: happiness > 80 && energy > 60
Neutral: default state
Tired:   energy < 20
Sad:     hunger > 80 OR happiness < 30
```

## Color Codes

### Pet Mood Emojis
- Happy: 😄
- Excited: 🎉
- Neutral: 😊
- Tired: 😴
- Sad: 😞

### UI Colors
- Energy: Green (>60), Yellow (30-60), Red (<30)
- Happiness: Pink (>60), Blue (30-60), Purple (<30)
- Hunger: Orange gradient

## Common Tasks

### Save pet state to localStorage
```typescript
localStorage.setItem('pet', pet.savePetState());
```

### Load pet state from localStorage
```typescript
const saved = localStorage.getItem('pet');
if (saved) pet.loadPetState(saved);
```

### Auto-sync pet with user activity
```typescript
// Show pet when user is active
const handleUserActivity = () => {
  if (!showVirtualPet) setShowVirtualPet(true);
};

window.addEventListener('mousemove', handleUserActivity);
```

### Notify on task reminder
```typescript
const handleTaskReminder = (taskName: string) => {
  // Toast notification
  toast.info(`🐾 Pet: Don't forget "${taskName}"!`);
  
  // Or custom sound
  playSound('reminder');
  
  // Or trigger pet animation
  pet.remindTask(taskName);
};
```

### Switch 3D themes
```typescript
const themes: Desktop3DTheme[] = ['space', 'ocean', 'forest', 'neon', 'abstract'];
const nextTheme = themes[(themes.indexOf(current) + 1) % themes.length];
setCurrent3DTheme(nextTheme);
```

## Performance Tips

1. **Virtual Pet**
   - Use `isFloating={true}` to keep pet in fixed position
   - Adjust `startAutoTick` interval for performance
   - Debounce interaction handlers

2. **3D Desktop**
   - Disable shadows on low-end devices
   - Reduce particle counts in ocean theme
   - Use static themes for lower-end browsers
   - Unload when not visible

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Virtual Pet | ✅ | ✅ | ✅ | ✅ |
| 3D Desktop | ✅ | ✅ | ✅ | ✅ |
| WebGL | ✅ | ✅ | ✅ | ✅ |
| Audio API | ✅ | ✅ | ✅ | ✅ |

## Debugging

### Enable console logging
```typescript
// Add to VirtualPetService
console.log('Pet State:', this.petState);
console.log('Mood:', this.petState.mood);
```

### Check 3D rendering
```typescript
// In browser console
window.scene  // Should show Three.js scene
window.renderer  // Should show WebGL renderer
```

### Test audio
```typescript
// Check if audio context is available
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
console.log('Audio Context:', audioContext);
```

## Keyboard Shortcuts (To Implement)

```typescript
// Listen for hotkeys
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') {
    // Toggle pet visibility
  }
  if (e.ctrlKey && e.key === '3') {
    // Toggle 3D desktop
  }
});
```

## Integration Examples

### With Task Manager
```typescript
const createTask = (name: string) => {
  // Create task...
  pet.remindTask(name);
};

const completeTask = (name: string) => {
  // Complete task...
  pet.congratulateTask(name);
};
```

### With User Activity
```typescript
useEffect(() => {
  const activityTimer = setInterval(() => {
    // Check for inactivity
    if (isUserActive()) {
      pet.interact('pet');  // Show pet is happy user is back
    }
  }, 60000); // Every minute
  
  return () => clearInterval(activityTimer);
}, []);
```

### With Notifications
```typescript
const showTaskNotification = (taskName: string) => {
  // Show pet reminder
  pet.remindTask(taskName);
  
  // Toast notification
  toast.info(pet.getPetState().getMoodMessage());
};
```
