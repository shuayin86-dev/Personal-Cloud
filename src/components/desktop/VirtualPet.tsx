import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Zap, Droplet, VolumeX, Volume2, X } from "lucide-react";
import { VirtualPetService, PetResponse, PetState } from "@/lib/virtual-pet-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./VirtualPet.css";

interface VirtualPetProps {
  onTaskReminder?: (taskName: string) => void;
  onTaskComplete?: (taskName: string) => void;
  isFloating?: boolean;
  onClose?: () => void;
}

export const VirtualPet: React.FC<VirtualPetProps> = ({
  onTaskReminder,
  onTaskComplete,
  isFloating = true,
  onClose,
}) => {
  const [petService] = useState(() => new VirtualPetService("Companion"));
  const [petState, setPetState] = useState<PetState>(petService.getPetState());
  const [lastResponse, setLastResponse] = useState<PetResponse | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [petName, setPetName] = useState(petState.name);
  const [isNameEditing, setIsNameEditing] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    petService.startAutoTick(10000); // Tick every 10 seconds

    const updateInterval = setInterval(() => {
      setPetState(petService.getPetState());
    }, 1000);

    return () => {
      clearInterval(updateInterval);
      petService.stopAutoTick();
    };
  }, [petService]);

  useEffect(() => {
    if (showMessage && messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    if (showMessage) {
      messageTimeoutRef.current = setTimeout(() => {
        setShowMessage(false);
      }, 4000);
    }

    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, [showMessage]);

  const playSound = (type: string) => {
    if (isMuted) return;

    // Create simple beep sounds using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    switch (type) {
      case "pet":
        oscillator.frequency.value = 400;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        break;
      case "feed":
        oscillator.frequency.value = 600;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
      case "play":
        oscillator.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;
    }
  };

  const handleInteract = (type: "pet" | "feed" | "talk" | "play") => {
    const response = petService.interact(type);
    setLastResponse(response);
    setShowMessage(true);
    setPetState(petService.getPetState());
    playSound(type);
  };

  const handleRemindTask = () => {
    const taskName = prompt("What task should I remind you about?");
    if (taskName) {
      const response = petService.remindTask(taskName);
      setLastResponse(response);
      setShowMessage(true);
      setPetState(petService.getPetState());
      playSound("pet");
      onTaskReminder?.(taskName);
    }
  };

  const handleNameChange = () => {
    if (petName.trim()) {
      petService.setPetName(petName);
      setPetState(petService.getPetState());
      setIsNameEditing(false);
    }
  };

  const getEnergyColor = (energy: number) => {
    if (energy > 60) return "bg-green-500";
    if (energy > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getHappinessColor = (happiness: number) => {
    if (happiness > 60) return "bg-pink-500";
    if (happiness > 30) return "bg-blue-500";
    return "bg-purple-500";
  };

  const petContainerClasses = isFloating
    ? "fixed bottom-4 right-4 w-80 z-50"
    : "w-full max-w-md";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`${petContainerClasses} bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-2xl p-6 shadow-2xl border-2 border-purple-300 dark:border-purple-700`}
    >
      {/* Close Button */}
      {isFloating && onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      )}

      {/* Pet Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {isNameEditing ? (
            <div className="flex gap-2">
              <Input
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                className="h-8 text-lg font-bold"
                autoFocus
              />
              <Button
                onClick={handleNameChange}
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
              >
                ✓
              </Button>
            </div>
          ) : (
            <h2
              onClick={() => setIsNameEditing(true)}
              className="text-2xl font-bold cursor-pointer hover:text-purple-600 transition-colors"
            >
              {petState.name}
            </h2>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Mood: {petState.mood} {petService.getMoodReaction()}
          </p>
        </div>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 hover:bg-white/30 rounded-full transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Pet Avatar */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="flex justify-center my-6"
      >
        <div className={`text-8xl pet-avatar pet-mood-${petState.mood}`}>
          {petService.getMoodReaction()}
        </div>
      </motion.div>

      {/* Pet Message */}
      <AnimatePresence>
        {showMessage && lastResponse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-3 mb-4 text-center"
          >
            <p className="text-sm font-semibold">{lastResponse.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bars */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Zap size={14} /> Energy
            </span>
            <span className="text-xs">{Math.round(petState.energy)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${petState.energy}%` }}
              className={`h-2 rounded-full ${getEnergyColor(petState.energy)}`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Heart size={14} /> Happiness
            </span>
            <span className="text-xs">{Math.round(petState.happiness)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${petState.happiness}%` }}
              className={`h-2 rounded-full ${getHappinessColor(petState.happiness)}`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold flex items-center gap-1">
              <Droplet size={14} /> Hunger
            </span>
            <span className="text-xs">{Math.round(petState.hunger)}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${petState.hunger}%` }}
              className="h-2 rounded-full bg-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Status Message */}
      <p className="text-xs text-center mb-4 text-gray-700 dark:text-gray-300 italic">
        {petService.getHealthStatus()}
      </p>

      {/* Interaction Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleInteract("pet")}
          className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          🐾 Pet
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleInteract("feed")}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          🍎 Feed
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleInteract("talk")}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          💬 Talk
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleInteract("play")}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm"
        >
          🎮 Play
        </motion.button>
      </div>

      {/* Task Reminder Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRemindTask}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm"
      >
        📋 Remind Me of a Task
      </motion.button>

      {/* Info */}
      <p className="text-xs text-center mt-3 text-gray-600 dark:text-gray-400">
        Uptime: {Math.floor(petState.uptime / 60)}h {petState.uptime % 60}m | Tasks Reminded: {petState.tasksReminded}
      </p>
    </motion.div>
  );
};

export default VirtualPet;
