import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === "init") {
      const tablesExist = await checkTablesExist();

      if (tablesExist) {
        return NextResponse.json({ success: true, message: "Tables already exist" });
      }

      // Try to create tables using direct SQL via postgres RPC
      // If this fails, the user needs to run the SQL manually
      const sql = `
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

        CREATE TABLE IF NOT EXISTS note_folders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          parent_id UUID REFERENCES note_folders(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can manage their own notes" ON user_notes;
        CREATE POLICY "Users can manage their own notes" ON user_notes
          FOR ALL USING (auth.uid() = user_id);

        DROP POLICY IF EXISTS "Users can manage their own folders" ON note_folders;
        CREATE POLICY "Users can manage their own folders" ON note_folders
          FOR ALL USING (auth.uid() = user_id);

        CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_notes_module_id ON user_notes(module_id);
        CREATE INDEX IF NOT EXISTS idx_user_notes_updated_at ON user_notes(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_note_folders_user_id ON note_folders(user_id);
      `;

      // Try using sql_execute or direct query - if both fail, return instructions for manual setup
      try {
        // Method 1: Try RPC if available
        const { error: rpcError } = await supabase.rpc("exec_sql", { sql });
        if (!rpcError) {
          return NextResponse.json({ success: true, message: "Tables created successfully" });
        }
        // If RPC failed, try next method
        console.log("RPC method failed, trying direct query...");
      } catch (e) {
        console.log("RPC not available:", e);
      }

      // Method 2: Check if tables were created despite RPC error
      const tablesNow = await checkTablesExist();
      if (tablesNow) {
        return NextResponse.json({ success: true, message: "Tables verified" });
      }

      // If we get here, tables don't exist and RPC didn't work
      // Return detailed instructions for manual setup
      return NextResponse.json({
        success: false,
        error: "Could not create tables automatically",
        sql_required: true,
        instructions: "Please run the following SQL in your Supabase SQL Editor:",
        sql_file: "supabase/notes-tables.sql",
        message: "Go to Supabase Dashboard > SQL Editor and run the SQL from notes-tables.sql file"
      }, { status: 500 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notes init error:", error);
    return NextResponse.json({ error: "Failed to initialize" }, { status: 500 });
  }
}

async function checkTablesExist(): Promise<boolean> {
  try {
    const { error: notesError } = await supabase
      .from("user_notes")
      .select("id")
      .limit(1)
      .single();

    const { error: foldersError } = await supabase
      .from("note_folders")
      .select("id")
      .limit(1)
      .single();

    return !notesError && !foldersError;
  } catch {
    return false;
  }
}