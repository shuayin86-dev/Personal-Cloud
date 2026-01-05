export interface GeneratedMeme {
  id: string;
  title: string;
  imageUrl: string;
  template: string;
  topText: string;
  bottomText: string;
  createdAt: Date;
  createdBy: string;
  format: "meme" | "gif";
}

export type MemeTemplate = "drake" | "distracted-boyfriend" | "woman-cat" | "success-kid" | "loss" | "expanding-brain" | "change-my-mind" | "inception";

export class MemeAndGifGeneratorService {
  private memeTemplates: Record<MemeTemplate, { width: number; height: number; topTextY: number; bottomTextY: number }> = {
    drake: { width: 500, height: 500, topTextY: 150, bottomTextY: 450 },
    "distracted-boyfriend": { width: 600, height: 400, topTextY: 150, bottomTextY: 350 },
    "woman-cat": { width: 500, height: 450, topTextY: 100, bottomTextY: 400 },
    "success-kid": { width: 500, height: 500, topTextY: 100, bottomTextY: 450 },
    loss: { width: 600, height: 400, topTextY: 50, bottomTextY: 350 },
    "expanding-brain": { width: 500, height: 600, topTextY: 100, bottomTextY: 550 },
    "change-my-mind": { width: 500, height: 500, topTextY: 200, bottomTextY: 450 },
    inception: { width: 500, height: 500, topTextY: 150, bottomTextY: 450 },
  };

  /**
   * Generate meme from template
   */
  async generateMeme(
    title: string,
    template: MemeTemplate,
    topText: string,
    bottomText: string
  ): Promise<GeneratedMeme> {
    try {
      const templateConfig = this.memeTemplates[template];
      const canvas = document.createElement("canvas");
      canvas.width = templateConfig.width;
      canvas.height = templateConfig.height;
      const ctx = canvas.getContext("2d")!;

      // Create template background
      this.drawTemplateBackground(ctx, template, templateConfig.width, templateConfig.height);

      // Draw text
      this.drawMemeText(ctx, topText, templateConfig.topTextY, templateConfig.width);
      this.drawMemeText(ctx, bottomText, templateConfig.bottomTextY, templateConfig.width);

      // Convert to blob
      const imageUrl = canvas.toDataURL("image/png");

      const meme: GeneratedMeme = {
        id: `meme_${Date.now()}`,
        title: title || `${template} meme`,
        imageUrl,
        template,
        topText,
        bottomText,
        createdAt: new Date(),
        createdBy: "",
        format: "meme",
      };

      return meme;
    } catch (error) {
      console.error("Error generating meme:", error);
      throw error;
    }
  }

  /**
   * Draw template background with placeholder design
   */
  private drawTemplateBackground(
    ctx: CanvasRenderingContext2D,
    template: MemeTemplate,
    width: number,
    height: number
  ): void {
    // Background
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, width, height);

