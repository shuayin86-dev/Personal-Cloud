import { supabase } from "@/integrations/supabase/client";

export interface SelfDestructFile {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  expiresAt: Date;
  accessCount: number;
  maxAccesses?: number;
  fileUrl: string;
  encrypted: boolean;
  password?: string;
}

export class SelfDestructingFilesService {
  /**
   * Upload a file that will auto-delete after expiration
   */
  async uploadSelfDestructFile(
    file: File,
    userId: string,
    expirationTime: "1hour" | "1day" | "7days" | "30days" | "custom",
    customMinutes?: number,
    maxAccesses?: number,
    password?: string,
    encrypted: boolean = true
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

      // Upload to Supabase Storage with metadata
      const fileName = `${userId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("self-destruct-files")
        .upload(fileName, file, {
          cacheControl: "0",
          upsert: false,
          metadata: {
            expiresAt: expiresAt.toISOString(),
            encrypted: encrypted.toString(),
            maxAccesses: maxAccesses?.toString() || "unlimited",
          },
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("self-destruct-files").getPublicUrl(fileName);

      // Store metadata in database
      const { data: fileRecord, error: dbError } = await supabase
        .from("self_destruct_files")
        .insert({
          file_name: file.name,
          file_size: file.size,
          uploaded_by: userId,
          expires_at: expiresAt.toISOString(),
          access_count: 0,
          max_accesses: maxAccesses || null,
          file_url: publicUrl,
          encrypted: encrypted,
          password: password ? this.hashPassword(password) : null,
          storage_path: fileName,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: fileRecord.id,
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: userId,
        uploadedAt: new Date(fileRecord.created_at),
        expiresAt,
        accessCount: 0,
        maxAccesses,
        fileUrl: publicUrl,
        encrypted,
        password,
      };
    } catch (error) {
      console.error("Error uploading self-destructing file:", error);
      throw error;
    }
  }

  /**
   * Get list of user's self-destructing files
   */
  async getUserFiles(userId: string): Promise<SelfDestructFile[]> {
    try {
      const { data, error } = await supabase
        .from("self_destruct_files")
        .select("*")
        .eq("uploaded_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((file: any) => ({
        id: file.id,
        fileName: file.file_name,
        fileSize: file.file_size,
        uploadedBy: file.uploaded_by,
        uploadedAt: new Date(file.created_at),
        expiresAt: new Date(file.expires_at),
        accessCount: file.access_count,
        maxAccesses: file.max_accesses,
        fileUrl: file.file_url,
        encrypted: file.encrypted,
      }));
    } catch (error) {
      console.error("Error fetching user files:", error);
      throw error;
    }
  }

  /**
   * Download a file and increment access count
   */
  async downloadFile(fileId: string, password?: string): Promise<Blob> {
    try {
      // Get file metadata
      const { data: fileRecord, error: fetchError } = await supabase
        .from("self_destruct_files")
        .select("*")
        .eq("id", fileId)
        .single();

      if (fetchError) throw fetchError;

      // Check if expired
      if (new Date(fileRecord.expires_at) < new Date()) {
        throw new Error("This file has expired and is no longer available");
      }

      // Check if max accesses reached
      if (
        fileRecord.max_accesses &&
        fileRecord.access_count >= fileRecord.max_accesses
      ) {
        throw new Error(
          "Maximum access limit reached for this file"
        );
      }

      // Verify password if needed
      if (fileRecord.password && password) {
        if (this.hashPassword(password) !== fileRecord.password) {
          throw new Error("Incorrect password");
        }
      }

      // Download file
      const { data, error } = await supabase.storage
        .from("self-destruct-files")
        .download(fileRecord.storage_path);

      if (error) throw error;

      // Increment access count
      await supabase
        .from("self_destruct_files")
        .update({ access_count: fileRecord.access_count + 1 })
        .eq("id", fileId);

      // Check if should auto-delete after max accesses
      if (
        fileRecord.max_accesses &&
        fileRecord.access_count + 1 >= fileRecord.max_accesses
      ) {
        await this.deleteFile(fileId);
      }

      return data;
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  }

  /**
   * Delete a self-destructing file
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      // Get storage path
      const { data: fileRecord, error: fetchError } = await supabase
        .from("self_destruct_files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("self-destruct-files")
        .remove([fileRecord.storage_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("self_destruct_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  /**
   * Check for and clean up expired files
   */
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const now = new Date().toISOString();

      // Find expired files
      const { data: expiredFiles, error: fetchError } = await supabase
        .from("self_destruct_files")
        .select("id, storage_path")
        .lt("expires_at", now);

      if (fetchError) throw fetchError;

      let deletedCount = 0;

      // Delete each expired file
      for (const file of expiredFiles || []) {
        try {
          await this.deleteFile(file.id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting expired file ${file.id}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired files:", error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    expiredCount: number;
    accessedCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .from("self_destruct_files")
        .select("file_size, expires_at, access_count")
        .eq("uploaded_by", userId);

      if (error) throw error;

      const files = data || [];
      const now = new Date();
      let expiredCount = 0;
      let totalSize = 0;

      files.forEach((file: any) => {
        if (new Date(file.expires_at) < now) {
          expiredCount++;
        }
        totalSize += file.file_size;
      });

      return {
        totalFiles: files.length,
        totalSize,
        expiredCount,
        accessedCount: files.reduce(
          (sum: number, f: any) => sum + (f.access_count || 0),
          0
        ),
      };
    } catch (error) {
      console.error("Error fetching file stats:", error);
      throw error;
    }
  }

  /**
   * Simple password hashing (in production, use bcrypt)
   */
  private hashPassword(password: string): string {
    return btoa(password); // Base64 encoding for demo
  }

  /**
   * Share file with link (generate shareable link)
   */
  async generateShareLink(fileId: string): Promise<string> {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-file/${fileId}`;
  }
}

export const selfDestructService = new SelfDestructingFilesService();
