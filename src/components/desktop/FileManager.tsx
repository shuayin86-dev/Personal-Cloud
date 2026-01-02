import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Folder, FileText, Plus, Trash2, Edit2, Download, Upload, Copy, Move, Search as SearchIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserFile {
  id: string;
  name: string;
  content: string | null;
  file_type: string;
  parent_folder: string;
}

export const FileManager = () => {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [folderStack, setFolderStack] = useState<string[]>(["root"]);
  const currentFolder = folderStack[folderStack.length - 1] ?? "root";
  const [selectedFile, setSelectedFile] = useState<UserFile | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [createType, setCreateType] = useState<"file" | "folder">("file");
  const { toast } = useToast();

  const fetchFiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_files")
      .select("*")
      .eq("user_id", user.id)
      .eq("parent_folder", currentFolder)
      .order("file_type", { ascending: false })
      .order("name");

    if (data) setFiles(data);
  }, [currentFolder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const createItem = async () => {
    if (!newName.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("user_files").insert({
      user_id: user.id,
      name: newName,
      content: createType === "file" ? "" : null,
      file_type: createType === "folder" ? "folder" : "text",
      parent_folder: currentFolder,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setNewName("");
    setIsCreating(false);
    fetchFiles();
    toast({ title: "Created", description: `${createType === "folder" ? "Folder" : "File"} created` });
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase.from("user_files").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setSelectedFile(null);
    fetchFiles();
    toast({ title: "Deleted", description: "Item deleted" });
  };

  const openItem = (file: UserFile) => {
    if (file.file_type === "folder") {
      setFolderStack((s) => [...s, file.name]);
      setSelectedFile(null);
    } else {
      setSelectedFile(file);
    }
  };

  const goBack = () => {
    setFolderStack(["root"]);
    setSelectedFile(null);
  };

  const navigateUp = () => {
    setFolderStack((s) => (s.length > 1 ? s.slice(0, s.length - 1) : ["root"]));
    setSelectedFile(null);
  };

  const renameItem = async (id: string) => {
    const item = files.find((f) => f.id === id);
    if (!item) return;
    const newNamePrompt = window.prompt("Rename item", item.name);
    if (!newNamePrompt || newNamePrompt.trim() === item.name) return;
    const { error } = await supabase.from("user_files").update({ name: newNamePrompt }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    fetchFiles();
    toast({ title: "Renamed", description: "Item renamed" });
  };

  const downloadItem = (file: UserFile) => {
    if (!file.content) return toast({ title: "Empty", description: "No content to download" });
    try {
      const blob = new Blob([file.content], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Error", description: "Failed to download" , variant: "destructive"});
    }
  };

  const handleUploadFiles = async (filesList: FileList | null) => {
    if (!filesList) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast({ title: "Not signed in" });
    for (let i = 0; i < filesList.length; i++) {
      const f = filesList[i];
      const text = await f.text();
      const fileType = f.type || "binary";
      const { error } = await supabase.from("user_files").insert({
        user_id: user.id,
        name: f.name,
        content: text,
        file_type: fileType.startsWith("image") ? "image" : "text",
        parent_folder: currentFolder,
      });
      if (error) toast({ title: "Upload error", description: error.message, variant: "destructive" });
    }
    fetchFiles();
    toast({ title: "Uploaded" });
  };

  const moveToRoot = async (id: string) => {
    const { error } = await supabase.from("user_files").update({ parent_folder: "root" }).eq("id", id);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    fetchFiles();
    toast({ title: "Moved", description: "Moved to Home" });
  };

  const toggleSelect = (id: string) => {
    setMultiSelect((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <div className="h-full flex bg-background">
      {/* Sidebar */}
      <div className="w-48 bg-card/50 border-r border-border p-3">
        <h3 className="font-semibold text-sm text-foreground mb-3">Quick Access</h3>
        <button
          onClick={() => { setCurrentFolder("root"); setSelectedFile(null); }}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-primary/10 ${
            currentFolder === "root" ? "bg-primary/20" : ""
          }`}
        >
          <Folder className="w-4 h-4 text-primary" />
          Home
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-card border-b border-border">
          {folderStack.length > 1 && (
            <Button size="sm" variant="ghost" onClick={navigateUp}>
              ← Up
            </Button>
          )}
          <div className="flex items-center gap-2">
            <nav className="text-sm text-muted-foreground">
              {folderStack.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => setFolderStack((s) => s.slice(0, idx + 1))}
                  className="hover:underline mr-1"
                >
                  {f === "root" ? "Home" : f}
                </button>
              ))}
            </nav>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary outline-none"
              />
              <SearchIcon className="absolute right-2 top-2 w-4 h-4 text-muted-foreground" />
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-sm px-2 py-1 bg-background border border-border rounded">
              <option value="name">Sort: Name</option>
              <option value="type">Sort: Type</option>
            </select>
          </div>
          <div className="flex-1" />
          <input ref={fileInputRef} type="file" multiple onChange={(e) => handleUploadFiles(e.target.files)} className="hidden" />
          <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-1" /> Upload
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsCreating(true); setCreateType("folder"); }}>
            <Folder className="w-4 h-4 mr-1" /> New Folder
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { setIsCreating(true); setCreateType("file"); }}>
            <Plus className="w-4 h-4 mr-1" /> New File
          </Button>
        </div>

        {/* Create dialog */}
        {isCreating && (
          <div className="p-2 bg-card/50 border-b border-border flex items-center gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`New ${createType} name...`}
              className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:border-primary outline-none"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createItem()}
            />
            <Button size="sm" onClick={createItem}>Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Files grid */}
          <div className="flex-1 p-4 overflow-auto">
            <div className="grid grid-cols-4 gap-4">
              {(() => {
                let list = files.slice();
                if (searchTerm.trim()) list = list.filter((f) => f.name.toLowerCase().includes(searchTerm.toLowerCase()));
                if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
                else list.sort((a, b) => a.file_type.localeCompare(b.file_type));
                return list.map((file) => (
                  <div
                    key={file.id}
                    onDoubleClick={() => openItem(file)}
                    onClick={() => setSelectedFile(file)}
                    onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, id: file.id }); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedFile?.id === file.id ? "bg-primary/20" : "hover:bg-card"
                    }`}
                  >
                    <div className="flex items-start w-full justify-between">
                      <input type="checkbox" checked={multiSelect.includes(file.id)} onChange={() => toggleSelect(file.id)} onClick={(e) => e.stopPropagation()} />
                      <div />
                    </div>
                    {file.file_type === "folder" ? (
                      <Folder style={{ width: 'calc(var(--desktop-icon-size) * 0.9)', height: 'calc(var(--desktop-icon-size) * 0.9)' }} className="text-primary" />
                    ) : (
                      <FileText style={{ width: 'calc(var(--desktop-icon-size) * 0.9)', height: 'calc(var(--desktop-icon-size) * 0.9)' }} className="text-accent" />
                    )}
                    <span className="text-sm text-center truncate w-full">{file.name}</span>
                  </div>
                ));
              })()}
              {files.length === 0 && (
                <p className="col-span-4 text-center text-muted-foreground py-8">
                  This folder is empty
                </p>
              )}
            </div>
          </div>

          {/* File preview */}
          {selectedFile && selectedFile.file_type !== "folder" && (
            <div className="w-80 bg-card/50 border-l border-border p-4 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm truncate">{selectedFile.name}</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => renameItem(selectedFile.id)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => downloadItem(selectedFile)}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteItem(selectedFile.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p>Type: {selectedFile.file_type}</p>
                <p>Location: /{selectedFile.parent_folder}</p>
              </div>
              {selectedFile.content && selectedFile.file_type === "image" && (
                // image preview if stored as base64 or URL
                <img src={selectedFile.content} alt={selectedFile.name} className="w-full rounded mb-3" />
              )}
              {selectedFile.content && selectedFile.file_type !== "image" && (
                <div className="mt-1 p-2 bg-black/50 rounded text-xs font-mono text-primary max-h-64 overflow-auto">
                  {selectedFile.content.substring(0, 1000)}
                </div>
              )}
              <div className="mt-3">
                <h4 className="text-sm font-medium mb-1">Properties</h4>
                <div className="text-xs text-muted-foreground">
                  <p>ID: {selectedFile.id}</p>
                  <p>Created by: {selectedFile.file_type}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => moveToRoot(selectedFile.id)}>
                    <Move className="w-4 h-4 mr-1" /> Move Home
                  </Button>
                  <Button size="sm" onClick={() => { navigator.clipboard?.writeText(selectedFile.name); toast({ title: "Copied" }); }}>
                    <Copy className="w-4 h-4 mr-1" /> Copy Name
                  </Button>
                </div>
              </div>
            </div>
          )}
          {contextMenu && (
            <div
              style={{ left: contextMenu.x, top: contextMenu.y }}
              className="fixed z-50 bg-card border border-border rounded shadow p-2"
              onMouseLeave={() => setContextMenu(null)}
            >
              <button className="block w-full text-left px-2 py-1 hover:bg-primary/10" onClick={() => { renameItem(contextMenu.id); setContextMenu(null); }}>Rename</button>
              <button className="block w-full text-left px-2 py-1 hover:bg-primary/10" onClick={() => { downloadItem(files.find(f => f.id === contextMenu.id)!); setContextMenu(null); }}>Download</button>
              <button className="block w-full text-left px-2 py-1 hover:bg-primary/10" onClick={() => { moveToRoot(contextMenu.id); setContextMenu(null); }}>Move to Home</button>
              <button className="block w-full text-left px-2 py-1 hover:bg-primary/10 text-destructive" onClick={() => { deleteItem(contextMenu.id); setContextMenu(null); }}>Delete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
