"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, FolderPlus, Search, FileText, Folder, MoreVertical, Trash2, Edit3, Download, ChevronRight, ChevronDown, Home, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/components/auth/AuthProvider";
import { getNotes, getFolders, createNote, updateNote, deleteNote, createFolder, deleteFolder, type Note, type NoteFolder } from "@/lib/notes";
import { modules } from "@/data/curriculum";
import { cn } from "@/lib/utils";

interface NotesCanvasProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotesCanvas({ open, onOpenChange }: NotesCanvasProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && isAuthenticated) {
      loadNotes();
      loadFolders();
    }
  }, [open, isAuthenticated]);

  useEffect(() => {
    if (selectedNote) {
      setNoteTitle(selectedNote.title);
      setNoteContent(selectedNote.content);
      setIsEditing(true);
    }
  }, [selectedNote]);

  const loadNotes = async () => {
    const data = await getNotes();
    setNotes(data);
  };

  const loadFolders = async () => {
    const data = await getFolders();
    setFolders(data);
  };

  const handleNewNote = async () => {
    if (!user) {
      console.warn("Cannot create note: user not authenticated");
      return;
    }
    try {
      const newNote = await createNote({
        user_id: user.id,
        title: "Untitled Note",
        content: "",
        folder_id: null,
        module_id: null,
      });
      if (newNote) {
        setNotes([newNote, ...notes]);
        setSelectedNote(newNote);
        setNoteTitle(newNote.title);
        setNoteContent(newNote.content);
        setIsEditing(true);
      } else {
        console.error("Failed to create note: no data returned");
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleNewFolder = async () => {
    if (!user) return;
    const name = prompt("Enter folder name:");
    if (!name) return;
    const newFolder = await createFolder({
      user_id: user.id,
      name,
      parent_id: null,
    });
    if (newFolder) {
      setFolders([...folders, newFolder]);
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedNote || !noteTitle.trim()) return;
    setIsSaving(true);
    const updated = await updateNote(selectedNote.id, {
      title: noteTitle,
      content: noteContent,
    });
    if (updated) {
      setNotes(notes.map(n => n.id === updated.id ? updated : n));
      setSelectedNote(updated);
    }
    setIsSaving(false);
  }, [selectedNote, noteTitle, noteContent, notes]);

  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (selectedNote && (noteTitle !== selectedNote.title || noteContent !== selectedNote.content)) {
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteTitle, noteContent]);

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const success = await deleteNote(noteId);
    if (success) {
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setIsEditing(false);
      }
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Delete this folder?")) return;
    const success = await deleteFolder(folderId);
    if (success) {
      setFolders(folders.filter(f => f.id !== folderId));
    }
  };

  const handleNoteClick = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsEditing(true);
  };

  const handleModuleLink = (moduleId: string) => {
    onOpenChange(false);
    router.push(`/module/${moduleId}`);
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const notesByFolder = filteredNotes.reduce((acc, note) => {
    const key = note.folder_id || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const exportToMarkdown = () => {
    const content = `# ${noteTitle}\n\n${noteContent}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${noteTitle.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Backdrop - lighter for studying */}
      {open && (
        <div
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Drawer - slide from right with 50% width for studying */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[50%] min-w-[500px] bg-background/95 backdrop-blur border-l shadow-2xl z-50 transform transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <span className="font-semibold">Notes</span>
            {isSaving && <span className="text-xs text-muted-foreground">Saving...</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleNewNote}>
              <Plus className="size-4 mr-1" />
              New
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNewFolder}>
              <FolderPlus className="size-4 mr-1" />
              Folder
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(100%-65px)]">
          {/* Sidebar */}
          <div className="w-56 border-r p-3 flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8"
              />
            </div>

            <ScrollArea className="flex-1">
              {/* All Notes */}
              <button
                onClick={() => { setSelectedNote(null); setIsEditing(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent",
                  !selectedNote && isEditing === false && "bg-accent"
                )}
              >
                <Home className="size-4" />
                All Notes
              </button>

              {/* Module Sections */}
              <div className="mt-3">
                <div className="text-xs font-medium text-muted-foreground px-2 mb-1">By Module</div>
                {modules.map(module => {
                  const moduleNotes = notes.filter(n => n.module_id === module.id);
                  return (
                    <button
                      key={module.id}
                      onClick={() => setSearchQuery(module.title)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm hover:bg-accent"
                    >
                      <span className="truncate">{module.title}</span>
                      <span className="text-xs text-muted-foreground">{moduleNotes.length}</span>
                    </button>
                  );
                })}
              </div>

              {/* Folders */}
              {folders.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground px-2 mb-1">Folders</div>
                  {folders.map(folder => (
                    <div key={folder.id}>
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent"
                      >
                        {expandedFolders.has(folder.id) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        <Folder className="size-4 text-muted-foreground" />
                        <span className="flex-1 text-left truncate">{folder.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </button>
                      {expandedFolders.has(folder.id) && notesByFolder[folder.id] && (
                        <div className="ml-4">
                          {notesByFolder[folder.id].map(note => (
                            <button
                              key={note.id}
                              onClick={() => handleNoteClick(note)}
                              className={cn(
                                "w-full text-left px-2 py-1 rounded text-sm hover:bg-accent",
                                selectedNote?.id === note.id && "bg-accent"
                              )}
                            >
                              {note.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Uncategorized Notes */}
              {notesByFolder["uncategorized"] && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-muted-foreground px-2 mb-1">Uncategorized</div>
                  {notesByFolder["uncategorized"].map(note => (
                    <button
                      key={note.id}
                      onClick={() => handleNoteClick(note)}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-accent truncate",
                        selectedNote?.id === note.id && "bg-accent"
                      )}
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {isEditing && selectedNote ? (
              <>
                {/* Editor Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("bold")}>
                    <span className="font-bold">B</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("italic")}>
                    <span className="italic">I</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("underline")}>
                    <span className="underline">U</span>
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("formatBlock", false, "h1")}>
                    H1
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("formatBlock", false, "h2")}>
                    H2
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("formatBlock", false, "h3")}>
                    H3
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("insertUnorderedList")}>
                    •
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("insertOrderedList")}>
                    1.
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => document.execCommand("formatBlock", false, "pre")}>
                    {"</>"}
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={() => {
                    const url = prompt("Enter URL:");
                    if (url) document.execCommand("createLink", false, url);
                  }}>
                    Link
                  </Button>
                  <Button variant="ghost" size="sm" onClick={exportToMarkdown}>
                    <Download className="size-4" />
                  </Button>
                  <div className="flex-1" />
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteNote(selectedNote.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Note Title */}
                <div className="p-4 border-b">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full text-xl font-semibold bg-transparent border-none outline-none"
                  />
                </div>

                {/* Note Content */}
                <div className="flex-1 p-4 overflow-auto">
                  <div
                    contentEditable
                    className="min-h-full outline-none prose prose-sm max-w-none"
                    onBlur={(e) => setNoteContent(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: noteContent || "<p>Start writing...</p>" }}
                  />
                </div>

                {/* Module Links */}
                <div className="p-3 border-t bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-2">Link to module (type @ to search):</div>
                  <div className="flex flex-wrap gap-1">
                    {modules.map(m => (
                      <Button
                        key={m.id}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleModuleLink(m.id)}
                      >
                        {m.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FileText className="size-12 mx-auto mb-3 opacity-50" />
                  <p>Select a note or create a new one</p>
                  <Button variant="outline" className="mt-3" onClick={handleNewNote}>
                    <Plus className="size-4 mr-1" />
                    New Note
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

let notesCanvasOpen = false;
const listeners: Set<(open: boolean) => void> = new Set();

export function useNotesCanvas() {
  const [open, setOpen] = useState(notesCanvasOpen);

  useEffect(() => {
    const handleOpen = (newOpen: boolean) => {
      notesCanvasOpen = newOpen;
      setOpen(newOpen);
      listeners.forEach(fn => fn(newOpen));
    };

    listeners.add(handleOpen);
    return () => { listeners.delete(handleOpen); };
  }, []);

  return { open, setOpen: (o: boolean) => { 
    notesCanvasOpen = o; 
    setOpen(o); 
    listeners.forEach(fn => fn(o));
  }};
}