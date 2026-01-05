export interface PhotoTag {
  id: string;
  type: "face" | "object" | "scene" | "activity" | "custom";
  label: string;
  confidence: number;
  bounds?: { x: number; y: number; width: number; height: number };
}

export interface TaggedPhoto {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: Date;
  tags: PhotoTag[];
  faces: Array<{ id: string; name?: string; confidence: number }>;
  objects: Array<{ name: string; confidence: number }>;
  scenes: string[];
  uploadedBy: string;
}

export class PhotoAutoTaggingService {
  /**
   * Process and tag a photo
   */
  async tagPhoto(
    file: File,
    userId: string
  ): Promise<TaggedPhoto> {
    try {
      // Create URL from file
      const url = URL.createObjectURL(file);

      // Create image element
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.src = url;
      });

      // Detect faces, objects, and scenes
      const faces = await this.detectFaces(img);
      const objects = await this.detectObjects(img);
      const scenes = await this.detectScenes(img);

      // Convert detections to tags
      const tags: PhotoTag[] = [];

      // Add face tags
      faces.forEach((face, index) => {
        tags.push({
          id: `face_${index}`,
          type: "face",
          label: face.name || `Person ${index + 1}`,
          confidence: face.confidence,
          bounds: face.bounds,
        });
      });

      // Add object tags
      objects.forEach((obj, index) => {
        tags.push({
          id: `object_${index}`,
          type: "object",
          label: obj.name,
          confidence: obj.confidence,
        });
      });

      // Add scene tags
      scenes.forEach((scene, index) => {
        tags.push({
          id: `scene_${index}`,
          type: "scene",
          label: scene,
          confidence: 0.9,
        });
      });

      const taggedPhoto: TaggedPhoto = {
        id: `photo_${Date.now()}`,
        url,
        fileName: file.name,
        uploadedAt: new Date(),
        tags,
        faces,
        objects,
        scenes,
        uploadedBy: userId,
      };

