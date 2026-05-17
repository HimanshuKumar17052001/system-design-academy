"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProgress } from "./progress-db";

export async function syncProgressToDBServer(
  userId: string,
  progress: UserProgress
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("user_progress").upsert(
      {
        user_id: userId,
        completed_modules: progress.completedModules,
        module_scores: progress.moduleScores,
        quiz_scores: progress.quizScores,
        lab_completions: progress.labCompletions,
        bookmarks: progress.bookmarks,
        last_visited: progress.lastVisited,
        total_study_time_minutes: progress.totalStudyTimeMinutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      console.error("Failed to sync progress to DB (server):", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error syncing progress (server):", message);
    return { success: false, error: message };
  }
}

export async function fetchProgressFromDBServer(
  userId: string
): Promise<UserProgress | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_progress")
      .select(
        "completed_modules, module_scores, quiz_scores, lab_completions, bookmarks, last_visited, total_study_time_minutes"
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Failed to fetch progress from DB (server):", error);
      return null;
    }

    if (!data) return null;

    return {
      completedModules: data.completed_modules ?? [],
      moduleScores: data.module_scores ?? {},
      quizScores: data.quiz_scores ?? {},
      labCompletions: data.lab_completions ?? {},
      bookmarks: data.bookmarks ?? [],
      lastVisited: data.last_visited ?? "",
      totalStudyTimeMinutes: data.total_study_time_minutes ?? 0,
    };
  } catch (err) {
    console.error(
      "Unexpected error fetching progress (server):",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
