import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  updated_at: string;
}

export const NotesApp = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotes = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      toast.error("Failed to load notes");
    } else {
      setNotes(data || []);
      setSelectedNote(prev => prev ?? (data && data.length > 0 ? data[0] : null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const createNote = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: "Untitled Note",
        content: ""
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create note");
    } else if (data) {
      setNotes([data, ...notes]);
      setSelectedNote(data);
    }
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    setSaving(true);

    const { error } = await supabase
      .from("notes")
      .update({
        title: selectedNote.title,
        content: selectedNote.content
      })
      .eq("id", selectedNote.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save note");
    } else {
      setNotes(notes.map(n => n.id === selectedNote.id ? selectedNote : n));
      toast.success("Note saved");
    }
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete note");
    } else {
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      if (selectedNote?.id === id) {
        setSelectedNote(updatedNotes[0] || null);
      }
    }
  };

  const updateSelectedNote = (field: "title" | "content", value: string) => {
    if (!selectedNote) return;
    setSelectedNote({ ...selectedNote, [field]: value });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar - Notes List */}
      <div className="w-64 border-r border-border flex flex-col bg-card/50">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Notes</span>
          <button 
            onClick={createNote}
            className="w-7 h-7 rounded-lg bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          {notes.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notes yet. Create one!
            </div>
          ) : (
            notes.map(note => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note)}
                className={`p-3 border-b border-border cursor-pointer transition-colors group ${
                  selectedNote?.id === note.id ? "bg-primary/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {note.title || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center hover:bg-destructive/20 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            <div className="p-3 border-b border-border flex items-center justify-between bg-card/50">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => updateSelectedNote("title", e.target.value)}
                placeholder="Note title..."
                className="flex-1 bg-transparent border-none outline-none text-foreground font-medium text-lg"
              />
              <button
                onClick={saveNote}
                disabled={saving}
                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
            <textarea
              value={selectedNote.content}
              onChange={(e) => updateSelectedNote("content", e.target.value)}
              placeholder="Start writing..."
              className="flex-1 p-4 bg-transparent border-none outline-none resize-none text-foreground placeholder:text-muted-foreground"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a note or create a new one
          </div>
        )}
      </div>
    </div>
  );
};
