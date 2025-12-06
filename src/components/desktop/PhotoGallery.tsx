import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Trash2, X, ZoomIn, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  name: string;
  url: string;
}

export const PhotoGallery = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase.storage
      .from("user-photos")
      .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      toast.error("Failed to load photos");
      return;
    }

    const photoUrls = data
      .filter(file => file.name !== ".emptyFolderPlaceholder")
      .map(file => ({
        name: file.name,
        url: supabase.storage.from("user-photos").getPublicUrl(`${user.id}/${file.name}`).data.publicUrl,
      }));

    setPhotos(photoUrls);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from("user-photos")
        .upload(filePath, file);

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    toast.success("Photos uploaded successfully!");
    setUploading(false);
    fetchPhotos();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (fileName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.storage
      .from("user-photos")
      .remove([`${user.id}/${fileName}`]);

    if (error) {
      toast.error("Failed to delete photo");
      return;
    }

    toast.success("Photo deleted");
    setPhotos(photos.filter(p => p.name !== fileName));
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card/50">
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span className="text-sm font-medium">{uploading ? "Uploading..." : "Upload Photos"}</span>
        </button>
        <span className="text-sm text-muted-foreground">{photos.length} photos</span>
      </div>

      {/* Gallery Grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <ImageIcon className="w-16 h-16 opacity-50" />
            <p>No photos yet. Upload some to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.name}
                className="group relative aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all cursor-pointer"
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onClick={() => setSelectedPhoto(photo.url)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedPhoto(photo.url)}
                      className="p-2 rounded-lg bg-primary/20 hover:bg-primary/40 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-primary" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.name); }}
                      className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 rounded-lg bg-card/50 hover:bg-card transition-colors"
          >
            <X className="w-6 h-6 text-foreground" />
          </button>
          <img
            src={selectedPhoto}
            alt="Full size"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
