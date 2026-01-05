export interface Project {
  id: string;
  title: string;
  description: string;
  type: "music" | "video" | "graphics" | "mixed";
  mediaItems: MediaItem[];
  timeline: TimelineTrack[];
  duration: number;
  resolution: "720p" | "1080p" | "4k";
  fps: 24 | 30 | 60;
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
}

export interface MediaItem {
  id: string;
  type: "audio" | "video" | "image" | "text";
  url: string;
  name: string;
  duration?: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
}

export interface TimelineTrack {
  id: string;
  type: "audio" | "video" | "graphics";
  clips: TimelineClip[];
}

export interface TimelineClip {
  id: string;
  mediaId: string;
  startTime: number;
  endTime: number;
  volume?: number;
  opacity?: number;
  effects: Effect[];
}

export interface Effect {
  id: string;
  name: string;
  type: "fade" | "blur" | "color" | "distortion" | "reverb" | "chorus" | "custom";
  intensity: number;
  duration: number;
}

export class VirtualStudioService {
  /**
   * Create new project
   */
  async createProject(
    title: string,
    description: string,
    type: "music" | "video" | "graphics" | "mixed",
    duration: number = 60,
    resolution: "720p" | "1080p" | "4k" = "1080p",
    fps: 24 | 30 | 60 = 30,
    userId: string
  ): Promise<Project> {
    const project: Project = {
      id: `project_${Date.now()}`,
      title,
      description,
      type,
      mediaItems: [],
      timeline: [
        { id: "track_audio", type: "audio", clips: [] },
        { id: "track_video", type: "video", clips: [] },
        { id: "track_graphics", type: "graphics", clips: [] },
      ],
      duration,
      resolution,
      fps,
      createdAt: new Date(),
      createdBy: userId,
      lastModified: new Date(),
    };

    // Save to localStorage
    this.saveProject(project);
    return project;
  }

  /**
   * Add media item to project
   */
  async addMediaItem(
    projectId: string,
    file: File,
    type: "audio" | "video" | "image" | "text"
  ): Promise<MediaItem> {
    try {
      // Upload file and get URL
      const url = await this.uploadMedia(file);

      // Get duration/dimensions if available
      const metadata = await this.getMediaMetadata(file, type);

      const mediaItem: MediaItem = {
        id: `media_${Date.now()}`,
        type,
        url,
        name: file.name,
        duration: metadata.duration,
        dimensions: metadata.dimensions,
        uploadedAt: new Date(),
      };

      // Add to project
      const project = this.getProject(projectId);
      if (project) {
        project.mediaItems.push(mediaItem);
        project.lastModified = new Date();
        this.saveProject(project);
      }

      return mediaItem;
    } catch (error) {
      console.error("Error adding media item:", error);
      throw error;
    }
  }

  /**
   * Add clip to timeline
   */
  async addClipToTimeline(
    projectId: string,
    trackId: string,
    mediaId: string,
    startTime: number,
    duration: number
  ): Promise<TimelineClip> {
    try {
      const project = this.getProject(projectId);
      if (!project) throw new Error("Project not found");

      const track = project.timeline.find(t => t.id === trackId);
      if (!track) throw new Error("Track not found");

      const clip: TimelineClip = {
        id: `clip_${Date.now()}`,
        mediaId,
        startTime,
        endTime: startTime + duration,
        effects: [],
      };

      track.clips.push(clip);
      project.lastModified = new Date();
      this.saveProject(project);

      return clip;
    } catch (error) {
      console.error("Error adding clip to timeline:", error);
      throw error;
    }
  }

  /**
   * Apply effect to clip
   */
  async applyEffect(
    projectId: string,
    clipId: string,
    effect: Effect
  ): Promise<void> {
    try {
      const project = this.getProject(projectId);
      if (!project) throw new Error("Project not found");

      for (const track of project.timeline) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          clip.effects.push(effect);
          project.lastModified = new Date();
          this.saveProject(project);
          return;
        }
      }