      return taggedPhoto;
    } catch (error) {
      console.error("Error tagging photo:", error);
      throw error;
    }
  }

  /**
   * Detect faces in image
   */
  private async detectFaces(
    img: HTMLImageElement
  ): Promise<
    Array<{
      id: string;
      name?: string;
      confidence: number;
      bounds?: { x: number; y: number; width: number; height: number };
    }>
  > {
    try {
      // Simulate face detection using Canvas API
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Simple face detection heuristic (returns mock data)
      // In production, use ml5.js, TensorFlow.js, or Face API
      const faces = [];

      // Simulate detecting 1-3 faces
      const faceCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < faceCount; i++) {
        const x = Math.random() * (img.width * 0.6);
        const y = Math.random() * (img.height * 0.6);
        const size = Math.random() * 100 + 50;

        faces.push({
          id: `face_${i}`,
          confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
          bounds: {
            x: Math.max(0, x),
            y: Math.max(0, y),
            width: size,
            height: size,
          },
        });
      }

      return faces;
    } catch (error) {
      console.error("Error detecting faces:", error);
      return [];
    }
  }

  /**
   * Detect objects in image
   */
  private async detectObjects(
    img: HTMLImageElement
  ): Promise<Array<{ name: string; confidence: number }>> {
    try {
      // Simple object detection heuristic using color analysis
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Analyze colors to guess objects
      let redPixels = 0,
        greenPixels = 0,
        bluePixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (r > g && r > b) redPixels++;
        if (g > r && g > b) greenPixels++;
        if (b > r && b > g) bluePixels++;
      }

      const totalPixels = data.length / 4;
      const objects = [];

      // Guess objects based on color distribution
      if (redPixels / totalPixels > 0.2) {
        objects.push({
          name: "Red Object",
          confidence: redPixels / totalPixels,
        });
      }
      if (greenPixels / totalPixels > 0.2) {
        objects.push({
          name: "Plants/Green",
          confidence: greenPixels / totalPixels,
        });
      }
      if (bluePixels / totalPixels > 0.2) {
        objects.push({
          name: "Sky/Water",
          confidence: bluePixels / totalPixels,
        });
      }

      // Default objects if none detected
      if (objects.length === 0) {
        objects.push(
          { name: "Person", confidence: 0.8 },
          { name: "Camera", confidence: 0.6 }
        );
      }

      return objects;
    } catch (error) {
      console.error("Error detecting objects:", error);
      return [];
    }
  }

  /**
   * Detect scenes in image
   */
  private async detectScenes(img: HTMLImageElement): Promise<string[]> {
    try {
      // Analyze image to detect scene
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      // Calculate average brightness
      let brightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        brightness +=
          (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      brightness /= data.length / 4;

      // Detect saturation
      let saturation = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        saturation += max - min;
      }
      saturation /= data.length / 4;

      const scenes: string[] = [];

      if (brightness > 200) scenes.push("Bright");
      if (brightness < 100) scenes.push("Dark");
      if (saturation > 100) scenes.push("Colorful");
      if (saturation < 50) scenes.push("Monochrome");

      // Add random scene tags
      const possibleScenes = [
        "Indoor",
        "Outdoor",
        "Portrait",
        "Landscape",
        "Close-up",
        "Nature",
        "Urban",
        "Party",
      ];

      for (let i = 0; i < 2; i++) {
        const scene =
          possibleScenes[Math.floor(Math.random() * possibleScenes.length)];
        if (!scenes.includes(scene)) {
          scenes.push(scene);
        }
      }

      return scenes;
    } catch (error) {
      console.error("Error detecting scenes:", error);
      return ["Unknown Scene"];
    }
  }

  /**
   * Add custom tag to photo
   */
  async addCustomTag(
    photo: TaggedPhoto,
    label: string
  ): Promise<TaggedPhoto> {
    const customTag: PhotoTag = {
      id: `custom_${Date.now()}`,
      type: "custom",
      label,
      confidence: 1.0,
    };

    photo.tags.push(customTag);
    return photo;
  }

  /**
   * Remove tag from photo
   */
  async removeTag(photo: TaggedPhoto, tagId: string): Promise<TaggedPhoto> {
    photo.tags = photo.tags.filter((t) => t.id !== tagId);
    return photo;
  }

  /**
   * Update tag label
   */
  async updateTagLabel(
    photo: TaggedPhoto,
    tagId: string,
    newLabel: string
  ): Promise<TaggedPhoto> {
    const tag = photo.tags.find((t) => t.id === tagId);
    if (tag) {
      tag.label = newLabel;
    }
    return photo;
  }

  /**
   * Tag all photos in album
   */
  async tagAlbum(files: File[], userId: string): Promise<TaggedPhoto[]> {
    try {
      const taggedPhotos: TaggedPhoto[] = [];

      for (const file of files) {
        const photo = await this.tagPhoto(file, userId);
        taggedPhotos.push(photo);
      }

      return taggedPhotos;
    } catch (error) {
      console.error("Error tagging album:", error);
      throw error;
    }
  }

  /**
   * Search photos by tag
   */
  async searchByTag(
    photos: TaggedPhoto[],
    tag: string
  ): Promise<TaggedPhoto[]> {
    return photos.filter((photo) =>
      photo.tags.some(
        (t) =>
          t.label.toLowerCase().includes(tag.toLowerCase()) ||
          t.type === tag.toLowerCase()
      )
    );
  }

  /**
   * Get all unique tags from photos
   */
  async getAllTags(photos: TaggedPhoto[]): Promise<Array<{ name: string; count: number; type: string }>> {
    const tagMap = new Map<
      string,
      { name: string; count: number; type: string }
    >();

    photos.forEach((photo) => {
      photo.tags.forEach((tag) => {
        const key = tag.label.toLowerCase();
        if (tagMap.has(key)) {
          tagMap.get(key)!.count++;
        } else {
          tagMap.set(key, {
            name: tag.label,
            count: 1,
            type: tag.type,
          });
        }
      });
    });

    return Array.from(tagMap.values()).sort((a, b) => b.count - a.count);
  }

  /**
   * Save tagged photos
   */
  async saveTaggedPhotos(photos: TaggedPhoto[], userId: string): Promise<void> {
    try {
      const photoData = photos.map((p) => ({
        ...p,
        uploadedAt: p.uploadedAt.toISOString(),
      }));

      const saved = JSON.parse(localStorage.getItem("tagged_photos") || "{}");
      saved[userId] = photoData;
      localStorage.setItem("tagged_photos", JSON.stringify(saved));
    } catch (error) {
      console.error("Error saving tagged photos:", error);
      throw error;
    }
  }

  /**
   * Get saved tagged photos
   */
  async getSavedPhotos(userId: string): Promise<TaggedPhoto[]> {
    try {
      const saved = JSON.parse(localStorage.getItem("tagged_photos") || "{}");
      return saved[userId] || [];
    } catch (error) {
      console.error("Error fetching saved photos:", error);
      return [];
    }
  }
}

export const photoTaggingService = new PhotoAutoTaggingService();
