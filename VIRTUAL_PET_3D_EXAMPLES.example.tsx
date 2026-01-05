/**
 * Virtual Pet & 3D Desktop - Implementation Examples
 * 
 * This file contains practical examples of how to implement
 * and extend the Virtual Pet and 3D Desktop features.
 */

// ============================================================================
// EXAMPLE 1: Basic Virtual Pet Integration
// ============================================================================

import React, { useState, useEffect } from 'react';
import { VirtualPet } from '@/components/desktop/VirtualPet';
import { VirtualPetService } from '@/lib/virtual-pet-service';

export function BasicPetExample() {
  const [showPet, setShowPet] = useState(true);
  const [petService] = useState(() => new VirtualPetService('Buddy'));

  useEffect(() => {
    // Start auto-ticking the pet
    petService.startAutoTick(10000);

    return () => {
      petService.stopAutoTick();
    };
  }, [petService]);

  return (
    <div>
      <button onClick={() => setShowPet(!showPet)}>
        {showPet ? 'Hide' : 'Show'} Pet
      </button>

      {showPet && (
        <VirtualPet
          isFloating={true}
          onClose={() => setShowPet(false)}
          onTaskReminder={(taskName) => {
            console.log('Task reminder:', taskName);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Pet State Persistence with LocalStorage
// ============================================================================

export function PetPersistenceExample() {
  const [petService] = useState(() => {
    const saved = localStorage.getItem('my-pet-state');
    const service = new VirtualPetService('Persistent Pet');
    
    if (saved) {
      service.loadPetState(saved);
    }
    
    return service;
  });

  // Auto-save pet state every 30 seconds
  useEffect(() => {
    const saveInterval = setInterval(() => {
      localStorage.setItem('my-pet-state', petService.savePetState());
    }, 30000);

    return () => clearInterval(saveInterval);
  }, [petService]);

  return <VirtualPet isFloating={true} />;
}

// ============================================================================
// EXAMPLE 3: Pet Interaction with Task Completion
// ============================================================================

interface Task {
  id: string;
  name: string;
  completed: boolean;
}

export function TaskIntegrationExample() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [petService] = useState(() => new VirtualPetService());

  const completeTask = (taskId: string) => {
    setTasks(prev => 
      prev.map(t => 
        t.id === taskId 
          ? { ...t, completed: true }
          : t
      )
    );

    // Pet celebrates
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      petService.congratulateTask(task.name);
    }
  };

  const addTask = (taskName: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      name: taskName,
      completed: false,
    };
    setTasks([...tasks, newTask]);

    // Pet reminds you
    petService.remindTask(taskName);
  };

  return (
    <div>
      <h2>My Tasks</h2>
      <button onClick={() => addTask('New Task')}>Add Task</button>
      
      {tasks.map(task => (
        <div key={task.id}>
          <span>{task.name}</span>
          {!task.completed && (
            <button onClick={() => completeTask(task.id)}>
              Complete
            </button>
          )}
        </div>
      ))}

      <VirtualPet isFloating={true} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: 3D Desktop with Theme Switching
// ============================================================================

import { Desktop3D } from '@/components/desktop/Desktop3D';
import Desktop3DCustomization, { Desktop3DTheme } from '@/components/desktop/Desktop3DCustomization';

export function ThemeSwitcherExample() {
  const [currentTheme, setCurrentTheme] = useState<Desktop3DTheme>('space');
  const [showCustomization, setShowCustomization] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const themes: Desktop3DTheme[] = ['space', 'ocean', 'forest', 'neon', 'abstract'];

  const cycleTheme = () => {
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setCurrentTheme(themes[nextIndex]);
  };

  return (
    <div>
      <div className="controls">
        <button onClick={cycleTheme}>Next Theme</button>
        <button onClick={() => setShowCustomization(true)}>Customize</button>
        <button onClick={() => setIsFullscreen(!isFullscreen)}>Fullscreen</button>
        <span>Current: {currentTheme}</span>
      </div>

      {isFullscreen ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }}>
          <Desktop3D 
            theme={currentTheme}
            onCustomize={() => setShowCustomization(true)}
          />
        </div>
      ) : (
        <div style={{ height: '400px', width: '100%' }}>
          <Desktop3D theme={currentTheme} />
        </div>
      )}

      <Desktop3DCustomization
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        isOpen={showCustomization}
        onOpenChange={setShowCustomization}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: Custom Pet Mood Handler
// ============================================================================

export class EnhancedPetService extends VirtualPetService {
  private moodChangeCallbacks: Array<(mood: string) => void> = [];

  onMoodChange(callback: (mood: string) => void) {
    this.moodChangeCallbacks.push(callback);
  }

  private notifyMoodChange() {
    const mood = this.getPetState().mood;
    this.moodChangeCallbacks.forEach(cb => cb(mood));
  }

  interact(type: 'pet' | 'feed' | 'talk' | 'play') {
    const response = super.interact(type);
    this.notifyMoodChange();
    return response;
  }
}

// Usage
const enhancedPet = new EnhancedPetService('Enhanced Buddy');
enhancedPet.onMoodChange((mood) => {
  console.log('Pet mood changed to:', mood);
  // Update UI, trigger animations, etc.
});

// ============================================================================
// EXAMPLE 6: Performance-Optimized Pet Component
// ============================================================================

import { memo, useCallback } from 'react';

interface OptimizedPetProps {
  petService: VirtualPetService;
  onInteract?: (type: string) => void;
}

const MemoizedPet = memo(({ petService, onInteract }: OptimizedPetProps) => {
  const handleInteract = useCallback((type: 'pet' | 'feed' | 'talk' | 'play') => {
    petService.interact(type);
    onInteract?.(type);
  }, [petService, onInteract]);

  return (
    <VirtualPet
      isFloating={true}
      onTaskReminder={(task) => {
        handleInteract('pet');
      }}
    />
  );
});

// ============================================================================
// EXAMPLE 7: 3D Desktop with Custom Theme
// ============================================================================

import * as THREE from 'three';

// Create a custom environment function
function createCustomDesertEnvironment(scene: THREE.Scene) {
  // Sand-colored background
  scene.background = new THREE.Color(0xDEB887);

  // Add a simple pyramid (desert mountain)
  const geometry = new THREE.ConeGeometry(30, 40, 4);
  const material = new THREE.MeshPhongMaterial({
    color: 0xD2B48C,
    shininess: 5,
  });
  const pyramid = new THREE.Mesh(geometry, material);
  pyramid.position.z = -50;
  scene.add(pyramid);

  // Add sun
  const sunGeometry = new THREE.SphereGeometry(15, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xFDB813 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(50, 50, -100);
  scene.add(sun);

  // Add stars (scattered across the scene)
  const starCount = 100;
  const starGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 200;
    positions[i + 1] = (Math.random() - 0.5) * 200;
    positions[i + 2] = (Math.random() - 0.5) * 200;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.5,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);
}

// ============================================================================
// EXAMPLE 8: Real-time Pet Health Monitor
// ============================================================================

export function HealthMonitorExample() {
  const [petService] = useState(() => new VirtualPetService());
  const [stats, setStats] = useState(petService.getPetState());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(petService.getPetState());
    }, 1000);

    return () => clearInterval(interval);
  }, [petService]);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc' }}>
      <h3>Pet Health Status</h3>
      
      <div>
        <label>Mood: {stats.mood}</label>
        <progress value={stats.happiness} max="100" />
      </div>

      <div>
        <label>Energy: {Math.round(stats.energy)}%</label>
        <progress value={stats.energy} max="100" />
      </div>

      <div>
        <label>Hunger: {Math.round(stats.hunger)}%</label>
        <progress value={stats.hunger} max="100" />
      </div>

      <p>{petService.getHealthStatus()}</p>
    </div>
  );
}