    // Add template-specific styling
    switch (template) {
      case "drake":
        ctx.fillStyle = "#ff6b6b";
        ctx.fillRect(0, 0, width / 2, height);
        ctx.fillStyle = "#4ecdc4";
        ctx.fillRect(width / 2, 0, width / 2, height);
        break;
      case "distracted-boyfriend":
        ctx.fillStyle = "#ffd93d";
        ctx.fillRect(0, 0, width, height / 2);
        ctx.fillStyle = "#6bcf7f";
        ctx.fillRect(0, height / 2, width, height / 2);
        break;
      case "expanding-brain":
        ctx.fillStyle = "#95e1d3";
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(0, (i * height) / 4, width, height / 4);
          if (i % 2 === 0) {
            ctx.fillStyle = "#f38181";
          } else {
            ctx.fillStyle = "#95e1d3";
          }
        }
        break;
      case "change-my-mind":
        ctx.fillStyle = "#a8dadc";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#f1faee";
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width, height / 2);
        ctx.lineTo(width / 2, height);
        ctx.lineTo(0, height / 2);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        ctx.fillStyle = "#457b9d";
        ctx.fillRect(0, 0, width, height);
    }

    // Border
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, width, height);
  }

  /**
   * Draw meme text with stroke
   */
  private drawMemeText(
    ctx: CanvasRenderingContext2D,
    text: string,
    y: number,
    width: number
  ): void {
    ctx.font = "bold 32px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    // Word wrap
    const words = text.split(" ");
    let line = "";
    const lines: string[] = [];

    for (const word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > width - 40 && line !== "") {
        lines.push(line);
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Draw lines
    lines.forEach((line, index) => {
      const lineY = y + index * 40;
      ctx.strokeText(line, width / 2, lineY);
      ctx.fillText(line, width / 2, lineY);
    });
  }

  /**
   * Generate GIF from images
   */
  async generateGifFromImages(
    images: File[],
    title: string,
    frameDelay: number = 100,
    width: number = 500,
    height: number = 500
  ): Promise<GeneratedMeme> {
    try {
      // For simplicity, create a combined image (in production, use gif.js library)
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height * images.length;
      const ctx = canvas.getContext("2d")!;

      // Create combined image of all frames
      for (let i = 0; i < images.length; i++) {
        const img = new Image();
        const reader = new FileReader();

        await new Promise<void>((resolve) => {
          reader.onload = (e) => {
            img.src = e.target?.result as string;
            img.onload = () => {
              ctx.drawImage(img, 0, i * height, width, height);
              resolve();
            };
          };
          reader.readAsDataURL(images[i]);
        });
      }

      const imageUrl = canvas.toDataURL("image/png");

      return {
        id: `gif_${Date.now()}`,
        title: title || "Generated GIF",
        imageUrl,
        template: "custom",
        topText: "",
        bottomText: "",
        createdAt: new Date(),
        createdBy: "",
        format: "gif",
      };
    } catch (error) {
      console.error("Error generating GIF:", error);
      throw error;
    }
  }

  /**
   * Generate meme from image with text overlay
   */
  async generateMemeFromImage(
    imageFile: File,
    topText: string,
    bottomText: string,
    title: string
  ): Promise<GeneratedMeme> {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const img = new Image();
      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve();
          };
        };
        reader.readAsDataURL(imageFile);
      });

      // Draw text
      ctx.font = "bold 40px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;

      const padding = 20;
      ctx.strokeText(topText, canvas.width / 2, padding + 40);
      ctx.fillText(topText, canvas.width / 2, padding + 40);

      ctx.strokeText(bottomText, canvas.width / 2, canvas.height - padding);
      ctx.fillText(bottomText, canvas.width / 2, canvas.height - padding);

      const imageUrl = canvas.toDataURL("image/png");

      return {
        id: `meme_${Date.now()}`,
        title: title || "Custom meme",
        imageUrl,
        template: "custom",
        topText,
        bottomText,
        createdAt: new Date(),
        createdBy: "",
        format: "meme",
      };
    } catch (error) {
      console.error("Error generating meme from image:", error);
      throw error;
    }
  }

  /**
   * Capture webcam frame as meme
   */
  async captureWebcamMeme(
    videoElement: HTMLVideoElement,
    topText: string,
    bottomText: string,
    title: string
  ): Promise<GeneratedMeme> {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d")!;

      // Draw video frame
      ctx.drawImage(videoElement, 0, 0);

      // Draw text
      ctx.font = "bold 40px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;

      ctx.strokeText(topText, canvas.width / 2, 50);
      ctx.fillText(topText, canvas.width / 2, 50);

      ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 30);
      ctx.fillText(bottomText, canvas.width / 2, canvas.height - 30);

      const imageUrl = canvas.toDataURL("image/png");

      return {
        id: `meme_${Date.now()}`,
        title: title || "Webcam meme",
        imageUrl,
        template: "custom",
        topText,
        bottomText,
        createdAt: new Date(),
        createdBy: "",
        format: "meme",
      };
    } catch (error) {
      console.error("Error capturing webcam meme:", error);
      throw error;
    }
  }

  /**
   * Save meme
   */
  async saveMeme(meme: GeneratedMeme, userId: string): Promise<void> {
    try {
      const memeData = {
        id: meme.id,
        title: meme.title,
        template: meme.template,
        topText: meme.topText,
        bottomText: meme.bottomText,
        format: meme.format,
        created_by: userId,
        created_at: new Date().toISOString(),
        image_url: meme.imageUrl,
      };

      // Save to localStorage
      const saved = JSON.parse(localStorage.getItem("generatedMemes") || "[]");
      saved.push(memeData);
      localStorage.setItem("generatedMemes", JSON.stringify(saved));
    } catch (error) {
      console.error("Error saving meme:", error);
      throw error;
    }
  }

  /**
   * Get saved memes
   */
  async getSavedMemes(userId: string): Promise<GeneratedMeme[]> {
    try {
      const saved = JSON.parse(localStorage.getItem("generatedMemes") || "[]");
      return saved.filter((m: any) => m.created_by === userId);
    } catch (error) {
      console.error("Error fetching saved memes:", error);
      return [];
    }
  }

  /**
   * Download meme as image
   */
  downloadMeme(meme: GeneratedMeme): void {
    const link = document.createElement("a");
    link.href = meme.imageUrl;
    link.download = `${meme.title}.png`;
    link.click();
  }
}

export const memeGeneratorService = new MemeAndGifGeneratorService();
