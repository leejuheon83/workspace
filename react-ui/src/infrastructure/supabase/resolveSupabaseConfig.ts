export type SupabaseEnvVars = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

export type ResolvedSupabaseConfig = {
  url: string;
  anonKey: string;
};

export function isSupabaseConfigured(env: SupabaseEnvVars): boolean {
  const url = (env.VITE_SUPABASE_URL ?? "").trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();
  return url.length > 0 && anonKey.length > 0;
}

export function resolveSupabaseConfig(env: SupabaseEnvVars): ResolvedSupabaseConfig {
  const url = (env.VITE_SUPABASE_URL ?? "").trim();
  const anonKey = (env.VITE_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !anonKey) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. react-ui/.env.local 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요. (Supabase 프로젝트: sbsmcworkspace)",
    );
  }

  return { url, anonKey };
}
