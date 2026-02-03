import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

console.log("Supabase Init - URL present:", !!supabaseUrl);
console.log("Supabase Init - Key present:", !!supabaseAnonKey);

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);

if (!supabase) {
  console.error(
    "Supabase client failed to initialize: Missing environment variables.",
  );
}
