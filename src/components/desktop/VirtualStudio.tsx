import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Film, Plus, Save, Download, Play, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { virtualStudioService, Project } from "@/lib/virtual-studio";

export const VirtualStudio = ({ userId }: { userId: string }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectType, setProjectType] = useState<"music" | "video" | "graphics" | "mixed">("mixed");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const userProjects = await virtualStudioService.getUserProjects(userId);
      setProjects(userProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const project = await virtualStudioService.createProject(
        projectName,
        projectDesc,
        projectType,
        60,
        "1080p",
        30,
        userId
      );

      setProjects([...projects, project]);
      setProjectName("");
      setProjectDesc("");
      setShowNewProject(false);
      setSelectedProject(project);
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Error creating project");
    }
  };

  const handleExportProject = async () => {
    if (!selectedProject) return;

    try {
      const blob = await virtualStudioService.exportProject(selectedProject.id, "mp4");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedProject.title}.mp4`;
      link.click();
    } catch (error) {
      console.error("Error exporting project:", error);
      alert("Error exporting project");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await virtualStudioService.deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  return (
    <div className="h-full flex gap-4 bg-gradient-to-br from-background to-card/50 overflow-auto">
      {/* Sidebar - Projects */}
      <div className="w-72 border-r border-border bg-card/50 flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-foreground">🎬 Virtual Studio</h2>
          </div>
          <Button onClick={() => setShowNewProject(true)} className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>

        <div className="flex-1 overflow-auto space-y-2 p-3">
          {projects.map((project) => (
            <motion.button
              key={project.id}
              onClick={() => setSelectedProject(project)}
              whileHover={{ scale: 1.02 }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedProject?.id === project.id
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <p className="font-semibold text-sm">{project.title}</p>
              <p className="text-xs opacity-70">{project.type}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-6">
        {showNewProject ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-lg p-6 max-w-md"
          >
            <h3 className="text-lg font-bold mb-4">Create New Project</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2">Project Name</label>
                <Input
                  placeholder="My awesome project..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Description</label>
                <Input
                  placeholder="Optional description"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-2">Type</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-background border border-border rounded"
                >
                  <option value="music">🎵 Music</option>
                  <option value="video">📹 Video</option>
                  <option value="graphics">🎨 Graphics</option>
                  <option value="mixed">🎬 Mixed Media</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateProject} className="flex-1">
                  Create
                </Button>
                <Button
                  onClick={() => setShowNewProject(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        ) : selectedProject ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedProject.title}</h2>
              <p className="text-muted-foreground mb-4">{selectedProject.description}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-background p-3 rounded">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold">{selectedProject.type}</p>
                </div>
                <div className="bg-background p-3 rounded">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">{selectedProject.duration}s</p>
                </div>
                <div className="bg-background p-3 rounded">
                  <p className="text-xs text-muted-foreground">Resolution</p>
                  <p className="font-semibold">{selectedProject.resolution}</p>
                </div>
                <div className="bg-background p-3 rounded">
                  <p className="text-xs text-muted-foreground">FPS</p>
                  <p className="font-semibold">{selectedProject.fps}</p>
                </div>
              </div>

              <div className="bg-background rounded-lg h-64 flex items-center justify-center mb-6">
                <div className="text-center text-muted-foreground">
                  <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Timeline Editor</p>
                  <p className="text-xs">Drag & drop media to timeline</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <FileUp className="w-4 h-4 mr-2" /> Add Media
                </Button>
                <Button variant="outline" className="flex-1">
                  <Play className="w-4 h-4 mr-2" /> Preview
                </Button>
                <Button onClick={handleExportProject} className="flex-1">
                  <Download className="w-4 h-4 mr-2" /> Export
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a project to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
