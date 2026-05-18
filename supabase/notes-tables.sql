-- Notes tables for System Design Academy

-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  folder_id UUID,
  module_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create note_folders table
CREATE TABLE IF NOT EXISTS note_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_notes
CREATE POLICY "Users can manage their own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for note_folders
CREATE POLICY "Users can manage their own folders" ON note_folders
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_module_id ON user_notes(module_id);
CREATE INDEX idx_user_notes_updated_at ON user_notes(updated_at DESC);
CREATE INDEX idx_note_folders_user_id ON note_folders(user_id);