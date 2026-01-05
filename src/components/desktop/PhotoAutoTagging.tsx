import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Image as ImageIcon, Plus, Search, Trash2, Tag, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { photoTaggingService, TaggedPhoto, PhotoTag } from "@/lib/photo-auto-tagging";

export const PhotoAutoTagging = ({ userId }: { userId: string }) => {
  const [photos, setPhotos] = useState<TaggedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<TaggedPhoto | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [allTags, setAllTags] = useState<any[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<TaggedPhoto[]>([]);

  useEffect(() => {
    loadPhotos();
  }, []);

  useEffect(() => {
    if (searchTag) {
      handleSearch(searchTag);
    } else {
      setFilteredPhotos(photos);
    }
  }, [photos, searchTag]);

  useEffect(() => {
    loadTags();
  }, [photos]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const savedPhotos = await photoTaggingService.getSavedPhotos(userId);
      setPhotos(savedPhotos);
    } catch (error) {
      console.error("Error loading photos:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await photoTaggingService.getAllTags(photos);
      setAllTags(tags);
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const handleUploadAndTag = async (files: FileList | null) => {
    if (!files) return;

    try {
      setLoading(true);
      for (const file of Array.from(files)) {
        const taggedPhoto = await photoTaggingService.tagPhoto(file, userId);
        setPhotos([...photos, taggedPhoto]);
      }
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Error uploading photos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (tag: string) => {
    try {
      const results = await photoTaggingService.searchByTag(photos, tag);
      setFilteredPhotos(results);
    } catch (error) {
      console.error("Error searching photos:", error);
    }
  };

  const handleAddCustomTag = async (tagLabel: string) => {
    if (!selectedPhoto || !tagLabel.trim()) return;

    try {
      const updated = await photoTaggingService.addCustomTag(selectedPhoto, tagLabel);
      setSelectedPhoto(updated);
      const photoIndex = photos.findIndex(p => p.id === selectedPhoto.id);
      if (photoIndex >= 0) {
        const newPhotos = [...photos];
        newPhotos[photoIndex] = updated;
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedPhoto) return;

    try {
      const updated = await photoTaggingService.removeTag(selectedPhoto, tagId);
      setSelectedPhoto(updated);
      const photoIndex = photos.findIndex(p => p.id === selectedPhoto.id);
      if (photoIndex >= 0) {
        const newPhotos = [...photos];
        newPhotos[photoIndex] = updated;
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error("Error removing tag:", error);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    setPhotos(photos.filter(p => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  };

  const handleSavePhotos = async () => {
    try {
      await photoTaggingService.saveTaggedPhotos(photos, userId);
      alert("✅ Photos saved!");
    } catch (error) {
      console.error("Error saving photos:", error);
    }
  };

  return (
    <div className="h-full flex gap-4 bg-gradient-to-br from-background to-card/50">
      {/* Sidebar - Photos */}
      <div className="w-80 border-r border-border bg-card/50 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <h2 className="font-bold text-foreground">📷 Auto-Tagging</h2>
          </div>

          <label className="block">
            <Button className="w-full mb-3" size="sm">
              <Plus className="w-4 h-4 mr-2" /> Upload Photos
            </Button>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleUploadAndTag(e.target.files)}
              className="hidden"
            />
          </label>

          <Input
            placeholder="Search by tag..."
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
          />
        </div>

        {/* Tags Cloud */}
        <div className="p-4 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Popular Tags</p>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 5).map((tag) => (
              <button
                key={tag.name}
                onClick={() => setSearchTag(tag.name)}
                className="text-xs bg-primary/20 hover:bg-primary/30 px-2 py-1 rounded transition-colors"
              >
                {tag.name} ({tag.count})
              </button>
            ))}
          </div>
        </div>

        {/* Photos Grid */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No photos yet</div>
          ) : (
            filteredPhotos.map((photo) => (
              <motion.button
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                whileHover={{ scale: 1.02 }}
                className={`w-full text-left rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedPhoto?.id === photo.id
                    ? "border-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  className="w-full h-32 object-cover"
                />
                <div className="p-2 bg-card/50">
                  <p className="text-xs font-semibold truncate">{photo.fileName}</p>
                  <p className="text-xs text-muted-foreground">{photo.tags.length} tags</p>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Main Area - Photo Details */}
      <div className="flex-1 p-6 overflow-auto">
        {selectedPhoto ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.fileName}
              className="w-full max-w-2xl rounded-lg shadow-lg"
            />

            {/* Photo Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">{selectedPhoto.fileName}</h3>

              {/* Detected Faces */}
              {selectedPhoto.faces.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Faces
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.faces.map((face) => (
                      <span
                        key={face.id}
                        className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full"
                      >
                        {face.name || "Unknown"} ({Math.round(face.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Objects */}
              {selectedPhoto.objects.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Objects</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.objects.map((obj, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full"
                      >
                        {obj.name} ({Math.round(obj.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Scene Tags */}
              {selectedPhoto.scenes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">Scene</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPhoto.scenes.map((scene) => (
                      <span
                        key={scene}
                        className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full"
                      >
                        {scene}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Tags */}
              <div className="mb-6">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" /> All Tags
                </h4>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedPhoto.tags.map((tag) => (
                    <motion.div
                      key={tag.id}
                      whileHover={{ scale: 1.05 }}
                      className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {tag.label}
                      {tag.type === "custom" && (
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag..."
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddCustomTag((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  onClick={() => handleDeletePhoto(selectedPhoto.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
                <Button onClick={handleSavePhotos} variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-2" /> Save All
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a photo to view tags</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
