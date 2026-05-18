import { createClient } from "@/lib/supabase/client";

export interface UserProgress {
  completedModules: string[];
  moduleScores: Record<string, number>;
  quizScores: Record<string, number>;
  labCompletions: Record<string, boolean>;
  bookmarks: string[];
  lastVisited: string;
  totalStudyTimeMinutes: number;
}

const TOTAL_MODULES = 50;
const LOCAL_STORAGE_KEY = "sda-progress-unauthenticated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export async function syncProgressToDB(
  userId: string,
  progress: UserProgress
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    console.warn("syncProgressToDB: No userId provided");
    return { success: false, error: "No user ID" };
  }

  try {
    const supabase = createClient();
    console.log("syncProgressToDB: Starting sync for user:", userId);
    console.log("Progress data:", JSON.stringify(progress, null, 2));

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
      console.error("Failed to sync progress to DB:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      // 401/403 means not authenticated - don't save to localStorage in that case
      if (isBrowser() && error.code !== "401" && error.code !== "403") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
      }
      return { success: false, error: error.message };
    }

    console.log("Sync successful!");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Unexpected error syncing progress:", message);
    return { success: false, error: message };
  }
}

export async function fetchProgressFromDB(
  userId: string
): Promise<UserProgress | null> {
  if (!userId) {
    console.warn("fetchProgressFromDB: No userId provided");
    return null;
  }

  try {
    const supabase = createClient();
    console.log("fetchProgressFromDB: Fetching for user:", userId);

    const { data, error } = await supabase
      .from("user_progress")
      .select(
        "completed_modules, module_scores, quiz_scores, lab_completions, bookmarks, last_visited, total_study_time_minutes"
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log("fetchProgressFromDB: No progress found for user");
        return null;
      }
      console.error("Failed to fetch progress from DB:", error);
      return null;
    }

    if (!data) {
      console.log("fetchProgressFromDB: No data returned");
      return null;
    }

    console.log("fetchProgressFromDB: Success! Data:", JSON.stringify(data, null, 2));

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
      "Unexpected error fetching progress:",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}

export function isCourseComplete(userProgress: UserProgress): boolean {
  return userProgress.completedModules.length >= TOTAL_MODULES;
}

export function getLocalStorageProgress(): UserProgress | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProgress;
  } catch {
    return null;
  }
}

export function saveLocalStorageProgress(progress: UserProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
}