// ============================================================================
// EXAMPLE 9: Multiplayer Pet Interaction
// ============================================================================

interface PetMessage {
  userId: string;
  action: 'pet' | 'feed' | 'talk' | 'play';
  timestamp: Date;
}

export function MultiplayerPetExample() {
  const [messages, setMessages] = useState<PetMessage[]>([]);
  const [petService] = useState(() => new VirtualPetService('Shared Pet'));

  const handleRemoteAction = (message: PetMessage) => {
    // Process remote action
    petService.interact(message.action);
    setMessages(prev => [...prev, message]);
  };

  return (
    <div>
      <h3>Shared Pet Interactions</h3>
      <div>
        {messages.map((msg, idx) => (
          <div key={idx}>
            <strong>{msg.userId}</strong> {msg.action} the pet
          </div>
        ))}
      </div>
      <VirtualPet isFloating={true} />
    </div>
  );
}

// ============================================================================
// EXAMPLE 10: Keyboard Shortcuts Integration
// ============================================================================

export function KeyboardShortcutsExample() {
  const [petService] = useState(() => new VirtualPetService());
  const [showPet, setShowPet] = useState(true);
  const [show3D, setShow3D] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P: Toggle Pet
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setShowPet(prev => !prev);
      }

      // Ctrl+3: Toggle 3D Desktop
      if (e.ctrlKey && e.key === '3') {
        e.preventDefault();
        setShow3D(prev => !prev);
      }

      // Ctrl+K: Pet interaction
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        petService.interact('pet');
      }

      // Ctrl+F: Feed pet
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        petService.interact('feed');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [petService]);

  return (
    <div>
      {showPet && <VirtualPet isFloating={true} />}
      {show3D && <Desktop3D theme="space" />}
      
      <p>Keyboard shortcuts:</p>
      <ul>
        <li>Ctrl+P: Toggle Pet</li>
        <li>Ctrl+3: Toggle 3D Desktop</li>
        <li>Ctrl+K: Pet interaction</li>
        <li>Ctrl+F: Feed pet</li>
      </ul>
    </div>
  );
}

export default {
  BasicPetExample,
  PetPersistenceExample,
  TaskIntegrationExample,
  ThemeSwitcherExample,
  EnhancedPetService,
  MemoizedPet,
  createCustomDesertEnvironment,
  HealthMonitorExample,
  MultiplayerPetExample,
  KeyboardShortcutsExample,
};
