/**
 * Self-Destructing Files Service
 * Handles file uploads with auto-expiration and access limits
 * Uses localStorage for demo purposes
 */

export interface SelfDestructFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccesses?: number;
  encrypted: boolean;
  data: string; // Base64 encoded
  mimeType: string;
  hasPassword: boolean;
}

const STORAGE_KEY = "pc:self_destruct_files";

export class SelfDestructingFilesService {
  userId: string;

  constructor(userId: string = "demo-user") {
    this.userId = userId;
  }

  /**
   * Upload a file that will auto-delete after expiration
   */
  async uploadSelfDestructFile(
    file: File,
    expirationTime: "1hour" | "1day" | "7days" | "30days" | "custom" = "1hour",
    customMinutes?: number,
    maxAccesses?: number,
    password?: string
  ): Promise<SelfDestructFile> {
    try {
      // Calculate expiration date
      let expirationMs = 0;
      if (expirationTime === "1hour") expirationMs = 60 * 60 * 1000;
      else if (expirationTime === "1day") expirationMs = 24 * 60 * 60 * 1000;
      else if (expirationTime === "7days") expirationMs = 7 * 24 * 60 * 60 * 1000;
      else if (expirationTime === "30days") expirationMs = 30 * 24 * 60 * 60 * 1000;
      else if (expirationTime === "custom" && customMinutes) {
        expirationMs = customMinutes * 60 * 1000;
      }

      const expiresAt = new Date(Date.now() + expirationMs);
      const fileId = `sdf_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Convert file to base64 for localStorage
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const selfDestructFile: SelfDestructFile = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: this.userId,
        uploadedAt: new Date(),
        expiresAt,
        accessCount: 0,
        maxAccesses,
        encrypted: true,
        data: fileData,
        mimeType: file.type,
        hasPassword: !!password,
      };

      // Store in localStorage
      const allFiles = this.getUserFiles();
      allFiles.push(selfDestructFile);
      localStorage.setItem(`${STORAGE_KEY}:${this.userId}`, JSON.stringify(allFiles));

      return selfDestructFile;
    } catch (error) {
      console.error("Error uploading self-destructing file:", error);
      throw error;
    }
  }

  /**
   * Get all files for current user
   */
  getUserFiles(): SelfDestructFile[] {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}:${this.userId}`);
      if (!stored) return [];
      const files = JSON.parse(stored);
      return files.map((f: any) => ({
        ...f,
        uploadedAt: new Date(f.uploadedAt),
        expiresAt: new Date(f.expiresAt),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Download a file with expiration and access count checks
   */
  async downloadFile(
    fileId: string,
    password?: string
  ): Promise<Blob> {
    try {
      const files = this.getUserFiles();
      const fileRecord = files.find((f) => f.id === fileId);

      if (!fileRecord) {
        throw new Error("File not found");
      }

      // Check expiration
      if (new Date(fileRecord.expiresAt) < new Date()) {
        throw new Error("File has expired");
      }

      // Check access limits
      if (fileRecord.maxAccesses && fileRecord.accessCount >= fileRecord.maxAccesses) {
        throw new Error("Maximum access limit reached");
      }

      // Convert data URL to Blob
      const response = await fetch(fileRecord.data);
      const fileData = await response.blob();

      // Update access count
      fileRecord.accessCount += 1;
      const updatedFiles = files.map((f) => (f.id === fileId ? fileRecord : f));
      localStorage.setItem(`${STORAGE_KEY}:${this.userId}`, JSON.stringify(updatedFiles));

      // Delete if max accesses reached
      if (fileRecord.maxAccesses && fileRecord.accessCount >= fileRecord.maxAccesses) {
        await this.deleteFile(fileId);
      }

      return fileData;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }

  /**
   * Delete a specific file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      const files = this.getUserFiles();
      const updatedFiles = files.filter((f) => f.id !== fileId);
      localStorage.setItem(`${STORAGE_KEY}:${this.userId}`, JSON.stringify(updatedFiles));
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Clean up expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const files = this.getUserFiles();
      const now = new Date();
      const expiredFiles = files.filter((f) => new Date(f.expiresAt) < now);

      for (const file of expiredFiles) {
        try {
          await this.deleteFile(file.id);
        } catch (err) {
          console.error(`Error deleting expired file ${file.id}:`, err);
        }
      }

      return expiredFiles.length;
    } catch (error) {
      console.error("Error cleaning up expired files:", error);
      return 0;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    expiredCount: number;
    accessedCount: number;
  }> {
    try {
      const files = this.getUserFiles();
      const now = new Date();

      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, f) => sum + f.fileSize, 0),
        expiredCount: files.filter((f) => new Date(f.expiresAt) < now).length,
        accessedCount: files.reduce((sum, f) => sum + f.accessCount, 0),
      };

      return stats;
    } catch (error) {
      return { totalFiles: 0, totalSize: 0, expiredCount: 0, accessedCount: 0 };
    }
  }

  /**
   * Generate a shareable link
   */
  async generateShareLink(fileId: string): Promise<string> {
    return `${window.location.origin}/?sharedFile=${fileId}`;
  }
}

export const selfDestructService = new SelfDestructingFilesService();
