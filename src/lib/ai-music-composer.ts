export interface GeneratedMusic {
  id: string;
  title: string;
  mood: string;
  genre: string;
  tempo: number;
  duration: number;
  audioUrl: string;
  createdAt: Date;
  createdBy: string;
}

export type Mood = "happy" | "sad" | "energetic" | "calm" | "dramatic" | "mysterious" | "romantic";
export type Genre = "electronic" | "ambient" | "orchestral" | "jazz" | "pop" | "classical" | "lofi" | "cinematic";

export class AIMusicComposerService {
  private audioContext: AudioContext | null = null;

  /**
   * Initialize audio context
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate music based on parameters
   */
  async generateMusic(
    title: string,
    mood: Mood,
    genre: Genre,
    tempo: number = 120,
    duration: number = 30,
    inputText?: string
  ): Promise<GeneratedMusic> {
    try {
      const audioContext = this.getAudioContext();

      // Create audio data based on mood and genre
      const audioData = this.createMusicalSequence(mood, genre, tempo, duration);

      // Create audio blob
      const audioBlob = new Blob([audioData], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);

      const music: GeneratedMusic = {
        id: `music_${Date.now()}`,
        title: title || `${mood.charAt(0).toUpperCase() + mood.slice(1)} ${genre} Composition`,
        mood,
        genre,
        tempo,
        duration,
        audioUrl,
        createdAt: new Date(),
        createdBy: "", // Will be set from component
      };

      return music;
    } catch (error) {
      console.error("Error generating music:", error);
      throw error;
    }
  }

  /**
   * Create musical sequence using Web Audio API
   */
  private createMusicalSequence(
    mood: Mood,
    genre: Genre,
    tempo: number,
    duration: number
  ): ArrayBuffer {
    const audioContext = this.getAudioContext();
    const sampleRate = audioContext.sampleRate;
    const numberOfSamples = duration * sampleRate;
    const audioData = new Float32Array(numberOfSamples);

    // Get scale based on mood
    const scale = this.getMusicalScale(mood, genre);
    const tempo_ms = (60000 / tempo) * 4; // 4 beats

    let sampleIndex = 0;
    const startTime = audioContext.currentTime;

    // Generate melody
    const notes = this.generateMelody(scale, mood, genre);

    notes.forEach((note, noteIndex) => {
      const noteDuration = tempo_ms / 1000; // Convert to seconds
      const noteStart = noteIndex * noteDuration;
      const noteEnd = Math.min((noteIndex + 1) * noteDuration, duration);

      if (noteStart >= duration) return;

      const startSample = Math.floor(noteStart * sampleRate);
      const endSample = Math.floor(noteEnd * sampleRate);

      // Use sine wave for smooth tone
      for (let i = startSample; i < endSample && i < numberOfSamples; i++) {
        const t = (i - startSample) / sampleRate;
        const frequency = this.noteToFrequency(note);

        // Apply envelope (attack-decay-sustain-release)
        const envelope = this.getEnvelope(t, noteDuration);

        // Generate sine wave
        audioData[i] = Math.sin(2 * Math.PI * frequency * t) * 0.3 * envelope;

        // Add harmonics for richness
        audioData[i] += Math.sin(2 * Math.PI * frequency * 2 * t) * 0.1 * envelope;
      }
    });

    // Convert to WAV format
    return this.encodeWAV(audioData, sampleRate);
  }

  /**
   * Get musical scale based on mood and genre
   */
  private getMusicalScale(
    mood: Mood,
    genre: Genre
  ): string[] {
    // Major and minor scales with different moods
    const scales: Record<string, string[]> = {
      happy: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], // Major scale
      sad: ["A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"], // Natural minor
      energetic: ["G3", "A3", "B3", "C4", "D4", "E4", "F#4", "G4"], // G major pentatonic
      calm: ["C4", "E4", "G4", "A4", "C5"], // C major pentatonic
      dramatic: ["D3", "F3", "G3", "A3", "C4", "D4", "F4", "G4"], // D natural minor
      mysterious: ["E3", "G3", "A3", "B3", "D4", "E4", "G4", "A4"], // E minor
      romantic: ["F3", "A3", "C4", "D4", "F4", "A4", "C5"], // F major
    };

