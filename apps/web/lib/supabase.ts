import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthUser = {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
    company?: string;
  };
};