      throw new Error("Clip not found");
    } catch (error) {
      console.error("Error applying effect:", error);
      throw error;
    }
  }

  /**
   * Export project
   */
  async exportProject(
    projectId: string,
    format: "mp4" | "webm" | "gif" | "wav" | "mp3" = "mp4"
  ): Promise<Blob> {
    try {
      const project = this.getProject(projectId);
      if (!project) throw new Error("Project not found");

      // Create canvas
      const canvas = document.createElement("canvas");
      const [width, height] = this.getResolutionDimensions(project.resolution);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      // Render timeline to canvas
      const frames: ImageData[] = [];
      const frameDuration = 1000 / project.fps;

      for (let t = 0; t < project.duration * 1000; t += frameDuration) {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, width, height);

        // Render clips at this time
        for (const track of project.timeline) {
          for (const clip of track.clips) {
            if (t >= clip.startTime * 1000 && t < clip.endTime * 1000) {
              // Render clip frame
              this.renderClipFrame(ctx, clip, project);
            }
          }
        }

        frames.push(ctx.getImageData(0, 0, width, height));
      }

      // Create WebM blob (simplified)
      return this.encodeToVideo(frames, project.fps, format);
    } catch (error) {
      console.error("Error exporting project:", error);
      throw error;
    }
  }

  /**
   * Get media metadata
   */
  private async getMediaMetadata(
    file: File,
    type: string
  ): Promise<{ duration?: number; dimensions?: { width: number; height: number } }> {
    return new Promise((resolve) => {
      if (type === "audio" || type === "video") {
        const media = new Audio();
        media.onloadedmetadata = () => {
          resolve({ duration: media.duration });
        };
        media.src = URL.createObjectURL(file);
      } else if (type === "image") {
        const img = new Image();
        img.onload = () => {
          resolve({ dimensions: { width: img.width, height: img.height } });
        };
        img.src = URL.createObjectURL(file);
      } else {
        resolve({});
      }
    });
  }

  /**
   * Upload media file
   */
  private async uploadMedia(file: File): Promise<string> {
    return URL.createObjectURL(file);
  }

  /**
   * Get resolution dimensions
   */
  private getResolutionDimensions(
    resolution: "720p" | "1080p" | "4k"
  ): [number, number] {
    const resolutions: Record<string, [number, number]> = {
      "720p": [1280, 720],
      "1080p": [1920, 1080],
      "4k": [3840, 2160],
    };
    return resolutions[resolution] || [1920, 1080];
  }

  /**
   * Render clip frame
   */
  private renderClipFrame(
    ctx: CanvasRenderingContext2D,
    clip: TimelineClip,
    project: Project
  ): void {
    // Placeholder render
    ctx.fillStyle = "rgba(100, 150, 200, 0.5)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  /**
   * Encode frames to video
   */
  private async encodeToVideo(
    frames: ImageData[],
    fps: number,
    format: string
  ): Promise<Blob> {
    // Simplified: return a placeholder blob
    return new Blob(["placeholder video"], { type: `video/${format}` });
  }

  /**
   * Save project to localStorage
   */
  private saveProject(project: Project): void {
    const saved = JSON.parse(localStorage.getItem("vstudio_projects") || "{}");
    saved[project.id] = {
      ...project,
      createdAt: project.createdAt.toISOString(),
      lastModified: project.lastModified.toISOString(),
    };
    localStorage.setItem("vstudio_projects", JSON.stringify(saved));
  }

  /**
   * Get project from localStorage
   */
  private getProject(projectId: string): Project | null {
    const saved = JSON.parse(localStorage.getItem("vstudio_projects") || "{}");
    const projectData = saved[projectId];
    if (!projectData) return null;

    return {
      ...projectData,
      createdAt: new Date(projectData.createdAt),
      lastModified: new Date(projectData.lastModified),
    };
  }

  /**
   * Get all projects
   */
  async getUserProjects(userId: string): Promise<Project[]> {
    const saved = JSON.parse(localStorage.getItem("vstudio_projects") || "{}");
    return Object.values(saved)
      .filter((p: any) => p.createdBy === userId)
      .map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        lastModified: new Date(p.lastModified),
      }));
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const saved = JSON.parse(localStorage.getItem("vstudio_projects") || "{}");
    delete saved[projectId];
    localStorage.setItem("vstudio_projects", JSON.stringify(saved));
  }
}

export const virtualStudioService = new VirtualStudioService();