    return scales[mood] || scales.calm;
  }

  /**
   * Generate melody based on scale
   */
  private generateMelody(scale: string[], mood: Mood, genre: Genre): string[] {
    const melody: string[] = [];
    const length = 16; // 16 notes

    for (let i = 0; i < length; i++) {
      // Use different patterns for different genres
      let note: string;

      if (genre === "lofi" || genre === "ambient") {
        // More sparse, floating melody
        if (i % 4 === 0) {
          note = scale[Math.floor(Math.random() * scale.length)];
        } else {
          note = scale[0]; // Root note
        }
      } else if (genre === "electronic") {
        // Rhythmic, pattern-based
        note = scale[i % scale.length];
      } else {
        // Random walk through scale
        const currentNote = scale.indexOf(melody[melody.length - 1] || scale[0]);
        const nextIdx = Math.max(
          0,
          Math.min(scale.length - 1, currentNote + Math.floor(Math.random() * 3) - 1)
        );
        note = scale[nextIdx];
      }

      melody.push(note);
    }

    return melody;
  }

  /**
   * Convert note name to frequency in Hz
   */
  private noteToFrequency(note: string): number {
    const notes: Record<string, number> = {
      "C3": 130.81, "D3": 146.83, "E3": 164.81, "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
      "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
      "C5": 523.25, "D5": 587.33, "E5": 659.25, "F5": 698.46, "G5": 783.99, "A5": 880.00, "B5": 987.77,
      "F#4": 369.99,
    };
    return notes[note] || 440;
  }

  /**
   * Apply ADSR envelope
   */
  private getEnvelope(time: number, duration: number): number {
    const attackTime = duration * 0.1;
    const decayTime = duration * 0.2;
    const sustainLevel = 0.7;
    const releaseTime = duration * 0.2;

    if (time < attackTime) {
      return time / attackTime;
    } else if (time < attackTime + decayTime) {
      const decay = (time - attackTime) / decayTime;
      return 1 - decay * (1 - sustainLevel);
    } else if (time < duration - releaseTime) {
      return sustainLevel;
    } else {
      const release = (time - (duration - releaseTime)) / releaseTime;
      return sustainLevel * (1 - release);
    }
  }

  /**
   * Encode audio data as WAV
   */
  private encodeWAV(audioData: Float32Array, sampleRate: number): ArrayBuffer {
    const numberOfChannels = 1;
    const bitDepth = 16;

    const WAV_HEADER_SIZE = 44;
    const audioBuffer = new ArrayBuffer(WAV_HEADER_SIZE + audioData.length * 2);
    const view = new DataView(audioBuffer);

    // WAV file header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
    view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, audioData.length * 2, true);

    // Convert float samples to PCM
    let index = WAV_HEADER_SIZE;
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i])); // Clamp
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      index += 2;
    }

    return audioBuffer;
  }

  /**
   * Save generated music
   */
  async saveMusic(music: GeneratedMusic, userId: string): Promise<void> {
    try {
      // In a real app, save to database
      const musicData = {
        id: music.id,
        title: music.title,
        mood: music.mood,
        genre: music.genre,
        tempo: music.tempo,
        duration: music.duration,
        created_by: userId,
        created_at: new Date().toISOString(),
        audio_url: music.audioUrl,
      };

      // Save to localStorage for demo
      const saved = JSON.parse(localStorage.getItem("generatedMusic") || "[]");
      saved.push(musicData);
      localStorage.setItem("generatedMusic", JSON.stringify(saved));
    } catch (error) {
      console.error("Error saving music:", error);
      throw error;
    }
  }

  /**
   * Get saved music
   */
  async getSavedMusic(userId: string): Promise<GeneratedMusic[]> {
    try {
      const saved = JSON.parse(localStorage.getItem("generatedMusic") || "[]");
      return saved.filter((m: any) => m.created_by === userId);
    } catch (error) {
      console.error("Error fetching saved music:", error);
      return [];
    }
  }
}

// String helper
Object.defineProperty(String.prototype, "capitalize", {
  value: function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
  },
});

export const musicComposerService = new AIMusicComposerService();
