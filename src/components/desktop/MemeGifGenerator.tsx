import React, { useState } from "react";
import { motion } from "framer-motion";
import { Laugh, Save, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { memeGeneratorService, MemeTemplate } from "@/lib/meme-gif-generator";

export const MemeGifGenerator = ({ userId }: { userId: string }) => {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState<MemeTemplate>("drake");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedMeme, setGeneratedMeme] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const templates: MemeTemplate[] = [
    "drake",
    "distracted-boyfriend",
    "woman-cat",
    "success-kid",
    "loss",
    "expanding-brain",
    "change-my-mind",
    "inception",
  ];

  const handleGenerate = async () => {
    if (!topText.trim() && !bottomText.trim()) {
      alert("Please enter some text");
      return;
    }

    try {
      setGenerating(true);

      if (selectedImage) {
        // Generate from custom image
        const meme = await memeGeneratorService.generateMemeFromImage(
          selectedImage,
          topText,
          bottomText,
          title
        );
        setGeneratedMeme(meme);
      } else {
        // Generate from template
        const meme = await memeGeneratorService.generateMeme(
          title,
          template,
          topText,
          bottomText
        );
        setGeneratedMeme(meme);
      }
    } catch (error) {
      console.error("Error generating meme:", error);
      alert("Error generating meme");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedMeme) return;
    try {
      await memeGeneratorService.saveMeme(generatedMeme, userId);
      alert("✅ Meme saved!");
    } catch (error) {
      console.error("Error saving meme:", error);
    }
  };

  const handleDownload = () => {
    if (!generatedMeme) return;
    memeGeneratorService.downloadMeme(generatedMeme);
  };

  return (
    <div className="h-full flex gap-6 bg-gradient-to-br from-background to-card/50 overflow-auto p-6">
      {/* Controls */}
      <div className="w-80 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-red-600 flex items-center justify-center">
            <Laugh className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">😂 Meme Generator</h2>
            <p className="text-xs text-muted-foreground">Create hilarious memes</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">Title</label>
          <Input
            placeholder="Meme title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">Upload Custom Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
            className="w-full"
          />
          {selectedImage && <p className="text-xs text-muted-foreground mt-2">{selectedImage.name}</p>}
        </div>

        {!selectedImage && (
          <div>
            <label className="text-sm font-semibold block mb-2">Template</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t}
                  onClick={() => setTemplate(t)}
                  className={`p-2 text-xs rounded border transition-colors ${
                    template === t
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold block mb-2">Top Text</label>
          <Input
            placeholder="When... (optional)"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-2">Bottom Text</label>
          <Input
            placeholder="Then... (optional)"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
          />
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? "🎨 Creating..." : "🎨 Create Meme"}
        </Button>
      </div>

      {/* Preview */}
      {generatedMeme && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1"
        >
          <div className="bg-card border border-border rounded-lg p-4">
            <img
              src={generatedMeme.imageUrl}
              alt={generatedMeme.title}
              className="w-full rounded-lg mb-4"
            />

            <div className="space-y-2 mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Template:</span> {generatedMeme.template}
              </p>
              {generatedMeme.topText && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Top:</span> {generatedMeme.topText}
                </p>
              )}
              {generatedMeme.bottomText && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Bottom:</span> {generatedMeme.bottomText}
                </p>
              )}
            </div>

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
