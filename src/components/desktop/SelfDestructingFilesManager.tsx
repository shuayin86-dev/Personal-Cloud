import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Trash2, Download, Lock, Clock, Eye, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { selfDestructService, SelfDestructFile } from "@/lib/self-destructing-files";

export const SelfDestructingFilesManager = ({ userId }: { userId: string }) => {
  const [files, setFiles] = useState<SelfDestructFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiration, setExpiration] = useState<"1hour" | "1day" | "7days" | "30days">("1day");
  const [maxAccesses, setMaxAccesses] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadFiles();
    loadStats();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const userFiles = selfDestructService.getUserFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error("Error loading files:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const fileStats = await selfDestructService.getFileStats();
      setStats(fileStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file");
      return;
    }

    try {
      setLoading(true);
      await selfDestructService.uploadSelfDestructFile(
        selectedFile,
        expiration,
        undefined,
        maxAccesses || undefined,
        password || undefined
      );

      setSelectedFile(null);
      setPassword("");
      setMaxAccesses(null);
      setShowUpload(false);
      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await selfDestructService.deleteFile(fileId);
      await loadFiles();
      await loadStats();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      const blob = await selfDestructService.downloadFile(fileId, password || undefined);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.fileName;
      a.click();
      
      await loadFiles();
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Error: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const getTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background to-card/50">
      {/* Header */}
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">🔐 Self-Destructing Files</h2>
            <p className="text-xs text-muted-foreground">Upload files that auto-expire</p>
          </div>
          <Button onClick={() => setShowUpload(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" /> Upload
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Total Files</p>
              <p className="text-lg font-bold">{stats.totalFiles}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Total Size</p>
              <p className="text-lg font-bold">{formatFileSize(stats.totalSize)}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-lg font-bold text-red-500">{stats.expiredCount}</p>
            </div>
            <div className="bg-background rounded p-2">
              <p className="text-xs text-muted-foreground">Accessed</p>
              <p className="text-lg font-bold">{stats.accessedCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Upload Self-Destructing File</h3>
              <button onClick={() => setShowUpload(false)}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {selectedFile && <p className="text-xs text-muted-foreground mt-2">{selectedFile.name}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Expires After</label>
              <select
                value={expiration}
                onChange={(e) => setExpiration(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-border rounded"
              >
                <option value="1hour">1 Hour</option>
                <option value="1day">1 Day</option>
                <option value="7days">7 Days</option>
                <option value="30days">30 Days</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Max Accesses (optional)</label>
              <Input
                type="number"
                placeholder="Unlimited if empty"
                value={maxAccesses || ""}
                onChange={(e) => setMaxAccesses(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2">Password (optional)</label>
              <Input
                type="password"
                placeholder="Leave empty for no password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpload} disabled={loading} className="flex-1">
                {loading ? "Uploading..." : "Upload"}
              </Button>
              <Button onClick={() => setShowUpload(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Files List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No files uploaded yet</div>
        ) : (
          files.map((file) => {
            const isExpired = new Date(file.expiresAt) < new Date();
            return (
              <motion.div
                key={file.id}
                whileHover={{ scale: 1.02 }}
                className={`bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 ${
                  isExpired ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <p className="font-semibold text-foreground">{file.fileName}</p>
                      {file.hasPassword && <Lock className="w-4 h-4 text-yellow-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.fileSize)} • Accessed {file.accessCount} times
                      {file.maxAccesses && ` / ${file.maxAccesses}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isExpired && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file.id)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className={isExpired ? "text-red-500" : "text-muted-foreground"}>
                    {isExpired ? "Expired" : `Expires in ${getTimeRemaining(file.expiresAt)}`}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
