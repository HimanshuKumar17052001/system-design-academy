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

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes:", error);
    return [];
  }
  return data || [];
}

export async function getNotesByModule(moduleId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("module_id", moduleId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching notes by module:", error);
    return [];
  }
  return data || [];
}

export async function getNoteById(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching note:", error);
    return null;
  }
  return data;
}

export async function createNote(note: Partial<Note>): Promise<Note | null> {
  const { data, error } = await supabase
    .from("user_notes")
    .insert(note)
    .select()
    .single();

  if (error) {
    console.error("Error creating note:", error);
    return null;
  }
  return data;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  const { data, error } = await supabase
    .from("user_notes")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating note:", error);
    return null;
  }
  return data;
}

export async function deleteNote(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("user_notes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting note:", error);
    return false;
  }
  return true;
}

export async function getFolders(): Promise<NoteFolder[]> {
  const { data, error } = await supabase
    .from("note_folders")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching folders:", error);
    return [];
  }
  return data || [];
}

export async function createFolder(folder: Partial<NoteFolder>): Promise<NoteFolder | null> {
  const { data, error } = await supabase
    .from("note_folders")
    .insert(folder)
    .select()
    .single();

  if (error) {
    console.error("Error creating folder:", error);
    return null;
  }
  return data;
}

export async function updateFolder(id: string, updates: Partial<NoteFolder>): Promise<NoteFolder | null> {
  const { data, error } = await supabase
    .from("note_folders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating folder:", error);
    return null;
  }
  return data;
}

export async function deleteFolder(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("note_folders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting folder:", error);
    return false;
  }
  return true;
}