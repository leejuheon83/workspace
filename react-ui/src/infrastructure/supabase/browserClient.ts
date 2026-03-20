import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveSupabaseConfig } from "./resolveSupabaseConfig";

let client: SupabaseClient | null = null;

/** 브라우저용 Supabase 클라이언트(싱글톤). 첫 호출 시 env 가 필요합니다. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!client) {
    const { url, anonKey } = resolveSupabaseConfig(import.meta.env);
    client = createClient(url, anonKey);
  }
  return client;
}
