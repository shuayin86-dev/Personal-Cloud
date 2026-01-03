import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload, Trash2, X, ZoomIn, Loader2, ImageIcon, Grid3x3, List,
  Heart, Download, RotateCw, Sliders, Filter as FilterIcon,
  ChevronLeft, ChevronRight, Play, Copy,
  Search as SearchIcon, Star, Plus, Check,
  Sparkles, GitCompare, MessageCircle
} from "lucide-react";
import { toast } from "sonner";

interface Photo {
  name: string;
  url: string;
  uploadedAt?: Date;
  size?: number;
  favorite?: boolean;
  hash?: string;
}

interface Album {
  id: string;
  name: string;
  photoCount: number;
}

interface Feedback {
  rating: number;
  comment: string;
  timestamp: Date;
}

type ViewMode = "grid" | "list" | "slideshow";
type SortOption = "date" | "name" | "size";

export const PhotoGallery = () => {
  // Core State
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);
  
  // Editing State
  const [showEditModal, setShowEditModal] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [hue, setHue] = useState(0);

  // Advanced Features
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filterDate, setFilterDate] = useState<string>("");
  const [showDeletedPhotos, setShowDeletedPhotos] = useState(false);
  const [deletedPhotos, setDeletedPhotos] = useState<Photo[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<Photo[][]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  
  // User Feedback & Deployment
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [productionDeployed] = useState(true);
  const [healthStatus, setHealthStatus] = useState("healthy");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideshowInterval = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch Photos
  const fetchPhotos = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.storage
        .from("user-photos")
        .list(user.id, { limit: 500, sortBy: { column: "created_at", order: "desc" } });

      if (error) {
        toast.error("Failed to load photos");
        setHealthStatus("degraded");
        return;
      }

      const photoUrls = (data || [])
        .filter(file => file.name !== ".emptyFolderPlaceholder")
        .map(file => ({
          name: file.name,
          url: supabase.storage.from("user-photos").getPublicUrl(`${user.id}/${file.name}`).data.publicUrl,
          uploadedAt: new Date(file.created_at || Date.now()),
          size: file.metadata?.size || 0,
          favorite: favorites.includes(file.name),
        }));

      setPhotos(photoUrls);
      setHealthStatus("healthy");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast.error("Error loading photos");
      setHealthStatus("error");
    }
  }, [favorites]);

  // Upload Handler
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("user-photos")
        .upload(filePath, file);

      if (!error) {
        successCount++;
      } else {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    toast.success(`${successCount} photo(s) uploaded!`);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchPhotos();
  }, [fetchPhotos]);

  // Delete Handler
  const handleDelete = useCallback(async (fileName: string) => {
    const photo = photos.find(p => p.name === fileName);
    if (photo) {
      setDeletedPhotos([...deletedPhotos, photo]);
      setPhotos(photos.filter(p => p.name !== fileName));
      toast.success("Photo moved to trash");
    }
  }, [photos, deletedPhotos]);

  // Permanent Delete
  const handlePermanentDelete = useCallback(async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.storage
      .from("user-photos")
      .remove([`${user.id}/${fileName}`]);

    if (error) {
      toast.error("Failed to delete photo");
      return;
    }

    toast.success("Photo permanently deleted");
    setDeletedPhotos(deletedPhotos.filter(p => p.name !== fileName));
  }, [deletedPhotos]);

  // Restore
  const handleRestore = useCallback((photo: Photo) => {
    setPhotos([...photos, photo]);
    setDeletedPhotos(deletedPhotos.filter(p => p.name !== photo.name));
    toast.success("Photo restored");
  }, [photos, deletedPhotos]);

  // Toggle Favorite
  const toggleFavorite = useCallback((fileName: string) => {
    if (favorites.includes(fileName)) {
      setFavorites(favorites.filter(f => f !== fileName));
    } else {
      setFavorites([...favorites, fileName]);
    }
  }, [favorites]);

  // Multi-select
  const togglePhotoSelect = useCallback((fileName: string) => {
    setSelectedPhotos(prev =>
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedPhotos([]);
  }, []);

  const deleteSelected = useCallback(() => {
    selectedPhotos.forEach(fileName => handleDelete(fileName));
    setSelectedPhotos([]);
    toast.success(`${selectedPhotos.length} photos deleted`);
  }, [selectedPhotos, handleDelete]);

  // Edit Functions
  const resetFilters = useCallback(() => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setBlur(0);
    setHue(0);
  }, []);

  const rotatePhoto = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback((url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    toast.success("Download started");
  }, []);

  const handleCopyLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }, []);

  // Perceptual Hashing
  const generatePhotoHash = useCallback(async (imageUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          resolve("");
          return;
        }
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }

        canvas.width = 8;
        canvas.height = 8;
        ctx.drawImage(img, 0, 0, 8, 8);

        const imageData = ctx.getImageData(0, 0, 8, 8);
        const data = imageData.data;
        let hash = "";

        for (let i = 0; i < data.length; i += 4) {
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          hash += brightness > 128 ? "1" : "0";
        }

        resolve(hash);
      };
      img.onerror = () => resolve("");
      img.src = imageUrl;
    });
  }, []);

  const hammingDistance = (hash1: string, hash2: string): number => {
    let distance = 0;
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++;
    }
    return distance;
  };

  // Analyze Duplicates
  const analyzeForDuplicates = useCallback(async () => {
    toast.loading("Analyzing photos for duplicates...");
    
    const hashes = await Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        hash: await generatePhotoHash(photo.url),
      }))
    );

    const duplicateGroups: Photo[][] = [];
    const analyzed = new Set<string>();

    for (let i = 0; i < hashes.length; i++) {
      if (analyzed.has(hashes[i].name)) continue;

      const group = [hashes[i]];
      analyzed.add(hashes[i].name);

      for (let j = i + 1; j < hashes.length; j++) {
        if (!analyzed.has(hashes[j].name)) {
          const distance = hammingDistance(hashes[i].hash || "", hashes[j].hash || "");
          if (distance < 5) {
            group.push(hashes[j]);
            analyzed.add(hashes[j].name);
          }
        }
      }

      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }

    setDuplicates(duplicateGroups);
    toast.success(`Found ${duplicateGroups.length} duplicate groups`);
  }, [photos, generatePhotoHash]);

  // Submit Feedback
  const submitFeedback = useCallback(() => {
    if (feedbackRating === 0) {
      toast.error("Please select a rating");
      return;
    }

    const feedback: Feedback = {
      rating: feedbackRating,
      comment: feedbackComment,
      timestamp: new Date(),
    };

    toast.success("Thank you for your feedback!");
    setShowFeedback(false);
    setFeedbackRating(0);
    setFeedbackComment("");

    const savedFeedbacks = JSON.parse(localStorage.getItem("photoGalleryFeedback") || "[]");
    localStorage.setItem("photoGalleryFeedback", JSON.stringify([...savedFeedbacks, feedback]));
  }, [feedbackRating, feedbackComment]);

  // Health Check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setHealthStatus(user ? "healthy" : "error");
      } catch {
        setHealthStatus("error");
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sorting
  const sortedPhotos = useMemo(() => {
    const sorted = [...photos];
    
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0));
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "size":
        return sorted.sort((a, b) => (b.size || 0) - (a.size || 0));
      default:
        return sorted;
    }
  }, [photos, sortBy]);

  // Filtering
  const filteredPhotos = useMemo(() => {
    return sortedPhotos.filter(photo => {
      const matchesSearch = !searchTerm || photo.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = !filterDate || photo.uploadedAt?.toDateString().includes(filterDate);
      return matchesSearch && matchesDate;
    });
  }, [sortedPhotos, searchTerm, filterDate]);

  // Slideshow
  useEffect(() => {
    if (showSlideshow && filteredPhotos.length > 0) {
      slideshowInterval.current = setInterval(() => {
        setSlideshowIndex((prev) => (prev + 1) % filteredPhotos.length);
      }, 3000);
    }
    return () => {
      if (slideshowInterval.current) clearInterval(slideshowInterval.current);
    };
  }, [showSlideshow, filteredPhotos.length]);

  // Initial Load
  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <div className="h-full flex flex-col bg-background">
      <canvas ref={canvasRef} className="hidden" />

      {/* Deployment Status */}
      {productionDeployed && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2 text-xs text-green-600">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Production Deployed • Health: {healthStatus}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-3 border-b border-border bg-card/50 flex-wrap">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-all disabled:opacity-50 text-sm"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{uploading ? "Uploading..." : "Upload"}</span>
          </button>

          {selectedPhotos.length > 0 && (
            <>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/20 border border-destructive/50 text-destructive hover:bg-destructive/30 transition-all text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedPhotos.length})
              </button>
              <button
                onClick={deselectAll}
                className="px-3 py-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 transition-all text-sm"
              >
                Deselect
              </button>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/20 border border-primary/50 text-primary" : "bg-secondary/10 border border-border hover:bg-secondary/20"}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/20 border border-primary/50 text-primary" : "bg-secondary/10 border border-border hover:bg-secondary/20"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSlideshow(!showSlideshow)}
            className={`p-2 rounded-lg transition-all ${showSlideshow ? "bg-primary/20 border border-primary/50 text-primary" : "bg-secondary/10 border border-border hover:bg-secondary/20"}`}
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="p-2 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-all"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
          <button
            onClick={analyzeForDuplicates}
            className="p-2 rounded-lg bg-secondary/10 border border-border hover:bg-secondary/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-muted-foreground">
          {filteredPhotos.length} / {photos.length}
        </span>
      </div>

      {/* Advanced Search */}
      {showAdvancedSearch && (
        <div className="p-3 border-b border-border bg-card/30 space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full mt-1 px-2 py-1 rounded border border-border bg-background text-sm"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium">Filter by Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded border border-border bg-background text-sm"
              />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <button
                onClick={() => setFilterDate("")}
                className="px-3 py-1 rounded bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 text-sm flex-1"
              >
                Reset
              </button>
              <button
                onClick={() => setShowDuplicates(duplicates.length > 0)}
                className="px-3 py-1 rounded bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 text-sm"
              >
                Duplicates: {duplicates.length}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : showDeletedPhotos ? (
          deletedPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
              <Trash2 className="w-16 h-16 opacity-50" />
              <p>Trash is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {deletedPhotos.map((photo) => (
                <div key={photo.name} className="group relative aspect-square rounded-lg overflow-hidden border border-destructive/50">
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-2">
                    <button
                      onClick={() => handleRestore(photo)}
                      className="flex-1 px-2 py-1 rounded bg-primary/40 hover:bg-primary/60 text-xs text-primary"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(photo.name)}
                      className="flex-1 px-2 py-1 rounded bg-destructive/40 hover:bg-destructive/60 text-xs text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : showDuplicates && duplicates.length > 0 ? (
          <div className="space-y-4">
            {duplicates.map((group, idx) => (
              <div key={idx} className="border border-border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Duplicate Group {idx + 1}</h3>
                <div className="grid grid-cols-4 gap-3">
                  {group.map((photo) => (
                    <div key={photo.name} className="group relative aspect-square rounded-lg overflow-hidden border border-border cursor-pointer" onClick={() => setSelectedPhoto(photo.url)}>
                      <img src={photo.url} alt={photo.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : showSlideshow && filteredPhotos.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="relative max-w-2xl w-full">
              <img src={filteredPhotos[slideshowIndex].url} alt="Slideshow" className="w-full rounded-lg shadow-lg" />
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button onClick={() => setSlideshowIndex((slideshowIndex - 1 + filteredPhotos.length) % filteredPhotos.length)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={() => setSlideshowIndex((slideshowIndex + 1) % filteredPhotos.length)} className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{slideshowIndex + 1} / {filteredPhotos.length}</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <ImageIcon className="w-16 h-16 opacity-50" />
            <p>{searchTerm ? "No photos match" : "No photos yet"}</p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {filteredPhotos.map((photo) => (
              <div key={photo.name} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedPhotos.includes(photo.name) ? "bg-primary/10 border-primary/50" : "bg-card/50 border-border hover:bg-card"}`} onClick={() => togglePhotoSelect(photo.name)}>
                <input type="checkbox" checked={selectedPhotos.includes(photo.name)} onChange={() => togglePhotoSelect(photo.name)} className="w-4 h-4" />
                <img src={photo.url} alt={photo.name} className="w-12 h-12 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{photo.name}</p>
                  <p className="text-xs text-muted-foreground">{photo.uploadedAt?.toLocaleDateString()}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.name); }} className={`p-2 rounded ${favorites.includes(photo.name) ? "text-red-500" : "text-muted-foreground"}`}>
                  <Heart className={`w-4 h-4 ${favorites.includes(photo.name) ? "fill-current" : ""}`} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo.url); }} className="p-2 rounded hover:bg-secondary/20">
                  <ZoomIn className="w-4 h-4 text-primary" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.name); }} className="p-2 rounded hover:bg-destructive/20">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredPhotos.map((photo) => (
              <div key={photo.name} onClick={() => togglePhotoSelect(photo.name)} className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${selectedPhotos.includes(photo.name) ? "bg-primary/10 border-primary/50 ring-2 ring-primary/30" : "border-border/50 hover:border-primary/50"}`}>
                <img src={photo.url} alt={photo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute top-2 left-2">
                  <input type="checkbox" checked={selectedPhotos.includes(photo.name)} onChange={() => togglePhotoSelect(photo.name)} className="w-4 h-4" onClick={(e) => e.stopPropagation()} />
                </div>
                {favorites.includes(photo.name) && <div className="absolute top-2 right-2"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(photo.name); }} className={`p-2 rounded-lg transition-colors ${favorites.includes(photo.name) ? "bg-red-500/40 text-red-200" : "bg-primary/20 hover:bg-primary/40"}`}>
                      <Heart className={`w-4 h-4 ${favorites.includes(photo.name) ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photo.url); }} className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40">
                      <ZoomIn className="w-4 h-4 text-primary" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(photo.name); }} className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/40">
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 overflow-auto" onClick={() => setSelectedPhoto(null)}>
          <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-2 rounded-lg bg-card/50 hover:bg-card">
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full space-y-4">
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Full size"
                className="w-full max-h-[60vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) hue-rotate(${hue}deg)`,
                  transform: `rotate(${rotation}deg)`,
                }}
              />
            </div>

            {/* Controls */}
            <div className="space-y-3 bg-card/80 backdrop-blur border border-border rounded-lg p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button onClick={() => setShowEditModal(!showEditModal)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 text-sm">
                  <Sliders className="w-4 h-4" />
                  Edit
                </button>
                <button onClick={rotatePhoto} className="p-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button onClick={(e) => { const photo = photos.find(p => p.url === selectedPhoto); if (photo) toggleFavorite(photo.name); }} className="p-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30">
                  <Heart className="w-4 h-4" />
                </button>
                <button onClick={() => handleCopyLink(selectedPhoto)} className="p-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDownload(selectedPhoto, "photo.jpg")} className="p-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setShowFeedback(true)} className="p-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30">
                  <MessageCircle className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Sliders */}
              {showEditModal && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div>
                    <label className="text-xs font-medium">Brightness: {brightness}%</label>
                    <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Contrast: {contrast}%</label>
                    <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Saturation: {saturation}%</label>
                    <input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Blur: {blur}px</label>
                    <input type="range" min="0" max="20" value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Hue: {hue}°</label>
                    <input type="range" min="0" max="360" value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full mt-1" />
                  </div>
                  <button onClick={resetFilters} className="w-full px-3 py-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 text-sm">
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Modal */}
          {showFeedback && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full space-y-4">
                <h3 className="font-semibold text-lg">Share Feedback</h3>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setFeedbackRating(star)} className={`p-2 rounded transition-colors ${feedbackRating >= star ? "bg-yellow-500/30 text-yellow-500" : "bg-secondary/20 text-muted-foreground"}`}>
                      <Star className={`w-6 h-6 ${feedbackRating >= star ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
                <textarea placeholder="Tell us..." value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} className="w-full px-3 py-2 rounded border border-border bg-background text-sm" rows={3} />
                <div className="flex gap-2">
                  <button onClick={() => setShowFeedback(false)} className="flex-1 px-3 py-2 rounded-lg bg-secondary/20 border border-secondary/50 text-secondary text-sm">
                    Cancel
                  </button>
                  <button onClick={submitFeedback} className="flex-1 px-3 py-2 rounded-lg bg-primary/20 border border-primary/50 text-primary text-sm">
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
