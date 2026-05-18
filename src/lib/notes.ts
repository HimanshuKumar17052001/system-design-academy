import { createClient } from "./supabase/client";

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  folder_id: string | null;
  module_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteFolder {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

const supabase = createClient();

const LOCAL_STORAGE_KEY = "system-design-academy-notes";
const LOCAL_FOLDERS_KEY = "system-design-academy-note-folders";

function getLocalNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function setLocalNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes));
}

function getLocalFolders(): NoteFolder[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(LOCAL_FOLDERS_KEY);
  return data ? JSON.parse(data) : [];
}

function setLocalFolders(folders: NoteFolder[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_FOLDERS_KEY, JSON.stringify(folders));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function getNotes(): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.warn("Using local storage for notes (Supabase unavailable)");
    return getLocalNotes();
  }
}

export async function getNotesByModule(moduleId: string): Promise<Note[]> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("module_id", moduleId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch {
    return getLocalNotes().filter(n => n.module_id === moduleId);
  }
}

export async function getNoteById(id: string): Promise<Note | null> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch {
    const notes = getLocalNotes();
    return notes.find(n => n.id === id) || null;
  }
}

export async function createNote(note: Partial<Note>): Promise<Note | null> {
  const newNote: Note = {
    id: generateId(),
    user_id: note.user_id || "local",
    title: note.title || "Untitled Note",
    content: note.content || "",
    folder_id: note.folder_id || null,
    module_id: note.module_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("user_notes")
      .insert(newNote)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.warn("Using local storage for notes (Supabase unavailable)");
    const notes = getLocalNotes();
    notes.unshift(newNote);
    setLocalNotes(notes);
    return newNote;
  }
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  const updated = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("user_notes")
      .update(updated)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch {
    const notes = getLocalNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = { ...notes[index], ...updated };
      setLocalNotes(notes);
      return notes[index];
    }
    return null;
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("user_notes")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch {
    const notes = getLocalNotes();
    setLocalNotes(notes.filter(n => n.id !== id));
    return true;
  }
}

export async function getFolders(): Promise<NoteFolder[]> {
  try {
    const { data, error } = await supabase
      .from("note_folders")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch {
    return getLocalFolders();
  }
}

export async function createFolder(folder: Partial<NoteFolder>): Promise<NoteFolder | null> {
  const newFolder: NoteFolder = {
    id: generateId(),
    user_id: folder.user_id || "local",
    name: folder.name || "New Folder",
    parent_id: folder.parent_id || null,
    created_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("note_folders")
      .insert(newFolder)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch {
    const folders = getLocalFolders();
    folders.push(newFolder);
    setLocalFolders(folders);
    return newFolder;
  }
}

export async function updateFolder(id: string, updates: Partial<NoteFolder>): Promise<NoteFolder | null> {
  try {
    const { data, error } = await supabase
      .from("note_folders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch {
    const folders = getLocalFolders();
    const index = folders.findIndex(f => f.id === id);
    if (index !== -1) {
      folders[index] = { ...folders[index], ...updates };
      setLocalFolders(folders);
      return folders[index];
    }
    return null;
  }
}

export async function deleteFolder(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("note_folders")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch {
    const folders = getLocalFolders();
    setLocalFolders(folders.filter(f => f.id !== id));
    return true;
  }
}