import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              "Content-Type": "application/json",
              Accept: "application/json",
              Prefer: "return=representation",
            },
          });
        },
      },
    }
  );
}