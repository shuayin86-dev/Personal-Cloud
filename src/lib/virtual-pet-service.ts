// Virtual Pet/Companion AI Service
// Manages the pet's state, interactions, and task reminders

export interface PetState {
  id: string;
  name: string;
  mood: "happy" | "neutral" | "tired" | "excited" | "sad";
  energy: number; // 0-100
  happiness: number; // 0-100
  hunger: number; // 0-100
  lastInteraction: Date;
  lastFed: Date;
  uptime: number; // minutes
  tasksReminded: number;
}

export interface PetInteraction {
  type: "pet" | "feed" | "talk" | "play" | "task-reminder" | "congratulate";
  timestamp: Date;
  message?: string;
}

export interface PetResponse {
  message: string;
  reaction: string;
  moodChange: number;
  energyChange: number;
  happinessChange: number;
  hungerChange: number;
}

const MOOD_MESSAGES = {
  happy: ["I'm so happy! 😄", "Everything is wonderful! ✨", "Let's have fun together!", "You make me smile! 😊"],
  neutral: ["Hi there!", "What's up?", "How can I help?", "Ready to work?"],
  tired: ["I need some rest... 😴", "So sleepy...", "Can we take a break?", "Zzz..."],
  excited: ["This is amazing! 🎉", "I'm pumped!", "Let's do this!", "Woohoo! 🚀"],
  sad: ["I miss you... 😞", "Feeling a bit lonely", "Need some attention?", "You okay?"]
};

const INTERACTIONS = {
  pet: {
    messages: ["That feels nice! 😊", "Keep going! 🐾", "Aww, thank you!", "More please!"],
    energyChange: 5,
    happinessChange: 15,
    hungerChange: 0,
  },
  feed: {
    messages: ["Nom nom! 😋", "Delicious!", "Thanks for the snack!", "I was hungry!"],
    energyChange: 10,
    happinessChange: 10,
    hungerChange: -40,
  },
  talk: {
    messages: ["I love chatting with you!", "That's interesting!", "Tell me more!", "You're fun!"],
    energyChange: -5,
    happinessChange: 20,
    hungerChange: 5,
  },
  play: {
    messages: ["This is so much fun! 🎮", "Again again!", "Wheee! 🎪", "Best day ever!"],
    energyChange: -30,
    happinessChange: 40,
    hungerChange: 15,
  },
  taskReminder: {
    messages: ["Don't forget your task!", "Hey, you have something to do!", "Time to focus! 💪", "Let's tackle that task!"],
    energyChange: 0,
    happinessChange: 5,
    hungerChange: 0,
  },
  congratulate: {
    messages: ["You did it! 🎉", "Amazing work!", "I'm proud of you! 🌟", "Excellent job!"],
    energyChange: 5,
    happinessChange: 30,
    hungerChange: 0,
  }
};

export class VirtualPetService {
  private petState: PetState;
  private interactionHistory: PetInteraction[] = [];
  private taskReminderInterval: NodeJS.Timeout | null = null;

  constructor(name: string = "Companion") {
    this.petState = {
      id: `pet-${Date.now()}`,
      name,
      mood: "happy",
      energy: 80,
      happiness: 80,
      hunger: 20,
      lastInteraction: new Date(),
      lastFed: new Date(),
      uptime: 0,
      tasksReminded: 0,
    };
  }

  getPetState(): PetState {
    return { ...this.petState };
  }

  setPetName(name: string): void {
    this.petState.name = name;
  }

  private updateMood(): void {
    const { energy, happiness, hunger } = this.petState;
    
    if (energy < 20) {
      this.petState.mood = "tired";
    } else if (hunger > 80) {
      this.petState.mood = "sad";
    } else if (happiness > 80 && energy > 60) {
      this.petState.mood = "excited";
    } else if (happiness > 60) {
      this.petState.mood = "happy";
    } else {
      this.petState.mood = "neutral";
    }
  }

  private getRandomMessage(messages: string[]): string {
    return messages[Math.floor(Math.random() * messages.length)];
  }

