export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          completed_modules: string[];
          module_scores: Json;
          quiz_scores: Json;
          lab_completions: Json;
          bookmarks: string[];
          total_study_time_minutes: number;
          last_visited: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          completed_modules?: string[];
          module_scores?: Json;
          quiz_scores?: Json;
          lab_completions?: Json;
          bookmarks?: string[];
          total_study_time_minutes?: number;
          last_visited?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          completed_modules?: string[];
          module_scores?: Json;
          quiz_scores?: Json;
          lab_completions?: Json;
          bookmarks?: string[];
          total_study_time_minutes?: number;
          last_visited?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          completion_date: string;
          certificate_number: string;
          download_url: string | null;
          emailed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          completion_date?: string;
          certificate_number: string;
          download_url?: string | null;
          emailed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          completion_date?: string;
          certificate_number?: string;
          download_url?: string | null;
          emailed?: boolean;
          created_at?: string;
        };
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type UserProgress = Database["public"]["Tables"]["user_progress"]["Row"];
export type UserProgressInsert = Database["public"]["Tables"]["user_progress"]["Insert"];
export type UserProgressUpdate = Database["public"]["Tables"]["user_progress"]["Update"];

export type Certificate = Database["public"]["Tables"]["certificates"]["Row"];
export type CertificateInsert = Database["public"]["Tables"]["certificates"]["Insert"];
export type CertificateUpdate = Database["public"]["Tables"]["certificates"]["Update"];
