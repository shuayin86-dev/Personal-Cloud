import React, { useState } from "react";
import { motion } from "framer-motion";
import { Music, Play, Save, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { musicComposerService, Mood, Genre } from "@/lib/ai-music-composer";

export const AIMusicComposer = ({ userId }: { userId: string }) => {
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<Mood>("happy");
  const [genre, setGenre] = useState<Genre>("electronic");
  const [tempo, setTempo] = useState(120);
  const [duration, setDuration] = useState(30);
  const [generating, setGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<any | null>(null);
  const [savedMusic, setSavedMusic] = useState<any[]>([]);

  const moods: Mood[] = ["happy", "sad", "energetic", "calm", "dramatic", "mysterious", "romantic"];
  const genres: Genre[] = ["electronic", "ambient", "orchestral", "jazz", "pop", "classical", "lofi", "cinematic"];

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const music = await musicComposerService.generateMusic(
        title,
        mood,
        genre,
        tempo,
        duration
      );
      setGeneratedMusic(music);
    } catch (error) {
      console.error("Error generating music:", error);
      alert("Error generating music");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedMusic) return;
    try {
      await musicComposerService.saveMusic(generatedMusic, userId);
      setSavedMusic([...savedMusic, generatedMusic]);
      alert("✅ Music saved!");
    } catch (error) {
      console.error("Error saving music:", error);
    }
  };

  const handleDownload = () => {
    if (!generatedMusic) return;
    const link = document.createElement("a");
    link.href = generatedMusic.audioUrl;
    link.download = `${generatedMusic.title}.wav`;
    link.click();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-card/50 overflow-auto">
      {/* Header */}
      <div className="p-6 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">🎵 AI Music Composer</h2>
            <p className="text-xs text-muted-foreground">Generate music with AI</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold block mb-2">Title</label>
          <Input
            placeholder="My composition..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value as Mood)}
              className="w-full px-3 py-2 bg-background border border-border rounded"
            >
              {moods.map((m) => (
                <option key={m} value={m}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Genre</label>
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as Genre)}
              className="w-full px-3 py-2 bg-background border border-border rounded"
            >
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-2">Tempo (BPM)</label>
            <Input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              min="60"
              max="200"
            />
          </div>

          <div>
            <label className="text-sm font-semibold block mb-2">Duration (seconds)</label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              min="10"
              max="300"
            />
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? "🎶 Generating..." : "🎶 Generate Music"}
        </Button>
      </div>

      {/* Generated Music */}
      {generatedMusic && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 pb-6"
        >
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-bold mb-3">{generatedMusic.title}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                {generatedMusic.mood}
              </span>
              <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                {generatedMusic.genre}
              </span>
              <span className="text-xs bg-primary/20 px-2 py-1 rounded">
                {generatedMusic.tempo} BPM
              </span>
            </div>

            <audio
              src={generatedMusic.audioUrl}
              controls
              className="w-full mb-4"
            />

            <div className="flex gap-2">
              <Button onClick={handleSave} variant="outline" className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
