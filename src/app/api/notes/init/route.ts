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
      // Create user_notes table
      const { error: notesError } = await supabase.from("user_notes").select("*").limit(1);
      
      if (notesError?.code === "42P01") {
        await supabase.rpc('create_notes_table', {});
      }

      // Create note_folders table  
      const { error: foldersError } = await supabase.from("note_folders").select("*").limit(1);
      
      if (foldersError?.code === "42P01") {
        await supabase.rpc('create_folders_table', {});
      }

      return NextResponse.json({ success: true, message: "Tables ready" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notes init error:", error);
    return NextResponse.json({ error: "Failed to initialize" }, { status: 500 });
  }
}