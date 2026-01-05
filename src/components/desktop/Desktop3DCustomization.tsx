import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Palette, Lightbulb, Layers } from "lucide-react";

export type Desktop3DTheme = "space" | "ocean" | "forest" | "neon" | "abstract";

interface Desktop3DCustomizationProps {
  currentTheme: Desktop3DTheme;
  onThemeChange: (theme: Desktop3DTheme) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const themeConfigs: Record<
  Desktop3DTheme,
  {
    name: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
  }
> = {
  space: {
    name: "Space",
    description: "Dark cosmic environment with stars and nebula",
    icon: "🌌",
    preview: "bg-purple-900",
  },
  ocean: {
    name: "Ocean",
    description: "Serene underwater atmosphere with particles",
    icon: "🌊",
    preview: "bg-blue-900",
  },
  forest: {
    name: "Forest",
    description: "Natural green environment with trees",
    icon: "🌲",
    preview: "bg-green-900",
  },
  neon: {
    name: "Neon",
    description: "Cyberpunk style with glowing grid",
    icon: "⚡",
    preview: "bg-slate-900",
  },
  abstract: {
    name: "Abstract",
    description: "Colorful geometric shapes and forms",
    icon: "🎨",
    preview: "bg-indigo-900",
  },
};

export const Desktop3DCustomization: React.FC<Desktop3DCustomizationProps> = ({
  currentTheme,
  onThemeChange,
  isOpen = false,
  onOpenChange,
}) => {
  const [selectedTheme, setSelectedTheme] = useState<Desktop3DTheme>(currentTheme);

  const handleThemeSelect = (theme: Desktop3DTheme) => {
    setSelectedTheme(theme);
    onThemeChange(theme);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Customize 3D Desktop Environment
          </DialogTitle>
          <DialogDescription>
            Choose a theme to customize your desktop appearance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Available Themes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.entries(themeConfigs) as Array<[Desktop3DTheme, typeof themeConfigs[Desktop3DTheme]]>).map(
                ([theme, config]) => (
                  <motion.button
                    key={theme}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleThemeSelect(theme)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedTheme === theme
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-purple-300"
                    }`}
                  >
                    {/* Preview Box */}
                    <div
                      className={`w-full h-24 rounded-md mb-3 ${config.preview} relative overflow-hidden`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-4xl">
                        {config.icon}
                      </div>
                      {selectedTheme === theme && (
                        <div className="absolute inset-0 border-2 border-purple-500 rounded-md animate-pulse" />
                      )}
                    </div>

                    <h4 className="font-semibold text-sm">{config.name}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {config.description}
                    </p>
                  </motion.button>
                )
              )}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Display Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded"
                />
                <span className="text-sm">Enable Shadows</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded"
                />
                <span className="text-sm">Enable Ambient Light</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded"
                />
                <span className="text-sm">Mouse Interaction</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded"
                />
                <span className="text-sm">Animate Objects</span>
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Tip: Move your mouse over the 3D environment to interact with the objects.
              Each theme offers a unique visual experience tailored to your workflow style.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
          <Button
            className="bg-gradient-to-r from-purple-600 to-pink-600"
            onClick={() => onOpenChange?.(false)}
          >
            Apply Theme
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Desktop3DCustomization;