  interact(type: "pet" | "feed" | "talk" | "play"): PetResponse {
    const interaction = INTERACTIONS[type];
    
    // Update stats
    this.petState.energy = Math.max(0, Math.min(100, this.petState.energy + interaction.energyChange));
    this.petState.happiness = Math.max(0, Math.min(100, this.petState.happiness + interaction.happinessChange));
    this.petState.hunger = Math.max(0, Math.min(100, this.petState.hunger + interaction.hungerChange));
    
    if (type === "feed") {
      this.petState.lastFed = new Date();
    }
    
    this.petState.lastInteraction = new Date();
    this.updateMood();

    const message = this.getRandomMessage(interaction.messages);
    const reaction = this.getMoodReaction();

    this.interactionHistory.push({
      type,
      timestamp: new Date(),
      message,
    });

    return {
      message,
      reaction,
      moodChange: 0,
      energyChange: interaction.energyChange,
      happinessChange: interaction.happinessChange,
      hungerChange: interaction.hungerChange,
    };
  }

  remindTask(taskName: string): PetResponse {
    const message = `Don't forget: "${taskName}"! 📋`;
    this.petState.tasksReminded++;
    this.petState.happiness = Math.max(0, this.petState.happiness + 5);
    this.updateMood();

    this.interactionHistory.push({
      type: "task-reminder",
      timestamp: new Date(),
      message: taskName,
    });

    return {
      message,
      reaction: "📢",
      moodChange: 0,
      energyChange: 0,
      happinessChange: 5,
      hungerChange: 0,
    };
  }

  congratulateTask(taskName: string): PetResponse {
    const messages = INTERACTIONS.congratulate.messages;
    const message = `${this.getRandomMessage(messages)} You completed "${taskName}"!`;
    
    this.petState.happiness = Math.max(0, Math.min(100, this.petState.happiness + 30));
    this.updateMood();

    this.interactionHistory.push({
      type: "congratulate",
      timestamp: new Date(),
      message: taskName,
    });

    return {
      message,
      reaction: "🎉",
      moodChange: 0,
      energyChange: 5,
      happinessChange: 30,
      hungerChange: 0,
    };
  }

  tickTime(minutes: number = 1): void {
    // Gradually decrease stats over time
    this.petState.energy = Math.max(0, this.petState.energy - minutes * 0.1);
    this.petState.happiness = Math.max(0, this.petState.happiness - minutes * 0.05);
    this.petState.hunger = Math.min(100, this.petState.hunger + minutes * 0.2);
    this.petState.uptime += minutes;

    this.updateMood();
  }

  getMoodReaction(): string {
    const reactions = {
      happy: "😄",
      neutral: "😊",
      tired: "😴",
      excited: "🎉",
      sad: "😞",
    };
    return reactions[this.petState.mood];
  }

  getMoodMessage(): string {
    const messages = MOOD_MESSAGES[this.petState.mood];
    return this.getRandomMessage(messages);
  }

  getHealthStatus(): string {
    const { energy, happiness, hunger } = this.petState;
    
    if (hunger > 80) return "Very hungry! Feed me! 😭";
    if (energy < 20) return "So sleepy... 😴";
    if (happiness < 30) return "Feeling sad... 😞";
    if (happiness > 80) return "So happy! 😄";
    return "Doing well! 😊";
  }

  savePetState(): string {
    return JSON.stringify({
      petState: this.petState,
      interactionHistory: this.interactionHistory,
    });
  }

  loadPetState(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.petState = parsed.petState;
      this.interactionHistory = parsed.interactionHistory;
    } catch (error) {
      console.error("Error loading pet state:", error);
    }
  }

  getInteractionHistory(): PetInteraction[] {
    return [...this.interactionHistory];
  }

  startAutoTick(intervalMs: number = 10000): void {
    // Tick every 10 seconds (1 minute in game time by default)
    if (this.taskReminderInterval) {
      clearInterval(this.taskReminderInterval);
    }

    this.taskReminderInterval = setInterval(() => {
      this.tickTime(1);
    }, intervalMs);
  }

  stopAutoTick(): void {
    if (this.taskReminderInterval) {
      clearInterval(this.taskReminderInterval);
      this.taskReminderInterval = null;
    }
  }
}

export const createPetService = (name: string = "Companion"): VirtualPetService => {
  return new VirtualPetService(name);
};
